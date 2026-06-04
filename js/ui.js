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

  function showEvents() {
    showScreen('events');
    renderEventsList();
    const gems = document.getElementById('events-gems');
    const tickets = document.getElementById('events-tickets');
    const d = Save.get();
    if (gems) gems.textContent = d.gemas;
    if (tickets) tickets.textContent = d.tickets;
  }

  function renderEventsList() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    EVENTS_DATA.forEach(evt => {
      const card = document.createElement('div');
      card.style.cssText = `
        width: 100%; max-width: 800px; background: #1a1a1a; 
        border: 2px solid var(--gold); border-radius: 12px; overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column;
      `;
      card.innerHTML = `
        <div style="height: 250px; background-image: url('${evt.flyer}'); background-size: cover; background-position: center; position: relative;">
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.9));">
            <h3 style="color: var(--gold); font-size: 24px; margin: 0; font-family: 'Cinzel', serif;">${evt.name}</h3>
          </div>
        </div>
        <div style="padding: 20px;">
          <p style="color: #ccc; font-size: 14px; margin-bottom: 20px;">${evt.desc}</p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${evt.stages.map((st, i) => {
              const isDone = Save.isStageComplete(st.id, 'normal');
              const isLocked = i > 0 && !Save.isStageComplete(evt.stages[i-1].id, 'normal');
              return `
                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; ${isLocked ? 'opacity: 0.5; pointer-events: none;' : ''}">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
                    <div style="flex: 1;">
                      <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${st.name}</div>
                      ${st.story ? `<div style="font-style: italic; font-size: 12px; color: #ccc; line-height: 1.6; margin-bottom: 8px;">${st.story}</div>` : ''}
                      <div style="font-size: 11px; color: rgba(255,200,70,0.6); line-height: 1.4;">${st.description}</div>
                    </div>
                    <div style="flex-shrink: 0;">
                      <button class="btn btn-primary" onclick="UI.showPreBattle('${st.id}')" ${isLocked ? 'disabled' : ''}>
                        ${isLocked ? '🔒 Bloqueado' : isDone ? '⭐ Concluído' : 'Jogar Capítulo'}
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
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
    rewards.innerHTML = '';

    if (result.infiniteWave > 0) {
      // ── Modo Infinito: banner + resumo completo da sessão ──────────────────
      const best = typeof Save !== 'undefined' ? (Save.get().stats.melhor_onda_infinita || 0) : result.infiniteWave;
      const isRecord = result.infiniteWave >= best;
      banner.innerHTML = `
        ♾ MODO INFINITO
        <br><span style="font-size:26px;color:#a78bfa;font-weight:900">Wave ${result.infiniteWave}</span>
        <br><span style="font-size:12px;opacity:0.65">${isRecord ? '🏆 Novo Recorde!' : `Recorde: Wave ${best}`}</span>`;

      // Gemas ganhas na sessão
      if (result.infiniteGems > 0) {
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.innerHTML = `<span>💎 Gemas ganhas</span><span style="color:#fbbf24;font-weight:700">+${result.infiniteGems}</span>`;
        rewards.appendChild(li);
      }

      // Star Experience por nível
      const drops = result.infiniteDrops || {};
      const SE_COLORS = { 1:'#9b59b6', 2:'#e67e22', 3:'#f1c40f', 4:'#e74c3c', 5:'#c0392b' };
      let hasAnySE = false;
      for (let lv = 1; lv <= 5; lv++) {
        const qty = drops[`star_exp_${lv}`] || 0;
        if (qty === 0) continue;
        hasAnySE = true;
        const char = typeof getCharById !== 'undefined' ? getCharById(`star_exp_${lv}`) : null;
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.innerHTML = `
          <span style="display:flex;align-items:center;gap:6px">
            <span style="background:${SE_COLORS[lv]};width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">${lv}</span>
            <span>${char?.name || `Star Experience Nv${lv}`}</span>
          </span>
          <span style="color:#fbbf24;font-weight:700">×${qty}</span>`;
        rewards.appendChild(li);
      }

      if (!hasAnySE && result.infiniteGems === 0) {
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.style.opacity = '0.5';
        li.innerHTML = `<span>Nenhuma recompensa coletada</span><span>—</span>`;
        rewards.appendChild(li);
      }

    } else {
      // ── Partida normal ──────────────────────────────────────────────────────
      banner.innerHTML = result.victory ? '🏆 VITÓRIA!' : '💀 DERROTA!';
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
          li.innerHTML = `<span style="background:${RARITY_COLORS[char?.rarity||0]};overflow:hidden" class="reward-mat">${charIconInner(char)}</span><span>${char?.name || matId}</span>`;
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
    const _passives = c.passive ? (Array.isArray(c.passive) ? c.passive : [c.passive]) : [];
    const passiveDesc = _passives.length > 0 ? _passives.map(p => p.label).join(' | ') : 'Nenhuma habilidade passiva.';

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
    showHub, showWorldSelect, showStageSelect: (id) => {
      if (!id && typeof EVENTS_DATA !== 'undefined' && EVENTS_DATA.some(e => e.stages.some(s => s.id === selectedStage))) {
        return showEvents();
      }
      showStageSelect(id || selectedWorld);
    },
    showPreBattle, showGacha, showInventory, showGame, showPostBattle, showEvents,
    setDifficulty, updateCurrencyDisplay, updateBannerDisplay, updateBannerTimer,
    confirmReset, closeUpgradePanel, toast,
    getSelectedTeam, getSelectedStage, getSelectedDifficulty
  };
})();
