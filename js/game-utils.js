// js/game-utils.js — Utilitários globais (matemática + estado compartilhado do Modo Infinito).
// Carregado antes de game-infinite.js, game-passives.js e game.js.

// Estado compartilhado do Modo Infinito (lido/escrito por game-infinite.js e game.js)
const _infiniteSession = { gems: 0, drops: {} };

// Contexto de ataque: funções de dano/projétil expostas por game.js para game-attack.js
const _attackCtx = {};

// Contexto de renderização: estado do jogo exposto para game-renderer.js
const _renderCtx = {};

// Contexto de HUD: estado exposto para game-hud.js
const _hudCtx = {};

// Contexto de torres: estado exposto para game-towers.js
const _towersCtx = {};

// Contexto de waves: estado exposto para game-waves.js
const _wavesCtx = {};

function dist2d(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return dist2d(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2d(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}
