// Contexto compartilhado com game-passives.js — populado durante init do módulo Game.
const _passiveCtx = {};

const Game = (() => {
  let canvas, ctx;
  let running = false, paused = false, gameSpeed = 1;
  let lastTime = 0;

  // Render transform — uniform scale to preserve aspect ratio
  let renderScale = 1, renderOffX = 0, renderOffY = 0;

  // Game state
  let lives, gold, wave, totalWaves;
  let enemies, towers, projectiles, effects, tsunamis;
  let waveActive, spawnQueue, betweenWaves, betweenTimer, waveElapsed;
  let activeWavesCount = 1;
  let selectedTowerIdx, deployingCharId;
  let shinraTenseiActive, shinraTenseiTimer, stageModifierTimer;
  let stage, team;
  let difficulty;
  let _gojoBuffedSet = new Set();
  let isInfiniteMode = false;
  let infiniteSessionDrops = {};   // { star_exp_1: qty, ... }
  let infiniteSessionGems   = 0;

  // Stats tracking per session
  let sessionDmg = 0, sessionKills = 0, sessionTowersPlaced = 0;
  let sessionMinibosses = 0, sessionBossKilled = false;

  let screenShakeAmount = 0;
  let vizardOverlayAlpha = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // PASSIVE_SYSTEM — tabela central de todas as passivas de personagens.
  //
  // Cada chave corresponde ao campo `type` em charData.passive.
  // Hooks disponíveis por entrada:
  //   update(tower, p, dt)                          → tick por frame
  //   beforeAttack(tower, p, stats) → stats | null  → null = pula ataque
  //   onHit(tower, p, enemy, dmg) → dmg             → pode modificar dano
  //   afterAttack(tower, p, hitEnemies, attackType, stats) → efeitos pós-acerto
  //   onKill(tower, p, enemy)                       → ao confirmar kill
  //   onAnyKill(tower, p, deadEnemy)                → qualquer kill no campo
  //   onWaveEnd(tower, p)                           → ao fim de cada wave
  //   isAura: true + auraEffect(auraTower, p, attackingTower, dmg) → dmg
  //   canDamageOverride(tower, p, enemy) → bool     → bypass de req check
  //
  // Para adicionar nova passiva: crie uma entrada aqui. Não precisa tocar
  // em nenhuma outra função — os dispatchers abaixo chamam automaticamente.
  // Entradas únicas servem de template para futuras passivas similares.
  // ─────────────────────────────────────────────────────────────────────────
  const PASSIVE_SYSTEM = {

    // ── Dispatchers ────────────────────────────────────────────────────────
    _getPassives(tower) {
      const p = tower.charData?.passive;
      const base = !p ? [] : (Array.isArray(p) ? [...p] : [p]);
      const pp = tower.charData?.prestige_passives;
      if (pp && (tower.prestige || 0) > 0) {
        [1, 5, 10].forEach(t => { if (tower.prestige >= t && pp[t]) base.push(pp[t]); });
      }
      return base;
    },
    onUpdate(tower, dt) {
      this._getPassives(tower).forEach(p => this[p.type]?.update?.(tower, p, dt));
    },
    onBeforeAttack(tower, stats) {
      let s = stats;
      for (const p of this._getPassives(tower)) {
        const h = this[p.type];
        if (h?.beforeAttack) {
          const result = h.beforeAttack(tower, p, s);
          if (result === null) return null;
          s = result;
        }
      }
      return s;
    },
    onHit(tower, enemy, dmg) {
      let d = dmg;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.onHit) d = h.onHit(tower, p, enemy, d) ?? d;
      });
      return d;
    },
    onAfterAttack(tower, hitEnemies, attackType, stats) {
      this._getPassives(tower).forEach(p => this[p.type]?.afterAttack?.(tower, p, hitEnemies, attackType, stats));
    },
    onKill(tower, enemy) {
      this._getPassives(tower).forEach(p => this[p.type]?.onKill?.(tower, p, enemy));
    },
    onAnyKill(tower, deadEnemy) {
      this._getPassives(tower).forEach(p => this[p.type]?.onAnyKill?.(tower, p, deadEnemy));
    },
    onWaveEnd(tower) {
      this._getPassives(tower).forEach(p => this[p.type]?.onWaveEnd?.(tower, p));
    },
    // Retorna { text, color } para exibir badge acima da torre, ou null.
    renderBadge(tower) {
      let badge = null;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.renderBadge) badge = h.renderBadge(tower, p) || badge;
      });
      return badge;
    },
    applyAuras(attackingTower, enemy, dmg) {
      let d = dmg;
      towers.forEach(t => {
        if (t === attackingTower || t.disabled) return;
        this._getPassives(t).forEach(p => {
          const h = this[p.type];
          if (h?.isAura && h.auraEffect) d = h.auraEffect(t, p, attackingTower, d, enemy);
        });
      });
      return d;
    },
    canDamageOverride(tower, enemy) {
      let override = false;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.canDamageOverride && h.canDamageOverride(tower, p, enemy)) override = true;
      });
      return override ? true : null;
    },

  };

  // Popula _passiveCtx — PASSIVE_ENTRIES (game-passives.js) acessa estado do Game via este objeto.
  (function() {
    Object.defineProperties(_passiveCtx, {
      enemies:            { get: () => enemies,            configurable: true },
      towers:             { get: () => towers,             configurable: true },
      gold:               { get: () => gold, set: v => { gold = v; }, configurable: true },
      tsunamis:           { get: () => tsunamis,           configurable: true },
      screenShakeAmount:  { get: () => screenShakeAmount,  set: v => { screenShakeAmount = v; }, configurable: true },
      vizardOverlayAlpha: { get: () => vizardOverlayAlpha, set: v => { vizardOverlayAlpha = v; }, configurable: true },
      shinraTenseiActive: { get: () => shinraTenseiActive, configurable: true },
    });
    _passiveCtx.getPassiveValue    = getPassiveValue;
    _passiveCtx.getTowerStats      = getTowerStats;
    _passiveCtx.addEffect          = addEffect;
    _passiveCtx.spawnProjectile    = spawnProjectile;
    _passiveCtx.spawnClone         = spawnClone;
    _passiveCtx.dealDamage         = dealDamage;
    _passiveCtx.effectiveCanDamage = effectiveCanDamage;
    _passiveCtx.updateHUD          = updateHUD;
    _passiveCtx.dist2d             = dist2d;
  })();
  Object.assign(PASSIVE_SYSTEM, PASSIVE_ENTRIES);

  // ─────────────────────────────────────────────────────────────────────────
  // ENEMY_SPECIAL_HANDLERS (jogo) — versão interna que fecha sobre o estado
  // do jogo. Delega para as definições de enemies.js passando ctx.
  //
  // ctx expõe o estado necessário: towers, enemies, addEffect, toast,
  // activateShinraTensei, drainLife, dist2d, CANVAS_W, CANVAS_H.
  // ─────────────────────────────────────────────────────────────────────────
  function _enemyCtx() {
    return {
      towers, enemies,
      addEffect,
      toast: (msg, d) => UI.toast(msg, d),
      activateShinraTensei,
      drainLife() { lives = Math.max(0, lives - 1); updateHUD(); if (lives <= 0) endGame(false); },
      dist2d,
      CANVAS_W, CANVAS_H,
      // Spawna um inimigo no mapa a partir de um inimigo de origem, com overrides opcionais.
      spawnEnemy(typeId, fromEnemy, overrides = {}) {
        const _dm = getDifficultyMults();
        const spawned = createEnemy(typeId, 0);
        if (!spawned) return null;
        if (_dm.hp   !== 1.0) { spawned.maxHp = Math.round(spawned.maxHp * _dm.hp); spawned.hp = spawned.maxHp; }
        if (_dm.gold !== 1.0) { spawned.gold  = Math.round(spawned.gold  * _dm.gold); }
        spawned.dist    = Math.max(0, fromEnemy?.dist || 0);
        spawned.pathArr = fromEnemy?.pathArr;
        spawned.pathLen = fromEnemy?.pathLen;
        Object.assign(spawned, overrides);
        const pos = getPosOnPath(spawned.dist, spawned.pathArr);
        spawned.x = pos.x; spawned.y = pos.y;
        enemies.push(spawned);
        return spawned;
      }
    };
  }

  function dispatchSpecialSpawn(enemy)    { if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onSpawn?.(enemy, _enemyCtx()); }
  function dispatchSpecialUpdate(enemy, dt){ if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onUpdate?.(enemy, dt, _enemyCtx()); }
  function dispatchSpecialDeath(enemy)    { if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onDeath?.(enemy, _enemyCtx()); }

  function dispatchPtypeUpdate(enemy, dt) {
    const ctx = _enemyCtx();
    (enemy.ptypes || []).forEach(pt => PTYPE_BEHAVIORS[pt]?.onUpdate?.(enemy, dt, ctx));
  }
  function dispatchPtypeDeath(enemy) {
    const ctx = _enemyCtx();
    (enemy.ptypes || []).forEach(pt => PTYPE_BEHAVIORS[pt]?.onDeath?.(enemy, ctx));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATTACK_TYPE_HANDLERS — define como cada tipo de ataque executa e produz
  // efeito visual. Para criar um novo tipo: adicione uma entrada aqui.
  //
  // execute(tower, stats, inRange) → array de inimigos atingidos
  // effect(tower, stats, hitEnemies) → efeito visual (sem retorno)
  // ─────────────────────────────────────────────────────────────────────────
  // Seleciona alvo: normalmente o mais avançado no caminho; se invertedTargeting,
  // o mais atrasado (Ebony Maw mechanic).
  function pickTarget(tower, candidates) {
    if (tower.invertedTargeting)
      return candidates.reduce((b, e) => e.dist < b.dist ? e : b, candidates[0]);
    return candidates.reduce((b, e) => e.dist > b.dist ? e : b, candidates[0]);
  }

  const ATTACK_TYPE_HANDLERS = {

    // Template: ataque que dispara projétil contra o inimigo mais avançado.
    single_target: {
      execute(tower, stats, inRange) {
        const target = pickTarget(tower, inRange);
        if (!effectiveCanDamage(tower, target)) return [];
        spawnProjectile(tower, target, stats.damage, 'single');
        return [target];
      },
      effect(tower, stats, hitEnemies) {}
    },

    // Template: ataque em arco de 90° centrado no inimigo mais avançado.
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
          if (dot >= Math.cos(CONE_HALF) && effectiveCanDamage(tower, e)) {
            dealDamage(tower, e, stats.damage);
            hits.push(e);
          }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        const target = hitEnemies.reduce((best, e) => e.dist > best.dist ? e : best, hitEnemies[0]);
        addEffect({ type:'cone_flash', x:tower.x, y:tower.y, tx:target.x, ty:target.y, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.25, maxTimer:0.25, charId:tower.charId });
      }
    },

    // Template: ataque linear que acerta todos no corredor à frente.
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
          if (dot >= 0 && dot <= stats.range && Math.abs(ex*ny - ey*nx) < 30 && effectiveCanDamage(tower, e)) {
            dealDamage(tower, e, stats.damage);
            hits.push(e);
          }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'line', x:tower.x, y:tower.y, tx:tower._lineEndX, ty:tower._lineEndY, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.2, maxTimer:0.2, charId:tower.charId });
      }
    },

    // Template: ataque em área circular — acerta todos no raio.
    aoe: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.3, maxTimer:0.3, r:0, charId:tower.charId });
      }
    },

    // Modo Vizard Total — acerta todos no alcance com impacto visual insano
    aoe_vizard_total: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'shockwave', x:tower.x, y:tower.y, maxR:stats.range + 80, color:'#b91c1c', timer:0.4, maxTimer:0.4 });
        screenShakeAmount = 8;
        
        hitEnemies.forEach(e => {
          addEffect({ type:'hollow_burst', x:e.x, y:e.y, maxR:40, timer:0.3, maxTimer:0.3, r:0 });
        });
      }
    },

    // Alias: single é equivalente a single_target (compatibilidade de dados)
    single: {
      execute(tower, stats, inRange) { return ATTACK_TYPE_HANDLERS.single_target.execute(tower, stats, inRange); },
      effect(tower, stats, hitEnemies) { return ATTACK_TYPE_HANDLERS.single_target.effect(tower, stats, hitEnemies); }
    },

    // Pierce (Uryu) — ataca N inimigos mais próximos com flechas (count via quincy_pierce passive)
    pierce: {
      execute(tower, stats, inRange) {
        const count = stats.pierce_count || 3;
        const sorted = [...inRange].sort((a, b) => dist2d(tower.x, tower.y, a.x, a.y) - dist2d(tower.x, tower.y, b.x, b.y));
        const targets = sorted.slice(0, count).filter(e => effectiveCanDamage(tower, e));
        targets.forEach(e => dealDamage(tower, e, stats.damage));
        return targets;
      },
      effect(tower, stats, hitEnemies) {
        hitEnemies.forEach(e => {
          addEffect({ type:'line', x:tower.x, y:tower.y, tx:e.x, ty:e.y, color:'#93c5fd', timer:0.18, maxTimer:0.18 });
        });
      }
    },

    // Scatter (Byakuya) — atinge todos os inimigos no alcance com 65% de dano
    scatter: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage * 0.65); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range * 0.85, color:'#f9a8d4', timer:0.28, maxTimer:0.28, r:0 });
      }
    },

    // Template: AOE sem restrição de req (versão premium do aoe).
    aoe_full: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.35, maxTimer:0.35, r:0, charId:tower.charId });
      }
    }
  };

  // Hover position
  let hoverX = 0, hoverY = 0;

  function getDifficultyMults() {
    if (isInfiniteMode) return getInfiniteWaveMults(wave);
    if (difficulty === 'dificil')  return { hp: 1.5, gold: 1.2 };
    if (difficulty === 'lendario') return { hp: 2.2, gold: 1.4 };
    return { hp: 1.0, gold: 1.0 };
  }

  // ── Modo Infinito ──────────────────────────────────────────────────────────

  const INFINITE_TIERS = [
    { name:'Fácil',          minWave:1,  maxWave:20,  color:'#4ade80', hp:1.0,  gold:1.0 },
    { name:'Médio',          minWave:21, maxWave:30,  color:'#facc15', hp:1.8,  gold:1.2 },
    { name:'Difícil',        minWave:31, maxWave:40,  color:'#f97316', hp:3.2,  gold:1.4 },
    { name:'Muito Difícil',  minWave:41, maxWave:50,  color:'#ef4444', hp:5.5,  gold:1.6 },
    { name:'Extremo',        minWave:51, maxWave:60,  color:'#dc2626', hp:9.0,  gold:1.8 },
    { name:'Brutal',         minWave:61, maxWave:70,  color:'#9333ea', hp:15.0, gold:2.0 },
    { name:'Lendário',       minWave:71, maxWave:80,  color:'#c084fc', hp:25.0, gold:2.3 },
    { name:'Além do Limite', minWave:81, maxWave:Infinity, color:'#f0abfc', hp:40.0, gold:2.6 }
  ];

  function getInfiniteTierIdx(waveNum) {
    if (waveNum <= 20) return 0;
    if (waveNum <= 30) return 1;
    if (waveNum <= 40) return 2;
    if (waveNum <= 50) return 3;
    if (waveNum <= 60) return 4;
    if (waveNum <= 70) return 5;
    if (waveNum <= 80) return 6;
    return 7;
  }

  function getInfiniteWaveMults(waveNum) {
    const idx = getInfiniteTierIdx(waveNum);
    const tier = INFINITE_TIERS[idx];
    // Tier 7+ continua escalando a cada 10 waves
    let hp = tier.hp;
    if (idx === 7 && waveNum > 80) hp = 40 + Math.floor((waveNum - 81) / 10) * 8;
    return { hp, gold: tier.gold };
  }

  function generateInfiniteWave(waveNum) {
    const POOLS = [
      ['ninja_comum','ninja_comum','ninja_ambu','serpente'],
      ['ninja_ambu','agente_ambu','op_bandido','op_pirata_comum','serpente'],
      ['agente_ambu','op_pirata_veterano','hollow_pequeno','hollow_grande','boa_constritora'],
      ['op_homem_peixe','hollow_mascara','arrancar','caminho_animal','ninja_chuva'],
      ['caminho_humano','op_cp9_oficial','hollow_mascara','arrancar','ninja_chuva'],
      ['caminho_deus_animal','op_marinha_capitao','vasto_lorde','akatsuki_chuva','ninja_chuva_veloz','invasor','invasor_veloz'],
      ['op_marinha_elite','espada_hierro','vasto_lorde','espada_regen','invasor_veloz','invasor_blindado','invasor_regen'],
      ['op_marinha_elite','espada_hierro','espada_regen','invasor_blindado','invasor_regen','invasor_explosivo']
    ];
    const tierIdx = Math.min(getInfiniteTierIdx(waveNum), 7);
    const cur  = POOLS[tierIdx];
    const prev = tierIdx > 0 ? POOLS[tierIdx - 1] : cur;
    const pool = [...cur, ...prev.slice(0, 2)];

    const count = Math.floor(10 + waveNum * 0.85);
    const gap   = Math.max(0.35, 1.6 - tierIdx * 0.18 - (waveNum % 10) * 0.015);

    const queue = [];
    let t = 0;
    for (let i = 0; i < count; i++) {
      queue.push({ type: pool[Math.floor(Math.random() * pool.length)], delay: t });
      t += gap;
    }

    // Miniboss a cada 10 waves
    if (waveNum % 10 === 0) {
      const MB = ['deidara','itachi_uchiha','sasuke_taka','konan','caminho_deus_animal','grimmjow','nnoitra','batroc','crossbones','ronan','corvus_glaive','ebony_maw'];
      queue.push({ type: MB[Math.min(Math.floor(waveNum / 10) - 1, MB.length - 1)], delay: t + 2 });
    }
    // Boss a cada 30 waves
    if (waveNum % 30 === 0) {
      const BS = ['pain','akainu','ulquiorra','thanos_fase1'];
      queue.push({ type: BS[Math.min(Math.floor(waveNum / 30) - 1, BS.length - 1)], delay: t + 5 });
    }
    return queue;
  }

  // Chamado a cada 5 waves: dá gemas + rola Star Experience
  function giveInfiniteReward(waveNum) {
    const best = Save.get().stats.melhor_onda_infinita || 0;
    if (waveNum > best) Save.setStat('melhor_onda_infinita', waveNum);

    // Gemas baseadas no tier
    const tierIdx = getInfiniteTierIdx(waveNum);
    const gemTable = [15, 25, 40, 60, 85, 115, 150, 200];
    const gems = gemTable[Math.min(tierIdx, 7)];
    Save.addGems(gems);
    infiniteSessionGems += gems;
    UI.updateCurrencyDisplay();

    // Rolagem de Star Experience com chances baseadas na wave
    const dropped = rollInfiniteStarExp(waveNum);

    // Toast único combinando gemas + SE
    const seLabel = dropped.length > 0 ? `  ✨ ${dropped.map(lv => `SE Nv${lv}`).join(' + ')}` : '';
    UI.toast(`🏆 Wave ${waveNum}! +${gems}💎${seLabel}`, 3500);
  }

  // Rola chances de Star Experience — retorna array dos níveis que droparam
  // Fórmula: chance_i(wave) = min(100, wave/30 × base_i)%
  // Wave 30: SE1=10%, SE2=5%, SE3=2%, SE4=1%, SE5=0.5%
  function rollInfiniteStarExp(waveNum) {
    const BASE_AT_30 = [10, 5, 2, 1, 0.5];
    const dropped = [];
    BASE_AT_30.forEach((base, i) => {
      const chance = Math.min(100, (waveNum / 30) * base);
      if (Math.random() * 100 < chance) dropped.push(i + 1);
    });
    dropped.forEach(lv => {
      const key = `star_exp_${lv}`;
      Save.addMaterial(key, 1);
      infiniteSessionDrops[key] = (infiniteSessionDrops[key] || 0) + 1;
    });
    return dropped;
  }

  // Retorna o valor mais recente de um campo de passive_override nos upgrades comprados
  function getPassiveValue(tower, key, defaultVal) {
    let val = defaultVal;
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const u = tower.charData.upgrades[i];
      if (u.passive_override && u.passive_override[key] !== undefined) val = u.passive_override[key];
    }
    return val;
  }

  // Retorna o valor de active_override nos upgrades comprados
  function getActiveValue(tower, key, defaultVal) {
    let val = defaultVal;
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const u = tower.charData.upgrades[i];
      if (u.active_override && u.active_override[key] !== undefined) val = u.active_override[key];
    }
    return val;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    if (canvas.width === cw && canvas.height === ch) return;
    canvas.width = cw;
    canvas.height = ch;
    renderScale = Math.min(cw / CANVAS_W, ch / CANVAS_H);
    renderOffX = Math.floor((cw - CANVAS_W * renderScale) / 2);
    renderOffY = Math.floor((ch - CANVAS_H * renderScale) / 2);
  }

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
    resizeCanvas();
  }

  function startGame() {
    resizeCanvas(); // Ensure canvas matches container before game starts
    const stageId = UI.getSelectedStage();
    const teamIds = UI.getSelectedTeam();
    difficulty = UI.getSelectedDifficulty();
    if (!stageId || teamIds.length === 0) {
      UI.toast('Selecione ao menos uma unidade!');
      return;
    }

    stage = getStage(stageId);
    team = teamIds;
    if (!stage) return;

    const wdef = WORLDS.find(w => w.id === stage.world);
    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.className = ''; // Clear previous themes
      if (wdef) canvasEl.classList.add(`theme-${wdef.id}`);
    }
    
    if (stage.paths && stage.paths.length > 0) {
      window.currentPaths = stage.paths;
      updatePath(stage.paths[0]);
    } else if (wdef && wdef.path) {
      window.currentPaths = [wdef.path];
      updatePath(wdef.path);
    } else {
      window.currentPaths = [PATH_POINTS];
    }

    // Reset state
    isInfiniteMode = !!(stage.isInfinite);
    lives = stage.base_hp || 20;
    gold = isInfiniteMode ? 400 : 300;
    wave = 0;
    totalWaves = isInfiniteMode ? Infinity : stage.waves.length;
    activeWavesCount = 1;
    enemies = [];
    towers = [];
    projectiles = [];
    effects = [];
    tsunamis = [];
    waveActive = false;
    spawnQueue = [];

    betweenWaves = true;
    betweenTimer = 3;
    selectedTowerIdx = -1;
    deployingCharId = null;
    shinraTenseiActive = false;
    shinraTenseiTimer = 0;
    stageModifierTimer = 0;
    waveElapsed = 0;
    sessionDmg = 0; sessionKills = 0; sessionTowersPlaced = 0;
    sessionMinibosses = 0; sessionBossKilled = false;
    _gojoBuffedSet = new Set();
    infiniteSessionDrops = {};
    infiniteSessionGems  = 0;

    // Free placement (no slots)

    UI.showGame();
    renderTeamPanel();
    updateHUD();
    closeUpgradePanel();

    running = true;
    paused = false;
    gameSpeed = 1;
    lastTime = 0;
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.textContent = '⏸';
    const speedEl = document.getElementById('speed-indicator');
    if (speedEl) speedEl.textContent = '1×';
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!running) return;
    if (lastTime === 0) lastTime = ts;
    const rawDt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;
    const dt = paused ? 0 : rawDt * gameSpeed;

    update(dt, rawDt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt, rawDt) {
    if (dt === 0) return;

    // Between waves countdown
    if (betweenWaves) {
      betweenTimer -= dt;
      if (betweenTimer <= 0) {
        betweenWaves = false;
        startWave();
      }
      return;
    }

    // Spawn queue
    updateSpawn(dt);
    updateEnemiesLoop(dt);
    updateTowersLoop(dt);
    updateProjectiles(dt);
    
    if (stage && stage.modifiers && stage.modifiers.meteors_and_shinra) {
      stageModifierTimer += dt;
      if (stageModifierTimer >= 20) {
        stageModifierTimer = 0;
        triggerMeteorAndShinra();
      }
    }

    // Tsunami loop
    tsunamis.forEach(tsu => {
      tsu.dist -= tsu.speed * dt;
      const pos = getPosOnPath(tsu.dist);
      tsu.x = pos.x; tsu.y = pos.y;

      enemies.forEach(e => {
        if (e.dead || e.reached_end) return;
        if (!tsu.hitIds.has(e.uid) && dist2d(tsu.x, tsu.y, e.x, e.y) < 60) {
          tsu.hitIds.add(e.uid);
          const dmg = Math.min(e.hp, tsu.hp);
          tsu.hp -= dmg;
          dealDamage({ charData: {}, rarity: 5 }, e, dmg); // dummy tower to deal damage
        }
      });
      // Add bubble effect trail
      if (Math.random() < 0.3) {
        addEffect({ type:'ring', x:tsu.x + (Math.random()*40-20), y:tsu.y + (Math.random()*40-20), maxR:20, color:'#e0f7fa', timer:0.3, maxTimer:0.3 });
      }
    });
    tsunamis = tsunamis.filter(t => t.hp > 0 && t.dist > 0);

    // End wave conditions(dt);
    updateEffects(dt);
    updateShinraTensei(dt);
    checkWaveEnd();
  }

  function triggerMeteorAndShinra() {
    UI.toast('⚠️ O PAIN USOU SHINRA TENSEI E QUEDA DE METEOROS! ⚠️', 4000);
    
    // 1. Escolhe alvos para os meteoros (foca torres)
    const targets = [];
    if (towers.length > 0) {
      const numMeteors = Math.min(3, Math.ceil(towers.length / 3));
      for(let i = 0; i < numMeteors; i++) {
        const t = towers[Math.floor(Math.random() * towers.length)];
        targets.push({x: t.x, y: t.y});
      }
    } else {
      targets.push({x: CANVAS_W/2, y: CANVAS_H/2});
    }

    // Aplica os meteoros — stun aleatório 1-5s por torre, respeitando imunidade
    targets.forEach(pt => {
      addEffect({ type: 'meteor_strike', x: pt.x, y: pt.y, maxR: 90, color: '#f56565', timer: 1.0, maxTimer: 1.0, r: 0 });
      towers.forEach(t => {
        if (dist2d(t.x, t.y, pt.x, pt.y) <= 90 && (t.stunCooldown || 0) <= 0) {
          const stun = 1 + Math.random() * 4;
          t.miniStunTimer = Math.max((t.miniStunTimer || 0), stun);
          t.stunCooldown = stun + 5;
          t.disabled = true;
        }
      });
    });

    // 2. Onda de Choque Shinra Tensei — stun aleatório 1-5s por torre
    let maxStun = 1;
    towers.forEach(t => {
      if ((t.stunCooldown || 0) <= 0) {
        const stun = 1 + Math.random() * 4;
        t.miniStunTimer = Math.max((t.miniStunTimer || 0), stun);
        t.stunCooldown = stun + 5;
        t.disabled = true;
        if (stun > maxStun) maxStun = stun;
      }
    });

    shinraTenseiActive = true;
    shinraTenseiTimer = maxStun;
    addEffect({ type:'shockwave', x: CANVAS_W/2, y: CANVAS_H/2, maxR: 800, color: '#e74c3c', timer: 0.8, maxTimer: 0.8, r: 0 });

    enemies.forEach(e => {
      if (e.dead || e.reached_end) return;
      e.dist += 40;
      const pos = getPosOnPath(e.dist, e.pathArr);
      e.x = pos.x; e.y = pos.y;
    });
  }

  function startWave() {
    wave++;
    activeWavesCount = 1;
    spawnQueue = isInfiniteMode ? generateInfiniteWave(wave) : [...stage.waves[wave - 1]];
    waveElapsed = 0;
    waveActive = true;
    updateHUD();
    // Notifica troca de tier no Modo Infinito
    if (isInfiniteMode) {
      const tier = INFINITE_TIERS[getInfiniteTierIdx(wave)];
      const prev = INFINITE_TIERS[getInfiniteTierIdx(wave - 1)];
      if (wave > 1 && tier !== prev) {
        UI.toast(`⚡ NOVO NÍVEL: ${tier.name.toUpperCase()}`, 4000);
      }
    }
  }

  function skipWave() {
    if (betweenWaves) {
      betweenTimer = 0;
      return;
    }
    if (!waveActive || wave >= totalWaves) return;
    if (activeWavesCount >= 3) {
      UI.toast('⚠️ Limite de 2 waves extras atingido!');
      return;
    }

    const bonus = wave * 11;
    gold += bonus;
    towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

    wave++;
    activeWavesCount++;

    const newEnemies = stage.waves[wave - 1];
    const currentElapsed = waveElapsed;
    const adjusted = newEnemies.map(e => ({...e, delay: e.delay + currentElapsed}));
    spawnQueue.push(...adjusted);
    spawnQueue.sort((a, b) => a.delay - b.delay);

    updateHUD();
    UI.toast(`⏭️ Wave ${wave} chamada! +${bonus}💰`);
  }

  function updateSpawn(dt) {
    if (!waveActive) return;
    waveElapsed += dt;
    while (spawnQueue.length > 0 && waveElapsed >= spawnQueue[0].delay) {
      const next = spawnQueue.shift();
      const e = createEnemy(next.type, 0);
      if (!e) continue;
      const _dm = getDifficultyMults();
      if (_dm.hp !== 1.0)   { e.maxHp = Math.round(e.maxHp * _dm.hp); e.hp = e.maxHp; }
      if (_dm.gold !== 1.0) { e.gold  = Math.round(e.gold  * _dm.gold); }
      e.dist = 0;
      if (window.currentPaths && window.currentPaths.length > 0) {
        e.pathArr = window.currentPaths[Math.floor(Math.random() * window.currentPaths.length)];
      } else {
        e.pathArr = PATH_POINTS;
      }
      e.pathLen = getPathLength(e.pathArr);
      enemies.push(e);
      dispatchSpecialSpawn(e);
    }
  }

  function updateEnemiesLoop(dt) {
    const toRemove = [];
    enemies.forEach(e => {
      if (e.dead || e.reached_end) { toRemove.push(e); return; }

      // Status DoT
      const dot = updateEnemyStatus(e, dt);
      if (dot > 0) {
        let remaining = dot;
        if ((e.shieldHp || 0) > 0) {
          const absorbed = Math.min(e.shieldHp, remaining);
          e.shieldHp -= absorbed;
          remaining -= absorbed;
          if (e.shieldHp <= 0) {
            e.shieldHp = 0;
            const ringCol = (e.ptypes || []).includes('fortified') ? '#f59e0b' : '#60a5fa';
            addEffect({ type:'ring', x:e.x, y:e.y, maxR:60, color:ringCol, timer:0.55, maxTimer:0.55, r:0 });
            UI.toast(`🛡 Escudo de ${e.name} destruído!`, 2500);
          }
        }
        e.hp -= remaining;
        if (e.hp <= 0) { killEnemy(e); toRemove.push(e); return; }
      }

      // Special periódico do inimigo (shinra_tensei, base_drain, etc.)
      dispatchSpecialUpdate(e, dt);
      // Behaviors por ptype (regenerator, etc.)
      dispatchPtypeUpdate(e, dt);
      // Cross Mark timer (Black Widow mechanic)
      if (e.crossMarked) {
        e.crossMarkTimer = (e.crossMarkTimer || 0) - dt;
        if (e.crossMarkTimer <= 0) { e.crossMarked = false; e.crossMarkTimer = 0; }
      }

      // Movement
      const spd = getEffectiveSpeed(e) * dt;
      e.dist += spd;
      const pos = getPosOnPath(e.dist, e.pathArr);
      e.x = pos.x;
      e.y = pos.y;

      if (e.dist >= (e.pathLen || PATH_LENGTH)) {
        e.reached_end = true;
        lives = Math.max(0, lives - 1);
        updateHUD();
        toRemove.push(e);
        if (lives <= 0) {
          endGame(false);
        } else if (e.is_boss || e.is_miniboss) {
          UI.toast(`O Boss ${e.name} escapou! Missão Falhou!`, 4000);
          endGame(false);
        }
      }
    });
    toRemove.forEach(e => { enemies = enemies.filter(x => x !== e); });
  }

  function updateTowersLoop(dt) {
    const expired = [];
    towers.forEach(t => {
      if (t.isClone) {
        t.cloneTimer -= dt;
        if (t.cloneTimer <= 0) { expired.push(t); return; }
      }
      
      // Tick de passiva (tsunami timer, kill_streak decay, slow_aura, etc.)
      PASSIVE_SYSTEM.onUpdate(t, dt);

      // Ability cooldown tick
      if ((t.abilityTimer || 0) > 0) t.abilityTimer = Math.max(0, t.abilityTimer - dt);

      // Mini stun timer — genjutsu, mini_shinra_tensei
      if ((t.miniStunTimer || 0) > 0 && !t.isClone) {
        t.miniStunTimer -= dt;
        if (t.miniStunTimer <= 0) {
          t.miniStunTimer = 0;
          if (!shinraTenseiActive) t.disabled = false;
        } else {
          t.disabled = true;
        }
      }
      if ((t.stunCooldown || 0) > 0) t.stunCooldown = Math.max(0, t.stunCooldown - dt);
      // Verdict timer — Ronan: silencia a torre com maior DPS
      if (t.verdictActive) {
        t.verdictTimer = (t.verdictTimer || 0) - dt;
        if (t.verdictTimer <= 0) { t.verdictActive = false; t.verdictTimer = 0; }
      }
      // Inverted targeting timer — Ebony Maw: inverte o alvo
      if (t.invertedTargeting) {
        t.invertedTimer = (t.invertedTimer || 0) - dt;
        if (t.invertedTimer <= 0) { t.invertedTargeting = false; t.invertedTimer = 0; }
      }
      // DPS tracking (janela de 1s) — usado pela mecânica do Ronan
      t._dpsTimer = (t._dpsTimer || 0) + dt;
      if (t._dpsTimer >= 1.0) {
        t.realtimeDPS = (t._dmgAccum || 0) / t._dpsTimer;
        t._dmgAccum = 0;
        t._dpsTimer = 0;
      }
      if (t.disabled || t.verdictActive) return;
      t.attackTimer -= dt;
      if (t.attackTimer <= 0) {
        const stats = getTowerStats(t);
        if (stats.type === 'none' || stats.attack_speed <= 0) { t.attackTimer = 9999; return; }
        const frenzyMult = (t._frenzyTimer || 0) > 0 ? (t._frenzyMult || 1) : (t._vizardActive ? 2.0 : 1.0);
        t.attackTimer = 1 / (stats.attack_speed * frenzyMult);
        tryAttack(t, stats);
      }
    });
    if (expired.length) towers = towers.filter(t => !expired.includes(t));
    // Atualiza set de torres buffadas pela aura do Gojo (uma vez por tick, não por frame)
    _gojoBuffedSet.clear();
    towers.forEach(gt => {
      const gp = gt.charData?.passive;
      if (gp?.type !== 'damage_aura' || gt.disabled) return;
      const gr = getTowerStats(gt).range;
      towers.forEach(t => { if (t !== gt && dist2d(gt.x, gt.y, t.x, t.y) <= gr) _gojoBuffedSet.add(t); });
    });
  }

  function effectiveCanDamage(tower, enemy) {
    const override = PASSIVE_SYSTEM.canDamageOverride(tower, enemy);
    if (override !== null) return override;
    return canTowerDamage(tower.upgradeLevel, enemy.req);
  }

  function tryAttack(tower, stats) {
    const inRange = enemies.filter(e => !e.dead && !e.reached_end && dist2d(tower.x, tower.y, e.x, e.y) <= stats.range);
    if (inRange.length === 0) return;

    // Passiva pré-ataque: pode modificar stats ou retornar null para pular
    const modStats = PASSIVE_SYSTEM.onBeforeAttack(tower, stats);
    if (modStats === null) return;
    stats = modStats;

    const handler = ATTACK_TYPE_HANDLERS[stats.type];
    if (!handler) return;

    const hitEnemies = handler.execute(tower, stats, inRange);

    // Status do upgrade aplicado imediatamente ao acertar
    if (tower.statusEffect && hitEnemies.length > 0) {
      hitEnemies.forEach(e => applyStatus(e, tower.statusEffect.type, tower.statusEffect));
    }

    // Passiva pós-ataque: double hit, clone spawning, etc.
    PASSIVE_SYSTEM.onAfterAttack(tower, hitEnemies, stats.type, stats);

    // Efeito visual do tipo de ataque
    handler.effect(tower, stats, hitEnemies);
  }

  function spawnClone(origin) {
    const p = origin.charData.passive;
    const maxClones = getPassiveValue(origin, 'maxClones', p.maxClones);
    const cloneDuration = getPassiveValue(origin, 'duration', p.duration);
    const existing = towers.filter(t => t.isClone && t.charId === origin.charId).length;
    if (existing >= maxClones) return;

    const angle = Math.random() * Math.PI * 2;
    const r = 36 + Math.random() * 28;
    const cx = Math.max(24, Math.min(CANVAS_W - 24, origin.x + Math.cos(angle) * r));
    const cy = Math.max(24, Math.min(CANVAS_H - 36, origin.y + Math.sin(angle) * r));

    towers.push({
      slotId: null, charId: origin.charId,
      x: cx, y: cy,
      rarity: origin.rarity, initials: origin.initials,
      charData: origin.charData,
      level: origin.level, upgradeLevel: origin.upgradeLevel,
      disabled: false,
      attackTimer: Math.random() * (1 / getTowerStats(origin).attack_speed),
      statusEffect: origin.statusEffect, currentType: origin.currentType,
      isClone: true, cloneTimer: cloneDuration
    });
    UI.toast(`🌀 Clone de Naruto invocado! (${cloneDuration}s)`, 2000);
  }

  function spawnProjectile(tower, target, damage, type) {
    const dx = target.x - tower.x, dy = target.y - tower.y;
    projectiles.push({
      x: tower.x, y: tower.y,
      target, damage, tower,
      speed: 300,
      color: RARITY_COLORS[tower.rarity],
      charId: tower.charId,
      angle: Math.atan2(dy, dx),
      dead: false
    });
  }

  function dealDamage(tower, enemy, damage) {
    if (enemy.dead || enemy.reached_end) return;

    // Passiva do atacante (multiplicadores, status, efeitos colaterais)
    let dmg = PASSIVE_SYSTEM.onHit(tower, enemy, damage);

    // Auras de torres aliadas próximas
    dmg = PASSIVE_SYSTEM.applyAuras(tower, enemy, dmg);

    // Medo (Cero Oscuras): +25% dano recebido de toda fonte
    if (enemy.status?.medo?.active) dmg *= 1.25;
    // Cross Mark (Black Widow): inimigo marcado recebe bônus de dano de todas as fontes
    if (enemy.crossMarked) dmg *= (1 + (enemy.crossMarkBonus || 0.25));

    if ((enemy.shieldHp || 0) > 0) {
      const absorbed = Math.min(enemy.shieldHp, dmg);
      enemy.shieldHp -= absorbed;
      dmg -= absorbed;
      if (enemy.shieldHp <= 0) {
        enemy.shieldHp = 0;
        const ringCol = (enemy.ptypes || []).includes('fortified') ? '#f59e0b' : '#60a5fa';
        addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:60, color:ringCol, timer:0.55, maxTimer:0.55, r:0 });
        UI.toast(`🛡 Escudo de ${enemy.name} destruído!`, 2500);
      }
      if (dmg <= 0) { enemy.hitFlash = 0.1; return; }
    }

    enemy.hp -= dmg;
    enemy.hitFlash = 0.1;
    sessionDmg += dmg;
    if (tower) tower._dmgAccum = (tower._dmgAccum || 0) + dmg;

    if (enemy.hp <= 0) killEnemy(enemy, tower);
  }

  function killEnemy(enemy, killingTower = null) {
    if (enemy.dead) return;
    enemy.dead = true;
    gold += enemy.gold;
    sessionKills++;
    if (enemy.is_miniboss) sessionMinibosses++;
    if (enemy.is_boss) sessionBossKilled = true;
    addEffect({ type:'death', x:enemy.x, y:enemy.y, color:enemy.col, timer:0.4 });
    updateHUD();

    // Passiva da torre que deu o kill
    if (killingTower) PASSIVE_SYSTEM.onKill(killingTower, enemy);

    // Passivas observadoras em todas as torres (L kill_gold, etc.)
    towers.forEach(t => PASSIVE_SYSTEM.onAnyKill(t, enemy));

    // Special de morte do inimigo (explosion, etc.)
    dispatchSpecialDeath(enemy);
    // Behaviors de morte por ptype (clooner, bomber, kamikaze, etc.)
    dispatchPtypeDeath(enemy);

    // Spawn ao morrer
    if (enemy.on_death) {
      const _dm = getDifficultyMults();
      for (let i = 0; i < enemy.on_death.count; i++) {
        const spawned = createEnemy(enemy.on_death.type, 0);
        if (spawned) {
          if (_dm.hp !== 1.0)   { spawned.maxHp = Math.round(spawned.maxHp * _dm.hp); spawned.hp = spawned.maxHp; }
          if (_dm.gold !== 1.0) { spawned.gold  = Math.round(spawned.gold  * _dm.gold); }
          spawned.dist = Math.max(0, enemy.dist - (i * 20));
          spawned.pathArr = enemy.pathArr;
          spawned.pathLen = enemy.pathLen;
          const pos = getPosOnPath(spawned.dist, spawned.pathArr);
          spawned.x = pos.x; spawned.y = pos.y;
          enemies.push(spawned);
        }
      }
    }
  }

  function updateProjectiles(dt) {
    projectiles = projectiles.filter(p => {
      if (p.dead) return false;
      if (p.target.dead || p.target.reached_end) { p.dead = true; return false; }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 10) {
        if (effectiveCanDamage(p.tower, p.target)) dealDamage(p.tower, p.target, p.damage);
        if (p.tower.statusEffect) applyStatus(p.target, p.tower.statusEffect.type, { duration: p.tower.statusEffect.duration });
        p.dead = true;
        return false;
      }
      p.angle = Math.atan2(dy, dx);
      const spd = p.speed * dt;
      p.x += (dx/d)*spd;
      p.y += (dy/d)*spd;
      return true;
    });
  }

  function updateEffects(dt) {
    if (screenShakeAmount > 0) screenShakeAmount = Math.max(0, screenShakeAmount - dt * 30);
    if (vizardOverlayAlpha > 0) vizardOverlayAlpha = Math.max(0, vizardOverlayAlpha - dt * 0.05);

    effects = effects.filter(e => {
      e.timer -= dt;
      // Clamp radius to >= 0 to prevent ctx.arc errors with negative values
      if (e.type === 'ring')         e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 0.35)));
      if (e.type === 'shockwave')    e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 1.0)));
      if (e.type === 'hollow_burst') e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 0.50)));
      return e.timer > 0;
    });
  }

  function activateShinraTensei() {
    let maxStun = 1;
    towers.forEach(t => {
      if ((t.stunCooldown || 0) <= 0) {
        const stun = 1 + Math.random() * 4;
        t.miniStunTimer = Math.max((t.miniStunTimer || 0), stun);
        t.stunCooldown = stun + 5;
        t.disabled = true;
        if (stun > maxStun) maxStun = stun;
      }
    });
    shinraTenseiActive = true;
    shinraTenseiTimer = maxStun;
    addEffect({ type:'shockwave', x:400, y:240, maxR:600, color:'#e74c3c', timer:1.0, r:0 });
    UI.toast('⚡ SHINRA TENSEI! Torres stunadas aleatoriamente!', 4000);
  }

  function updateShinraTensei(dt) {
    if (!shinraTenseiActive) return;
    shinraTenseiTimer -= dt;
    if (shinraTenseiTimer <= 0) {
      shinraTenseiActive = false;
      // Só reativa torres que não estão sob mini-stun
      towers.forEach(t => { if ((t.miniStunTimer || 0) <= 0) t.disabled = false; });
    }
  }

  function checkWaveEnd() {
    if (!waveActive) return;
    if (spawnQueue.length === 0 && enemies.length === 0) {
      waveActive = false;
      // Wave bonus
      const bonus = 100;
      gold += bonus;
      updateHUD();
      if (bonus > 0) UI.toast(`Wave ${wave} completa! +${bonus} 💰`);

      // Passiva onWaveEnd de cada torre (wave_gold, etc.)
      towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

      if (isInfiniteMode) {
        // A cada 5 waves: gemas + rolagem de Star Experience
        if (wave % 5 === 0) giveInfiniteReward(wave);
        betweenWaves = true;
        betweenTimer = 3;
      } else if (wave >= totalWaves) {
        endGame(true);
      } else {
        betweenWaves = true;
        betweenTimer = 3;
      }
    }
  }

  function endGame(victory) {
    if (!running) return;
    running = false;
    // Update stats
    Save.incStat('dano_total_causado', Math.round(sessionDmg));
    Save.incStat('inimigos_derrotados', sessionKills);
    Save.incStat('torres_colocadas', sessionTowersPlaced);
    if (sessionMinibosses > 0) Save.incStat('minibosses_derrotados', sessionMinibosses);
    if (sessionBossKilled) { Save.setStat('boss_pain_derrotado', 1); }

    if (!victory) {
      if (isInfiniteMode) {
        const best = Save.get().stats.melhor_onda_infinita || 0;
        if (wave > best) Save.setStat('melhor_onda_infinita', wave);
        Save.incStat('ondas_infinito', wave);
      }
      Missions.check();
      UI.showPostBattle({
        victory: false,
        infiniteWave:    isInfiniteMode ? wave : 0,
        infiniteDrops:   isInfiniteMode ? { ...infiniteSessionDrops } : null,
        infiniteGems:    isInfiniteMode ? infiniteSessionGems : 0
      });
      return;
    }
    if (isInfiniteMode) return; // modo infinito não tem vitória, apenas derrota

    // Victory rewards
    const gemMap = { normal:50, dificil:80, lendario:120 };
    let gems = gemMap[difficulty] || 50;
    const stageId = stage.id;
    const firstTime = !Save.isStageComplete(stageId, difficulty);
    if (firstTime) gems += 50;
    const isBossFase = stage?.isBoss || false;
    if (isBossFase && sessionBossKilled) gems += 30;

    // Material drop
    const dropsAcheived = [];

    if (stage.drops) {
      const currentPity = Save.get().stats['pity_' + stageId] || 0;
      let pityTriggered = false;
      let hasPityRule = false;
      
      for (const drop of stage.drops) {
        if (drop.pity) hasPityRule = true;
        
        // Check pity
        if (drop.pity && currentPity + 1 >= drop.pity && !pityTriggered) {
          dropsAcheived.push(drop.id);
          pityTriggered = true;
          continue;
        }
        
        // Independent Roll
        const roll = Math.random() * 100;
        if (roll <= drop.chance) {
          dropsAcheived.push(drop.id);
          if (drop.pity) pityTriggered = true;
        }
      }
      
      if (hasPityRule) {
        if (pityTriggered) {
          Save.setStat('pity_' + stageId, 0);
        } else {
          Save.setStat('pity_' + stageId, currentPity + 1);
        }
      }
    } else {
      // Fallback para fases sem lista de drops explícita
      dropsAcheived.push('ninja_generico_1');
    }

    dropsAcheived.forEach(matId => {
      const charDrop = typeof getCharById !== 'undefined' ? getCharById(matId) : null;
      if (charDrop && charDrop.playable) {
        Save.addUnit(matId);
      } else {
        Save.addMaterial(matId);
      }
    });

    Save.addGems(gems);
    Save.markStageComplete(stageId, difficulty);
    Save.setStat('fases_completas', Object.keys(Save.get().fases_completas).length);

    // Completude de mundo — data-driven via WORLDS[].completionStat
    WORLDS.forEach(w => {
      if (!w.completionStat) return;
      const worldStages = getStagesByWorld(w.id);
      if (worldStages.every(s => Save.isStageComplete(s.id, 'normal')))
        Save.setStat(w.completionStat, worldStages.length);
    });

    let bonusGems = 0;
    if (isBossFase && firstTime) {
      bonusGems = 100;
      Save.addGems(bonusGems);
      Save.addMaterial('ninja_generico_3');
    }

    Missions.check();
    UI.showPostBattle({ victory: true, gems, materials: dropsAcheived, bonusGems: firstTime ? Math.max(50, bonusGems) : 0 });
  }

  // Tower management
  function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left - renderOffX) / renderScale;
    const cy = (e.clientY - rect.top  - renderOffY) / renderScale;

    if (deployingCharId) {
      if (isValidPlacement(cx, cy)) {
        deployTower(cx, cy, deployingCharId);
        deployingCharId = null;
        renderTeamPanel();
      } else {
        UI.toast('Local inválido!');
      }
      return;
    }

    // Check if clicking existing tower
    for (let i = 0; i < towers.length; i++) {
      const t = towers[i];
      if (dist2d(cx, cy, t.x, t.y) < 30) {
        selectTower(i);
        return;
      }
    }
    selectedTowerIdx = -1;
    deployingCharId = null;
    renderTeamPanel();
    closeUpgradePanel();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    hoverX = (e.clientX - rect.left - renderOffX) / renderScale;
    hoverY = (e.clientY - rect.top  - renderOffY) / renderScale;
  }

  function deployTower(x, y, charId) {
    const char = getCharById(charId);
    const unitData = Save.getBestUnitData(charId);
    if (!char || !unitData) return;
    if (gold < char.deploy_cost) { UI.toast('Ouro insuficiente!'); return; }
    // 6★: 1 cópia única por tipo | demais: máximo 3
    const maxCopies = char.rarity >= 6 ? 1 : 3;
    const copies = towers.filter(t => t.charId === charId && !t.isClone).length;
    if (copies >= maxCopies) {
      const msg = char.rarity >= 6
        ? `Apenas 1 ${char.name} pode estar no campo! (regra 6★)`
        : `Máximo de 3 cópias de ${char.name} no campo!`;
      UI.toast(msg, 2000); return;
    }

    gold -= char.deploy_cost;
    sessionTowersPlaced++;
    const stats = getCurrentStats(char, unitData.nivel);

    const newTower = {
      slotId: null, charId, x, y,
      rarity: char.rarity, initials: char.initials,
      charData: char, level: unitData.nivel,
      upgradeLevel: 0, disabled: shinraTenseiActive,
      attackTimer: 0, statusEffect: null, currentType: stats.type,
      prestige: unitData.prestige || 0
    };
    towers.push(newTower);
    updateHUD();
    Save.incStat('torres_colocadas');
    Missions.check();
  }

  function selectTower(idx) {
    selectedTowerIdx = idx;
    if (idx < 0 || !towers[idx]) {
      closeUpgradePanel();
      return;
    }
    openUpgradePanel(towers[idx], idx);
  }

  function openUpgradePanel(tower, slotIdx) {
    const panel = document.getElementById('upgrade-panel');
    const nameEl = document.getElementById('upgrade-unit-name');
    const optsEl = document.getElementById('upgrade-options');
    if (!panel) return;

    const char = getCharById(tower.charId);
    const stats = getTowerStats(tower);
    const passives = char?.passive ? (Array.isArray(char.passive) ? char.passive : [char.passive]) : [];
    const passiveHtml = passives.map(p => `<div class="upg-passive">⚡ ${p.label}</div>`).join('');
    nameEl.innerHTML = `<span style="background:${RARITY_COLORS[tower.rarity]}" class="tower-badge">${tower.initials}</span> ${char?.name} | Lv${tower.level}`;
    panel.querySelectorAll('.upg-passive').forEach(el => el.remove());
    if (passiveHtml) nameEl.insertAdjacentHTML('afterend', passiveHtml);

    optsEl.innerHTML = '';

    // ── Status atuais da torre ─────────────────────────────────────────────
    const typeLabels = {
      single_target:'Alvo único', single:'Alvo único', linha:'Linha',
      cone:'Cone', aoe:'Área', aoe_full:'Área total', aoe_vizard_total:'Vizard AOE', pierce:'Perfura 3',
      scatter:'Dispersão', none:'Sem ataque'
    };
    const frenzyMult   = (tower._frenzyTimer   || 0) > 0 ? ` ×${tower._frenzyMult||1} FRENZY` : '';
    const surgeCount   = tower._surgeCount   != null ? ` (${tower._surgeCount}/${char?.prestige_passives?.[1]?.trigger_at || char?.prestige_passives?.[5]?.trigger_at || '?'})` : '';
    const prestigeRow  = (tower.prestige || 0) > 0
      ? `<div class="upg-stat-row" style="color:#fbbf24">✦ Prestígio ${tower.prestige} <span style="opacity:0.7">(+${tower.prestige*20}% dano, +${tower.prestige*6}% alc.)</span></div>`
      : '';
    const statsEl = document.createElement('div');
    statsEl.className = 'upg-stats-block';
    statsEl.innerHTML = `
      <div class="upg-stat-row"><span>⚔ Dano</span><span>${Math.round(stats.damage)}</span></div>
      <div class="upg-stat-row"><span>🎯 Alcance</span><span>${Math.round(stats.range)}px</span></div>
      <div class="upg-stat-row"><span>⚡ Vel. Ataque</span><span>${stats.attack_speed.toFixed(2)}/s${frenzyMult}</span></div>
      <div class="upg-stat-row"><span>🗡 Tipo</span><span>${typeLabels[stats.type] || stats.type}</span></div>
      ${prestigeRow}`;
    optsEl.appendChild(statsEl);

    // Active ability button (Gojo)
    if (char?.active_ability) {
      const aa = char.active_ability;
      const cd = Math.ceil(Math.max(0, tower.abilityTimer || 0));
      const ready = cd <= 0;
      const abilWrap = document.createElement('div');
      abilWrap.className = 'upg-ability-wrap';
      const abilBtn = document.createElement('button');
      abilBtn.className = `btn btn-active-ability${ready ? '' : ' btn-ability-cd'}`;
      abilBtn.disabled = !ready;
      abilBtn.innerHTML = ready
        ? `⚡ ${aa.label} <span class="ability-badge ability-badge--ready">PRONTO</span>`
        : `⚡ ${aa.label} <span class="ability-badge ability-badge--cd">${cd}s</span>`;
      const capturedIdx = slotIdx;
      abilBtn.addEventListener('click', () => Game.useAbility(capturedIdx));
      abilWrap.appendChild(abilBtn);
      optsEl.appendChild(abilWrap);
    }

    (char?.upgrades || []).forEach((upg, i) => {
      const purchased = i < tower.upgradeLevel;
      const isNext = i === tower.upgradeLevel;
      const canAfford = gold >= upg.cost;
      const div = document.createElement('div');
      div.className = `upg-item${purchased ? ' upg-done' : isNext ? ' upg-next' : ' upg-locked'}`;
      div.innerHTML = `
        <div class="upg-name">${upg.name} ${purchased ? '✓' : ''}</div>
        <div class="upg-desc">${upg.desc}</div>
        <div class="upg-cost">${purchased ? 'Comprado' : `${upg.cost} 💰 ${isNext ? '<span style="font-size:9px;color:#aaa;margin-left:5px;">(U)</span>' : ''}`}</div>`;
      if (isNext && canAfford) {
        div.addEventListener('click', () => buyUpgrade(slotIdx, i));
        div.style.cursor = 'pointer';
      }
      optsEl.appendChild(div);
    });

    // Indicador de MAX (todas as melhorias compradas)
    const totalUpgrades = char?.upgrades?.length || 0;
    if (totalUpgrades > 0 && tower.upgradeLevel >= totalUpgrades) {
      const maxDiv = document.createElement('div');
      maxDiv.style.cssText = 'text-align:center;padding:8px 0;color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:0.08em;opacity:0.85';
      maxDiv.textContent = '✦ MAXIMIZADO ✦';
      optsEl.appendChild(maxDiv);
    }

    // Sell button value
    const hasEconomy = passives.some(p => p.type === 'edo_tensei_economy');
    let totalInvested = char?.deploy_cost || 0;
    for(let i=0; i<tower.upgradeLevel; i++){
      if(char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
    }
    const sellVal = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
    const sellBtn = panel.querySelector('.btn-sell');
    if (sellBtn) sellBtn.textContent = `Vender (+${sellVal} 💰) [Del]`;

    panel.style.display = 'flex';
  }

  function buyUpgrade(towerIdx, upgradeIdx) {
    const tower = towers[towerIdx];
    if (!tower) return;
    const char = getCharById(tower.charId);
    const upg = char?.upgrades[upgradeIdx];
    if (!upg || tower.upgradeLevel !== upgradeIdx) return;
    if (gold < upg.cost) { UI.toast('Ouro insuficiente!'); return; }

    gold -= upg.cost;
    tower.upgradeLevel++;
    tower._statsCache = null;
    if (upg.status_effect) tower.statusEffect = upg.status_effect;
    if (upg.type) tower.currentType = upg.type;
    updateHUD();
    openUpgradePanel(tower, towerIdx);
    UI.toast(`✅ ${upg.name} ativado!`);
  }

  function sellTower() {
    if (selectedTowerIdx < 0) return;
    const tower = towers[selectedTowerIdx];
    if (!tower) return;
    const char = getCharById(tower.charId);

    const _passives = char?.passive ? (Array.isArray(char.passive) ? char.passive : [char.passive]) : [];
    const hasEconomy = _passives.some(p => p.type === 'edo_tensei_economy');
    let totalInvested = char?.deploy_cost || 0;
    for(let i=0; i<tower.upgradeLevel; i++){
      if(char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
    }
    const val = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
    
    gold += val;
    towers.splice(selectedTowerIdx, 1);
    selectedTowerIdx = -1;
    closeUpgradePanel();
    updateHUD();
  }

  function buyNextUpgrade() {
    if (selectedTowerIdx < 0) return;
    const tower = towers[selectedTowerIdx];
    if (tower) buyUpgrade(selectedTowerIdx, tower.upgradeLevel);
  }

  function deselectTower() { 
    selectedTowerIdx = -1; 
    deployingCharId = null;
    closeUpgradePanel(); 
    renderTeamPanel();
  }
  function closeUpgradePanel() {
    const p = document.getElementById('upgrade-panel');
    if (p) p.style.display = 'none';
  }

  function getTowerStats(tower) {
    if (tower._statsCache) return tower._statsCache;
    const stats = getCurrentStats(tower.charData, tower.level);
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const upg = tower.charData.upgrades[i];
      if (upg.damage_mult) stats.damage *= upg.damage_mult;
      if (upg.range_mult) stats.range *= upg.range_mult;
      if (upg.speed_mult) stats.attack_speed *= upg.speed_mult;
      if (upg.type) stats.type = upg.type;
    }
    if ((tower.prestige || 0) > 0) {
      stats.damage *= 1 + tower.prestige * 0.20;
      stats.range  *= 1 + tower.prestige * 0.06;
    }
    tower._statsCache = stats;
    return stats;
  }

  function togglePause() {
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? '▶' : '⏸';
  }

  function toggleSpeed() {
    gameSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1;
    const ind = document.getElementById('speed-indicator');
    if (ind) {
      ind.textContent = gameSpeed + '×';
      ind.style.color = gameSpeed === 1 ? '' : gameSpeed === 2 ? '#fbbf24' : '#f87171';
    }
  }

  function retryStage() { startGame(); }

  function updateHUD() {
    const el = id => document.getElementById(id);
    if (el('hud-lives')) el('hud-lives').textContent = lives;
    if (el('hud-gold')) el('hud-gold').textContent = gold;
    if (el('hud-wave')) el('hud-wave').textContent = wave;
    if (isInfiniteMode) {
      if (el('hud-total-waves')) el('hud-total-waves').textContent = '∞';
      if (el('hud-wave-fill')) {
        const tier = INFINITE_TIERS[getInfiniteTierIdx(wave)];
        const waveInTier = wave - tier.minWave + 1;
        const tierLen = tier.maxWave === Infinity ? 10 : tier.maxWave - tier.minWave + 1;
        el('hud-wave-fill').style.width = `${Math.min(100, Math.round((waveInTier / tierLen) * 100))}%`;
        el('hud-wave-fill').style.background = tier.color;
      }
    } else {
      if (el('hud-total-waves')) el('hud-total-waves').textContent = totalWaves || 10;
      if (el('hud-wave-fill')) el('hud-wave-fill').style.width = `${Math.min(100, Math.round((wave / (totalWaves || 10)) * 100))}%`;
    }
    if (el('hud-phase-name')) el('hud-phase-name').textContent = stage?.name || '';
    const skipBtn = el('btn-skip');
    if (skipBtn) {
      if (waveActive && wave < (totalWaves || 10)) {
        skipBtn.title = `Antecipar próxima wave: +${wave * 11}\u{1F4B0} (S)`;
      } else {
        skipBtn.title = 'Antecipar Wave (S)';
      }
    }

    const panel = el('team-panel');
    if (panel) {
      Array.from(panel.children).forEach(u => {
        const charId = u.dataset.charId;
        if (charId) {
          const char = getCharById(charId);
          if (char) {
            if (gold >= char.deploy_cost) u.classList.remove('cant-afford');
            else u.classList.add('cant-afford');
          }
        }
      });
    }

    UI.updateCurrencyDisplay();
  }

  function renderTeamPanel() {
    const panel = document.getElementById('team-panel');
    if (!panel) return;
    panel.innerHTML = '';
    team.forEach(charId => {
      const char = getCharById(charId);
      const unitData = Save.getBestUnitData(charId);
      if (!char) return;
      const cost = char.deploy_cost;
      const copies = towers.filter(t => t.charId === charId && !t.isClone).length;
      const atLimit = copies >= 3;
      const div = document.createElement('div');
      div.className = `tp-unit${deployingCharId === charId ? ' deploying' : ''}${(gold < cost || atLimit) ? ' cant-afford' : ''}`;
      div.dataset.charId = charId;
      const copyLabel = copies > 0 ? ` <span style="color:${atLimit?'#f87171':'#fbbf24'};font-size:9px">${copies}/3</span>` : '';
      div.innerHTML = `
        <div class="tp-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div class="tp-name">${char.name}${copyLabel}</div>
        <div class="tp-cost">${atLimit ? '🚫 Máximo' : `${cost}💰 Lv${unitData?.nivel||1}`}</div>`;
      div.addEventListener('click', () => {
        if (gold < cost) { UI.toast('Ouro insuficiente!'); return; }
        deployingCharId = deployingCharId === charId ? null : charId;
        renderTeamPanel();
        selectedTowerIdx = -1;
        closeUpgradePanel();
        UI.toast(deployingCharId ? `Clique em um slot para colocar ${char.name}` : 'Seleção cancelada');
      });
      panel.appendChild(div);
    });
  }

  // RENDER
  function render() {
    // Clear full canvas (covers letterbox bars when aspect ratio differs)
    ctx.fillStyle = '#04040c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply uniform scale + centering so game renders in correct proportions
    ctx.save();
    let cx = renderOffX;
    let cy = renderOffY;
    if (screenShakeAmount > 0) {
      cx += (Math.random() - 0.5) * screenShakeAmount;
      cy += (Math.random() - 0.5) * screenShakeAmount;
    }
    ctx.translate(cx, cy);
    ctx.scale(renderScale, renderScale);

    drawBackground();
    drawPath();
    drawTowerRangePreview();
    drawPlacementPreview();
    drawTowers();
    drawEnemies();
    drawProjectiles();

    // Draw Tsunamis
    tsunamis.forEach(tsu => {
      ctx.save();
      ctx.shadowBlur = 15; ctx.shadowColor = '#5b9cf6';
      ctx.fillStyle = 'rgba(91, 156, 246, 0.7)';
      ctx.beginPath();
      ctx.arc(tsu.x, tsu.y, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // HP Bar for Tsunami
      const hpPct = Math.max(0, tsu.hp / tsu.maxHp);
      ctx.fillStyle = '#111';
      ctx.fillRect(tsu.x - 30, tsu.y - 60, 60, 6);
      ctx.fillStyle = '#5b9cf6';
      ctx.fillRect(tsu.x - 30, tsu.y - 60, 60 * hpPct, 6);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(tsu.x - 30, tsu.y - 60, 60, 6);
      ctx.restore();
    });

    drawEffects();
    
    // Dark Mode (Fog of War) logic
    let wantsDarkMode = (stage && stage.modifiers && stage.modifiers.dark_mode);

    if (wantsDarkMode) {
      if (!window.darkCanvas) {
        window.darkCanvas = document.createElement('canvas');
        window.darkCanvas.width = CANVAS_W;
        window.darkCanvas.height = CANVAS_H;
        window.darkCtx = window.darkCanvas.getContext('2d');
      }
      const dCtx = window.darkCtx;
      dCtx.globalCompositeOperation = 'source-over';
      dCtx.fillStyle = 'rgba(0,0,0,0.98)';
      dCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      dCtx.globalCompositeOperation = 'destination-out';
      
      // Illuminate ao redor das torres
      towers.forEach(t => {
        const rad = getTowerStats(t).range || 150;
        const grad = dCtx.createRadialGradient(t.x, t.y, 0, t.x, t.y, rad);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.arc(t.x, t.y, rad, 0, Math.PI * 2);
        dCtx.fill();
      });

      // Keep the path end (base) slightly visible
      const pathsToDraw = window.currentPaths || [PATH_POINTS];
      if (pathsToDraw && pathsToDraw[0] && pathsToDraw[0].length > 0) {
        const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
        const grad = dCtx.createRadialGradient(endP.x, endP.y, 0, endP.x, endP.y, 100);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.arc(endP.x, endP.y, 100, 0, Math.PI * 2);
        dCtx.fill();
      }
      
      ctx.drawImage(window.darkCanvas, 0, 0);
    }

    if (vizardOverlayAlpha > 0) {
      ctx.save();
      const cornerDist = Math.hypot(CANVAS_W/2, CANVAS_H/2);
      
      // Sombra preta avançando pelas bordas e cantos
      const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, cornerDist * 0.65, CANVAS_W/2, CANVAS_H/2, cornerDist * 1.05);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, `rgba(10, 0, 0, ${vizardOverlayAlpha * 0.95})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      // Vermelho sangue restrito puramente aos cantos
      const cornerGrad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, cornerDist * 0.8, CANVAS_W/2, CANVAS_H/2, cornerDist);
      cornerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      cornerGrad.addColorStop(1, `rgba(180, 0, 0, ${vizardOverlayAlpha * 0.9})`);
      ctx.fillStyle = cornerGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }

    drawOverlay();

    ctx.restore();
  }

  function drawBackground() {
    const isOP = stage?.world === 'onepiece';
    const isNaruto = stage?.world === 'naruto';
    
    if (isOP) {
      const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
      grad.addColorStop(0, '#102a40'); grad.addColorStop(1, '#05121c');
      ctx.fillStyle = grad;
    } else if (isNaruto) {
      const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
      grad.addColorStop(0, '#2b3a20'); grad.addColorStop(1, '#11180c');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#080e08';
    }
    
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Subtle grid
    ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.015)' : isNaruto ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke();
    }
    // Scattered dots (trees/bushes or sea rocks/foam)
    const dots = [[60,60],[140,380],[220,200],[380,50],[420,430],[500,90],[570,300],[650,430],[760,80],[850,250],[950,420],[900,100]];
    dots.forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2);
      ctx.fillStyle = isOP ? 'rgba(15, 60, 80, 0.6)' : isNaruto ? 'rgba(46, 204, 113, 0.15)' : 'rgba(30,60,30,0.6)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+8, y-4, 9, 0, Math.PI*2);
      ctx.fillStyle = isOP ? 'rgba(20, 80, 100, 0.5)' : isNaruto ? 'rgba(39, 174, 96, 0.2)' : 'rgba(24,50,24,0.5)'; ctx.fill();
    });
  }

  function drawPath() {
    const isOP = stage?.world === 'onepiece';
    const isNaruto = stage?.world === 'naruto';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    
    const pathsToDraw = window.currentPaths || [PATH_POINTS];
    
    pathsToDraw.forEach(pArr => {
      if (!pArr || pArr.length === 0) return;
      // Outer glow
      ctx.strokeStyle = isOP ? 'rgba(52, 152, 219, 0.15)' : isNaruto ? 'rgba(230, 126, 34, 0.12)' : 'rgba(180,140,60,0.12)';
      ctx.lineWidth = 46;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Dark shadow / Base path
      ctx.strokeStyle = isOP ? 'rgba(26, 82, 118, 0.6)' : isNaruto ? 'rgba(110, 44, 0, 0.6)' : 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Inner track
      ctx.strokeStyle = isOP ? '#2980b9' : isNaruto ? '#ba4a00' : '#3e2723';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Center line
      ctx.strokeStyle = isOP ? '#3498db' : isNaruto ? '#d35400' : '#4e342e';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Center dashes
      ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.2)' : isNaruto ? 'rgba(255,200,70,0.2)' : 'rgba(255,200,70,0.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 16]);
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
      // Spawn label
      ctx.fillStyle = 'rgba(245,101,101,0.7)';
      ctx.font = '600 10px Inter,sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('SPAWN', pArr[0].x + 4, pArr[0].y + 4);
    });

    if (pathsToDraw && pathsToDraw.length > 0 && pathsToDraw[0].length > 0) {
      // Base indicator
      const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
      ctx.fillStyle = 'rgba(62,207,142,0.85)';
      ctx.beginPath();
      ctx.roundRect(endP.x - 18, endP.y - 12, 36, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Inter,sans-serif';
      ctx.fillText('BASE', endP.x - 12, endP.y + 20);
    }
  }

  function drawPlacementPreview() {
    if (!deployingCharId) return;
    const char = getCharById(deployingCharId);
    if (!char) return;
    
    const valid = isValidPlacement(hoverX, hoverY);
    const color = valid ? '62,207,142' : '245,101,101'; // green or red
    const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
    
    ctx.beginPath();
    ctx.arc(hoverX, hoverY, 24, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${color}, ${0.2 + pulse * 0.1})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color}, 0.8)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const baseStats = getCurrentStats(char, Save.getBestUnitData(deployingCharId)?.nivel || 1);
    ctx.beginPath();
    ctx.arc(hoverX, hoverY, baseStats.range, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${color}, 0.05)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color}, 0.3)`;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawTowerRangePreview() {
    if (selectedTowerIdx < 0 || !towers[selectedTowerIdx]) return;
    const tower = towers[selectedTowerIdx];
    const stats = getTowerStats(tower);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,200,70,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,70,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const RARITY_GLOW = {3:'rgba(159,122,234,',4:'rgba(251,146,60,',5:'rgba(255,200,70,',6:'rgba(230,57,57,'};

  // Preloaded tower portrait cache
  const _imgCache = {};
  function getTowerImg(charId) {
    const char = getCharById(charId);
    if (!char?.image) return null;
    if (!_imgCache[charId]) {
      const img = new Image();
      img.src = char.image;
      _imgCache[charId] = img;
    }
    return _imgCache[charId];
  }

  function drawTowers() {
    towers.forEach(t => {
      const disabled = t.disabled || shinraTenseiActive;
      ctx.globalAlpha = disabled ? 0.35 : (t.isClone ? 0.72 : 1);
      const col = RARITY_COLORS[t.rarity];
      const selected = selectedTowerIdx >= 0 && towers[selectedTowerIdx] === t;
      // Clone: anel tracejado + timer
      if (t.isClone) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(159,122,234,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(200,180,255,0.85)';
        ctx.font = '600 8px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${Math.ceil(t.cloneTimer)}s`, t.x, t.y + 33);
      }
      // Glow
      if (!disabled && t.rarity >= 3) {
        const g = RARITY_GLOW[t.rarity] || 'rgba(255,255,255,';
        ctx.beginPath();
        ctx.arc(t.x, t.y, selected ? 30 : 26, 0, Math.PI*2);
        ctx.fillStyle = g + (selected ? '0.22)' : '0.10)');
        ctx.fill();
      }
      // Outer ring for selected
      if (selected) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 25, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // ═══ 6★ Aura Visual ═══
      if (!disabled && t.rarity >= 6) {
        const n6 = Date.now();
        const p6a = (Math.sin(n6 / 800) + 1) / 2;
        const p6b = (Math.sin(n6 / 500 + Math.PI) + 1) / 2;

        // Anel externo crimson rotacionando (hollow)
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(n6 * 0.0008);
        ctx.beginPath();
        ctx.arc(0, 0, 38 + p6a * 4, 0, Math.PI * 2);
        ctx.shadowBlur = 14; ctx.shadowColor = '#dc2626';
        ctx.strokeStyle = `rgba(220,38,38,${0.4 + p6a * 0.35})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Anel interno laranja contra-rotacionando (shinigami)
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(-n6 * 0.0012);
        ctx.beginPath();
        ctx.arc(0, 0, 30 + p6b * 2, 0, Math.PI * 2);
        ctx.shadowBlur = 9; ctx.shadowColor = '#f97316';
        ctx.strokeStyle = `rgba(249,115,22,${0.30 + p6b * 0.30})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Chamas de Reiatsu Vermelho/Preto (Substitui as antigas esferas e glyphs)
        ctx.save();
        ctx.translate(t.x, t.y);
        const layers = [
          { color: 'rgba(220, 10, 20, 0.7)', blur: 25, blurCol: '#ff0000', comp: 'lighter', baseR: 38, spikeMult: 28 }, // Outer red glow
          { color: 'rgba(80, 0, 0, 0.9)', blur: 15, blurCol: '#aa0000', comp: 'source-over', baseR: 28, spikeMult: 20 }, // Dark red mid
          { color: 'rgba(5, 5, 10, 0.98)', blur: 5, blurCol: '#000000', comp: 'source-over', baseR: 22, spikeMult: 14 }  // Pitch black core
        ];
        
        layers.forEach((ly, idx) => {
          ctx.globalCompositeOperation = ly.comp;
          ctx.fillStyle = ly.color;
          ctx.shadowBlur = ly.blur;
          ctx.shadowColor = ly.blurCol;
          
          ctx.beginPath();
          const spikes = 14 + idx * 2; 
          for (let i = 0; i <= spikes; i++) {
            const angle = (i / spikes) * Math.PI * 2;
            const timePhase = n6 * 0.006 + idx * 10 + i;
            
            // Ponta da chama oscilando
            const flameLen = ly.baseR + Math.abs(Math.sin(timePhase)) * ly.spikeMult;
            // Alongamento para cima (Y negativo) simulando aura subindo
            const isTop = Math.sin(angle) < 0;
            const upStretch = isTop ? Math.abs(Math.sin(angle)) * 30 : 0;
            
            const pxTip = Math.cos(angle) * (flameLen + upStretch * 0.4);
            const pyTip = Math.sin(angle) * (flameLen + upStretch) - upStretch * 0.6;
            
            // Base/Vale entre as chamas
            const nextAngle = ((i + 0.5) / spikes) * Math.PI * 2;
            const valleyLen = ly.baseR - 4;
            const isTopValley = Math.sin(nextAngle) < 0;
            const valleyUpStretch = isTopValley ? Math.abs(Math.sin(nextAngle)) * 12 : 0;
            const pxVal = Math.cos(nextAngle) * valleyLen;
            const pyVal = Math.sin(nextAngle) * (valleyLen + valleyUpStretch) - valleyUpStretch * 0.4;
            
            if (i === 0) ctx.moveTo(pxTip, pyTip);
            else ctx.lineTo(pxTip, pyTip);
            
            if (i < spikes) ctx.lineTo(pxVal, pyVal);
          }
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();

        // Vizard Mode ativo — halo laranja dramático pulsante
        if (t._vizardActive) {
          const vp = (Math.sin(n6 / 180) + 1) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(t.x, t.y, 43 + vp * 7, 0, Math.PI * 2);
          ctx.shadowBlur = 28; ctx.shadowColor = '#f97316';
          ctx.strokeStyle = `rgba(249,115,22,${0.55 + vp * 0.45})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Main circle
      const circleR = t.rarity >= 6 ? 22 : 20;
      ctx.beginPath();
      ctx.arc(t.x, t.y, circleR, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = disabled ? '#222' : (t.rarity >= 6 ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.2)');
      ctx.lineWidth = t.rarity >= 6 ? 2 : 1.5;
      ctx.stroke();
      // Portrait or initials
      const portrait = getTowerImg(t.charId);
      const imgR = circleR - 1;
      if (portrait && portrait.complete && portrait.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, imgR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(portrait, t.x - imgR, t.y - imgR, imgR * 2, imgR * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = disabled ? 'rgba(255,255,255,0.4)' : '#fff';
        ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.initials, t.x, t.y);
      }
      // 6★ badge acima-direita do círculo
      if (t.rarity >= 6) {
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = '#dc2626';
        ctx.fillStyle = '#e63939';
        ctx.font = 'bold 8px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('6★', t.x + 16, t.y - 19);
        ctx.restore();
      }
      // Upgrade pips — centrados, tamanho adaptativo para até 10 upgrades
      if (t.upgradeLevel > 0) {
        const spacing = t.upgradeLevel > 6 ? 6 : 7;
        const pipR    = t.upgradeLevel > 6 ? 2.5 : 3;
        const startX  = t.x - ((t.upgradeLevel - 1) * spacing) / 2;
        for (let i = 0; i < t.upgradeLevel; i++) {
          ctx.beginPath();
          ctx.arc(startX + i * spacing, t.y + 25, pipR, 0, Math.PI*2);
          ctx.fillStyle = '#ffc846';
          ctx.fill();
        }
      }
      // Gojo aura buff — anel dourado nas torres dentro do alcance
      if (_gojoBuffedSet.has(t)) {
        const gPulse = (Math.sin(Date.now() / 700) + 1) / 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(255,200,70,${0.35 + gPulse * 0.25})`;
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = `rgba(255,200,70,${0.12 + gPulse * 0.08})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2); ctx.fill();
      }
      // Mini-stun — anel vermelho tracejado + timer
      if ((t.miniStunTimer || 0) > 0) {
        const sPulse = (Math.sin(Date.now() / 150) + 1) / 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 26, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(229,57,53,${0.55 + sPulse * 0.4})`;
        ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f56565'; ctx.font = 'bold 8px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${Math.ceil(t.miniStunTimer)}s`, t.x, t.y - 30);
      }
      // Badge de imunidade a stun (cooldown após ser stunada)
      if ((t.stunCooldown || 0) > 0 && (t.miniStunTimer || 0) <= 0) {
        ctx.beginPath(); ctx.arc(t.x - 16, t.y - 16, 7, 0, Math.PI*2);
        ctx.fillStyle = '#1d4ed8'; ctx.fill();
        ctx.fillStyle = '#93c5fd'; ctx.font = 'bold 6px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(t.stunCooldown)}s`, t.x - 16, t.y - 16);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }

      // Badge de passiva (kill streak, combo counter, etc.) — data-driven via PASSIVE_SYSTEM.renderBadge
      if (!t.isClone) {
        const badge = PASSIVE_SYSTEM.renderBadge(t);
        if (badge) {
          ctx.font = 'bold 10px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(badge.text, t.x, t.y - 46);
          ctx.fillStyle = badge.color;
          ctx.fillText(badge.text, t.x, t.y - 46);
        }
      }
      // Active ability indicator (Gojo) — bolinha verde (pronto) ou azul (cooldown)
      if (!t.isClone && t.charData?.active_ability) {
        const ready = (t.abilityTimer || 0) <= 0;
        ctx.beginPath();
        ctx.arc(t.x + 18, t.y - 18, 6, 0, Math.PI*2);
        ctx.fillStyle = ready ? '#3ecf8e' : 'rgba(91,156,246,0.85)';
        ctx.fill();
        if (!ready) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 6px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(Math.ceil(t.abilityTimer), t.x + 18, t.y - 18);
        }
      }

      // Anel de prestígio — borda dourada pulsante
      if ((t.prestige || 0) > 0) {
        const pPulse = (Math.sin(Date.now() / 600) + 1) / 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 22 + pPulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,215,0,${0.5 + pPulse * 0.45})`;
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 7px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`P${t.prestige}`, t.x, t.y + 28);
      }

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    });
  }

  // Tabela de tags visuais por ptype e special
  const TAG_DEFS = {
    ptype: {
      // Tier de poder
      powerful1:   { t:'P1',   bg:'#9b59b6', fg:'#fff' },
      powerful2:   { t:'P2',   bg:'#6c3483', fg:'#fff' },
      powerful3:   { t:'P3',   bg:'#4a235a', fg:'#fff' },
      strong1:     { t:'STR1', bg:'#5d6d7e', fg:'#fff' },
      strong2:     { t:'STR2', bg:'#4a5568', fg:'#fff' },
      strong3:     { t:'STR3', bg:'#34495e', fg:'#fff' },
      strong4:     { t:'STR4', bg:'#2c3e50', fg:'#fff' },
      strong5:     { t:'STR5', bg:'#1a252f', fg:'#fff' },
      // Buffs de mecânica (ptype behaviors) — agora exibidos corretamente
      speed:       { t:'SPD',  bg:'#d4ac0d', fg:'#000' },
      fortified:   { t:'SHLD', bg:'#f59e0b', fg:'#000' },
      regenerator: { t:'REG',  bg:'#27ae60', fg:'#fff' },
      bomber:      { t:'BOOM', bg:'#c0392b', fg:'#fff' },
      clooner:     { t:'CLN',  bg:'#1e8449', fg:'#fff' },
      kamikaze:    { t:'KMK',  bg:'#e67e22', fg:'#fff' }
    },
    special: {
      explosion:              { t:'BOOM', bg:'#e74c3c', fg:'#fff' },
      base_drain:             { t:'DRN',  bg:'#1f618d', fg:'#fff' },
      genjutsu:               { t:'GNJ',  bg:'#1c2833', fg:'#fff' },
      shinra_tensei:          { t:'ST',   bg:'#922b21', fg:'#fff' },
      pain_boss:              { t:'ST+S', bg:'#922b21', fg:'#fff' },
      grand_fisher_special:   { t:'SPWN', bg:'#607d8b', fg:'#fff' },
      grimmjow_special:       { t:'SPWN', bg:'#1e88e5', fg:'#fff' },
      nnoitra_special:        { t:'SHLD+',bg:'#f59e0b', fg:'#000' },
      aizen_hogyoku_phase1:   { t:'ILSN', bg:'#1a1a2e', fg:'#fff' },
      aizen_hogyoku_phase2:   { t:'DRN',  bg:'#4c1d95', fg:'#fff' }
    }
  };

  const _enemyImgCache = {};
  function getEnemyImg(enemyType) {
    const d = typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS[enemyType] : null;
    if (!d || !d.image) return null;
    if (!_enemyImgCache[enemyType]) {
      const img = new Image();
      img.src = d.image;
      _enemyImgCache[enemyType] = img;
    }
    return _enemyImgCache[enemyType];
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.dead || e.reached_end) return;
      ctx.save();

      const s       = e.size;
      const hasBurn  = e.status.burn.active;
      const hasFreeze = e.status.freeze.active;
      const hasPara  = e.status.paralisia.active;
      const bleedN   = e.status.sangramento.length;

      // Glow por status — prioridade: paralisia > freeze > burn
      if      (hasPara)   { ctx.shadowBlur = 16; ctx.shadowColor = '#fbbf24'; }
      else if (hasFreeze) { ctx.shadowBlur = 14; ctx.shadowColor = '#5b9cf6'; }
      else if (hasBurn)   { ctx.shadowBlur = 12; ctx.shadowColor = '#f97316'; }

      if (e.hitFlash > 0) ctx.globalAlpha = 0.55;

      // Borda pulsante de bleed
      if (bleedN > 0) {
        const bp = (Math.sin(Date.now() / 160) + 1) / 2;
        ctx.strokeStyle = `rgba(229,57,53,${0.5 + bp * 0.4})`;
        ctx.lineWidth = 1.5 + Math.min(bleedN, 4) * 0.4;
        const r2 = Math.min(5, s * 0.18) + 1;
        ctx.beginPath(); ctx.roundRect(e.x-s/2-2, e.y-s/2-2, s+4, s+4, r2); ctx.stroke();
      }

      // Corpo do inimigo
      const img = getEnemyImg(e.type);
      if (img && img.complete && img.naturalWidth > 0) {
        if (e.is_boss) {
          ctx.shadowBlur = 16; ctx.shadowColor = '#f56565';
        } else if (e.is_miniboss) {
          ctx.shadowBlur = 10; ctx.shadowColor = '#ffc846';
        }

        ctx.drawImage(img, e.x - s/2, e.y - s/2, s, s);
        ctx.shadowBlur = 0;

        if (hasBurn || hasFreeze || hasPara) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          if (hasBurn) ctx.fillStyle = '#f97316';
          else if (hasFreeze) ctx.fillStyle = '#5b9cf6';
          else if (hasPara) ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, Math.min(5, s * 0.18)); ctx.fill();
          ctx.restore();
        }

        if (e.is_boss) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else if (e.is_miniboss) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        }
      } else {
        const col = hasBurn ? '#f97316' : e.col;
        const r   = Math.min(5, s * 0.18);
        ctx.fillStyle = col;

        if (e.is_boss) {
          const pulse = 2 + Math.sin(Date.now() / 180) * 1.5;
          ctx.shadowBlur = 16; ctx.shadowColor = '#f56565';
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
          ctx.strokeStyle = '#f56565'; ctx.lineWidth = pulse;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else if (e.is_miniboss) {
          const pulse = 1.5 + Math.sin(Date.now() / 260) * 1;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
          ctx.strokeStyle = '#ffc846'; ctx.lineWidth = pulse;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else {
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
        }
      }

      // Anel de escudo (Pain = azul, Fortified = dourado)
      if ((e.shieldHp || 0) > 0) {
        const sPulse = (Math.sin(Date.now() / 200) + 1) / 2;
        const isFort = (e.ptypes || []).includes('fortified');
        const shRgb  = isFort ? '245,158,11' : '96,165,250';
        const shSolid= isFort ? '#f59e0b'    : '#3b82f6';
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(e.x, e.y, s * 0.6 + 8 + sPulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${shRgb},${0.6 + sPulse * 0.35})`;
        ctx.lineWidth = 3.5 + sPulse * 2.5;
        ctx.shadowBlur = 14 + sPulse * 10;
        ctx.shadowColor = shSolid;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Barra de HP
      const hpPct = e.hp / e.maxHp;
      const bw = s + 10, bh = 3, bx = e.x - bw/2, by = e.y - s/2 - 7;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = hpPct > 0.55 ? '#3ecf8e' : hpPct > 0.28 ? '#fbbf24' : '#f56565';
      ctx.beginPath(); ctx.roundRect(bx, by, bw * hpPct, bh, 2); ctx.fill();

      // Barra de escudo (Pain = azul, Fortified = dourado)
      if ((e.shieldHp || 0) > 0 && e.maxShieldHp > 0) {
        const shPct = e.shieldHp / e.maxShieldHp;
        const shby = by - 5;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(bx, shby, bw, bh, 2); ctx.fill();
        ctx.fillStyle = (e.ptypes || []).includes('fortified') ? '#f59e0b' : '#60a5fa';
        ctx.beginPath(); ctx.roundRect(bx, shby, bw * shPct, bh, 2); ctx.fill();
      }

      // ── TAGS (tipo + special) — acima da barra de HP ──────────────────
      const tags = [];
      // Itera todos os ptypes (suporta array)
      (e.ptypes || [e.ptype]).forEach(pt => {
        const ptDef = TAG_DEFS.ptype[pt];
        if (ptDef) tags.push(ptDef);
      });
      const spDef = e.special ? TAG_DEFS.special[e.special] : null;
      if (spDef) tags.push(spDef);
      // on_death sem tag própria = ícone de spawn
      if (e.on_death && !spDef) tags.push({ t:'SPWN', bg:'#1e8449', fg:'#fff' });

      if (tags.length > 0) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 7px Inter,sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const tagH = 9, tagGap = 2;
        const tagY  = by - tagH - tagGap;
        let tx = bx;
        tags.forEach(tag => {
          const tw = ctx.measureText(tag.t).width + 5;
          ctx.fillStyle = tag.bg;
          ctx.beginPath(); ctx.roundRect(tx, tagY, tw, tagH, 2); ctx.fill();
          ctx.fillStyle = tag.fg;
          ctx.fillText(tag.t, tx + 2.5, tagY + tagH - 1.5);
          tx += tw + tagGap;
        });
      }

      // ── STATUS DOTS — abaixo do inimigo ───────────────────────────────
      const dots = [];
      if (hasBurn)   dots.push({ col:'#f97316', l:'B' });   // Burn
      if (hasFreeze) dots.push({ col:'#5b9cf6', l:'S' });   // Slow
      if (hasPara)   dots.push({ col:'#fbbf24', l:'P' });   // Paralisia
      if (bleedN > 0) {
        const show = Math.min(bleedN, 4);
        for (let i = 0; i < show; i++) dots.push({ col:'#e53935', l:'•' });
        if (bleedN > 4) dots.push({ col:'#c0392b', l:`+${bleedN-4}` });
      }

      if (dots.length > 0) {
        ctx.shadowBlur = 0;
        const dR = 4.5, dSp = dR * 2 + 2;
        const startX = e.x - (dots.length * dSp) / 2 + dR;
        const dY = e.y + s/2 + dR + 3;
        ctx.font = '600 6px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        dots.forEach((d, i) => {
          const dx = startX + i * dSp;
          ctx.beginPath(); ctx.arc(dx, dY, dR, 0, Math.PI*2);
          ctx.fillStyle = d.col; ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText(d.l, dx, dY + 0.5);
        });
      }

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
    ctx.textAlign = 'left';
  }

  function drawProjectile(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    drawProjectileShape(ctx, p.charId || '', p.angle, p.color, Date.now());
    ctx.restore();
  }

  function drawProjectiles() {
    projectiles.forEach(p => drawProjectile(p));
  }

  function drawEffects() {
    effects.forEach(ef => {
      const maxTimer = ef.maxTimer || (ef.type === 'ring' ? 0.35 : ef.type === 'shockwave' ? 1.0 : 0.4);
      const alpha = Math.max(0, Math.min(1, ef.timer / maxTimer));
      ctx.save();
      ctx.globalAlpha = alpha;
      if (ef.type === 'ring' || ef.type === 'shockwave') {
        ctx.shadowBlur = 14; ctx.shadowColor = ef.color;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.r || 10, 0, Math.PI * 2);
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = ef.type === 'shockwave' ? 4 : 3;
        ctx.stroke();
      } else if (ef.type === 'line') {
        ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
        const dx = ef.tx - ef.x, dy = ef.ty - ef.y;
        const len = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const nx = dx/len, ny = dy/len;
        const w = 30; // Half-width of the line attack
        ctx.beginPath();
        ctx.moveTo(ef.x - ny*w, ef.y + nx*w);
        ctx.lineTo(ef.tx - ny*w, ef.ty + nx*w);
        ctx.lineTo(ef.tx + ny*w, ef.ty - nx*w);
        ctx.lineTo(ef.x + ny*w, ef.y - nx*w);
        ctx.closePath();
        ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = ef.color; ctx.fill();
        ctx.globalAlpha = alpha;
      } else if (ef.type === 'cone_flash') {
        const cdx = ef.tx - ef.x, cdy = ef.ty - ef.y;
        const cangle = Math.atan2(cdy, cdx);
        const crange = Math.min(Math.sqrt(cdx*cdx + cdy*cdy) + 18, 220);
        ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
        ctx.beginPath();
        ctx.moveTo(ef.x, ef.y);
        ctx.arc(ef.x, ef.y, crange, cangle - Math.PI / 4, cangle + Math.PI / 4);
        ctx.closePath();
        ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = alpha * 0.18;
        ctx.fillStyle = ef.color; ctx.fill();
        ctx.globalAlpha = alpha;
      } else if (ef.type === 'death') {
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 15 * (1 - alpha), 0, Math.PI * 2);
        ctx.fillStyle = ef.color;
        ctx.fill();
      } else if (ef.type === 'coin') {
        const prog = 1 - alpha;
        ctx.shadowBlur = 5; ctx.shadowColor = '#f1c40f';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y - prog * 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', ef.x, ef.y - prog * 20);
      } else if (ef.type === 'silenced') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = ef.color || '#9b59b6';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ef.text || 'Silenced!', ef.x, ef.y - (1-alpha)*20);
      } else if (ef.type === 'crit') {
        const prog = 1 - alpha;
        ctx.shadowBlur = 12; ctx.shadowColor = ef.color || '#ffc846';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 20 * prog, 0, Math.PI * 2);
        ctx.fillStyle = ef.color || '#ffc846';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 9 * prog, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      } else if (ef.type === 'hollow_burst') {
        // Cero Oscuras — duplo anel expansivo laranja + vermelho-sangue
        ctx.shadowBlur = 22; ctx.shadowColor = '#f97316';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.r || 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.shadowColor = '#7b0000';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, Math.max(2, (ef.r || 2) * 0.55), 0, Math.PI * 2);
        ctx.strokeStyle = '#7b0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Cruz de fissura hollow
        ctx.shadowBlur = 8; ctx.shadowColor = '#f97316';
        const cr = Math.max(4, (ef.r || 2) * 0.35);
        ctx.strokeStyle = `rgba(249,115,22,${alpha * 0.65})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(ef.x - cr, ef.y); ctx.lineTo(ef.x + cr, ef.y);
        ctx.moveTo(ef.x, ef.y - cr); ctx.lineTo(ef.x, ef.y + cr);
        ctx.stroke();
      } else if (ef.type === 'vizard_mode_flash') {
        // Vizard Mode ativado — explosão dramática de energia laranja+vermelha
        const prog = 1 - alpha;
        ctx.shadowBlur = 40; ctx.shadowColor = '#f97316';
        // Anel externo laranja
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 65 * prog, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249,115,22,${alpha * 0.95})`;
        ctx.lineWidth = 4.5;
        ctx.stroke();
        // Flash de preenchimento
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 45 * prog, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${alpha * 0.16})`;
        ctx.fill();
        // Anel interno escuro (hollow)
        ctx.shadowColor = '#1c0000';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 28 * prog, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(30,0,0,${alpha * 0.85})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        // 8 raios de energia expandindo
        ctx.shadowBlur = 16; ctx.shadowColor = '#dc2626';
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI / 4) + prog * Math.PI * 0.4;
          ctx.beginPath();
          ctx.moveTo(ef.x + Math.cos(a) * 9, ef.y + Math.sin(a) * 9);
          ctx.lineTo(ef.x + Math.cos(a) * (9 + 52 * prog), ef.y + Math.sin(a) * (9 + 52 * prog));
          ctx.strokeStyle = `rgba(220,38,38,${alpha * 0.60})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  function drawOverlay() {
    if (betweenWaves && betweenTimer > 0 && wave < totalWaves) {
      ctx.fillStyle = 'rgba(6,6,14,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Card
      const cx = CANVAS_W/2, cy = CANVAS_H/2;
      ctx.fillStyle = 'rgba(10,10,26,0.9)';
      ctx.beginPath(); ctx.roundRect(cx-145, cy-44, 290, 92, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,70,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(cx-145, cy-44, 290, 92, 14); ctx.stroke();
      ctx.fillStyle = 'rgba(238,240,255,0.45)';
      ctx.font = '500 12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PRÓXIMA WAVE', cx, cy - 20);
      ctx.fillStyle = '#ffc846';
      ctx.font = 'bold 26px Inter,sans-serif';
      ctx.fillText(`Wave ${wave + 1}  —  ${Math.ceil(betweenTimer)}s`, cx, cy + 7);
      if (isInfiniteMode) {
        const tier = INFINITE_TIERS[getInfiniteTierIdx(wave + 1)];
        ctx.fillStyle = tier.color;
        ctx.font = 'bold 11px Inter,sans-serif';
        ctx.fillText(`⚡ ${tier.name.toUpperCase()}  •  [S] pular`, cx, cy + 28);
        const best = Save.get().stats.melhor_onda_infinita || 0;
        if (best > 0) {
          ctx.fillStyle = 'rgba(251,191,36,0.55)';
          ctx.font = '500 9px Inter,sans-serif';
          ctx.fillText(`Recorde: Wave ${best}`, cx, cy + 42);
        }
      } else {
        ctx.fillStyle = 'rgba(74,222,128,0.75)';
        ctx.font = '500 10px Inter,sans-serif';
        ctx.fillText(`+${(wave + 1) * 11}\u{1F4B0} ao completar  •  [S] pular`, cx, cy + 28);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    if (shinraTenseiActive) {
      ctx.fillStyle = 'rgba(245,101,101,0.08)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = 'rgba(245,101,101,0.85)';
      ctx.font = 'bold 13px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ SHINRA TENSEI  ${Math.ceil(shinraTenseiTimer)}s`, CANVAS_W/2, 28);
      ctx.textAlign = 'left';
    }
  }

  function useAbility(slotIdx) {
    if (slotIdx < 0 || !towers[slotIdx]) return;
    const tower = towers[slotIdx];
    const aa = tower.charData?.active_ability;
    if (!aa) return;
    if ((tower.abilityTimer || 0) > 0) {
      UI.toast(`Habilidade em cooldown! (${Math.ceil(tower.abilityTimer)}s)`, 2000);
      return;
    }
    if (aa.type === 'domain_expansion') {
      const stunDur = getActiveValue(tower, 'stun_duration', aa.stun_duration);
      enemies.forEach(e => {
        if (!e.dead && !e.reached_end) applyStatus(e, 'paralisia', { duration: stunDur });
      });
      addEffect({ type:'shockwave', x:CANVAS_W/2, y:CANVAS_H/2, maxR:820, color:'#5b9cf6', timer:1.0, maxTimer:1.0, r:0 });
      UI.toast(`❄️ Domínio Expandido! Todos os inimigos paralisados por ${stunDur}s!`, 3000);
      tower.abilityTimer = aa.cooldown;
    }
  }

  function addEffect(ef) { effects.push(ef); }
  function dist2d(x1,y1,x2,y2) { return Math.sqrt((x2-x1)**2+(y2-y1)**2); }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2-x1)**2 + (y2-y1)**2;
    if (l2 === 0) return dist2d(px, py, x1, y1);
    let t = ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2d(px, py, x1 + t*(x2 - x1), y1 + t*(y2 - y1));
  }

  function isValidPlacement(x, y) {
    if (x < 20 || x > CANVAS_W - 20 || y < 20 || y > CANVAS_H - 20) return false;
    const pathsToCheck = window.currentPaths || [PATH_POINTS];
    for (const pArr of pathsToCheck) {
      if (!pArr) continue;
      for (let i = 1; i < pArr.length; i++) {
        const p1 = pArr[i-1], p2 = pArr[i];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 35) return false;
      }
    }
    for (const t of towers) {
      if (dist2d(x, y, t.x, t.y) < 30) return false;
    }
    return true;
  }

  function getTowers() {
    return towers;
  }

  function addGold(amount) {
    gold += amount;
    updateHUD();
  }

  return {
    init, startGame, togglePause, toggleSpeed, sellTower, buyNextUpgrade,
    retryStage, handleClick, getTowers, deployTower, selectTower,
    useAbility, deselectTower, skipWave, addGold
  };
})();
