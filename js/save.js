// js/save.js — In-memory save (no localStorage). Persistence is handled
// exclusively by Online.syncSave() which talks to Supabase.

const Save = (() => {
  function generateUid() {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function defaultSave() {
    return {
      inventario: {
        unidades: [],
        materiais: []
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
        fases_op_completas: 0,
        fases_bleach_completas: 0,
        fases_marvel_completas: 0,
        fases_dc_completas: 0,
        fases_naruto_jogadas: 0,
        fases_op_jogadas: 0,
        fases_bleach_jogadas: 0,
        fases_marvel_jogadas: 0,
        fases_dc_jogadas: 0,
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

  // Initialise in-memory state. Called at startup before login.
  // Real data is loaded from the server via Online.syncSave() after login.
  function load() {
    if (!_data) _data = defaultSave();
    return _data;
  }

  // No-op for localStorage — _data lives in memory.
  // Online.syncSave() handles actual persistence to Supabase.
  function save() {
    if (!_data) return;
    // Integrity tamper-detection snapshot (in-memory only, no HMAC sealing)
    // — nothing to do here in the online-only model.
  }

  function _setData(d) {
    // Migrate stacked unit format if server returns old format
    if (d?.inventario?.unidades) {
      const migrated = [];
      d.inventario.unidades.forEach(u => {
        if (u.quantidade !== undefined) {
          const qty = Math.min(u.quantidade || 1, 500);
          for (let i = 0; i < qty; i++) {
            migrated.push({ uid: generateUid(), id: u.id, nivel: u.nivel || 1, xp_atual: i === 0 ? (u.xp_atual || 0) : 0 });
          }
        } else {
          if (!u.uid) u.uid = generateUid();
          migrated.push(u);
        }
      });
      d.inventario.unidades = migrated;
    }
    _data = d;
    if (!_data.inventario)         _data.inventario = { unidades: [], materiais: [] };
    if (!_data.inventario.unidades) _data.inventario.unidades = [];
    if (!_data.inventario.materiais) _data.inventario.materiais = [];
    if (!_data.stats)              _data.stats = defaultSave().stats;
    else _data.stats = Object.assign(defaultSave().stats, _data.stats);
    // Remove das pendentes qualquer missão que o servidor já marcou como completa.
    // fn_claim_reward/fn_sync_progress pode retornar save com missoes_conquistas_pendentes
    // desatualizada; isso evita que missões já resgatadas apareçam como claimáveis novamente.
    if (_data.missoes_conquistas_pendentes?.length && _data.missoes_completas?.length) {
      const done = new Set(_data.missoes_completas);
      _data.missoes_conquistas_pendentes = _data.missoes_conquistas_pendentes.filter(id => !done.has(id));
    }
  }


  // Aplica save do servidor mantendo union com progresso local.
  // Evita que um syncSave com snapshot antigo apague completions feitas localmente.
  function _mergeData(serverSave) {
    if (!serverSave) return;
    const local = _data || {};

    // fases_completas: union profunda (servidor + local, nunca perde conclusão)
    const localFases  = local.fases_completas  || {};
    const serverFases = serverSave.fases_completas || {};
    const mergedFases = { ...serverFases };
    for (const [sid, diffs] of Object.entries(localFases)) {
      mergedFases[sid] = { ...(mergedFases[sid] || {}), ...diffs };
    }
    serverSave.fases_completas = mergedFases;

    // stats: max de cada campo
    const localStats  = local.stats  || {};
    const serverStats = serverSave.stats || {};
    for (const [k, v] of Object.entries(localStats)) {
      if (typeof v === 'number' && typeof serverStats[k] === 'number') {
        serverStats[k] = Math.max(serverStats[k], v);
      }
    }
    serverSave.stats = serverStats;

    // missoes_completas: union (nunca perde missão já resgatada localmente)
    const localDone  = local.missoes_completas  || [];
    const serverDone = serverSave.missoes_completas || [];
    const mergedDone = [...new Set([...serverDone, ...localDone])];
    serverSave.missoes_completas = mergedDone;

    // missoes_conquistas_pendentes: remove as já presentes em mergedDone
    if (serverSave.missoes_conquistas_pendentes?.length) {
      const doneSet = new Set(mergedDone);
      serverSave.missoes_conquistas_pendentes =
        serverSave.missoes_conquistas_pendentes.filter(id => !doneSet.has(id));
    }

    // missoes_diarias.completas: union dentro da sessão diária
    const localDaily  = local.missoes_diarias?.completas  || [];
    const serverDaily = serverSave.missoes_diarias?.completas || [];
    if (localDaily.length && serverSave.missoes_diarias) {
      serverSave.missoes_diarias.completas =
        [...new Set([...serverDaily, ...localDaily])];
    }

    _setData(serverSave);
  }

  function get() { return _data || load(); }

  function reset() {
    _data = defaultSave();
    return _data;
  }

  // ── Inventory helpers ──────────────────────────────────────────────────────

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

  function getUnitData(id)    { return get().inventario.unidades.find(u => u.id === id) || null; }
  function getBestUnitData(id) {
    const units = get().inventario.unidades.filter(u => u.id === id);
    if (units.length === 0) return null;
    return units.reduce((best, u) => u.nivel > best.nivel ? u : best, units[0]);
  }
  function getUnitByUid(uid)  { return get().inventario.unidades.find(u => u.uid === uid) || null; }
  function getMaterialQty(id) { const m = get().inventario.materiais.find(m => m.id === id); return m ? m.quantidade : 0; }
  function getUnitQty(id)     { return get().inventario.unidades.filter(u => u.id === id).length; }

  function addGems(n)      { get().gemas += n; save(); }
  function spendGems(n)    { const d = get(); if (d.gemas < n) return false; d.gemas -= n; save(); return true; }
  function addTickets(n)   { get().tickets += n; save(); }
  function spendTickets(n) { const d = get(); if (d.tickets < n) return false; d.tickets -= n; save(); return true; }

  function incStat(stat, val = 1) {
    const d = get();
    if (d.stats[stat] === undefined) d.stats[stat] = 0;
    d.stats[stat] += val;
    save();
  }

  function setStat(stat, val) { const d = get(); d.stats[stat] = val; save(); }

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

  function setTeam(teamArr) { const d = get(); d.time_salvo = teamArr; save(); }

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

  // ── Trade lock ─────────────────────────────────────────────────────────────

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

  function isUnitLocked(uid) { return !!(getUnitByUid(uid)?.in_trade); }

  return {
    load, save, get, reset, _setData, _mergeData,
    addUnit, addMaterial, removeUnit, removeUnitByUid,
    removeMaterial, getUnitData, getBestUnitData, getUnitByUid, getMaterialQty, getUnitQty,
    addGems, spendGems, addTickets, spendTickets, incStat, setStat,
    markStageComplete, isStageComplete, getTeam, setTeam,
    getPrestige, canPrestige, doPrestige,
    lockUnit, unlockUnit, isUnitLocked,
  };
})();
