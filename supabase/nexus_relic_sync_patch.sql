-- =============================================================================
-- ASTD — Patch: persiste nexus.structures e relicStash corretamente.
--
-- Problema: fn_update_inventory só salvava inventario.unidades/.materiais.
-- Campos novos (nexus, relicStash) nunca eram gravados no banco, então um
-- simples F5 apagava qualquer melhoria de base ou relíquia criada/equipada.
--
-- Solução em duas partes:
--   1. fn_update_inventory: aceita p_relic_stash e p_nexus_structs opcionais.
--      Quando fornecidos, mescla nexus (max por nível) e substitui relicStash.
--   2. fn_sync_progress: nunca sobrescreve nexus/relicStash com o payload padrão
--      vazio que o cliente envia logo após o carregamento da página.
--      Usa GREATEST(servidor, cliente) para nexus e "lista mais longa" para stash.
--
-- Execute no SQL Editor do Supabase (pode rodar em cima de versões anteriores).
-- =============================================================================


-- ─── 1. fn_update_inventory (atualizada) ─────────────────────────────────────
-- Parâmetros novos são opcionais (DEFAULT NULL) — chamadas antigas continuam
-- funcionando sem alteração.

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
    v_player_id    UUID;
    v_save         JSONB;
    v_nexus_merged JSONB;
    k              TEXT;
BEGIN
    v_player_id := public.get_my_player_id();
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;

    -- Carrega save atual para fazer merge de nexus
    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id;
    IF v_save IS NULL THEN
        RETURN jsonb_build_object('error', 'save_not_found');
    END IF;

    -- Sempre atualiza inventario
    v_save := jsonb_set(v_save, '{inventario}', p_inventory);

    -- relicStash: substitui com o valor do cliente (quando fornecido)
    IF p_relic_stash IS NOT NULL THEN
        v_save := jsonb_set(v_save, '{relicStash}', p_relic_stash);
    END IF;

    -- nexus.structures: mescla tomando o máximo por chave (nunca regride nível)
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

        v_save := jsonb_set(v_save, '{nexus}',
            jsonb_build_object('structures', v_nexus_merged));
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


-- ─── 2. fn_sync_progress (atualizada) ────────────────────────────────────────
-- Protege nexus e relicStash de serem sobrescritos pelo save padrão (vazio)
-- que o cliente envia na primeira chamada após o carregamento da página.

CREATE OR REPLACE FUNCTION public.fn_sync_progress(p_progress JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id    UUID;
    v_save         JSONB;
    v_economy      JSONB;
    v_stripped     JSONB;
    v_stats        JSONB;
    v_fases        JSONB;
    v_missions     JSONB;
    v_nexus_merged JSONB;
    v_stash_srv    JSONB;
    v_stash_cli    JSONB;
    v_relic_stash  JSONB;
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
    v_economy := jsonb_build_object(
        'gemas',         COALESCE(v_save->'gemas',         '0'::jsonb),
        'tickets',       COALESCE(v_save->'tickets',       '0'::jsonb),
        'pity_contador', COALESCE(v_save->'pity_contador', '0'::jsonb),
        'inventario',    COALESCE(v_save->'inventario',    '{"unidades":[],"materiais":[]}'::jsonb)
    );

    -- Remove campos que têm merge especializado (não entram no || genérico)
    v_stripped := p_progress
        - 'gemas'
        - 'tickets'
        - 'pity_contador'
        - 'inventario'
        - 'nexus'           -- mesclado abaixo com lógica de máximo por chave
        - 'relicStash'      -- mesclado abaixo com lógica de lista maior
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
    -- Protege contra o cliente enviar um nexus vazio ao carregar a página.
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

    -- ── Mescla relicStash: lista com mais itens vence ─────────────────────────
    -- Na carga inicial, o cliente envia [] (padrão) — o servidor sempre preserva.
    -- Quando o cliente envia mais itens (recém criados), ele vence.
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
               'nexus',             jsonb_build_object('structures', v_nexus_merged),
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

-- =============================================================================
-- FIM. Cole e execute tudo de uma vez no SQL Editor do Supabase.
-- =============================================================================
