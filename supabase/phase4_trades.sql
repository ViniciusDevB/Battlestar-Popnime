-- Fase 4: Sistema de Trocas — múltiplas unidades por oferta
-- Execute no SQL Editor do Supabase (substitui a versão anterior)

-- ── Schema: migrar colunas single → array ─────────────────────────────────
ALTER TABLE trades
  DROP COLUMN IF EXISTS offered_unit_uid,
  DROP COLUMN IF EXISTS offered_unit_id,
  DROP COLUMN IF EXISTS offered_unit_level,
  DROP COLUMN IF EXISTS wanted_unit_id,
  DROP COLUMN IF EXISTS accepted_unit_uid,
  DROP COLUMN IF EXISTS accepted_unit_id;

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS offered_unit_uids  TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offered_unit_ids   TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wanted_unit_ids    TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_unit_uids TEXT[]   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accepted_unit_ids  TEXT[]   DEFAULT NULL;

-- ── Drop versões antigas da função ────────────────────────────────────────
DROP FUNCTION IF EXISTS accept_trade(UUID, UUID);
DROP FUNCTION IF EXISTS accept_trade(UUID, TEXT);
DROP FUNCTION IF EXISTS accept_trade(UUID, TEXT[]);

-- ── accept_trade: transferência atômica de múltiplas unidades ─────────────
-- Parâmetros:
--   p_trade_id           : ID da troca a aceitar
--   p_accepted_unit_uids : UIDs das unidades que o aceitante vai dar (NULL se gratuito)
--
-- Segurança: aceitante é derivado de auth.uid() via get_my_player_id() — nunca do cliente.
CREATE OR REPLACE FUNCTION accept_trade(
  p_trade_id           UUID,
  p_accepted_unit_uids TEXT[] DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_accepter_id         UUID;
  v_trade               trades%ROWTYPE;
  v_offerer_units       JSONB;
  v_accepter_units      JSONB;
  v_offered_units_data  JSONB;   -- unidades do ofertante a transferir ao aceitante
  v_accepted_units_data JSONB;   -- unidades do aceitante a transferir ao ofertante
  v_found_count         INT;
  v_accepted_char_ids   TEXT[];
BEGIN
  v_accepter_id := get_my_player_id();
  IF v_accepter_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  -- Lock para prevenir dupla aceitação concorrente
  SELECT * INTO v_trade FROM trades
  WHERE id = p_trade_id AND status = 'open' FOR UPDATE;

  IF NOT FOUND                           THEN RETURN 'trade_not_available';    END IF;
  IF v_trade.offerer_id = v_accepter_id THEN RETURN 'cannot_accept_own_trade'; END IF;
  IF v_trade.expires_at < now() THEN
    UPDATE trades SET status = 'expired', resolved_at = now() WHERE id = p_trade_id;
    RETURN 'trade_expired';
  END IF;

  -- ── Valida unidades do ofertante ──────────────────────────────────────
  SELECT data->'inventario'->'unidades' INTO v_offerer_units
  FROM saves WHERE player_id = v_trade.offerer_id;
  IF v_offerer_units IS NULL THEN RETURN 'offerer_save_not_found'; END IF;

  SELECT jsonb_agg(elem - 'in_trade') INTO v_offered_units_data
  FROM jsonb_array_elements(v_offerer_units) AS elem
  WHERE elem->>'uid' = ANY(v_trade.offered_unit_uids);

  SELECT COUNT(*) INTO v_found_count
  FROM jsonb_array_elements(COALESCE(v_offered_units_data, '[]'::jsonb));

  IF v_found_count != array_length(v_trade.offered_unit_uids, 1) THEN
    RETURN 'offered_units_not_found';
  END IF;

  -- ── Valida unidades do aceitante (se troca bilateral) ──────────────────
  SELECT data->'inventario'->'unidades' INTO v_accepter_units
  FROM saves WHERE player_id = v_accepter_id;
  IF v_accepter_units IS NULL THEN RETURN 'accepter_save_not_found'; END IF;

  IF p_accepted_unit_uids IS NOT NULL AND array_length(p_accepted_unit_uids, 1) > 0 THEN
    SELECT jsonb_agg(elem - 'in_trade') INTO v_accepted_units_data
    FROM jsonb_array_elements(v_accepter_units) AS elem
    WHERE elem->>'uid' = ANY(p_accepted_unit_uids);

    SELECT COUNT(*) INTO v_found_count
    FROM jsonb_array_elements(COALESCE(v_accepted_units_data, '[]'::jsonb));

    IF v_found_count != array_length(p_accepted_unit_uids, 1) THEN
      RETURN 'accepted_units_not_found';
    END IF;

    -- Se wanted_unit_ids foi especificado, verifica que os charIds batem
    IF v_trade.wanted_unit_ids IS NOT NULL AND array_length(v_trade.wanted_unit_ids, 1) > 0 THEN
      SELECT array_agg(elem->>'id' ORDER BY elem->>'id') INTO v_accepted_char_ids
      FROM jsonb_array_elements(v_accepted_units_data) AS elem;

      IF v_accepted_char_ids IS DISTINCT FROM
         (SELECT array_agg(x ORDER BY x) FROM unnest(v_trade.wanted_unit_ids) x) THEN
        RETURN 'wrong_unit_types';
      END IF;
    END IF;
  END IF;

  -- ── Transferência atômica ─────────────────────────────────────────────
  -- Ofertante: remove as unidades oferecidas, recebe as aceitas
  UPDATE saves SET
    data = jsonb_set(
      data,
      '{inventario,unidades}',
      COALESCE(
        (SELECT jsonb_agg(elem)
         FROM jsonb_array_elements(data->'inventario'->'unidades') AS elem
         WHERE NOT (elem->>'uid' = ANY(v_trade.offered_unit_uids))),
        '[]'::jsonb
      ) || COALESCE(v_accepted_units_data, '[]'::jsonb)
    ),
    updated_at = now()
  WHERE player_id = v_trade.offerer_id;

  -- Aceitante: remove as unidades dadas (se bilateral), recebe as oferecidas
  UPDATE saves SET
    data = jsonb_set(
      data,
      '{inventario,unidades}',
      (
        CASE
          WHEN p_accepted_unit_uids IS NOT NULL AND array_length(p_accepted_unit_uids, 1) > 0
          THEN COALESCE(
            (SELECT jsonb_agg(elem)
             FROM jsonb_array_elements(data->'inventario'->'unidades') AS elem
             WHERE NOT (elem->>'uid' = ANY(p_accepted_unit_uids))),
            '[]'::jsonb
          )
          ELSE data->'inventario'->'unidades'
        END
      ) || v_offered_units_data
    ),
    updated_at = now()
  WHERE player_id = v_accepter_id;

  -- Conclui a troca
  UPDATE trades SET
    status             = 'completed',
    receiver_id        = v_accepter_id,
    accepted_unit_uids = p_accepted_unit_uids,
    accepted_unit_ids  = (
      SELECT array_agg(elem->>'id')
      FROM jsonb_array_elements(COALESCE(v_accepted_units_data, '[]'::jsonb)) AS elem
    ),
    resolved_at = now()
  WHERE id = p_trade_id;

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar Realtime para notificações:
-- Supabase Dashboard → Database → Replication → Enable trades
