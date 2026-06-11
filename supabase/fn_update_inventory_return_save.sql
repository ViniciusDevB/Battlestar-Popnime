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
    p_inventory   JSONB,
    p_relic_stash JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id UUID;
    v_save      JSONB;
BEGIN
    v_player_id := public.get_my_player_id();
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
    IF v_save IS NULL THEN
        RETURN jsonb_build_object('error', 'save_not_found');
    END IF;

    v_save := jsonb_set(v_save, '{inventario}', p_inventory);

    IF p_relic_stash IS NOT NULL THEN
        v_save := jsonb_set(v_save, '{relicStash}', p_relic_stash);
    END IF;

    v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

    UPDATE public.saves
    SET    data       = v_save,
           updated_at = NOW()
    WHERE  player_id  = v_player_id;

    RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_inventory(JSONB, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_inventory(JSONB, JSONB) TO authenticated;
