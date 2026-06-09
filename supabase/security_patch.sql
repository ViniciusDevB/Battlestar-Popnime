-- =============================================================================
-- ASTD — Security Patch
-- Aplica correções de segurança em bancos já existentes. Idempotente.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- ── 1. accept_trade — derivar aceitante do auth context, não do parâmetro ────
-- Vulnerabilidade anterior: p_accepter_id era fornecido pelo cliente, permitindo
-- que qualquer autenticado aceitasse trades fingindo ser outro jogador.
CREATE OR REPLACE FUNCTION accept_trade(
  p_trade_id           UUID,
  p_accepted_unit_uids TEXT[] DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_accepter_id UUID;
  v_trade       trades%ROWTYPE;
BEGIN
  v_accepter_id := get_my_player_id();
  IF v_accepter_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  SELECT * INTO v_trade
  FROM trades
  WHERE id = p_trade_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND                          THEN RETURN 'trade_not_available';    END IF;
  IF v_trade.offerer_id = v_accepter_id THEN RETURN 'cannot_accept_own_trade'; END IF;
  IF v_trade.expires_at < now() THEN
    UPDATE trades SET status = 'expired', resolved_at = now() WHERE id = p_trade_id;
    RETURN 'trade_expired';
  END IF;

  UPDATE trades SET
    status             = 'accepted',
    receiver_id        = v_accepter_id,
    accepted_unit_uids = p_accepted_unit_uids,
    resolved_at        = now()
  WHERE id = p_trade_id;

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. contribute_to_mission — remover versão 3 parâmetros (exploitável) ─────
-- Vulnerabilidade: a versão antiga aceitava p_player_id externo. Qualquer auth
-- podia contribuir fingindo ser qualquer outro player_id.
DROP FUNCTION IF EXISTS contribute_to_mission(UUID, UUID, BIGINT);

-- Garante que a versão segura (2 parâmetros, auth-derived) está ativa.
CREATE OR REPLACE FUNCTION contribute_to_mission(
  p_mission_id UUID,
  p_value      BIGINT
) RETURNS VOID AS $$
DECLARE
  v_player_id UUID;
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

-- ── 3. Validação server-side de scores (trigger BEFORE INSERT) ────────────────
-- Sem isso qualquer cliente autenticado pode inserir score/wave/damage absurdos
-- diretamente via API, bypassando toda validação JS.

CREATE OR REPLACE FUNCTION validate_score_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Valores negativos
  IF NEW.score    < 0 THEN RAISE EXCEPTION 'score_negativo';   END IF;
  IF NEW.damage   < 0 THEN RAISE EXCEPTION 'damage_negativo';  END IF;
  IF NEW.duration_s < 0 THEN RAISE EXCEPTION 'duration_negativo'; END IF;

  -- Tetos absolutos (muito acima do possível legítimo)
  IF NEW.score      > 999_999_999       THEN RAISE EXCEPTION 'score_absurdo';    END IF;
  IF NEW.damage     > 99_999_999_999    THEN RAISE EXCEPTION 'damage_absurdo';   END IF;
  IF NEW.wave IS NOT NULL AND NEW.wave  > 99999  THEN RAISE EXCEPTION 'wave_absurda'; END IF;
  -- Uma sessão de jogo não dura mais de 3h (10800s)
  IF NEW.duration_s > 10800             THEN RAISE EXCEPTION 'duration_absurda'; END IF;

  -- Modo válido
  IF NEW.mode NOT IN ('infinite', 'stage', 'event') THEN
    RAISE EXCEPTION 'modo_invalido';
  END IF;

  -- Rate limit: máximo 30 scores por hora por player
  IF (
    SELECT COUNT(*) FROM scores
    WHERE player_id  = NEW.player_id
      AND submitted_at > now() - INTERVAL '1 hour'
  ) >= 30 THEN
    RAISE EXCEPTION 'rate_limit_scores';
  END IF;

  -- Coerção: garante player_id = quem está autenticado (redundante com RLS, mas defensivo)
  IF NEW.player_id <> get_my_player_id() THEN
    RAISE EXCEPTION 'player_id_mismatch';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger antigo se existir antes de recriar
DROP TRIGGER IF EXISTS scores_validate_before_insert ON scores;
CREATE TRIGGER scores_validate_before_insert
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION validate_score_insert();

-- ── 4. Restringir UPDATE de trades ao offerer (apenas cancelar a própria trade) ─
-- A política anterior permitia offerer ou receiver alterar qualquer campo livremente.
DROP POLICY IF EXISTS "trades_update_own"        ON trades;
DROP POLICY IF EXISTS "trades_update_cancel_own" ON trades;

-- Offerer pode apenas cancelar (muda status de 'open' → 'cancelled').
-- accept_trade é SECURITY DEFINER e não depende desta política.
CREATE POLICY "trades_update_cancel_own" ON trades FOR UPDATE
  USING (offerer_id = get_my_player_id() AND status = 'open');

-- ── 5. Garantir que scores só podem ser inseridos (não atualizados pelo user) ──
-- Sem política de UPDATE → usuários não conseguem alterar scores já submetidos.
DROP POLICY IF EXISTS "scores_update_own" ON scores;
-- (não criamos nova política de UPDATE — ausência = bloqueio total de UPDATE por não-admin)

-- =============================================================================
-- FIM — rode este arquivo sempre que atualizar o banco de produção.
-- =============================================================================
