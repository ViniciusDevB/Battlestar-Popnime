// js/ui-leaderboard.js — Tela de Leaderboard e Rankings.

const LeaderboardUI = (() => {
  let _mode = 'infinite'; // 'infinite' | 'infinite_dmg'
  let _loading = false;

  // ── Abrir / Fechar ────────────────────────────────────────────────────────

  async function show() {
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    await _load(_mode);
  }

  function close() {
    document.getElementById('leaderboard-modal').style.display = 'none';
  }

  async function setMode(mode) {
    if (_loading) return;
    _mode = mode;
    await _load(mode);
  }

  // ── Carregar dados ────────────────────────────────────────────────────────

  async function _load(mode) {
    _loading = true;
    _setContent(_skeletonHTML(mode));

    const [entries, myRank] = await Promise.all([
      Online.fetchLeaderboard(mode, 50),
      Online.isLoggedIn() ? Online.fetchMyRank(mode) : Promise.resolve(null),
    ]);

    _loading = false;
    _setContent(_boardHTML(mode, entries || [], myRank));
  }

  // ── HTML ──────────────────────────────────────────────────────────────────

  function _skeletonHTML(mode) {
    return `
      ${_headerHTML(mode)}
      <div class="lb-skeleton">
        ${Array.from({length: 8}, (_,i) => `
          <div class="lb-skel-row" style="animation-delay:${i*60}ms"></div>
        `).join('')}
      </div>
    `;
  }

  function _headerHTML(mode) {
    return `
      <div class="modal-header">
        <h3>🏆 Leaderboard</h3>
        <button class="modal-close" onclick="LeaderboardUI.close()">✕</button>
      </div>
      <div class="lb-tabs">
        <button class="lb-tab ${mode==='infinite'      ? 'active':''}" onclick="LeaderboardUI.setMode('infinite')">🌊 Wave</button>
        <button class="lb-tab ${mode==='infinite_dmg'  ? 'active':''}" onclick="LeaderboardUI.setMode('infinite_dmg')">${I18N.t('lb_tab_damage')}</button>
        <button class="lb-tab ${mode==='stage'         ? 'active':''}" onclick="LeaderboardUI.setMode('stage')">${I18N.t('lb_tab_stages')}</button>
      </div>
    `;
  }

  function _boardHTML(mode, entries, myRank) {
    const isLoggedIn = Online.isLoggedIn();
    const profile    = Online.getProfile();

    const rankBadge = myRank ? _rankBadge(myRank.rank, myRank.total) : null;

    const listRows = entries.length === 0
      ? `<div class="lb-empty">${I18N.t('lb_empty')}</div>`
      : entries.map((e, i) => {
          const isSelf  = profile && e.players?.username === profile.username;
          const isAdmin = !!e.players?.is_admin;
          const score   = _formatScore(mode, e);
          const dots    = _unitDots(e.units_used);
          const nameHTML = isAdmin
            ? `<span class="lb-admin-name">♛ ${_esc(e.players?.username || '—')}</span><span class="lb-admin-tag">DEV</span>`
            : `<span class="lb-name">${_esc(e.players?.username || '—')}</span>`;
          return `
            <div class="lb-row ${isSelf ? 'lb-row--self' : ''} ${isAdmin ? 'lb-row--admin' : ''}">
              <span class="lb-rank">${_rankNum(i + 1)}</span>
              ${nameHTML}
              <span class="lb-score">${score}</span>
              <span class="lb-dots">${dots}</span>
            </div>
          `;
        }).join('');

    const mySection = isLoggedIn ? `
      <div class="lb-my-rank">
        ${myRank
          ? `<span class="lb-my-pos">${I18N.t('lb_my_rank', { rank: myRank.rank, total: _fmtNum(myRank.total) })}</span>
             <span class="lb-my-score">${_formatScore(mode, { wave: myRank.wave, score: myRank.score, damage: myRank.damage || myRank.score })}</span>
             ${rankBadge ? `<span class="lb-badge" style="color:${rankBadge.color}">${rankBadge.title}</span>` : ''}`
          : `<span style="color:var(--t3);font-size:12px">${I18N.t('lb_no_score')}</span>`
        }
      </div>
    ` : `
      <div class="lb-my-rank lb-my-rank--guest">
        <span style="color:var(--t3);font-size:12px">${I18N.t('lb_guest')}</span>
        <button class="online-btn-secondary" style="margin-left:auto" onclick="LeaderboardUI.close();OnlineUI.show()">${I18N.t('lb_login_btn')}</button>
      </div>
    `;

    return `
      ${_headerHTML(mode)}
      <div class="lb-list">${listRows}</div>
      ${mySection}
    `;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _formatScore(mode, entry) {
    if (mode === 'infinite')     return `Wave <b>${entry.wave ?? entry.score ?? 0}</b>`;
    if (mode === 'infinite_dmg') return `<b>${_fmtNum(entry.damage || entry.score || 0)}</b> dmg`;
    if (mode === 'stage')        return `<b>${_fmtNum(entry.score || 0)}</b> pts`;
    return `<b>${entry.score ?? 0}</b>`;
  }

  function _rankNum(n) {
    if (n === 1) return '🥇';
    if (n === 2) return '🥈';
    if (n === 3) return '🥉';
    return `#${n}`;
  }

  function _rankBadge(rank, total) {
    if (!rank || !total || total === 0) return null;
    const pct = rank / total;
    if (pct <= 0.01) return { title: 'KAGE',        color: '#f56565' };
    if (pct <= 0.05) return { title: 'Jonin Elite',  color: '#fb923c' };
    if (pct <= 0.15) return { title: 'Jonin',        color: '#ffc846' };
    if (pct <= 0.30) return { title: 'Chunin',       color: '#3ecf8e' };
    if (pct <= 0.50) return { title: 'Genin',        color: '#5b9cf6' };
    return { title: I18N.t('rank_academic'), color: '#9ca3af' };
  }

  // Retorna o badge para exibir no perfil (chamado externamente)
  function getRankBadge(rank, total) { return _rankBadge(rank, total); }

  function _unitDots(units) {
    if (!units?.length) return '';
    return units.slice(0, 6).map(id => {
      const rarity = typeof CHARACTERS !== 'undefined' ? (CHARACTERS[id]?.rarity ?? 0) : 0;
      const color  = typeof RARITY_COLORS !== 'undefined' ? (RARITY_COLORS[rarity] || '#555') : '#555';
      return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0"></span>`;
    }).join('');
  }

  function _fmtNum(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _setContent(html) {
    const el = document.getElementById('lb-modal-content');
    if (el) el.innerHTML = html;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return { show, close, setMode, getRankBadge };
})();
