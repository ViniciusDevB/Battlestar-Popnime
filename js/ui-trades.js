// js/ui-trades.js — Sistema de Trocas: explorar, criar e aceitar ofertas.
// Suporta múltiplas unidades por oferta (até 3) e picker customizado.

const TradesUI = (() => {
  const MAX_UNITS = 3;

  let _tab      = 'explore';
  let _loading  = false;

  // Cache de trades por ID — evita passar arrays em atributos onclick (problema de encoding HTML com aspas duplas)
  const _myTradesCache     = new Map();   // minhas ofertas
  const _exploreTradesCache = new Map();  // trocas abertas de outros jogadores

  // Estado de criação
  let _cr = {
    offeredUnits: [],  // [{uid, charId, nivel, prestige}]
    wantedIds:    [],  // [charId]
    pickerOpen:   false,
    pickerFilter: '',
  };

  // Estado de aceitação
  let _ac = {
    tradeId:      null,
    wantedIds:    [],  // [charId] — precisa fornecer uma unidade por entrada
    selected:     {},  // { charId: uid } — qual uid foi escolhido para cada charId
    pickerFor:    null,// charId para o qual o picker está aberto agora
    pickerFilter: '',
    offeredNames: '',
  };

  // ── Abrir / Fechar ────────────────────────────────────────────────────────

  function show() {
    const modal = document.getElementById('trades-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    _cr = { offeredUnits:[], wantedIds:[], pickerOpen:false, pickerFilter:'' };
    _ac = { tradeId:null, wantedIds:[], selected:{}, pickerFor:null, pickerFilter:'', offeredNames:'' };
    _load(_tab);
  }

  function close() {
    document.getElementById('trades-modal').style.display = 'none';
  }

  function refresh() {
    const modal = document.getElementById('trades-modal');
    if (modal?.style.display !== 'none') _load(_tab);
  }

  async function setTab(tab) {
    if (_loading) return;
    _tab = tab;
    await _load(tab);
  }

  // ── Loader ────────────────────────────────────────────────────────────────

  async function _load(tab) {
    _loading = true;
    _setContent(_skeletonHTML(tab));

    if (!Online.isLoggedIn()) { _setContent(_guestHTML()); _loading = false; return; }

    const trades = tab === 'explore'
      ? await Online.fetchOpenTrades({})
      : await Online.fetchOpenTrades({ my_offers: true });

    if (tab === 'my') {
      _myTradesCache.clear();
      trades.forEach(t => _myTradesCache.set(t.id, t.offered_unit_uids || []));

      // Cleanup: desbloqueia unidades de trocas que não estão mais abertas
      trades
        .filter(t => t.status !== 'open')
        .forEach(t => (t.offered_unit_uids || []).forEach(uid => Save.unlockUnit(uid)));

      // Reconciliação: desbloqueia qualquer unidade travada que não pertença a nenhuma trade aberta
      // Cobre casos onde o unlock anterior falhou (cache vazio, schema antigo, etc.)
      const openUids = new Set(
        trades.filter(t => t.status === 'open')
              .flatMap(t => t.offered_unit_uids || [])
      );
      Save.get().inventario.unidades
        .filter(u => u.in_trade && !openUids.has(u.uid))
        .forEach(u => Save.unlockUnit(u.uid));
    } else {
      _exploreTradesCache.clear();
      trades.forEach(t => _exploreTradesCache.set(t.id, {
        wantedIds:    t.wanted_unit_ids   || [],
        offeredNames: (t.offered_unit_ids || []).map(id => _charInfo(id).name).join(' + ') || '—',
      }));
    }

    _loading = false;
    _setContent(_boardHTML(tab, trades));
  }

  // ── HTML: board principal ─────────────────────────────────────────────────

  function _boardHTML(tab, trades) {
    const profile = Online.getProfile();
    const tabs = `
      <div class="tr-tabs">
        <button class="tr-tab ${tab==='explore'?'active':''}" onclick="TradesUI.setTab('explore')">🔍 Explorar</button>
        <button class="tr-tab ${tab==='my'?'active':''}"      onclick="TradesUI.setTab('my')">📋 Minhas Ofertas</button>
      </div>`;

    let list = '';
    if (tab === 'explore') {
      const visible = trades.filter(t => (t.offerer?.id || t.offerer_id) !== profile?.id);
      list = visible.length === 0
        ? `<div class="tr-empty">${I18N.t('trade_empty_board')}</div>`
        : visible.map(_exploreCardHTML).join('');
    } else {
      list = trades.length === 0
        ? `<div class="tr-empty">${I18N.t('trade_empty_mine')}</div>`
        : trades.map(_myCardHTML).join('');
    }

    return `
      <div class="modal-header"><h3>🔄 Trocas</h3><button class="modal-close" onclick="TradesUI.close()">✕</button></div>
      ${tabs}
      <div class="tr-list">${list}</div>
      <div class="tr-footer">
        <button class="tr-create-btn" onclick="TradesUI.startCreate()">+ Criar Nova Oferta</button>
      </div>`;
  }

  function _exploreCardHTML(t) {
    const offIds  = t.offered_unit_ids  || [];
    const wantIds = t.wanted_unit_ids   || [];
    const offDots = offIds.map(id => { const c=_charInfo(id); return `<span class="tr-dot" style="background:${c.color}" title="${c.name}"></span>`; }).join('');
    const wantDots= wantIds.length ? wantIds.map(id => { const c=_charInfo(id); return `<span class="tr-dot" style="background:${c.color}" title="${c.name}"></span>`; }).join('') : '<span class="tr-any">Qualquer</span>';
    const offNames= offIds.map(id => _charInfo(id).name).join(' + ') || '—';
    const wantNames=wantIds.length ? wantIds.map(id => _charInfo(id).name).join(' + ') : 'Qualquer';
    const expiry  = _timeLeft(t.expires_at);
    const profile = Online.getProfile();
    const isSelf  = (t.offerer?.id || t.offerer_id) === profile?.id;

    return `
      <div class="tr-card">
        <div class="tr-card-offer">
          <div class="tr-card-side">
            <div class="tr-dots-row">${offDots}</div>
            <div class="tr-card-name">${_esc(offNames)}</div>
            <div class="tr-card-sub">por <b>${_esc(t.offerer?.username || '—')}</b></div>
          </div>
          <div class="tr-card-arrow">⇄</div>
          <div class="tr-card-side tr-card-side--want">
            <div class="tr-dots-row">${wantDots}</div>
            <div class="tr-card-name">${_esc(wantNames)}</div>
          </div>
        </div>
        ${t.message ? `<div class="tr-card-msg">"${_esc(t.message)}"</div>` : ''}
        <div class="tr-card-footer">
          <span class="tr-expiry">⏳ ${expiry}</span>
          ${isSelf
            ? '<span class="tr-own-badge">Sua oferta</span>'
            : `<button class="tr-accept-btn" onclick="TradesUI.startAccept('${t.id}')">Aceitar</button>`
          }
        </div>
      </div>`;
  }

  function _myCardHTML(t) {
    const offIds   = t.offered_unit_ids || [];
    const wantIds  = t.wanted_unit_ids  || [];
    const offNames = offIds.map(id => _charInfo(id).name).join(' + ') || '—';
    const wantNames= wantIds.length ? wantIds.map(id => _charInfo(id).name).join(' + ') : 'Qualquer';
    const offDots  = offIds.map(id => { const c=_charInfo(id); return `<span class="tr-dot" style="background:${c.color}"></span>`; }).join('');
    const STATUS   = { open: I18N.t('trade_status_open'), completed: I18N.t('trade_status_completed'), cancelled: I18N.t('trade_status_cancelled'), expired: I18N.t('trade_status_expired') };

    return `
      <div class="tr-card ${t.status!=='open'?'tr-card--inactive':''}">
        <div class="tr-card-offer">
          <div class="tr-card-side">
            <div class="tr-dots-row">${offDots}</div>
            <div class="tr-card-name">${_esc(offNames)}</div>
            <div class="tr-card-sub">quer: ${_esc(wantNames)}</div>
          </div>
          <span class="tr-status tr-status--${t.status}">${STATUS[t.status]||t.status}</span>
        </div>
        ${t.message ? `<div class="tr-card-msg">"${_esc(t.message)}"</div>` : ''}
        <div class="tr-card-footer">
          <span class="tr-expiry">⏳ ${_timeLeft(t.expires_at)}</span>
          ${t.status==='open' ? `<button class="tr-cancel-btn" onclick="TradesUI.cancelTrade('${t.id}')">Cancelar</button>` : ''}
        </div>
      </div>`;
  }

  // ── Criar oferta ──────────────────────────────────────────────────────────

  function startCreate() {
    _cr = { offeredUnits:[], wantedIds:[], pickerOpen:false, pickerFilter:'' };
    _setContent(_createStep1HTML());
  }

  function _createStep1HTML() {
    const units = Save.get().inventario.unidades
      .filter(u => !u.in_trade)
      .map(u => ({ ...u, char: _charInfo(u.id) }))
      .filter(u => u.char.rarity >= 3)
      .sort((a, b) => b.char.rarity - a.char.rarity || b.nivel - a.nivel);

    if (units.length === 0) {
      return `
        <div class="modal-header"><h3>Criar Oferta</h3><button class="modal-close" onclick="TradesUI.show()">✕</button></div>
        <div class="tr-empty" style="padding:32px">${I18N.t('trade_no_units_available')}</div>
        <div class="tr-confirm-actions"><button class="online-btn-secondary" onclick="TradesUI.show()">${I18N.t('btn_back')}</button></div>`;
    }

    const selIds = new Set(_cr.offeredUnits.map(x => x.uid));
    const rows = units.map(u => {
      const sel = selIds.has(u.uid);
      return `
        <div class="tr-pick-row ${sel?'tr-pick-row--selected':''}" onclick="TradesUI.toggleOffered('${u.uid}','${u.id}',${u.nivel},${u.prestige||0})">
          ${sel ? '<span class="tr-pick-check">✓</span>' : '<span class="tr-pick-check tr-pick-check--empty"></span>'}
          <span class="tr-dot" style="background:${u.char.color}"></span>
          <div>
            <div class="tr-pick-name">${_esc(u.char.name)} Nv.${u.nivel}</div>
            <div class="tr-pick-sub">${u.char.stars}${u.prestige ? ` · P${u.prestige}` : ''}</div>
          </div>
        </div>`;
    }).join('');

    const n = _cr.offeredUnits.length;
    return `
      <div class="modal-header"><h3>Criar Oferta — Passo 1 de 2</h3><button class="modal-close" onclick="TradesUI.show()">✕</button></div>
      <p class="tr-picker-hint">${I18N.t('trade_select_up_to', { max: MAX_UNITS })}</p>
      <div class="tr-pick-list">${rows}</div>
      <div class="tr-confirm-actions">
        <button class="online-btn-secondary" onclick="TradesUI.show()">Cancelar</button>
        <button class="online-btn-primary" ${n===0?'disabled':''} onclick="TradesUI.goToStep2()">
          Continuar (${n} selecionada${n!==1?'s':''}) →
        </button>
      </div>`;
  }

  function toggleOffered(uid, charId, nivel, prestige) {
    const idx = _cr.offeredUnits.findIndex(x => x.uid === uid);
    if (idx >= 0) {
      _cr.offeredUnits.splice(idx, 1);
    } else {
      if (_cr.offeredUnits.length >= MAX_UNITS) { UI.toast(I18N.t('trade_max_units', { max: MAX_UNITS }), 2000); return; }
      _cr.offeredUnits.push({ uid, charId, nivel, prestige });
    }
    _setContent(_createStep1HTML());
  }

  function goToStep2() {
    if (_cr.offeredUnits.length === 0) return;
    _setContent(_createStep2HTML());
  }

  function _createStep2HTML() {
    const previewDots = _cr.offeredUnits.map(u => {
      const c = _charInfo(u.charId);
      return `<span class="tr-dot" style="background:${c.color}" title="${c.name}"></span>`;
    }).join('');
    const previewNames = _cr.offeredUnits.map(u => _charInfo(u.charId).name).join(' + ');

    // Chips de quero em troca
    const wantedChips = _cr.wantedIds.map((cid, i) => {
      const c = _charInfo(cid);
      return `
        <div class="tr-chip">
          <span class="tr-dot tr-dot--sm" style="background:${c.color}"></span>
          ${_esc(c.name)}
          <button onclick="TradesUI.removeWanted(${i})">×</button>
        </div>`;
    }).join('');

    const canAddMore = _cr.wantedIds.length < MAX_UNITS;

    // Lista do picker (se aberto)
    const pickerHTML = _cr.pickerOpen ? `
      <div class="tr-picker-dropdown" id="tr-picker-dd">
        <input class="tr-picker-search" type="text" placeholder="🔍 Buscar personagem..."
               value="${_esc(_cr.pickerFilter)}"
               oninput="TradesUI.filterPicker(this.value)" autofocus>
        <div class="tr-picker-list" id="tr-picker-list">
          ${_pickerListHTML(_cr.pickerFilter)}
        </div>
      </div>` : '';

    return `
      <div class="modal-header"><h3>Criar Oferta — Passo 2 de 2</h3><button class="modal-close" onclick="TradesUI.show()">✕</button></div>

      <div class="tr-create-preview">
        ${previewDots}
        <span class="tr-preview-names">${_esc(previewNames)}</span>
        <button class="tr-preview-edit" onclick="TradesUI.startCreate()">← Editar</button>
      </div>

      <div class="tr-create-body">
        <div class="tr-section-label">${I18N.t('trade_want_in_exchange')} <span class="tr-hint">${I18N.t('trade_optional_max', { max: MAX_UNITS })}</span></div>
        <div class="tr-wanted-area">
          <div class="tr-chips-row">
            ${wantedChips}
            ${canAddMore ? `<button class="tr-add-chip-btn" onclick="TradesUI.togglePicker()">+ Adicionar</button>` : ''}
          </div>
          ${pickerHTML}
        </div>

        <div class="tr-section-label" style="margin-top:14px">${I18N.t('trade_message_label')} <span class="tr-hint">${I18N.t('trade_message_hint')}</span></div>
        <input id="tr-msg-input" class="online-input" type="text" maxlength="120"
               placeholder="Ex: Boa troca! Procuro Itachi" value="${_cr.message||''}">
      </div>

      <div class="tr-confirm-actions">
        <button class="online-btn-secondary" onclick="TradesUI.goToStep2prev()">${I18N.t('btn_back')}</button>
        <button class="online-btn-primary" onclick="TradesUI.submitCreate()">Publicar Oferta</button>
      </div>`;
  }

  function _pickerListHTML(filter) {
    const lower = (filter||'').toLowerCase();
    const already = new Set(_cr.wantedIds);
    const chars = Object.values(typeof CHARACTERS!=='undefined' ? CHARACTERS : {})
      .filter(c => c.playable && c.rarity >= 3)
      .filter(c => !lower || c.name.toLowerCase().includes(lower))
      .sort((a,b) => b.rarity - a.rarity || (a.name||'').localeCompare(b.name||''));

    if (chars.length === 0) return '<div class="tr-picker-empty">Nenhum resultado.</div>';

    return chars.map(c => {
      const color = (typeof RARITY_COLORS!=='undefined' ? RARITY_COLORS[c.rarity] : null) || '#555';
      const stars = (typeof RARITY_LABELS!=='undefined'  ? RARITY_LABELS[c.rarity]  : null) || c.rarity+'★';
      const picked = already.has(c.id);
      return `
        <div class="tr-char-row ${picked?'tr-char-row--picked':''}" onclick="${picked?'':` TradesUI.addWanted('${c.id}');void(0)`}">
          <span class="tr-dot" style="background:${color}"></span>
          <div>
            <div class="tr-char-name">${_esc(c.name)}</div>
            <div class="tr-char-stars">${stars}</div>
          </div>
          ${picked ? '<span class="tr-char-done">✓</span>' : ''}
        </div>`;
    }).join('');
  }

  function togglePicker() {
    _cr.pickerOpen = !_cr.pickerOpen;
    _cr.pickerFilter = '';
    _setContent(_createStep2HTML());
    if (_cr.pickerOpen) setTimeout(() => document.querySelector('.tr-picker-search')?.focus(), 50);
  }

  function filterPicker(val) {
    _cr.pickerFilter = val;
    const list = document.getElementById('tr-picker-list');
    if (list) list.innerHTML = _pickerListHTML(val);
  }

  function addWanted(charId) {
    if (_cr.wantedIds.length >= MAX_UNITS) return;
    if (!_cr.wantedIds.includes(charId)) _cr.wantedIds.push(charId);
    _cr.pickerOpen   = _cr.wantedIds.length < MAX_UNITS;
    _cr.pickerFilter = '';
    _setContent(_createStep2HTML());
  }

  function removeWanted(idx) {
    _cr.wantedIds.splice(idx, 1);
    _setContent(_createStep2HTML());
  }

  function goToStep2prev() { _setContent(_createStep1HTML()); }

  async function submitCreate() {
    _cr.message = document.getElementById('tr-msg-input')?.value?.trim() || '';
    if (_cr.offeredUnits.length === 0) return;

    _setContent(_loadingHTML('Publicando oferta...'));
    const uids = _cr.offeredUnits.map(u => u.uid);
    const ids  = _cr.offeredUnits.map(u => u.charId);
    const result = await Online.createTrade(uids, ids, _cr.wantedIds, _cr.message);

    if (result.error) { UI.toast('❌ ' + result.error, 4000); _setContent(_createStep2HTML()); return; }
    UI.toast(I18N.t('trade_published'), 3000);
    _tab = 'my';
    _load('my');
  }

  // ── Aceitar oferta ────────────────────────────────────────────────────────

  function startAccept(tradeId) {
    const cached = _exploreTradesCache.get(tradeId);
    const wantedIds   = cached?.wantedIds    || [];
    const offeredNames = cached?.offeredNames || '—';

    _ac = {
      tradeId,
      wantedIds,
      selected:     {},
      pickerFor:    null,
      pickerFilter: '',
      offeredNames,
    };

    if (wantedIds.length === 0) {
      _setContent(_confirmFreeHTML(tradeId, offeredNames));
    } else {
      _setContent(_acceptPickerHTML());
    }
  }

  function _confirmFreeHTML(tradeId, offeredNames) {
    return `
      <div class="modal-header"><h3>Confirmar</h3><button class="modal-close" onclick="TradesUI.show()">✕</button></div>
      <div class="tr-confirm-body">
        <div style="font-size:36px;margin-bottom:12px">🎁</div>
        <p>${I18N.t('trade_will_receive_free', { names: _esc(offeredNames) })}</p>
      </div>
      <div class="tr-confirm-actions">
        <button class="online-btn-secondary" onclick="TradesUI.show()">${I18N.t('btn_back')}</button>
        <button class="online-btn-primary" onclick="TradesUI.confirmAccept()">Confirmar</button>
      </div>`;
  }

  function _acceptPickerHTML() {
    const rows = _ac.wantedIds.map((charId, i) => {
      const c       = _charInfo(charId);
      const matches = Save.get().inventario.unidades.filter(u => u.id === charId && !u.in_trade);
      const selUid  = _ac.selected[charId];
      const isOpen  = _ac.pickerFor === charId;

      const optRows = matches.length === 0
        ? `<div class="tr-acc-no-unit">${I18N.t('trade_no_unit', { name: c.name })}</div>`
        : matches.map(u => `
            <div class="tr-pick-row ${selUid===u.uid?'tr-pick-row--selected':''}"
                 onclick="TradesUI.selectAcceptUnit('${charId}','${u.uid}')">
              ${selUid===u.uid?'<span class="tr-pick-check">✓</span>':'<span class="tr-pick-check tr-pick-check--empty"></span>'}
              <span class="tr-dot" style="background:${c.color}"></span>
              <div>
                <div class="tr-pick-name">${_esc(c.name)} Nv.${u.nivel}</div>
                <div class="tr-pick-sub">${c.stars}${u.prestige?` · P${u.prestige}`:''}</div>
              </div>
            </div>`).join('');

      return `
        <div class="tr-acc-group">
          <div class="tr-acc-label" onclick="TradesUI.toggleAccPicker('${charId}')">
            <span class="tr-dot" style="background:${c.color}"></span>
            <b>${_esc(c.name)}</b>
            ${selUid ? `<span class="tr-acc-chosen">Escolhido ✓</span>` : '<span class="tr-acc-pick-hint">Toque para escolher →</span>'}
          </div>
          ${isOpen ? `<div class="tr-acc-options">${optRows}</div>` : ''}
        </div>`;
    }).join('');

    const allChosen = _ac.wantedIds.every(id => _ac.selected[id]);

    return `
      <div class="modal-header"><h3>Escolha o que entregar</h3><button class="modal-close" onclick="TradesUI.show()">✕</button></div>
      <p class="tr-picker-hint">${I18N.t('trade_will_receive_select', { names: _esc(_ac.offeredNames) })}</p>
      <div class="tr-acc-list">${rows}</div>
      <div class="tr-confirm-actions">
        <button class="online-btn-secondary" onclick="TradesUI.show()">${I18N.t('btn_back')}</button>
        <button class="online-btn-primary" ${allChosen?'':'disabled'} onclick="TradesUI.confirmAccept()">
          Confirmar Troca
        </button>
      </div>`;
  }

  function toggleAccPicker(charId) {
    _ac.pickerFor = _ac.pickerFor === charId ? null : charId;
    _setContent(_acceptPickerHTML());
  }

  function selectAcceptUnit(charId, uid) {
    _ac.selected[charId] = uid;
    _ac.pickerFor = null;
    _setContent(_acceptPickerHTML());
  }

  async function confirmAccept() {
    const acceptedUids = _ac.wantedIds.length > 0
      ? _ac.wantedIds.map(id => _ac.selected[id]).filter(Boolean)
      : [];

    _setContent(_loadingHTML('Transferindo unidades...'));
    const result = await Online.acceptTrade(_ac.tradeId, acceptedUids);
    if (result.error) { UI.toast('❌ ' + result.error, 4000); _load(_tab); return; }

    _setContent(`
      <div style="text-align:center;padding:40px 20px">
        <div style="font-size:42px;margin-bottom:12px">🎉</div>
        <div style="font-size:16px;font-weight:800;color:var(--t1);margin-bottom:8px">${I18N.t('trade_complete_title')}</div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:24px">${I18N.t('trade_complete_msg')}</div>
        <button class="online-btn-primary" onclick="TradesUI.show()">Ver Trocas</button>
      </div>`);
  }

  // ── Cancelar ──────────────────────────────────────────────────────────────

  async function cancelTrade(tradeId) {
    // Usa o cache local — evita problema de encoding de arrays em atributos HTML
    const uids = _myTradesCache.get(tradeId) || [];
    if (!window.confirm('Cancelar esta oferta?')) return;
    const result = await Online.cancelTrade(tradeId, uids);
    if (result.error) { UI.toast('❌ ' + result.error, 3000); return; }
    UI.toast(I18N.t('trade_cancelled'), 2000);
    _load('my');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _charInfo(charId) {
    const c = typeof CHARACTERS !== 'undefined' ? CHARACTERS[charId] : null;
    const r = c?.rarity ?? 0;
    return {
      name:  c?.name  || charId || '?',
      rarity: r,
      color: (typeof RARITY_COLORS !== 'undefined' ? RARITY_COLORS[r]  : null) || '#555',
      stars: (typeof RARITY_LABELS !== 'undefined'  ? RARITY_LABELS[r] : null) || r+'★',
    };
  }

  function _timeLeft(expiresAt) {
    if (!expiresAt) return '—';
    const ms = new Date(expiresAt) - Date.now();
    if (ms <= 0) return 'Expirada';
    const h = Math.floor(ms / 3_600_000), d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h`;
    return `${Math.ceil(ms / 60_000)}min`;
  }

  function _loadingHTML(msg='Carregando...') {
    return `
      <div class="modal-header"><h3>🔄 Trocas</h3><button class="modal-close" onclick="TradesUI.close()">✕</button></div>
      <div class="tr-empty" style="padding:40px"><div style="font-size:24px;margin-bottom:8px">⏳</div>${msg}</div>`;
  }

  function _skeletonHTML(tab) {
    return `
      <div class="modal-header"><h3>🔄 Trocas</h3><button class="modal-close" onclick="TradesUI.close()">✕</button></div>
      <div class="tr-tabs">
        <button class="tr-tab ${tab==='explore'?'active':''}" onclick="TradesUI.setTab('explore')">🔍 Explorar</button>
        <button class="tr-tab ${tab==='my'?'active':''}" onclick="TradesUI.setTab('my')">📋 Minhas Ofertas</button>
      </div>
      <div class="lb-skeleton" style="padding:12px 16px">
        ${Array.from({length:4},(_,i) => `<div class="lb-skel-row" style="height:72px;animation-delay:${i*80}ms"></div>`).join('')}
      </div>`;
  }

  function _guestHTML() {
    return `
      <div class="modal-header"><h3>🔄 Trocas</h3><button class="modal-close" onclick="TradesUI.close()">✕</button></div>
      <div class="tr-empty" style="padding:40px">
        <div style="font-size:32px;margin-bottom:12px">🔒</div>
        <div style="font-weight:700;margin-bottom:12px">Entre na conta para acessar as Trocas</div>
        <button class="online-btn-primary" style="width:auto;padding:10px 24px" onclick="TradesUI.close();OnlineUI.show()">Entrar</button>
      </div>`;
  }

  function _setContent(html) {
    const el = document.getElementById('tr-modal-content');
    if (el) el.innerHTML = html;
  }

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    show, close, refresh, setTab,
    toggleOffered, goToStep2, goToStep2prev,
    togglePicker, filterPicker, addWanted, removeWanted,
    submitCreate,
    startAccept, toggleAccPicker, selectAcceptUnit, confirmAccept,
    cancelTrade,
    startCreate,
  };
})();
