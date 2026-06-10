-- =============================================================================
-- Update 3 — DC Sync
-- Adiciona personagens DC ao gacha_config e fases DC ao stage_config/stage_drops
-- Execute no SQL Editor do Supabase (mlywqfwrhbuwpxbzpsoq)
-- =============================================================================

-- ── 1. gacha_config: adiciona personagens DC ─────────────────────────────────

UPDATE public.gacha_config
SET
  pool_star3   = pool_star3   || ARRAY['flash_barry','batgirl','aquaman'],
  pool_star4   = pool_star4   || ARRAY['batman_bruce','lois_lane','lanterna_verde'],
  pool_star5   = pool_star5   || ARRAY['superman_clark','shazam_billy'],
  playable_ids = playable_ids || ARRAY['flash_barry','batgirl','aquaman','batman_bruce','lois_lane','lanterna_verde','superman_clark','shazam_billy'],
  updated_at   = now()
WHERE id = (SELECT id FROM public.gacha_config ORDER BY updated_at DESC LIMIT 1);

-- ── 2. stage_config: adiciona fases DC ───────────────────────────────────────

INSERT INTO public.stage_config (stage_id, is_boss, min_duration_s) VALUES
  ('dc_fase1', false, 30),
  ('dc_fase2', false, 30),
  ('dc_fase3', false, 30),
  ('dc_fase4', false, 30),
  ('dc_fase5', false, 30),
  ('dc_fase6', true,  60)
ON CONFLICT (stage_id) DO NOTHING;

-- ── 3. stage_drops: drops das fases DC ───────────────────────────────────────

INSERT INTO public.stage_drops (stage_id, item_id, chance, pity_threshold, is_playable) VALUES
  -- DC 1 — Invasão de Metrópolis
  ('dc_fase1', 'dc_material_1', 70,   NULL, false),
  ('dc_fase1', 'dc_material_2', 20,   NULL, false),
  ('dc_fase1', 'dc_material_3', 10,   NULL, false),
  -- DC 2 — As Ruas em Chamas
  ('dc_fase2', 'dc_material_1', 50,   NULL, false),
  ('dc_fase2', 'dc_material_2', 30,   NULL, false),
  ('dc_fase2', 'dc_material_3', 15,   NULL, false),
  -- DC 3 — O Escudo Caiu
  ('dc_fase3', 'dc_material_2', 50,   NULL, false),
  ('dc_fase3', 'dc_material_3', 40,   NULL, false),
  -- DC 4 — Equação Anti-Vida
  ('dc_fase4', 'dc_material_2', 20,   NULL, false),
  ('dc_fase4', 'dc_material_3', 70,   NULL, false),
  -- DC 5 — Linha de Frente
  ('dc_fase5', 'dc_material_3', 90,   NULL, false),
  -- DC 6 — Convergência Final (Boss)
  ('dc_fase6', 'dc_material_3', 40,   NULL, false),
  ('dc_fase6', 'superman_clark', 0.1, 200,  true)
ON CONFLICT DO NOTHING;
