// js/ui-missions-online.js — Modal unificado de Missões (Diárias | Conquistas | Comunidade)
const MissionsUI = (() => {
  let _activeTab   = 'daily';
  let _mission     = null;
  let _contrib     = null;
  let _upcoming    = [];
  let _upcomingIdx = 0;
  let _countdownId = null;

  // ── Helpers genéricos ─────────────────────────────────────────────────────────

  function _fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.', ',') + 'K';
    return n.toLocaleString('pt-BR');
  }

  function _fmtTimeLeft(endsAt) {
    const ms = new Date(endsAt) - Date.now();
    if (ms <= 0) return I18N.t('ms_time_ended');
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function _fmtUntilReset() {
    const now      = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = tomorrow - now;
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  const _goalLabel    = () => ({ kills: I18N.t('ms_target_kills'), damage: I18N.t('ms_target_dmg'), stages_cleared: I18N.t('ms_target_stages'), pulls: I18N.t('ms_target_pulls') });
  const _contribLabel = () => ({ kills: I18N.t('ms_type_kills'), damage: I18N.t('ms_type_dmg'), stages_cleared: I18N.t('ms_type_stages'), pulls: I18N.t('ms_type_pulls') });

  // ── Shell ─────────────────────────────────────────────────────────────────────

  function _shellHTML() {
    const tabs = [
      { key: 'daily',     label: I18N.t('ms_tab_daily')     },
      { key: 'fixed',     label: I18N.t('ms_tab_fixed')     },
      { key: 'community', label: I18N.t('ms_tab_community') },
    ];
    return `
      <div class="ms-header">
        <h3>${I18N.t('ms_title_missions')}</h3>
        <button class="modal-close" onclick="MissionsUI.close()">✕</button>
      </div>
      <div class="ms-tabs">
        ${tabs.map(t => `<button class="ms-tab ${_activeTab === t.key ? 'active' : ''}"
          onclick="MissionsUI.setTab('${t.key}')">${t.label}</button>`).join('')}
      </div>
      <div id="ms-tab-content"></div>`;
  }

  // ── Game Juice ────────────────────────────────────────────────────────────────

  function _burstParticles(triggerEl, reward) {
    const rect = triggerEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    const symbols = [];
    if (reward?.gems)    for (let i = 0; i < 4; i++) symbols.push('💎');
    if (reward?.tickets) for (let i = 0; i < 3; i++) symbols.push('🎫');
    if (!symbols.length) for (let i = 0; i < 6; i++) symbols.push('✨');

    const count = Math.min(14, symbols.length + 4);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'ms-particle';
      p.textContent = symbols[i % symbols.length];
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist  = 55 + Math.random() * 65;
      p.style.left = cx + 'px';
      p.style.top  = cy + 'px';
      p.style.setProperty('--dx',  Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy',  Math.sin(angle) * dist + 'px');
      p.style.setProperty('--rot', Math.random() * 540 - 270 + 'deg');
      p.style.animationDelay = (i * 25) + 'ms';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  }

  function _flashItem(itemEl) {
    itemEl.classList.add('mission-flash');
    setTimeout(() => itemEl.classList.remove('mission-flash'), 500);
  }

  function _exitItem(itemEl, cb) {
    itemEl.classList.add('mission-exit');
    setTimeout(() => { itemEl.remove(); if (cb) cb(); }, 420);
  }

  function _bumpCurrency() {
    const gems = document.getElementById('hud-gems') || document.querySelector('.currency-gems');
    const tick = document.getElementById('hud-tickets') || document.querySelector('.currency-tickets');
    [gems, tick].forEach(el => {
      if (!el) return;
      el.classList.remove('ms-currency-bump');
      void el.offsetWidth;
      el.classList.add('ms-currency-bump');
      setTimeout(() => el.classList.remove('ms-currency-bump'), 500);
    });
  }

  // ── Aba: Diárias ──────────────────────────────────────────────────────────────

  function _missionItemHTML(m, d, opts = {}) {
    const prog = Missions.getProgress(m, d);
    const pct  = Math.min(100, (prog / m.target) * 100);
    const reward = Missions.rewardLabel(m.reward);

    if (opts.pending) {
      return `<div class="mission-item mission-pending" id="ms-item-${m.id}">
        <div class="mission-label">⚡ ${m.label}</div>
        <div class="mission-progress-bar"><div class="mission-fill mission-fill--full"></div></div>
        <div class="mission-meta">
          <span>${_fmt(m.target)} / ${_fmt(m.target)}</span>
          <span class="mission-reward">${reward}</span>
        </div>
        <button class="mission-claim-btn" onclick="MissionsUI.${opts.claimFn}('${m.id}', this)">
          ${I18N.t('ms_claim_btn')}
        </button>
      </div>`;
    }

    if (opts.done) {
      return `<div class="mission-item mission-done">
        <div class="mission-label">✅ ${m.label}</div>
        <div class="mission-progress-bar"><div class="mission-fill" style="width:100%"></div></div>
        <div class="mission-meta">
          <span>${_fmt(m.target)} / ${_fmt(m.target)}</span>
          <span class="mission-reward mission-reward--claimed">${I18N.t('ms_claimed_label')}</span>
        </div>
      </div>`;
    }

    return `<div class="mission-item">
      <div class="mission-label">${m.label}</div>
      <div class="mission-progress-bar"><div class="mission-fill" style="width:${pct}%"></div></div>
      <div class="mission-meta">
        <span>${_fmt(prog)} / ${_fmt(m.target)}</span>
        <span class="mission-reward">${reward}</span>
      </div>
    </div>`;
  }

  function _dailyHTML() {
    Missions.initDailies();
    const d  = Save.get();
    const dd = d.missoes_diarias;
    if (!dd) return `<div class="ms-loading">${I18N.t('ms_loading')}</div>`;

    const claimed  = new Set(dd.completas);
    const pending  = new Set(dd.pendentes || []);

    const pendingItems = dd.ativas
      .filter(id => pending.has(id))
      .map(id => { const m = getMissionById(id); return m ? _missionItemHTML(m, d, { pending: true, claimFn: 'claimDailyUI' }) : ''; })
      .join('');

    const activeItems = dd.ativas
      .filter(id => !pending.has(id) && !claimed.has(id))
      .map(id => { const m = getMissionById(id); return m ? _missionItemHTML(m, d) : ''; })
      .join('');

    const allDone = dd.ativas.every(id => claimed.has(id));
    const hasPending = pending.size > 0;

    return `
      <div class="ms-daily-header">
        <span class="ms-daily-reset">${I18N.t('ms_daily_reset', { time: _fmtUntilReset() })}</span>
        ${allDone ? `<span class="ms-daily-complete">${I18N.t('ms_daily_complete')}</span>` : ''}
        ${hasPending && !allDone ? `<span class="ms-daily-pending-hint">${I18N.t('ms_pending_hint', { n: pending.size })}</span>` : ''}
      </div>
      <div class="ms-local-list">
        ${pendingItems}
        ${activeItems}
        ${!pendingItems && !activeItems ? `<div class="ms-empty"><div class="ms-empty-icon">🎉</div><p>${I18N.t('ms_daily_complete')}</p></div>` : ''}
      </div>`;
  }

  // ── Aba: Conquistas ───────────────────────────────────────────────────────────

  function _fixedHTML() {
    const d       = Save.get();
    const pending = d.missoes_conquistas_pendentes || [];
    const total   = (MISSIONS_LIST || []).length;
    const claimed = (d.missoes_completas || []).length;

    const pendingItems = pending.map(id => {
      const m = getMissionById(id);
      return m ? _missionItemHTML(m, d, { pending: true, claimFn: 'claimFixedUI' }) : '';
    }).join('');

    const activeItems = (d.missoes_ativas || []).map(id => {
      const m = getMissionById(id);
      return m ? _missionItemHTML(m, d) : '';
    }).join('');

    const counterHTML = `<div class="ms-fixed-counter">
      <span class="ms-fixed-counter-icon">🏆</span>
      <span>${I18N.t('ms_fixed_counter', { done: claimed, total })}</span>
    </div>`;

    if (!pendingItems && !activeItems) {
      return `<div class="ms-empty">
        <div class="ms-empty-icon">🏆</div>
        <p>${I18N.t('ms_fixed_all_unlocked')}</p>
      </div>`;
    }

    return `<div class="ms-local-list" id="missions-local-list">
      ${pendingItems}
      ${activeItems}
      ${counterHTML}
    </div>`;
  }

  // ── Aba: Comunidade ───────────────────────────────────────────────────────────

  function _offlineHTML() {
    return `<div class="ms-empty">
      <div class="ms-empty-icon">🔒</div>
      <p>${I18N.t('ms_comm_offline')}</p>
      <button class="btn btn-primary ms-action-btn"
        onclick="MissionsUI.close();OnlineUI.show()">${I18N.t('ms_comm_login_btn')}</button>
    </div>`;
  }

  function _noMissionHTML() {
    return `<div class="ms-empty">
      <div class="ms-empty-icon">🏁</div>
      <p>${I18N.t('ms_comm_no_mission')}</p>
      <p class="ms-empty-sub">${I18N.t('ms_comm_no_mission_sub')}</p>
    </div>`;
  }

  function _communityBodyHTML() {
    const m   = _mission;
    const pct = Math.min(100, Math.round((m.current_value / m.goal_value) * 100));

    const contribPart = _contrib
      ? `<div class="ms-contrib">${I18N.t('ms_comm_contrib', { val: _fmt(_contrib.value), type: _contribLabel()[m.goal_type] || m.goal_type })}</div>`
      : (Online.isLoggedIn()
          ? `<div class="ms-contrib ms-contrib--none">${I18N.t('ms_comm_contrib_none')}</div>`
          : '');

    let actionPart = '';
    if (m.completed) {
      if (_contrib && !_contrib.claimed_at) {
        actionPart = `<button class="btn ms-claim-btn" onclick="MissionsUI.claim('${m.id}')">${I18N.t('ms_claim_btn')}</button>`;
      } else if (_contrib?.claimed_at) {
        actionPart = `<div class="ms-claimed-badge">${I18N.t('ms_claim_badge')}</div>`;
      } else if (Online.isLoggedIn()) {
        actionPart = `<div class="ms-contrib ms-contrib--none">${I18N.t('ms_comm_contrib_offline')}</div>`;
      }
    }

    const rewardUnits = (m.reward_units || []).map(id => {
      if (id === '__random_5star__')      return `<span class="ms-reward-unit ms-reward-random">${I18N.t('ms_reward_random')}</span>`;
      if (id === '__random_event_unit__') return `<span class="ms-reward-unit ms-reward-event">${I18N.t('ms_reward_event')}</span>`;
      const char = typeof getCharById !== 'undefined' && getCharById(id);
      return `<span class="ms-reward-unit">${char ? char.name : id}</span>`;
    }).join('');

    const rewardLine = (m.reward_gems > 0 || rewardUnits)
      ? `<div class="ms-rewards">
           <span class="ms-reward-label">${I18N.t('ms_reward_label')}</span>
           ${m.reward_gems > 0 ? `<span class="ms-reward-gem">💎 ${m.reward_gems}</span>` : ''}
           ${rewardUnits}
         </div>` : '';

    return `
      ${m.completed ? `<div class="ms-completed-banner">${I18N.t('ms_community_goal_reached')}</div>` : ''}
      <div class="ms-body">
        <div class="ms-update-badge">${I18N.t('ms_update_badge')}</div>
        <div class="ms-title">${I18N.t('online_mission_' + m.id + '_title', {}, m.title)}</div>
        ${m.description ? `<div class="ms-desc">${I18N.t('online_mission_' + m.id + '_desc', {}, m.description)}</div>` : ''}
        <div class="ms-progress-wrap">
          <div class="ms-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="ms-progress-labels">
          <span>${_fmt(m.current_value)} / ${_fmt(m.goal_value)} ${_goalLabel()[m.goal_type] || m.goal_type}</span>
          <span class="ms-time-left" id="ms-time-left">${I18N.t('ms_time_left', { time: _fmtTimeLeft(m.ends_at) })}</span>
        </div>
        ${rewardLine}
        ${contribPart}
        ${actionPart}
        <button class="btn ms-refresh-btn" onclick="MissionsUI.refresh()">${I18N.t('ms_refresh_btn')}</button>
      </div>`;
  }

  // ── Aba: Comunidade — Cards Em Breve ──────────────────────────────────────────

  function _fmtCountdown(startsAt) {
    const ms = new Date(startsAt) - Date.now();
    const d  = Math.ceil(ms / 86400000);
    if (d > 1)  return I18N.t('ms_time_days', { n: d });
    if (d === 1) return I18N.t('ms_time_1day');
    const h = Math.ceil(ms / 3600000);
    if (h > 1) return I18N.t('ms_time_hours', { n: h });
    return I18N.t('ms_time_soon');
  }

  function _upcomingCardHTML(m) {
    const isNemesis = (m.reward_units || []).includes('nemesis');

    const rewardPills = (m.reward_units || []).map(id => {
      if (id === 'nemesis')               return `<span class="ms-reward-unit ms-upcoming-reward--nemesis">${I18N.t('ms_reward_nemesis')}</span>`;
      if (id === '__random_event_unit__') return `<span class="ms-reward-unit ms-reward-event">${I18N.t('ms_reward_event')}</span>`;
      if (id === '__random_5star__')      return `<span class="ms-reward-unit ms-reward-random">${I18N.t('ms_reward_random')}</span>`;
      const c = typeof getCharById !== 'undefined' && getCharById(id);
      return `<span class="ms-reward-unit">${c ? c.name : id}</span>`;
    }).join('');

    const gemsPill = m.reward_gems > 0
      ? `<span class="ms-reward-gem">${I18N.t('ms_gems_reward', { gems: m.reward_gems })}</span>` : '';

    return `
      <div class="ms-upcoming-card${isNemesis ? ' ms-upcoming-card--nemesis' : ''}">
        <div class="ms-upcoming-top">
          <span class="ms-update-badge ms-update-badge--tbd">${I18N.t('ms_upcoming_next_update')}</span>
          <span class="ms-upcoming-badge${isNemesis ? ' ms-upcoming-badge--nemesis' : ''}">${I18N.t('ms_upcoming_soon')}</span>
        </div>
        <div class="ms-upcoming-title">${isNemesis ? '🧟 ' : ''}${I18N.t('online_mission_' + m.id + '_title', {}, m.title)}</div>
        <div class="ms-upcoming-desc">${I18N.t('online_mission_' + m.id + '_desc', {}, m.description)}</div>
        <div class="ms-upcoming-rewards">${rewardPills}${gemsPill}</div>
        <div class="ms-upcoming-countdown">${I18N.t('ms_upcoming_starts', { time: _fmtCountdown(m.starts_at) })}</div>
      </div>`;
  }

  function _upcomingInnerHTML(upcoming) {
    if (!upcoming || !upcoming.length) return '';
    const total = upcoming.length;
    const idx   = Math.max(0, Math.min(_upcomingIdx, total - 1));
    const card  = _upcomingCardHTML(upcoming[idx]);

    const dots = total > 1
      ? `<div class="ms-upcoming-dots">${upcoming.map((_, i) =>
          `<span class="ms-upcoming-dot${i === idx ? ' ms-upcoming-dot--active' : ''}"></span>`
        ).join('')}</div>`
      : '';

    const nav = total > 1 ? `
      <div class="ms-upcoming-nav">
        <button class="ms-upcoming-arrow${idx === 0 ? ' ms-upcoming-arrow--disabled' : ''}"
          onclick="MissionsUI.prevUpcoming()">&#8249;</button>
        ${dots}
        <button class="ms-upcoming-arrow${idx === total - 1 ? ' ms-upcoming-arrow--disabled' : ''}"
          onclick="MissionsUI.nextUpcoming()">&#8250;</button>
      </div>` : '';

    return `
      <div class="ms-upcoming-header">${I18N.t('ms_upcoming_title')}</div>
      ${card}
      ${nav}`;
  }

  function _upcomingHTML(upcoming) {
    if (!upcoming || !upcoming.length) return '';
    return `<div class="ms-upcoming-section" id="ms-upcoming-wrap">${_upcomingInnerHTML(upcoming)}</div>`;
  }

  function _refreshUpcoming() {
    const el = document.getElementById('ms-upcoming-wrap');
    if (el) el.innerHTML = _upcomingInnerHTML(_upcoming);
  }

  function prevUpcoming() {
    if (_upcomingIdx > 0) { _upcomingIdx--; _refreshUpcoming(); }
  }

  function nextUpcoming() {
    if (_upcomingIdx < _upcoming.length - 1) { _upcomingIdx++; _refreshUpcoming(); }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  function _getModal()   { return document.getElementById('missions-modal'); }
  function _getContent() { return document.getElementById('missions-modal-content'); }
  function _getTabEl()   { return document.getElementById('ms-tab-content'); }

  async function _renderTab() {
    const tc = _getTabEl();
    if (!tc) return;

    if (_activeTab === 'daily') { tc.innerHTML = _dailyHTML(); return; }
    if (_activeTab === 'fixed') { tc.innerHTML = _fixedHTML(); return; }

    tc.innerHTML = `<div class="ms-loading">${I18N.t('ms_loading')}</div>`;
    if (!Online.isLoggedIn()) { tc.innerHTML = _offlineHTML(); return; }
    _upcomingIdx = 0;
    [_mission, _upcoming] = await Promise.all([
      Online.fetchActiveMission(),
      Online.fetchUpcomingMissions(),
    ]);
    _contrib = _mission ? await Online.fetchMissionContribution(_mission.id) : null;
    tc.innerHTML = (_mission ? _communityBodyHTML() : _noMissionHTML()) + _upcomingHTML(_upcoming);
    _startCountdown();
  }

  function _startCountdown() {
    if (_countdownId) clearInterval(_countdownId);
    if (!_mission || _mission.completed) return;
    _countdownId = setInterval(() => {
      const el = document.getElementById('ms-time-left');
      if (el) el.textContent = `⏱ ${_fmtTimeLeft(_mission.ends_at)}`;
    }, 30000);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  async function show() {
    const modal = _getModal();
    if (!modal) return;
    modal.style.display = 'flex';
    _getContent().innerHTML = _shellHTML();
    await _renderTab();
  }

  function close() {
    const modal = _getModal();
    if (modal) modal.style.display = 'none';
    if (_countdownId) { clearInterval(_countdownId); _countdownId = null; }
  }

  async function setTab(tab) {
    if (_activeTab === tab) return;
    _activeTab = tab;
    _getContent().innerHTML = _shellHTML();
    await _renderTab();
  }

  async function refresh() {
    if (_activeTab === 'community') {
      const tc = _getTabEl();
      if (!tc) return;
      if (!Online.isLoggedIn()) { tc.innerHTML = _offlineHTML(); return; }
      tc.innerHTML = `<div class="ms-loading">${I18N.t('ms_loading')}</div>`;
      [_mission, _upcoming] = await Promise.all([
        Online.fetchActiveMission(),
        Online.fetchUpcomingMissions(),
      ]);
      _contrib = _mission ? await Online.fetchMissionContribution(_mission.id) : null;
      tc.innerHTML = (_mission ? _communityBodyHTML() : _noMissionHTML()) + _upcomingHTML(_upcoming);
      _startCountdown();
    } else {
      const tc = _getTabEl();
      if (tc) tc.innerHTML = _activeTab === 'daily' ? _dailyHTML() : _fixedHTML();
    }
  }

  function onMissionUpdate(updatedMission) {
    _mission = updatedMission;
    if (_activeTab !== 'community') return;
    const modal = _getModal();
    if (!modal || modal.style.display === 'none') return;
    const tc = _getTabEl();
    if (!tc) return;
    if (updatedMission.completed && Online.isLoggedIn()) {
      Online.fetchMissionContribution(updatedMission.id).then(c => {
        _contrib = c;
        tc.innerHTML = _communityBodyHTML();
      });
    } else {
      tc.innerHTML = _communityBodyHTML();
    }
  }

  // ── Claim: diária ─────────────────────────────────────────────────────────────

  function claimDailyUI(missionId, btnEl) {
    const itemEl = document.getElementById(`ms-item-${missionId}`);
    if (!itemEl) return;

    btnEl.disabled = true;
    btnEl.textContent = I18N.t('ms_claiming');

    const mission = Missions.claimDaily(missionId);
    if (!mission) { btnEl.disabled = false; btnEl.textContent = I18N.t('ms_claim_btn'); return; }

    _burstParticles(itemEl, mission.reward);
    _flashItem(itemEl);

    setTimeout(() => {
      _exitItem(itemEl, () => {
        if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
        _bumpCurrency();
        UI.toast(I18N.t('ms_claimed_reward_toast', {
          label:  mission.label,
          reward: Missions.rewardLabel(mission.reward),
        }), 4000);
        Missions.updateBadge();
        // Re-render apenas se nenhum pending restante (para atualizar o header)
        const dd = Save.get().missoes_diarias;
        if (!(dd?.pendentes?.length)) {
          const tc = _getTabEl();
          if (tc) tc.innerHTML = _dailyHTML();
        }
      });
    }, 80);
  }

  // ── Claim: conquista ──────────────────────────────────────────────────────────

  function claimFixedUI(missionId, btnEl) {
    const itemEl = document.getElementById(`ms-item-${missionId}`);
    if (!itemEl) return;

    btnEl.disabled = true;
    btnEl.textContent = I18N.t('ms_claiming');

    const mission = Missions.claimFixed(missionId);
    if (!mission) { btnEl.disabled = false; btnEl.textContent = I18N.t('ms_claim_btn'); return; }

    _burstParticles(itemEl, mission.reward);
    _flashItem(itemEl);

    setTimeout(() => {
      _exitItem(itemEl, () => {
        if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
        _bumpCurrency();
        UI.toast(I18N.t('ms_claimed_reward_toast', {
          label:  mission.label,
          reward: Missions.rewardLabel(mission.reward),
        }), 4000);
        Missions.updateBadge();
        // Adiciona nova missão ativa ao final da lista
        const tc = _getTabEl();
        if (tc) tc.innerHTML = _fixedHTML();
      });
    }, 80);
  }

  // ── Claim: comunidade (mantido com game juice) ────────────────────────────────

  async function claim(missionId) {
    const btn = document.querySelector('.ms-claim-btn');
    if (btn) { btn.disabled = true; btn.textContent = I18N.t('ms_claiming'); }

    const result = await Online.claimMissionReward(missionId);
    if (result.ok) {
      if (btn) _burstParticles(btn, { gems: _mission?.reward_gems });

      const hasUnitRewards = (_mission?.reward_units || []).length > 0;
      (_mission?.reward_units || []).forEach(id => {
        if (id === '__random_5star__') {
          _grantRandom5Star();
        } else if (id === '__random_event_unit__') {
          _grantRandomEventUnit();
        } else if (typeof Save !== 'undefined') {
          Save.addUnit(id);
        }
      });
      if (hasUnitRewards && typeof Online !== 'undefined' && Online.isLoggedIn()) {
        Online.updateInventory();
      }
      if (typeof UI !== 'undefined') {
        _bumpCurrency();
        UI.toast(I18N.t('ms_claimed_toast'), 3000);
      }
      await refresh();
    } else {
      const msgs = {
        already_claimed:       I18N.t('ms_claim_err_already'),
        no_contribution:       I18N.t('ms_claim_err_no_contrib'),
        mission_not_completed: I18N.t('ms_claim_err_not_done'),
        not_logged_in:         I18N.t('ms_claim_err_login'),
      };
      if (typeof UI !== 'undefined') UI.toast('❌ ' + (msgs[result.error] || result.error), 3000);
      if (btn) { btn.disabled = false; btn.textContent = I18N.t('ms_claim_btn'); }
    }
  }

  function _grantRandom5Star() {
    if (typeof Save === 'undefined') return;
    const pool = typeof getPlayable === 'function'
      ? getPlayable().filter(c => c.rarity === 5)
      : Object.values(typeof CHARACTERS !== 'undefined' ? CHARACTERS : {}).filter(c => c.playable && c.rarity === 5);
    if (!pool.length) return;
    const char = pool[Math.floor(Math.random() * pool.length)];
    Save.addUnit(char.id);
    if (typeof UI !== 'undefined') {
      setTimeout(() => UI.toast(I18N.t('ms_grant_5star', { name: char.name }), 6000), 500);
    }
  }

  function _grantRandomEventUnit() {
    if (typeof Save === 'undefined') return;
    const all  = typeof CHARACTERS !== 'undefined' ? CHARACTERS : {};
    const pool = Object.values(all).filter(c => c.playable && c.event_exclusive && c.id !== 'nemesis');
    if (!pool.length) return;
    const char = pool[Math.floor(Math.random() * pool.length)];
    Save.addUnit(char.id);
    if (typeof UI !== 'undefined') {
      setTimeout(() => UI.toast(I18N.t('ms_grant_event', { name: char.name }), 6000), 500);
    }
  }

  return {
    show, close, setTab, refresh, onMissionUpdate,
    claim, claimDailyUI, claimFixedUI,
    prevUpcoming, nextUpcoming,
  };
})();
