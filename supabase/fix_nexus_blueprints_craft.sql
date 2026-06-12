-- =============================================================================
-- fix_nexus_blueprints_craft.sql
-- Corrige 3 bugs críticos:
--   1. fn_update_inventory: preserva nexus.blueprints e nexus.relicRecipes
--   2. fn_sync_progress: idem — evita perda de dados a cada sync
--   3. fn_craft_relic: valida que o jogador possui a receita antes de craftar
-- =============================================================================

-- ── 1. fn_update_inventory ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_update_inventory(
    p_inventory     JSONB,
    p_relic_stash   JSONB DEFAULT NULL,
    p_nexus_structs JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id     UUID;
    v_save          JSONB;
    v_nexus_merged  JSONB;
    v_blueprints    JSONB;
    v_relic_recipes JSONB;
    k               TEXT;
BEGIN
    v_player_id := public.get_my_player_id();
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id;
    IF v_save IS NULL THEN
        RETURN jsonb_build_object('error', 'save_not_found');
    END IF;

    v_save := jsonb_set(v_save, '{inventario}', p_inventory);

    IF p_relic_stash IS NOT NULL THEN
        v_save := jsonb_set(v_save, '{relicStash}', p_relic_stash);
    END IF;

    IF p_nexus_structs IS NOT NULL THEN
        SELECT COALESCE(jsonb_object_agg(k,
            to_jsonb(GREATEST(
                COALESCE((v_save->'nexus'->'structures'->>k)::INT, 0),
                COALESCE((p_nexus_structs->>k)::INT, 0)
            ))
        ), '{}')
        INTO v_nexus_merged
        FROM (
            SELECT DISTINCT k FROM (
                SELECT jsonb_object_keys(COALESCE(v_save->'nexus'->'structures', '{}')) AS k
                UNION ALL
                SELECT jsonb_object_keys(p_nexus_structs) AS k
            ) t
        ) keys;

        -- Preserva blueprints e relicRecipes — não sobrescreve com vazio
        v_blueprints    := COALESCE(v_save->'nexus'->'blueprints', '{}');
        v_relic_recipes := COALESCE(v_save->'nexus'->'relicRecipes', '{}');
        v_save := jsonb_set(v_save, '{nexus}',
            jsonb_build_object(
                'structures',   v_nexus_merged,
                'blueprints',   v_blueprints,
                'relicRecipes', v_relic_recipes
            ));
    END IF;

    v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

    UPDATE public.saves
    SET    data       = v_save,
           updated_at = NOW()
    WHERE  player_id  = v_player_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) TO authenticated;


-- ── 2. fn_sync_progress ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_sync_progress(p_progress JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id     UUID;
    v_save          JSONB;
    v_economy       JSONB;
    v_stripped      JSONB;
    v_stats         JSONB;
    v_fases         JSONB;
    v_missions      JSONB;
    v_nexus_merged  JSONB;
    v_blueprints    JSONB;
    v_relic_recipes JSONB;
    v_stash_srv     JSONB;
    v_stash_cli     JSONB;
    v_relic_stash   JSONB;
BEGIN
    v_player_id := public.get_my_player_id();
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;

    -- ── Primeiro acesso: cria o save inicial ─────────────────────────────────
    IF v_save IS NULL THEN
        v_save := p_progress - '_integrityViolations';
        v_save := jsonb_set(v_save, '{gemas}',
            to_jsonb(LEAST(COALESCE((p_progress->>'gemas')::BIGINT, 500), 5000)));
        v_save := jsonb_set(v_save, '{tickets}',
            to_jsonb(LEAST(COALESCE((p_progress->>'tickets')::INT, 0), 20)));
        v_save := jsonb_set(v_save, '{pity_contador}',
            to_jsonb(LEAST(COALESCE((p_progress->>'pity_contador')::INT, 0), 149)));
        v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
        v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

        INSERT INTO public.saves (player_id, data, updated_at)
        VALUES (v_player_id, v_save, NOW());
        RETURN jsonb_build_object('ok', true, 'save', v_save);
    END IF;

    -- ── Save existente: extrai economia do servidor ───────────────────────────
    -- Todos os campos econômicos e de pity são server-autoritativos.
    v_economy := jsonb_build_object(
        'gemas',           COALESCE(v_save->'gemas',           '0'::jsonb),
        'tickets',         COALESCE(v_save->'tickets',         '0'::jsonb),
        'cristais',        COALESCE(v_save->'cristais',        '0'::jsonb),
        'pity_contador',   COALESCE(v_save->'pity_contador',   '0'::jsonb),
        'pity_estrutura',  COALESCE(v_save->'pity_estrutura',  '0'::jsonb),
        'pity_reliquia',   COALESCE(v_save->'pity_reliquia',   '0'::jsonb),
        'inventario',      COALESCE(v_save->'inventario',      '{"unidades":[],"materiais":[]}'::jsonb)
    );

    -- Remove campos com merge especializado
    v_stripped := p_progress
        - 'gemas'
        - 'tickets'
        - 'cristais'
        - 'pity_contador'
        - 'pity_estrutura'
        - 'pity_reliquia'
        - 'inventario'
        - 'nexus'
        - 'relicStash'
        - '_integrityViolations';

    -- ── Mescla stats: máximo de cada campo ───────────────────────────────────
    SELECT COALESCE(jsonb_object_agg(k, GREATEST(
        COALESCE((v_save->'stats'->>k)::NUMERIC, 0),
        COALESCE((v_stripped->'stats'->>k)::NUMERIC, 0)
    )), '{}')
    INTO v_stats
    FROM (
        SELECT DISTINCT k FROM (
            SELECT jsonb_object_keys(COALESCE(v_save->'stats', '{}')) AS k
            UNION ALL
            SELECT jsonb_object_keys(COALESCE(v_stripped->'stats', '{}')) AS k
        ) t
    ) keys;

    -- ── Mescla fases_completas: union profunda ───────────────────────────────
    SELECT COALESCE(jsonb_object_agg(
        k,
        COALESCE(v_save->'fases_completas'->k, '{}') ||
        COALESCE(v_stripped->'fases_completas'->k, '{}')
    ), '{}')
    INTO v_fases
    FROM (
        SELECT DISTINCT k FROM (
            SELECT jsonb_object_keys(COALESCE(v_save->'fases_completas', '{}')) AS k
            UNION ALL
            SELECT jsonb_object_keys(COALESCE(v_stripped->'fases_completas', '{}')) AS k
        ) t
    ) keys;

    -- ── Mescla missoes_completas: union de arrays ─────────────────────────────
    SELECT COALESCE(
        (SELECT jsonb_agg(m ORDER BY m)
         FROM (
             SELECT jsonb_array_elements_text(COALESCE(v_save->'missoes_completas', '[]')) AS m
             UNION
             SELECT jsonb_array_elements_text(COALESCE(v_stripped->'missoes_completas', '[]')) AS m
         ) t),
        '[]'
    ) INTO v_missions;

    -- ── Mescla nexus.structures: toma máximo por chave ───────────────────────
    SELECT COALESCE(jsonb_object_agg(k,
        to_jsonb(GREATEST(
            COALESCE((v_save->'nexus'->'structures'->>k)::INT, 0),
            COALESCE((p_progress->'nexus'->'structures'->>k)::INT, 0)
        ))
    ), '{}')
    INTO v_nexus_merged
    FROM (
        SELECT DISTINCT k FROM (
            SELECT jsonb_object_keys(COALESCE(v_save->'nexus'->'structures', '{}')) AS k
            UNION ALL
            SELECT jsonb_object_keys(COALESCE(p_progress->'nexus'->'structures', '{}')) AS k
        ) t
    ) keys;

    -- ── Mescla nexus.blueprints e relicRecipes: union ─────────────────────────
    -- Servidor é autoritativo; adições offline do cliente também são preservadas.
    v_blueprints    := COALESCE(v_save->'nexus'->'blueprints', '{}')
                    || COALESCE(p_progress->'nexus'->'blueprints', '{}');
    v_relic_recipes := COALESCE(v_save->'nexus'->'relicRecipes', '{}')
                    || COALESCE(p_progress->'nexus'->'relicRecipes', '{}');

    -- ── Mescla relicStash: lista com mais itens vence ─────────────────────────
    v_stash_srv := COALESCE(v_save->'relicStash', '[]'::jsonb);
    v_stash_cli := COALESCE(p_progress->'relicStash', '[]'::jsonb);
    v_relic_stash := CASE
        WHEN jsonb_array_length(v_stash_cli) >= jsonb_array_length(v_stash_srv)
        THEN v_stash_cli
        ELSE v_stash_srv
    END;

    -- ── Monta save final ──────────────────────────────────────────────────────
    v_save := v_save
        || v_stripped
        || v_economy
        || jsonb_build_object(
               'stats',             v_stats,
               'fases_completas',   v_fases,
               'missoes_completas', v_missions,
               'nexus',             jsonb_build_object(
                                        'structures',   v_nexus_merged,
                                        'blueprints',   v_blueprints,
                                        'relicRecipes', v_relic_recipes
                                    ),
               'relicStash',        v_relic_stash,
               '_cloudLinked',      true,
               '_lastSyncAt',       NOW()::TEXT
           );

    v_save := v_save - '_integrityViolations';

    UPDATE public.saves
    SET    data       = v_save,
           updated_at = NOW()
    WHERE  player_id  = v_player_id;

    RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_sync_progress(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_sync_progress(JSONB) TO authenticated;


-- ── 3. fn_craft_relic ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_craft_relic(
  p_relic_id  TEXT,
  p_materials JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id    UUID;
  v_save         JSONB;
  v_materiais    JSONB;
  v_stash        JSONB;
  v_mat          JSONB;
  v_mat_id       TEXT;
  v_mat_qty      INT;
  v_have         INT;
  v_forge_level  INT;
  v_corrupt_pct  FLOAT;
  v_rare_bonus   FLOAT;
  v_is_corrupted BOOL;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  v_forge_level := COALESCE((v_save->'nexus'->'structures'->>'forge')::INT, 0);
  IF v_forge_level = 0 THEN
    RETURN jsonb_build_object('error', 'forge_locked');
  END IF;

  -- Verifica que o jogador desbloqueou a receita da relíquia via gacha
  IF NOT COALESCE((v_save->'nexus'->'relicRecipes'->>p_relic_id)::BOOLEAN, false) THEN
    RETURN jsonb_build_object('error', 'recipe_not_found');
  END IF;

  v_materiais := COALESCE(v_save->'inventario'->'materiais', '[]'::JSONB);

  FOR v_mat IN SELECT value FROM jsonb_array_elements(p_materials) LOOP
    v_mat_id  := v_mat->>'id';
    v_mat_qty := (v_mat->>'qty')::INT;

    SELECT COALESCE((elem->>'quantidade')::INT, 0)
    INTO   v_have
    FROM   jsonb_array_elements(v_materiais) AS elem
    WHERE  elem->>'id' = v_mat_id
    LIMIT  1;

    IF COALESCE(v_have, 0) < v_mat_qty THEN
      RETURN jsonb_build_object('error', 'insufficient_materials', 'material', v_mat_id);
    END IF;
  END LOOP;

  FOR v_mat IN SELECT value FROM jsonb_array_elements(p_materials) LOOP
    v_mat_id  := v_mat->>'id';
    v_mat_qty := (v_mat->>'qty')::INT;

    SELECT jsonb_agg(upd)
    INTO   v_materiais
    FROM (
      SELECT
        CASE
          WHEN elem->>'id' = v_mat_id AND ((elem->>'quantidade')::INT - v_mat_qty) <= 0 THEN NULL
          WHEN elem->>'id' = v_mat_id
            THEN jsonb_set(elem, '{quantidade}', to_jsonb((elem->>'quantidade')::INT - v_mat_qty))
          ELSE elem
        END AS upd
      FROM jsonb_array_elements(v_materiais) AS elem
    ) t
    WHERE upd IS NOT NULL;

    v_materiais := COALESCE(v_materiais, '[]'::JSONB);
  END LOOP;

  v_save := jsonb_set(v_save, '{inventario,materiais}', v_materiais);

  v_corrupt_pct := CASE p_relic_id
    WHEN 'relic_hogyoku' THEN 0.15
    ELSE 0.015
  END;

  v_rare_bonus   := CASE WHEN v_forge_level >= 3 THEN 0.05 ELSE 0.0 END;
  v_corrupt_pct  := GREATEST(0.005, v_corrupt_pct - v_rare_bonus);
  v_is_corrupted := random() < v_corrupt_pct;

  v_stash := COALESCE(v_save->'relicStash', '[]'::JSONB)
          || jsonb_build_array(jsonb_build_object('id', p_relic_id, 'isCorrupted', v_is_corrupted));
  v_save  := jsonb_set(v_save, '{relicStash}', v_stash);
  v_save  := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save, 'isCorrupted', v_is_corrupted);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_craft_relic(TEXT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_craft_relic(TEXT, JSONB) TO authenticated;
