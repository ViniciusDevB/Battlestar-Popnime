// js/game-towers.js — Placement, selection, deployment, and upgrade logic.
// Depends on: _towersCtx, _renderCtx (game-utils.js), _passiveCtx (game-passives.js),
//             closeUpgradePanel, openUpgradePanel, updateHUD, renderTeamPanel (game-hud.js),
//             distSq, distToSegment (game-utils.js), getCharById, getCurrentStats (characters.js),
//             CANVAS_W, CANVAS_H, PATH_POINTS (world.js), Save, Missions, UI (globals).

function spawnClone(origin) {
  const p = origin.charData.passive;
  const maxClones = _passiveCtx.getPassiveValue(origin, 'maxClones', p.maxClones);
  const cloneDuration = _passiveCtx.getPassiveValue(origin, 'duration', p.duration);
  const towers = _towersCtx.towers;
  const existing = towers.filter(t => t.isClone && t.charId === origin.charId).length;
  if (existing >= maxClones) return;

  const angle = Math.random() * Math.PI * 2;
  const r = 36 + Math.random() * 28;
  const cx = Math.max(24, Math.min(CANVAS_W - 24, origin.x + Math.cos(angle) * r));
  const cy = Math.max(24, Math.min(CANVAS_H - 36, origin.y + Math.sin(angle) * r));

  const cloneDamagePct = p.damage_pct != null ? p.damage_pct : 1.0;
  towers.push({
    slotId: null, charId: origin.charId,
    x: cx, y: cy,
    rarity: origin.rarity, initials: origin.initials,
    charData: origin.charData,
    level: origin.level, upgradeLevel: origin.upgradeLevel,
    disabled: false,
    attackTimer: Math.random() * (1 / _renderCtx.getTowerStats(origin).attack_speed),
    statusEffect: origin.statusEffect, currentType: origin.currentType,
    isClone: true, cloneTimer: cloneDuration, cloneDamagePct
  });
  UI.toast(I18N.t('tower_clone_spawned', { s: cloneDuration }), 2000);
}

function handleClick(e) {
  const rect = _towersCtx.canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left - _towersCtx.renderOffX) / _towersCtx.renderScale;
  const cy = (e.clientY - rect.top  - _towersCtx.renderOffY) / _towersCtx.renderScale;

  if (_towersCtx.deployingCharId) {
    if (isValidPlacement(cx, cy)) {
      deployTower(cx, cy, _towersCtx.deployingCharId);
      _towersCtx.deployingCharId = null;
      renderTeamPanel();
    } else {
      UI.toast(I18N.t('tower_invalid_spot'));
    }
    return;
  }

  const towers = _towersCtx.towers;
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    if (distSq(cx, cy, t.x, t.y) < 900) {
      selectTower(i);
      return;
    }
  }
  _towersCtx.selectedTowerIdx = -1;
  _towersCtx.deployingCharId = null;
  renderTeamPanel();
  closeUpgradePanel();
}

function handleMouseMove(e) {
  const rect = _towersCtx.canvas.getBoundingClientRect();
  _renderCtx.hoverX = (e.clientX - rect.left - _towersCtx.renderOffX) / _towersCtx.renderScale;
  _renderCtx.hoverY = (e.clientY - rect.top  - _towersCtx.renderOffY) / _towersCtx.renderScale;
}

function deployTower(x, y, charId) {
  const char = getCharById(charId);
  const unitData = Save.getBestUnitData(charId);
  if (!char || !unitData) return;
  if (_towersCtx.gold < char.deploy_cost) { UI.toast(I18N.t('err_gold')); return; }
  const maxCopies = char.rarity >= 6 ? 1 : 3;
  const towers = _towersCtx.towers;
  const copies = towers.filter(t => t.charId === charId && !t.isClone).length;
  if (copies >= maxCopies) {
    UI.toast(I18N.t('tower_max_copies', { name: char.name }), 2000); return;
  }

  _towersCtx.gold -= char.deploy_cost;
  _towersCtx.sessionTowersPlaced++;
  const stats = getCurrentStats(char, unitData.nivel);

  const newTower = {
    slotId: null, charId, x, y,
    rarity: char.rarity, initials: char.initials,
    charData: char, level: unitData.nivel,
    upgradeLevel: 0, disabled: _towersCtx.shinraTenseiActive,
    attackTimer: 0, statusEffect: null, currentType: stats.type,
    prestige: unitData.prestige || 0
  };
  towers.push(newTower);
  _towersCtx._lastPlacedTower = newTower;
  updateHUD();
  Save.incStat('torres_colocadas');
  Missions.check();
}


function undoLastTower() {
  if (_towersCtx.waveActive && _towersCtx.enemies.length > 0) {
    UI.toast(I18N.t('tower_undo_unavailable'), 2000);
    return;
  }
  if (!_towersCtx._lastPlacedTower) { UI.toast(I18N.t('tower_undo_none'), 1500); return; }
  const towers = _towersCtx.towers;
  const idx = towers.indexOf(_towersCtx._lastPlacedTower);
  if (idx < 0) { _towersCtx._lastPlacedTower = null; return; }
  const t = towers.splice(idx, 1)[0];
  _towersCtx.gold += getCharById(t.charId)?.deploy_cost || 0;
  _towersCtx._lastPlacedTower = null;
  if (_towersCtx.selectedTowerIdx === idx) { _towersCtx.selectedTowerIdx = -1; closeUpgradePanel(); }
  renderTeamPanel();
  updateHUD();
  UI.toast(I18N.t('tower_undo_done', { name: t.charData?.name || '—' }), 2000);
}

function selectTower(idx) {
  _towersCtx.selectedTowerIdx = idx;
  if (idx < 0 || !_towersCtx.towers[idx]) {
    closeUpgradePanel();
    return;
  }
  openUpgradePanel(_towersCtx.towers[idx], idx);
}

function buyUpgrade(towerIdx, upgradeIdx) {
  const tower = _towersCtx.towers[towerIdx];
  if (!tower) return;
  const char = getCharById(tower.charId);
  const upg = char?.upgrades[upgradeIdx];
  if (!upg || tower.upgradeLevel !== upgradeIdx) return;
  if (_towersCtx.gold < upg.cost) { UI.toast(I18N.t('err_gold')); return; }

  _towersCtx.gold -= upg.cost;
  tower.upgradeLevel++;
  tower._statsCache = null;
  if (upg.status_effect) tower.statusEffect = upg.status_effect;
  if (upg.type) tower.currentType = upg.type;
  updateHUD();
  openUpgradePanel(tower, towerIdx);
  UI.toast(I18N.t('tower_upgrade_activated', { name: upg.name }));
}

function sellTower() {
  if (_towersCtx.selectedTowerIdx < 0) return;
  const tower = _towersCtx.towers[_towersCtx.selectedTowerIdx];
  if (!tower) return;
  const char = getCharById(tower.charId);

  const _passives = char?.passive ? (Array.isArray(char.passive) ? char.passive : [char.passive]) : [];
  const hasEconomy = _passives.some(p => p.type === 'edo_tensei_economy');
  let totalInvested = char?.deploy_cost || 0;
  for (let i = 0; i < tower.upgradeLevel; i++) {
    if (char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
  }
  const val = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);

  _towersCtx.gold += val;
  _towersCtx.towers.splice(_towersCtx.selectedTowerIdx, 1);
  _towersCtx.selectedTowerIdx = -1;
  closeUpgradePanel();
  updateHUD();
}

function buyNextUpgrade() {
  if (_towersCtx.selectedTowerIdx < 0) return;
  const tower = _towersCtx.towers[_towersCtx.selectedTowerIdx];
  if (tower) buyUpgrade(_towersCtx.selectedTowerIdx, tower.upgradeLevel);
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
  const zones = _towersCtx.stage?.modifiers?.blockZones;
  if (zones && Array.isArray(zones)) {
    for (const z of zones) {
      if (distSq(x, y, z.x, z.y) < z.r * z.r) return false;
    }
  }
  for (const t of _towersCtx.towers) {
    if (distSq(x, y, t.x, t.y) < 900) return false;
  }
  return true;
}
