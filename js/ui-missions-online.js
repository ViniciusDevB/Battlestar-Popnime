// js/ui-missions-online.js — Modal unificado de Missões (Pessoais + Comunidade)
const MissionsUI = (() => {
  let _activeTab   = 'local';
  let _mission     = null;
  let _contrib     = null;
  let _countdownId = null;

  // ── Helpers (local) ──────────────────────────────────────────────────────────

  function _rewardLabel(reward) {
    const parts = [];
    if (reward.tickets) parts.push(`+${reward.tickets} 🎫`);
    if (reward.gems)    parts.push(`+${reward.gems} 💎`);
    if (reward.materials) reward.materials.forEach(m => parts.push(`+${m.qty || 1}× ${m.id}`));
    return parts.join(' ');
  }

  // ── Helpers (community) ───────────────────────────────────────────────────────

  function _fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.', ',') + 'K';
    return n.toLocaleString('pt-BR');
  }

  function _fmtTimeLeft(endsAt) {
    const ms = new Date(endsAt) - Date.now();
    if (ms <= 0) return 'Encerrado';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const _goalLabel = {
    kills: 'inimigos derrotados', damage: 'de dano total',
    stages_cleared: 'fases concluídas', pulls: 'invocações',
  };
  const _contribLabel = {
    kills: 'kills', damage: 'dano', stages_cleared: 'fases', pulls: 'pulls',
  };

  // ── HTML: shell com abas ──────────────────────────────────────────────────────

  function _shellHTML() {
    return `
      <div class="ms-header">
        <h3>📋 Missões</h3>
        <button class="modal-close" onclick="MissionsUI.close()">✕</button>
      </div>
      <div class="ms-tabs">
        <button class="ms-tab ${_activeTab === 'local' ? 'active' : ''}"
          onclick="MissionsUI.setTab('local')">Pessoais</button>
        <button class="ms-tab ${_activeTab === 'community' ? 'active' : ''}"
          onclick="MissionsUI.setTab('community')">Comunidade</button>
      </div>
      <div id="ms-tab-content"></div>`;
  }

  // ── HTML: aba Pessoais ────────────────────────────────────────────────────────

  function _localHTML() {
    const d      = Save.get();
    const active = d.missoes_ativas || [];
    if (active.length === 0) {
      return `<div class="ms-empty">
        <div class="ms-empty-icon">🎉</div>
        <p>Todas as missões pessoais completas!</p>
      </div>`;
    }
    const items = active.map(mId => {
      const m = getMissionById(mId);
      if (!m) return '';
      const prog = Math.min((d.stats && d.stats[m.stat]) || 0, m.target);
      const pct  = Math.min(100, (prog / m.target) * 100);
      return `<div class="mission-item">
        <div class="mission-label">${m.label}</div>
        <div class="mission-progress-bar"><div class="mission-fill" style="width:${pct}%"></div></div>
        <div class="mission-meta">
          <span>${prog.toLocaleString('pt-BR')} / ${m.target.toLocaleString('pt-BR')}</span>
          <span class="mission-reward">${_rewardLabel(m.reward)}</span>
        </div>
      </div>`;
    }).join('');
    return `<div class="ms-local-list">${items}</div>`;
  }

  // ── HTML: aba Comunidade ─────────────────────────────────────────────────────

  function _offlineHTML() {
    return `<div class="ms-empty">
      <div class="ms-empty-icon">🔒</div>
      <p>Entre na sua conta para ver as missões da comunidade.</p>
      <button class="btn btn-primary ms-action-btn"
        onclick="MissionsUI.close();OnlineUI.show()">Entrar / Criar Conta</button>
    </div>`;
  }

  function _noMissionHTML() {
    return `<div class="ms-empty">
      <div class="ms-empty-icon">🏁</div>
      <p>Nenhuma missão ativa no momento.</p>
      <p class="ms-empty-sub">Uma nova missão começa em breve!</p>
    </div>`;
  }

  function _communityBodyHTML() {
    const m   = _mission;
    const pct = Math.min(100, Math.round((m.current_value / m.goal_value) * 100));

    const contribPart = _contrib
      ? `<div class="ms-contrib">
           Sua contribuição: <strong>${_fmt(_contrib.value)} ${_contribLabel[m.goal_type] || m.goal_type}</strong>
         </div>`
      : (Online.isLoggedIn()
          ? `<div class="ms-contrib ms-contrib--none">Jogue para contribuir com esta missão!</div>`
          : '');

    let actionPart = '';
    if (m.completed) {
      if (_contrib && !_contrib.claimed_at) {
        actionPart = `<button class="btn ms-claim-btn" onclick="MissionsUI.claim('${m.id}')">
          🎁 Resgatar Recompensa
        </button>`;
      } else if (_contrib?.claimed_at) {
        actionPart = `<div class="ms-claimed-badge">✅ Recompensa resgatada!</div>`;
      } else if (Online.isLoggedIn()) {
        actionPart = `<div class="ms-contrib ms-contrib--none">Você não contribuiu para esta missão.</div>`;
      }
    }

    const completedBanner = m.completed
      ? `<div class="ms-completed-banner">🎉 META ALCANÇADA PELA COMUNIDADE!</div>` : '';

    const rewardUnits = (m.reward_units || []).map(id => {
      const ch = typeof getCharById !== 'undefined' ? getCharById(id) : null;
      return `<span class="ms-reward-unit">${ch ? ch.name : id}</span>`;
    }).join('');

    const rewardLine = (m.reward_gems > 0 || rewardUnits)
      ? `<div class="ms-rewards">
           <span class="ms-reward-label">Recompensa:</span>
           ${m.reward_gems > 0 ? `<span class="ms-reward-gem">💎 ${m.reward_gems} gemas</span>` : ''}
           ${rewardUnits}
         </div>` : '';

    return `${completedBanner}
      <div class="ms-body">
        <div class="ms-title">${m.title}</div>
        ${m.description ? `<div class="ms-desc">${m.description}</div>` : ''}
        <div class="ms-progress-wrap">
          <div class="ms-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="ms-progress-labels">
          <span>${_fmt(m.current_value)} / ${_fmt(m.goal_value)} ${_goalLabel[m.goal_type] || m.goal_type}</span>
          <span class="ms-time-left" id="ms-time-left">⏱ ${_fmtTimeLeft(m.ends_at)}</span>
        </div>
        ${rewardLine}
        ${contribPart}
        ${actionPart}
        <button class="btn ms-refresh-btn" onclick="MissionsUI.refresh()">🔄 Atualizar</button>
      </div>`;
  }

  // ── Internals ─────────────────────────────────────────────────────────────────

  function _getModal()    { return document.getElementById('missions-modal'); }
  function _getContent()  { return document.getElementById('missions-modal-content'); }
  function _getTabEl()    { return document.getElementById('ms-tab-content'); }

  async function _renderTab() {
    const tc = _getTabEl();
    if (!tc) return;

    if (_activeTab === 'local') {
      tc.innerHTML = _localHTML();
      return;
    }

    // Community tab
    tc.innerHTML = '<div class="ms-loading">Carregando...</div>';
    if (!Online.isLoggedIn()) { tc.innerHTML = _offlineHTML(); return; }

    _mission = await Online.fetchActiveMission();
    _contrib = _mission ? await Online.fetchMissionContribution(_mission.id) : null;
    tc.innerHTML = _mission ? _communityBodyHTML() : _noMissionHTML();
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
    // Re-render the shell so tab buttons update, then render content
    _getContent().innerHTML = _shellHTML();
    await _renderTab();
  }

  async function refresh() {
    if (_activeTab === 'community') {
      const tc = _getTabEl();
      if (tc) tc.innerHTML = '<div class="ms-loading">Carregando...</div>';
      if (!Online.isLoggedIn()) { if (tc) tc.innerHTML = _offlineHTML(); return; }
      _mission = await Online.fetchActiveMission();
      _contrib = _mission ? await Online.fetchMissionContribution(_mission.id) : null;
      if (tc) tc.innerHTML = _mission ? _communityBodyHTML() : _noMissionHTML();
      _startCountdown();
    } else {
      const tc = _getTabEl();
      if (tc) tc.innerHTML = _localHTML();
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

  async function claim(missionId) {
    const btn = document.querySelector('.ms-claim-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Resgatando...'; }
    const result = await Online.claimMissionReward(missionId);
    if (result.ok) {
      if (_mission?.reward_units?.length && typeof Save !== 'undefined') {
        _mission.reward_units.forEach(id => Save.addUnit(id));
      }
      if (typeof UI !== 'undefined') UI.toast('🎁 Recompensa resgatada! Gemas adicionadas.', 4000);
      await refresh();
    } else {
      const msgs = {
        already_claimed: 'Recompensa já resgatada.',
        no_contribution: 'Você não participou desta missão.',
        mission_not_completed: 'A missão ainda não foi concluída.',
        not_logged_in: 'Faça login para resgatar.',
      };
      if (typeof UI !== 'undefined') UI.toast('❌ ' + (msgs[result.error] || result.error), 3000);
      if (btn) { btn.disabled = false; btn.textContent = '🎁 Resgatar Recompensa'; }
    }
  }

  return { show, close, setTab, refresh, onMissionUpdate, claim };
})();
