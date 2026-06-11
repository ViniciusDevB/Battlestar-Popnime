// js/online.js — Camada online do ASTD. Única referência ao Supabase no projeto.
// Requer: data/online_config.js (SUPABASE_URL, SUPABASE_ANON_KEY) carregado antes.

const Online = (() => {
  let _client          = null;
  let _session         = null;
  let _profile         = null;
  let _ready           = false;
  let _profilePromise  = null;   // Promise pendente de _loadProfile (evita race condition)
  let _activeMission   = null;
  let _missionChannel  = null;
  let _tradesChannel   = null;
  let _onReadyCb       = null;   // Callback único disparado após 1ª resolução do auth state
  let _authResolved    = false;

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    if (typeof supabase === 'undefined' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Online] Supabase SDK ou config não encontrados. Modo offline.');
      return false;
    }
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Registra callback para enviar violações ao servidor via Edge Function
    if (typeof Integrity !== 'undefined') {
      Integrity.setServerViolationCallback(async (type, detail) => {
        if (!_ready || !_session) return;
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/log-violation`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${_session.access_token}`,
            },
            body: JSON.stringify({ violation_type: type, detail }),
          });
        } catch {}
      });
    }

    _client.auth.onAuthStateChange((event, session) => {
      _session = session;
      if (session) {
        _profilePromise = _loadProfile().then(async () => {
          // INITIAL_SESSION = sessão restaurada no refresh/reload da página.
          // login() e register() já chamam syncSave() explicitamente para logins novos,
          // mas no refresh o syncSave() nunca era chamado — save ficava zerado.
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') await syncSave();
          _profilePromise = null;
          _showOnlineStatus(true);
          _setupRealtime();
          if (!_authResolved) {
            _authResolved = true;
            if (_onReadyCb) { const cb = _onReadyCb; _onReadyCb = null; cb(true); }
          } else if (event === 'SIGNED_IN') {
            // Re-login após logout: onReadyCb já foi consumido, navegar diretamente para o hub
            if (typeof UI !== 'undefined') {
              const loginScr = document.getElementById('screen-login');
              if (loginScr && loginScr.classList.contains('active')) {
                UI.showHub();
              }
              UI.updateCurrencyDisplay();
            }
          }
        });
      } else {
        _profile        = null;
        _profilePromise = null;
        Save.reset();
        _showOnlineStatus(false);
        if (!_authResolved) {
          _authResolved = true;
          if (_onReadyCb) { const cb = _onReadyCb; _onReadyCb = null; cb(false); }
        } else {
          // Sessão encerrada (logout do usuário ou expiração de token).
          // 1. Fecha o modal de perfil se estiver aberto.
          // 2. Para o jogo se estiver rodando (evita loop órfão sem sessão).
          // 3. Exibe a tela de login obrigatória.
          const modal = document.getElementById('online-modal');
          if (modal) modal.style.display = 'none';
          if (typeof Game !== 'undefined' && typeof Game.forceStop === 'function') Game.forceStop();
          if (typeof LoginScreen !== 'undefined') LoginScreen.show();
        }
      }
    });
    // Opção A: sem sync periódico. Cada mutação vai direto ao banco via RPC
    // e aplica o estado retornado. O syncSave() só roda no login/F5.

    _ready = true;
    return true;
  }

  function isReady()    { return _ready; }
  function isLoggedIn() { return !!_session; }
  function getProfile() { return _profile; }

  // Chama cb(hasSession) assim que o estado inicial de auth é determinado.
  // Se já foi resolvido, chama imediatamente.
  function onReady(cb) {
    if (_authResolved) { cb(!!_session); return; }
    _onReadyCb = cb;
  }
  function getSession() { return _session; }

  // Aguarda o carregamento do perfil (timeout de 6s para evitar loading infinito)
  async function waitForProfile() {
    if (_profile) return _profile;
    if (_profilePromise) {
      const timeout = new Promise(resolve => setTimeout(resolve, 6000));
      await Promise.race([_profilePromise, timeout]);
    }
    return _profile;
  }

  async function refreshProfile() {
    return _loadProfile();
  }

  function _showOnlineStatus(loggedIn) {
    const el = document.getElementById('online-status-bar');
    if (!el) return;
    if (loggedIn && _profile) {
      if (_profile.is_admin) {
        el.textContent = `♛ ${_profile.username}`;
        el.style.color = '#fbbf24';
      } else {
        el.textContent = `● ${_profile.username}`;
        el.style.color = '#39FF14';
      }
    } else {
      el.textContent = '○ Offline';
      el.style.color = '#6b7280';
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  // Gera email sintético interno — o usuário nunca vê nem precisa de uma caixa de entrada real.
  function _syntheticEmail(username) {
    return username.toLowerCase().replace(/[^a-z0-9_]/g, '') + '@astd.game';
  }

  async function register(username, password) {
    if (!_ready) return { error: 'offline' };
    username = username.trim();
    if (username.length < 3 || username.length > 20) {
      return { error: I18N.t('online_enter_username') };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { error: I18N.t('online_username_format') };
    }
    if (!password || password.length < 6) {
      return { error: I18N.t('online_password_short') };
    }

    const { data, error } = await _client.auth.signUp({
      email:    _syntheticEmail(username),
      password,
      options:  { data: { username } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: I18N.t('online_unexpected_error') };

    if (data.session) {
      _session = data.session;
      await _loadProfile();
      await syncSave();
      return { ok: true };
    }

    // Confirmação de email ativa — não deve acontecer em dev, mas trata o caso
    return { ok: true, needsConfirmation: true };
  }

  async function login(username, password) {
    if (!_ready) return { error: 'offline' };
    const { data, error } = await _client.auth.signInWithPassword({
      email:    _syntheticEmail(username.trim()),
      password,
    });
    if (error) return { error: error.message };
    _session = data.session;
    await _loadProfile();
    if (_profile?.banned) {
      await _client.auth.signOut();
      _session = null; _profile = null;
      return { error: I18N.t('online_suspended') };
    }
    // Admin: desativa envio de violações ao servidor
    // (inventário concedido dentro de syncSave para admin)
    if (_profile?.is_admin) {
      if (typeof Integrity !== 'undefined') Integrity.setServerViolationCallback(null);
    }
    return { ok: true };
  }

  async function logout() {
    if (!_ready) return;
    await _client.auth.signOut();
    _session = null;
    _profile = null;
    Save.reset(); // limpa memória para não contaminar próxima conta
    _showOnlineStatus(false);
  }

  async function resetAccount() {
    if (!_ready || !_session || !_profile) return;
    // Delete the player's save row so next login starts fresh
    await _client.from('saves').delete().eq('player_id', _profile.id);
    await _client.auth.signOut();
    _session = null;
    _profile = null;
    _showOnlineStatus(false);
  }

  async function _loadProfile() {
    if (!_session) return null;
    const { data, error } = await _client
      .from('players')
      .select('*')
      .eq('auth_id', _session.user.id)
      .single();
    if (!error && data) {
      _profile = data;
      (async () => { try { await _client.rpc('update_my_last_seen'); } catch (_) {} })();
    }
    return _profile;
  }

  // ── Save Sync ─────────────────────────────────────────────────────────────
  // O cliente envia o save local completo. fn_sync_progress descarta os campos
  // econômicos (gemas, tickets, inventario, pity_contador) e mantém os valores
  // autoritativos do banco. Só progresso (stats, fases, missões) é mesclado.

  async function syncSave() {
    if (!_ready || !_session || !_profile) return { ok: false, reason: 'not_logged_in' };
    const sessionUserId = _session.user.id;

    try {
      const { data, error } = await _client.rpc('fn_sync_progress', {
        p_progress: Save.get(),
      });
      if (error) return { ok: false, reason: error.message };
      if (data?.error) return { ok: false, reason: data.error };
      // Descarta resposta se a sessão mudou enquanto o RPC estava em andamento
      if (_session?.user.id !== sessionUserId) return { ok: false, reason: 'session_changed' };
      if (data?.save) {
        Save._mergeData(data.save);
        if (_profile.is_admin) {
          _grantAdminInventory();
        } else {
          // Seed starter items for brand-new accounts (server returns empty save)
          await _seedNewAccount();
        }
      }
      return { ok: true };
    } catch (e) {
      console.warn('[Online] syncSave error:', e);
      return { ok: false, reason: e.message };
    }
  }

  // ── Score / Leaderboard (Phase 3 — stubs funcionais) ─────────────────────

  let _lastScorePost = 0;

  async function postScore(scoreData) {
    if (!_ready || !_session || !_profile) return { ok: false, reason: 'not_logged_in' };
    if (_profile.is_admin) return { ok: false, reason: 'admin_excluded' };
    try {
      Integrity.assertCleanOrThrow();
    } catch {
      return { ok: false, reason: 'integrity_violation' };
    }
    // Rate limit client-side: mínimo 30s entre submissões
    const now = Date.now();
    if (now - _lastScorePost < 30_000) return { ok: false, reason: 'rate_limit' };
    _lastScorePost = now;
    const payload = {
      player_id:    _profile.id,
      mode:         scoreData.mode,
      stage_id:     scoreData.stage_id     || null,
      difficulty:   scoreData.difficulty   || null,
      score:        scoreData.score        || 0,
      wave:         scoreData.wave         || null,
      damage:       scoreData.damage       || 0,
      duration_s:   scoreData.duration_s   || 0,
      units_used:   scoreData.units_used   || [],
      flagged:      false,
    };
    const { error } = await _client.from('scores').insert(payload);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchLeaderboard(mode, limit = 50) {
    if (!_ready) return [];
    let q = _client
      .from('scores')
      .select('score, wave, damage, duration_s, units_used, players(username, avatar_unit, is_admin)')
      .eq('flagged', false)
      .limit(limit);

    if (mode === 'infinite' || mode === 'infinite_wave') {
      q = q.eq('mode', 'infinite')
           .order('wave',   { ascending: false, nullsFirst: false })
           .order('damage', { ascending: false });
    } else if (mode === 'infinite_dmg') {
      q = q.eq('mode', 'infinite')
           .order('damage', { ascending: false });
    } else if (mode === 'stage') {
      q = q.eq('mode', 'stage')
           .order('score', { ascending: false });
    } else {
      q = q.eq('mode', mode).order('score', { ascending: false });
    }

    const { data, error } = await q;
    if (error) { console.warn('[Online] fetchLeaderboard:', error.message); return []; }
    return (data || []).filter(e => !e.players?.is_admin);
  }

  async function fetchMyRank(mode) {
    if (!_ready || !_profile) return null;
    if (_profile.is_admin) return null;
    const dbMode = (mode === 'infinite_dmg') ? 'infinite' : mode;
    const { data, error } = await _client.rpc('get_player_rank', {
      p_player_id: _profile.id,
      p_mode:      dbMode,
    });
    if (error) { console.warn('[Online] fetchMyRank:', error.message); return null; }
    return data?.[0] || null;
  }

  // ── Trades ────────────────────────────────────────────────────────────────

  async function fetchOpenTrades(filters = {}) {
    if (!_ready) return [];
    const select = '*, offerer:players!offerer_id(id, username, avatar_unit)';

    if (filters.my_offers) {
      // Minhas ofertas — todos os status relevantes
      if (!_profile) return [];
      const { data } = await _client
        .from('trades')
        .select(select)
        .eq('offerer_id', _profile.id)
        .in('status', ['open', 'completed', 'cancelled', 'expired'])
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    }

    let q = _client
      .from('trades')
      .select(select)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    if (filters.wanted_unit_id) q = q.eq('wanted_unit_id', filters.wanted_unit_id);
    const { data } = await q;
    return data || [];
  }

  // offeredUnitUids: string[]  — UIDs das unidades oferecidas
  // offeredUnitIds:  string[]  — charIds das unidades (para display no banco)
  // wantedUnitIds:   string[]  — charIds pedidos em troca (vazio = qualquer)
  async function createTrade(offeredUnitUids, offeredUnitIds, wantedUnitIds, message) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };
    if (!Integrity.isCleanForTrades()) return { error: 'integrity_violation' };

    for (const uid of offeredUnitUids) {
      if (Save.isUnitLocked(uid)) return { error: I18N.t('online_trade_duplicate') };
    }

    const { count } = await _client.from('trades')
      .select('id', { count: 'exact', head: true })
      .eq('offerer_id', _profile.id)
      .eq('status', 'open');
    if ((count || 0) >= 5) return { error: I18N.t('online_trade_limit') };

    const { data, error } = await _client.from('trades').insert({
      offerer_id:        _profile.id,
      offered_unit_uids: offeredUnitUids,
      offered_unit_ids:  offeredUnitIds,
      wanted_unit_ids:   wantedUnitIds?.length ? wantedUnitIds : [],
      message:           message || null,
    }).select('id').single();
    if (error) return { error: error.message };

    offeredUnitUids.forEach(uid => Save.lockUnit(uid));
    return { ok: true, tradeId: data?.id };
  }

  // acceptedUnitUids: string[]  — UIDs das unidades que o aceitante entrega
  async function acceptTrade(tradeId, acceptedUnitUids = []) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };
    if (!Integrity.isCleanForTrades()) return { error: 'integrity_violation' };

    for (const uid of acceptedUnitUids) {
      if (Save.isUnitLocked(uid)) return { error: I18N.t('online_trade_duplicate') };
    }

    const { data, error } = await _client.rpc('accept_trade', {
      p_trade_id:           tradeId,
      p_accepted_unit_uids: acceptedUnitUids.length ? acceptedUnitUids : null,
    });
    if (error) return { error: error.message };
    if (data !== 'ok') return { error: data };

    await syncSave();
    if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
    return { ok: true };
  }

  async function cancelTrade(tradeId, offeredUnitUids = []) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };

    // Fetch UIDs from DB if not supplied (cache miss or empty cache)
    let uids = offeredUnitUids.length ? offeredUnitUids : [];
    if (!uids.length) {
      const { data: td } = await _client
        .from('trades').select('offered_unit_uids').eq('id', tradeId).single();
      uids = td?.offered_unit_uids || [];
    }

    const { error } = await _client.from('trades')
      .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
      .eq('id', tradeId)
      .eq('offerer_id', _profile.id)
      .eq('status', 'open');
    if (error) return { error: error.message };

    uids.forEach(uid => Save.unlockUnit(uid));

    // Push updated save to remote so future syncSave calls don't restore in_trade:true
    try { await _pushSave(Save.get()); } catch {}

    return { ok: true };
  }

  // Realtime: notifica quando uma troca do jogador é completada
  function _setupRealtime() {
    if (!_client || !_profile) return;
    // Remove canal anterior antes de reinscrever (evita erro ao reautenticar)
    if (_tradesChannel) {
      _client.removeChannel(_tradesChannel);
      _tradesChannel = null;
    }
    _tradesChannel = _client
      .channel('trade-notifications')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'trades',
        filter: `offerer_id=eq.${_profile.id}`,
      }, (payload) => {
        if (payload.new?.status === 'completed') {
          if (typeof UI !== 'undefined') {
            UI.toast(I18N.t('online_trade_accepted'), 5000);
          }
          syncSave().then(() => {
            if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
            if (typeof TradesUI !== 'undefined') TradesUI.refresh();
          });
        }
      })
      .subscribe();
  }

  // ── Community Missions (Phase 5) ─────────────────────────────────────────

  // Busca missão ativa OU recentemente concluída (últimos 7 dias, para resgate).
  // Ordena: ativa primeiro (completed=false < true), depois mais recente.
  async function fetchActiveMission() {
    if (!_ready) return null;
    const now        = new Date().toISOString();
    const recentPast = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await _client.from('community_missions')
      .select('*')
      .lte('starts_at', now)
      .gte('ends_at',   recentPast)
      .order('completed',  { ascending: true  })
      .order('starts_at',  { ascending: false })
      .limit(1)
      .single();
    _activeMission = data || null;
    if (_activeMission && !_activeMission.completed) {
      _setupMissionRealtime(_activeMission.id);
    }
    return _activeMission;
  }

  function getActiveMission() { return _activeMission; }

  async function fetchUpcomingMissions() {
    if (!_ready) return [];
    const now = new Date().toISOString();
    const { data } = await _client.from('community_missions')
      .select('*')
      .gt('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(3);
    return data || [];
  }

  async function fetchMissionContribution(missionId) {
    if (!_ready || !_session || !_profile) return null;
    const { data } = await _client
      .from('community_contributions')
      .select('value, claimed_at')
      .eq('mission_id', missionId)
      .eq('player_id',  _profile.id)
      .single();
    return data || null;
  }

  async function claimMissionReward(missionId) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };
    const { data, error } = await _client.rpc('claim_mission_reward', {
      p_mission_id: missionId,
    });
    if (error) return { error: error.message };
    if (data !== 'ok') return { error: data };
    await syncSave();
    if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
    return { ok: true };
  }

  async function contributeToMission(missionId, value) {
    if (!_ready || !_session) return;
    if (!Integrity.isClean()) return;
    await _client.rpc('contribute_to_mission', {
      p_mission_id: missionId,
      p_value:      value,
    });
  }

  function _setupMissionRealtime(missionId) {
    if (_missionChannel) _client.removeChannel(_missionChannel);
    _missionChannel = _client
      .channel('community-mission-' + missionId)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'community_missions',
        filter: `id=eq.${missionId}`,
      }, (payload) => {
        _activeMission = { ..._activeMission, ...payload.new };
        if (typeof MissionsUI !== 'undefined') {
          MissionsUI.onMissionUpdate(_activeMission);
        }
      })
      .subscribe();
  }

  // ── Inventory Sync ───────────────────────────────────────────────────────
  // Envia o inventário atual ao servidor e aplica o estado canônico retornado.
  // O servidor é a fonte de verdade: o que ele devolver substitui o estado local.
  async function updateInventory() {
    if (!_ready || !_session || !_profile) return { ok: false };
    try {
      const d = Save.get();
      const { data, error } = await _client.rpc('fn_update_inventory', {
        p_inventory:     d.inventario,
        p_relic_stash:   d.relicStash   || [],
        p_nexus_structs: d.nexus?.structures || {},
      });
      if (error) { console.warn('[Online] updateInventory:', error.message); return { ok: false }; }
      if (data?.error) return { ok: false };
      // Aplica o estado canônico do servidor (preserva economia/inventário correto)
      if (data?.save) {
        Save._setData(data.save);
        if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
      }
      return { ok: true };
    } catch (e) {
      console.warn('[Online] updateInventory error:', e);
      return { ok: false };
    }
  }

  // ── Nexus Upgrade (Opção A — server-authoritative) ────────────────────────
  // Valida gemas e aplica o upgrade no servidor; aplica o save retornado.
  async function upgradeNexus(structId) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };
    try {
      const { data, error } = await _client.rpc('fn_upgrade_nexus', {
        p_struct_id: structId,
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      if (data?.save) {
        Save._setData(data.save);
        if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
      }
      return { ok: true };
    } catch (e) {
      console.warn('[Online] upgradeNexus error:', e);
      return { error: e.message };
    }
  }

  // ── Relic Craft (Opção A — server-authoritative) ──────────────────────────
  // Valida materiais, aplica o craft no servidor (RNG server-side), aplica save.
  async function craftRelic(relicId, materials) {
    if (!_ready || !_session || !_profile) return { error: 'not_logged_in' };
    try {
      const { data, error } = await _client.rpc('fn_craft_relic', {
        p_relic_id:  relicId,
        p_materials: materials,
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error, material: data.material };
      if (data?.save) {
        Save._setData(data.save);
        if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
      }
      return { ok: true, isCorrupted: !!data?.isCorrupted };
    } catch (e) {
      console.warn('[Online] craftRelic error:', e);
      return { error: e.message };
    }
  }

  // ── Stage / Mission RPCs ──────────────────────────────────────────────────

  // Notifica o servidor que uma fase foi concluída. O servidor valida o tempo,
  // concede as gemas e rola os drops. Retorna { ok, gems_granted, drops, save }.
  async function completeStage(stageId, difficulty, durationS, bossKilled = false) {
    if (!_ready || !_session) return { error: 'not_logged_in' };
    try {
      const { data, error } = await _client.rpc('fn_complete_stage', {
        p_stage_id:    stageId,
        p_difficulty:  difficulty,
        p_duration_s:  Math.max(0, Math.round(durationS)),
        p_boss_killed: !!bossKilled,
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return data;
    } catch (e) {
      return { error: e.message };
    }
  }

  // Resgata recompensa de missão no servidor (conquista ou diária).
  // p_date: null = conquista; 'YYYY-MM-DD' = diária (usa data local do cliente).
  async function claimReward(missionId, date = null) {
    if (!_ready || !_session) return { error: 'not_logged_in' };
    try {
      const { data, error } = await _client.rpc('fn_claim_reward', {
        p_mission_id: missionId,
        p_date:       date,
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return data;
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Gacha RPC ─────────────────────────────────────────────────────────────

  // Chama fn_gacha_pull no banco: validação, sorteio e gravação do save acontecem
  // no servidor. Retorna { ok, results[], new_pity, new_gems, new_tickets, save }
  // ou { error: 'motivo' }.
  async function gachaPull(qty, currency) {
    if (!_ready || !_session) return { error: 'not_logged_in' };
    try {
      const { data, error } = await _client.rpc('fn_gacha_pull', {
        p_qty:      qty,
        p_currency: currency,
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return data;
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Admin helpers ──────────────────────────────────────────────────────────

  function _grantAdminInventory() {
    if (typeof CHARACTERS === 'undefined' || typeof Save === 'undefined') return;

    const d = Save.get();
    if (!d) return;
    if (!d.inventario) d.inventario = { unidades: [], materiais: [] };
    if (!d.stats)      d.stats = {};

    // Build lookup maps for O(1) checks
    const existingIds = new Set(d.inventario.unidades.map(u => u.id));
    const matsMap     = new Map(d.inventario.materiais.map(m => [m.id, m]));
    const _uid        = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

    Object.values(CHARACTERS).forEach(c => {
      if (!c.id) return;
      if (c.playable === false) {
        // Material — set to 999
        if (matsMap.has(c.id)) {
          matsMap.get(c.id).quantidade = 999;
        } else {
          const m = { id: c.id, quantidade: 999 };
          d.inventario.materiais.push(m);
          matsMap.set(c.id, m);
        }
      } else {
        // Playable character — ensure at max level
        if (!existingIds.has(c.id)) {
          d.inventario.unidades.push({ uid: _uid(), id: c.id, nivel: c.max_level || 50, xp_atual: 0 });
          existingIds.add(c.id);
        } else {
          const u = d.inventario.unidades.find(x => x.id === c.id);
          if (u) u.nivel = Math.max(u.nivel || 1, c.max_level || 50);
        }
      }
    });

    d.gemas   = 999999;
    d.tickets = 9999;

    // Set pulls_realizados high so integrity plausibility check never flags
    // unidades_excedentes (which would trigger the "save modified" toast on next load)
    d.stats.pulls_realizados = Math.max(d.stats.pulls_realizados || 0, 99999);

    // Single save call — one HMAC seal, no race between multiple async seals
    Save.save();
    if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
  }

  // ── Push full save to server (online-only model) ──────────────────────────
  // Direct upsert to saves table — bypasses fn_sync_progress so inventory/gems
  // are written as-is. Used for new-account seeding and periodic/beforeunload push.
  async function _pushSave(saveData) {
    if (!_ready || !_session || !_profile) return;
    try {
      const clean = { ...saveData };
      delete clean._ownerId;
      const { error } = await _client
        .from('saves')
        .upsert(
          { player_id: _profile.id, data: clean, updated_at: new Date().toISOString() },
          { onConflict: 'player_id' }
        );
      if (error) console.warn('[Online] _pushSave:', error.message);
    } catch (e) {
      console.warn('[Online] _pushSave error:', e);
    }
  }

  function _pushSaveBeacon(saveData) {
    if (!_ready || !_session || !_profile) return;
    try {
      const clean = { ...saveData };
      delete clean._ownerId;
      const url = `${SUPABASE_URL}/rest/v1/saves?on_conflict=player_id`;
      const body = JSON.stringify({ player_id: _profile.id, data: clean, updated_at: new Date().toISOString() });
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: body,
        keepalive: true
      });
    } catch (e) {
      console.warn('[Online] _pushSaveBeacon error:', e);
    }
  }

  // Exposed wrapper — called by main.js on beforeunload
  async function pushSave() { return _pushSave(Save.get()); }
  function pushSaveBeacon() { return _pushSaveBeacon(Save.get()); }

  // Grants starter items to brand-new accounts (no units, no pulls).
  // Called after syncSave() applies the server save.
  async function _seedNewAccount() {
    if (typeof Save === 'undefined') return;
    const d = Save.get();
    const isNew = (!d.inventario?.unidades?.length) && (!(d.stats?.pulls_realizados));
    if (!isNew) return;

    if (typeof BannerSystem !== 'undefined') {
      const banner = BannerSystem.getCurrent();
      if (banner?.star3) banner.star3.forEach(id => Save.addUnit(id, 1, 0));
    }

    Save.addMaterial('ninja_generico_1', 5);
    Save.addMaterial('ninja_generico_2', 2);
    if (d.gemas < 500) d.gemas = 500;

    await _pushSave(Save.get());
    if (typeof UI !== 'undefined') UI.updateCurrencyDisplay();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    init, isReady, isLoggedIn, getProfile, getSession, onReady,
    waitForProfile, refreshProfile,
    register, login, logout, resetAccount,
    syncSave, updateInventory, upgradeNexus, craftRelic,
    pushSave, pushSaveBeacon, gachaPull, completeStage, claimReward,
    postScore, fetchLeaderboard, fetchMyRank,
    fetchOpenTrades, createTrade, acceptTrade, cancelTrade,
    fetchActiveMission, fetchUpcomingMissions, getActiveMission, contributeToMission,
    fetchMissionContribution, claimMissionReward,
  };
})();
