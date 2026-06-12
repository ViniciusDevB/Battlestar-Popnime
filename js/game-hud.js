// js/game-hud.js — Atualização de DOM: HUD, painel de upgrade, preview de waves, painel do time.
// Depende de: _hudCtx (game-utils.js), RARITY_COLORS (characters.js),
//             ENEMY_DEFS (enemies.js), INFINITE_TIERS/getInfiniteTierIdx (game-infinite.js),
//             charIconInner/getCharById/getCurrentStats (characters.js), Save, UI (globals).

let _lastHudGold = -1; // detecta mudança de ouro para re-render do painel

const PTYPE_PREVIEW_COLORS = {
  normal: '#6b7280', speed: '#3b82f6', fortified: '#f59e0b',
  regenerator: '#10b981', bomber: '#ef4444', powerful1: '#a78bfa',
  powerful2: '#7c3aed', powerful3: '#4f46e5', powerful3b: '#6366f1'
};

function closeUpgradePanel() {
  const p = document.getElementById('upgrade-panel');
  if (p) p.style.display = 'none';
}

function openUpgradePanel(tower, slotIdx) {
  const panel = document.getElementById('upgrade-panel');
  const nameEl = document.getElementById('upgrade-unit-name');
  const optsEl = document.getElementById('upgrade-options');
  if (!panel) return;

  const char = getCharById(tower.charId);
  const stats = _hudCtx.getTowerStats(tower);
  const passives = char?.passive ? (Array.isArray(char.passive) ? char.passive : [char.passive]) : [];
  const passiveHtml = passives.map(p => `<div class="upg-passive">⚡ ${p.label}</div>`).join('');
  nameEl.innerHTML = `<span style="background:${RARITY_COLORS[tower.rarity]}" class="tower-badge">${tower.initials}</span> ${char?.name} | Lv${tower.level}`;
  panel.querySelectorAll('.upg-passive').forEach(el => el.remove());
  if (passiveHtml) nameEl.insertAdjacentHTML('afterend', passiveHtml);

  optsEl.innerHTML = '';

  const typeLabels = {
    single_target: I18N.t('attack_type_single'),
    single:        I18N.t('attack_type_single'),
    linha:         I18N.t('attack_type_line'),
    cone:          I18N.t('attack_type_cone'),
    aoe:           I18N.t('attack_type_aoe'),
    aoe_full:      I18N.t('attack_type_aoe_full'),
    aoe_vizard_total: I18N.t('attack_type_vizard'),
    support:       I18N.t('attack_type_support'),
    pierce:        I18N.t('attack_type_single'),
    scatter:       I18N.t('attack_type_aoe'),
    none:          '—'
  };
  const gold = _hudCtx.gold;
  const waveActive = _hudCtx.waveActive;
  const frenzyMult  = (tower._frenzyTimer || 0) > 0 ? ` ×${tower._frenzyMult||1} FRENZY` : '';
  const prestigeRow = (tower.prestige || 0) > 0
    ? `<div class="upg-stat-row" style="color:#fbbf24">${
        tower.charData?.is_farm_unit
          ? I18N.t('hud_prestige_farm', { prestige: tower.prestige, gold: tower.prestige * 2, rng: tower.prestige * 2 })
          : I18N.t('hud_prestige', { prestige: tower.prestige, dmg: tower.prestige * 10, rng: tower.prestige * 2 })
      }</div>`
    : '';

  const nextUpgIdx = tower.upgradeLevel;
  const nextUpg    = char?.upgrades?.[nextUpgIdx];
  let nextStats = null;
  if (nextUpg && nextUpgIdx < (char?.upgrades?.length || 0)) {
    const tempTower = { ...tower, upgradeLevel: nextUpgIdx + 1 };
    nextStats = _hudCtx.getTowerStats(tempTower);
  }

  function statRow(label, cur, nxt) {
    if (nxt == null || nxt === cur) return `<div class="upg-stat-row"><span>${label}</span><span>${cur}</span></div>`;
    const better = typeof cur === 'number' ? nxt > cur : false;
    const col = better ? '#39FF14' : '#f87171';
    return `<div class="upg-stat-row upg-stat-cmp"><span>${label}</span><span>${cur} <span class="upg-next-val" style="color:${col}">→ ${nxt}</span></span></div>`;
  }

  const statsEl = document.createElement('div');
  statsEl.className = 'upg-stats-block';

  const totalUpgradesCount = char?.upgrades?.length || 0;
  const isMaximized = tower.upgradeLevel >= totalUpgradesCount && totalUpgradesCount > 0;

  // DPS: usa realtime se disponível, senão calcula do base (damage × attack_speed)
  const _dpsVal = tower.realtimeDPS > 0
    ? tower.realtimeDPS
    : stats.damage * stats.attack_speed;
  const _dpsLabel = tower.realtimeDPS > 0 ? '📊 DPS' : '📊 DPS est.';
  const _dpsRow = _dpsVal > 0
    ? `<div class="upg-stat-row"><span>${_dpsLabel}</span><span style="color:#fbbf24;font-weight:700">${_dpsVal >= 1000 ? (_dpsVal/1000).toFixed(1)+'k' : Math.round(_dpsVal)}</span></div>`
    : '';

  statsEl.innerHTML = `
    ${statRow(I18N.t('stat_damage'), Math.round(stats.damage), nextStats ? Math.round(nextStats.damage) : null)}
    ${statRow(I18N.t('stat_range'), Math.round(stats.range) + 'px', nextStats ? Math.round(nextStats.range) + 'px' : null)}
    ${statRow(I18N.t('stat_atk_speed'), stats.attack_speed.toFixed(2) + '/s' + frenzyMult, nextStats ? nextStats.attack_speed.toFixed(2) + '/s' : null)}
    <div class="upg-stat-row"><span>${I18N.t('stat_type')}</span><span>${typeLabels[stats.type] || stats.type}</span></div>
    ${_dpsRow}
    ${prestigeRow}
    ${(() => {
      const relicSave = tower.equippedRelic;
      if (!relicSave) return '';
      const _r = typeof getRelicById !== 'undefined' ? getRelicById(relicSave.id) : null;
      if (!_r) return '';
      const _corruptMark = relicSave.isCorrupted ? ' ☠' : '';
      return `<div class="upg-relic-badge${relicSave.isCorrupted ? ' upg-relic-corrupted' : ''}">${_r.icon} ${_r.name}${_corruptMark}</div>`;
    })()}
    ${isMaximized ? `<div class="upg-stat-row" style="color:#fbbf24;font-weight:700;text-align:center">${I18N.t('hud_maximized')}</div>` : ''}`;
  optsEl.appendChild(statsEl);

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
      ? `⚡ ${aa.label} <span class="ability-badge ability-badge--ready">${I18N.t('hud_ability_ready')}</span>`
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
    div.className = `upg-item${purchased ? ' upg-done' : isNext ? ' upg-next' : ' upg-locked'}${isNext && !canAfford ? ' cant-afford' : ''}`;
    div.innerHTML = `
      <div class="upg-name">${upg.name} ${purchased ? '✔' : ''}</div>
      <div class="upg-desc">${upg.desc}</div>
      <div class="upg-cost">${purchased ? I18N.t('hud_purchased') : `${upg.cost} 💰 ${isNext ? '<span style="font-size:9px;color:#aaa;margin-left:5px;">(U)</span>' : ''}`}</div>`;
    if (isNext) {
      div.style.cursor = canAfford ? 'pointer' : 'not-allowed';
      if (canAfford) div.addEventListener('click', () => _hudCtx.buyUpgrade(slotIdx, i));
    }
    optsEl.appendChild(div);
  });

  const passivesArr = passives;
  const hasEconomy = passivesArr.some(p => p.type === 'edo_tensei_economy');
  let totalInvested = tower.paidDeployCost ?? (char?.deploy_cost || 0);
  for (let i = 0; i < tower.upgradeLevel; i++) {
    if (char?.upgrades?.[i]) totalInvested += char.upgrades[i].cost;
  }
  const sellVal = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
  const sellBtn = panel.querySelector('.btn-sell');
  if (sellBtn) sellBtn.textContent = I18N.t('hud_sell_btn', { val: sellVal });

  panel.style.display = 'flex';
}

function renderWavePreview() {
  const el = document.getElementById('wave-preview');
  if (!el) return;
  const wave = _hudCtx.wave;
  const stage = _hudCtx.stage;
  const isInfiniteMode = _hudCtx.isInfiniteMode;
  const betweenWaves = _hudCtx.betweenWaves;

  const nextWaveIdx = wave;
  if (isInfiniteMode || !stage || !stage.waves || nextWaveIdx >= stage.waves.length) {
    el.style.display = 'none';
    return;
  }
  const nextWave = stage.waves[nextWaveIdx];
  if (!nextWave || nextWave.length === 0) { el.style.display = 'none'; return; }

  const counts = {};
  nextWave.forEach(entry => {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  });

  const hasBoss     = nextWave.some(e => (ENEMY_DEFS[e.type]?.is_boss));
  const hasMiniboss = nextWave.some(e => (ENEMY_DEFS[e.type]?.is_miniboss));

  let html = `<div class="wp-title">`;
  if (hasBoss)          html += `<span class="wp-alert wp-boss">⚠️ BOSS</span>`;
  else if (hasMiniboss) html += `<span class="wp-alert wp-mini">☆ MINI-BOSS</span>`;
  html += `Wave ${nextWaveIdx + 1}:</div><div class="wp-enemies">`;

  Object.entries(counts).forEach(([typeId, count]) => {
    const def = ENEMY_DEFS[typeId];
    if (!def) return;
    const ptypes = Array.isArray(def.ptype) ? def.ptype : [def.ptype];
    const col = PTYPE_PREVIEW_COLORS[ptypes.find(p => PTYPE_PREVIEW_COLORS[p]) || 'normal'] || '#6b7280';
    html += `<div class="wp-entry">
      <div class="wp-dot" style="background:${col}"></div>
      <span class="wp-name">${def.name}</span>
      <span class="wp-count">×${count}</span>
    </div>`;
  });
  html += '</div>';

  el.innerHTML = html;
  el.style.display = betweenWaves ? 'flex' : 'none';
}

function updateHUDChips() {
  const aliveCount = (_hudCtx._aliveEnemies || []).length;
  const queueCount = (_hudCtx.spawnQueue || []).length;
  const waveActive = _hudCtx.waveActive;
  const total = aliveCount + queueCount;
  const chip = document.getElementById('hud-chip-enemies');
  const val  = document.getElementById('hud-enemies-count');
  if (!chip) return;
  if (waveActive && total > 0) {
    if (chip.style.display !== 'flex') chip.style.display = 'flex';
    if (val && val.textContent !== String(total)) val.textContent = total;
  } else {
    if (chip.style.display !== 'none') chip.style.display = 'none';
  }
}

function updateHUD() {
  const el = id => document.getElementById(id);
  const lives = _hudCtx.lives;
  const gold  = _hudCtx.gold;
  const wave  = _hudCtx.wave;
  const totalWaves = _hudCtx.totalWaves;
  const isInfiniteMode = _hudCtx.isInfiniteMode;
  const waveActive = _hudCtx.waveActive;
  const betweenWaves = _hudCtx.betweenWaves;
  const stage = _hudCtx.stage;
  const towers = _hudCtx.towers;

  if (el('hud-lives')) el('hud-lives').textContent = lives;
  if (el('hud-gold'))  el('hud-gold').textContent  = gold;
  if (el('hud-wave'))  el('hud-wave').textContent  = wave;
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
      skipBtn.title = I18N.t('hud_tt_skip_wave', { gold: Math.round(_hudCtx.skipGold || 100) });
    } else {
      skipBtn.title = I18N.t('hud_tt_skip');
    }
  }

  // Enemies alive + queued chip
  const aliveCount = (_hudCtx._aliveEnemies || []).length;
  const queueCount = (_hudCtx.spawnQueue || []).length;
  const enemiesChip = el('hud-chip-enemies');
  const enemiesCountEl = el('hud-enemies-count');
  if (enemiesChip) {
    if (waveActive && (aliveCount + queueCount) > 0) {
      enemiesChip.style.display = 'flex';
      if (enemiesCountEl) enemiesCountEl.textContent = aliveCount + queueCount;
    } else {
      enemiesChip.style.display = 'none';
    }
  }

  // Skip gold chip
  const skipGoldEl = el('hud-skip-gold-val');
  if (skipGoldEl) skipGoldEl.textContent = Math.round(_hudCtx.skipGold || 100) + '💰';

  // Next wave chip
  const nextChip = el('hud-chip-next');
  const nextInfoEl = el('hud-next-wave-info');
  if (nextChip && nextInfoEl && !isInfiniteMode && stage?.waves && waveActive) {
    const nextWaveData = stage.waves[wave]; // wave is current (1-indexed), so waves[wave] is the next
    if (nextWaveData && nextWaveData.length > 0) {
      const hasBoss     = nextWaveData.some(e => ENEMY_DEFS[e.type]?.is_boss);
      const hasMiniboss = nextWaveData.some(e => ENEMY_DEFS[e.type]?.is_miniboss);
      if (hasBoss) {
        nextInfoEl.textContent = '⚠️ PRÓXIMO: BOSS';
        nextChip.className = 'hud-chip hud-chip-next hud-chip-danger';
      } else if (hasMiniboss) {
        nextInfoEl.textContent = '★ PRÓXIMO: MINI-BOSS';
        nextChip.className = 'hud-chip hud-chip-next hud-chip-warning';
      } else {
        nextInfoEl.textContent = `→ Onda ${wave + 1}: ${nextWaveData.length} inimigos`;
        nextChip.className = 'hud-chip hud-chip-next hud-chip-ok';
      }
      nextChip.style.display = 'flex';
    } else {
      nextChip.style.display = 'none';
    }
  } else if (nextChip) {
    nextChip.style.display = 'none';
  }

  // Re-render do painel ao mudar ouro — garante que unidades ficam disponíveis imediatamente
  if (gold !== _lastHudGold) {
    _lastHudGold = gold;
    renderTeamPanel();
  }

  UI.updateCurrencyDisplay();
  renderWavePreview();


}

function renderTeamPanel() {
  const panel = document.getElementById('team-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const { team, towers, gold, deployingCharId } = _hudCtx;

  const barracksLvl = (typeof Save !== 'undefined' && Save.getNexusLevel) ? Save.getNexusLevel('barracks') : 0;
  const costMult    = barracksLvl > 0 ? Math.max(0.28, 1 - barracksLvl * 0.08) : 1;

  team.forEach(charId => {
    const char     = getCharById(charId);
    const unitData = Save.getBestUnitData(charId);
    if (!char) return;

    const effectiveCost = Math.max(1, Math.ceil(char.deploy_cost * costMult));
    const copies        = towers.filter(t => t.charId === charId && !t.isClone).length;
    const maxCopies     = char.max_in_field || (char.rarity >= 6 ? 1 : 3);
    const atLimit       = copies >= maxCopies;
    const canAfford     = gold >= effectiveCost;
    const prestige      = unitData?.prestige || 0;
    const rarityColor   = RARITY_COLORS[char.rarity] || '#6b7280';

    const deployedTower  = towers.find(t => t.charId === charId && !t.isClone) || null;
    const totalUpgrades  = char.upgrades?.length || 0;
    const upgradeLevel   = deployedTower?.upgradeLevel || 0;
    const hasAbility     = !!char.active_ability;
    const abilityTimer   = deployedTower?.abilityTimer ?? null;
    const abilityReady   = hasAbility && deployedTower && abilityTimer <= 0;
    const abilityCharging= hasAbility && deployedTower && abilityTimer > 0;

    let cls = 'tp-unit';
    if (deployingCharId === charId) cls += ' deploying';
    if (atLimit)         cls += ' at-limit';
    else if (!canAfford) cls += ' cant-afford';

    // Upgrade pips (only shown when the unit is deployed)
    let pipsHtml = '';
    if (totalUpgrades > 0 && deployedTower) {
      const maxPips = Math.min(totalUpgrades, 5);
      pipsHtml = '<div class="tp-upgrades">';
      for (let i = 0; i < maxPips; i++)
        pipsHtml += `<div class="tp-upg-pip ${i < upgradeLevel ? 'done' : 'empty'}"></div>`;
      pipsHtml += '</div>';
    }

    let abilHtml = '';
    if (abilityReady)
      abilHtml = `<span class="tp-ability ready">⚡ ${I18N.t('hud_ability_ready')}</span>`;
    else if (abilityCharging)
      abilHtml = `<span class="tp-ability charging">${Math.ceil(abilityTimer)}s</span>`;

    const row3Html = (pipsHtml || abilHtml)
      ? `<div class="tp-row3">${pipsHtml}${abilHtml}</div>` : '';

    const copyHtml = copies > 0
      ? `<span class="tp-copies ${atLimit ? 'maxed' : 'ok'}">${copies}/${maxCopies}</span>` : '';

    const prestigeHtml = prestige > 0
      ? `<div class="tp-prestige-badge">✦${prestige}</div>` : '';

    const costLabel = atLimit
      ? `<span class="tp-cost muted">${I18N.t('hud_max_units')}</span>`
      : `<span class="tp-cost">${effectiveCost}💰</span>`;

    const div = document.createElement('div');
    div.className = cls;
    div.style.borderLeftColor = rarityColor;
    div.dataset.charId = charId;
    div.innerHTML = `
      <div class="tp-icon" style="background:${rarityColor}">
        ${charIconInner(char)}${prestigeHtml}
      </div>
      <div class="tp-info">
        <div class="tp-row1">
          <div class="tp-name">${char.name}</div>${copyHtml}
        </div>
        <div class="tp-row2">
          <span class="tp-level">Lv${unitData?.nivel || 1}</span>${costLabel}
        </div>
        ${row3Html}
      </div>`;

    div.addEventListener('click', () => {
      if (atLimit) { UI.toast(I18N.t('hud_max_units')); return; }
      if (_hudCtx.gold < effectiveCost) { UI.toast(I18N.t('err_gold')); return; }
      _hudCtx.deployingCharId = _hudCtx.deployingCharId === charId ? null : charId;
      renderTeamPanel();
      _hudCtx.selectedTowerIdx = -1;
      closeUpgradePanel();
      UI.toast(_hudCtx.deployingCharId
        ? I18N.t('hud_click_slot', { name: char.name })
        : I18N.t('hud_cancel_select'));
    });
    panel.appendChild(div);
  });
}
