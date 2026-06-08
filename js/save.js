const Save = (() => {
  const KEY = 'astd_save_v1';

  function generateUid() {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function defaultSave() {
    return {
      inventario: {
        unidades: [],   // {uid, id, nivel, xp_atual}
        materiais: []   // {id, quantidade}
      },
      gemas: 500,
      tickets: 0,
      pity_contador: 0,
      fases_completas: {},
      time_salvo: [],
      stats: {
        dano_total_causado: 0,
        inimigos_derrotados: 0,
        torres_colocadas: 0,
        fases_completas: 0,
        fases_naruto_completas: 0,
        pulls_realizados: 0,
        feeds_realizados: 0,
        evolucoes_realizadas: 0,
        minibosses_derrotados: 0,
        boss_pain_derrotado: 0,
        unidades_4estrelas_obtidas: 0,
        unidades_5estrelas_obtidas: 0,
        prestígios_realizados: 0
      },
      missoes_ativas: [],
      missoes_completas: []
    };
  }

  let _data = null;
  let _corruptedSave = false;
  let _saveFailed = false;

  function load() {
    _corruptedSave = false;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        try {
          _data = Object.assign(defaultSave(), JSON.parse(raw));
        } catch(parseErr) {
          _corruptedSave = true;
          _data = defaultSave();
          try { localStorage.removeItem(KEY); } catch {}
          return _data;
        }
        _data.inventario = _data.inventario || { unidades:[], materiais:[] };
        _data.stats = Object.assign(defaultSave().stats, _data.stats || {});

        // Migrate stacked format {id, quantidade} → individual instances {uid, id}
        const newUnidades = [];
        (_data.inventario.unidades || []).forEach(u => {
          if (u.quantidade !== undefined) {
            for (let i = 0; i < (u.quantidade || 1); i++) {
              newUnidades.push({
                uid: generateUid(),
                id: u.id,
                nivel: u.nivel || 1,
                xp_atual: i === 0 ? (u.xp_atual || 0) : 0
              });
            }
          } else {
            if (!u.uid) u.uid = generateUid();
            newUnidades.push(u);
          }
        });
        _data.inventario.unidades = newUnidades;

        // Integrity: HMAC async (fire-and-forget) + plausibility sync
        if (typeof Integrity !== 'undefined') {
          Integrity.verify(raw).then(verdict => {
            if (verdict === 'tampered') {
              Integrity.recordViolation('hmac_mismatch', {});
              if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast('⚠️ Save modificado detectado — leaderboard bloqueado nesta sessão.', 8000);
              }
            } else if (verdict === 'no_seal') {
              Integrity.seal(raw); // gera HMAC para saves pré-2.5
            }
          }).catch(() => {});

          const plViolations = Integrity.validateSavePlausibility(_data);
          plViolations.forEach(v => Integrity.recordViolation(v, {}));
        }
      } else {
        _data = defaultSave();
      }
    } catch(e) {
      _data = defaultSave();
    }
    return _data;
  }

  function save() {
    if (!_data) return;
    _saveFailed = false;
    const json = JSON.stringify(_data);
    try {
      localStorage.setItem(KEY, json);
      if (typeof Integrity !== 'undefined') {
        Integrity.invalidate();
        Integrity.seal(json).catch(() => {});
      }
    } catch(e) {
      _saveFailed = true;
      console.warn('Save failed:', e);
      if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast('⚠️ Falha ao salvar! Armazenamento cheio — limpe dados do navegador.', 6000);
      }
    }
  }

  function _setData(d) {
    _data = d;
    save();
  }

  function wasCorrupted() { return _corruptedSave; }
  function didSaveFail()  { return _saveFailed; }

  function get() { return _data || load(); }

  function reset() {
    _data = defaultSave();
    save();
    return _data;
  }

  // Inventory helpers
  function addUnit(id, nivel = 1, xp_atual = 0) {
    const d = get();
    const uid = generateUid();
    d.inventario.unidades.push({ uid, id, nivel, xp_atual });
    save();
    return uid;
  }

  function addMaterial(id, qty = 1) {
    const d = get();
    const existing = d.inventario.materiais.find(m => m.id === id);
    if (existing) existing.quantidade += qty;
    else d.inventario.materiais.push({ id, quantidade: qty });
    save();
  }

  // Remove first N instances of a character by id (used by evolution)
  function removeUnit(id, qty = 1) {
    const d = get();
    let removed = 0;
    d.inventario.unidades = d.inventario.unidades.filter(u => {
      if (u.id === id && removed < qty) { removed++; return false; }
      return true;
    });
    cleanTeam();
    save();
    return removed;
  }

  // Remove a specific unit instance by uid (used by feed)
  function removeUnitByUid(uid) {
    const d = get();
    d.inventario.unidades = d.inventario.unidades.filter(u => u.uid !== uid);
    cleanTeam();
    save();
  }

  function cleanTeam() {
    const d = get();
    if (!d.time_salvo) return;
    let changed = false;
    for (let i = 0; i < d.time_salvo.length; i++) {
      if (d.time_salvo[i] && getUnitQty(d.time_salvo[i]) === 0) {
        d.time_salvo[i] = null;
        changed = true;
      }
    }
    if (changed) save();
  }

  function removeMaterial(id, qty = 1) {
    const d = get();
    const existing = d.inventario.materiais.find(m => m.id === id);
    if (!existing || existing.quantidade < qty) return false;
    existing.quantidade -= qty;
    if (existing.quantidade <= 0)
      d.inventario.materiais = d.inventario.materiais.filter(m => m.id !== id);
    save();
    return true;
  }

  function getUnitData(id) {
    return get().inventario.unidades.find(u => u.id === id) || null;
  }

  function getBestUnitData(id) {
    const units = get().inventario.unidades.filter(u => u.id === id);
    if (units.length === 0) return null;
    return units.reduce((best, u) => u.nivel > best.nivel ? u : best, units[0]);
  }

  function getUnitByUid(uid) {
    return get().inventario.unidades.find(u => u.uid === uid) || null;
  }

  function getMaterialQty(id) {
    const m = get().inventario.materiais.find(m => m.id === id);
    return m ? m.quantidade : 0;
  }

  function getUnitQty(id) {
    return get().inventario.unidades.filter(u => u.id === id).length;
  }

  function addGems(n) { get().gemas += n; save(); }
  function spendGems(n) { const d=get(); if(d.gemas<n) return false; d.gemas-=n; save(); return true; }
  function addTickets(n) { get().tickets += n; save(); }
  function spendTickets(n) { const d=get(); if(d.tickets<n) return false; d.tickets-=n; save(); return true; }

  function incStat(stat, val = 1) {
    const d = get();
    if (d.stats[stat] === undefined) d.stats[stat] = 0;
    d.stats[stat] += val;
    save();
  }

  function setStat(stat, val) {
    const d = get();
    d.stats[stat] = val;
    save();
  }

  function markStageComplete(stageId, diff) {
    const d = get();
    if (!d.fases_completas[stageId]) d.fases_completas[stageId] = {};
    d.fases_completas[stageId][diff] = true;
    save();
  }

  function isStageComplete(stageId, diff) {
    const d = get();
    return !!(d.fases_completas[stageId] && d.fases_completas[stageId][diff]);
  }

  function getTeam() {
    const d = get();
    if (!d.time_salvo || d.time_salvo.length !== 6) {
      d.time_salvo = [null, null, null, null, null, null];
      save();
    }
    return d.time_salvo;
  }

  function setTeam(teamArr) {
    const d = get();
    d.time_salvo = teamArr;
    save();
  }

  function getPrestige(charId) {
    const units = get().inventario.unidades.filter(u => u.id === charId);
    if (units.length === 0) return 0;
    return Math.max(...units.map(u => u.prestige || 0));
  }

  function canPrestige(uid) {
    const u = getUnitByUid(uid);
    if (!u) return false;
    if ((u.prestige || 0) >= 10) return false;
    const char = typeof getCharById !== 'undefined' ? getCharById(u.id) : null;
    const maxLevel = char?.max_level || 50;
    return u.nivel >= maxLevel;
  }

  function doPrestige(uid) {
    const d = get();
    const u = d.inventario.unidades.find(x => x.uid === uid);
    if (!u) return false;
    if ((u.prestige || 0) >= 10) return false;
    u.prestige = (u.prestige || 0) + 1;
    u.nivel = 1;
    u.xp_atual = 0;
    if (d.stats) d.stats.prestígios_realizados = (d.stats.prestígios_realizados || 0) + 1;
    save();
    return true;
  }

  // ── Trocas — bloqueio de unidades em oferta ──────────────────────────────
  function lockUnit(uid) {
    const d = get();
    const u = d.inventario.unidades.find(x => x.uid === uid);
    if (u) { u.in_trade = true; save(); return true; }
    return false;
  }

  function unlockUnit(uid) {
    const d = get();
    const u = d.inventario.unidades.find(x => x.uid === uid);
    if (u) { delete u.in_trade; save(); return true; }
    return false;
  }

  function isUnitLocked(uid) {
    const u = getUnitByUid(uid);
    return !!(u?.in_trade);
  }

  // ── Auto-Place — 3 slots por fase ─────────────────────────────────────────
  function saveSetup(stageId, slot, placements) {
    const key = `astd_setup_${stageId}_${slot}`;
    try { localStorage.setItem(key, JSON.stringify(placements)); } catch {}
  }

  function loadSetup(stageId, slot) {
    const key = `astd_setup_${stageId}_${slot}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  return { load, save, get, reset, _setData,
           addUnit, addMaterial, removeUnit, removeUnitByUid,
           removeMaterial, getUnitData, getBestUnitData, getUnitByUid, getMaterialQty, getUnitQty,
           addGems, spendGems, addTickets, spendTickets, incStat, setStat,
           markStageComplete, isStageComplete, getTeam, setTeam,
           getPrestige, canPrestige, doPrestige,
           lockUnit, unlockUnit, isUnitLocked,
           saveSetup, loadSetup,
           wasCorrupted, didSaveFail };
})();
