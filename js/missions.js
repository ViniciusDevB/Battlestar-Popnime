const MISSION_CHECKERS = {
  // Conquista: stat cumulativa atingiu o alvo
  stat_threshold: (m, d) => (d.stats[m.stat] || 0) >= m.target,
  // Diária: delta desde o snapshot de reset atingiu o alvo
  stat_delta: (m, d) => {
    const snap = d.missoes_diarias?.snapshot || {};
    return ((d.stats[m.stat] || 0) - (snap[m.stat] || 0)) >= m.target;
  },
  // Conquista: número de personagens únicos no inventário
  unit_count: (m, d) => {
    const ids = new Set((d.inventario?.unidades || []).map(u => u.id));
    return ids.size >= m.target;
  },
};

const Missions = (() => {
  const MAX_FIXED   = 8;
  const DAILY_COUNT = 15;

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    const d = Save.get();
    d.missoes_ativas               = d.missoes_ativas               || [];
    d.missoes_completas            = d.missoes_completas            || [];
    d.missoes_conquistas_pendentes = d.missoes_conquistas_pendentes || [];
    if (d.missoes_ativas.length < MAX_FIXED) _fillFixed();
    initDailies();
    Save.save();
    _updateBadge();
  }

  // ── Conquistas (fixas) ────────────────────────────────────────────────────────

  function _fillFixed() {
    const d    = Save.get();
    const done = new Set(d.missoes_completas);
    const pend = new Set(d.missoes_conquistas_pendentes);
    const cur  = new Set(d.missoes_ativas);
    for (const m of MISSIONS_LIST) {
      if (d.missoes_ativas.length >= MAX_FIXED) break;
      if (!done.has(m.id) && !cur.has(m.id) && !pend.has(m.id)) {
        d.missoes_ativas.push(m.id);
        cur.add(m.id);
      }
    }
    Save.save();
  }

  function _checkFixed() {
    const d       = Save.get();
    const pend    = new Set(d.missoes_conquistas_pendentes);
    const done    = new Set(d.missoes_completas);
    const completed = [];
    for (const mId of [...d.missoes_ativas]) {
      if (pend.has(mId) || done.has(mId)) continue;
      const m = getMissionById(mId);
      if (!m) continue;
      if (MISSION_CHECKERS[m.type]?.(m, d)) completed.push(m);
    }
    if (!completed.length) return;
    completed.forEach(m => {
      d.missoes_ativas = d.missoes_ativas.filter(id => id !== m.id);
      if (!pend.has(m.id) && !done.has(m.id)) {
        d.missoes_conquistas_pendentes.push(m.id);
      }
    });
    _fillFixed();
    Save.save();
    _updateBadge();
    completed.forEach(m => {
      if (typeof UI !== 'undefined') {
        UI.toast(I18N.t('mission_ready_claim', { label: m.label }));
      }
    });
  }

  // ── Diárias ───────────────────────────────────────────────────────────────────

  function _today() { return new Date().toISOString().split('T')[0]; }

  function initDailies() {
    const d     = Save.get();
    const today = _today();
    if (!d.missoes_diarias || d.missoes_diarias.data !== today) {
      _resetDailies(d, today);
    } else if (d.missoes_diarias.ativas.length < DAILY_COUNT) {
      d.missoes_diarias.ativas    = getDailyMissions(today).map(m => m.id);
      d.missoes_diarias.pendentes = d.missoes_diarias.pendentes || [];
      Save.save();
    }
  }

  function _resetDailies(d, today) {
    const s = d.stats || {};
    d.missoes_diarias = {
      data:      today,
      completas: [],
      pendentes: [],
      snapshot: {
        inimigos_derrotados:    s.inimigos_derrotados    || 0,
        dano_total_causado:     s.dano_total_causado      || 0,
        fases_completas:        s.fases_completas         || 0,
        fases_naruto_completas: s.fases_naruto_completas  || 0,
        fases_op_completas:     s.fases_op_completas      || 0,
        fases_bleach_completas: s.fases_bleach_completas  || 0,
        fases_marvel_completas: s.fases_marvel_completas  || 0,
        fases_naruto_jogadas:   s.fases_naruto_jogadas    || 0,
        fases_op_jogadas:       s.fases_op_jogadas        || 0,
        fases_bleach_jogadas:   s.fases_bleach_jogadas    || 0,
        fases_marvel_jogadas:   s.fases_marvel_jogadas    || 0,
        pulls_realizados:       s.pulls_realizados        || 0,
        torres_colocadas:       s.torres_colocadas        || 0,
        minibosses_derrotados:  s.minibosses_derrotados   || 0,
        ondas_infinito:         s.ondas_infinito          || 0,
        evolucoes_realizadas:   s.evolucoes_realizadas    || 0,
        feeds_realizados:       s.feeds_realizados        || 0,
      },
      ativas: getDailyMissions(today).map(m => m.id),
    };
    Save.save();
  }

  function _checkDailies() {
    const d = Save.get();
    if (!d.missoes_diarias) return;
    const claimed  = new Set(d.missoes_diarias.completas);
    const pending  = new Set(d.missoes_diarias.pendentes || []);
    const completed = [];
    for (const mId of d.missoes_diarias.ativas) {
      if (claimed.has(mId) || pending.has(mId)) continue;
      const m = getMissionById(mId);
      if (!m) continue;
      if (MISSION_CHECKERS[m.type]?.(m, d)) completed.push(m);
    }
    if (!completed.length) return;
    d.missoes_diarias.pendentes = d.missoes_diarias.pendentes || [];
    completed.forEach(m => d.missoes_diarias.pendentes.push(m.id));
    Save.save();
    _updateBadge();
    completed.forEach(m => {
      if (typeof UI !== 'undefined') {
        UI.toast(I18N.t('mission_ready_claim', { label: m.label }));
      }
    });
  }

  // ── Claim públicos ────────────────────────────────────────────────────────────

  function claimFixed(missionId) {
    const d   = Save.get();
    const idx = d.missoes_conquistas_pendentes.indexOf(missionId);
    if (idx === -1) return null;
    const m = getMissionById(missionId);
    if (!m) return null;
    d.missoes_conquistas_pendentes.splice(idx, 1);
    // Não adiciona a missoes_completas aqui: _grantRewards faz isso só após confirmação do servidor.
    // Evita que syncSave propague uma missão como concluída sem as gemas terem sido gravadas.
    _grantRewards(m.reward, missionId, false, null);
    Save.save();
    _updateBadge();
    return m;
  }

  function claimDaily(missionId) {
    const d = Save.get();
    if (!d.missoes_diarias) return null;
    d.missoes_diarias.pendentes = d.missoes_diarias.pendentes || [];
    const idx = d.missoes_diarias.pendentes.indexOf(missionId);
    if (idx === -1) return null;
    const m = getMissionById(missionId);
    if (!m) return null;
    d.missoes_diarias.pendentes.splice(idx, 1);
    // Mesma proteção: missoes_diarias.completas só atualizado após confirmação do servidor.
    _grantRewards(m.reward, missionId, true, d.missoes_diarias.data);
    Save.save();
    _updateBadge();
    return m;
  }

  // ── Rewards ───────────────────────────────────────────────────────────────────

  function _markDoneLocally(missionId, isDaily) {
    const d = Save.get();
    if (isDaily) {
      if (!d.missoes_diarias) return;
      if (!d.missoes_diarias.completas) d.missoes_diarias.completas = [];
      if (!d.missoes_diarias.completas.includes(missionId)) d.missoes_diarias.completas.push(missionId);
    } else {
      if (!d.missoes_completas.includes(missionId)) d.missoes_completas.push(missionId);
    }
    Save.save();
  }

  function _revertClaim(reward, missionId, isDaily) {
    const d = Save.get();
    if (reward.gems)    Save.spendGems(reward.gems);
    if (reward.tickets) Save.spendTickets(reward.tickets);
    if (isDaily) {
      if (d.missoes_diarias?.pendentes && !d.missoes_diarias.pendentes.includes(missionId)) {
        d.missoes_diarias.pendentes.push(missionId);
      }
    } else {
      if (!d.missoes_conquistas_pendentes) d.missoes_conquistas_pendentes = [];
      if (!d.missoes_conquistas_pendentes.includes(missionId)) {
        d.missoes_conquistas_pendentes.push(missionId);
      }
    }
    Save.save();
    _updateBadge();
    if (typeof UI !== 'undefined') {
      UI.toast(I18N.t('err_claim_failed'), 3500);
      UI.updateCurrencyDisplay();
    }
  }

  function _grantRewards(reward, missionId, isDaily, date) {
    if (!reward) return;
    if (reward.gems)    Save.addGems(reward.gems);
    if (reward.tickets) Save.addTickets(reward.tickets);
    if (typeof Online !== 'undefined' && Online.isLoggedIn() && missionId) {
      Online.claimReward(missionId, isDaily ? date : null).then(result => {
        if (result?.ok && result.save) {
          // Servidor confirmou: _mergeData aplica missoes_completas do servidor localmente
          Save._mergeData(result.save);
          if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
        } else if (result?.error === 'already_claimed') {
          // Servidor já tinha essa missão (claim anterior não aplicado localmente)
          _markDoneLocally(missionId, isDaily);
        } else {
          // Falha: reverte gemas/tickets e devolve missão ao estado pendente
          _revertClaim(reward, missionId, isDaily);
        }
      }).catch(() => _revertClaim(reward, missionId, isDaily));
    } else {
      // Modo offline: marca localmente pois não há servidor para confirmar
      _markDoneLocally(missionId, isDaily);
    }
  }

  function rewardLabel(reward) {
    const p = [];
    if (reward.gems)    p.push(`+${reward.gems} 💎`);
    if (reward.tickets) p.push(`+${reward.tickets} 🎫`);
    return p.join(' ');
  }

  // ── Badge de notificação no hub ───────────────────────────────────────────────

  function _updateBadge() {
    const badge = document.getElementById('ms-pending-badge');
    if (!badge) return;
    const count = getPendingCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function getPendingCount() {
    const d = Save.get();
    const fixedPend  = (d.missoes_conquistas_pendentes || []).length;
    const dailyPend  = (d.missoes_diarias?.pendentes   || []).length;
    return fixedPend + dailyPend;
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  function getProgress(m, d) {
    d = d || Save.get();
    if (m.type === 'stat_threshold') {
      return Math.min(d.stats[m.stat] || 0, m.target);
    }
    if (m.type === 'stat_delta') {
      const snap = d.missoes_diarias?.snapshot || {};
      return Math.min(Math.max(0, (d.stats[m.stat] || 0) - (snap[m.stat] || 0)), m.target);
    }
    if (m.type === 'unit_count') {
      const ids = new Set((d.inventario?.unidades || []).map(u => u.id));
      return Math.min(ids.size, m.target);
    }
    return 0;
  }

  // ── Check (public, called after any game action) ──────────────────────────────

  function check() {
    initDailies();
    _checkFixed();
    _checkDailies();
  }

  // Kept for backward compat
  function renderMissions() {
    const list = document.getElementById('missions-local-list');
    if (!list) return;
    const d = Save.get();
    list.innerHTML = '';
    (d.missoes_ativas || []).forEach(mId => {
      const m = getMissionById(mId);
      if (!m) return;
      const prog = getProgress(m, d);
      const pct  = Math.min(100, (prog / m.target) * 100);
      const div  = document.createElement('div');
      div.className = 'mission-item';
      div.innerHTML = `
        <div class="mission-label">${m.label}</div>
        <div class="mission-progress-bar"><div class="mission-fill" style="width:${pct}%"></div></div>
        <div class="mission-meta">
          <span>${prog.toLocaleString('pt-BR')} / ${m.target.toLocaleString('pt-BR')}</span>
          <span class="mission-reward">${rewardLabel(m.reward)}</span>
        </div>`;
      list.appendChild(div);
    });
    if (!(d.missoes_ativas || []).length) {
      list.innerHTML = `<div class="mission-empty">${I18N.t('missions_all_done')}</div>`;
    }
  }

  return { init, initDailies, check, renderMissions, getProgress, rewardLabel, claimFixed, claimDaily, getPendingCount, updateBadge: _updateBadge };
})();
