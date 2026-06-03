const Inventory = (() => {
  let currentTab = 'units';
  let selectedUnit = null;  // uid
  let feedTarget = null;    // uid
  let feedSelected = [];    // [{type:'unit', uid} | {type:'material', id}]
  let evolutionTarget = null;

  function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const filters = document.getElementById('inv-filters');
    if (filters) filters.style.display = tab === 'evolution' ? 'none' : '';
    if (tab !== 'units') closeDetail();
    renderGrid();
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

    const rarityFilter = parseInt(document.getElementById('filter-rarity')?.value) || null;
    const seriesFilter = document.getElementById('filter-series')?.value || '';

    if (currentTab === 'units') {
      const d = Save.get();
      const ownedIds = new Set();

      d.inventario.unidades.forEach(unit => {
        const char = getCharById(unit.id);
        if (!char || !char.playable) return;
        if (rarityFilter && char.rarity !== rarityFilter) return;
        if (seriesFilter && char.series !== seriesFilter) return;
        ownedIds.add(unit.id);

        const card = document.createElement('div');
        card.className = `inv-card rarity-${char.rarity}`;
        card.innerHTML = `
          <div class="inv-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="inv-name">${char.name}</div>
          <div class="inv-meta">${RARITY_LABELS[char.rarity]} Lv${unit.nivel}</div>`;
        card.addEventListener('click', () => openDetail(unit.uid));
        grid.appendChild(card);
      });

      getPlayable().forEach(char => {
        if (ownedIds.has(char.id)) return;
        if (rarityFilter && char.rarity !== rarityFilter) return;
        if (seriesFilter && char.series !== seriesFilter) return;
        const card = document.createElement('div');
        card.className = `inv-card rarity-${char.rarity} inv-card--locked`;
        card.innerHTML = `
          <div class="inv-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="inv-name">${char.name}</div>
          <div class="inv-meta">${RARITY_LABELS[char.rarity]} Não obtida</div>`;
        grid.appendChild(card);
      });

    } else {
      const materials = Object.values(CHARACTERS)
        .filter(c => !c.playable)
        .sort((a, b) => a.rarity - b.rarity);

      materials.forEach(char => {
        const qty = Save.getMaterialQty(char.id);
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
        <div class="mat-combine-title">🔨 Combinação</div>
        <div class="mat-combine-recipe">
          <div class="mat-comb-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
          <div class="mat-comb-arrow">× ${cost} →</div>
          <div class="mat-comb-icon" style="background:${RARITY_COLORS[nextChar.rarity]}">${charIconInner(nextChar)}</div>
        </div>
        <div class="mat-comb-desc">${cost}× ${char.name} → 1× ${nextChar.name}</div>
        <div class="mat-comb-have">Você tem <b>${qty}</b> — pode combinar <b>${canMake}×</b></div>
        <button class="btn btn-mat-combine${canCombine ? '' : ' btn-disabled'}"
          ${canCombine ? '' : 'disabled'}
          onclick="Inventory.combineMaterial('${matId}')">
          🔨 Combinar ${cost}× → 1× ${nextChar.name}
        </button>
      </div>` : `
      <div class="mat-combine-section">
        <div class="mat-comb-max">✦ Tier máximo — não pode ser combinado</div>
      </div>`;

    content.innerHTML = `
      <div class="detail-header">
        <div class="detail-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div class="detail-name">${char.name}</div>
          <div class="detail-rarity">${RARITY_LABELS[char.rarity]} · ${SERIES_LABELS[char.series] || char.series}</div>
          <div class="detail-qty">Quantidade: ${qty}</div>
        </div>
      </div>
      <div class="detail-stats">
        <div class="stat-row"><span>XP ao usar como feed</span><span>${char.xp_value}</span></div>
      </div>
      ${combineHtml}`;
  }

  function combineMaterial(matId) {
    const char = getCharById(matId);
    if (!char || !char.upgrades_to) return;
    const cost = char.upgrade_cost || 3;
    if (Save.getMaterialQty(matId) < cost) { UI.toast('Materiais insuficientes!'); return; }

    Save.removeMaterial(matId, cost);
    Save.addMaterial(char.upgrades_to, 1);
    Missions.check();

    const nextChar = getCharById(char.upgrades_to);
    UI.toast(`✅ ${nextChar.name} obtido!`);

    renderGrid();
    openMaterialDetail(matId); // atualiza painel com novas qtds
  }

  function renderEvolutionTab() {
    const evoContent = document.getElementById('evolution-content');
    if (!evoContent) return;
    evoContent.innerHTML = '';

    const evolutions = Object.values(CHARACTERS).filter(c => c.evolution);
    if (evolutions.length === 0) {
      evoContent.innerHTML = '<div class="empty-state">Nenhuma evolução disponível.</div>';
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
          ${canEvolve ? '<div class="evo-badge-ready">Pronto!</div>' : ''}
        </div>
        <div class="evo-reqs-section">
          <div class="evo-reqs-title">Materiais necessários</div>
          <div class="evo-reqs">${reqHtml}</div>
        </div>
        <button class="btn btn-evolve${canEvolve ? '' : ' btn-disabled'}"
          onclick="Inventory.openEvolution('${resultChar.id}')"
          ${canEvolve ? '' : 'disabled'}>
          🔮 Evoluir em ${resultChar.name}
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
    const xpNeeded = xpForNextLevel(unitData.nivel);
    const xpPct = unitData.nivel >= 50 ? 100 : Math.round((unitData.xp_atual / xpNeeded) * 100);
    const totalCopies = Save.getUnitQty(char.id);
    const passiveHtml = char.passive
      ? `<div class="passive-tag">⚡ ${char.passive.label}</div>`
      : '';

    const headerHtml = `
      <div class="detail-header">
        <div class="detail-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div class="detail-name">${char.name}</div>
          <div class="detail-rarity">${RARITY_LABELS[char.rarity]} | ${char.series}</div>
          <div class="detail-qty">Cópias: ${totalCopies}</div>
        </div>
      </div>
      ${passiveHtml}`;

    const xpRowHtml = `
      <div class="stat-row"><span>Nível</span><span>${unitData.nivel}/50</span></div>
      <div class="stat-row xp-row">
        <span>XP</span>
        <div class="xp-bar-wrap"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
        <span>${unitData.nivel >= 50 ? 'MAX' : `${unitData.xp_atual}/${xpNeeded}`}</span>
      </div>`;

    if (char.is_farm_unit) {
      const p = char.passive;
      const levelGold = p.base + (unitData.nivel - 1) * (p.perLevel || 0);
      const maxUpgGold = char.upgrades.reduce((s, u) => s + (u.gold_bonus || 0), 0);
      content.innerHTML = `${headerHtml}
        <div class="detail-stats">
          ${xpRowHtml}
          <div class="stat-row"><span>Ouro/Wave (nível atual)</span><span>${levelGold} 💰</span></div>
          <div class="stat-row"><span>Bônus máx de upgrades</span><span>+${maxUpgGold} 💰</span></div>
          <div class="stat-row"><span>Custo Deploy</span><span>${char.deploy_cost} 💰</span></div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-feed" onclick="Inventory.openFeed('${uid}')">🍖 Alimentar</button>
        </div>`;
    } else {
      content.innerHTML = `${headerHtml}
        <div class="detail-stats">
          ${xpRowHtml}
          <div class="stat-row"><span>Dano</span><span>${Math.round(stats.damage)}</span></div>
          <div class="stat-row"><span>Alcance</span><span>${Math.round(stats.range)}</span></div>
          <div class="stat-row"><span>Vel. Ataque</span><span>${stats.attack_speed.toFixed(2)}/s</span></div>
          <div class="stat-row"><span>Tipo</span><span>${stats.type}</span></div>
          <div class="stat-row"><span>Custo Deploy</span><span>${char.deploy_cost} 💰</span></div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-feed" onclick="Inventory.openFeed('${uid}')">🍖 Alimentar</button>
        </div>`;
    }
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
      <h4 style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Materiais necessários</h4>
      <div class="evo-reqs">${reqHtml}</div>
      ${!canEvolve ? '<div class="evo-warning">Materiais insuficientes!</div>' : ''}`;

    const btn = document.getElementById('btn-evolve-confirm');
    btn.disabled = !canEvolve;
    modal.style.display = 'flex';
  }

  function closeEvolution() {
    evolutionTarget = null;
    document.getElementById('evolution-modal').style.display = 'none';
  }

  function confirmEvolution() {
    if (!evolutionTarget) return;
    const char = getCharById(evolutionTarget);
    if (!char || !char.evolution || !checkEvolutionAvailable(evolutionTarget)) return;

    for (const req of char.evolution.requires) {
      const rc = getCharById(req.id);
      if (rc.playable) Save.removeUnit(req.id, req.quantity);
      else Save.removeMaterial(req.id, req.quantity);
    }

    Save.addUnit(evolutionTarget, 1, 0);
    Save.incStat('evolucoes_realizadas');
    if (char.rarity === 5) Save.incStat('unidades_5estrelas_obtidas');
    Missions.check();
    closeEvolution();

    const d = Save.get();
    const newUnit = d.inventario.unidades.filter(u => u.id === evolutionTarget).at(-1);
    showTab('units');
    if (newUnit) openDetail(newUnit.uid);
    UI.toast(`🌟 ${char.name} obtido!`);
  }

  // FEED SYSTEM
  function openFeed(uid) {
    feedTarget = uid;
    feedSelected = [];
    const unitData = Save.getUnitByUid(uid);
    if (!unitData) return;
    const char = getCharById(unitData.id);
    if (!char) return;

    const modal = document.getElementById('feed-modal');
    const targetInfo = document.getElementById('feed-target-info');
    targetInfo.innerHTML = `
      <div class="feed-target-card">
        <div class="feed-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>
          <div>${char.name}</div>
          <div>Lv ${unitData.nivel}/50 | XP: ${unitData.xp_atual}/${xpForNextLevel(unitData.nivel)}</div>
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

    [{ id:'ninja_generico_1' }, { id:'ninja_generico_2' }, { id:'ninja_generico_3' }].forEach(mat => {
      const qty = Save.getMaterialQty(mat.id);
      const selectedCount = feedSelected.filter(s => s.type === 'material' && s.id === mat.id).length;
      const available = qty - selectedCount;
      if (qty <= 0) return;
      const char = getCharById(mat.id);
      const div = document.createElement('div');
      div.className = `feed-mat-item${selectedCount > 0 ? ' selected' : ''}`;
      div.innerHTML = `
        <div class="feed-mat-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>${char.name}</div>
        <div>×${available}</div>
        <div class="feed-mat-xp">+${getFeedXP(mat.id, targetChar)} XP</div>`;
      div.addEventListener('click', () => selectFeedItem('material', mat.id, available > 0));
      grid.appendChild(div);
    });

    const d = Save.get();
    d.inventario.unidades.forEach(unit => {
      if (unit.uid === targetUid) return;
      if (feedSelected.some(s => s.type === 'unit' && s.uid === unit.uid)) return;
      const char = getCharById(unit.id);
      if (!char || !char.playable) return;
      const xpGain = getFeedXP(unit.id, targetChar);
      const div = document.createElement('div');
      div.className = 'feed-mat-item';
      div.innerHTML = `
        <div class="feed-mat-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div>${char.name} <small>Lv${unit.nivel}</small></div>
        <div>×1</div>
        <div class="feed-mat-xp">+${xpGain} XP</div>`;
      div.addEventListener('click', () => selectFeedItem('unit', unit.uid, true));
      grid.appendChild(div);
    });
  }

  function getFeedXP(materialId, targetChar) {
    const matChar = getCharById(materialId);
    if (!matChar) return 0;
    const xpTable = { 0:50, 1:150, 2:400, 3:1000, 4:3000, 5:8000 };
    let xp = xpTable[matChar.rarity] || 0;
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
        label = `${char?.initials||'?'} Lv${u?.nivel||1}`;
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

  function confirmFeed() {
    if (!feedTarget || feedSelected.length === 0) return;
    const targetUnitData = Save.getUnitByUid(feedTarget);
    if (!targetUnitData) return;
    const targetChar = getCharById(targetUnitData.id);

    const totalXP = feedSelected.reduce((sum, sel) => {
      const matId = sel.type === 'unit' ? (Save.getUnitByUid(sel.uid)?.id || null) : sel.id;
      return sum + (matId ? getFeedXP(matId, targetChar) : 0);
    }, 0);

    const prevLevel = targetUnitData.nivel;

    feedSelected.forEach(sel => {
      if (sel.type === 'unit') Save.removeUnitByUid(sel.uid);
      else Save.removeMaterial(sel.id, 1);
    });

    applyXPToUnit(targetUnitData, totalXP);
    Save.save();
    Save.incStat('feeds_realizados');
    Missions.check();

    feedSelected = [];
    const targetUid = feedTarget;
    closeFeed();
    openDetail(targetUid);
    renderGrid();

    const leveled = targetUnitData.nivel > prevLevel;
    UI.toast(`+${totalXP.toLocaleString()} XP ganho!${leveled ? ` Nível ${targetUnitData.nivel}! 🎉` : ''}`);
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
    openMaterialDetail, combineMaterial,
    renderGrid
  };
})();
