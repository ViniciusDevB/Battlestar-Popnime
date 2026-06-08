// ─────────────────────────────────────────────────────────────────────────────
// MISSION_CHECKERS — dict de verificadores por tipo de missão.
//
// Para adicionar um novo tipo: implemente a função (mission, data) → bool
// e registre aqui. Não precisa tocar em check() nem em missions_data.js.
//
// Exemplos de tipos futuros:
//   'counter_event' → incrementado manualmente por eventos (boss kills, etc.)
//   'sequence'      → condição baseada em estado específico no save
// ─────────────────────────────────────────────────────────────────────────────
const MISSION_CHECKERS = {
  // Verifica se a stat atingiu o target.
  stat_threshold: (mission, data) => (data.stats[mission.stat] || 0) >= mission.target,
};

// ─────────────────────────────────────────────────────────────────────────────
// Missões
// ─────────────────────────────────────────────────────────────────────────────
const Missions = (() => {
  const MAX_ACTIVE = 5;

  function init() {
    const d = Save.get();
    if (!d.missoes_ativas || d.missoes_ativas.length === 0) {
      d.missoes_ativas = [];
      d.missoes_completas = d.missoes_completas || [];
      fillActive();
    }
    Save.save();
  }

  function fillActive() {
    const d = Save.get();
    const done   = new Set(d.missoes_completas);
    const active = new Set(d.missoes_ativas);
    for (const m of MISSIONS_LIST) {
      if (d.missoes_ativas.length >= MAX_ACTIVE) break;
      if (!done.has(m.id) && !active.has(m.id)) {
        d.missoes_ativas.push(m.id);
        active.add(m.id);
      }
    }
    Save.save();
  }

  function check() {
    const d = Save.get();
    d.missoes_ativas = d.missoes_ativas || [];
    const completed = [];

    for (const mId of [...d.missoes_ativas]) {
      const m = getMissionById(mId);
      if (!m) continue;
      const checker = MISSION_CHECKERS[m.type];
      if (checker && checker(m, d)) completed.push(m);
    }

    if (completed.length > 0) {
      completed.forEach(m => {
        d.missoes_ativas = d.missoes_ativas.filter(id => id !== m.id);
        if (!d.missoes_completas.includes(m.id)) {
          d.missoes_completas.push(m.id);
          grantRewards(m.reward);
        }
      });
      fillActive();
      Save.save();
      showMissionRewards(completed);
    }

    renderMissions();
  }

  // Concede recompensas do objeto reward — suporta tickets, gems e materials.
  function grantRewards(reward) {
    if (!reward) return;
    if (reward.tickets) Save.addTickets(reward.tickets);
    if (reward.gems)    Save.addGems(reward.gems);
    if (reward.materials) {
      reward.materials.forEach(mat => Save.addMaterial(mat.id, mat.qty || 1));
    }
  }

  // Texto descritivo das recompensas para exibição no toast.
  function rewardLabel(reward) {
    const parts = [];
    if (reward.tickets) parts.push(`+${reward.tickets} 🎫`);
    if (reward.gems)    parts.push(`+${reward.gems} 💎`);
    if (reward.materials) reward.materials.forEach(m => parts.push(`+${m.qty||1}× ${m.id}`));
    return parts.join(' ');
  }

  function showMissionRewards(missions) {
    missions.forEach(m => {
      UI.toast(`✅ Missão completa: ${m.label} → ${rewardLabel(m.reward)}`);
    });
  }

  function getProgress(m) {
    const d = Save.get();
    if (m.type === 'stat_threshold') return Math.min(d.stats[m.stat] || 0, m.target);
    return 0;
  }

  function renderMissions() {
    const list = document.getElementById('missions-local-list');
    if (!list) return;
    const d = Save.get();
    list.innerHTML = '';
    (d.missoes_ativas || []).forEach(mId => {
      const m = getMissionById(mId);
      if (!m) return;
      const prog = getProgress(m);
      const pct  = Math.min(100, (prog / m.target) * 100);
      const div  = document.createElement('div');
      div.className = 'mission-item';
      div.innerHTML = `
        <div class="mission-label">${m.label}</div>
        <div class="mission-progress-bar"><div class="mission-fill" style="width:${pct}%"></div></div>
        <div class="mission-meta"><span>${prog.toLocaleString()}/${m.target.toLocaleString()}</span><span class="mission-reward">${rewardLabel(m.reward)}</span></div>`;
      list.appendChild(div);
    });
    if ((d.missoes_ativas || []).length === 0) {
      list.innerHTML = '<div class="mission-empty">Todas as missões completas! 🎉</div>';
    }
  }

  return { init, check, renderMissions };
})();
