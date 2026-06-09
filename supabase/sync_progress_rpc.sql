-- =============================================================================
-- ASTD — Solução B: Cliente nunca envia dados econômicos ao servidor
--
-- Garante que gemas, tickets, inventário e pity SÓ mudam via RPC confiável.
-- O cliente envia apenas progresso (stats, fases, missões). O servidor faz o
-- merge e devolve o save autoritativo completo.
--
-- Execute APÓS gacha_rpc.sql e security_patch_v3.sql.
-- =============================================================================

-- ─── 1. Tabela de configuração de fases ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stage_config (
  stage_id       TEXT PRIMARY KEY,
  is_boss        BOOLEAN NOT NULL DEFAULT false,
  min_duration_s INT     NOT NULL DEFAULT 30  -- anti-script: tempo mínimo em segundos
);

-- ─── 2. Tabela de drops por fase ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stage_drops (
  id             SERIAL  PRIMARY KEY,
  stage_id       TEXT    NOT NULL REFERENCES public.stage_config(stage_id),
  item_id        TEXT    NOT NULL,
  chance         FLOAT8  NOT NULL,   -- porcentagem (0–100)
  pity_threshold INT,                -- NULL = sem pity
  is_one_time    BOOLEAN NOT NULL DEFAULT false,
  is_playable    BOOLEAN NOT NULL DEFAULT false  -- true = vai para inventario.unidades
);

ALTER TABLE public.stage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_drops  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stage_config_no_direct_access" ON public.stage_config;
CREATE POLICY "stage_config_no_direct_access" ON public.stage_config FOR ALL TO authenticated USING (false);

DROP POLICY IF EXISTS "stage_drops_no_direct_access" ON public.stage_drops;
CREATE POLICY "stage_drops_no_direct_access" ON public.stage_drops FOR ALL TO authenticated USING (false);

-- ─── 3. Seed: stage_config ───────────────────────────────────────────────────
INSERT INTO public.stage_config (stage_id, is_boss, min_duration_s) VALUES
  ('fase1',       false, 30), ('fase2',       false, 30), ('fase3',       false, 30),
  ('fase4',       false, 30), ('fase5',       false, 30), ('fase6',       true,  60),
  ('op_fase1',    false, 30), ('op_fase2',    false, 30), ('op_fase3',    false, 30),
  ('op_fase4',    false, 30), ('op_fase5',    false, 30), ('op_fase6',    true,  60),
  ('bl_fase1',    false, 30), ('bl_fase2',    false, 30), ('bl_fase3',    false, 30),
  ('bl_fase4',    false, 30), ('bl_fase5',    false, 30), ('bl_fase6',    true,  60),
  ('mv_fase1',    false, 30), ('mv_fase2',    false, 30), ('mv_fase3',    false, 30),
  ('mv_fase4',    false, 30), ('mv_fase5',    false, 30), ('mv_fase6',    true,  60),
  ('infinito_partida', false, 0)
ON CONFLICT (stage_id) DO NOTHING;

-- ─── 4. Seed: stage_drops ────────────────────────────────────────────────────
INSERT INTO public.stage_drops (stage_id, item_id, chance, pity_threshold, is_playable) VALUES
  -- Naruto 1–5 (materiais)
  ('fase1','ninja_generico_1',70,NULL,false), ('fase1','ninja_generico_2',20,NULL,false), ('fase1','ninja_generico_3',10,NULL,false),
  ('fase2','ninja_generico_1',70,NULL,false), ('fase2','ninja_generico_2',20,NULL,false), ('fase2','ninja_generico_3',10,NULL,false),
  ('fase3','ninja_generico_1',70,NULL,false), ('fase3','ninja_generico_2',20,NULL,false), ('fase3','ninja_generico_3',10,NULL,false),
  ('fase4','ninja_generico_1',70,NULL,false), ('fase4','ninja_generico_2',20,NULL,false), ('fase4','ninja_generico_3',10,NULL,false),
  ('fase5','ninja_generico_1',70,NULL,false), ('fase5','ninja_generico_2',20,NULL,false), ('fase5','ninja_generico_3',10,NULL,false),
  -- Naruto 6 boss (inclui naruto_sage exclusivo)
  ('fase6','naruto_sage',    0.1, 200, true),
  ('fase6','ninja_generico_3',9.9,NULL,false), ('fase6','ninja_generico_2',20,NULL,false), ('fase6','ninja_generico_1',70,NULL,false),
  -- One Piece 1–5
  ('op_fase1','pirata_generico_1',70,NULL,false), ('op_fase1','pirata_generico_2',20,NULL,false),
  ('op_fase2','pirata_generico_1',50,NULL,false), ('op_fase2','pirata_generico_2',30,NULL,false), ('op_fase2','pirata_generico_3',5,NULL,false),
  ('op_fase3','pirata_generico_1',30,NULL,false), ('op_fase3','pirata_generico_2',50,NULL,false), ('op_fase3','pirata_generico_3',15,NULL,false),
  ('op_fase4','pirata_generico_2',40,NULL,false), ('op_fase4','pirata_generico_3',20,NULL,false),
  ('op_fase5','pirata_generico_2',20,NULL,false), ('op_fase5','pirata_generico_3',40,NULL,false),
  -- One Piece 6 boss
  ('op_fase6','pirata_generico_3',60,NULL,false),
  ('op_fase6','barbabranca_5',  0.1,200,true),
  -- Bleach 1–5
  ('bl_fase1','shinigami_generico_1',70,NULL,false), ('bl_fase1','shinigami_generico_2',20,NULL,false), ('bl_fase1','shinigami_generico_3',10,NULL,false),
  ('bl_fase2','shinigami_generico_1',50,NULL,false), ('bl_fase2','shinigami_generico_2',30,NULL,false), ('bl_fase2','shinigami_generico_3',15,NULL,false),
  ('bl_fase3','shinigami_generico_2',50,NULL,false), ('bl_fase3','shinigami_generico_3',40,NULL,false),
  ('bl_fase4','shinigami_generico_2',20,NULL,false), ('bl_fase4','shinigami_generico_3',70,NULL,false),
  ('bl_fase5','shinigami_generico_3',90,NULL,false),
  -- Bleach 6 boss
  ('bl_fase6','shinigami_generico_3',40,NULL,false),
  ('bl_fase6','ichigo_bankai',    0.1,200,true),
  -- Marvel 1–5
  ('mv_fase1','avenger_material_1',70,NULL,false), ('mv_fase1','avenger_material_2',20,NULL,false), ('mv_fase1','avenger_material_3',10,NULL,false),
  ('mv_fase2','avenger_material_1',50,NULL,false), ('mv_fase2','avenger_material_2',30,NULL,false), ('mv_fase2','avenger_material_3',15,NULL,false),
  ('mv_fase3','avenger_material_2',50,NULL,false), ('mv_fase3','avenger_material_3',40,NULL,false),
  ('mv_fase4','avenger_material_2',20,NULL,false), ('mv_fase4','avenger_material_3',70,NULL,false),
  ('mv_fase5','avenger_material_3',90,NULL,false),
  -- Marvel 6 boss
  ('mv_fase6','avenger_material_3',40,NULL,false),
  ('mv_fase6','hulk_base',        0.1,200,true)
ON CONFLICT DO NOTHING;

-- ─── 5. Tabela de recompensas de missões ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_rewards (
  mission_id TEXT    PRIMARY KEY,
  gems       INT     NOT NULL DEFAULT 0,
  tickets    INT     NOT NULL DEFAULT 0
);

ALTER TABLE public.mission_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_rewards_no_direct_access" ON public.mission_rewards;
CREATE POLICY "mission_rewards_no_direct_access" ON public.mission_rewards FOR ALL TO authenticated USING (false);

-- Seed: conquistas
INSERT INTO public.mission_rewards (mission_id, gems, tickets) VALUES
  ('dmg_1k',20,0),('dmg_10k',50,0),('dmg_50k',100,0),('dmg_200k',200,0),
  ('dmg_1m',400,0),('dmg_5m',0,5),('dmg_10m',0,8),('dmg_50m',0,15),('dmg_100m',0,20),
  ('kill_50',30,0),('kill_200',60,0),('kill_500',100,0),('kill_2000',200,0),
  ('kill_5k',350,0),('kill_10k',0,5),('kill_15k',0,5),('kill_25k',0,8),('kill_50k',0,15),
  ('place_5',0,1),('place_20',0,2),('place_50',80,0),('place_100',150,0),
  ('place_300',0,5),('place_500',0,8),('place_1000',0,15),
  ('stage_1',0,1),('stage_3',0,2),('stage_10',100,0),('stage_25',200,0),
  ('stage_50',0,5),('stage_100',0,15),
  ('stage_all',0,5),('stage_op',0,5),('stage_bleach',0,5),('stage_marvel',0,5),
  ('stage_all_worlds',0,10),
  ('inf_wave5',40,0),('inf_wave10',80,0),('inf_wave25',150,0),('inf_wave50',300,0),
  ('inf_wave75',400,0),('inf_wave100',0,10),('inf_wave150',0,15),('inf_wave200',0,20),
  ('inf_total50',50,0),('inf_total200',150,0),('inf_total500',0,8),
  ('miniboss',0,2),('miniboss_5',0,3),('miniboss_20',200,0),
  ('miniboss_50',0,8),('miniboss_100',0,10),
  ('pain',0,5),
  ('pull_1',0,1),('pull_5',0,2),('pull_10',0,3),('pull_50',150,0),
  ('pull_100',0,5),('pull_300',0,10),('pull_500',0,15),
  ('get4',0,2),('get5',0,5),('get5_x3',0,10),('get5_x5',0,15),('get5_x10',0,20),
  ('col_5',0,2),('col_10',100,0),('col_20',200,0),('col_30',0,5),('col_40',0,10),
  ('feed_1',0,1),('feed_10',50,0),('feed_30',150,0),('feed_50',300,0),('feed_100',0,5),
  ('evolve_1',100,0),('evolve_3',0,3),('evolve_5',0,5),('evolve_10',250,0)
ON CONFLICT (mission_id) DO NOTHING;

-- Seed: missões diárias
INSERT INTO public.mission_rewards (mission_id, gems, tickets) VALUES
  ('d_kill_30',20,0),('d_kill_50',30,0),('d_kill_80',40,0),('d_kill_150',70,0),
  ('d_kill_300',100,0),('d_kill_500',160,0),('d_kill_1000',280,0),
  ('d_dmg_500',10,0),('d_dmg_5k',20,0),('d_dmg_30k',50,0),
  ('d_dmg_100k',90,0),('d_dmg_300k',130,0),('d_dmg_1m',250,0),
  ('d_stage_1',30,0),('d_stage_3',80,0),('d_stage_5',120,0),
  ('d_stage_8',200,0),('d_stage_10',300,0),
  ('d_stage_naruto_1',50,0),('d_stage_naruto_3',120,0),
  ('d_stage_op_1',50,0),('d_stage_op_3',120,0),
  ('d_stage_bleach_1',50,0),('d_stage_bleach_3',120,0),
  ('d_stage_marvel_1',50,0),('d_stage_marvel_3',120,0),
  ('d_pull_1',0,3),('d_pull_3',0,5),('d_pull_5',0,8),('d_pull_10',0,15),
  ('d_tower_3',15,0),('d_tower_8',25,0),('d_tower_15',50,0),('d_tower_25',80,0),
  ('d_miniboss',60,0),('d_miniboss_3',0,3),('d_miniboss_5',200,0),
  ('d_inf_5',40,0),('d_inf_10',70,0),('d_inf_20',120,0),
  ('d_evolve',50,0),('d_evolve_3',150,0),
  ('d_feed',30,0),('d_feed_10',70,0)
ON CONFLICT (mission_id) DO NOTHING;

-- ─── 6. fn_sync_progress ──────────────────────────────────────────────────────
-- O cliente envia todo o save local. A função descarta qualquer campo econômico
-- (gemas, tickets, inventario, pity_contador) que venha do cliente e mantém os
-- valores autoritativos que estão no banco. Só progresso (stats, fases, missões)
-- é mesclado. Retorna o save completo e definitivo.
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
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;

  -- ── Primeiro acesso: cria o save inicial ─────────────────────────────────
  IF v_save IS NULL THEN
    -- Confia parcialmente no cliente para o save inicial (novo jogador)
    -- mas clampa economia para evitar injeção desde o registro
    v_save := p_progress
      - '_integrityViolations';
    v_save := jsonb_set(v_save, '{gemas}',
      to_jsonb(LEAST(COALESCE((p_progress->>'gemas')::BIGINT, 500), 5000)));
    v_save := jsonb_set(v_save, '{tickets}',
      to_jsonb(LEAST(COALESCE((p_progress->>'tickets')::INT, 0), 20)));
    v_save := jsonb_set(v_save, '{pity_contador}',
      to_jsonb(LEAST(COALESCE((p_progress->>'pity_contador')::INT, 0), 149)));
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

  -- ── Mescla fases_completas: union profunda (nunca perde conclusão) ─────────
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

  -- ── Mescla missoes_completas: union de arrays (dedup via UNION) ────────────
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
  -- Base: save do servidor (autoritativo em economia)
  -- Sobrepõe com campos de progresso do cliente (mais recentes)
  -- Força: economia do servidor (não pode ser sobrescrita)
  v_save := v_save
    || v_stripped                                   -- progresso do cliente (inclui time_salvo, missoes_diarias, etc.)
    || v_economy                                    -- economia do servidor (sempre vence)
    || jsonb_build_object(
         'stats',            v_stats,
         'fases_completas',  v_fases,
         'missoes_completas', v_missions,
         '_cloudLinked',     true,
         '_lastSyncAt',      NOW()::TEXT
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

-- ─── 7. fn_complete_stage ─────────────────────────────────────────────────────
-- Valida completude de fase, concede gemas e rola drops no servidor.
-- Parâmetros: stage_id, dificuldade (normal|dificil|lendario), duração em segundos,
--             se o boss da fase foi derrotado.
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
  r             RECORD;
  j             INT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error','unauthorized'); END IF;

  -- Valida parâmetros
  IF p_difficulty NOT IN ('normal','dificil','lendario') THEN
    RETURN jsonb_build_object('error','invalid_difficulty');
  END IF;

  SELECT * INTO v_cfg FROM public.stage_config WHERE stage_id = p_stage_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unknown_stage'); END IF;

  -- Anti-script: duração mínima
  IF p_duration_s < v_cfg.min_duration_s THEN
    RETURN jsonb_build_object('error','duration_too_short');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error','save_not_found'); END IF;

  v_gems       := COALESCE((v_save->>'gemas')::BIGINT, 0);
  v_tickets    := COALESCE((v_save->>'tickets')::INT, 0);
  v_units_arr  := COALESCE(v_save->'inventario'->'unidades',  '[]');
  v_mats_arr   := COALESCE(v_save->'inventario'->'materiais', '[]');

  -- Verifica se é primeira vez nesta dificuldade
  v_first_time := NOT COALESCE(
    (v_save->'fases_completas'->p_stage_id->>p_difficulty)::BOOLEAN,
    false
  );

  -- Calcula recompensa de gemas
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

    -- Lógica de pity: dispara quando pity >= threshold
    IF r.pity_threshold IS NOT NULL THEN
      IF v_pity + 1 >= r.pity_threshold THEN
        -- Pity disparou
        v_pity := 0;
        -- Gera UID e adiciona ao inventário
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
      -- Ainda não disparou: incrementa pity e pula este drop
      v_pity := v_pity + 1;
      CONTINUE;
    END IF;

    -- Drop normal por chance
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

  -- Marca fase como completa nesta dificuldade
  IF v_first_time THEN
    v_save := jsonb_set(v_save,
      ARRAY['fases_completas', p_stage_id, p_difficulty], 'true'::jsonb, true);
    v_save := jsonb_set(v_save, '{stats,fases_completas}',
      to_jsonb(COALESCE((v_save->'stats'->>'fases_completas')::INT, 0) + 1));
  END IF;

  -- Atualiza pity do drop desta fase
  v_save := jsonb_set(v_save, ARRAY['stats', v_pity_key], to_jsonb(v_pity), true);
  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := jsonb_set(v_save, '{_cloudLinked}', 'true'::jsonb);
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'gems_granted', v_gem_reward,
    'drops',        v_results,
    'first_time',   v_first_time,
    'save',         v_save
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN) TO authenticated;

-- ─── 8. fn_claim_reward ────────────────────────────────────────────────────────
-- Concessão server-side de recompensa de missão (conquista ou diária).
-- Impede double-claim verificando o save no banco antes de conceder.
-- p_date: NULL = conquista (uma vez na vida), 'YYYY-MM-DD' = missão diária.
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
  v_is_daily     BOOLEAN;
  v_is_claimed   BOOLEAN;
  v_daily_arr    JSONB;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error','unauthorized'); END IF;

  -- Busca recompensa cadastrada
  SELECT gems, tickets INTO v_reward_gems, v_reward_tix
  FROM public.mission_rewards WHERE mission_id = p_mission_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unknown_mission'); END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error','save_not_found'); END IF;

  v_is_daily := (p_date IS NOT NULL);

  IF v_is_daily THEN
    -- Valida data (aceita ±1 dia por segurança de timezone)
    IF p_date NOT IN (
      TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'),
      TO_CHAR((NOW() - INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    ) THEN
      RETURN jsonb_build_object('error','wrong_date');
    END IF;
    -- Verifica se já resgatou hoje
    v_daily_arr := COALESCE(v_save->'missoes_diarias'->'completas', '[]');
    SELECT EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(v_daily_arr) m WHERE m = p_mission_id
    ) INTO v_is_claimed;
    IF v_is_claimed THEN RETURN jsonb_build_object('error','already_claimed'); END IF;
    -- Marca como resgatada
    v_save := jsonb_set(v_save, '{missoes_diarias,completas}',
      v_daily_arr || to_jsonb(p_mission_id));
  ELSE
    -- Conquista: verifica se já foi resgatada em toda a conta
    SELECT EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_save->'missoes_completas','[]')) m
      WHERE m = p_mission_id
    ) INTO v_is_claimed;
    IF v_is_claimed THEN RETURN jsonb_build_object('error','already_claimed'); END IF;
    v_save := jsonb_set(v_save, '{missoes_completas}',
      COALESCE(v_save->'missoes_completas','[]') || to_jsonb(p_mission_id));
  END IF;

  -- Concede recompensa
  IF v_reward_gems > 0 THEN
    v_save := jsonb_set(v_save, '{gemas}',
      to_jsonb(COALESCE((v_save->>'gemas')::BIGINT, 0) + v_reward_gems));
  END IF;
  IF v_reward_tix > 0 THEN
    v_save := jsonb_set(v_save, '{tickets}',
      to_jsonb(COALESCE((v_save->>'tickets')::INT, 0) + v_reward_tix));
  END IF;

  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_claim_reward(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_claim_reward(TEXT, TEXT) TO authenticated;

-- ─── 9. Atualiza RLS da tabela saves ──────────────────────────────────────────
-- Antes: authenticated podia INSERT/UPDATE/DELETE diretamente
-- Agora: authenticated só pode SELECT (ler o próprio save)
-- Todas as escritas passam pelas funções SECURITY DEFINER acima

-- Remove política antiga que permitia escrita
DROP POLICY IF EXISTS "saves_rw_own"   ON public.saves;
DROP POLICY IF EXISTS "saves_read_own" ON public.saves;

-- Cria política somente leitura
CREATE POLICY "saves_read_own" ON public.saves
  FOR SELECT TO authenticated
  USING (player_id = public.get_my_player_id());

-- Sem INSERT, UPDATE ou DELETE para authenticated — só as funções SECURITY DEFINER escrevem

-- =============================================================================
-- FIM.
-- Ordem de execução: cole e execute tudo de uma vez no SQL Editor.
-- Após executar, o próximo deploy do site já estará protegido.
-- =============================================================================
