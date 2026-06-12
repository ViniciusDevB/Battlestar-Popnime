const Inventory = (() => {
  let currentTab = 'units';
  let selectedUnit = null;  // uid
  let feedTarget = null;    // uid
  let feedSelected = [];    // [{type:'unit', uid} | {type:'material', id}]
  let evolutionTarget = null;

  // ── Filtros múltiplos ──────────────────────────────────────────────────────
  const FILTER_CHIPS = [
    { id: 'all',      label: 'Todos',     type: 'all' },
    // Série
    { id: 'naruto',   label: 'Naruto',    type: 'series' },
    { id: 'onepiece', label: 'One Piece', type: 'series' },
    { id: 'bleach',   label: 'Bleach',    type: 'series' },
    { id: 'marvel',   label: 'Marvel',    type: 'series' },
    { id: 'dc',       label: 'DC',        type: 'series' },
    { id: 'evento',   label: 'Evento',    type: 'series' },
    // Raridade
    { id: 'r7', label: '7★', type: 'rarity', val: 7 },
    { id: 'r6', label: '6★', type: 'rarity', val: 6 },
    { id: 'r5', label: '5★', type: 'rarity', val: 5 },
    { id: 'r4', label: '4★', type: 'rarity', val: 4 },
    { id: 'r3', label: '3★', type: 'rarity', val: 3 },
  ];

  let _savedFilters = (() => {
    try { return JSON.parse(localStorage.getItem('astd_inv_filters') || '["all"]'); } catch { return ['all']; }
  })();
  let activeFilters = new Set(_savedFilters);
  let _searchTerm = '';
  let _sortMode = localStorage.getItem('astd_inv_sort') || 'rarity';

  function _saveFilters() {
    try { localStorage.setItem('astd_inv_filters', JSON.stringify([...activeFilters])); } catch {}
  }

  function renderFilterChips() {
    const container = document.getElementById('inv-filter-chips');
    if (!container) return;

    // Linha de busca + ordenação
    const topRow = document.createElement('div');
    topRow.className = 'inv-filter-toprow';
    topRow.innerHTML = `
      <input id="inv-search" class="inv-search" type="text" placeholder="🔍 Buscar personagem..." value="${_searchTerm}">
      <select id="inv-sort" class="inv-sort-sel">
        <option value="rarity" ${_sortMode==='rarity'?'selected':''}>Raridade ↓</option>
        <option value="level"  ${_sortMode==='level' ?'selected':''}>Nível ↓</option>
        <option value="name"   ${_sortMode==='name'  ?'selected':''}>Nome A-Z</option>
      </select>`;
    container.innerHTML = '';
    container.appendChild(topRow);

    // Linha de chips
    const chipsRow = document.createElement('div');
    chipsRow.className = 'inv-chips-row';
    FILTER_CHIPS.forEach(chip => {
      const el = document.createElement('button');
      el.className = 'inv-chip' + (activeFilters.has(chip.id) ? ' active' : '');
      el.textContent = chip.label;
      el.addEventListener('click', () => toggleFilter(chip.id));
      chipsRow.appendChild(el);
    });
    container.appendChild(chipsRow);

    document.getElementById('inv-search').addEventListener('input', e => {
      _searchTerm = e.target.value.trim().toLowerCase();
      renderGrid();
    });
    document.getElementById('inv-sort').addEventListener('change', e => {
      _sortMode = e.target.value;
      try { localStorage.setItem('astd_inv_sort', _sortMode); } catch {}
      renderGrid();
    });
  }

  function toggleFilter(id) {
    if (id === 'all') {
      activeFilters = new Set(['all']);
    } else {
      activeFilters.delete('all');
      if (activeFilters.has(id)) {
        activeFilters.delete(id);
        if (activeFilters.size === 0) activeFilters.add('all');
      } else {
        activeFilters.add(id);
      }
    }
    _saveFilters();
    renderFilterChips();
    renderGrid();
  }

  function _matchesFilters(char) {
    // Busca por nome
    if (_searchTerm && !char.name.toLowerCase().includes(_searchTerm)) return false;
    // Chips de filtro
    if (activeFilters.has('all')) return true;
    for (const id of activeFilters) {
      const chip = FILTER_CHIPS.find(c => c.id === id);
      if (!chip) continue;
      if (chip.id === 'evento') { if (char.event_exclusive) return true; continue; }
      if (chip.type === 'series' && char.series === chip.id) return true;
      if (chip.type === 'rarity' && char.rarity === chip.val) return true;
    }
    return false;
  }

  function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const filters = document.getElementById('inv-filters');
    const teamBar = document.getElementById('inv-team-bar');
    if (filters) filters.style.display = tab === 'evolution' ? 'none' : '';
    if (teamBar) {
      teamBar.style.display = tab === 'units' ? 'flex' : 'none';
      if (tab === 'units') renderTeamBar();
    }
    if (tab !== 'units') closeDetail();
    renderFilterChips();
    renderGrid();
  }

  function renderTeamBar() {
    const container = document.getElementById('inv-team-slots');
    if (!container) return;
    container.innerHTML = '';
    const team = Save.getTeam();
    team.forEach((charId, i) => {
      const slot = document.createElement('div');
      slot.className = 'inv-team-slot' + (charId ? ' filled' : '');
      if (charId) {
        const char = getCharById(charId);
        slot.innerHTML = `
          <div class="ts-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="ts-remove">✕</div>
        `;
        slot.addEventListener('click', () => {
          team[i] = null;
          Save.setTeam(team);
          if (typeof Online !== 'undefined' && Online.isLoggedIn()) Online.queueSync();
          renderTeamBar();
          if (selectedUnit) openDetail(selectedUnit);
        });
      } else {
        slot.innerHTML = '+';
      }
      container.appendChild(slot);
    });
  }

  function toggleTeam(charId) {
    const team = Save.getTeam();
    const index = team.indexOf(charId);
    if (index >= 0) {
      team[index] = null;
    } else {
      const emptySlot = team.findIndex(s => !s);
      if (emptySlot >= 0) {
        team[emptySlot] = charId;
      } else {
        UI.toast(I18N.t('err_team_full'));
        return;
      }
    }
    Save.setTeam(team);
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) Online.queueSync();
    renderTeamBar();
    if (selectedUnit) openDetail(selectedUnit);
  }

  function applyFilters() { renderGrid(); }

  function renderGrid() {
    const grid = document.getElementById('inventory-grid');
    const evoContent = document.getElementById('evolution-content');
    if (!grid) return;

    if (currentTab === 'evolution') {
      grid.style.display = 'none';
      if (evoContent) { evoContent.style.display = 'flex'; renderEvolutionTab(); }
      return;
    }

    grid.style.display = '';
    if (evoContent) evoContent.style.display = 'none';
    grid.innerHTML = '';

    if (currentTab === 'units') {
      const d = Save.get();
      const ownedIds = new Set();

      const unitsToRender = [];

      d.inventario.unidades.forEach(unit => {
        const char = getCharById(unit.id);
        if (!char || !char.playable) return;
        if (!_matchesFilters(char)) return;
        ownedIds.add(unit.id);
        unitsToRender.push({ char, unit, locked: !!unit.in_trade });
      });

      unitsToRender.sort((a, b) => {
        if (_sortMode === 'level') {
          const lvDiff = (b.unit?.nivel || 0) - (a.unit?.nivel || 0);
          if (lvDiff !== 0) return lvDiff;
          return b.char.rarity - a.char.rarity;
        }
        if (_sortMode === 'name') return a.char.name.localeCompare(b.char.name);
        // default: rarity
        if (b.char.rarity !== a.char.rarity) return b.char.rarity - a.char.rarity;
        if (a.unit && b.unit) return b.unit.nivel - a.unit.nivel;
        return a.char.name.localeCompare(b.char.name);
      });

      unitsToRender.forEach(item => {
        if (item.unit) {
          const { char, unit, locked } = item;
          const card = document.createElement('div');
          card.className = `inv-card rarity-${char.rarity}${locked ? ' inv-card--in-trade' : ''}`;
          card.innerHTML = `
            <div class="inv-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
            <div class="inv-name">${char.name}</div>
            <div class="inv-meta">${RARITY_LABELS[char.rarity]} Lv${unit.nivel}${locked ? ` · ${I18N.t('status_in_trade')}` : ''}</div>`;
          card.addEventListener('click', () => openDetail(unit.uid));
          grid.appendChild(card);
        }
      });

    } else {
      const materials = Object.values(CHARACTERS)
        .filter(c => !c.playable)
        .filter(c => _matchesFilters(c))
        .sort((a, b) => a.rarity - b.rarity);

      materials.forEach(char => {
        const qty = Save.getMaterialQty(char.id);
        if (qty <= 0) return;
        
        const card = document.createElement('div');
        card.className = `inv-card rarity-${char.rarity}${char.upgrades_to ? ' mat-combinable' : ''}`;
        card.innerHTML = `
          <div class="inv-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="inv-name">${char.name}</div>
          <div class="inv-meta">${RARITY_LABELS[char.rarity]} × ${qty}</div>`;
        card.addEventListener('click', () => openMaterialDetail(char.id));
        grid.appendChild(card);
      });
    }
  }

  function openMaterialDetail(matId) {
    selectedUnit = null;
    const char = getCharById(matId);
    if (!char) return;

    const panel  = document.getElementById('unit-detail-panel');
    const content = document.getElementById('unit-detail-content');
    panel.style.display = 'flex';

    const qty      = Save.getMaterialQty(matId);
    const nextChar = char.upgrades_to ? getCharById(char.upgrades_to) : null;
    const cost     = char.upgrade_cost || 3;
    const canMake  = Math.floor(qty / cost);
    const canCombine = nextChar && qty >= cost;

    const combineHtml = nextChar ? `
      <div class="mat-combine-section">
        <div class="mat-combine-title">🔨 ${I18N.t('ui_combine')}</div>
        <div class="mat-combine-recipe">
          <div class="mat-comb-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="mat-comb-arrow">× ${cost} →</div>
          <div class="mat-comb-icon" style="background:${RARITY_COLORS[nextChar.rarity]}">${charIconInner(nextChar)}</div>
        </div>
        <div class="mat-comb-desc">${cost}× ${char.name} → 1× ${nextChar.name}</div>
        <div class="mat-comb-have">${I18N.t('msg_you_have')} <b>${qty}</b> — ${I18N.t('msg_can_combine')} <b>${canMake}×</b></div>
        <button class="btn btn-mat-combine${canCombine ? '' : ' btn-disabled'}"
          ${canCombine ? '' : 'disabled'}
          onclick="Inventory.combineMaterial('${matId}')">
          🔨 ${I18N.t('ui_combine')} ${cost}× → 1× ${nextChar.name}
        </button>
        ${canMake > 1 ? `
        <button class="btn btn-mat-combine"
          style="margin-top: 8px; background: #6c3483;"
          onclick="Inventory.combineMaxMaterial('${matId}')">
          🔨 ${I18N.t('ui_combine_all')} (${canMake}×)
        </button>
        ` : ''}
      </div>` : `
      <div class="mat-combine-section">
        <div class="mat-comb-max">✦ ${I18N.t('msg_max_tier')}</div>
      </div>`;

    content.innerHTML = `
      <div class="detail-header">
        <div class="detail-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div class="detail-name">${char.name}</div>
          <div class="detail-rarity">${RARITY_LABELS[char.rarity]} · ${SERIES_LABELS[char.series] || char.series}</div>
          <div class="detail-qty">${I18N.t('ui_quantity')}: ${qty}</div>
        </div>
      </div>
      <div class="detail-stats">
        <div class="stat-row"><span>${I18N.t('ui_xp_value')}</span><span>${char.xp_value}</span></div>
      </div>
      ${combineHtml}`;
  }

  async function combineMaterial(matId) {
    const char = getCharById(matId);
    if (!char || !char.upgrades_to) return;
    const cost = char.upgrade_cost || 3;
    if (Save.getMaterialQty(matId) < cost) { UI.toast(I18N.t('err_no_materials')); return; }

    Save.removeMaterial(matId, cost);
    Save.addMaterial(char.upgrades_to, 1);
    Missions.check();
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();

    const nextChar = getCharById(char.upgrades_to);
    UI.toast(`✅ ${nextChar.name} ${I18N.t('msg_obtained')}!`);
    renderGrid();
    openMaterialDetail(char.upgrades_to);
  }

  async function combineMaxMaterial(matId) {
    const char = getCharById(matId);
    if (!char || !char.upgrades_to) return;
    const cost = char.upgrade_cost || 3;
    const qty = Save.getMaterialQty(matId);
    const canMake = Math.floor(qty / cost);
    if (canMake < 1) { UI.toast(I18N.t('err_no_materials')); return; }

    Save.removeMaterial(matId, canMake * cost);
    Save.addMaterial(char.upgrades_to, canMake);
    Missions.check();
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();

    const nextChar = getCharById(char.upgrades_to);
    UI.toast(`✅ ${canMake}x ${nextChar.name} ${I18N.t('msg_obtained')}!`);
    renderGrid();
    openMaterialDetail(char.upgrades_to);
  }

  function renderEvolutionTab() {
    const evoContent = document.getElementById('evolution-content');
    if (!evoContent) return;
    evoContent.innerHTML = '';

    const evolutions = Object.values(CHARACTERS).filter(c => c.evolution);
    if (evolutions.length === 0) {
      evoContent.innerHTML = `<div class="empty-state">${I18N.t('msg_no_evolution')}</div>`;
      return;
    }

    evolutions.forEach(resultChar => {
      const sourceChar = getCharById(resultChar.evolution.source);
      const canEvolve = checkEvolutionAvailable(resultChar.id);

      const reqHtml = resultChar.evolution.requires.map(req => {
        const rc = getCharById(req.id);
        if (!rc) return '';
        const have = rc.playable ? Save.getUnitQty(req.id) : Save.getMaterialQty(req.id);
        const ok = have >= req.quantity;
        return `<div class="evo-req${ok ? '' : ' evo-req--missing'}">
          <span class="evo-req-icon" style="background:${RARITY_COLORS[rc.rarity]}">${charIconInner(rc)}</span>
          <span>${rc.name}</span>
          <span class="evo-req-count">${have}/${req.quantity} ${ok ? '✓' : '✗'}</span>
        </div>`;
      }).join('');

      const card = document.createElement('div');
      card.className = `evo-recipe-card${canEvolve ? ' evo-recipe-card--ready' : ''}`;
      card.innerHTML = `
        <div class="evo-recipe-header">
          <div class="evo-recipe-chars">
            <div class="evo-recipe-unit">
              <div class="evo-recipe-icon" style="background:${RARITY_COLORS[sourceChar?.rarity||3]}">${charIconInner(sourceChar)}</div>
              <div class="evo-recipe-name">${sourceChar?.name||'?'}</div>
              <div class="evo-recipe-stars">${RARITY_LABELS[sourceChar?.rarity||3]}</div>
            </div>
            <div class="evo-recipe-arrow">→</div>
            <div class="evo-recipe-unit">
              <div class="evo-recipe-icon evo-recipe-icon--result" style="background:${RARITY_COLORS[resultChar.rarity]}">${charIconInner(resultChar)}</div>
              <div class="evo-recipe-name">${resultChar.name}</div>
              <div class="evo-recipe-stars">${RARITY_LABELS[resultChar.rarity]}</div>
            </div>
          </div>
          ${canEvolve ? `<div class="evo-badge-ready">${I18N.t('ui_ready')}!</div>` : ''}
        </div>
        <div class="evo-reqs-section">
          <div class="evo-reqs-title">${I18N.t('ui_materials_needed')}</div>
          <div class="evo-reqs">${reqHtml}</div>
        </div>
        <button class="btn btn-evolve${canEvolve ? '' : ' btn-disabled'}"
          onclick="Inventory.openEvolution('${resultChar.id}')"
          ${canEvolve ? '' : 'disabled'}>
          🔮 ${I18N.t('ui_evolve_to')} ${resultChar.name}
        </button>`;
      evoContent.appendChild(card);
    });
  }

  function openDetail(uid) {
    selectedUnit = uid;
    const unitData = Save.getUnitByUid(uid);
    if (!unitData) return;
    const char = getCharById(unitData.id);
    if (!char) return;

    const panel = document.getElementById('unit-detail-panel');
    const content = document.getElementById('unit-detail-content');
    panel.style.display = 'flex';

    const stats = getCurrentStats(char, unitData.nivel);
    const maxLevel = char.max_level || 50;
    const xpNeeded = xpForNextLevel(unitData.nivel, char.rarity);
    const xpPct = unitData.nivel >= maxLevel ? 100 : Math.round((unitData.xp_atual / xpNeeded) * 100);
    const totalCopies = Save.getUnitQty(char.id);
    const passives = char.passive ? (Array.isArray(char.passive) ? char.passive : [char.passive]) : [];
    const prestigeLevel = unitData.prestige || 0;
    const pp = char.prestige_passives;
    const prestigeActiveHtml = pp ? [1,5,10].filter(t => prestigeLevel >= t && pp[t])
      .map(t => `<div class="passive-tag" style="border-left:3px solid #fbbf24;padding-left:6px">✦ ${pp[t].label}</div>`).join('') : '';
    const prestigeFutureHtml = pp ? [1,5,10].filter(t => prestigeLevel < t && pp[t])
      .map(t => `<div class="passive-tag" style="opacity:0.38;border-left:3px solid rgba(251,191,36,0.4);padding-left:6px">🔒 P${t === 1 ? 'I' : t === 5 ? 'V' : 'X'}: ${pp[t].label}</div>`).join('') : '';
    const passiveHtml = passives.map(p => `<div class="passive-tag">⚡ ${p.label}</div>`).join('') + prestigeActiveHtml + prestigeFutureHtml;

    const headerHtml = `
      <div class="detail-header">
        <div class="detail-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div class="detail-name">${char.name}</div>
          <div class="detail-rarity">${RARITY_LABELS[char.rarity]} | ${char.series}</div>
          <div class="detail-qty">${I18N.t('ui_copies')}: ${totalCopies}</div>
        </div>
      </div>
      ${passiveHtml}`;

    const xpRowHtml = `
      <div class="stat-row"><span>${I18N.t('ui_level')}</span><span>${unitData.nivel}/${maxLevel}</span></div>
      <div class="stat-row xp-row">
        <span>XP</span>
        <div class="xp-bar-wrap"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
        <span>${unitData.nivel >= maxLevel ? 'MAX' : `${unitData.xp_atual}/${xpNeeded}`}</span>
      </div>`;

    const inTeam = Save.getTeam().includes(char.id);
    const equipBtn = `<button class="btn btn-primary" onclick="Inventory.toggleTeam('${char.id}')">${inTeam ? I18N.t('ui_remove_team') : I18N.t('ui_equip_team')}</button>`;

    const relicSave = unitData.equippedRelic || null;
    const _relicR = relicSave && typeof getRelicById !== 'undefined' ? getRelicById(relicSave.id) : null;
    const _stashCount = Save.getRelicStash().length;
    const relicHtml = _relicR
      ? `<div class="relic-equipped-section">
           <div class="relic-equipped-label">Relíquia Equipada</div>
           <div class="relic-equipped-card${relicSave.isCorrupted ? ' corrupted' : ''}">
             <span class="re-icon">${_relicR.icon}</span>
             <div class="re-info">
               <div class="re-name">${_relicR.name}${relicSave.isCorrupted ? ' ☠' : ''}</div>
               <div class="re-desc">${relicSave.isCorrupted ? _relicR.corrupted_desc : _relicR.desc}</div>
             </div>
           </div>
           <button class="btn btn-secondary" style="width:100%;margin-top:8px;font-size:11px;" onclick="Inventory.unequipRelicFromUnit('${uid}')">Desequipar</button>
         </div>`
      : `<div class="relic-equipped-section">
           <div class="relic-equipped-label">Relíquia</div>
           ${_stashCount > 0
             ? `<button class="btn btn-secondary" style="width:100%;font-size:11px;" onclick="Inventory.openRelicEquip('${uid}')">Equipar Relíquia (${_stashCount} na reserva)</button>`
             : `<div class="relic-none-msg">Nenhuma relíquia na reserva. Crie uma na Forja.</div>`
           }
         </div>`;

    if (char.is_farm_unit) {
      const p = char.passive;
      const levelGold = p.base + (unitData.nivel - 1) * (p.perLevel || 0);
      const maxUpgGold = char.upgrades.reduce((s, u) => s + (u.gold_bonus || 0), 0);
      content.innerHTML = `${headerHtml}
        <div class="detail-stats">
          ${xpRowHtml}
          <div class="stat-row"><span>${I18N.t('ui_gold_wave')}</span><span>${levelGold} 💰</span></div>
          <div class="stat-row"><span>${I18N.t('ui_max_upgrade_bonus')}</span><span>+${maxUpgGold} 💰</span></div>
          <div class="stat-row"><span>${I18N.t('ui_deploy_cost')}</span><span>${char.deploy_cost} 💰</span></div>
        </div>
        ${relicHtml}
        <div class="detail-actions">
          ${equipBtn}
          <button class="btn btn-feed" onclick="Inventory.openFeed('${uid}')">🍖 ${I18N.t('ui_feed')}</button>
        </div>`;
    } else {
      const prestigeLevel = unitData.prestige || 0;
      const canPrestige   = unitData.nivel >= (char.max_level || 50) && prestigeLevel < 10;
      const prestigeHtml  = `
        <div class="prestige-section" style="margin-top:10px;padding:10px;background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,${canPrestige?'0.35':'0.12'});border-radius:8px;">
          <div style="font-size:11px;font-weight:700;color:${canPrestige?'#fbbf24':'rgba(255,215,0,0.4)'};letter-spacing:0.06em;margin-bottom:6px;">
            ✦ ${I18N.t('ui_prestige')} ${prestigeLevel > 0 ? `— ${I18N.t('ui_level')} ${prestigeLevel}` : ''}
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:8px;">
            ${prestigeLevel >= 10
              ? I18N.t('msg_prestige_max')
              : canPrestige
                ? I18N.t('msg_prestige_ready')
                : `${I18N.t('msg_prestige_req')} (${char.max_level||50}). ${I18N.t('ui_current')}: ${unitData.nivel}.`}
          </div>
          <button class="btn" style="width:100%;font-size:11px;background:${canPrestige?'rgba(255,215,0,0.18)':'rgba(255,255,255,0.05)'};color:${canPrestige?'#fbbf24':'rgba(255,255,255,0.25)'};border:1px solid ${canPrestige?'rgba(255,215,0,0.4)':'rgba(255,255,255,0.1)'};"
            ${canPrestige?'':'disabled'}
            onclick="Inventory.doPrestigeUnit('${uid}')">
            ✦ ${canPrestige ? I18N.t('ui_transmute_confirm') : I18N.t('ui_transmute_locked')}
          </button>
        </div>`;

      content.innerHTML = `${headerHtml}
        <div class="detail-stats">
          ${xpRowHtml}
          ${prestigeLevel > 0 ? `<div class="stat-row" style="color:#fbbf24"><span>${I18N.t('ui_prestige')}</span><span>✦ ${prestigeLevel} (+${prestigeLevel*20}% ${I18N.t('ui_damage')})</span></div>` : ''}
          <div class="stat-row"><span>${I18N.t('ui_damage')}</span><span>${Math.round(stats.damage)}</span></div>
          <div class="stat-row"><span>${I18N.t('ui_range')}</span><span>${Math.round(stats.range)}</span></div>
          <div class="stat-row"><span>${I18N.t('ui_attack_speed')}</span><span>${stats.attack_speed.toFixed(2)}/s</span></div>
          <div class="stat-row"><span>${I18N.t('ui_type')}</span><span>${stats.type}</span></div>
          <div class="stat-row"><span>${I18N.t('ui_deploy_cost')}</span><span>${char.deploy_cost} 💰</span></div>
        </div>
        ${prestigeHtml}
        ${relicHtml}
        <div class="detail-actions">
          ${equipBtn}
          <button class="btn btn-feed" onclick="Inventory.openFeed('${uid}')">🍖 ${I18N.t('ui_feed')}</button>
        </div>`;
    }
  }

  async function doPrestigeUnit(uid) {
    if (!Save.canPrestige(uid)) { UI.toast(I18N.t('err_prestige_level')); return; }
    const u = Save.getUnitByUid(uid);
    if (!u) return;
    if (Save.isUnitLocked(uid)) { UI.toast(I18N.t('err_unit_in_trade')); return; }
    const char = getCharById(u.id);
    const currentPrestige = u.prestige || 0;
    if (!confirm(I18N.t('msg_confirm_prestige', { name: char?.name, lvl: currentPrestige+1 }))) return;
    Save.doPrestige(uid);
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();
    UI.toast(`✦ ${char?.name} ${I18N.t('msg_transmuted')}! ${I18N.t('ui_prestige')} ${currentPrestige+1} ${I18N.t('msg_active')}.`, 3500);
    renderGrid();
    openDetail(uid);
  }

  function closeDetail() {
    selectedUnit = null;
    const panel = document.getElementById('unit-detail-panel');
    if (panel) panel.style.display = 'none';
  }

  function checkEvolutionAvailable(charId) {
    const char = getCharById(charId);
    if (!char || !char.evolution) return false;
    for (const req of char.evolution.requires) {
      const charReq = getCharById(req.id);
      if (!charReq) return false;
      if (charReq.playable) {
        if (Save.getUnitQty(req.id) < req.quantity) return false;
      } else {
        if (Save.getMaterialQty(req.id) < req.quantity) return false;
      }
    }
    return true;
  }

  function openEvolution(charId) {
    evolutionTarget = charId;
    const char = getCharById(charId);
    if (!char || !char.evolution) return;

    const sourceChar = getCharById(char.evolution.source);
    const modal = document.getElementById('evolution-modal');
    const recipe = document.getElementById('evolution-recipe');
    const canEvolve = checkEvolutionAvailable(charId);

    const reqHtml = char.evolution.requires.map(req => {
      const rc = getCharById(req.id);
      if (!rc) return '';
      const have = rc.playable ? Save.getUnitQty(req.id) : Save.getMaterialQty(req.id);
      const ok = have >= req.quantity;
      return `<div class="evo-req${ok ? '' : ' evo-req--missing'}">
        <span class="evo-req-icon" style="background:${RARITY_COLORS[rc.rarity]}">${charIconInner(rc)}</span>
        <span>${rc.name}</span>
        <span>${have}/${req.quantity} ${ok ? '✓' : '✗'}</span>
      </div>`;
    }).join('');

    recipe.innerHTML = `
      <div class="evo-target">
        <div class="evo-icon" style="background:${RARITY_COLORS[sourceChar?.rarity||3]}">${charIconInner(sourceChar)}</div>
        <div class="evo-arrow">→</div>
        <div class="evo-icon evo-result" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
      </div>
      <div class="evo-title">${sourceChar?.name} → ${char.name}</div>
      <h4 style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">${I18N.t('ui_materials_needed')}</h4>
      <div class="evo-reqs">${reqHtml}</div>
      ${!canEvolve ? `<div class="evo-warning">${I18N.t('err_no_materials')}!</div>` : ''}`;

    const btn = document.getElementById('btn-evolve-confirm');
    btn.disabled = !canEvolve;
    modal.style.display = 'flex';
  }

  function closeEvolution() {
    evolutionTarget = null;
    document.getElementById('evolution-modal').style.display = 'none';
  }

  async function confirmEvolution() {
    if (!evolutionTarget) return;
    const char = getCharById(evolutionTarget);
    if (!char || !char.evolution || !checkEvolutionAvailable(evolutionTarget)) return;

    // Block if not enough non-locked copies exist for any playable requirement
    for (const req of char.evolution.requires) {
      const rc = getCharById(req.id);
      if (rc?.playable) {
        const avail = Save.get().inventario.unidades.filter(u => u.id === req.id && !u.in_trade).length;
        if (avail < req.quantity) { UI.toast(I18N.t('err_unit_in_trade')); return; }
      }
    }

    for (const req of char.evolution.requires) {
      const rc = getCharById(req.id);
      if (rc.playable) Save.removeUnit(req.id, req.quantity);
      else Save.removeMaterial(req.id, req.quantity);
    }

    Save.addUnit(evolutionTarget, 1, 0);
    Save.incStat('evolucoes_realizadas');
    if (char.rarity >= 5) Save.incStat('unidades_5estrelas_obtidas');
    Missions.check();
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();
    closeEvolution();

    const d = Save.get();
    const newUnit = d.inventario.unidades.filter(u => u.id === evolutionTarget).at(-1);
    showTab('units');
    if (newUnit) openDetail(newUnit.uid);
    UI.toast(`🌟 ${char.name} ${I18N.t('msg_obtained')}!`);
  }

  // ── FORGE SYSTEM ─────────────────────────────────────────────────────────────

  function renderForgeTab() {
    const fc = document.getElementById('forge-content');
    if (!fc) return;
    fc.innerHTML = '';

    const forgeLevel = Save.getNexusLevel('forge');
    if (forgeLevel === 0) {
      fc.innerHTML = `<div class="forge-locked-msg">
        <div style="font-size:2.5em;margin-bottom:12px">⚒</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:8px">Forja de Relíquias</div>
        <div style="font-size:12px;color:rgba(238,240,255,0.6);line-height:1.6">Construa a <strong>Forja de Relíquias</strong> no Nexus (Nível 1) para desbloquear o sistema de crafting de relíquias.</div>
        <button class="btn btn-secondary" style="margin-top:16px;font-size:12px;" onclick="UI.showNexus()">🏰 Ir ao Nexus</button>
      </div>`;
      return;
    }

    const costMult = forgeLevel >= 2 ? 0.80 : 1.0;
    const rareBonus = forgeLevel >= 3 ? 0.05 : 0.0;

    const stash = Save.getRelicStash();
    if (stash.length > 0) {
      const stashSec = document.createElement('div');
      stashSec.className = 'forge-stash-section';
      stashSec.innerHTML = `<div class="forge-section-title">Reserva de Relíquias (${stash.length})</div>`;
      const stashGrid = document.createElement('div');
      stashGrid.className = 'forge-stash-grid';
      stash.forEach(rs => {
        const r = typeof getRelicById !== 'undefined' ? getRelicById(rs.id) : null;
        if (!r) return;
        const card = document.createElement('div');
        card.className = `forge-stash-card${rs.isCorrupted ? ' corrupted' : ''}`;
        card.innerHTML = `<span class="forge-stash-icon">${r.icon}</span><span class="forge-stash-name">${r.name}${rs.isCorrupted ? ' ☠' : ''}</span>`;
        stashGrid.appendChild(card);
      });
      stashSec.appendChild(stashGrid);
      fc.appendChild(stashSec);
    }

    const craftSec = document.createElement('div');
    craftSec.className = 'forge-craft-section';
    craftSec.innerHTML = `<div class="forge-section-title">Craftar Relíquias${forgeLevel >= 2 ? ' <span style="color:#39FF14;font-size:11px">(-20% materiais)</span>' : ''}</div>`;
    const craftGrid = document.createElement('div');
    craftGrid.className = 'forge-craft-grid';

    if (typeof RELICS !== 'undefined' && typeof RELIC_CRAFTS !== 'undefined') {
      const unlockedRelics = Object.values(RELICS).filter(relic => Save.hasRelicRecipe(relic.id));
      if (unlockedRelics.length === 0) {
        const hint = document.createElement('div');
        hint.style.cssText = 'color:rgba(238,240,255,0.5);font-size:12px;padding:12px 0;text-align:center;';
        hint.textContent = '📜 Nenhuma receita desbloqueada. Faça pulls no banner de Relíquias para desbloquear.';
        craftGrid.appendChild(hint);
      }
      unlockedRelics.forEach(relic => {
        const recipe = RELIC_CRAFTS[relic.id];
        if (!recipe) return;

        const adjRecipe = recipe.map(r => ({ ...r, qty: Math.ceil(r.qty * costMult) }));
        const canCraft = adjRecipe.every(r => Save.getMaterialQty(r.id) >= r.qty);
        const corruptChance = relic.corruptChance || 0.015;
        const effectiveCC = Math.max(0.005, corruptChance - rareBonus);

        const recipeHtml = adjRecipe.map(r => {
          const mc = typeof getCharById !== 'undefined' ? getCharById(r.id) : null;
          const have = Save.getMaterialQty(r.id);
          const ok = have >= r.qty;
          return `<div class="forge-ingredient${ok ? '' : ' forge-ingredient--missing'}">
            <span class="forge-mat-icon" style="background:${typeof RARITY_COLORS !== 'undefined' ? RARITY_COLORS[mc?.rarity || 0] : '#666'}">${typeof charIconInner !== 'undefined' ? charIconInner(mc) : (mc?.initials || '?')}</span>
            <span>${mc?.name || r.id}</span>
            <span class="${ok ? 'forge-have-ok' : 'forge-have-bad'}">${have}/${r.qty}</span>
          </div>`;
        }).join('');

        const card = document.createElement('div');
        card.className = `forge-relic-card${canCraft ? ' forge-relic-card--ready' : ''}`;
        card.innerHTML = `
          <div class="forge-relic-header">
            <span class="forge-relic-icon">${relic.icon}</span>
            <div>
              <div class="forge-relic-name">${relic.name}</div>
              <div class="forge-relic-world">${relic.world} · ${'★'.repeat(relic.rarity)}</div>
            </div>
          </div>
          <div class="forge-relic-desc">${relic.desc}</div>
          <div class="forge-corrupt-hint">☠ Chance de corrupção: ${(effectiveCC * 100).toFixed(1)}%</div>
          <div class="forge-ingredients">${recipeHtml}</div>
          <button class="btn${canCraft ? ' btn-primary' : ' btn-disabled'}" style="width:100%;font-size:12px;padding:8px;margin-top:8px;"
            ${canCraft ? '' : 'disabled'}
            onclick="Inventory.craftRelic('${relic.id}')">⚒ Craftar</button>`;
        craftGrid.appendChild(card);
      });
    }

    craftSec.appendChild(craftGrid);
    fc.appendChild(craftSec);
  }

  async function craftRelic(relicId) {
    if (typeof Online === 'undefined' || !Online.isLoggedIn()) {
      UI.toast(I18N.t('toast_forge_need_online'));
      return;
    }
    const forgeLevel = Save.getNexusLevel('forge');
    if (forgeLevel === 0) { UI.toast(I18N.t('toast_forge_required_pull')); return; }
    if (!Save.hasRelicRecipe(relicId)) { UI.toast(I18N.t('toast_recipe_required')); return; }
    if (typeof RELICS === 'undefined' || typeof RELIC_CRAFTS === 'undefined') return;

    const relic = RELICS[relicId];
    const recipe = RELIC_CRAFTS[relicId];
    if (!relic || !recipe) return;

    // Validação local para feedback imediato
    const costMult  = forgeLevel >= 2 ? 0.80 : 1.0;
    const adjRecipe = recipe.map(r => ({ ...r, qty: Math.ceil(r.qty * costMult) }));
    for (const r of adjRecipe) {
      if (Save.getMaterialQty(r.id) < r.qty) {
        const mc = typeof getCharById !== 'undefined' ? getCharById(r.id) : null;
        UI.toast(I18N.t('toast_insufficient_ingredient', { name: mc?.name || r.id }));
        return;
      }
    }

    // Server aplica o craft atomicamente e decide se fica corrompida
    const result = await Online.craftRelic(relicId, adjRecipe);
    if (result?.ok) {
      const key = result.isCorrupted ? 'toast_relic_corrupted' : 'toast_relic_crafted';
      UI.toast(I18N.t(key, { name: relic.name }), 3500);
      renderForgeTab();
    } else if (result?.error === 'insufficient_materials') {
      const mc = typeof getCharById !== 'undefined' ? getCharById(result.material) : null;
      UI.toast(I18N.t('toast_insufficient_ingredient', { name: mc?.name || result.material }));
    } else if (result?.error === 'forge_locked') {
      UI.toast(I18N.t('toast_forge_required_pull'));
    } else if (result?.error === 'recipe_not_found') {
      UI.toast(I18N.t('toast_recipe_required'));
    } else {
      UI.toast(I18N.t('toast_craft_err'));
    }
  }

  function openRelicEquip(uid) {
    const modal = document.getElementById('forge-equip-modal');
    const contentEl = document.getElementById('forge-equip-content');
    if (!modal || !contentEl) return;

    const stash = Save.getRelicStash();
    if (stash.length === 0) { UI.toast(I18N.t('toast_relic_no_stash')); return; }

    contentEl.innerHTML = '<div style="margin-bottom:12px;font-size:12px;color:rgba(238,240,255,0.6)">Escolha uma relíquia para equipar:</div>';
    const grid = document.createElement('div');
    grid.className = 'forge-stash-grid forge-stash-grid--selectable';

    stash.forEach((rs, idx) => {
      const r = typeof getRelicById !== 'undefined' ? getRelicById(rs.id) : null;
      if (!r) return;
      const card = document.createElement('div');
      card.className = `forge-stash-card forge-stash-card--pick${rs.isCorrupted ? ' corrupted' : ''}`;
      card.innerHTML = `
        <span class="forge-stash-icon">${r.icon}</span>
        <div>
          <div class="forge-stash-name">${r.name}${rs.isCorrupted ? ' ☠' : ''}</div>
          <div class="forge-stash-desc">${rs.isCorrupted ? r.corrupted_desc : r.desc}</div>
        </div>`;
      card.addEventListener('click', async () => {
        Save.equipRelic(uid, idx);
        if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();
        closeRelicEquip();
        openDetail(uid);
        UI.toast(`${r.icon} ${r.name} equipada!`);
      });
      grid.appendChild(card);
    });

    contentEl.appendChild(grid);
    modal.style.display = 'flex';
  }

  function closeRelicEquip() {
    const modal = document.getElementById('forge-equip-modal');
    if (modal) modal.style.display = 'none';
  }

  async function unequipRelicFromUnit(uid) {
    Save.unequipRelic(uid);
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();
    openDetail(uid);
    UI.toast(I18N.t('toast_relic_unequipped'));
  }

  // FEED SYSTEM
  function openFeed(uid) {
    feedTarget = uid;
    feedSelected = [];
    const unitData = Save.getUnitByUid(uid);
    if (!unitData) return;
    if (Save.isUnitLocked(uid)) { UI.toast(I18N.t('err_unit_in_trade')); return; }
    const char = getCharById(unitData.id);
    if (!char) return;

    const modal = document.getElementById('feed-modal');
    const targetInfo = document.getElementById('feed-target-info');
    targetInfo.innerHTML = `
      <div class="feed-target-card">
        <div class="feed-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div>${char.name}</div>
          <div>${I18N.t('ui_level')} ${unitData.nivel}/${char.max_level||50} | XP: ${unitData.xp_atual}/${xpForNextLevel(unitData.nivel, char.rarity)}</div>
        </div>
      </div>`;

    renderFeedMaterials(uid);
    updateFeedXPPreview();
    modal.style.display = 'flex';
  }

  function renderFeedMaterials(targetUid) {
    const grid = document.getElementById('feed-materials-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const targetUnitData = Save.getUnitByUid(targetUid);
    const targetChar = targetUnitData ? getCharById(targetUnitData.id) : null;

    const itemsToRender = [];

    [
      { id:'ninja_generico_1' }, { id:'ninja_generico_2' }, { id:'ninja_generico_3' },
      { id:'pirata_generico_1' }, { id:'pirata_generico_2' }, { id:'pirata_generico_3' },
      { id:'star_exp_1' }, { id:'star_exp_2' }, { id:'star_exp_3' }, { id:'star_exp_4' }, { id:'star_exp_5' }
    ].forEach(mat => {
      const qty = Save.getMaterialQty(mat.id);
      const selectedCount = feedSelected.filter(s => s.type === 'material' && s.id === mat.id).length;
      const available = qty - selectedCount;
      if (qty <= 0) return;
      const char = getCharById(mat.id);
      itemsToRender.push({
        type: 'material',
        ref: mat.id,
        char,
        available,
        xpGain: getFeedXP(mat.id, targetChar),
        selectedCount
      });
    });

    const d = Save.get();
    d.inventario.unidades.forEach(unit => {
      if (unit.uid === targetUid) return;
      if (unit.in_trade) return;
      if (feedSelected.some(s => s.type === 'unit' && s.uid === unit.uid)) return;
      const char = getCharById(unit.id);
      if (!char || !char.playable) return;
      itemsToRender.push({
        type: 'unit',
        ref: unit.uid,
        char,
        unit,
        available: 1,
        xpGain: getFeedXP(unit.id, targetChar)
      });
    });

    itemsToRender.sort((a, b) => {
      if (a.char.rarity !== b.char.rarity) return a.char.rarity - b.char.rarity; 
      if (a.char.id !== b.char.id) return a.char.id.localeCompare(b.char.id);
      if (a.unit && b.unit) return a.unit.nivel - b.unit.nivel;
      return 0;
    });

    itemsToRender.forEach(item => {
      const div = document.createElement('div');
      if (item.type === 'material') {
        div.className = `feed-mat-item${item.selectedCount > 0 ? ' selected' : ''}`;
        div.innerHTML = `
          <div class="feed-mat-icon" style="background:${RARITY_COLORS[item.char.rarity]}">${charIconInner(item.char)}</div>
          <div>${item.char.name}</div>
          <div>×${item.available}</div>
          <div class="feed-mat-xp">+${item.xpGain} XP</div>`;
        div.addEventListener('click', () => selectFeedItem('material', item.ref, item.available > 0));
      } else {
        div.className = 'feed-mat-item';
        div.innerHTML = `
          <div class="feed-mat-icon" style="background:${RARITY_COLORS[item.char.rarity]}">${charIconInner(item.char)}</div>
          <div>${item.char.name} <small>${I18N.t('ui_level')}${item.unit.nivel}</small></div>
          <div>×1</div>
          <div class="feed-mat-xp">+${item.xpGain} XP</div>`;
        div.addEventListener('click', () => selectFeedItem('unit', item.ref, true));
      }
      grid.appendChild(div);
    });
  }

  function getFeedXP(materialId, targetChar) {
    const matChar = getCharById(materialId);
    if (!matChar) return 0;
    const xpTable = { 0:50, 1:150, 2:400, 3:1000, 4:3000, 5:8000 };
    let xp = matChar.xp_value ?? xpTable[matChar.rarity] ?? 0;
    if (matChar.series === targetChar?.series) xp = Math.floor(xp * 1.5);
    return xp;
  }

  function selectFeedItem(type, ref, available) {
    if (!available) return;
    if (type === 'unit') feedSelected.push({ type: 'unit', uid: ref });
    else feedSelected.push({ type: 'material', id: ref });
    renderFeedMaterials(feedTarget);
    updateFeedXPPreview();
    renderFeedSelected();
  }

  function renderFeedSelected() {
    const list = document.getElementById('feed-selected-list');
    if (!list) return;
    list.innerHTML = feedSelected.map((sel, idx) => {
      let char, label;
      if (sel.type === 'unit') {
        const u = Save.getUnitByUid(sel.uid);
        char = u ? getCharById(u.id) : null;
        label = `${char?.initials||'?'} ${I18N.t('ui_level')}${u?.nivel||1}`;
      } else {
        char = getCharById(sel.id);
        label = char?.initials || sel.id;
      }
      return `<span class="feed-sel-chip" style="background:${RARITY_COLORS[char?.rarity||0]}" onclick="Inventory.removeFeedSelected(${idx})">${label} ✕</span>`;
    }).join('');
  }

  function removeFeedSelected(idx) {
    feedSelected.splice(idx, 1);
    renderFeedMaterials(feedTarget);
    updateFeedXPPreview();
    renderFeedSelected();
  }

  function updateFeedXPPreview() {
    const el = document.getElementById('feed-xp-total');
    if (!el) return;
    const targetUnitData = Save.getUnitByUid(feedTarget);
    const targetChar = targetUnitData ? getCharById(targetUnitData.id) : null;
    const total = feedSelected.reduce((sum, sel) => {
      const matId = sel.type === 'unit' ? (Save.getUnitByUid(sel.uid)?.id || null) : sel.id;
      return sum + (matId ? getFeedXP(matId, targetChar) : 0);
    }, 0);
    el.textContent = total.toLocaleString();
  }

  async function confirmFeed() {
    if (!feedTarget || feedSelected.length === 0) return;
    const targetUnitData = Save.getUnitByUid(feedTarget);
    if (!targetUnitData) return;
    const targetChar = getCharById(targetUnitData.id);

    const _academiaBonus = 1 + Save.getNexusLevel('academia') * 0.15;
    const totalXP = Math.round(feedSelected.reduce((sum, sel) => {
      const matId = sel.type === 'unit' ? (Save.getUnitByUid(sel.uid)?.id || null) : sel.id;
      return sum + (matId ? getFeedXP(matId, targetChar) : 0);
    }, 0) * _academiaBonus);

    const prevLevel = targetUnitData.nivel;

    feedSelected.forEach(sel => {
      if (sel.type === 'unit') Save.removeUnitByUid(sel.uid);
      else Save.removeMaterial(sel.id, 1);
    });

    applyXPToUnit(targetUnitData, totalXP);
    Save.save();
    Save.incStat('feeds_realizados');
    Missions.check();
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) await Online.updateInventory();

    const leveled = targetUnitData.nivel > prevLevel;
    const targetUid = feedTarget;
    closeFeed();
    openDetail(targetUid);
    renderGrid();

    UI.toast(`+${totalXP.toLocaleString()} ${I18N.t('msg_xp_gained')}!${leveled ? ` ${I18N.t('ui_level')} ${targetUnitData.nivel}! 🎉` : ''}`);
  }

  function closeFeed() {
    feedTarget = null;
    feedSelected = [];
    document.getElementById('feed-modal').style.display = 'none';
  }

  return {
    showTab, applyFilters, openDetail, closeDetail,
    openEvolution, closeEvolution, confirmEvolution,
    openFeed, closeFeed, confirmFeed, removeFeedSelected,
    openMaterialDetail, combineMaterial, combineMaxMaterial,
    renderGrid, toggleTeam, renderTeamBar,
    doPrestigeUnit, renderFilterChips,
    renderForgeTab, craftRelic, openRelicEquip, closeRelicEquip, unequipRelicFromUnit,
    openForgePanel, closeForgePanel
  };

  function openForgePanel() {
    const modal = document.getElementById('forge-modal');
    if (!modal) return;
    renderForgeTab();
    modal.style.display = 'flex';
  }

  function closeForgePanel() {
    const modal = document.getElementById('forge-modal');
    if (modal) modal.style.display = 'none';
  }
})();
