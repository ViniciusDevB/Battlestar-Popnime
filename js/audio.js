const AudioManager = (() => {
  // ── Volume state (persisted in localStorage) ─────────────────────────────
  let bgmVol = parseFloat(localStorage.getItem('bp_bgm_vol') ?? '0.45');
  let sfxVol = parseFloat(localStorage.getItem('bp_sfx_vol') ?? '0.65');

  // ── World BGM map ─────────────────────────────────────────────────────────
  const WORLD_BGM = {
    naruto:  'assets/audio/bgm/mundo naruto.mp3',
    onepiece:'assets/audio/bgm/grand line.mp3',
    bleach:  'assets/audio/bgm/soul society.mp3',
    marvel:  'assets/audio/bgm/nova york.mp3',
    dc:      'assets/audio/bgm/DC.mp3',
  };
  const ALL_BGM_KEYS = Object.keys(WORLD_BGM);

  // ── State ─────────────────────────────────────────────────────────────────
  let menuBgm = new Audio('assets/audio/bgm/menu_theme.mp3');
  menuBgm.loop = true;
  menuBgm.volume = bgmVol;

  let currentBgm = null;
  let isUnlocked  = false;
  let _fadeTimer  = null;
  let _lastInfiniteKey = null; // prevent same track twice in a row

  // ── Unlock (browser autoplay policy) ──────────────────────────────────────
  function unlock() {
    if (isUnlocked) return;
    isUnlocked = true;
    if (!currentBgm || currentBgm === menuBgm) playMenuBgm();
  }

  // ── Fade helpers ───────────────────────────────────────────────────────────
  function _clearFade() {
    if (_fadeTimer) { clearInterval(_fadeTimer); _fadeTimer = null; }
  }

  function _fadeIn(audio, target, step = 0.04, interval = 80) {
    _clearFade();
    audio.volume = 0;
    _fadeTimer = setInterval(() => {
      if (audio.volume < target - step) {
        audio.volume = Math.min(target, audio.volume + step);
      } else {
        audio.volume = target;
        _clearFade();
      }
    }, interval);
  }

  function _fadeOut(audio, onDone, step = 0.05, interval = 80) {
    _clearFade();
    _fadeTimer = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step);
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        _clearFade();
        if (onDone) onDone();
      }
    }, interval);
  }

  // ── Menu BGM ──────────────────────────────────────────────────────────────
  function playMenuBgm() {
    if (!isUnlocked) return;
    if (currentBgm === menuBgm && !menuBgm.paused) return;

    if (currentBgm && currentBgm !== menuBgm) {
      const prev = currentBgm;
      currentBgm = menuBgm;
      _fadeOut(prev, () => {
        menuBgm.play().catch(() => {});
        _fadeIn(menuBgm, bgmVol);
      });
    } else {
      currentBgm = menuBgm;
      menuBgm.play().catch(() => {});
      _fadeIn(menuBgm, bgmVol);
    }
  }

  // ── World BGM ─────────────────────────────────────────────────────────────
  function playWorldBgm(worldId) {
    if (!isUnlocked) return;
    if (worldId === 'infinito') { _playInfinite(); return; }

    const src = WORLD_BGM[worldId];
    if (!src) { stopBgm(); return; }

    _startTrack(src, true);
  }

  function _startTrack(src, loop) {
    _clearFade();
    if (currentBgm) {
      const prev = currentBgm;
      currentBgm = null;
      _fadeOut(prev, () => _doPlay(src, loop));
    } else {
      _doPlay(src, loop);
    }
  }

  function _doPlay(src, loop) {
    const audio = new Audio(src);
    audio.loop = !!loop;
    audio.volume = 0;
    currentBgm = audio;
    audio.play().catch(() => {});
    _fadeIn(audio, bgmVol);
    return audio;
  }

  // ── Infinite mode: shuffle, no repeat ─────────────────────────────────────
  function _pickInfiniteKey() {
    const pool = ALL_BGM_KEYS.filter(k => k !== _lastInfiniteKey);
    const key  = pool[Math.floor(Math.random() * pool.length)];
    _lastInfiniteKey = key;
    return key;
  }

  function _playInfinite() {
    _clearFade();
    if (currentBgm) {
      const prev = currentBgm;
      currentBgm = null;
      _fadeOut(prev, _doInfiniteTrack);
    } else {
      _doInfiniteTrack();
    }
  }

  function _doInfiniteTrack() {
    const key   = _pickInfiniteKey();
    const audio = new Audio(WORLD_BGM[key]);
    audio.loop  = false;
    audio.volume = 0;
    currentBgm  = audio;
    audio.play().catch(() => {});
    _fadeIn(audio, bgmVol);
    audio.addEventListener('ended', () => {
      if (currentBgm === audio) _doInfiniteTrack();
    }, { once: true });
  }

  // ── Stop BGM (called on match end) ────────────────────────────────────────
  function stopBgm() {
    if (!currentBgm || currentBgm === menuBgm) return;
    const prev = currentBgm;
    currentBgm = null;
    _fadeOut(prev);
  }

  function pauseBgm() { if (currentBgm) currentBgm.pause(); }

  // ── SFX ───────────────────────────────────────────────────────────────────
  function playSFX(url, volume) {
    if (!isUnlocked) return;
    const sfx = new Audio(url);
    sfx.volume = Math.min(1, (volume ?? 1) * sfxVol);
    sfx.play().catch(() => {});
  }

  function playClick()  { playSFX('assets/audio/sfx/click sound.mp3', 0.55); }
  function playHover()  { playSFX('assets/audio/sfx/click sound.mp3', 0.22); }

  function playGachaPull()          { playSFX('assets/audio/sfx/gacha_pull.wav',          0.9); }
  function playGachaReveal(rarity)  {
    playSFX(
      rarity >= 5
        ? 'assets/audio/sfx/gacha_reveal_5star.wav'
        : 'assets/audio/sfx/gacha_reveal.wav',
      rarity >= 5 ? 1.0 : 0.85
    );
  }

  // ── Volume control ────────────────────────────────────────────────────────
  function setBgmVolume(v) {
    bgmVol = Math.max(0, Math.min(1, v));
    localStorage.setItem('bp_bgm_vol', bgmVol);
    if (currentBgm) currentBgm.volume = bgmVol;
    menuBgm.volume = bgmVol;
    _syncVolumeUI();
  }

  function setSfxVolume(v) {
    sfxVol = Math.max(0, Math.min(1, v));
    localStorage.setItem('bp_sfx_vol', sfxVol);
    _syncVolumeUI();
  }

  function getBgmVolume() { return bgmVol; }
  function getSfxVolume() { return sfxVol; }

  function _syncVolumeUI() {
    const bgmSlider = document.getElementById('vol-bgm');
    const sfxSlider = document.getElementById('vol-sfx');
    const bgmLabel  = document.getElementById('vol-bgm-label');
    const sfxLabel  = document.getElementById('vol-sfx-label');
    if (bgmSlider) bgmSlider.value = bgmVol;
    if (sfxSlider) sfxSlider.value = sfxVol;
    if (bgmLabel)  bgmLabel.textContent  = Math.round(bgmVol * 100) + '%';
    if (sfxLabel)  sfxLabel.textContent  = Math.round(sfxVol * 100) + '%';
  }

  function toggleVolumePanel() {
    const panel = document.getElementById('vol-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    if (open) _syncVolumeUI();
  }

  // Close panel when clicking outside
  document.addEventListener('click', e => {
    const panel = document.getElementById('vol-panel');
    const btn   = document.getElementById('vol-btn');
    if (!panel) return;
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  });

  // Unlock on first interaction
  document.addEventListener('click', unlock, { once: true });

  return {
    unlock,
    playMenuBgm,
    playWorldBgm,
    stopBgm,
    pauseBgm,
    playSFX,
    playClick,
    playHover,
    playGachaPull,
    playGachaReveal,
    setBgmVolume,
    setSfxVolume,
    getBgmVolume,
    getSfxVolume,
    toggleVolumePanel,
  };
})();
