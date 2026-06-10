-- =============================================================================
-- Update 3 — DC Sync (baseado no estado real do banco em 10/06/2026)
-- Execute no SQL Editor do Supabase (mlywqfwrhbuwpxbzpsoq)
-- =============================================================================

-- ── 1. gacha_config: adiciona personagens DC ─────────────────────────────────
-- Estado atual: star3 tem 20 chars, star4 tem 12, star5 tem 3
-- Adicionando: 3 chars 3★ DC, 3 chars 4★ DC, 2 chars 5★ DC

UPDATE public.gacha_config
SET
  pool_star3   = pool_star3   || ARRAY['flash_barry','batgirl','aquaman'],
  pool_star4   = pool_star4   || ARRAY['batman_bruce','lois_lane','lanterna_verde'],
  pool_star5   = pool_star5   || ARRAY['superman_clark','shazam_billy'],
  playable_ids = playable_ids || ARRAY['flash_barry','batgirl','aquaman',
                                       'batman_bruce','lois_lane','lanterna_verde',
                                       'superman_clark','shazam_billy'],
  updated_at   = now()
WHERE id = 1;

-- ── 2. stage_config: adiciona fases DC ───────────────────────────────────────
-- Estado atual: tem fase1-6, op_fase1-6, bl_fase1-6, mv_fase1-6, infinito_partida
-- Adicionando: dc_fase1-6

INSERT INTO public.stage_config (stage_id, is_boss, min_duration_s) VALUES
  ('dc_fase1', false, 30),
  ('dc_fase2', false, 30),
  ('dc_fase3', false, 30),
  ('dc_fase4', false, 30),
  ('dc_fase5', false, 30),
  ('dc_fase6', true,  60)
ON CONFLICT (stage_id) DO NOTHING;

-- ── 3. stage_drops: drops das fases DC ───────────────────────────────────────
-- Seguindo o mesmo padrão dos mundos anteriores
-- dc_fase6 boss dropa superman_clark (0.1% com pity 200)

INSERT INTO public.stage_drops (stage_id, item_id, chance, pity_threshold, is_one_time, is_playable) VALUES
  ('dc_fase1', 'dc_material_1',  70,   NULL, false, false),
  ('dc_fase1', 'dc_material_2',  20,   NULL, false, false),
  ('dc_fase1', 'dc_material_3',  10,   NULL, false, false),
  ('dc_fase2', 'dc_material_1',  50,   NULL, false, false),
  ('dc_fase2', 'dc_material_2',  30,   NULL, false, false),
  ('dc_fase2', 'dc_material_3',  15,   NULL, false, false),
  ('dc_fase3', 'dc_material_2',  50,   NULL, false, false),
  ('dc_fase3', 'dc_material_3',  40,   NULL, false, false),
  ('dc_fase4', 'dc_material_2',  20,   NULL, false, false),
  ('dc_fase4', 'dc_material_3',  70,   NULL, false, false),
  ('dc_fase5', 'dc_material_3',  90,   NULL, false, false),
  ('dc_fase6', 'dc_material_3',  40,   NULL, false, false),
  ('dc_fase6', 'superman_clark', 0.1,  200,  false, true);

-- ── 4. mission_rewards: adiciona recompensas DC ───────────────────────────────
-- Seguindo o padrão: stage_dc (conquista), d_stage_dc_1 e d_stage_dc_3 (diárias)

INSERT INTO public.mission_rewards (mission_id, gems, tickets) VALUES
  ('stage_dc',       0,   5),
  ('d_stage_dc_1',  50,   0),
  ('d_stage_dc_3',  120,  0)
ON CONFLICT (mission_id) DO NOTHING;
