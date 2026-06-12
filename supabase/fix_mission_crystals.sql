-- fix_mission_crystals.sql
-- Adiciona suporte a cristais nas recompensas de missões (server-side).
-- A coluna faltava na tabela mission_rewards e fn_claim_reward não concedia cristais.

-- ── 1. Adiciona coluna crystals à tabela ──────────────────────────────────────
ALTER TABLE public.mission_rewards
  ADD COLUMN IF NOT EXISTS crystals INT NOT NULL DEFAULT 0;

-- ── 2. Atualiza recompensas existentes com os cristais corretos ───────────────
-- (espelha exatamente os valores em data/missions_data.js)
UPDATE public.mission_rewards SET crystals = 150 WHERE mission_id IN ('stage_all','stage_op','stage_bleach','stage_marvel','stage_dc');
UPDATE public.mission_rewards SET crystals = 500 WHERE mission_id = 'stage_all_worlds';
UPDATE public.mission_rewards SET crystals = 50  WHERE mission_id = 'inf_wave5';
UPDATE public.mission_rewards SET crystals = 100 WHERE mission_id = 'inf_wave10';
UPDATE public.mission_rewards SET crystals = 200 WHERE mission_id = 'inf_wave25';
UPDATE public.mission_rewards SET crystals = 400 WHERE mission_id = 'inf_wave50';
UPDATE public.mission_rewards SET crystals = 80  WHERE mission_id = 'inf_total50';
UPDATE public.mission_rewards SET crystals = 200 WHERE mission_id = 'inf_total200';

-- ── 3. Recria fn_claim_reward concedendo cristais ─────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_claim_reward(
  p_mission_id TEXT,
  p_date       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id    UUID;
  v_save         JSONB;
  v_reward_gems  INT := 0;
  v_reward_tix   INT := 0;
  v_reward_xtal  INT := 0;
  v_is_daily     BOOLEAN;
  v_is_claimed   BOOLEAN;
  v_daily_arr    JSONB;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error','unauthorized'); END IF;

  SELECT gems, tickets, crystals INTO v_reward_gems, v_reward_tix, v_reward_xtal
  FROM public.mission_rewards WHERE mission_id = p_mission_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unknown_mission'); END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error','save_not_found'); END IF;

  v_is_daily := (p_date IS NOT NULL);

  IF v_is_daily THEN
    IF p_date NOT IN (
      TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'),
      TO_CHAR((NOW() - INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    ) THEN
      RETURN jsonb_build_object('error','wrong_date');
    END IF;
    v_daily_arr := COALESCE(v_save->'missoes_diarias'->'completas', '[]');
    SELECT EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(v_daily_arr) m WHERE m = p_mission_id
    ) INTO v_is_claimed;
    IF v_is_claimed THEN RETURN jsonb_build_object('error','already_claimed'); END IF;
    v_save := jsonb_set(v_save, '{missoes_diarias,completas}',
      v_daily_arr || to_jsonb(p_mission_id));
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_save->'missoes_completas','[]')) m
      WHERE m = p_mission_id
    ) INTO v_is_claimed;
    IF v_is_claimed THEN RETURN jsonb_build_object('error','already_claimed'); END IF;
    v_save := jsonb_set(v_save, '{missoes_completas}',
      COALESCE(v_save->'missoes_completas','[]') || to_jsonb(p_mission_id));
  END IF;

  IF v_reward_gems > 0 THEN
    v_save := jsonb_set(v_save, '{gemas}',
      to_jsonb(COALESCE((v_save->>'gemas')::BIGINT, 0) + v_reward_gems));
  END IF;
  IF v_reward_tix > 0 THEN
    v_save := jsonb_set(v_save, '{tickets}',
      to_jsonb(COALESCE((v_save->>'tickets')::INT, 0) + v_reward_tix));
  END IF;
  IF v_reward_xtal > 0 THEN
    v_save := jsonb_set(v_save, '{cristais}',
      to_jsonb(COALESCE((v_save->>'cristais')::BIGINT, 0) + v_reward_xtal));
  END IF;

  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_claim_reward(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_claim_reward(TEXT, TEXT) TO authenticated;
