-- =============================================================================
-- ASTD Update 2.5 — Schema Supabase
-- Execute este arquivo no SQL Editor do Supabase (mlywqfwrhbuwpxbzpsoq)
-- =============================================================================

-- ── Extensões ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELAS
-- =============================================================================

-- ── players ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 20),
  avatar_unit TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_seen   TIMESTAMPTZ DEFAULT now()
);

-- ── saves ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saves (
  player_id  UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}',
  version    INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── scores ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mode         TEXT NOT NULL,
  stage_id     TEXT DEFAULT NULL,
  difficulty   TEXT DEFAULT NULL,
  score        BIGINT NOT NULL DEFAULT 0,
  wave         INTEGER DEFAULT NULL,
  damage       BIGINT DEFAULT 0,
  duration_s   INTEGER DEFAULT 0,
  units_used   TEXT[] DEFAULT '{}',
  flagged      BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scores_mode_score     ON scores(mode, score DESC) WHERE NOT flagged;
CREATE INDEX IF NOT EXISTS scores_mode_wave       ON scores(mode, wave  DESC) WHERE NOT flagged;
CREATE INDEX IF NOT EXISTS scores_stage_diff      ON scores(stage_id, difficulty, score DESC) WHERE NOT flagged;
CREATE INDEX IF NOT EXISTS scores_player          ON scores(player_id);

-- ── leaderboard_snapshots ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  DATE NOT NULL,
  mode        TEXT NOT NULL,
  stage_id    TEXT DEFAULT NULL,
  difficulty  TEXT DEFAULT NULL,
  rank        INTEGER NOT NULL,
  player_id   UUID NOT NULL REFERENCES players(id),
  score       BIGINT NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

-- ── trades ────────────────────────────────────────────────────────────────────
-- Schema v2 (migrate_trades_v2.sql): colunas singulares substituídas por arrays.
CREATE TABLE IF NOT EXISTS trades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offerer_id          UUID NOT NULL REFERENCES players(id),
  receiver_id         UUID DEFAULT NULL REFERENCES players(id),
  offered_unit_uids   TEXT[]  NOT NULL DEFAULT '{}',
  offered_unit_ids    TEXT[]  NOT NULL DEFAULT '{}',
  wanted_unit_ids     TEXT[]  DEFAULT '{}',
  accepted_unit_uids  TEXT[]  DEFAULT NULL,
  accepted_unit_ids   TEXT[]  DEFAULT NULL,
  status              TEXT DEFAULT 'open'
                        CHECK (status IN ('open','completed','accepted','declined','cancelled','expired')),
  message             TEXT CHECK (length(message) <= 120),
  created_at          TIMESTAMPTZ DEFAULT now(),
  expires_at          TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  resolved_at         TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS trades_open     ON trades(status, created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS trades_receiver ON trades(receiver_id, status);
CREATE INDEX IF NOT EXISTS trades_offerer  ON trades(offerer_id, status);

-- ── community_missions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  goal_type     TEXT NOT NULL,
  goal_value    BIGINT NOT NULL,
  current_value BIGINT DEFAULT 0,
  reward_gems   INTEGER DEFAULT 0,
  reward_units  TEXT[] DEFAULT '{}',
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  completed     BOOLEAN DEFAULT false
);

-- ── community_contributions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id     UUID REFERENCES community_missions(id) ON DELETE CASCADE,
  player_id      UUID REFERENCES players(id) ON DELETE CASCADE,
  value          BIGINT NOT NULL,
  claimed_at     TIMESTAMPTZ DEFAULT NULL,
  contributed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, player_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE players              ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves                ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades               ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_missions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_contributions ENABLE ROW LEVEL SECURITY;

-- ── Função auxiliar: retorna o players.id do usuário autenticado ──────────────
CREATE OR REPLACE FUNCTION get_my_player_id()
RETURNS UUID AS $$
  SELECT id FROM players WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── players ───────────────────────────────────────────────────────────────────
CREATE POLICY "players_read_all"  ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_own" ON players FOR INSERT
  WITH CHECK (auth_id = auth.uid());
CREATE POLICY "players_update_own" ON players FOR UPDATE
  USING (auth_id = auth.uid());

-- ── saves ─────────────────────────────────────────────────────────────────────
CREATE POLICY "saves_own_all" ON saves
  FOR ALL USING (player_id = get_my_player_id())
  WITH CHECK (player_id = get_my_player_id());

-- ── scores ────────────────────────────────────────────────────────────────────
CREATE POLICY "scores_read_public" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_own"  ON scores FOR INSERT
  WITH CHECK (player_id = get_my_player_id());

-- ── leaderboard_snapshots ─────────────────────────────────────────────────────
CREATE POLICY "snapshots_read_all" ON leaderboard_snapshots FOR SELECT USING (true);

-- ── trades ────────────────────────────────────────────────────────────────────
CREATE POLICY "trades_read_open"  ON trades FOR SELECT USING (
  status = 'open' OR offerer_id = get_my_player_id() OR receiver_id = get_my_player_id()
);
CREATE POLICY "trades_insert_own" ON trades FOR INSERT
  WITH CHECK (offerer_id = get_my_player_id());
-- Apenas o offerer pode cancelar (status open→cancelled). accept_trade é SECURITY DEFINER.
CREATE POLICY "trades_update_cancel_own" ON trades FOR UPDATE
  USING (offerer_id = get_my_player_id() AND status = 'open');

-- ── community_missions ────────────────────────────────────────────────────────
CREATE POLICY "missions_read_all" ON community_missions FOR SELECT USING (true);

-- ── community_contributions ───────────────────────────────────────────────────
CREATE POLICY "contrib_own_all" ON community_contributions
  FOR ALL USING (player_id = get_my_player_id())
  WITH CHECK (player_id = get_my_player_id());

-- =============================================================================
-- FUNÇÕES POSTGRESQL
-- =============================================================================

-- ── Ranking do jogador por mode ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_player_rank(p_player_id UUID, p_mode TEXT)
RETURNS TABLE(rank BIGINT, total BIGINT, score BIGINT, wave INTEGER) AS $$
  WITH best AS (
    SELECT
      player_id,
      MAX(wave)   AS best_wave,
      MAX(damage) AS best_dmg
    FROM scores
    WHERE mode = p_mode AND NOT flagged
    GROUP BY player_id
  ),
  ranked AS (
    SELECT
      player_id,
      best_wave,
      RANK() OVER (ORDER BY best_wave DESC NULLS LAST, best_dmg DESC) AS rnk,
      COUNT(*) OVER () AS total
    FROM best
  )
  SELECT rnk, total, best_wave::BIGINT, best_wave
  FROM ranked
  WHERE player_id = p_player_id;
$$ LANGUAGE sql STABLE;

-- ── Aceitar trade (atômica, sem race condition) ───────────────────────────────
-- Aceitante derivado do auth context — nunca fornecido pelo cliente.
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

  IF NOT FOUND                          THEN RETURN 'trade_not_available';     END IF;
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

-- ── Contribuição para missão comunitária ──────────────────────────────────────
-- player_id derivado do auth context — nunca fornecido pelo cliente.
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

-- ── Validação server-side de scores ──────────────────────────────────────────
-- Bloqueia inserções com valores absurdos mesmo que o cliente bypasse o JS.
CREATE OR REPLACE FUNCTION validate_score_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score    < 0 OR NEW.score    > 999_999_999    THEN RAISE EXCEPTION 'score_invalido';    END IF;
  IF NEW.damage   < 0 OR NEW.damage   > 99_999_999_999 THEN RAISE EXCEPTION 'damage_invalido';   END IF;
  IF NEW.duration_s < 0 OR NEW.duration_s > 10800      THEN RAISE EXCEPTION 'duration_invalida'; END IF;
  IF NEW.wave IS NOT NULL AND NEW.wave > 99999          THEN RAISE EXCEPTION 'wave_invalida';     END IF;
  IF NEW.mode NOT IN ('infinite', 'stage', 'event')    THEN RAISE EXCEPTION 'modo_invalido';     END IF;
  IF NEW.player_id <> get_my_player_id()               THEN RAISE EXCEPTION 'player_mismatch';   END IF;
  -- Rate limit: 30 scores por hora por player
  IF (SELECT COUNT(*) FROM scores
      WHERE player_id = NEW.player_id
        AND submitted_at > now() - INTERVAL '1 hour') >= 30 THEN
    RAISE EXCEPTION 'rate_limit_scores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS scores_validate_before_insert ON scores;
CREATE TRIGGER scores_validate_before_insert
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION validate_score_insert();

-- ── Expirar trades vencidas (rodar via pg_cron ou Supabase Cron a cada hora) ──
CREATE OR REPLACE FUNCTION expire_old_trades()
RETURNS INTEGER AS $$
DECLARE
  cnt INTEGER;
BEGIN
  UPDATE trades SET status = 'expired', resolved_at = now()
  WHERE status = 'open' AND expires_at < now();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================
-- Após executar, configure no Supabase Dashboard:
--   1. Authentication > Email confirmations: ON
--   2. Authentication > Minimum password length: 8
--   3. Edge Functions: criar validate-score (Fase 3)
--   4. Cron job: SELECT cron.schedule('expire-trades', '0 * * * *', 'SELECT expire_old_trades()');
-- =============================================================================
