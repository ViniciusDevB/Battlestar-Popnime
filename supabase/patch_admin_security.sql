-- =============================================================================
-- patch_admin_security.sql
-- Corrige 4 bugs:
--   1. Admin recebe economia completa (gemas/tickets/cristais) no primeiro acesso
--   2. Conta nova (não-admin) não pode injetar cristais/pity_estrutura/pity_reliquia
--   3. Merge de nexus.blueprints/relicRecipes filtra valores false do cliente
--      (impede que cliente revogue blueprint enviando { forge: false })
-- Deploy: npx supabase db query --linked -f supabase/patch_admin_security.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_progress(p_progress JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id     UUID;
    v_is_admin      BOOLEAN := false;
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

    -- Verifica se o jogador é admin (server-side, não confia no cliente)
    SELECT is_admin INTO v_is_admin FROM public.players WHERE id = v_player_id;
    v_is_admin := COALESCE(v_is_admin, false);

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;

    -- ── Primeiro acesso: cria o save inicial ─────────────────────────────────
    IF v_save IS NULL THEN
        v_save := p_progress - '_integrityViolations';

        IF v_is_admin THEN
            -- Admin: economia completa para testes desde o início
            v_save := jsonb_set(v_save, '{gemas}',    '999999'::jsonb);
            v_save := jsonb_set(v_save, '{tickets}',  '9999'::jsonb);
            v_save := jsonb_set(v_save, '{cristais}', '999999'::jsonb);
        ELSE
            -- Jogador normal: caps anti-cheat em todos os campos econômicos
            v_save := jsonb_set(v_save, '{gemas}',
                to_jsonb(LEAST(COALESCE((p_progress->>'gemas')::BIGINT, 500), 5000)));
            v_save := jsonb_set(v_save, '{tickets}',
                to_jsonb(LEAST(COALESCE((p_progress->>'tickets')::INT, 0), 20)));
            v_save := jsonb_set(v_save, '{cristais}',       '0'::jsonb);
            v_save := jsonb_set(v_save, '{pity_contador}',
                to_jsonb(LEAST(COALESCE((p_progress->>'pity_contador')::INT, 0), 149)));
            v_save := jsonb_set(v_save, '{pity_estrutura}', '0'::jsonb);
            v_save := jsonb_set(v_save, '{pity_reliquia}',  '0'::jsonb);
        END IF;

        v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
        v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

        INSERT INTO public.saves (player_id, data, updated_at)
        VALUES (v_player_id, v_save, NOW());
        RETURN jsonb_build_object('ok', true, 'save', v_save);
    END IF;

    -- ── Save existente: extrai economia do servidor ───────────────────────────
    v_economy := jsonb_build_object(
        'gemas',           COALESCE(v_save->'gemas',           '0'::jsonb),
        'tickets',         COALESCE(v_save->'tickets',         '0'::jsonb),
        'cristais',        COALESCE(v_save->'cristais',        '0'::jsonb),
        'pity_contador',   COALESCE(v_save->'pity_contador',   '0'::jsonb),
        'pity_estrutura',  COALESCE(v_save->'pity_estrutura',  '0'::jsonb),
        'pity_reliquia',   COALESCE(v_save->'pity_reliquia',   '0'::jsonb),
        'inventario',      COALESCE(v_save->'inventario',      '{"unidades":[],"materiais":[]}'::jsonb)
    );

    v_stripped := p_progress
        - 'gemas' - 'tickets' - 'cristais'
        - 'pity_contador' - 'pity_estrutura' - 'pity_reliquia'
        - 'inventario' - 'nexus' - 'relicStash' - '_integrityViolations';

    -- ── Mescla stats ─────────────────────────────────────────────────────────
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

    -- ── Mescla fases_completas ───────────────────────────────────────────────
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

    -- ── Mescla missoes_completas ─────────────────────────────────────────────
    SELECT COALESCE(
        (SELECT jsonb_agg(m ORDER BY m)
         FROM (
             SELECT jsonb_array_elements_text(COALESCE(v_save->'missoes_completas', '[]')) AS m
             UNION
             SELECT jsonb_array_elements_text(COALESCE(v_stripped->'missoes_completas', '[]')) AS m
         ) t),
        '[]'
    ) INTO v_missions;

    -- ── Mescla nexus.structures ──────────────────────────────────────────────
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

    -- ── Mescla nexus.blueprints e relicRecipes ────────────────────────────────
    -- Usa subquery para filtrar apenas chaves com valor true do cliente,
    -- impedindo que um cliente mal-intencionado revogue blueprints com false.
    SELECT COALESCE(v_save->'nexus'->'blueprints', '{}')
        || COALESCE((
            SELECT jsonb_object_agg(k, true)
            FROM   jsonb_each(COALESCE(p_progress->'nexus'->'blueprints', '{}')) AS t(k, v)
            WHERE  v = 'true'::jsonb
        ), '{}')
    INTO v_blueprints;

    SELECT COALESCE(v_save->'nexus'->'relicRecipes', '{}')
        || COALESCE((
            SELECT jsonb_object_agg(k, true)
            FROM   jsonb_each(COALESCE(p_progress->'nexus'->'relicRecipes', '{}')) AS t(k, v)
            WHERE  v = 'true'::jsonb
        ), '{}')
    INTO v_relic_recipes;

    -- ── Mescla relicStash ────────────────────────────────────────────────────
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
