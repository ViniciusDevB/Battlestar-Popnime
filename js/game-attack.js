// js/game-attack.js — Tipos de ataque e seleção de alvo.
// Depende de: _attackCtx (game-utils.js), distSq (game-utils.js),
//             CHAR_COLORS (game-passives.js), RARITY_COLORS (characters.js).

// Seleciona alvo: normalmente o mais avançado; se invertedTargeting, o mais atrasado.
function pickTarget(tower, candidates) {
  if (tower.invertedTargeting)
    return candidates.reduce((b, e) => e.dist < b.dist ? e : b, candidates[0]);
  return candidates.reduce((b, e) => e.dist > b.dist ? e : b, candidates[0]);
}

const ATTACK_TYPE_HANDLERS = {

  single_target: {
    execute(tower, stats, inRange) {
      const target = pickTarget(tower, inRange);
      if (!_attackCtx.effectiveCanDamage(tower, target)) return [];
      _attackCtx.spawnProjectile(tower, target, stats.damage, 'single');
      return [target];
    },
    effect(tower, stats, hitEnemies) {}
  },

  cone: {
    execute(tower, stats, inRange) {
      const target = pickTarget(tower, inRange);
      const dx = target.x - tower.x, dy = target.y - tower.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len === 0) return [];
      const nx = dx/len, ny = dy/len;
      const CONE_HALF = Math.PI / 4;
      const hits = [];
      inRange.forEach(e => {
        const ex = e.x - tower.x, ey = e.y - tower.y;
        const elen = Math.sqrt(ex*ex + ey*ey);
        if (elen === 0) return;
        const dot = (ex/elen)*nx + (ey/elen)*ny;
        if (dot >= Math.cos(CONE_HALF) && _attackCtx.effectiveCanDamage(tower, e)) {
          _attackCtx.dealDamage(tower, e, stats.damage);
          hits.push(e);
        }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      const target = hitEnemies.reduce((best, e) => e.dist > best.dist ? e : best, hitEnemies[0]);
      _attackCtx.addEffect({ type:'cone_flash', x:tower.x, y:tower.y, tx:target.x, ty:target.y, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.25, maxTimer:0.25, charId:tower.charId });
    }
  },

  linha: {
    execute(tower, stats, inRange) {
      const target = pickTarget(tower, inRange);
      const dx = target.x - tower.x, dy = target.y - tower.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len === 0) return [];
      const nx = dx/len, ny = dy/len;
      tower._lineEndX = tower.x + nx * stats.range;
      tower._lineEndY = tower.y + ny * stats.range;
      const hits = [];
      inRange.forEach(e => {
        const ex = e.x - tower.x, ey = e.y - tower.y;
        const dot = ex*nx + ey*ny;
        if (dot >= 0 && dot <= stats.range && Math.abs(ex*ny - ey*nx) < 30 && _attackCtx.effectiveCanDamage(tower, e)) {
          _attackCtx.dealDamage(tower, e, stats.damage);
          hits.push(e);
        }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      _attackCtx.addEffect({ type:'line', x:tower.x, y:tower.y, tx:tower._lineEndX, ty:tower._lineEndY, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.2, maxTimer:0.2, charId:tower.charId });
    }
  },

  aoe: {
    execute(tower, stats, inRange) {
      const hits = [];
      inRange.forEach(e => {
        if (_attackCtx.effectiveCanDamage(tower, e)) { _attackCtx.dealDamage(tower, e, stats.damage); hits.push(e); }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      _attackCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.3, maxTimer:0.3, r:0, charId:tower.charId });
    }
  },

  // Modo Vizard Total — acerta todos no alcance com impacto visual insano
  aoe_vizard_total: {
    execute(tower, stats, inRange) {
      const hits = [];
      inRange.forEach(e => {
        if (_attackCtx.effectiveCanDamage(tower, e)) { _attackCtx.dealDamage(tower, e, stats.damage); hits.push(e); }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      _attackCtx.addEffect({ type:'shockwave', x:tower.x, y:tower.y, maxR:stats.range + 80, color:'#b91c1c', timer:0.4, maxTimer:0.4 });
      _attackCtx.screenShakeAmount = 8;
      hitEnemies.forEach(e => {
        _attackCtx.addEffect({ type:'hollow_burst', x:e.x, y:e.y, maxR:40, timer:0.3, maxTimer:0.3, r:0 });
      });
    }
  },

  // Alias para compatibilidade com dados existentes
  single: {
    execute(tower, stats, inRange) { return ATTACK_TYPE_HANDLERS.single_target.execute(tower, stats, inRange); },
    effect(tower, stats, hitEnemies) { return ATTACK_TYPE_HANDLERS.single_target.effect(tower, stats, hitEnemies); }
  },

  // Pierce (Uryu) — ataca N inimigos mais próximos com flechas
  pierce: {
    execute(tower, stats, inRange) {
      const count = stats.pierce_count || 3;
      const sorted = [...inRange].sort((a, b) => distSq(tower.x, tower.y, a.x, a.y) - distSq(tower.x, tower.y, b.x, b.y));
      const targets = sorted.slice(0, count).filter(e => _attackCtx.effectiveCanDamage(tower, e));
      targets.forEach(e => _attackCtx.dealDamage(tower, e, stats.damage));
      return targets;
    },
    effect(tower, stats, hitEnemies) {
      hitEnemies.forEach(e => {
        _attackCtx.addEffect({ type:'line', x:tower.x, y:tower.y, tx:e.x, ty:e.y, color:'#93c5fd', timer:0.18, maxTimer:0.18 });
      });
    }
  },

  // Scatter (Byakuya/Killer Bee) — atinge todos no alcance com 65% de dano
  scatter: {
    execute(tower, stats, inRange) {
      const hits = [];
      inRange.forEach(e => {
        if (_attackCtx.effectiveCanDamage(tower, e)) { _attackCtx.dealDamage(tower, e, stats.damage * 0.65); hits.push(e); }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      _attackCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range * 0.85, color:'#f9a8d4', timer:0.28, maxTimer:0.28, r:0 });
    }
  },

  aoe_full: {
    execute(tower, stats, inRange) {
      const hits = [];
      inRange.forEach(e => {
        if (_attackCtx.effectiveCanDamage(tower, e)) { _attackCtx.dealDamage(tower, e, stats.damage); hits.push(e); }
      });
      return hits;
    },
    effect(tower, stats, hitEnemies) {
      if (hitEnemies.length === 0) return;
      _attackCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.35, maxTimer:0.35, r:0, charId:tower.charId });
    }
  }
};
