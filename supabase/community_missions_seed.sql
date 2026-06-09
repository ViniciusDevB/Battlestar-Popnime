-- =============================================================================
-- ASTD — Seed: Missões da Comunidade
-- Execute no SQL Editor do Supabase após migrate_trades_v2.sql
-- Ajuste starts_at / ends_at conforme necessário antes de rodar.
-- =============================================================================

-- ── Update 2.4 — "Legado dos Guerreiros" (missão anterior) ────────────────────
-- Referência histórica: representa o ciclo antes do sistema online.
-- Defina starts_at/ends_at no passado se quiser mostrar como "encerrada".
INSERT INTO community_missions (
  title, description,
  goal_type, goal_value, current_value,
  reward_gems, reward_units,
  starts_at, ends_at, completed
) VALUES (
  'Legado dos Guerreiros',
  'Juntos, os guerreiros de Battlestar deixaram sua marca — cada fase concluída alimentou a lenda. Missão de legado da era pré-online.',
  'stages_cleared',
  50000,      -- 50.000 fases concluídas pela comunidade
  0,
  0,
  ARRAY['__random_5star__'],
  '2026-05-01 00:00:00+00',
  '2026-06-07 23:59:59+00',   -- terminou ontem — ainda visível por 7 dias
  false
) ON CONFLICT (title) DO NOTHING;

-- ── Update 2.5 — "Era Online — A Comunidade Desperta" (missão atual) ─────────
-- Representa o Update 2.5: leaderboard, trocas, missões online.
-- Ajuste ends_at para a duração desejada (sugerido: 2 semanas).
INSERT INTO community_missions (
  title, description,
  goal_type, goal_value, current_value,
  reward_gems, reward_units,
  starts_at, ends_at, completed
) VALUES (
  'Era Online — A Comunidade Desperta',
  'O Update 2.5 conectou todos os guerreiros. Derrotem juntos um milhão de inimigos e provem que a comunidade é imbatível!',
  'kills',
  1000000,    -- 1.000.000 de kills somados de todos os jogadores
  0,
  0,
  ARRAY['__random_5star__'],
  '2026-06-08 00:00:00+00',
  '2026-06-22 23:59:59+00',
  false
) ON CONFLICT (title) DO NOTHING;

-- ── Update 2.6 — "A Sombra Cresce" (missão de dano — recompensa: unidade de evento) ──
-- Dificuldade moderada. Comunidade deve causar 5 trilhões de dano total.
-- Recompensa: personagem de evento aleatório (__random_event_unit__).
-- Ajuste ends_at conforme a duração desejada (sugerido: 2 semanas).
INSERT INTO community_missions (
  title, description,
  goal_type, goal_value, current_value,
  reward_gems, reward_units,
  starts_at, ends_at, completed
) VALUES (
  'A Sombra Cresce',
  'Uma sombra se alastra pelo mundo de Battlestar. Guerreiros de todas as séries devem unir forças e causar dano devastador para conter a ameaça. Juntos, provaremos que somos imbatíveis!',
  'damage',
  5000000000000,   -- 5 trilhões de dano total acumulado pela comunidade
  0,
  300,
  ARRAY['__random_event_unit__'],
  '2026-06-23 00:00:00+00',
  '2026-07-07 23:59:59+00',
  false
) ON CONFLICT (title) DO NOTHING;

-- ── Update 2.6 — "Contenção do Nemesis" (missão mais difícil — recompensa: Nemesis) ──
-- Missão mais difícil disponível. Requer coordenação massiva da comunidade.
-- Recompensa: Nemesis, unidade 5⭐ exclusiva de Missão Global.
-- Meta alta intencionalmente — meta máxima de dificuldade para recompensa premium.
INSERT INTO community_missions (
  title, description,
  goal_type, goal_value, current_value,
  reward_gems, reward_units,
  starts_at, ends_at, completed
) VALUES (
  'Contenção do Nemesis',
  'O Nemesis se levanta. Uma entidade corrompida que infecta tudo ao seu redor, transformando os derrotados em hordas de zumbis implacáveis. Apenas a comunidade inteira, unindo forças em 500.000 fases, pode contê-lo. Ao conseguirem, ele se renderá e lutará ao seu lado.',
  'stages_cleared',
  500000,          -- 500.000 fases concluídas pela comunidade inteira
  0,
  500,
  ARRAY['nemesis'],
  '2026-07-08 00:00:00+00',
  '2026-08-05 23:59:59+00',  -- 4 semanas para a missão mais difícil
  false
) ON CONFLICT (title) DO NOTHING;

-- ── Habilitar Realtime para community_missions (se ainda não feito) ───────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_missions;

-- =============================================================================
-- FIM DO SEED
-- =============================================================================
