// js/game-hud.js — Atualização de DOM: HUD, painel de upgrade, preview de waves, painel do time.
// Depende de: _hudCtx (game-utils.js), RARITY_COLORS (characters.js),
//             ENEMY_DEFS (enemies.js), INFINITE_TIERS/getInfiniteTierIdx (game-infinite.js),
//             charIconInner/getCharById/getCurrentStats (characters.js), Save, UI (globals).

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
    single_target:'Alvo único', single:'Alvo único', linha:'Linha',
    cone:'Cone', aoe:'Área', aoe_full:'Área total', aoe_vizard_total:'Vizard AOE', pierce:'Perfura 3',
    scatter:'Dispersão', none:'Sem ataque'
  };
  const gold = _hudCtx.gold;
  const waveActive = _hudCtx.waveActive;
  const frenzyMult  = (tower._frenzyTimer || 0) > 0 ? ` ×${tower._frenzyMult||1} FRENZY` : '';
  const prestigeRow = (tower.prestige || 0) > 0
    ? `<div class="upg-stat-row" style="color:#fbbf24">✦ Prestígio ${tower.prestige} <span style="opacity:0.7">(+${tower.prestige*20}% dano, +${tower.prestige*6}% alc.)</span></div>`
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
    const col = better ? '#4ade80' : '#f87171';
    return `<div class="upg-stat-row upg-stat-cmp"><span>${label}</span><span>${cur} <span class="upg-next-val" style="color:${col}">→ ${nxt}</span></span></div>`;
  }

  const statsEl = document.createElement('div');
  statsEl.className = 'upg-stats-block';

  const totalUpgradesCount = char?.upgrades?.length || 0;
  const isMaximized = tower.upgradeLevel >= totalUpgradesCount && totalUpgradesCount > 0;

  const _dpsVal = tower.realtimeDPS || 0;
  const _dpsRow = waveActive && _dpsVal > 0
    ? `<div class="upg-stat-row"><span>📊 DPS</span><span style="color:#fbbf24;font-weight:700">${_dpsVal >= 1000 ? (_dpsVal/1000).toFixed(1)+'k' : Math.round(_dpsVal)}</span></div>`
    : '';

  statsEl.innerHTML = `
    ${statRow('⚔ Dano', Math.round(stats.damage), nextStats ? Math.round(nextStats.damage) : null)}
    ${statRow('🎯 Alcance', Math.round(stats.range) + 'px', nextStats ? Math.round(nextStats.range) + 'px' : null)}
    ${statRow('⚡ Vel. Ataque', stats.attack_speed.toFixed(2) + '/s' + frenzyMult, nextStats ? nextStats.attack_speed.toFixed(2) + '/s' : null)}
    <div class="upg-stat-row"><span>🗡 Tipo</span><span>${typeLabels[stats.type] || stats.type}</span></div>
    ${_dpsRow}
    ${prestigeRow}
    ${isMaximized ? '<div class="upg-stat-row" style="color:#fbbf24;font-weight:700;text-align:center">✦ MAXIMIZADO ✦</div>' : ''}`;
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
      <div class="upg-name">${upg.name} ${purchased ? '✔' : ''}</div>
      <div class="upg-desc">${upg.desc}</div>
      <div class="upg-cost">${purchased ? 'Comprado' : `${upg.cost} 💰 ${isNext ? '<span style="font-size:9px;color:#aaa;margin-left:5px;">(U)</span>' : ''}`}</div>`;
    if (isNext && canAfford) {
      div.addEventListener('click', () => _hudCtx.buyUpgrade(slotIdx, i));
      div.style.cursor = 'pointer';
    }
    optsEl.appendChild(div);
  });

  const passivesArr = passives;
  const hasEconomy = passivesArr.some(p => p.type === 'edo_tensei_economy');
  let totalInvested = char?.deploy_cost || 0;
  for (let i = 0; i < tower.upgradeLevel; i++) {
    if (char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
  }
  const sellVal = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
  const sellBtn = panel.querySelector('.btn-sell');
  if (sellBtn) sellBtn.textContent = `Vender (+${sellVal} 💰) [Del]`;

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
      skipBtn.title = `Antecipar próxima wave: +${wave * 11}💰 (S)`;
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
  renderWavePreview();


}

function renderTeamPanel() {
  const panel = document.getElementById('team-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const team = _hudCtx.team;
  const towers = _hudCtx.towers;
  const gold = _hudCtx.gold;
  const deployingCharId = _hudCtx.deployingCharId;

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
      _hudCtx.deployingCharId = _hudCtx.deployingCharId === charId ? null : charId;
      renderTeamPanel();
      _hudCtx.selectedTowerIdx = -1;
      closeUpgradePanel();
      UI.toast(_hudCtx.deployingCharId ? `Clique em um slot para colocar ${char.name}` : 'Seleção cancelada');
    });
    panel.appendChild(div);
  });
}
