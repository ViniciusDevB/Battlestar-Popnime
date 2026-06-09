-- =============================================================================
-- ASTD — Setup: Missões Comunitárias
-- Seguro rodar em qualquer estado do banco (idempotente).
-- Execute ANTES do community_missions_seed.sql.
-- =============================================================================

-- ── 1. Tabela community_missions ─────────────────────────────────────────────
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

-- ── 2. Tabela community_contributions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id     UUID REFERENCES community_missions(id) ON DELETE CASCADE,
  player_id      UUID REFERENCES players(id) ON DELETE CASCADE,
  value          BIGINT NOT NULL,
  claimed_at     TIMESTAMPTZ DEFAULT NULL,
  contributed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, player_id)
);

-- Coluna claimed_at pode já existir em bancos que rodaram migrate_trades_v2.sql
ALTER TABLE community_contributions
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL;

-- ── 3. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE community_missions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_contributions ENABLE ROW LEVEL SECURITY;

-- Garante get_my_player_id existe (criada pelo schema.sql / fix_player_trigger.sql)
CREATE OR REPLACE FUNCTION get_my_player_id()
RETURNS UUID AS $$
  SELECT id FROM players WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas — DROP IF EXISTS para evitar erro se já existirem
DROP POLICY IF EXISTS "missions_read_all"  ON community_missions;
DROP POLICY IF EXISTS "contrib_own_all"    ON community_contributions;

CREATE POLICY "missions_read_all" ON community_missions
  FOR SELECT USING (true);

CREATE POLICY "contrib_own_all" ON community_contributions
  FOR ALL
  USING     (player_id = get_my_player_id())
  WITH CHECK (player_id = get_my_player_id());

-- ── 4. Função: contribuir para missão (versão segura — 2 parâmetros) ──────────
-- Remove versão antiga de 3 parâmetros se existir
DROP FUNCTION IF EXISTS contribute_to_mission(UUID, UUID, BIGINT);

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

-- ── 5. Função: resgatar recompensa da missão ──────────────────────────────────
CREATE OR REPLACE FUNCTION claim_mission_reward(p_mission_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_player_id UUID;
  v_mission   community_missions%ROWTYPE;
  v_contrib   community_contributions%ROWTYPE;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  SELECT * INTO v_mission FROM community_missions WHERE id = p_mission_id;
  IF NOT FOUND               THEN RETURN 'mission_not_found';     END IF;
  IF NOT v_mission.completed THEN RETURN 'mission_not_completed'; END IF;

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

-- ── 6. Índice único por título (garante que o seed seja idempotente) ─────────
-- Remove duplicatas mantendo apenas a linha com current_value mais alto (mais atualizada)
DELETE FROM community_missions a
USING community_missions b
WHERE a.title = b.title
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS community_missions_title_uidx
  ON community_missions(title);

-- ── 7. Habilitar Realtime (opcional — fazer no Dashboard se preferir) ──────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_missions;

-- =============================================================================
-- FIM — rode community_missions_seed.sql em seguida
-- =============================================================================
