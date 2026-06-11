// Contexto compartilhado com game-passives.js â€” populado durante init do mÃ³dulo Game.
const _passiveCtx = {};

const Game = (() => {
  let canvas, ctx;
  let running = false, paused = false, gameSpeed = 1;
  let lastTime = 0;

  // Render transform â€” uniform scale to preserve aspect ratio
  let renderScale = 1, renderOffX = 0, renderOffY = 0;

  // Game state
  let lives, gold, wave, totalWaves;
  let enemies, towers, projectiles, effects, tsunamis, zombies;
  let _aliveEnemies = [];
  let waveActive, spawnQueue, betweenWaves, betweenTimer, waveElapsed;
  let _lastPlacedTower = null;
  let activeWavesCount = 1;
  let skipMultiplier = 0;
  let skipGold = 100;
  let selectedTowerIdx, deployingCharId;
  let shinraTenseiActive, shinraTenseiTimer, stageModifierTimer;
  let _sandStormTimer, _sandStormActive, _sandStormDuration, _lightningTimer;
  let _dcDebrisTimer, _dcDebrisQueue, _dcBlackoutActive, _dcBlackoutTimer, _gravityZones;
  // Crossings de Metrópolis onde o Destruidor aciona blackout
  const _DC_CROSSINGS = [{x:400, y:350}, {x:650, y:150}];
  function _dcDebrisBaseInterval() { return 75 + Math.random() * 25; }
  let stage, team;
  let difficulty;
  let _gojoBuffedSet = new Set();
  let isInfiniteMode = false;
  // Stats tracking per session
  let sessionDmg = 0, sessionKills = 0, sessionTowersPlaced = 0;
  let sessionMinibosses = 0, sessionBossKilled = false;
  let _gameStartTime = 0;

  let screenShakeAmount = 0;
  let vizardOverlayAlpha = 0;
  let _hudChipTimer = 0;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // PASSIVE_SYSTEM â€” tabela central de todas as passivas de personagens.
  //
  // Cada chave corresponde ao campo `type` em charData.passive.
  // Hooks disponÃ­veis por entrada:
  //   update(tower, p, dt)                          â†’ tick por frame
  //   beforeAttack(tower, p, stats) â†’ stats | null  â†’ null = pula ataque
  //   onHit(tower, p, enemy, dmg) â†’ dmg             â†’ pode modificar dano
  //   afterAttack(tower, p, hitEnemies, attackType, stats) â†’ efeitos pÃ³s-acerto
  //   onKill(tower, p, enemy)                       â†’ ao confirmar kill
  //   onAnyKill(tower, p, deadEnemy)                â†’ qualquer kill no campo
  //   onWaveEnd(tower, p)                           â†’ ao fim de cada wave
  //   isAura: true + auraEffect(auraTower, p, attackingTower, dmg) â†’ dmg
  //   canDamageOverride(tower, p, enemy) â†’ bool     â†’ bypass de req check
  //
  // Para adicionar nova passiva: crie uma entrada aqui. NÃ£o precisa tocar
  // em nenhuma outra funÃ§Ã£o â€” os dispatchers abaixo chamam automaticamente.
  // Entradas Ãºnicas servem de template para futuras passivas similares.
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const PASSIVE_SYSTEM = {

    // â”€â”€ Dispatchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Popula _passiveCtx â€” PASSIVE_ENTRIES (game-passives.js) acessa estado do Game via este objeto.
  (function() {
    Object.defineProperties(_passiveCtx, {
      enemies:            { get: () => enemies,            configurable: true },
      towers:             { get: () => towers,             configurable: true },
      gold:               { get: () => gold, set: v => { gold = v; }, configurable: true },
      tsunamis:           { get: () => tsunamis,           configurable: true },
      zombies:            { get: () => zombies,            configurable: true },
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
    _passiveCtx.distSq             = distSq;
    _passiveCtx.restoreLife        = (n = 1) => { lives = Math.min(lives + n, stage?.base_hp || lives + n); updateHUD(); };
    Object.defineProperty(_passiveCtx, 'waveElapsed', { get: () => waveElapsed, configurable: true });
  })();
  Object.assign(PASSIVE_SYSTEM, PASSIVE_ENTRIES);
  _passiveCtx.PASSIVE_SYSTEM = PASSIVE_SYSTEM;
  window.PASSIVE_SYSTEM = PASSIVE_SYSTEM;


  // Contexto de renderizaÃ§Ã£o â€” expÃµe estado do jogo para game-renderer.js
  Object.defineProperties(_renderCtx, {
    ctx:                { get: () => ctx,                configurable: true },
    canvas:             { get: () => canvas,             configurable: true },
    stage:              { get: () => stage,              configurable: true },
    enemies:            { get: () => enemies,            configurable: true },
    towers:             { get: () => towers,             configurable: true },
    projectiles:        { get: () => projectiles,        configurable: true },
    effects:            { get: () => effects,            configurable: true },
    tsunamis:           { get: () => tsunamis,           configurable: true },
    zombies:            { get: () => zombies,            configurable: true },
    wave:               { get: () => wave,               configurable: true },
    totalWaves:         { get: () => totalWaves,         configurable: true },
    waveActive:         { get: () => waveActive,         configurable: true },
    betweenWaves:       { get: () => betweenWaves,       configurable: true },
    betweenTimer:       { get: () => betweenTimer,       configurable: true },
    isInfiniteMode:     { get: () => isInfiniteMode,     configurable: true },
    selectedTowerIdx:   { get: () => selectedTowerIdx,   configurable: true },
    deployingCharId:    { get: () => deployingCharId,    configurable: true },
    hoverX:             { get: () => hoverX, set: v => { hoverX = v; }, configurable: true },
    hoverY:             { get: () => hoverY, set: v => { hoverY = v; }, configurable: true },
    shinraTenseiActive: { get: () => shinraTenseiActive, configurable: true },
    shinraTenseiTimer:  { get: () => shinraTenseiTimer,  configurable: true },
    _sandStormActive:   { get: () => _sandStormActive,   configurable: true },
    _sandStormDuration: { get: () => _sandStormDuration, configurable: true },
    vizardOverlayAlpha: { get: () => vizardOverlayAlpha, configurable: true },
    screenShakeAmount:  { get: () => screenShakeAmount,  set: v => { screenShakeAmount = v; }, configurable: true },
    renderScale:        { get: () => renderScale,        configurable: true },
    renderOffX:         { get: () => renderOffX,         configurable: true },
    renderOffY:         { get: () => renderOffY,         configurable: true },
    _gojoBuffedSet:        { get: () => _gojoBuffedSet,        configurable: true },
    _dcBlackoutActive:     { get: () => _dcBlackoutActive,     configurable: true },
    _dcBlackoutTimer:      { get: () => _dcBlackoutTimer,      configurable: true },
    _gravityZones:         { get: () => _gravityZones,         configurable: true },
  });
  _renderCtx.getTowerStats    = getTowerStats;
  _renderCtx.isValidPlacement = isValidPlacement;

  // Contexto de HUD — expõe estado e funções DOM para game-hud.js
  Object.defineProperties(_hudCtx, {
    gold:             { get: () => gold,             configurable: true },
    lives:            { get: () => lives,            configurable: true },
    wave:             { get: () => wave,             configurable: true },
    totalWaves:       { get: () => totalWaves,       configurable: true },
    waveActive:       { get: () => waveActive,       configurable: true },
    betweenWaves:     { get: () => betweenWaves,     configurable: true },
    stage:            { get: () => stage,            configurable: true },
    towers:           { get: () => towers,           configurable: true },
    team:             { get: () => team,             configurable: true },
    isInfiniteMode:   { get: () => isInfiniteMode,   configurable: true },
    selectedTowerIdx: { get: () => selectedTowerIdx, set: v => { selectedTowerIdx = v; }, configurable: true },
    deployingCharId:  { get: () => deployingCharId,  set: v => { deployingCharId = v; },  configurable: true },
    skipMultiplier:   { get: () => skipMultiplier,   configurable: true },
    skipGold:         { get: () => skipGold,         configurable: true },
    _aliveEnemies:    { get: () => _aliveEnemies,    configurable: true },
    spawnQueue:       { get: () => spawnQueue,       configurable: true },
  });
  _hudCtx.getTowerStats = getTowerStats;
  _hudCtx.buyUpgrade    = buyUpgrade;

  // Contexto de torres — expõe estado mutável e helpers para game-towers.js
  Object.defineProperties(_towersCtx, {
    towers:             { get: () => towers, set: v => { towers = v; }, configurable: true },
    gold:               { get: () => gold, set: v => { gold = v; }, configurable: true },
    selectedTowerIdx:   { get: () => selectedTowerIdx, set: v => { selectedTowerIdx = v; }, configurable: true },
    deployingCharId:    { get: () => deployingCharId, set: v => { deployingCharId = v; }, configurable: true },
    stage:              { get: () => stage, configurable: true },
    waveActive:         { get: () => waveActive, configurable: true },
    enemies:            { get: () => enemies, configurable: true },
    shinraTenseiActive: { get: () => shinraTenseiActive, configurable: true },
    sessionTowersPlaced:{ get: () => sessionTowersPlaced, set: v => { sessionTowersPlaced = v; }, configurable: true },
    _lastPlacedTower:   { get: () => _lastPlacedTower, set: v => { _lastPlacedTower = v; }, configurable: true },
    canvas:             { get: () => canvas, configurable: true },
    renderOffX:         { get: () => renderOffX, configurable: true },
    renderOffY:         { get: () => renderOffY, configurable: true },
    renderScale:        { get: () => renderScale, configurable: true },
  });
  _towersCtx.getTowerStats = getTowerStats;

  // Contexto de waves — expõe estado e funções para game-waves.js
  Object.defineProperties(_wavesCtx, {
    wave:             { get: () => wave, set: v => { wave = v; }, configurable: true },
    waveActive:       { get: () => waveActive, set: v => { waveActive = v; }, configurable: true },
    betweenWaves:     { get: () => betweenWaves, set: v => { betweenWaves = v; }, configurable: true },
    betweenTimer:     { get: () => betweenTimer, set: v => { betweenTimer = v; }, configurable: true },
    spawnQueue:       { get: () => spawnQueue, set: v => { spawnQueue = v; }, configurable: true },
    waveElapsed:      { get: () => waveElapsed, set: v => { waveElapsed = v; }, configurable: true },
    gold:             { get: () => gold, set: v => { gold = v; }, configurable: true },
    activeWavesCount: { get: () => activeWavesCount, set: v => { activeWavesCount = v; }, configurable: true },
    skipMultiplier:   { get: () => skipMultiplier, set: v => { skipMultiplier = v; }, configurable: true },
    skipGold:         { get: () => skipGold,       set: v => { skipGold = v; },       configurable: true },
    shinraTenseiActive: { get: () => shinraTenseiActive, set: v => { shinraTenseiActive = v; }, configurable: true },
    shinraTenseiTimer:  { get: () => shinraTenseiTimer, set: v => { shinraTenseiTimer = v; }, configurable: true },
    enemies:          { get: () => enemies, configurable: true },
    towers:           { get: () => towers, configurable: true },
    stage:            { get: () => stage, configurable: true },
    isInfiniteMode:   { get: () => isInfiniteMode, configurable: true },
    totalWaves:       { get: () => totalWaves, configurable: true },
    difficulty:       { get: () => difficulty, configurable: true },
    _aliveEnemies:    { get: () => _aliveEnemies, configurable: true },
    sessionDmg:       { get: () => sessionDmg, configurable: true },
    sessionKills:     { get: () => sessionKills, configurable: true },
  });
  _wavesCtx.addEffect          = addEffect;
  _wavesCtx.dispatchSpecialSpawn = dispatchSpecialSpawn;
  _wavesCtx.endGame            = endGame;

  // Contexto de ataque â€” expÃµe funÃ§Ãµes de dano/projÃ©til para game-attack.js
  _attackCtx.dealDamage        = dealDamage;
  _attackCtx.spawnProjectile   = spawnProjectile;
  _attackCtx.addEffect         = addEffect;
  _attackCtx.effectiveCanDamage = effectiveCanDamage;
  Object.defineProperty(_attackCtx, 'screenShakeAmount', {
    get: () => screenShakeAmount, set: v => { screenShakeAmount = v; }, configurable: true
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ENEMY_SPECIAL_HANDLERS (jogo) â€” versÃ£o interna que fecha sobre o estado
  // do jogo. Delega para as definiÃ§Ãµes de enemies.js passando ctx.
  //
  // ctx expÃµe o estado necessÃ¡rio: towers, enemies, addEffect, toast,
  // activateShinraTensei, drainLife, dist2d, CANVAS_W, CANVAS_H.
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      },
      getAllTowers() { return towers; },
      getTowersInRadius(x, y, r) {
        return towers.filter(t => !t.isClone && dist2d(t.x, t.y, x, y) <= r);
      },
      getNearestTower(x, y) {
        let nearest = null, best = Infinity;
        towers.forEach(t => {
          if (t.isClone) return;
          const d = dist2d(t.x, t.y, x, y);
          if (d < best) { best = d; nearest = t; }
        });
        return nearest;
      },
      drainBase(n) {
        lives = Math.max(0, lives - n);
        updateHUD();
        if (lives <= 0) endGame(false);
      },
      fireDarkseidBeam() {
        const paths = window.currentPaths || [PATH_POINTS];
        const path = paths[Math.floor(Math.random() * paths.length)];
        let stunCount = 0;
        towers.forEach(t => {
          if (t.isClone) return;
          for (let i = 1; i < path.length; i++) {
            const ax = path[i-1].x, ay = path[i-1].y;
            const bx = path[i].x,   by = path[i].y;
            const dx = bx - ax, dy = by - ay;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len === 0) continue;
            const t2 = Math.max(0, Math.min(1, ((t.x-ax)*dx + (t.y-ay)*dy) / (len*len)));
            const cx = ax + t2*dx - t.x, cy = ay + t2*dy - t.y;
            if (Math.sqrt(cx*cx + cy*cy) <= 40) {
              t.miniStunTimer = Math.max(t.miniStunTimer || 0, 3);
              t.disabled = true;
              stunCount++;
              break;
            }
          }
        });
        path.forEach((pt, i) => {
          if (i === 0) return;
          addEffect({ type:'line', x:path[i-1].x, y:path[i-1].y, tx:pt.x, ty:pt.y, color:'#f97316', timer:0.5, maxTimer:0.5 });
        });
        if (stunCount > 0) UI.toast(I18N.t('evt_dc_omega_beams', { count: stunCount, s: 3 }), 3000);
      },
      createGravityZone(x, y, r, duration) {
        _gravityZones.push({ x, y, r, timer: duration });
        addEffect({ type:'shockwave', x, y, maxR:r, color:'#7c3aed', timer:0.8, maxTimer:0.8, r:0 });
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
  function dispatchPtypeDamageTaken(enemy, damage) {
    const ctx = _enemyCtx();
    const ptypes = enemy.ptypes || [];
    for (const pt of ptypes) {
      if (PTYPE_BEHAVIORS[pt]?.onDamageTaken) {
        if (PTYPE_BEHAVIORS[pt].onDamageTaken(enemy, damage, ctx)) return true;
      }
    }
    return false;
  }

  // Hover position
  let hoverX = 0, hoverY = 0;

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
    renderWavePreview();
    resizeCanvas(); // Ensure canvas matches container before game starts
    const stageId = UI.getSelectedStage();
    const teamIds = UI.getSelectedTeam();
    difficulty = UI.getSelectedDifficulty();
    if (!stageId || teamIds.length === 0) {
      UI.toast(I18N.t('err_select_unit'));
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
    } else if (wdef && wdef.paths && wdef.paths.length > 0) {
      window.currentPaths = wdef.paths;
      updatePath(wdef.paths[0]);
    } else if (wdef && wdef.path) {
      window.currentPaths = [wdef.path];
      updatePath(wdef.path);
    } else {
      window.currentPaths = [PATH_POINTS];
    }

    // Reset state
    isInfiniteMode = !!(stage.isInfinite);
    lives = stage.base_hp || 20;
    gold = 300;
    skipMultiplier = 0;
    skipGold = 100;
    _hudChipTimer = 0;
    wave = 0;
    totalWaves = isInfiniteMode ? Infinity : stage.waves.length;
    activeWavesCount = 1;
    enemies = [];
    towers = [];
    projectiles = [];
    effects = [];
    tsunamis = [];
    zombies  = [];
    waveActive = false;
    spawnQueue = [];

    betweenWaves = true;
    betweenTimer = -1; // fase de preparação — aguarda jogador pressionar S
    selectedTowerIdx = -1;
    deployingCharId = null;
    shinraTenseiActive = false;
    shinraTenseiTimer = 0;
    stageModifierTimer = 0;
    _sandStormTimer = 0; _sandStormActive = false; _sandStormDuration = 0;
    _lightningTimer = 0;
    waveElapsed = 0;
    sessionDmg = 0; sessionKills = 0; sessionTowersPlaced = 0;
    sessionMinibosses = 0; sessionBossKilled = false;
    _gameStartTime = performance.now();
    _gojoBuffedSet = new Set();
    _infiniteSession.drops = {};
    _infiniteSession.gems  = 0;

    // DC — Mecânica Viva reset
    _dcDebrisTimer    = _dcDebrisBaseInterval();
    _dcDebrisQueue    = [];
    _dcBlackoutActive = false;
    _dcBlackoutTimer  = 0;
    _gravityZones     = [];

    // Free placement (no slots)

    UI.showGame();
    renderTeamPanel();
    updateHUD();
    closeUpgradePanel();

    if (typeof AudioManager !== 'undefined') AudioManager.playWorldBgm(stage.world);

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
    const rawDt = Math.min((ts - lastTime) / 1000, 0.05); // cap 50ms — evita saltos ao voltar de aba
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
      if (betweenTimer >= 0) {
        betweenTimer -= dt;
        if (betweenTimer <= 0) {
          betweenWaves = false;
          startWave();
        }
      }
      return;
    }

    // Spawn queue
    updateSpawn(dt);
    updateEnemiesLoop(dt);

    // Rebuild alive enemies cache once per tick — tryAttack reads this instead of re-filtering enemies[]
    _aliveEnemies.length = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.dead && !e.reached_end) _aliveEnemies.push(e);
    }

    _hudChipTimer += dt;
    if (_hudChipTimer >= 0.1) { _hudChipTimer = 0; if (typeof updateHUDChips === 'function') updateHUDChips(); }

    updateTowersLoop(dt);
    updateProjectiles(dt);
    
    if (stage && stage.modifiers && stage.modifiers.meteors_and_shinra) {
      stageModifierTimer += dt;
      if (stageModifierTimer >= 20) {
        stageModifierTimer = 0;
        triggerMeteorAndShinra();
      }
    }

    // sandStorm (Cap.1 Evento 2): a cada 25s reduz alcance 40% por 6s
    if (stage?.modifiers?.sandStorm) {
      if (_sandStormActive) {
        _sandStormDuration -= dt;
        if (_sandStormDuration <= 0) {
          _sandStormActive = false;
          _sandStormDuration = 0;
          UI.toast(I18N.t('evt_sand_clear'), 2000);
        }
      } else {
        _sandStormTimer += dt;
        if (_sandStormTimer >= 25) {
          _sandStormTimer = 0;
          _sandStormActive = true;
          _sandStormDuration = 6;
          UI.toast(I18N.t('evt_sand_storm'), 3500);
        }
      }
    }

    // lightningStrike (Cap.4 Evento 2): a cada 12s raio acerta cluster de inimigos
    if (stage?.modifiers?.lightningStrike) {
      _lightningTimer += dt;
      if (_lightningTimer >= 12) {
        _lightningTimer = 0;
        triggerLightningStrike();
      }
    }

    // ── DC — Mecânica Viva ────────────────────────────────────────────────────
    if (stage?.world === 'dc') {
      // Gravity zones tick
      _gravityZones = (_gravityZones || []).filter(gz => {
        gz.timer -= dt;
        return gz.timer > 0;
      });

      // Blackout tick (Falha na Grade Elétrica)
      if (_dcBlackoutActive) {
        _dcBlackoutTimer -= dt;
        if (_dcBlackoutTimer <= 0) {
          _dcBlackoutActive = false;
          UI.toast(I18N.t('evt_dc_power_restored'), 1500);
        }
      }

      // Queda de Destroços — timer e queue de impactos
      _dcDebrisTimer -= dt;
      if (_dcDebrisTimer <= 0) {
        // Escala por fase: F1-2 → 1 destroço, F3-4 → 2, F5-6 → 3
        const phaseIdx = parseInt((stage.id || '').replace('dc_fase', '') || '1', 10);
        const count    = phaseIdx <= 2 ? 1 : phaseIdx <= 4 ? 2 : 3;
        const radius   = phaseIdx <= 2 ? 50 : phaseIdx <= 4 ? 65 : 85;
        const stunDur  = phaseIdx <= 2 ? 2  : phaseIdx <= 4 ? 3  : 4;
        for (let i = 0; i < count; i++) {
          const wx = 60 + Math.random() * (CANVAS_W - 120);
          const wy = 60 + Math.random() * (CANVAS_H - 120);
          _dcDebrisQueue.push({ x:wx, y:wy, radius, stunDur, fireAt: 2.0 });
          addEffect({ type:'ring', x:wx, y:wy, maxR:radius, color:'#ef4444', timer:2.0, maxTimer:2.0, r:0 });
        }
        // Frequência escala com fase
        const minInt = phaseIdx <= 2 ? 75 : phaseIdx <= 4 ? 50 : 25;
        const maxInt = phaseIdx <= 2 ? 100: phaseIdx <= 4 ? 70 : 40;
        _dcDebrisTimer = minInt + Math.random() * (maxInt - minInt);
      }

      // Processar fila de impactos
      _dcDebrisQueue = (_dcDebrisQueue || []).filter(d => {
        d.fireAt -= dt;
        if (d.fireAt <= 0) {
          let stunCount = 0;
          towers.forEach(t => {
            if (!t.isClone && dist2d(t.x, t.y, d.x, d.y) <= d.radius) {
              const passives = PASSIVE_SYSTEM._getPassives(t);
              const immune = passives.some(x => x.type === 'shazam_stun_immune')
                || ((t.prestige || 0) >= 5 && Math.random() < 0.5);
              if (!immune) {
                t.miniStunTimer = Math.max(t.miniStunTimer || 0, d.stunDur);
                t.disabled = true;
                stunCount++;
              }
            }
          });
          addEffect({ type:'shockwave', x:d.x, y:d.y, maxR:d.radius, color:'#92400e', timer:0.6, maxTimer:0.6, r:0 });
          if (stunCount > 0) UI.toast(I18N.t('evt_dc_debris', { count: stunCount, s: d.stunDur }), 2500);
          return false;
        }
        return true;
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Tsunami loop
    tsunamis.forEach(tsu => {
      tsu.dist -= tsu.speed * dt;
      const pos = getPosOnPath(tsu.dist, tsu.pathArr);
      tsu.x = pos.x; tsu.y = pos.y;

      for (let i = 0; i < _aliveEnemies.length; i++) {
        const e = _aliveEnemies[i];
        if (!tsu.hitIds.has(e.uid) && distSq(tsu.x, tsu.y, e.x, e.y) < 3600) {
          tsu.hitIds.add(e.uid);
          const dmg = Math.min(e.hp, tsu.hp);
          tsu.hp -= dmg;
          dealDamage({ charData: {}, rarity: 5 }, e, dmg);
        }
      }
      // Add bubble effect trail
      if (Math.random() < 0.3) {
        addEffect({ type:'ring', x:tsu.x + (Math.random()*40-20), y:tsu.y + (Math.random()*40-20), maxR:20, color:'#e0f7fa', timer:0.3, maxTimer:0.3 });
      }
    });
    tsunamis = tsunamis.filter(t => t.hp > 0 && t.dist > 0);

    // Zombie loop (Nemesis passive — caminham da base em direção ao spawn inimigo)
    zombies.forEach(z => {
      z.dist -= z.speed * dt;
      const pos = getPosOnPath(z.dist, z.pathArr);
      z.x = pos.x; z.y = pos.y;

      for (let i = 0; i < _aliveEnemies.length; i++) {
        const e = _aliveEnemies[i];
        if (e.dead || e.reached_end || z.hitIds.has(e.uid)) continue;
        if (distSq(z.x, z.y, e.x, e.y) < 2500) {
          z.hitIds.add(e.uid);
          const dmg = Math.min(e.hp, z.hp);
          z.hp -= dmg;
          dealDamage({ charData: {}, rarity: 5 }, e, dmg);
          applyStatus(e, 'infectado', { dps: z.dps, duration: 7 });
        }
      }
      if (Math.random() < 0.25)
        addEffect({ type:'ring', x:z.x + (Math.random()*28-14), y:z.y + (Math.random()*28-14), maxR:14, color:'rgba(57,255,20,0.55)', timer:0.22, maxTimer:0.22, r:0 });
    });
    zombies = zombies.filter(z => z.hp > 0 && z.dist > 0);

    // End wave conditions(dt);
    updateEffects(dt);
    updateShinraTensei(dt);
    checkWaveEnd();
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
            UI.toast(I18N.t('evt_shield_broken', { name: e.name }), 2500);
          }
        }
        e.hp -= remaining;
        if (e.hp <= 0) { killEnemy(e); toRemove.push(e); return; }
      }

      // Special periódico do inimigo (shinra_tensei, base_drain, etc.)
      dispatchSpecialUpdate(e, dt);
      // Behaviors por ptype (regenerator, etc.)
      dispatchPtypeUpdate(e, dt);

      // DC — Blackout: Destruidor cruza cruzamento dos caminhos
      if (stage?.world === 'dc' && e.type === 'destruidor' && !_dcBlackoutActive) {
        for (const cross of _DC_CROSSINGS) {
          if (dist2d(e.x, e.y, cross.x, cross.y) < 35) {
            const phaseIdx = parseInt((stage.id || '').replace('dc_fase', '') || '4', 10);
            const blackoutSecs = phaseIdx <= 4 ? 3 : phaseIdx === 5 ? 4 : 5;
            _dcBlackoutActive = true;
            _dcBlackoutTimer  = blackoutSecs;
            addEffect({ type:'shockwave', x:cross.x, y:cross.y, maxR:200, color:'#1e1b4b', timer:0.7, maxTimer:0.7, r:0 });
            UI.toast(I18N.t('evt_dc_blackout', { s: blackoutSecs }), 3000);
            break;
          }
        }
      }

      // DC — Gravity zone speed boost
      let gravMult = 1;
      if (stage?.world === 'dc' && (_gravityZones || []).length > 0) {
        for (const gz of _gravityZones) {
          if (dist2d(e.x, e.y, gz.x, gz.y) <= gz.r) { gravMult = 1.6; break; }
        }
      }

      // Movement
      const fogMult = (!isInfiniteMode && stage?.modifiers?.fogSpeedBonus) ? (1 + stage.modifiers.fogSpeedBonus) : 1;
      const spd = getEffectiveSpeed(e) * fogMult * gravMult * dt;

      if (e._willBroken) {
        e._willBrokenTimer = (e._willBrokenTimer || 0) - dt;
        if (e._willBrokenTimer <= 0) {
          killEnemy(e, e._willBrokenBy || null);
          return;
        }
        e.dist = Math.max(0, e.dist - spd);
      } else {
        e.dist += spd;
      }
      const pos = getPosOnPath(e.dist, e.pathArr);
      e.x = pos.x;
      e.y = pos.y;

      if (e.dist >= (e.pathLen || PATH_LENGTH)) {
        e.reached_end = true;
        lives = Math.max(0, lives - 1);
        updateHUD();
        toRemove.push(e);
        if (lives <= 0) {
          const tsunadeTower = towers.find(t => PASSIVE_SYSTEM._getPassives(t).find(p => p.type === 'last_stand'));
          if (tsunadeTower && !tsunadeTower._lastStandUsed) {
            const lsPassive = PASSIVE_SYSTEM._getPassives(tsunadeTower).find(p => p.type === 'last_stand');
            tsunadeTower._lastStandUsed = true;
            lives += lsPassive.restore_lives || 3;
            updateHUD();
            addEffect({ type:'shockwave', x:tsunadeTower.x, y:tsunadeTower.y, maxR:900, color:'#f9a8d4', timer:1.5, maxTimer:1.5, r:0 });
            UI.toast(I18N.t('passive_tsunade_last_stand', { lives: lsPassive.restore_lives || 3 }), 4000);
            return;
          }
          endGame(false);
        } else if (e.is_boss || e.is_miniboss) {
          UI.toast(I18N.t('evt_boss_escaped', { name: e.name }), 4000);
          endGame(false);
        }
      }
    });
    if (toRemove.length) {
      const dead = new Set(toRemove);
      let w = 0;
      for (let i = 0; i < enemies.length; i++) {
        if (!dead.has(enemies[i])) enemies[w++] = enemies[i];
      }
      enemies.length = w;
    }
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
      // Stun immunity (Tsunade P5 — Byakugou)
      if (t._stunImmune) {
        t._stunImmuneTimer = (t._stunImmuneTimer || 0) - dt;
        if (t._stunImmuneTimer <= 0) { t._stunImmune = false; t._stunImmuneTimer = 0; }
        else { t.miniStunTimer = 0; t.disabled = false; }
      }
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
      // Tortura de DeSaad — tick e limpeza
      if ((t._tortureTimer || 0) > 0) {
        t._tortureTimer -= dt;
        if (t._tortureTimer <= 0) { t._tortureTimer = 0; t._tortureDmgMult = 1; }
      }

      if (t.disabled || t.verdictActive) return;
      t.attackTimer -= dt;
      if (t.attackTimer <= 0) {
        let stats = getTowerStats(t);
        if (stats.type === 'none' || stats.attack_speed <= 0) { t.attackTimer = 9999; return; }
        // DC debuffs — cópia para não mutar o cache
        if ((t._equacaoDebuff || 0) > 0 || (t._tortureDmgMult || 1) < 1) {
          stats = { ...stats };
          if (t._equacaoDebuff) {
            stats.damage      *= (1 - t._equacaoDebuff);
            stats.attack_speed *= (1 - t._equacaoDebuff);
          }
          if (t._tortureDmgMult) stats.damage *= t._tortureDmgMult;
        }
        const frenzyMult = (t._frenzyTimer || 0) > 0 ? (t._frenzyMult || 1) : (t._vizardActive ? 2.0 : 1.0);
        t.attackTimer = 1 / (stats.attack_speed * frenzyMult);
        tryAttack(t, stats);
      }
    });
    if (expired.length) towers = towers.filter(t => !expired.includes(t));

    // Darkseid 7★ — tick de sombras e inimigos convertidos pelo Abraço do Abismo
    towers.forEach(t => {
      if (t.charData?.id !== 'darkseid_7star') return;
      const dStats = getTowerStats(t);
      const tyrantBonus = 1 + (t._tyrantStacks || 0) * 0.03;

      // Sombras de Apokolips
      if (t._darkseidshadows) {
        t._darkseidshadows = t._darkseidshadows.filter(sh => {
          if (sh.timer !== Infinity) sh.timer -= dt;
          sh._cdTimer = (sh._cdTimer || 0) - dt;
          if (sh._cdTimer <= 0) {
            sh._cdTimer = sh.cd || 1.0;
            const nearby = enemies.filter(e => !e.dead && !e._abyssConverted &&
              Math.sqrt((e.x-sh.x)**2 + (e.y-sh.y)**2) <= sh.range);
            if (nearby.length > 0) {
              const tgt = nearby.reduce((b, e) => e.dist > b.dist ? e : b, nearby[0]);
              dealDamage(t, tgt, dStats.damage * 0.35 * tyrantBonus);
            }
          }
          return sh.timer === Infinity || sh.timer > 0;
        });
      }

      // Abraço do Abismo — inimigos convertidos atacam e expiram
      enemies.forEach(e => {
        if (!e._abyssConverted || e.dead) return;
        e._abyssTimer -= dt;
        if (e._abyssTimer <= 0) {
          // Expira — morre sem dar ouro; a limpeza ocorre no próximo tick de updateEnemiesLoop
          e._abyssConverted = false;
          e._noGold         = true;
          e.dead            = true;
          return;
        }
        // Ataca inimigos próximos
        e._abyssCdTimer = (e._abyssCdTimer || 0) - dt;
        if (e._abyssCdTimer <= 0) {
          e._abyssCdTimer = 1.2;
          const tgt = enemies.find(en => !en.dead && !en._abyssConverted &&
            Math.sqrt((en.x-e.x)**2 + (en.y-e.y)**2) <= 100);
          if (tgt) dealDamage(t, tgt, e.maxHp * 0.05);
        }
      });
    });

    // Atualiza set de torres buffadas pela aura do Gojo (uma vez por tick, não por frame)
    _gojoBuffedSet.clear();
    towers.forEach(gt => {
      const gp = gt.charData?.passive;
      if (gp?.type !== 'damage_aura' || gt.disabled) return;
      const gr = getTowerStats(gt).range;
      towers.forEach(t => { if (t !== gt && distSq(gt.x, gt.y, t.x, t.y) <= gr * gr) _gojoBuffedSet.add(t); });
    });
  }

  function effectiveCanDamage(tower, enemy) {
    const override = PASSIVE_SYSTEM.canDamageOverride(tower, enemy);
    if (override !== null) return override;
    return canTowerDamage(tower.upgradeLevel, enemy.req);
  }

  function tryAttack(tower, stats) {
    const stormMult    = (_sandStormActive && stage?.modifiers?.sandStorm) ? 0.6 : 1;
    // DC: blackout reduz alcance 50%; gravity zone reduz 30% se torre estiver dentro
    let dcRangeMult = 1;
    if (stage?.world === 'dc') {
      if (_dcBlackoutActive) dcRangeMult *= 0.5;
      if ((_gravityZones || []).some(gz => dist2d(tower.x, tower.y, gz.x, gz.y) <= gz.r))
        dcRangeMult *= 0.7;
    }
    const rangeThreshold = stats.range * stormMult * dcRangeMult;
    const tx = tower.x, ty = tower.y;
    const inRange = [];
    for (let i = 0; i < _aliveEnemies.length; i++) {
      const e = _aliveEnemies[i];
      if (distSq(tx, ty, e.x, e.y) <= rangeThreshold * rangeThreshold) inRange.push(e);
    }
    if (inRange.length === 0) return;

    // Passiva pré-ataque: pode modificar stats ou retornar null para pular
    const modStats = PASSIVE_SYSTEM.onBeforeAttack(tower, stats);
    if (modStats === null) return;
    stats = modStats;

    const handler = ATTACK_TYPE_HANDLERS[stats.type];
    if (!handler) return;

    tower._currentAttackType = stats.type;
    const hitEnemies = handler.execute(tower, stats, inRange);
    tower._currentAttackType = null;

    // Status do upgrade aplicado imediatamente ao acertar
    if (tower.statusEffect && hitEnemies.length > 0) {
      hitEnemies.forEach(e => applyStatus(e, tower.statusEffect.type, tower.statusEffect));
    }

    // Passiva pós-ataque: double hit, clone spawning, etc.
    PASSIVE_SYSTEM.onAfterAttack(tower, hitEnemies, stats.type, stats);

    // Efeito visual do tipo de ataque
    handler.effect(tower, stats, hitEnemies);
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

    // Jinchuuriki — Replicante de Killer Bee: imune ao tipo de ataque atual
    if (enemy.jinchuurikiImmuneType && tower && tower._currentAttackType === enemy.jinchuurikiImmuneType) {
      addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:30, color:'#7c3aed', timer:0.3, maxTimer:0.3, r:0 });
      return;
    }

    // Passiva do atacante (multiplicadores, status, efeitos colaterais)
    let dmg = PASSIVE_SYSTEM.onHit(tower, enemy, damage);

    // Auras de torres aliadas próximas
    dmg = PASSIVE_SYSTEM.applyAuras(tower, enemy, dmg);

    // Multiplicadores de dano por status
    if (enemy.status?.medo?.active)       dmg *= 1.25;
    if (enemy.status?.cross_mark?.active) dmg *= (1 + enemy.status.cross_mark.bonus);
    if (enemy.status?.gyuki_ink?.active)  dmg *= (1 + enemy.status.gyuki_ink.bonus);

    // Armadura do inimigo — ignorada por ataques omega
    const isOmega = tower?.charData?.base_stats?.type === 'omega';
    if (!isOmega && enemy._damageMult) dmg = Math.round(dmg * enemy._damageMult);

    // PTYPE onDamageTaken: sand_shield (burst), futuros behaviors de intercepção
    if (dispatchPtypeDamageTaken(enemy, dmg)) return;

    if (!isOmega && (enemy.shieldHp || 0) > 0) {
      const absorbed = Math.min(enemy.shieldHp, dmg);
      enemy.shieldHp -= absorbed;
      dmg -= absorbed;
      if (enemy.shieldHp <= 0) {
        enemy.shieldHp = 0;
        const ringCol = (enemy.ptypes || []).includes('fortified') ? '#f59e0b' : '#60a5fa';
        addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:60, color:ringCol, timer:0.55, maxTimer:0.55, r:0 });
        UI.toast(I18N.t('evt_shield_broken', { name: enemy.name }), 2500);
      }
      if (dmg <= 0) { enemy.hitFlash = 0.1; return; }
    }

    // Omega Bond mirror damage — 40% replicado no parceiro vinculado
    if (enemy._omegaBondPartner && !enemy._omegaBondPartner.dead) {
      const partner = enemy._omegaBondPartner;
      if (!partner._omegaBondMirrorGuard) {
        partner._omegaBondMirrorGuard = true;
        partner.hp -= Math.round(dmg * 0.40);
        partner._omegaBondMirrorGuard = false;
        addEffect({ type:'line', x:enemy.x, y:enemy.y, tx:partner.x, ty:partner.y, color:'#ff6b1a', timer:0.12, maxTimer:0.12 });
        if (partner.hp <= 0) killEnemy(partner, tower);
      }
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
    if (enemy._noGold) { /* Abraço do Abismo — sem ouro */ } else
    gold += 35;
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

    // Inimigo infectado morre → ressurge como zumbi no ponto de morte
    if (enemy.status?.infectado?.active) {
      const pathArr = enemy.pathArr || (window.currentPaths?.[0] || PATH_POINTS);
      zombies.push({
        hp: 2500, maxHp: 2500,
        dist: enemy.dist,
        speed: 52, dps: 80,
        color: '#7AFF50',
        hitIds: new Set(), pathArr,
        fromInfection: true
      });
    }

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
    let w = 0;
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (p.dead) continue;
      if (p.target.dead || p.target.reached_end) continue;
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 10) {
        if (effectiveCanDamage(p.tower, p.target)) dealDamage(p.tower, p.target, p.damage);
        if (p.tower.statusEffect) applyStatus(p.target, p.tower.statusEffect.type, { duration: p.tower.statusEffect.duration });
        continue;
      }
      p.angle = Math.atan2(dy, dx);
      const spd = p.speed * dt;
      p.x += (dx/d)*spd;
      p.y += (dy/d)*spd;
      projectiles[w++] = p;
    }
    projectiles.length = w;
  }

  function updateEffects(dt) {
    if (screenShakeAmount > 0) screenShakeAmount = Math.max(0, screenShakeAmount - dt * 30);
    if (vizardOverlayAlpha > 0) vizardOverlayAlpha = Math.max(0, vizardOverlayAlpha - dt * 0.05);

    let w = 0;
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      e.timer -= dt;
      // Clamp radius to >= 0 to prevent ctx.arc errors with negative values
      if (e.type === 'ring')         e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 0.35)));
      if (e.type === 'shockwave')    e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 1.0)));
      if (e.type === 'hollow_burst') e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 0.50)));
      if (e.timer > 0) effects[w++] = e;
    }
    effects.length = w;
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
        _submitScore('infinite');
      }
      _contributeMissionStats(false);
      Missions.check();
      if (typeof AudioManager !== 'undefined') AudioManager.stopBgm();
      UI.showPostBattle({
        victory: false,
        infiniteWave:    isInfiniteMode ? wave : 0,
        infiniteDrops:   isInfiniteMode ? { ..._infiniteSession.drops } : null,
        infiniteGems:    isInfiniteMode ? _infiniteSession.gems : 0
      });
      return;
    }
    if (isInfiniteMode) return; // modo infinito não tem vitória, apenas derrota

    // Victory rewards
    const gemMap = { normal:50, dificil:100, lendario:200 };
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
        // oneTime: só entrega se jogador ainda não possui a unidade
        if (drop.oneTime) {
          if (Save.getUnitQty(drop.id) === 0) dropsAcheived.push(drop.id);
          continue;
        }

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
        const isOneTime = stage.drops?.find(d => d.id === matId)?.oneTime;
        if (isOneTime) UI.toast(I18N.t('evt_char_unlocked', { name: charDrop.name.toUpperCase() }), 6000);
      } else {
        Save.addMaterial(matId);
      }
    });


    // Atualiza localmente para feedback imediato (otimista)
    // Drops já foram adicionados pelo loop acima; aqui só gems e conclusão de fase
    Save.addGems(gems);
    Save.markStageComplete(stageId, difficulty);
    Save.setStat('fases_completas', Object.keys(Save.get().fases_completas).length);

    WORLDS.forEach(w => {
      if (!w.completionStat || w.id === 'infinito') return;
      const worldStages = getStagesByWorld(w.id);
      if (worldStages.some(s => s.id === stageId))
        Save.incStat(w.completionStat.replace('_completas', '_jogadas'));
      if (worldStages.every(s => Save.isStageComplete(s.id, 'normal')))
        Save.setStat(w.completionStat, worldStages.length);
    });

    let bonusGems = 0;
    if (isBossFase && firstTime) {
      bonusGems = 100;
      Save.addGems(bonusGems);
      Save.addMaterial('ninja_generico_3');
    }

    _submitScore('stage');
    _contributeMissionStats(true);
    Missions.check();
    if (typeof AudioManager !== 'undefined') AudioManager.stopBgm();
    UI.showPostBattle({ victory: true, gems, materials: dropsAcheived, bonusGems: firstTime ? Math.max(50, bonusGems) : 0 });

    // Confirma recompensas no servidor (background) — o save retornado sobrescreve
    // o estado local com os valores autoritativos (gemas e drops reais do servidor)
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) {
      const duration_s = Math.max(0, Math.round((performance.now() - _gameStartTime) / 1000));
      Online.completeStage(stageId, difficulty, duration_s, sessionBossKilled).then(result => {
        if (result?.ok && result.save) {
          Save._mergeData(result.save);
          if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
        } else {
          Online.syncSave().then(r => {
            if (r?.ok && typeof UI !== 'undefined') UI.updateCurrencyDisplay();
          }).catch(() => {});
        }
      }).catch(() => {
        Online.syncSave().catch(() => {});
      });
    }
  }

  function _submitScore(mode) {
    if (typeof Online === 'undefined' || !Online.isLoggedIn()) return;
    const duration_s  = Math.max(1, Math.round((performance.now() - _gameStartTime) / 1000));
    const units_used  = [...new Set(towers.filter(t => !t.isClone).map(t => t.charId).filter(Boolean))];
    const diffMults   = { normal: 1, dificil: 1.5, lendario: 2.2 };
    const dm          = diffMults[difficulty] || 1;

    if (mode === 'infinite') {
      Online.postScore({
        mode:       'infinite',
        score:      wave,
        wave,
        damage:     Math.round(sessionDmg),
        duration_s,
        units_used,
      });
    } else {
      Online.postScore({
        mode:       'stage',
        stage_id:   stage?.id || null,
        difficulty: difficulty || 'normal',
        score:      Math.round((1_000_000 / duration_s) * dm),
        wave,
        damage:     Math.round(sessionDmg),
        duration_s,
        units_used,
      });
    }
  }

  function _contributeMissionStats(victory) {
    if (typeof Online === 'undefined' || !Online.isLoggedIn()) return;
    const mission = Online.getActiveMission();
    if (!mission || mission.completed) return;
    let value = 0;
    switch (mission.goal_type) {
      case 'kills':          value = sessionKills;           break;
      case 'damage':         value = Math.round(sessionDmg); break;
      case 'stages_cleared': value = victory ? 1 : 0;        break;
    }
    if (value > 0) Online.contributeToMission(mission.id, value);
  }

  function deselectTower() { 
    selectedTowerIdx = -1; 
    deployingCharId = null;
    closeUpgradePanel(); 
    renderTeamPanel();
  }

  function getTowerStats(tower) {
    if (tower._statsCache) return tower._statsCache;
    const charData = (tower._shazamTransformed && tower.charData.transformed_stats)
      ? { ...tower.charData, base_stats: tower.charData.transformed_stats }
      : tower.charData;
    const stats = getCurrentStats(charData, tower.level);
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const upg = tower.charData.upgrades[i];
      if (upg.damage_mult)  stats.damage *= upg.damage_mult;
      if (upg.damage_bonus) stats.damage += upg.damage_bonus;
      if (upg.range_mult) {
        const rarity = tower.charData?.rarity ?? 0;
        const effectiveMult = (rarity >= 3)
          ? 1 + (upg.range_mult - 1) * 0.2
          : upg.range_mult;
        stats.range *= effectiveMult;
      }
      if (upg.speed_mult)   stats.attack_speed *= upg.speed_mult;
      if (upg.type)         stats.type = upg.type;
    }
    if ((tower.prestige || 0) > 0) {
      if (tower.charData?.is_farm_unit) {
        stats.range *= 1 + tower.prestige * 0.01;
      } else {
        stats.damage *= 1 + tower.prestige * 0.10;
        stats.range  *= 1 + tower.prestige * 0.02;
      }
    }
    if (tower.cloneDamagePct != null && tower.cloneDamagePct < 1)
      stats.damage *= tower.cloneDamagePct;
    // Darkseid 7★ Tyrant Rising — permanent kill-based bonus
    if ((tower._tyrantStacks || 0) > 0) {
      const tyrantPct = tower.charData?.upgrades?.slice(0, tower.upgradeLevel)
        .reduce((v, u) => u.passive_override?.tyrant_dmgPerStack ?? v, 0.02) || 0.02;
      stats.damage *= 1 + tower._tyrantStacks * tyrantPct;
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

  function useAbility(slotIdx) {
    if (slotIdx < 0 || !towers[slotIdx]) return;
    const tower = towers[slotIdx];
    const aa = tower.charData?.active_ability;
    if (!aa) return;
    if (tower.abilityTimer > 0) {
      UI.toast(`${I18N.t('err_cooldown')} (${Math.ceil(tower.abilityTimer)}s)`, 2000);
      return;
    }
    if (aa.type === 'domain_expansion') {
      const stunDur = getActiveValue(tower, 'stun_duration', aa.stun_duration);
      enemies.forEach(e => {
        if (!e.dead && !e.reached_end) applyStatus(e, 'paralisia', { duration: stunDur });
      });
      addEffect({ type:'shockwave', x:CANVAS_W/2, y:CANVAS_H/2, maxR:820, color:'#5b9cf6', timer:1.0, maxTimer:1.0, r:0 });
      UI.toast(I18N.t('evt_domain_expanded', { s: stunDur }), 3000);
      tower.abilityTimer = aa.cooldown;
    }
  }

  function addEffect(ef) { effects.push(ef); }

  function getTowers() {
    return towers;
  }

  function addGold(amount) {
    gold += amount;
    updateHUD();
  }

  // Interrompe o loop imediatamente sem exibir tela pós-batalha.
  // Chamado pelo sistema online quando a sessão expira ou o usuário faz logout.
  function forceStop() {
    if (!running) return;
    running = false;
    if (typeof AudioManager !== 'undefined') AudioManager.stopBgm();
  }

  return {
    init, startGame, togglePause, toggleSpeed, sellTower, buyNextUpgrade,
    retryStage, handleClick, getTowers, deployTower, selectTower,
    useAbility, deselectTower, skipWave,
    undoLastTower, forceStop
  };
})();