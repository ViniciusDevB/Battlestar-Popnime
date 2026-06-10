-- =============================================================================
-- Fix: Remove duplicatas em gacha_config e stage_drops
-- Causa: migration executada 2× + seed original já estava duplicado
-- Execute no SQL Editor do Supabase (mlywqfwrhbuwpxbzpsoq)
-- =============================================================================

-- ── 1. gacha_config: deduplica os arrays ─────────────────────────────────────
-- Personagens DC apareciam 2× em pool_star3/4/5 e playable_ids
-- iron_man_mark50 já está correto (1×)

UPDATE public.gacha_config
SET
  pool_star3   = ARRAY(SELECT DISTINCT unnest(pool_star3)),
  pool_star4   = ARRAY(SELECT DISTINCT unnest(pool_star4)),
  pool_star5   = ARRAY(SELECT DISTINCT unnest(pool_star5)),
  playable_ids = ARRAY(SELECT DISTINCT unnest(playable_ids)),
  updated_at   = now()
WHERE id = 1;

-- ── 2. stage_drops: remove linhas duplicadas ─────────────────────────────────
-- Mantém apenas a linha com o menor id para cada par (stage_id, item_id)
-- Resultado esperado: 72 linhas únicas (59 mundos anteriores + 13 fases DC)

DELETE FROM public.stage_drops
WHERE id NOT IN (
  SELECT MIN(id)
  FROM public.stage_drops
  GROUP BY stage_id, item_id
);
