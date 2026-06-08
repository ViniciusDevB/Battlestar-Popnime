// js/integrity.js — Anti-cheat offline: HMAC do save, FunctionGuard, DevToolsGuard.
// Carregado ANTES de save.js. Não tem dependências em outros módulos do jogo.

const Integrity = (() => {
  const SALT_KEY = 'astd_integrity_v1';
  const HMAC_KEY = 'astd_save_hmac_v1';

  let _violations = [];

  // ── HMAC ──────────────────────────────────────────────────────────────────

  async function _getSalt() {
    let salt = localStorage.getItem(SALT_KEY);
    if (!salt) {
      const buf = crypto.getRandomValues(new Uint8Array(32));
      salt = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(SALT_KEY, salt);
    }
    return salt;
  }

  async function _getKey(salt) {
    const enc = new TextEncoder();
    const raw = enc.encode(salt + '_astd_bsp_2025');
    return crypto.subtle.importKey(
      'raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
  }

  async function _computeHmac(saveJson) {
    const salt = await _getSalt();
    const key  = await _getKey(salt);
    const enc  = new TextEncoder();
    const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(saveJson));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Grava o HMAC após cada save legítimo (fire-and-forget pelo save.js)
  async function seal(saveJson) {
    try {
      const hmac = await _computeHmac(saveJson);
      localStorage.setItem(HMAC_KEY, hmac);
    } catch (e) {
      console.warn('[Integrity] seal error:', e);
    }
  }

  // Retorna 'ok' | 'no_seal' | 'tampered'
  async function verify(saveJson) {
    try {
      const stored = localStorage.getItem(HMAC_KEY);
      if (!stored) return 'no_seal';
      const computed = await _computeHmac(saveJson);
      return computed === stored ? 'ok' : 'tampered';
    } catch (e) {
      return 'no_seal';
    }
  }

  // ── Plausibilidade do save ─────────────────────────────────────────────────

  function validateSavePlausibility(data) {
    const violations = [];
    if (!data) return violations;

    if ((data.gemas || 0) > 9_999_999) violations.push('gemas_absurdas');
    if ((data.tickets || 0) > 9_999)   violations.push('tickets_absurdos');

    const pulls = data.stats?.pulls_realizados || 0;
    const units = data.inventario?.unidades?.length || 0;
    if (units > pulls + 15) violations.push('unidades_excedentes');

    const pity = data.pity_contador || 0;
    if (pity < 0 || pity > 200) violations.push('pity_invalido');

    (data.inventario?.unidades || []).forEach(u => {
      if ((u.nivel || 1) > 60)   violations.push('nivel_invalido:' + u.id);
      if ((u.prestige || 0) > 10) violations.push('prestige_invalido:' + u.id);
    });

    const statsToCheck = ['inimigos_derrotados', 'dano_total_causado', 'torres_colocadas',
                          'fases_completas', 'pulls_realizados', 'feeds_realizados'];
    statsToCheck.forEach(k => {
      if ((data.stats?.[k] || 0) < 0) violations.push('stat_negativo:' + k);
    });

    return violations;
  }

  // ── Audit de estado em runtime ─────────────────────────────────────────────

  function auditGameState(state) {
    const { gold, wave, sessionDmg, sessionKills } = state || {};
    const maxGoldPerWave = 600;
    if (gold > (wave || 0) * maxGoldPerWave * 2) {
      recordViolation('gold_spike', { wave, gold });
    }
    if ((sessionKills || 0) > 0 && (sessionDmg || 0) / sessionKills > 2_000_000_000) {
      recordViolation('dmg_per_kill_absurdo', { wave, sessionKills, sessionDmg });
    }
  }

  // ── Violation tracking ────────────────────────────────────────────────────

  function recordViolation(type, detail) {
    const v = { type, detail: detail || {}, ts: Date.now() };
    _violations.push(v);
    console.warn('[Integrity] violation:', type, detail);
    if (typeof Save !== 'undefined' && Save.get) {
      const d = Save.get();
      if (d) {
        d._integrityViolations = [...((d._integrityViolations || []).slice(-19)), v];
      }
    }
  }

  const _BLOCKERS_LEADERBOARD = ['hmac_mismatch', 'unidades_excedentes', 'nivel_invalido',
                                  'function_patched', 'gold_spike', 'dmg_per_kill_absurdo'];
  const _BLOCKERS_TRADES      = ['unidades_excedentes', 'nivel_invalido'];

  function isClean() {
    if (typeof Save !== 'undefined' && Save.get?.()?.['_cheatMode']) return false;
    return !_violations.some(v => _BLOCKERS_LEADERBOARD.some(b => v.type.startsWith(b)));
  }

  function isCleanForTrades() {
    return !_violations.some(v => _BLOCKERS_TRADES.some(b => v.type.startsWith(b)));
  }

  function assertCleanOrThrow() {
    if (!isClean()) throw new Error('integrity_violation');
  }

  function getViolations() { return [..._violations]; }

  // ── FunctionGuard ─────────────────────────────────────────────────────────

  const FunctionGuard = (() => {
    const _snaps = {};

    function snapshot(targets) {
      for (const [name, fn] of Object.entries(targets)) {
        if (typeof fn === 'function') _snaps[name] = fn.toString();
      }
    }

    function audit(targets) {
      const patched = [];
      for (const [name, fn] of Object.entries(targets)) {
        if (typeof fn === 'function' && _snaps[name] && fn.toString() !== _snaps[name]) {
          patched.push(name);
        }
      }
      return patched;
    }

    return { snapshot, audit };
  })();

  // ── DevToolsGuard ─────────────────────────────────────────────────────────

  const DevToolsGuard = (() => {
    let _open = false;

    function _check() {
      const w = window.outerWidth  - window.innerWidth  > 180;
      const h = window.outerHeight - window.innerHeight > 180;
      return w || h;
    }

    function startMonitoring() {
      setInterval(() => {
        const nowOpen = _check();
        if (nowOpen && !_open) {
          _open = true;
          recordViolation('devtools_opened', { ts: Date.now() });
          console.warn(
            '%c⚠ ASTD Integrity Monitor',
            'color:#f87171;font-size:16px;font-weight:bold',
            '\nDevTools detectado. Submissões ao leaderboard serão marcadas para revisão.'
          );
        }
        if (!nowOpen) _open = false;
      }, 3000);
    }

    return { startMonitoring };
  })();

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    seal, verify,
    validateSavePlausibility,
    auditGameState,
    recordViolation,
    isClean, isCleanForTrades, assertCleanOrThrow,
    getViolations,
    FunctionGuard,
    DevToolsGuard,
  };
})();
