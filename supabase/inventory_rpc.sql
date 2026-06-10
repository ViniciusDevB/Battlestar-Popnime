-- =============================================================================
-- ASTD — fn_update_inventory
--
-- Salva o inventário do cliente no servidor sem tocar em gemas/tickets/pity.
-- Chamado após feed, prestígio, combinação e evolução.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_update_inventory(p_inventory JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  UPDATE public.saves
  SET data = jsonb_set(
        jsonb_set(data, '{inventario}', p_inventory),
        '{_lastSyncAt}', to_jsonb(NOW()::TEXT)
      ),
      updated_at = NOW()
  WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_inventory(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_inventory(JSONB) TO authenticated;
