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
        if (!rankData) { el.textContent = '— sem rank'; el.className = 'prof-rank-none'; return; }
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
        <div style="font-size:13px">Restaurando sessão...</div>
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
      <p class="online-subtitle">Entre com username e senha para acessar Rankings, Leaderboard e Trocas.</p>
      <div class="online-tab-bar">
        <button id="online-tab-login"    class="online-tab-btn" onclick="OnlineUI.setTab('login')">Entrar</button>
        <button id="online-tab-register" class="online-tab-btn" onclick="OnlineUI.setTab('register')">Criar Conta</button>
      </div>
      <div id="online-form-area"></div>
      <div id="online-error" class="online-error" style="display:none"></div>
    `;
  }

  function _loginFormHTML() {
    return `
      <div class="online-form-group">
        <label class="online-label">Username</label>
        <input id="ol-username" class="online-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
      </div>
      <div class="online-form-group">
        <label class="online-label">Senha</label>
        <input id="ol-pass" class="online-input" type="password" placeholder="••••••••" autocomplete="current-password"
          onkeydown="if(event.key==='Enter')OnlineUI.handleLogin()">
      </div>
      <button class="online-btn-primary" id="online-submit-btn" onclick="OnlineUI.handleLogin()">
        Entrar
      </button>
    `;
  }

  function _registerFormHTML() {
    return `
      <div class="online-form-group">
        <label class="online-label">Username <span class="online-hint">(3–20 caracteres, letras/números/_)</span></label>
        <input id="ol-username" class="online-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
      </div>
      <div class="online-form-group">
        <label class="online-label">Senha <span class="online-hint">(mín. 6 caracteres)</span></label>
        <input id="ol-pass" class="online-input" type="password" placeholder="••••••••" autocomplete="new-password"
          onkeydown="if(event.key==='Enter')OnlineUI.handleRegister()">
      </div>
      <button class="online-btn-primary" id="online-submit-btn" onclick="OnlineUI.handleRegister()">
        Criar Conta
      </button>
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
      ? new Date(profile.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
      : '—';
    const syncedAt = save?._lastSyncAt
      ? new Date(save._lastSyncAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
      : 'Nunca';

    const bestWave  = stats.melhor_onda_infinita || 0;
    const totalDmg  = _fmt(stats.dano_total_causado || 0);
    const totalKills = _fmt(stats.inimigos_derrotados || 0);
    const waveBarPct = Math.min(100, (bestWave / 500) * 100).toFixed(1);

    const warnings = [
      save?._cheatMode ? 'Modo Cheat ativo' : null,
      (!Integrity.isClean() && !save?._cheatMode) ? 'Violação de integridade detectada' : null,
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
          ${isAdmin ? '<div class="prof-admin-badge">DESENVOLVEDOR</div>' : `<div class="prof-since">Membro desde ${memberSince}</div>`}
          <div class="prof-rank-area">
            ${isAdmin
              ? '<span class="prof-admin-rank">Acesso Total</span>'
              : '<span id="profile-rank-badge" class="prof-rank-loading">⏳ carregando rank…</span>'
            }
          </div>
        </div>
      </div>

      ${warnings.length ? `<div class="prof-warnings">${warnings.map(w => `<div class="online-cheat-warning">⚠️ ${w} — leaderboard bloqueado</div>`).join('')}</div>` : ''}

      <div class="prof-body">

        <div class="prof-section-title">Estatísticas</div>
        <div class="prof-stat-grid">
          <div class="prof-stat-card">
            <div class="prof-stat-icon">🗺️</div>
            <div class="prof-stat-val">${stats.fases_completas || 0}</div>
            <div class="prof-stat-label">Fases</div>
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
            <div class="prof-stat-label">Prestígios</div>
          </div>
        </div>

        <div class="prof-section-title">Modo Infinito</div>
        <div class="prof-infinite-card">
          <div class="prof-inf-row">
            <span class="prof-inf-label">🌊 Melhor Wave</span>
            <span class="prof-inf-val">${bestWave > 0 ? `Wave <b>${bestWave}</b>` : '<span style="color:var(--t3)">Nunca jogado</span>'}</span>
          </div>
          ${bestWave > 0 ? `
          <div class="prof-wave-bar-bg">
            <div class="prof-wave-bar-fill" style="width:${waveBarPct}%;background:${avatarColor}"></div>
          </div>
          <div class="prof-inf-hint">${waveBarPct}% do caminho até Wave 500</div>` : ''}
          <div class="prof-inf-row" style="margin-top:10px">
            <span class="prof-inf-label">⚔️ Dano Total</span>
            <span class="prof-inf-val"><b>${totalDmg}</b></span>
          </div>
        </div>

        <div class="prof-footer">
          <div class="prof-sync-row">
            <span class="prof-sync-ts">☁️ Sync: ${syncedAt}</span>
            <button class="online-btn-secondary" id="online-sync-btn" onclick="OnlineUI.handleSync()">🔄 Sincronizar</button>
          </div>
          <button class="online-btn-danger" onclick="OnlineUI.handleLogout()">Sair da Conta</button>
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
    if (!username || !pass) return _showError('Preencha username e senha.');

    _setLoading(true);
    try {
      const result = await Online.login(username, pass);
      _setLoading(false);
      if (result.error) {
        _showError(_translateError(result.error));
      } else {
        close();
        UI.toast(`✅ Bem-vindo de volta, ${username}!`, 3000);
        _render();
      }
    } catch (_) {
      _setLoading(false);
      _showError('Erro inesperado. Tente novamente.');
    }
  }

  async function handleRegister() {
    if (_loading) return;
    const username = document.getElementById('ol-username')?.value.trim();
    const pass     = document.getElementById('ol-pass')?.value;

    if (!username) return _showError('Digite um username.');
    if (username.length < 3) return _showError('Username deve ter pelo menos 3 caracteres.');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return _showError('Username: apenas letras, números e _');
    if (!pass || pass.length < 6) return _showError('Senha deve ter pelo menos 6 caracteres.');

    _setLoading(true);
    try {
      const result = await Online.register(username, pass);
      _setLoading(false);
      if (result.error) {
        _showError(_translateError(result.error));
      } else {
        close();
        UI.toast(`✅ Conta criada! Bem-vindo, ${username}!`, 3500);
        _render();
      }
    } catch (_) {
      _setLoading(false);
      _showError('Erro inesperado. Tente novamente.');
    }
  }

  async function handleSync() {
    const btn = document.getElementById('online-sync-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronizando...'; }

    const result = await Online.syncSave();

    if (btn) { btn.disabled = false; btn.textContent = '🔄 Sincronizar'; }

    if (result.ok) {
      UI.updateCurrencyDisplay();
      _render();
      UI.toast('✅ Save sincronizado!', 2500);
    } else {
      UI.toast('⚠️ Falha ao sincronizar: ' + result.reason, 4000);
    }
  }

  async function handleLogout() {
    if (!window.confirm('Sair da conta?\nSeu progresso local será mantido.')) return;
    await Online.logout();
    _tab = 'login';
    _render();
    UI.toast('Sessão encerrada.', 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _setLoading(on) {
    _loading = on;
    const btn = document.getElementById('online-submit-btn');
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? '⏳ Aguarde...' : (_tab === 'login' ? 'Entrar' : 'Criar Conta');
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
    if (!msg) return 'Erro desconhecido.';
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials'))
      return 'Username ou senha incorretos.';
    if (msg.includes('User already registered') || msg.includes('already been registered'))
      return 'Este username já está em uso.';
    if (msg.includes('duplicate key') && msg.includes('username'))
      return 'Este username já está em uso.';
    if (msg.includes('Password should') || msg.includes('password'))
      return 'Senha muito curta (mín. 6 caracteres).';
    if (msg.includes('Email signups are disabled'))
      return 'Cadastro desativado no servidor. Contate o administrador.';
    if (msg === 'offline')
      return 'Sem conexão com o servidor. Tente mais tarde.';
    return msg;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return { show, close, setTab, handleLogin, handleRegister, handleSync, handleLogout };
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
        <p>Verificando sessão...</p>
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
        <button id="ls-tab-login"    class="ls-tab ${_tab==='login'?'active':''}"    onclick="LoginScreen.setTab('login')">Entrar</button>
        <button id="ls-tab-register" class="ls-tab ${_tab==='register'?'active':''}" onclick="LoginScreen.setTab('register')">Criar Conta</button>
      </div>
      <div id="ls-form-area"></div>
      <div id="ls-error" class="ls-error" style="display:none"></div>
      <button id="ls-submit" class="ls-btn-primary" onclick="LoginScreen.handleSubmit()">
        ${_tab === 'login' ? 'Entrar' : 'Criar Conta'}
      </button>
      <div class="ls-divider"><span>ou</span></div>
      <button class="ls-btn-offline" onclick="LoginScreen.playOffline()">Jogar Offline</button>
    `);
    _renderForm();
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
          <label class="ls-label">Username <span class="ls-hint">(3–20 caracteres, letras/números/_)</span></label>
          <input id="ls-username" class="ls-input" type="text" placeholder="NarutoBR" maxlength="20" autocomplete="username">
        </div>
        <div class="ls-field">
          <label class="ls-label">Senha <span class="ls-hint">(mín. 6 caracteres)</span></label>
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

    if (!username || !pass) return _showError('Preencha username e senha.');
    if (_tab === 'register') {
      if (username.length < 3) return _showError('Username deve ter pelo menos 3 caracteres.');
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return _showError('Username: apenas letras, números e _');
      if (pass.length < 6) return _showError('Senha deve ter pelo menos 6 caracteres.');
    }

    _setLoading(true);
    try {
      const result = _tab === 'login'
        ? await Online.login(username, pass)
        : await Online.register(username, pass);
      _setLoading(false);
      if (result.error) {
        _showError(_translateError(result.error));
      } else {
        _goToHub();
        UI.toast(`✅ Bem-vindo${_tab === 'register' ? '' : ' de volta'}, ${username}!`, 3000);
      }
    } catch (_) {
      _setLoading(false);
      _showError('Erro inesperado. Tente novamente.');
    }
  }

  function playOffline() {
    _goToHub();
  }

  function _setLoading(on) {
    _loading = on;
    const btn = document.getElementById('ls-submit');
    if (!btn) return;
    btn.disabled  = on;
    btn.textContent = on ? '⏳ Aguarde...' : (_tab === 'login' ? 'Entrar' : 'Criar Conta');
  }

  function _showError(msg) {
    const el = document.getElementById('ls-error');
    if (!el) return;
    el.textContent  = msg;
    el.style.display = 'block';
  }

  function _translateError(msg) {
    if (!msg) return 'Erro desconhecido.';
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials'))
      return 'Username ou senha incorretos.';
    if (msg.includes('User already registered') || msg.includes('already been registered'))
      return 'Este username já está em uso.';
    if (msg.includes('duplicate key') && msg.includes('username'))
      return 'Este username já está em uso.';
    if (msg.includes('Password should') || msg.includes('password'))
      return 'Senha muito curta (mín. 6 caracteres).';
    if (msg.includes('Email signups are disabled'))
      return 'Cadastro desativado no servidor. Contate o administrador.';
    if (msg === 'offline') return 'Sem conexão com o servidor. Tente mais tarde.';
    return msg;
  }

  return { show, showLoading, setTab, handleSubmit, playOffline };
})();
