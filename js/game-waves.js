// js/game-waves.js — Wave spawning, progression, and stage modifiers.
// Depends on: _wavesCtx, _attackCtx (game-utils.js), PASSIVE_SYSTEM (game-passives.js),
//             INFINITE_TIERS, getInfiniteTierIdx, getInfiniteWaveMults, generateInfiniteWave, giveInfiniteReward (game-infinite.js),
//             updateHUD, renderWavePreview (game-hud.js), createEnemy (enemies.js),
//             getPosOnPath, getPathLength, PATH_POINTS (world.js), distSq (game-utils.js), UI (global).

function getDifficultyMults() {
  if (_wavesCtx.isInfiniteMode) return getInfiniteWaveMults(_wavesCtx.wave);
  if (_wavesCtx.difficulty === 'dificil')  return { hp: 1.5, gold: 1.2 };
  if (_wavesCtx.difficulty === 'lendario') return { hp: 2.2, gold: 1.4 };
  return { hp: 1.0, gold: 1.0 };
}

function triggerMeteorAndShinra() {
  UI.toast('⚠️ O PAIN USOU SHINRA TENSEI E QUEDA DE METEOROS! ⚠️', 4000);

  const towers = _wavesCtx.towers;
  const targets = [];
  if (towers.length > 0) {
    const numMeteors = Math.min(3, Math.ceil(towers.length / 3));
    for (let i = 0; i < numMeteors; i++) {
      const t = towers[Math.floor(Math.random() * towers.length)];
      targets.push({ x: t.x, y: t.y });
    }
  } else {
    targets.push({ x: CANVAS_W/2, y: CANVAS_H/2 });
  }

  targets.forEach(pt => {
    _wavesCtx.addEffect({ type: 'meteor_strike', x: pt.x, y: pt.y, maxR: 90, color: '#f56565', timer: 1.0, maxTimer: 1.0, r: 0 });
    towers.forEach(t => {
      if (distSq(t.x, t.y, pt.x, pt.y) <= 8100 && (t.stunCooldown || 0) <= 0) {
        const stun = 1 + Math.random() * 4;
        t.miniStunTimer = Math.max((t.miniStunTimer || 0), stun);
        t.stunCooldown = stun + 5;
        t.disabled = true;
      }
    });
  });

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

  _wavesCtx.shinraTenseiActive = true;
  _wavesCtx.shinraTenseiTimer = maxStun;
  _wavesCtx.addEffect({ type:'shockwave', x: CANVAS_W/2, y: CANVAS_H/2, maxR: 800, color: '#e74c3c', timer: 0.8, maxTimer: 0.8, r: 0 });

  _wavesCtx.enemies.forEach(e => {
    if (e.dead || e.reached_end) return;
    e.dist += 40;
    const pos = getPosOnPath(e.dist, e.pathArr);
    e.x = pos.x; e.y = pos.y;
  });
}

function triggerLightningStrike() {
  const aliveEnemies = _wavesCtx._aliveEnemies;
  if (aliveEnemies.length === 0) return;
  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  const strikeR = 80;
  const dmg = Math.round(800 + Math.random() * 400);
  _wavesCtx.addEffect({ type:'ring', x:target.x, y:target.y, maxR:strikeR, color:'#fde047', timer:0.5, maxTimer:0.5, r:4 });
  _wavesCtx.addEffect({ type:'ring', x:target.x, y:target.y, maxR:strikeR * 0.5, color:'#fafafa', timer:0.25, maxTimer:0.25, r:2 });
  for (let i = 0; i < aliveEnemies.length; i++) {
    const e = aliveEnemies[i];
    if (distSq(e.x, e.y, target.x, target.y) <= strikeR * strikeR) {
      _attackCtx.dealDamage({ _currentAttackType: 'aoe', charData: {} }, e, dmg);
    }
  }
  UI.toast(`⚡ Raio Errante! ${dmg} dano em área!`, 2000);
}

function startWave() {
  _wavesCtx.wave++;
  _wavesCtx.activeWavesCount = 1;
  _wavesCtx.spawnQueue = _wavesCtx.isInfiniteMode
    ? generateInfiniteWave(_wavesCtx.wave)
    : [..._wavesCtx.stage.waves[_wavesCtx.wave - 1]];
  if (!_wavesCtx.isInfiniteMode && _wavesCtx.stage?.modifiers?.dualFront) {
    const half = Math.floor(_wavesCtx.spawnQueue.length / 2);
    for (let i = half; i < _wavesCtx.spawnQueue.length; i++) {
      _wavesCtx.spawnQueue[i] = { ..._wavesCtx.spawnQueue[i], distFraction: 0.5 };
    }
  }
  _wavesCtx.waveElapsed = 0;
  _wavesCtx.waveActive = true;
  updateHUD();
  if (_wavesCtx.isInfiniteMode) {
    const tier = INFINITE_TIERS[getInfiniteTierIdx(_wavesCtx.wave)];
    const prev = INFINITE_TIERS[getInfiniteTierIdx(_wavesCtx.wave - 1)];
    if (_wavesCtx.wave > 1 && tier !== prev) {
      UI.toast(`⚡ NOVO NÍVEL: ${tier.name.toUpperCase()}`, 4000);
    }
  }
}

function skipWave() {
  if (_wavesCtx.betweenWaves) {
    if (_wavesCtx.betweenTimer < 0) {
      _wavesCtx.betweenWaves = false;
      startWave();
    } else {
      _wavesCtx.betweenTimer = 0;
    }
    return;
  }
  if (!_wavesCtx.waveActive || _wavesCtx.wave >= _wavesCtx.totalWaves) return;
  if (_wavesCtx.activeWavesCount >= 3) {
    UI.toast('⚠️ Limite de 2 waves extras atingido!');
    return;
  }

  const bonus = 100 * _wavesCtx.skipMultiplier;
  _wavesCtx.skipMultiplier++;
  _wavesCtx.gold += bonus;
  _wavesCtx.towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

  _wavesCtx.wave++;
  _wavesCtx.activeWavesCount++;

  const newEnemies = _wavesCtx.stage.waves[_wavesCtx.wave - 1];
  const currentElapsed = _wavesCtx.waveElapsed;
  const adjusted = newEnemies.map(e => ({ ...e, delay: e.delay + currentElapsed }));
  _wavesCtx.spawnQueue.push(...adjusted);
  _wavesCtx.spawnQueue.sort((a, b) => a.delay - b.delay);

  updateHUD();
  UI.toast(`⏩ Wave ${_wavesCtx.wave} chamada! +${bonus}💰 (×${_wavesCtx.skipMultiplier - 1})`);
}

function updateSpawn(dt) {
  if (!_wavesCtx.waveActive) return;
  _wavesCtx.waveElapsed += dt;
  while (_wavesCtx.spawnQueue.length > 0 && _wavesCtx.waveElapsed >= _wavesCtx.spawnQueue[0].delay) {
    const next = _wavesCtx.spawnQueue.shift();
    const e = createEnemy(next.type, 0);
    if (!e) continue;
    const _dm = getDifficultyMults();
    if (_dm.hp !== 1.0)   { e.maxHp = Math.round(e.maxHp * _dm.hp); e.hp = e.maxHp; }
    if (_dm.gold !== 1.0) { e.gold  = Math.round(e.gold  * _dm.gold); }
    if (window.currentPaths && window.currentPaths.length > 0) {
      e.pathArr = window.currentPaths[Math.floor(Math.random() * window.currentPaths.length)];
    } else {
      e.pathArr = PATH_POINTS;
    }
    e.pathLen = getPathLength(e.pathArr);
    e.dist = next.distFraction ? e.pathLen * next.distFraction : 0;
    if (!_wavesCtx.isInfiniteMode && _wavesCtx.stage?.modifiers?.sandShield && !e.is_boss) {
      e.sandShield = true;
      e._sandBurst = 0;
      e._sandBurstStart = 0;
    }
    _wavesCtx.enemies.push(e);
    _wavesCtx.dispatchSpecialSpawn(e);
  }
}

function activateShinraTensei() {
  let maxStun = 1;
  _wavesCtx.towers.forEach(t => {
    if ((t.stunCooldown || 0) <= 0) {
      const stun = 1 + Math.random() * 4;
      t.miniStunTimer = Math.max((t.miniStunTimer || 0), stun);
      t.stunCooldown = stun + 5;
      t.disabled = true;
      if (stun > maxStun) maxStun = stun;
    }
  });
  _wavesCtx.shinraTenseiActive = true;
  _wavesCtx.shinraTenseiTimer = maxStun;
  _wavesCtx.addEffect({ type:'shockwave', x:400, y:240, maxR:600, color:'#e74c3c', timer:1.0, r:0 });
  UI.toast('⚡ SHINRA TENSEI! Torres stunadas aleatoriamente!', 4000);
}

function updateShinraTensei(dt) {
  if (!_wavesCtx.shinraTenseiActive) return;
  _wavesCtx.shinraTenseiTimer -= dt;
  if (_wavesCtx.shinraTenseiTimer <= 0) {
    _wavesCtx.shinraTenseiActive = false;
    _wavesCtx.towers.forEach(t => { if ((t.miniStunTimer || 0) <= 0) t.disabled = false; });
  }
}

function checkWaveEnd() {
  if (!_wavesCtx.waveActive) return;
  if (_wavesCtx.spawnQueue.length === 0 && _wavesCtx.enemies.length === 0) {
    _wavesCtx.waveActive = false;
    const bonus = 100;
    _wavesCtx.gold += bonus;
    updateHUD();
    renderWavePreview();
    if (bonus > 0) UI.toast(`Wave ${_wavesCtx.wave} completa! +${bonus} 💰`);

    _wavesCtx.towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

    if (_wavesCtx.isInfiniteMode) {
      if (_wavesCtx.wave % 5 === 0) giveInfiniteReward(_wavesCtx.wave);
      _wavesCtx.betweenWaves = true;
      _wavesCtx.betweenTimer = 3;
    } else if (_wavesCtx.wave >= _wavesCtx.totalWaves) {
      _wavesCtx.endGame(true);
    } else {
      _wavesCtx.betweenWaves = true;
      _wavesCtx.betweenTimer = 3;
    }
  }
}
