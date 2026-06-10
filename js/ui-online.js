// js/ui-online.js — UI do sistema online: modal de login/registro e perfil do jogador.
// Depende de: Online (online.js), Save (save.js), UI.toast (ui.js)

const OnlineUI = (() => {
  let _tab = 'login';  // 'login' | 'register'
  let _loading = false;

  // ── Abrir / Fechar ────────────────────────────────────────────────────────

  async function show() {
    const modal = document.getElementById('online-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Se sessão existe mas perfil ainda está carregando, mostra spinner antes de renderizar
    if (Online.isLoggedIn() && !Online.getProfile()) {
      _setContent(_loadingHTML());
      await Online.waitForProfile();
      // Se após aguardar ainda não tem perfil, a conta pode estar sem dados — faz logout silencioso
      if (!Online.getProfile()) {
        await Online.logout();
      }
    }

    _render();
  }

  function close() {
    document.getElementById('online-modal').style.display = 'none';
  }

  // ── Render principal ──────────────────────────────────────────────────────

  function _render() {
    if (Online.isLoggedIn() && Online.getProfile()) {
      _setContent(_profileHTML());
      if (Online.getProfile()?.is_admin) return; // admin não precisa de rank
      // Carrega rank assincronamente e atualiza apenas o badge
      Online.fetchMyRank('infinite').then(rankData => {
        const el = document.getElementById('profile-rank-badge');
        if (!el) return;
        if (!rankData) { el.textContent = I18N.t('online_no_rank'); el.className = 'prof-rank-none'; return; }
        const badge = typeof LeaderboardUI !== 'undefined'
          ? LeaderboardUI.getRankBadge(rankData.rank, rankData.total) : null;
        el.className = 'prof-rank-badge';
        if (badge) {
          el.style.color = badge.color;
          el.innerHTML = `<span class="prof-rank-title">${badge.title}</span> · #${rankData.rank} de ${_fmt(rankData.total)}`;
        } else {
          el.style.color = 'var(--t2)';
          el.textContent = `#${rankData.rank} de ${rankData.total}`;
        }
      }).catch(() => {
        const el = document.getElementById('profile-rank-badge');
        if (el) { el.textContent = '—'; el.className = 'prof-rank-none'; }
      });
    } else {
      _setContent(_authHTML());
      _setTab(_tab);
    }
  }

  function _setContent(html) {
    const area = document.getElementById('online-modal-content');
    if (area) area.innerHTML = html;
  }

  function _loadingHTML() {
    return `
      <div class="modal-header">
        <h3>🌐 ASTD Online</h3>
        <button class="modal-close" onclick="OnlineUI.close()">✕</button>
      </div>
      <div style="text-align:center;padding:32px 0;color:var(--t3)">
        <div style="font-size:28px;margin-bottom:10px">⏳</div>
        <div style="font-size:13px">${I18N.t('online_restoring_session')}</div>
      </div>
    `;
  }

  // ── HTML: autenticação ────────────────────────────────────────────────────

  function _authHTML() {
    return `
      <div class="modal-header">
        <h3>🌐 ASTD Online</h3>
        <button class="modal-close" onclick="OnlineUI.close()">✕</button>
      </div>
      <p class="online-subtitle">${I18N.t('online_subtitle')}</p>
      <div class="online-tab-bar">
        <button id="online-tab-login"    class="online-tab-btn" onclick="OnlineUI.setTab('login')">${I18N.t('online_tab_login')}</button>
        <button id="online-tab-register" class="online-tab-btn" onclick="OnlineUI.setTab('register')">${I18N.t('online_tab_register')}</button>
      </div>
      <div id="online-form-area"></div>
      <div id="online-error" class="online-error" style="display:none"></div>
    `;
  }

  function _loginFormHTML() {
    return `
      <form onsubmit="event.preventDefault(); OnlineUI.handleLogin();">
        <div class="online-form-group">
          <label class="online-label">Username</label>
          <input id="ol-username" class="online-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
        </div>
        <div class="online-form-group">
          <label class="online-label">Senha</label>
          <input id="ol-pass" class="online-input" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button class="online-btn-primary" id="online-submit-btn" type="submit">
          Entrar
        </button>
      </form>
    `;
  }

  function _registerFormHTML() {
    return `
      <form onsubmit="event.preventDefault(); OnlineUI.handleRegister();">
        <div class="online-form-group">
          <label class="online-label">Username <span class="online-hint">${I18N.t('online_username_hint')}</span></label>
          <input id="ol-username" class="online-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
        </div>
        <div class="online-form-group">
          <label class="online-label">${I18N.t('online_label_password')} <span class="online-hint">${I18N.t('online_password_hint')}</span></label>
          <input id="ol-pass" class="online-input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <button class="online-btn-primary" id="online-submit-btn" type="submit">
          ${I18N.t('online_register_btn')}
        </button>
      </form>
    `;
  }

  // ── HTML: perfil ──────────────────────────────────────────────────────────

  function _profileHTML() {
    const profile  = Online.getProfile();
    const isAdmin  = !!profile?.is_admin;
    const save     = Save.get();
    const stats    = save?.stats || {};

    const avatarColor = isAdmin ? '#92400e' : _avatarColor(profile?.username || '?');
    const initial     = isAdmin ? '♛' : (profile?.username || '?')[0].toUpperCase();
    const memberSince = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' })
      : '—';
    const syncedAt = save?._lastSyncAt
      ? new Date(save._lastSyncAt).toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })
      : I18N.t('online_never_synced');

    const bestWave  = stats.melhor_onda_infinita || 0;
    const totalDmg  = _fmt(stats.dano_total_causado || 0);
    const totalKills = _fmt(stats.inimigos_derrotados || 0);
    const waveBarPct = Math.min(100, (bestWave / 500) * 100).toFixed(1);

    const warnings = [
      save?._cheatMode ? I18N.t('warn_cheat_mode') : null,
      (!Integrity.isClean() && !save?._cheatMode) ? I18N.t('warn_integrity_violation') : null,
    ].filter(Boolean);

    return `
      <div class="prof-header">
        <button class="modal-close prof-close" onclick="OnlineUI.close()">✕</button>
        <div class="prof-banner-bg" style="--ac:${avatarColor}"></div>
        <div class="prof-avatar-wrap">
          <div class="prof-avatar" style="background:${avatarColor}">${initial}</div>
        </div>
        <div class="prof-identity">
          <div class="prof-username ${isAdmin ? 'prof-username--admin' : ''}">
            ${isAdmin ? '<span class="prof-admin-crown">♛</span> ' : ''}${_esc(profile?.username || '—')}
          </div>
          ${isAdmin ? '<div class="prof-admin-badge">DESENVOLVEDOR</div>' : `<div class="prof-since">${I18N.t('online_member_since', { date: memberSince })}</div>`}
          <div class="prof-rank-area">
            ${isAdmin
              ? '<span class="prof-admin-rank">Acesso Total</span>'
              : `<span id="profile-rank-badge" class="prof-rank-loading">${I18N.t('online_loading_rank')}</span>`
            }
          </div>
        </div>
      </div>

      ${warnings.length ? `<div class="prof-warnings">${warnings.map(w => `<div class="online-cheat-warning">⚠️ ${w} — ${I18N.t('warn_lb_blocked')}</div>`).join('')}</div>` : ''}

      <div class="prof-body">

        <div class="prof-section-title">${I18N.t('online_stat_statistics')}</div>
        <div class="prof-stat-grid">
          <div class="prof-stat-card">
            <div class="prof-stat-icon">🗺️</div>
            <div class="prof-stat-val">${stats.fases_completas || 0}</div>
            <div class="prof-stat-label">${I18N.t('online_stat_stages')}</div>
          </div>
          <div class="prof-stat-card">
            <div class="prof-stat-icon">⚡</div>
            <div class="prof-stat-val">${stats.pulls_realizados || 0}</div>
            <div class="prof-stat-label">Pulls</div>
          </div>
          <div class="prof-stat-card">
            <div class="prof-stat-icon">💀</div>
            <div class="prof-stat-val">${totalKills}</div>
            <div class="prof-stat-label">Kills</div>
          </div>
          <div class="prof-stat-card">
            <div class="prof-stat-icon">🌟</div>
            <div class="prof-stat-val">${stats.prestígios_realizados || 0}</div>
            <div class="prof-stat-label">${I18N.t('online_stat_prestiges')}</div>
          </div>
        </div>

        <div class="prof-section-title">${I18N.t('online_section_infinite')}</div>
        <div class="prof-infinite-card">
          <div class="prof-inf-row">
            <span class="prof-inf-label">${I18N.t('online_best_wave')}</span>
            <span class="prof-inf-val">${bestWave > 0 ? `Wave <b>${bestWave}</b>` : `<span style="color:var(--t3)">${I18N.t('online_never_played')}</span>`}</span>
          </div>
          ${bestWave > 0 ? `
          <div class="prof-wave-bar-bg">
            <div class="prof-wave-bar-fill" style="width:${waveBarPct}%;background:${avatarColor}"></div>
          </div>
          <div class="prof-inf-hint">${I18N.t('online_wave_progress', { pct: waveBarPct })}</div>` : ''}
          <div class="prof-inf-row" style="margin-top:10px">
            <span class="prof-inf-label">${I18N.t('online_total_damage')}</span>
            <span class="prof-inf-val"><b>${totalDmg}</b></span>
          </div>
        </div>

        <div class="prof-footer">
          <span class="prof-sync-ts">☁️ Sync: ${syncedAt}</span>
          <button class="online-btn-danger" onclick="OnlineUI.handleLogout()">${I18N.t('online_logout_btn')}</button>
        </div>

      </div>
    `;
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  function setTab(tab) {
    _tab = tab;
    _setTab(tab);
  }

  function _setTab(tab) {
    const area   = document.getElementById('online-form-area');
    const btnLog = document.getElementById('online-tab-login');
    const btnReg = document.getElementById('online-tab-register');
    if (!area) return;

    area.innerHTML = tab === 'login' ? _loginFormHTML() : _registerFormHTML();
    _clearError();

    if (btnLog) btnLog.classList.toggle('active', tab === 'login');
    if (btnReg) btnReg.classList.toggle('active', tab === 'register');

    setTimeout(() => document.getElementById('ol-username')?.focus(), 50);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (_loading) return;
    const username = document.getElementById('ol-username')?.value.trim();
    const pass     = document.getElementById('ol-pass')?.value;
    if (!username || !pass) return _showError(I18N.t('online_fill_fields'));

    _setLoading(true);
    try {
      const result = await Online.login(username, pass);
      if (result.error) {
        _setLoading(false);
        _showError(_translateError(result.error));
      } else {
        // Aguarda syncSave para garantir que o perfil renderize com dados reais
        await Online.syncSave();
        _setLoading(false);
        close();
        UI.toast(I18N.t('online_welcome_back', { username }), 3000);
        _render();
      }
    } catch (_) {
      _setLoading(false);
      _showError(I18N.t('online_unexpected_error'));
    }
  }

  async function handleRegister() {
    if (_loading) return;
    const username = document.getElementById('ol-username')?.value.trim();
    const pass     = document.getElementById('ol-pass')?.value;

    if (!username) return _showError(I18N.t('online_enter_username'));
    if (username.length < 3) return _showError(I18N.t('online_username_short'));
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return _showError(I18N.t('online_username_format'));
    if (!pass || pass.length < 6) return _showError(I18N.t('online_password_short'));

    _setLoading(true);
    try {
      const result = await Online.register(username, pass);
      if (result.error) {
        _setLoading(false);
        _showError(_translateError(result.error));
      } else {
        await Online.syncSave();
        _setLoading(false);
        close();
        UI.toast(I18N.t('online_account_created', { username }), 3500);
        _render();
      }
    } catch (_) {
      _setLoading(false);
      _showError(I18N.t('online_unexpected_error'));
    }
  }

  async function handleSync() {
    const btn = document.getElementById('online-sync-btn');
    if (btn) { btn.disabled = true; btn.textContent = I18N.t('online_syncing'); }

    const result = await Online.syncSave();

    if (btn) { btn.disabled = false; btn.textContent = I18N.t('online_sync_btn'); }

    if (result.ok) {
      UI.updateCurrencyDisplay();
      _render();
      UI.toast(I18N.t('online_synced'), 2500);
    } else {
      UI.toast(I18N.t('online_sync_failed') + result.reason, 4000);
    }
  }

  async function handleLogout() {
    if (!window.confirm(I18N.t('online_logout_confirm'))) return;
    // Fecha o modal antes do logout para que a tela de login apareça limpa.
    // onAuthStateChange cuida de LoginScreen.show() após signOut().
    close();
    await Online.logout();
    UI.toast(I18N.t('online_logged_out'), 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _setLoading(on) {
    _loading = on;
    const btn = document.getElementById('online-submit-btn');
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? I18N.t('online_waiting') : (_tab === 'login' ? I18N.t('online_login_btn') : I18N.t('online_register_btn'));
  }

  function _showError(msg) {
    const el = document.getElementById('online-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function _clearError() {
    const el = document.getElementById('online-error');
    if (el) el.style.display = 'none';
  }

  function _avatarColor(username) {
    const palette = ['#9f7aea','#5b9cf6','#3ecf8e','#ffc846','#fb923c','#f56565','#ec4899'];
    let h = 0;
    for (let i = 0; i < username.length; i++) h = username.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }

  function _fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _translateError(msg) {
    if (!msg) return I18N.t('online_unexpected_error');
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials'))
      return I18N.t('err_wrong_credentials');
    if (msg.includes('User already registered') || msg.includes('already been registered'))
      return I18N.t('err_username_taken');
    if (msg.includes('duplicate key') && msg.includes('username'))
      return I18N.t('err_username_taken');
    if (msg.includes('Password should') || msg.includes('password'))
      return I18N.t('err_password_short');
    if (msg.includes('Email signups are disabled'))
      return I18N.t('err_signup_disabled');
    if (msg === 'offline')
      return I18N.t('err_no_server');
    return msg;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return { show, close, setTab, handleLogin, handleRegister, handleLogout };
})();

// ══════════════════════════════════════════════════════════════════════════════
// LoginScreen — tela de login dedicada exibida antes do hub
// ══════════════════════════════════════════════════════════════════════════════

const LoginScreen = (() => {
  let _tab     = 'login';
  let _loading = false;

  function _screen() { return document.getElementById('screen-login'); }

  function _activate() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    _screen()?.classList.add('active');
  }

  function showLoading() {
    _activate();
    _setContent(`
      <div class="ls-loading">
        <div class="ls-spinner">⏳</div>
        <p>${I18N.t('online_verifying_session')}</p>
      </div>
    `);
  }

  function show() {
    _tab = 'login';
    _activate();
    _render();
    setTimeout(() => document.getElementById('ls-username')?.focus(), 80);
  }

  function _goToHub() {
    _screen()?.classList.remove('active');
    UI.showHub();
    UI.updateCurrencyDisplay();
  }

  function _setContent(html) {
    const el = document.getElementById('login-screen-content');
    if (el) el.innerHTML = html;
  }

  function _render() {
    _setContent(`
      <div class="ls-tabs">
        <button id="ls-tab-login"    class="ls-tab ${_tab==='login'?'active':''}"    onclick="LoginScreen.setTab('login')">${I18N.t('online_tab_login')}</button>
        <button id="ls-tab-register" class="ls-tab ${_tab==='register'?'active':''}" onclick="LoginScreen.setTab('register')">${I18N.t('online_tab_register')}</button>
      </div>
      <div id="ls-form-area"></div>
      <div id="ls-error" class="ls-error" style="display:none"></div>
      <button id="ls-submit" class="ls-btn-primary" onclick="LoginScreen.handleSubmit()">
        ${_tab === 'login' ? I18N.t('online_tab_login') : I18N.t('online_tab_register')}
      </button>
    `);
    _renderForm();
  }

  function showServerDown() {
    _activate();
    _setContent(`
      <div class="ls-loading">
        <div class="ls-spinner">⚠️</div>
        <p style="color:#f87171;font-weight:600;margin-bottom:6px;">${I18N.t('online_server_down_title')}</p>
        <p style="color:#9ca3af;font-size:13px;">${I18N.t('online_server_down_msg')}</p>
        <button class="ls-btn-primary" style="margin-top:18px" onclick="location.reload()">${I18N.t('online_retry_btn')}</button>
      </div>
    `);
  }

  function _renderForm() {
    const area = document.getElementById('ls-form-area');
    if (!area) return;
    if (_tab === 'login') {
      area.innerHTML = `
        <div class="ls-field">
          <label class="ls-label">Username</label>
          <input id="ls-username" class="ls-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
        </div>
        <div class="ls-field">
          <label class="ls-label">Senha</label>
          <input id="ls-pass" class="ls-input" type="password" placeholder="••••••••" autocomplete="current-password"
            onkeydown="if(event.key==='Enter')LoginScreen.handleSubmit()">
        </div>
      `;
    } else {
      area.innerHTML = `
        <div class="ls-field">
          <label class="ls-label">Username <span class="ls-hint">${I18N.t('online_username_hint')}</span></label>
          <input id="ls-username" class="ls-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
        </div>
        <div class="ls-field">
          <label class="ls-label">${I18N.t('online_label_password')} <span class="ls-hint">${I18N.t('online_password_hint')}</span></label>
          <input id="ls-pass" class="ls-input" type="password" placeholder="••••••••" autocomplete="new-password"
            onkeydown="if(event.key==='Enter')LoginScreen.handleSubmit()">
        </div>
      `;
    }
    setTimeout(() => document.getElementById('ls-username')?.focus(), 50);
  }

  function setTab(tab) {
    _tab = tab;
    _render();
  }

  async function handleSubmit() {
    if (_loading) return;
    const username = document.getElementById('ls-username')?.value.trim();
    const pass     = document.getElementById('ls-pass')?.value;

    if (!username || !pass) return _showError(I18N.t('online_fill_fields'));
    if (_tab === 'register') {
      if (username.length < 3) return _showError(I18N.t('online_username_short'));
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return _showError(I18N.t('online_username_format'));
      if (pass.length < 6) return _showError(I18N.t('online_password_short'));
    }

    _setLoading(true);
    try {
      const result = _tab === 'login'
        ? await Online.login(username, pass)
        : await Online.register(username, pass);
      if (result.error) {
        _setLoading(false);
        _showError(_translateError(result.error));
      } else {
        // Aguarda o save ser sincronizado antes de exibir o hub.
        // Sem isso o hub abre com dados padrão (500 gemas) e só atualiza segundos depois.
        await Online.syncSave();
        _setLoading(false);
        _goToHub();
        UI.toast(_tab === 'register' ? I18N.t('online_account_created', { username }) : I18N.t('online_welcome_back', { username }), 3000);
      }
    } catch (_) {
      _setLoading(false);
      _showError(I18N.t('online_unexpected_error'));
    }
  }

  function _setLoading(on) {
    _loading = on;
    const btn = document.getElementById('ls-submit');
    if (!btn) return;
    btn.disabled  = on;
    btn.textContent = on ? I18N.t('online_waiting') : (_tab === 'login' ? I18N.t('online_login_btn') : I18N.t('online_register_btn'));
  }

  function _showError(msg) {
    const el = document.getElementById('ls-error');
    if (!el) return;
    el.textContent  = msg;
    el.style.display = 'block';
  }

  function _translateError(msg) {
    if (!msg) return I18N.t('online_unexpected_error');
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials'))
      return I18N.t('err_wrong_credentials');
    if (msg.includes('User already registered') || msg.includes('already been registered'))
      return I18N.t('err_username_taken');
    if (msg.includes('duplicate key') && msg.includes('username'))
      return I18N.t('err_username_taken');
    if (msg.includes('Password should') || msg.includes('password'))
      return I18N.t('err_password_short');
    if (msg.includes('Email signups are disabled'))
      return I18N.t('err_signup_disabled');
    if (msg === 'offline') return I18N.t('err_no_server');
    return msg;
  }

  return { show, showLoading, showServerDown, setTab, handleSubmit };
})();
