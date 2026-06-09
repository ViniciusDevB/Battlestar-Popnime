-- =============================================================================
-- ASTD — Security Patch v3
--
-- Corrige dois vetores de ataque:
--   1. Anti-Smurfing: novo jogador sempre inicia com valores econômicos fixos
--      (500 gemas, 0 tickets, 0 pity), ignorando completamente o payload do cliente.
--   2. Rate Limiting: fn_complete_stage rejeita chamadas repetidas para a mesma
--      fase antes que o tempo mínimo real tenha passado desde a última conclusão.
--      Impede farming de gemas via script mesmo com min_duration_s correto.
--
-- Execute no SQL Editor do Supabase APÓS sync_progress_rpc.sql.
-- Pode ser reexecutado com segurança (CREATE OR REPLACE).
-- =============================================================================

-- ─── 1. fn_sync_progress (fix: anti-smurfing no primeiro save) ────────────────
CREATE OR REPLACE FUNCTION public.fn_sync_progress(p_progress JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID;
  v_save        JSONB;
  v_economy     JSONB;
  v_stripped    JSONB;
  v_stats       JSONB;
  v_fases       JSONB;
  v_missions    JSONB;
  v_inv_units   JSONB;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;

  -- ── Primeiro acesso: cria o save inicial ─────────────────────────────────
  IF v_save IS NULL THEN
    -- Aceita progresso e inventário do cliente (unidades iniciais do banner),
    -- mas IGNORA completamente a economia: valores são sempre fixos do servidor.
    -- Isso elimina o exploit de criar conta com gemas máximas + usar Trades.
    v_save := p_progress - '_integrityViolations';
    v_save := jsonb_set(v_save, '{gemas}',        '500'::jsonb);
    v_save := jsonb_set(v_save, '{tickets}',       '0'::jsonb);
    v_save := jsonb_set(v_save, '{pity_contador}', '0'::jsonb);

    -- Cap no inventário inicial: máximo 15 unidades (proteção extra contra injeção)
    v_inv_units := COALESCE(v_save->'inventario'->'unidades', '[]');
    IF jsonb_array_length(v_inv_units) > 15 THEN
      v_inv_units := (
        SELECT jsonb_agg(el) FROM (
          SELECT el FROM jsonb_array_elements(v_inv_units) el LIMIT 15
        ) t
      );
      v_save := jsonb_set(v_save, '{inventario,unidades}', v_inv_units);
    END IF;

    v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
    v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

    INSERT INTO public.saves (player_id, data, updated_at)
    VALUES (v_player_id, v_save, NOW());
    RETURN jsonb_build_object('ok', true, 'save', v_save);
  END IF;

  -- ── Save existente: extrai economia do servidor (nunca vem do cliente) ────
  v_economy := jsonb_build_object(
    'gemas',         COALESCE(v_save->'gemas',         '0'::jsonb),
    'tickets',       COALESCE(v_save->'tickets',       '0'::jsonb),
    'pity_contador', COALESCE(v_save->'pity_contador', '0'::jsonb),
    'inventario',    COALESCE(v_save->'inventario',    '{"unidades":[],"materiais":[]}'::jsonb)
  );

  -- Remove campos econômicos do payload do cliente (mesmo que injetados)
  v_stripped := p_progress
    - 'gemas'
    - 'tickets'
    - 'pity_contador'
    - 'inventario'
    - '_integrityViolations';

  -- ── Mescla stats: máximo de cada campo ────────────────────────────────────
  SELECT COALESCE(jsonb_object_agg(k, GREATEST(
      COALESCE((v_save->'stats'->>k)::NUMERIC, 0),
      COALESCE((v_stripped->'stats'->>k)::NUMERIC, 0)
    )), '{}')
  INTO v_stats
  FROM (
    SELECT DISTINCT k FROM (
      SELECT jsonb_object_keys(COALESCE(v_save->'stats', '{}')) AS k
      UNION ALL
      SELECT jsonb_object_keys(COALESCE(v_stripped->'stats', '{}')) AS k
    ) t
  ) keys;

  -- ── Mescla fases_completas: union profunda ────────────────────────────────
  SELECT COALESCE(jsonb_object_agg(
    k,
    COALESCE(v_save->'fases_completas'->k, '{}') ||
    COALESCE(v_stripped->'fases_completas'->k, '{}')
  ), '{}')
  INTO v_fases
  FROM (
    SELECT DISTINCT k FROM (
      SELECT jsonb_object_keys(COALESCE(v_save->'fases_completas', '{}')) AS k
      UNION ALL
      SELECT jsonb_object_keys(COALESCE(v_stripped->'fases_completas', '{}')) AS k
    ) t
  ) keys;

  -- ── Mescla missoes_completas: union de arrays ─────────────────────────────
  SELECT COALESCE(
    (SELECT jsonb_agg(m ORDER BY m)
     FROM (
       SELECT jsonb_array_elements_text(COALESCE(v_save->'missoes_completas', '[]')) AS m
       UNION
       SELECT jsonb_array_elements_text(COALESCE(v_stripped->'missoes_completas', '[]')) AS m
     ) t),
    '[]'
  ) INTO v_missions;

  -- ── Monta save final ──────────────────────────────────────────────────────
  v_save := v_save
    || v_stripped
    || v_economy
    || jsonb_build_object(
         'stats',             v_stats,
         'fases_completas',   v_fases,
         'missoes_completas', v_missions,
         '_cloudLinked',      true,
         '_lastSyncAt',       NOW()::TEXT
       );

  v_save := v_save - '_integrityViolations';

  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_sync_progress(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_sync_progress(JSONB) TO authenticated;


-- ─── 2. fn_complete_stage (fix: rate limiting por fase) ──────────────────────
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
  v_player_id   UUID;
  v_save        JSONB;
  v_cfg         RECORD;
  v_gems        BIGINT;
  v_tickets     INT;
  v_units_arr   JSONB;
  v_mats_arr    JSONB;
  v_results     JSONB  := '[]';
  v_first_time  BOOLEAN;
  v_gem_reward  INT;
  v_pity_key    TEXT;
  v_pity        INT;
  v_uid         TEXT;
  v_rand        FLOAT8;
  v_found       BOOLEAN;
  v_last_ts     TIMESTAMPTZ;
  r             RECORD;
  j             INT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error','unauthorized'); END IF;

  IF p_difficulty NOT IN ('normal','dificil','lendario') THEN
    RETURN jsonb_build_object('error','invalid_difficulty');
  END IF;

  SELECT * INTO v_cfg FROM public.stage_config WHERE stage_id = p_stage_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unknown_stage'); END IF;

  -- Anti-script: duração mínima declarada pelo cliente
  IF p_duration_s < v_cfg.min_duration_s THEN
    RETURN jsonb_build_object('error','duration_too_short');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error','save_not_found'); END IF;

  -- ── Rate limiting por fase ────────────────────────────────────────────────
  -- Registra quando cada fase foi completada pela última vez. Se o tempo real
  -- decorrido desde então for menor que min_duration_s, rejeita a chamada.
  -- Impede scripts que chamam a RPC repetidamente com tempo mínimo válido.
  v_last_ts := (v_save->'_stage_cooldowns'->>p_stage_id)::TIMESTAMPTZ;
  IF v_last_ts IS NOT NULL
     AND v_cfg.min_duration_s > 0
     AND EXTRACT(EPOCH FROM (NOW() - v_last_ts)) < v_cfg.min_duration_s
  THEN
    RETURN jsonb_build_object('error','rate_limited');
  END IF;

  v_gems       := COALESCE((v_save->>'gemas')::BIGINT, 0);
  v_tickets    := COALESCE((v_save->>'tickets')::INT, 0);
  v_units_arr  := COALESCE(v_save->'inventario'->'unidades',  '[]');
  v_mats_arr   := COALESCE(v_save->'inventario'->'materiais', '[]');

  v_first_time := NOT COALESCE(
    (v_save->'fases_completas'->p_stage_id->>p_difficulty)::BOOLEAN,
    false
  );

  v_gem_reward := CASE p_difficulty WHEN 'normal' THEN 50 WHEN 'dificil' THEN 100 ELSE 200 END;
  IF v_first_time  THEN v_gem_reward := v_gem_reward + 50; END IF;
  IF v_cfg.is_boss AND p_boss_killed THEN v_gem_reward := v_gem_reward + 30; END IF;
  IF v_cfg.is_boss AND v_first_time  THEN v_gem_reward := v_gem_reward + 100; END IF;

  -- ── Rola drops ────────────────────────────────────────────────────────────
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

  -- ── Atualiza o save ────────────────────────────────────────────────────────
  v_save := jsonb_set(v_save, '{gemas}', to_jsonb(v_gems + v_gem_reward));
  v_save := jsonb_set(v_save, '{inventario,unidades}',  v_units_arr);
  v_save := jsonb_set(v_save, '{inventario,materiais}', v_mats_arr);

  IF v_first_time THEN
    v_save := jsonb_set(v_save,
      ARRAY['fases_completas', p_stage_id, p_difficulty], 'true'::jsonb, true);
    v_save := jsonb_set(v_save, '{stats,fases_completas}',
      to_jsonb(COALESCE((v_save->'stats'->>'fases_completas')::INT, 0) + 1));
  END IF;

  v_save := jsonb_set(v_save, ARRAY['stats', v_pity_key], to_jsonb(v_pity), true);

  -- Grava timestamp para rate limiting da próxima chamada
  v_save := jsonb_set(
    v_save,
    '{_stage_cooldowns}',
    COALESCE(v_save->'_stage_cooldowns', '{}') || jsonb_build_object(p_stage_id, NOW()::TEXT)
  );

  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object(
    'ok',           true,
    'gems_granted', v_gem_reward,
    'drops',        v_results,
    'first_time',   v_first_time,
    'save',         v_save
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) TO authenticated;

-- =============================================================================
-- FIM. Execute no SQL Editor do Supabase.
-- Após executar, as funções são atualizadas sem necessidade de redeploy do site.
-- =============================================================================
