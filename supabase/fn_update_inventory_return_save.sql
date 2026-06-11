-- =============================================================================
-- ASTD — Patch: fn_update_inventory passa a retornar o save completo.
--
-- Antes: retornava apenas { ok: true }.
-- Agora: retorna { ok: true, save: {...} } para que o cliente possa aplicar
--        o estado canônico do servidor diretamente, eliminando a necessidade
--        de manter lógica de merge no cliente.
--
-- Execute no SQL Editor do Supabase (substitui a versão do nexus_relic_sync_patch).
-- =============================================================================

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

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
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

    -- Retorna o save completo para o cliente aplicar diretamente
    RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) TO authenticated;
