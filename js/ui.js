const UI = (() => {
  let currentScreen = 'hub';
  let selectedWorld = null;
  let selectedStage = null;
  let selectedDifficulty = 'normal';
  let teamSlots = [null, null, null, null, null, null];
  let _pbRarityFilter = 0; // 0 = todos, 3-7 = raridade específica
  let toastTimer = null;

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    currentScreen = id;
    
    if (typeof AudioManager !== 'undefined') {
      if (id === 'game') {
        AudioManager.pauseBgm();
      } else {
        AudioManager.playMenuBgm();
      }
    }
  }

  function showHub() {
    showScreen('hub');
    updateCurrencyDisplay();
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

    // ── Tab bar ──────────────────────────────────────────────────────────────
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;flex-shrink:0;background:rgba(0,0,0,0.35);border-bottom:1px solid rgba(255,200,70,0.18);padding:0 20px;overflow-x:auto;';

    // ── Scrollable content area ───────────────────────────────────────────────
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:24px 20px;display:flex;flex-direction:column;align-items:center;gap:0;';

    function renderEvt(idx) {
      const evt = EVENTS_DATA[idx];
      content.innerHTML = '';

      // Flyer header
      const header = document.createElement('div');
      header.style.cssText = 'width:100%;max-width:760px;height:180px;border-radius:12px 12px 0 0;background-image:url(\'' + evt.flyer + '\');background-size:cover;background-position:center;position:relative;overflow:hidden;';
      header.innerHTML = '<div style="position:absolute;bottom:0;left:0;width:100%;padding:14px 20px;background:linear-gradient(transparent,rgba(0,0,0,0.88));"><h3 style="color:#39FF14;font-size:26px;margin:0;font-family:\'Bangers\',cursive;letter-spacing:.1em;text-shadow:0 0 12px rgba(57,255,20,0.6),2px 2px 0 rgba(0,0,0,0.9);">' + evt.name + '</h3></div>';

      // Description
      const desc = document.createElement('div');
      desc.style.cssText = 'width:100%;max-width:760px;background:rgba(4,10,5,0.9);padding:14px 20px;border-left:2px solid rgba(57,255,20,0.2);border-right:2px solid rgba(57,255,20,0.2);';
      desc.innerHTML = '<p style="color:rgba(238,240,255,0.65);font-size:13px;margin:0;line-height:1.6;">' + evt.desc + '</p>';

      // Chapters
      const chaps = document.createElement('div');
      chaps.style.cssText = 'width:100%;max-width:760px;background:rgba(3,8,4,0.97);border:2px solid rgba(57,255,20,0.2);border-top:none;border-radius:0 0 12px 12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;';

      evt.stages.forEach((st, i) => {
        const isDone = Save.isStageComplete(st.id, 'normal');
        const isLocked = i > 0 && !Save.isStageComplete(evt.stages[i-1].id, 'normal');
        const row = document.createElement('div');
        row.style.cssText = 'padding:14px;background:rgba(57,255,20,0.03);border:1px solid rgba(57,255,20,0.12);border-radius:8px;cursor:pointer;transition:border-color 120ms;' + (isLocked ? 'opacity:0.4;pointer-events:none;' : '');
        row.innerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;"><div style="flex:1;">'
          + '<div style="font-weight:700;font-size:14px;margin-bottom:5px;color:' + (isDone ? 'var(--gold)' : '#eef') + ';">' + st.name + '</div>'
          + (st.story ? '<div style="font-style:italic;font-size:12px;color:#aaa;line-height:1.6;margin-bottom:6px;">' + st.story.slice(0, 140) + (st.story.length > 140 ? '…' : '') + '</div>' : '')
          + '<div style="font-size:11px;color:rgba(255,200,70,0.55);line-height:1.4;">' + st.description + '</div>'
          + '</div><div style="flex-shrink:0;">'
          + '<button class="btn btn-primary" onclick="UI.showPreBattle(\'' + st.id + '\')" ' + (isLocked ? 'disabled' : '') + '>'
          + (isLocked ? I18N.t('ui_btn_locked') : isDone ? I18N.t('ui_btn_done') : I18N.t('ui_btn_play_chapter'))
          + '</button></div></div>';
        chaps.appendChild(row);
      });

      content.appendChild(header);
      content.appendChild(desc);
      content.appendChild(chaps);
    }

    // Build tabs
    EVENTS_DATA.forEach((evt, i) => {
      const btn = document.createElement('button');
      const setActive = (active) => {
        btn.style.cssText = 'padding:11px 18px;border:none;border-bottom:2px solid ' + (active ? 'var(--gold)' : 'transparent') + ';background:' + (active ? 'rgba(255,200,70,0.08)' : 'transparent') + ';color:' + (active ? 'var(--gold)' : 'rgba(238,240,255,0.5)') + ';font-size:13px;font-weight:' + (active ? '700' : '500') + ';cursor:pointer;transition:all 130ms;white-space:nowrap;';
      };
      setActive(i === 0);
      btn.textContent = evt.name;
      btn.addEventListener('click', () => {
        tabBar.querySelectorAll('button').forEach((b, bi) => {
          const isActive = bi === i;
          b.style.borderBottom = isActive ? '2px solid var(--gold)' : '2px solid transparent';
          b.style.background = isActive ? 'rgba(255,200,70,0.08)' : 'transparent';
          b.style.color = isActive ? 'var(--gold)' : 'rgba(238,240,255,0.5)';
          b.style.fontWeight = isActive ? '700' : '500';
        });
        content.scrollTop = 0;
        renderEvt(i);
      });
      tabBar.appendChild(btn);
    });

    grid.appendChild(tabBar);
    grid.appendChild(content);
    renderEvt(0);
  }

  function showWorldSelect() {
    showScreen('world-select');
    renderWorldGrid();
  }

  function renderWorldGrid() {
    const grid = document.getElementById('world-grid');
    if (!grid) return;
    grid.innerHTML = '';
    WORLDS.forEach((w, index) => {
      const d = Save.get();
      const stagesInWorld = getStagesByWorld(w.id);
      const completed = stagesInWorld.filter(s => Save.isStageComplete(s.id, 'normal')).length;
      
      let isUnlocked = true;
      if (index > 0 && w.id !== 'infinito') {
        const prevWorld = WORLDS[index - 1];
        const prevStages = getStagesByWorld(prevWorld.id);
        const prevCompleted = prevStages.filter(s => Save.isStageComplete(s.id, 'normal')).length;
        isUnlocked = (prevCompleted === prevStages.length);
      }

      const card = document.createElement('div');
      card.className = `world-card theme-${w.id}${isUnlocked ? '' : ' world-locked'}`;
      card.style.borderColor = w.color;
      card.innerHTML = `
        <div class="world-icon" style="color:${w.color}">🌍</div>
        <div class="world-name">${w.name}</div>
        <div class="world-desc">${w.description}</div>
        <div class="world-progress">${I18N.t('ui_stages_count', { done: completed, total: stagesInWorld.length })}</div>
        ${!isUnlocked ? '<div class="world-lock">🔒</div>' : ''}`;
      if (isUnlocked) card.addEventListener('click', () => showStageSelect(w.id));
      grid.appendChild(card);
    });
  }

  function showStageSelect(worldId) {
    if (worldId !== undefined) selectedWorld = worldId;
    showScreen('stage-select');
    const world = WORLDS.find(w => w.id === selectedWorld);
    document.getElementById('stage-select-world-name').textContent = world?.name || selectedWorld;
    renderStageGrid(selectedWorld);
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
        <div class="stage-rewards"><span>50-200 💎</span><span>Material</span></div>
        ${!prevDone ? '<div class="stage-lock">🔒</div>' : ''}`;
      if (prevDone) card.addEventListener('click', () => showPreBattle(stage.id));
      grid.appendChild(card);
    });
  }

  function showPreBattle(stageId) {
    selectedStage = stageId;
    selectedDifficulty = 'normal';
    _pbRarityFilter = 0;
    teamSlots = [...Save.getTeam()];
    showScreen('prebattle');
    const stage = getStage(stageId);
    document.getElementById('prebattle-stage-name').textContent = stage?.name || stageId;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'normal'));
    renderPrebattleRewards(stage);
    renderTeamSlots();
    renderPbFilterBar();
    renderAvailableUnits();
  }

  function renderPbFilterBar() {
    const bar = document.getElementById('pb-unit-filters');
    if (!bar) return;
    bar.innerHTML = '';
    const rarities = [0, 7, 6, 5, 4, 3];
    const labels   = ['Todos', '7★', '6★', '5★', '4★', '3★'];
    rarities.forEach((r, i) => {
      const btn = document.createElement('button');
      btn.className = 'pb-chip' + (_pbRarityFilter === r ? ' active' : '');
      btn.textContent = labels[i];
      btn.addEventListener('click', () => {
        _pbRarityFilter = r;
        renderPbFilterBar();
        renderAvailableUnits();
      });
      bar.appendChild(btn);
    });
  }

  function renderPrebattleRewards(stage) {
    const container = document.getElementById('pb-rewards');
    if (!container) return;
    container.innerHTML = '';
    if (!stage || !stage.drops) return;
    
    stage.drops.forEach(drop => {
      const char = getCharById(drop.id);
      if (!char) return;
      const alreadyOwned = drop.oneTime && Save.getUnitQty(drop.id) > 0;
      const el = document.createElement('div');
      el.className = 'pb-reward-card';
      el.style.cssText = `background: rgba(4,10,5,0.9); padding: 5px; border-radius: 8px; border: 1px solid ${alreadyOwned ? 'rgba(57,255,20,0.15)' : RARITY_COLORS[char.rarity||0]}; display: flex; flex-direction: column; align-items: center; width: 60px; font-size: 10px; text-align: center; position: relative; ${alreadyOwned ? 'opacity:0.55;' : ''}`;

      let chanceLabel;
      if (drop.oneTime) {
        chanceLabel = alreadyOwned
          ? `<div style="color:#39FF14;font-weight:700;">✓ Obtida</div>`
          : `<div style="color:#fbbf24;font-weight:700;">1ª vez</div>`;
      } else if (drop.pity) {
        chanceLabel = `<div style="color:#ffaa00;">${drop.chance}% <span style="color:#a78bfa;font-size:9px;">(pity ${drop.pity})</span></div>`;
      } else {
        chanceLabel = `<div style="color:#ffaa00;">${drop.chance}%</div>`;
      }

      el.innerHTML = `
        <div style="background:${RARITY_COLORS[char.rarity||0]}; width: 40px; height: 40px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 3px; font-weight: bold; overflow: hidden;">
          ${charIconInner(char)}
        </div>
        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${char.name}</div>
        ${chanceLabel}
      `;
      container.appendChild(el);
    });
  }

  function renderTeamSlots() {
    const container = document.getElementById('team-slots');
    if (!container) return;
    container.innerHTML = '';
    // Badge de time salvo
    const hasSaved = teamSlots.some(Boolean);
    const badge = document.getElementById('pb-saved-badge');
    if (badge) badge.style.display = hasSaved ? 'inline-flex' : 'none';
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
          if (typeof Online !== 'undefined' && Online.isLoggedIn()) Online.queueSync();
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
    const inTeamSet = new Set(teamSlots.filter(Boolean));

    // Coleta, filtra e ordena
    const units = d.inventario.unidades
      .map(u => ({ u, char: getCharById(u.id) }))
      .filter(({ char }) => char && char.playable)
      .filter(({ char }) => _pbRarityFilter === 0 || char.rarity === _pbRarityFilter)
      .sort((a, b) => b.char.rarity - a.char.rarity || b.u.nivel - a.u.nivel);

    if (d.inventario.unidades.length === 0) {
      container.innerHTML = `<div class="empty-state">${I18N.t('ui_no_units')}</div>`;
      return;
    }

    units.forEach(({ u, char }) => {
      const isInTeam = inTeamSet.has(u.id);
      const card = document.createElement('div');
      card.className = `avail-unit${isInTeam ? ' in-team' : ''}`;
      card.innerHTML = `
        <div class="au-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div class="au-name">${char.name}</div>
        <div class="au-lv">${RARITY_LABELS[char.rarity]} Lv${u.nivel}</div>`;
      if (!isInTeam) {
        card.addEventListener('click', () => {
          const emptySlot = teamSlots.findIndex(s => !s);
          if (emptySlot >= 0) {
            teamSlots[emptySlot] = u.id;
            Save.setTeam(teamSlots);
            if (typeof Online !== 'undefined' && Online.isLoggedIn()) Online.queueSync();
            renderTeamSlots();
            renderAvailableUnits();
          } else {
            toast(I18N.t('err_team_full'));
          }
        });
      }
      container.appendChild(card);
    });
  }

  function setDifficulty(diff) {
    selectedDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
  }

  function showNexus() {
    showScreen('nexus');
    renderNexusScreen();
  }

  function renderNexusScreen() {
    const content = document.getElementById('nexus-content');
    if (!content || typeof NEXUS_STRUCTURES === 'undefined') return;
    content.innerHTML = '';

    const d = Save.get();
    const gemsBar = document.createElement('div');
    gemsBar.className = 'nexus-gems-bar';
    gemsBar.innerHTML = `<span>💎 <b>${d.gemas}</b> gemas disponíveis</span>`;
    content.appendChild(gemsBar);

    const grid = document.createElement('div');
    grid.className = 'nexus-grid';

    NEXUS_STRUCTURES.forEach(struct => {
      const currentLevel = Save.getNexusLevel(struct.id);
      const isMaxed = currentLevel >= struct.maxLevel;
      const upgradeCost = isMaxed ? null : getNexusUpgradeCost(struct.id, currentLevel);
      const canAfford = !isMaxed && upgradeCost <= d.gemas;

      const pipsHtml = Array.from({ length: struct.maxLevel }, (_, i) =>
        `<div class="nexus-pip${i < currentLevel ? ' nexus-pip--filled' : ''}"></div>`
      ).join('');

      const card = document.createElement('div');
      card.className = `nexus-card${isMaxed ? ' nexus-card--maxed' : ''}`;
      card.innerHTML = `
        <div class="nexus-card-icon">${struct.icon}</div>
        <div class="nexus-card-body">
          <div class="nexus-card-name">${struct.name}</div>
          <div class="nexus-card-level">Nível ${currentLevel} / ${struct.maxLevel}</div>
          <div class="nexus-level-bar">${pipsHtml}</div>
          <div class="nexus-card-desc">${struct.desc}</div>
          ${isMaxed
            ? `<div class="nexus-maxed-badge">MÁXIMO ✦</div>`
            : `<button class="btn${canAfford ? ' btn-primary' : ' btn-disabled'}" style="width:100%;font-size:12px;padding:8px;margin-top:8px;"
                ${canAfford ? '' : 'disabled'}
                onclick="UI.upgradeNexusStructure('${struct.id}')">
                Melhorar — ${upgradeCost} 💎
              </button>`
          }
        </div>`;
      grid.appendChild(card);
    });

    content.appendChild(grid);
  }

  async function upgradeNexusStructure(structId) {
    if (typeof Online === 'undefined' || !Online.isLoggedIn()) {
      toast('Necessário estar conectado para melhorar o Nexus.');
      return;
    }
    // Validação local para feedback imediato sem round-trip
    const localCheck = Save.upgradeNexusStructure(structId);
    if (localCheck === 'maxed') { toast('Construção já está no nível máximo.'); return; }
    if (localCheck === 'gems')  { toast('Gemas insuficientes!'); return; }
    if (localCheck === 'invalid') return;

    const struct = typeof NEXUS_STRUCTURES !== 'undefined' ? NEXUS_STRUCTURES.find(s => s.id === structId) : null;
    const result = await Online.upgradeNexus(structId);
    if (result?.ok) {
      toast(`✅ ${struct?.name || structId} melhorada!`);
      updateCurrencyDisplay();
      renderNexusScreen();
    } else if (result?.error === 'maxed') {
      toast('Construção já está no nível máximo.');
    } else if (result?.error === 'gems') {
      toast('Gemas insuficientes!');
    } else {
      toast('Erro ao melhorar — tente novamente.');
    }
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
    if (typeof AudioManager !== 'undefined') setTimeout(() => AudioManager.playMenuBgm(), 600);
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
        <br><span style="font-size:12px;opacity:0.65">${isRecord ? I18N.t('result_inf_new_record') : I18N.t('result_inf_record').replace('{best}', best)}</span>`;

      // Gemas ganhas na sessão
      if (result.infiniteGems > 0) {
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.innerHTML = `<span>${I18N.t('result_gems_earned')}</span><span style="color:#fbbf24;font-weight:700">+${result.infiniteGems}</span>`;
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
        li.innerHTML = `<span>${I18N.t('result_no_rewards')}</span><span>—</span>`;
        rewards.appendChild(li);
      }

    } else {
      // ── Partida normal ──────────────────────────────────────────────────────
      banner.innerHTML = result.victory ? I18N.t('result_victory') : I18N.t('result_defeat');
      if (result.gems) {
        const li = document.createElement('div');
        li.className = 'reward-item';
        li.innerHTML = `<span>${I18N.t('result_gems')}</span><span>+${result.gems}</span>`;
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
        li.innerHTML = `<span>${I18N.t('result_bonus_first')}</span><span>+${result.bonusGems}</span>`;
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
      case 'single_target': return I18N.t('attack_type_single');
      case 'linha': return I18N.t('attack_type_line');
      case 'cone': return I18N.t('attack_type_cone');
      case 'aoe': return I18N.t('attack_type_aoe');
      case 'aoe_full': return I18N.t('attack_type_aoe_full');
      case 'aoe_vizard_total': return I18N.t('attack_type_vizard');
      case 'none': return I18N.t('attack_type_support');
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
    const passiveDesc = _passives.length > 0 ? _passives.map(p => p.label).join(' | ') : I18N.t('ui_no_passive');

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
              <div class="passive-title">${I18N.t('ui_passive_header')}</div>
              <div class="passive-text">${passiveDesc}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function makeSupportingList(star4Ids, star3Ids) {
    let html = `<div class="banner-supporting-section">`;
    html += `<div class="supporting-title">${I18N.t('ui_supporting_units')}</div>`;
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
    const isOnline = typeof Online !== 'undefined' && Online.isLoggedIn();
    const msg = I18N.t('confirm_reset_progress');

    if (!window.confirm(msg)) return;

    async function _doReset() {
      if (isOnline) await Online.resetAccount();
      Save.reset();
      try { localStorage.removeItem('astd_banner_v2'); } catch(e) {}
      window.location.reload();
    }
    _doReset();
  }

  function updateBannerTimer() {
    const el = document.getElementById('banner-timer');
    if (!el) return;
    const ms = BannerSystem.timeUntilReset();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    el.textContent = I18N.t('ui_banner_rotation').replace('{mins}', mins).replace('{secs}', secs.toString().padStart(2, '0'));
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
    showNexus, upgradeNexusStructure,
    setDifficulty, updateCurrencyDisplay, updateBannerDisplay, updateBannerTimer,
    confirmReset, closeUpgradePanel, toast,
    getSelectedTeam, getSelectedStage, getSelectedDifficulty,
    showOnlineModal: () => typeof OnlineUI !== 'undefined' && OnlineUI.show()
  };
})();
