-- =============================================================================
-- ASTD Update 2.5 — Migração Trades: schema singular → arrays
-- Execute no SQL Editor do Supabase (seguro rodar mais de uma vez — IF EXISTS)
-- =============================================================================

-- ── 1. Remove colunas do schema antigo (singular) ─────────────────────────────
ALTER TABLE trades
  DROP COLUMN IF EXISTS offered_unit_uid,
  DROP COLUMN IF EXISTS offered_unit_id,
  DROP COLUMN IF EXISTS offered_unit_level,
  DROP COLUMN IF EXISTS wanted_unit_id,
  DROP COLUMN IF EXISTS wanted_unit_min_level,
  DROP COLUMN IF EXISTS accepted_unit_uid,
  DROP COLUMN IF EXISTS accepted_unit_id;

-- ── 2. Adiciona colunas de array (idempotente) ────────────────────────────────
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS offered_unit_uids  TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offered_unit_ids   TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wanted_unit_ids    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_unit_uids TEXT[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accepted_unit_ids  TEXT[]  DEFAULT NULL;

-- ── 3. Corrige CHECK constraint de status (adiciona 'completed') ───────────────
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_status_check
  CHECK (status IN ('open','completed','accepted','declined','cancelled','expired'));

-- ── 4. Remove versões antigas da função accept_trade ─────────────────────────
DROP FUNCTION IF EXISTS accept_trade(UUID, UUID);
DROP FUNCTION IF EXISTS accept_trade(UUID, TEXT);
DROP FUNCTION IF EXISTS accept_trade(UUID, TEXT[]);

-- ── 5. Nova função accept_trade — transferência atômica ───────────────────────
-- Segurança: aceitante derivado de auth.uid() via get_my_player_id().
-- Nunca aceita a própria oferta. Bloqueia race condition com FOR UPDATE.
CREATE OR REPLACE FUNCTION accept_trade(
  p_trade_id           UUID,
  p_accepted_unit_uids TEXT[] DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_accepter_id         UUID;
  v_trade               trades%ROWTYPE;
  v_offerer_units       JSONB;
  v_accepter_units      JSONB;
  v_offered_units_data  JSONB;
  v_accepted_units_data JSONB;
  v_found_count         INT;
  v_accepted_char_ids   TEXT[];
BEGIN
  v_accepter_id := get_my_player_id();
  IF v_accepter_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  SELECT * INTO v_trade FROM trades
  WHERE id = p_trade_id AND status = 'open' FOR UPDATE;

  IF NOT FOUND                           THEN RETURN 'trade_not_available';    END IF;
  IF v_trade.offerer_id = v_accepter_id THEN RETURN 'cannot_accept_own_trade'; END IF;
  IF v_trade.expires_at < now() THEN
    UPDATE trades SET status = 'expired', resolved_at = now() WHERE id = p_trade_id;
    RETURN 'trade_expired';
  END IF;

  -- ── Valida unidades do ofertante ────────────────────────────────────────────
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

  -- ── Valida unidades do aceitante (se troca bilateral) ──────────────────────
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

    IF v_trade.wanted_unit_ids IS NOT NULL AND array_length(v_trade.wanted_unit_ids, 1) > 0 THEN
      SELECT array_agg(elem->>'id' ORDER BY elem->>'id') INTO v_accepted_char_ids
      FROM jsonb_array_elements(v_accepted_units_data) AS elem;

      IF v_accepted_char_ids IS DISTINCT FROM
         (SELECT array_agg(x ORDER BY x) FROM unnest(v_trade.wanted_unit_ids) x) THEN
        RETURN 'wrong_unit_types';
      END IF;
    END IF;
  END IF;

  -- ── Transferência atômica ──────────────────────────────────────────────────
  UPDATE saves SET
    data = jsonb_set(
      data, '{inventario,unidades}',
      COALESCE(
        (SELECT jsonb_agg(elem)
         FROM jsonb_array_elements(data->'inventario'->'unidades') AS elem
         WHERE NOT (elem->>'uid' = ANY(v_trade.offered_unit_uids))),
        '[]'::jsonb
      ) || COALESCE(v_accepted_units_data, '[]'::jsonb)
    ),
    updated_at = now()
  WHERE player_id = v_trade.offerer_id;

  UPDATE saves SET
    data = jsonb_set(
      data, '{inventario,unidades}',
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

-- ── 6. Atualiza índices para os novos campos ──────────────────────────────────
DROP INDEX IF EXISTS trades_open;
CREATE INDEX IF NOT EXISTS trades_open ON trades(status, created_at DESC) WHERE status = 'open';

-- ── 7. Atualiza função contribute_to_mission (remove p_player_id — usa auth) ──
CREATE OR REPLACE FUNCTION contribute_to_mission(
  p_mission_id UUID,
  p_value      BIGINT
) RETURNS VOID AS $$
DECLARE v_player_id UUID;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN; END IF;

  INSERT INTO community_contributions (mission_id, player_id, value)
  VALUES (p_mission_id, v_player_id, p_value)
  ON CONFLICT (mission_id, player_id) DO UPDATE
    SET value = community_contributions.value + p_value;

  UPDATE community_missions
  SET current_value = current_value + p_value
  WHERE id = p_mission_id AND NOT completed;

  UPDATE community_missions
  SET completed = true
  WHERE id = p_mission_id AND current_value >= goal_value AND NOT completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Habilitar Realtime para trades (Dashboard → Database → Replication) ──────
-- ALTER PUBLICATION supabase_realtime ADD TABLE trades;

-- ── 8. Missões Comunitárias: claimed_at e função de resgate ───────────────────
ALTER TABLE community_contributions
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL;

-- Valida contribuição, marca claimed_at e concede gemas no save do jogador.
-- reward_units são tratadas no cliente após retorno 'ok'.
CREATE OR REPLACE FUNCTION claim_mission_reward(p_mission_id UUID) RETURNS TEXT AS $$
DECLARE
  v_player_id UUID;
  v_mission   community_missions%ROWTYPE;
  v_contrib   community_contributions%ROWTYPE;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  SELECT * INTO v_mission FROM community_missions WHERE id = p_mission_id;
  IF NOT FOUND               THEN RETURN 'mission_not_found';      END IF;
  IF NOT v_mission.completed THEN RETURN 'mission_not_completed';  END IF;

  SELECT * INTO v_contrib FROM community_contributions
  WHERE mission_id = p_mission_id AND player_id = v_player_id;
  IF NOT FOUND                        THEN RETURN 'no_contribution'; END IF;
  IF v_contrib.claimed_at IS NOT NULL THEN RETURN 'already_claimed'; END IF;

  UPDATE community_contributions
  SET claimed_at = now()
  WHERE mission_id = p_mission_id AND player_id = v_player_id;

  IF v_mission.reward_gems > 0 THEN
    UPDATE saves
    SET data = jsonb_set(
          data, '{gemas}',
          to_jsonb(COALESCE((data->>'gemas')::bigint, 0) + v_mission.reward_gems)
        ),
        updated_at = now()
    WHERE player_id = v_player_id;
  END IF;

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Habilitar Realtime para community_missions ────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_missions;

-- =============================================================================
-- FIM DA MIGRAÇÃO
-- =============================================================================
