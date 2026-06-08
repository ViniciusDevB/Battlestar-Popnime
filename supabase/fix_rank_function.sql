-- Fix: get_player_rank agora retorna wave E damage, funcionando corretamente
-- para os modos 'infinite' (rank por wave) e 'infinite' filtrado por dano.
-- Execute no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION get_player_rank(p_player_id UUID, p_mode TEXT)
RETURNS TABLE(rank BIGINT, total BIGINT, score BIGINT, wave INTEGER, damage BIGINT) AS $$
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
      best_dmg,
      RANK() OVER (ORDER BY best_wave DESC NULLS LAST, best_dmg DESC) AS rnk,
      COUNT(*) OVER () AS total
    FROM best
  )
  SELECT rnk, total, best_wave::BIGINT, best_wave, best_dmg
  FROM ranked
  WHERE player_id = p_player_id;
$$ LANGUAGE sql STABLE;
