-- Fix: correções de segurança e performance
-- Execute no SQL Editor do Supabase

-- 1. Remover política RLS morta (inserção feita pelo trigger, não pelo cliente)
DROP POLICY IF EXISTS "players_insert_own" ON players;

-- 2. Corrigir contribute_to_mission: não confia no p_player_id do cliente
--
-- IMPORTANTE: CREATE OR REPLACE não funciona quando a assinatura muda (3→2 params).
-- É necessário DROP explícito da versão antiga ANTES de criar a nova.
DROP FUNCTION IF EXISTS contribute_to_mission(UUID, UUID, BIGINT);

CREATE OR REPLACE FUNCTION contribute_to_mission(
  p_mission_id UUID,
  p_value      BIGINT
) RETURNS VOID AS $$
DECLARE
  v_player_id UUID;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN; END IF;  -- usuário sem perfil, ignora silenciosamente

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

-- 3. Índice composto cobrindo exatamente a ordem do RANK() para evitar full-sorts
DROP INDEX IF EXISTS scores_mode_wave;
CREATE INDEX IF NOT EXISTS scores_rank_idx
  ON scores(mode, wave DESC NULLS LAST, damage DESC)
  WHERE NOT flagged;

-- Índice adicional para a aba de dano puro
CREATE INDEX IF NOT EXISTS scores_dmg_idx
  ON scores(mode, damage DESC)
  WHERE NOT flagged;
