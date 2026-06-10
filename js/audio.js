const AudioManager = (() => {
  // ── Volume state (persisted in localStorage) ─────────────────────────────
  let bgmVol = parseFloat(localStorage.getItem('bp_bgm_vol') ?? '0.45');
  let sfxVol = parseFloat(localStorage.getItem('bp_sfx_vol') ?? '0.65');

  // ── World BGM map ─────────────────────────────────────────────────────────
  const WORLD_BGM = {
    naruto:   'assets/audio/bgm/mundo naruto.mp3',
    onepiece: 'assets/audio/bgm/grand line.mp3',
    bleach:   'assets/audio/bgm/soul society.mp3',
    marvel:   'assets/audio/bgm/nova york.mp3',
    dc:       'assets/audio/bgm/DC.mp3',
  };
  const ALL_BGM_KEYS = Object.keys(WORLD_BGM);

  // ── State ─────────────────────────────────────────────────────────────────
  let menuBgm = new Audio('assets/audio/bgm/menu_theme.mp3');
  menuBgm.loop = true;
  menuBgm.volume = bgmVol;

  let currentBgm  = null;
  let isUnlocked  = false;
  let _lastInfiniteKey = null;

  // ── Per-element fade (no shared timer — solves cancel-before-pause bug) ───

  function _stopFade(audio) {
    if (audio._fadeTimer) { clearInterval(audio._fadeTimer); audio._fadeTimer = null; }
  }

  function _fadeIn(audio, target) {
    _stopFade(audio);
    audio.volume = 0;
    audio._fadeTimer = setInterval(() => {
      const next = Math.min(target, audio.volume + 0.04);
      audio.volume = next;
      if (next >= target) { audio.volume = target; _stopFade(audio); }
    }, 80);
  }

  // fast=true → 300ms fade (used for stopBgm at game-end)
  function _fadeOut(audio, onDone, fast = false) {
    _stopFade(audio);
    const step     = fast ? 0.12 : 0.04;
    const interval = fast ? 60   : 80;
    audio._fadeTimer = setInterval(() => {
      const next = Math.max(0, audio.volume - step);
      audio.volume = next;
      if (next <= 0) {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        _stopFade(audio);
        if (onDone) onDone();
      }
    }, interval);
  }

  // ── Unlock (browser autoplay policy) ──────────────────────────────────────
  function unlock() {
    if (isUnlocked) return;
    isUnlocked = true;
    if (!currentBgm || currentBgm === menuBgm) playMenuBgm();
  }

  // ── Menu BGM ──────────────────────────────────────────────────────────────
  function playMenuBgm() {
    if (!isUnlocked) return;
    if (currentBgm === menuBgm && !menuBgm.paused) return;

    if (currentBgm && currentBgm !== menuBgm) {
      // Don't touch currentBgm here — it's already being faded out by stopBgm
      menuBgm.currentTime = 0;
      menuBgm.play().catch(() => {});
      _fadeIn(menuBgm, bgmVol);
    } else {
      currentBgm = menuBgm;
      menuBgm.play().catch(() => {});
      _fadeIn(menuBgm, bgmVol);
    }
    currentBgm = menuBgm;
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
    const prev = currentBgm;
    const audio = new Audio(src);
    audio.loop    = !!loop;
    audio.volume  = 0;
    currentBgm    = audio;
    audio.play().catch(() => {});
    _fadeIn(audio, bgmVol);
    // Fade out previous (each element owns its own timer — no conflict)
    if (prev) _fadeOut(prev);
  }

  // ── Infinite mode: shuffle without consecutive repeat ─────────────────────
  function _pickInfiniteKey() {
    const pool = ALL_BGM_KEYS.filter(k => k !== _lastInfiniteKey);
    const key  = pool[Math.floor(Math.random() * pool.length)];
    _lastInfiniteKey = key;
    return key;
  }

  function _playInfinite() {
    const prev = currentBgm;
    _doInfiniteTrack();
    if (prev && prev !== currentBgm) _fadeOut(prev);
  }

  function _doInfiniteTrack() {
    const key   = _pickInfiniteKey();
    const audio = new Audio(WORLD_BGM[key]);
    audio.loop  = false;
    audio.volume = 0;
    currentBgm   = audio;
    audio.play().catch(() => {});
    _fadeIn(audio, bgmVol);
    audio.addEventListener('ended', () => {
      if (currentBgm === audio) _doInfiniteTrack();
    }, { once: true });
  }

  // ── Stop BGM (called on match end) — fast fade, independent of menu ───────
  function stopBgm() {
    if (!currentBgm || currentBgm === menuBgm) return;
    const prev = currentBgm;
    currentBgm = null;
    _fadeOut(prev, null, true); // fast 300ms fade, no callback
  }

  function pauseBgm() { if (currentBgm) currentBgm.pause(); }

  // ── SFX ───────────────────────────────────────────────────────────────────
  function playSFX(url, volume) {
    if (!isUnlocked) return;
    const sfx = new Audio(url);
    sfx.volume = Math.min(1, (volume ?? 1) * sfxVol);
    sfx.play().catch(() => {});
  }

  function playClick() { playSFX('assets/audio/sfx/click sound.mp3', 0.55); }
  function playHover() { playSFX('assets/audio/sfx/click sound.mp3', 0.20); }

  function playGachaPull()         { playSFX('assets/audio/sfx/gacha_pull.wav',         0.9); }
  function playGachaReveal(rarity) {
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
    // Apply immediately to whatever is playing — stop any in-progress fade first
    if (currentBgm) { _stopFade(currentBgm); currentBgm.volume = bgmVol; }
    _stopFade(menuBgm); menuBgm.volume = bgmVol;
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
    if (bgmLabel)  bgmLabel.textContent = Math.round(bgmVol * 100) + '%';
    if (sfxLabel)  sfxLabel.textContent = Math.round(sfxVol * 100) + '%';
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
