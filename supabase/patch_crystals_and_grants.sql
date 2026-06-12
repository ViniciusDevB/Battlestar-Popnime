-- patch_crystals_and_grants.sql
-- Aplica TODOS os fixes de cristais de uma vez:
-- 1. GRANT nas funções de gacha de cristais (corrige erro de servidor)
-- 2. fn_complete_stage concede cristais (corrige recompensa de fase online)
-- 3. mission_rewards suporta cristais + fn_claim_reward atualizado
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. GRANT nas funções de banner de cristais ────────────────────────────────
REVOKE ALL ON FUNCTION public.fn_structure_banner_pull(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_structure_banner_pull(INT) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_relic_banner_pull(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_relic_banner_pull(INT) TO authenticated;

-- ── 2. fn_complete_stage: adiciona recompensa de cristais ─────────────────────
CREATE OR REPLACE FUNCTION public.fn_complete_stage(
  p_stage_id    TEXT,
  p_difficulty  TEXT,
  p_duration_s  INT,
  p_boss_killed BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id      UUID;
  v_save           JSONB;
  v_cfg            RECORD;
  v_gems           BIGINT;
  v_cristais       BIGINT;
  v_tickets        INT;
  v_units_arr      JSONB;
  v_mats_arr       JSONB;
  v_results        JSONB  := '[]';
  v_first_time     BOOLEAN;
  v_gem_reward     INT;
  v_crystal_reward INT;
  v_pity_key       TEXT;
  v_pity           INT;
  v_uid            TEXT;
  v_rand           FLOAT8;
  v_found          BOOLEAN;
  r                RECORD;
  j                INT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error','unauthorized'); END IF;

  IF p_difficulty NOT IN ('normal','dificil','lendario') THEN
    RETURN jsonb_build_object('error','invalid_difficulty');
  END IF;

  SELECT * INTO v_cfg FROM public.stage_config WHERE stage_id = p_stage_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unknown_stage'); END IF;

  IF p_duration_s < v_cfg.min_duration_s THEN
    RETURN jsonb_build_object('error','duration_too_short');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error','save_not_found'); END IF;

  v_gems       := COALESCE((v_save->>'gemas')::BIGINT, 0);
  v_cristais   := COALESCE((v_save->>'cristais')::BIGINT, 0);
  v_tickets    := COALESCE((v_save->>'tickets')::INT, 0);
  v_units_arr  := COALESCE(v_save->'inventario'->'unidades',  '[]');
  v_mats_arr   := COALESCE(v_save->'inventario'->'materiais', '[]');

  v_first_time := NOT COALESCE(
    (v_save->'fases_completas'->p_stage_id->>p_difficulty)::BOOLEAN,
    false
  );

  v_gem_reward := CASE p_difficulty WHEN 'normal' THEN 50 WHEN 'dificil' THEN 100 ELSE 200 END;
  IF v_first_time                    THEN v_gem_reward := v_gem_reward + 50;  END IF;
  IF v_cfg.is_boss AND p_boss_killed THEN v_gem_reward := v_gem_reward + 30;  END IF;
  IF v_cfg.is_boss AND v_first_time  THEN v_gem_reward := v_gem_reward + 100; END IF;

  v_crystal_reward := CASE p_difficulty WHEN 'normal' THEN 10 WHEN 'dificil' THEN 20 ELSE 40 END;
  IF v_first_time                    THEN v_crystal_reward := v_crystal_reward + 15; END IF;
  IF v_cfg.is_boss AND p_boss_killed THEN v_crystal_reward := v_crystal_reward + 10; END IF;

  v_pity_key := 'pity_' || p_stage_id;
  v_pity     := COALESCE((v_save->'stats'->>v_pity_key)::INT, 0);

  FOR r IN
    SELECT * FROM public.stage_drops
    WHERE stage_id = p_stage_id
    ORDER BY pity_threshold DESC NULLS LAST, chance DESC
  LOOP
    v_rand := random() * 100;

    IF r.pity_threshold IS NOT NULL THEN
      IF v_pity + 1 >= r.pity_threshold THEN
        v_pity := 0;
        v_uid := substr(replace(gen_random_uuid()::text, '-', ''), 1, 13);
        v_results := v_results || jsonb_build_array(jsonb_build_object('id', r.item_id, 'uid', v_uid));
        IF r.is_playable THEN
          v_units_arr := v_units_arr || jsonb_build_array(
            jsonb_build_object('uid', v_uid, 'id', r.item_id, 'nivel', 1, 'xp_atual', 0)
          );
        ELSE
          v_found := false;
          FOR j IN 0..(jsonb_array_length(v_mats_arr) - 1) LOOP
            IF (v_mats_arr->j->>'id') = r.item_id THEN
              v_mats_arr := jsonb_set(v_mats_arr, ARRAY[j::TEXT,'quantidade'],
                to_jsonb(COALESCE((v_mats_arr->j->>'quantidade')::INT,0)+1));
              v_found := true; EXIT;
            END IF;
          END LOOP;
          IF NOT v_found THEN
            v_mats_arr := v_mats_arr || jsonb_build_array(
              jsonb_build_object('id', r.item_id, 'quantidade', 1));
          END IF;
        END IF;
        CONTINUE;
      END IF;
      v_pity := v_pity + 1;
      CONTINUE;
    END IF;

    IF v_rand <= r.chance THEN
      v_uid := substr(replace(gen_random_uuid()::text, '-', ''), 1, 13);
      v_results := v_results || jsonb_build_array(jsonb_build_object('id', r.item_id, 'uid', v_uid));
      IF r.is_playable THEN
        v_units_arr := v_units_arr || jsonb_build_array(
          jsonb_build_object('uid', v_uid, 'id', r.item_id, 'nivel', 1, 'xp_atual', 0)
        );
      ELSE
        v_found := false;
        FOR j IN 0..(jsonb_array_length(v_mats_arr) - 1) LOOP
          IF (v_mats_arr->j->>'id') = r.item_id THEN
            v_mats_arr := jsonb_set(v_mats_arr, ARRAY[j::TEXT,'quantidade'],
              to_jsonb(COALESCE((v_mats_arr->j->>'quantidade')::INT,0)+1));
            v_found := true; EXIT;
          END IF;
        END LOOP;
        IF NOT v_found THEN
          v_mats_arr := v_mats_arr || jsonb_build_array(
            jsonb_build_object('id', r.item_id, 'quantidade', 1));
          END IF;
      END IF;
    END IF;
  END LOOP;

  v_save := jsonb_set(v_save, '{gemas}',    to_jsonb(v_gems    + v_gem_reward));
  v_save := jsonb_set(v_save, '{cristais}', to_jsonb(v_cristais + v_crystal_reward));
  v_save := jsonb_set(v_save, '{inventario,unidades}',  v_units_arr);
  v_save := jsonb_set(v_save, '{inventario,materiais}', v_mats_arr);

  IF v_first_time THEN
    v_save := jsonb_set(v_save,
      ARRAY['fases_completas', p_stage_id, p_difficulty], 'true'::jsonb, true);
    v_save := jsonb_set(v_save, '{stats,fases_completas}',
      to_jsonb(COALESCE((v_save->'stats'->>'fases_completas')::INT, 0) + 1));
  END IF;

  v_save := jsonb_set(v_save, ARRAY['stats', v_pity_key], to_jsonb(v_pity), true);
  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object(
    'ok',               true,
    'gems_granted',     v_gem_reward,
    'crystals_granted', v_crystal_reward,
    'drops',            v_results,
    'first_time',       v_first_time,
    'save',             v_save
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) TO authenticated;

-- ── 3. mission_rewards: adiciona coluna crystals e atualiza fn_claim_reward ───
ALTER TABLE public.mission_rewards
  ADD COLUMN IF NOT EXISTS crystals INT NOT NULL DEFAULT 0;

UPDATE public.mission_rewards SET crystals = 150 WHERE mission_id IN ('stage_all','stage_op','stage_bleach','stage_marvel','stage_dc');
UPDATE public.mission_rewards SET crystals = 500 WHERE mission_id = 'stage_all_worlds';
UPDATE public.mission_rewards SET crystals = 50  WHERE mission_id = 'inf_wave5';
UPDATE public.mission_rewards SET crystals = 100 WHERE mission_id = 'inf_wave10';
UPDATE public.mission_rewards SET crystals = 200 WHERE mission_id = 'inf_wave25';
UPDATE public.mission_rewards SET crystals = 400 WHERE mission_id = 'inf_wave50';
UPDATE public.mission_rewards SET crystals = 80  WHERE mission_id = 'inf_total50';
UPDATE public.mission_rewards SET crystals = 200 WHERE mission_id = 'inf_total200';

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
