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
  const MAX_FIXED = 8;
  const DAILY_COUNT = 15;

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    const d = Save.get();
    d.missoes_ativas    = d.missoes_ativas    || [];
    d.missoes_completas = d.missoes_completas || [];
    if (d.missoes_ativas.length < MAX_FIXED) _fillFixed();
    initDailies();
    Save.save();
  }

  // ── Conquistas (fixas) ────────────────────────────────────────────────────────

  function _fillFixed() {
    const d    = Save.get();
    const done = new Set(d.missoes_completas);
    const cur  = new Set(d.missoes_ativas);
    for (const m of MISSIONS_LIST) {
      if (d.missoes_ativas.length >= MAX_FIXED) break;
      if (!done.has(m.id) && !cur.has(m.id)) {
        d.missoes_ativas.push(m.id);
        cur.add(m.id);
      }
    }
    Save.save();
  }

  function _checkFixed() {
    const d = Save.get();
    const completed = [];
    for (const mId of [...d.missoes_ativas]) {
      const m = getMissionById(mId);
      if (!m) continue;
      if (MISSION_CHECKERS[m.type]?.(m, d)) completed.push(m);
    }
    if (!completed.length) return;
    completed.forEach(m => {
      d.missoes_ativas = d.missoes_ativas.filter(id => id !== m.id);
      if (!d.missoes_completas.includes(m.id)) {
        d.missoes_completas.push(m.id);
        _grantRewards(m.reward, m.id, false, null);
      }
    });
    _fillFixed();
    Save.save();
    _toastRewards(completed);
  }

  // ── Diárias ───────────────────────────────────────────────────────────────────

  function _today() { return new Date().toISOString().split('T')[0]; }

  function initDailies() {
    const d     = Save.get();
    const today = _today();
    if (!d.missoes_diarias || d.missoes_diarias.data !== today) {
      _resetDailies(d, today);
    } else if (d.missoes_diarias.ativas.length < DAILY_COUNT) {
      // Pool was expanded — rebuild today's active list keeping existing completions/snapshot
      d.missoes_diarias.ativas = getDailyMissions(today).map(m => m.id);
      Save.save();
    }
  }

  function _resetDailies(d, today) {
    const s = d.stats || {};
    d.missoes_diarias = {
      data:      today,
      completas: [],
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
    const done      = new Set(d.missoes_diarias.completas);
    const completed = [];
    for (const mId of d.missoes_diarias.ativas) {
      if (done.has(mId)) continue;
      const m = getMissionById(mId);
      if (!m) continue;
      if (MISSION_CHECKERS[m.type]?.(m, d)) completed.push(m);
    }
    if (!completed.length) return;
    completed.forEach(m => {
      d.missoes_diarias.completas.push(m.id);
      _grantRewards(m.reward, m.id, true, d.missoes_diarias.data);
    });
    Save.save();
    _toastRewards(completed);
  }

  // ── Rewards ───────────────────────────────────────────────────────────────────

  function _grantRewards(reward, missionId, isDaily, date) {
    if (!reward) return;
    // Concede localmente para feedback imediato (offline também funciona)
    if (reward.gems)    Save.addGems(reward.gems);
    if (reward.tickets) Save.addTickets(reward.tickets);
    // Confirma e persiste no servidor em background
    if (typeof Online !== 'undefined' && Online.isLoggedIn() && missionId) {
      Online.claimReward(missionId, isDaily ? date : null).then(result => {
        if (result?.ok && result.save) {
          Save._setData(result.save);
          if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
        }
      }).catch(() => {});
    }
  }

  function rewardLabel(reward) {
    const p = [];
    if (reward.gems)    p.push(`+${reward.gems} 💎`);
    if (reward.tickets) p.push(`+${reward.tickets} 🎫`);
    return p.join(' ');
  }

  function _toastRewards(missions) {
    missions.forEach(m => UI.toast(`✅ Missão completa: ${m.label} → ${rewardLabel(m.reward)}`));
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

  // Kept for backward compat — renders into modal's Conquistas list if open
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
      list.innerHTML = '<div class="mission-empty">Todas as conquistas disponíveis foram concluídas! 🎉</div>';
    }
  }

  return { init, initDailies, check, renderMissions, getProgress, rewardLabel };
})();
