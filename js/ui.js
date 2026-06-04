const UI = (() => {
  let currentScreen = 'hub';
  let selectedWorld = null;
  let selectedStage = null;
  let selectedDifficulty = 'normal';
  let teamSlots = [null, null, null, null, null, null];
  let toastTimer = null;

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    currentScreen = id;
  }

  function showHub() {
    showScreen('hub');
    updateCurrencyDisplay();
    Missions.renderMissions();
  }

  function showWorldSelect() {
    showScreen('world-select');
    renderWorldGrid();
  }

  function renderWorldGrid() {
    const grid = document.getElementById('world-grid');
    if (!grid) return;
    grid.innerHTML = '';
    WORLDS.forEach(w => {
      const d = Save.get();
      const stagesInWorld = getStagesByWorld(w.id);
      const completed = stagesInWorld.filter(s => Save.isStageComplete(s.id, 'normal')).length;
      const card = document.createElement('div');
      card.className = `world-card theme-${w.id}${w.unlocked ? '' : ' world-locked'}`;
      card.style.borderColor = w.color;
      card.innerHTML = `
        <div class="world-icon" style="color:${w.color}">🌍</div>
        <div class="world-name">${w.name}</div>
        <div class="world-desc">${w.description}</div>
        <div class="world-progress">${completed}/${stagesInWorld.length} fases</div>
        ${!w.unlocked ? '<div class="world-lock">🔒</div>' : ''}`;
      if (w.unlocked) card.addEventListener('click', () => showStageSelect(w.id));
      grid.appendChild(card);
    });
  }

  function showStageSelect(worldId) {
    selectedWorld = worldId;
    showScreen('stage-select');
    const world = WORLDS.find(w => w.id === worldId);
    document.getElementById('stage-select-world-name').textContent = world?.name || worldId;
    renderStageGrid(worldId);
  }

  function renderStageGrid(worldId) {
    const grid = document.getElementById('stage-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const stages = getStagesByWorld(worldId);
    stages.forEach((stage, i) => {
      const normalDone = Save.isStageComplete(stage.id, 'normal');
      const hardDone = Save.isStageComplete(stage.id, 'dificil');
      const legDone = Save.isStageComplete(stage.id, 'lendario');
      const stars = (normalDone ? 1 : 0) + (hardDone ? 1 : 0) + (legDone ? 1 : 0);
      const prevDone = i === 0 || Save.isStageComplete(stages[i-1].id, 'normal');
      const card = document.createElement('div');
      card.className = `stage-card theme-${worldId}${prevDone ? '' : ' stage-locked'}`;
      card.innerHTML = `
        <div class="stage-num">${i + 1}</div>
        <div class="stage-name">${stage.name}</div>
        <div class="stage-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="stage-rewards"><span>50-120 💎</span><span>Material</span></div>
        ${!prevDone ? '<div class="stage-lock">🔒</div>' : ''}`;
      if (prevDone) card.addEventListener('click', () => showPreBattle(stage.id));
      grid.appendChild(card);
    });
  }

  function showPreBattle(stageId) {
    selectedStage = stageId;
    selectedDifficulty = 'normal';
    teamSlots = [...Save.getTeam()];
    showScreen('prebattle');
    const stage = getStage(stageId);
    document.getElementById('prebattle-stage-name').textContent = stage?.name || stageId;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'normal'));
    renderPrebattleRewards(stage);
    renderTeamSlots();
    renderAvailableUnits();
  }

  function renderPrebattleRewards(stage) {
    const container = document.getElementById('pb-rewards');
    if (!container) return;
    container.innerHTML = '';
    if (!stage || !stage.drops) return;
    
    stage.drops.forEach(drop => {
      const char = getCharById(drop.id);
      if (!char) return;
      const el = document.createElement('div');
      el.className = 'pb-reward-card';
      el.style.cssText = `background: #1e1e1e; padding: 5px; border-radius: 5px; border: 1px solid ${RARITY_COLORS[char.rarity||0]}; display: flex; flex-direction: column; align-items: center; width: 60px; font-size: 10px; text-align: center;`;
      el.innerHTML = `
        <div style="background:${RARITY_COLORS[char.rarity||0]}; width: 40px; height: 40px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 3px; font-weight: bold; overflow: hidden;">
          ${charIconInner(char)}
        </div>
        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${char.name}</div>
        <div style="color: #ffaa00;">${drop.chance}%</div>
      `;
      container.appendChild(el);
    });
  }

  function renderTeamSlots() {
    const container = document.getElementById('team-slots');
    if (!container) return;
    container.innerHTML = '';
    teamSlots.forEach((charId, i) => {
      const slot = document.createElement('div');
      slot.className = 'team-slot' + (charId ? ' filled' : '');
      if (charId) {
        const char = getCharById(charId);
        const unitData = Save.getBestUnitData(charId);
        slot.innerHTML = `
          <div class="ts-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="ts-name">${char.name}</div>
          <div class="ts-lv">Lv${unitData?.nivel || 1}</div>`;
        slot.addEventListener('click', () => { 
          teamSlots[i] = null; 
          Save.setTeam(teamSlots);
          renderTeamSlots(); 
          renderAvailableUnits(); 
        });
      } else {
        slot.innerHTML = '<div class="ts-empty">+</div>';
      }
      container.appendChild(slot);
    });
  }

  function renderAvailableUnits() {
    const container = document.getElementById('available-units');
    if (!container) return;
    container.innerHTML = '';
    const d = Save.get();
    const inTeam = teamSlots.filter(Boolean);
    const inTeamSet = new Set(inTeam);

    d.inventario.unidades.forEach(u => {
      const char = getCharById(u.id);
      if (!char || !char.playable) return;
      const inTeam = inTeamSet.has(u.id);
      const card = document.createElement('div');
      card.className = `avail-unit${inTeam ? ' in-team' : ''}`;
      card.innerHTML = `
        <div class="au-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div class="au-name">${char.name}</div>
        <div class="au-lv">${RARITY_LABELS[char.rarity]} Lv${u.nivel}</div>`;
      if (!inTeam) {
        card.addEventListener('click', () => {
          const emptySlot = teamSlots.findIndex(s => !s);
          if (emptySlot >= 0) {
            teamSlots[emptySlot] = u.id;
            Save.setTeam(teamSlots);
            renderTeamSlots();
            renderAvailableUnits();
          } else {
            toast('Time cheio! Remova um personagem primeiro.');
          }
        });
      }
      container.appendChild(card);
    });
    if (d.inventario.unidades.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhuma unidade obtida.<br>Vá ao Gacha e invoque!</div>';
    }
  }

  function setDifficulty(diff) {
    selectedDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
  }

  function showGacha() {
    showScreen('gacha');
    Gacha.updateGachaUI();
  }

  function showInventory(tab = 'units') {
    showScreen('inventory');
    Inventory.showTab(tab);
  }

  function showGame() {
    showScreen('game');
  }

  function showPostBattle(result) {
    showScreen('postbattle');
    renderPostBattle(result);
  }

  function renderPostBattle(result) {
    const banner = document.getElementById('result-banner');
    const rewards = document.getElementById('result-rewards-list');
    banner.className = 'result-banner ' + (result.victory ? 'victory' : 'defeat');
    banner.innerHTML = result.victory ? '🏆 VITÓRIA!' : '💀 DERROTA!';

    rewards.innerHTML = '';
    if (result.gems) {
      const li = document.createElement('div');
      li.className = 'reward-item';
      li.innerHTML = `<span>💎 Gemas</span><span>+${result.gems}</span>`;
      rewards.appendChild(li);
    }
    if (result.materials && result.materials.length > 0) {
      result.materials.forEach(matId => {
        const char = getCharById(matId);
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.innerHTML = `<span style="background:${RARITY_COLORS[char?.rarity||0]}; overflow: hidden;" class="reward-mat">${charIconInner(char)}</span><span>${char?.name || matId}</span>`;
        rewards.appendChild(li);
      });
    }
    if (result.bonusGems) {
      const li = document.createElement('div');
      li.className = 'reward-item bonus';
      li.innerHTML = `<span>💎 Bônus Primeira Vez</span><span>+${result.bonusGems}</span>`;
      rewards.appendChild(li);
    }
  }

  function closeUpgradePanel() {
    document.getElementById('upgrade-panel').style.display = 'none';
    Game.deselectTower();
  }

  function formatAttackType(type) {
    switch (type) {
      case 'single_target': return '🎯 Single';
      case 'linha': return '📏 Linha';
      case 'cone': return '📐 Cone';
      case 'aoe': return '💥 AOE';
      case 'aoe_full': return '🌪️ Full AOE';
      case 'none': return '🛡️ Suporte';
      default: return type || 'N/A';
    }
  }

  function makeFeaturedPanel(id) {
    const c = getCharById(id);
    if (!c) return '';
    const cleanName = c.name.replace(/\s*\(.*\)/, '');
    const series = SERIES_LABELS[c.series] || c.series;
    const attackType = formatAttackType(c.base_stats?.type);
    const dmg = c.base_stats?.damage || 0;
    const rng = c.base_stats?.range || 0;
    const spd = c.base_stats?.attack_speed ? c.base_stats.attack_speed.toFixed(2) : '0';
    const passiveDesc = c.passive?.label || 'Nenhuma habilidade passiva.';

    return `
      <div class="banner-featured-card">
        <div class="featured-glow-effect"></div>
        <div class="featured-header">
          <span class="featured-rarity-badge">★ MYTHIC ★</span>
          <span class="featured-series-badge">${series}</span>
        </div>
        <div class="featured-body">
          <div class="featured-avatar-container">
            <div class="featured-avatar-circle" style="background:${RARITY_COLORS[c.rarity]}">
              ${charIconInner(c)}
            </div>
          </div>
          <div class="featured-details">
            <h2 class="featured-char-name">${cleanName}</h2>
            <div class="featured-stat-grid">
              <div class="featured-stat-item" title="Dano Base">
                <span class="stat-icon">⚔️</span>
                <span class="stat-val">${dmg}</span>
              </div>
              <div class="featured-stat-item" title="Alcance Base">
                <span class="stat-icon">🎯</span>
                <span class="stat-val">${rng}</span>
              </div>
              <div class="featured-stat-item" title="Velocidade de Ataque">
                <span class="stat-icon">⚡</span>
                <span class="stat-val">${spd}s</span>
              </div>
              <div class="featured-stat-item" title="Tipo de Ataque">
                <span class="stat-val">${attackType}</span>
              </div>
            </div>
            <div class="featured-passive-box">
              <div class="passive-title">✨ Habilidade Passiva</div>
              <div class="passive-text">${passiveDesc}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function makeSupportingList(star4Ids, star3Ids) {
    let html = `<div class="banner-supporting-section">`;
    html += `<div class="supporting-title">Unidades de Suporte</div>`;
    html += `<div class="supporting-grid">`;

    // Render Epic (4⭐)
    star4Ids.forEach(id => {
      const c = getCharById(id);
      if (!c) return;
      const cleanName = c.name.replace(/\s*\(.*\)/, '');
      const series = SERIES_LABELS[c.series] || c.series;
      html += `
        <div class="hbc hbc--star4" title="${c.name} - ${series}">
          <div class="hbc-badge">EPIC</div>
          <div class="hbc-avatar" style="background:${RARITY_COLORS[c.rarity]}">${charIconInner(c)}</div>
          <div class="hbc-name">${cleanName}</div>
          <div class="hbc-footer">
            <div class="hbc-rarity">${c.rarity}★</div>
            <div class="hbc-series">${series}</div>
          </div>
        </div>
      `;
    });

    // Render Rare (3⭐)
    star3Ids.forEach(id => {
      const c = getCharById(id);
      if (!c) return;
      const cleanName = c.name.replace(/\s*\(.*\)/, '');
      const series = SERIES_LABELS[c.series] || c.series;
      html += `
        <div class="hbc hbc--star3" title="${c.name} - ${series}">
          <div class="hbc-badge">RARE</div>
          <div class="hbc-avatar" style="background:${RARITY_COLORS[c.rarity]}">${charIconInner(c)}</div>
          <div class="hbc-name">${cleanName}</div>
          <div class="hbc-footer">
            <div class="hbc-rarity">${c.rarity}★</div>
            <div class="hbc-series">${series}</div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
  }

  function makeBannerCard(id, starClass) {
    const c = getCharById(id);
    if (!c) return null;
    const cleanName = c.name.replace(/\s*\(.*\)/, '');
    const series = SERIES_LABELS[c.series] || c.series;
    const div = document.createElement('div');
    div.className = `hbc ${starClass}`;
    div.innerHTML = `
      <div class="hbc-avatar" style="background:${RARITY_COLORS[c.rarity]}">${charIconInner(c)}</div>
      <div class="hbc-name">${cleanName}</div>
      <div class="hbc-footer">
        <div class="hbc-rarity">${c.rarity}⭐</div>
        <div class="hbc-series">${series}</div>
      </div>`;
    return div;
  }

  function updateBannerDisplay(banner) {
    const featuredHtml = banner.star5.map(id => makeFeaturedPanel(id)).join('');
    const supportingHtml = makeSupportingList(banner.star4, banner.star3);
    const fullHtml = `
      <div class="banner-layout">
        ${featuredHtml}
        ${supportingHtml}
      </div>
    `;

    // Hub banner chars
    const hubChars = document.getElementById('hub-banner-chars');
    if (hubChars) {
      hubChars.innerHTML = fullHtml;
    }

    // Gacha banner art — usa o mesmo layout do hub
    const gachaChars = document.getElementById('gacha-banner-art-chars');
    if (gachaChars) {
      gachaChars.innerHTML = fullHtml;
    }

    if (typeof Gacha !== 'undefined') Gacha.updateGachaUI();
  }

  function confirmReset() {
    if (window.confirm('⚠️ Resetar todo o progresso?\n\nEsta ação apaga saves, unidades e gemas. Não pode ser desfeita.')) {
      Save.reset();
      try { localStorage.removeItem('astd_banner_v2'); } catch(e) {}
      window.location.reload();
    }
  }

  function updateBannerTimer() {
    const el = document.getElementById('banner-timer');
    if (!el) return;
    const ms = BannerSystem.timeUntilReset();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    el.textContent = `Rotação em ${mins}m ${secs.toString().padStart(2, '0')}s`;
  }

  function updateCurrencyDisplay() {
    const d = Save.get();
    const gems = document.getElementById('hub-gems');
    const tickets = document.getElementById('hub-tickets');
    if (gems) gems.textContent = d.gemas;
    if (tickets) tickets.textContent = d.tickets;
  }

  function toast(msg, duration = 3000) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  function getSelectedTeam() { return teamSlots.filter(Boolean); }
  function getSelectedStage() { return selectedStage; }
  function getSelectedDifficulty() { return selectedDifficulty; }

  return {
    showHub, showWorldSelect, showStageSelect: (id) => showStageSelect(id || selectedWorld),
    showPreBattle, showGacha, showInventory, showGame, showPostBattle,
    setDifficulty, updateCurrencyDisplay, updateBannerDisplay, updateBannerTimer,
    confirmReset, closeUpgradePanel, toast,
    getSelectedTeam, getSelectedStage, getSelectedDifficulty
  };
})();
