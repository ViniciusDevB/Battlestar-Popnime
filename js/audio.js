const AudioManager = (() => {
  // Inicializamos a música do menu
  let menuBgm = new Audio('assets/audio/bgm/menu_theme.mp3');
  menuBgm.loop = true;
  menuBgm.volume = 0.4; // Volume agradável para não enjoar

  let currentBgm = null;
  let isUnlocked = false;

  // O navegador exige uma interação para tocar áudio.
  function unlock() {
    if (isUnlocked) return;
    isUnlocked = true;
    
    // Tenta tocar o BGM do menu se ainda não tiver nenhum tocando
    if (!currentBgm || currentBgm === menuBgm) {
      playMenuBgm();
    }
  }

  function playMenuBgm() {
    if (!isUnlocked) return;
    
    // Se tiver outra música tocando (ex: boss), pausa ela
    if (currentBgm && currentBgm !== menuBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }
    
    currentBgm = menuBgm;
    menuBgm.play().catch(e => console.warn('Autoplay prevenido:', e));
  }

  function pauseBgm() {
    if (currentBgm) {
      currentBgm.pause();
    }
  }

  // Toca efeitos sonoros usando HTMLAudioElement (simples)
  function playSFX(url, volume = 0.6) {
    if (!isUnlocked) return;
    const sfx = new Audio(url);
    sfx.volume = volume;
    sfx.play().catch(e => {});
  }

  function playGachaPull() {
    playSFX('assets/audio/sfx/gacha_pull.mp3', 0.8);
  }

  function playGachaReveal(rarity) {
    // Pode ter sons diferentes por raridade no futuro se quiser
    if (rarity === 5) {
      playSFX('assets/audio/sfx/gacha_reveal_5star.mp3', 1.0);
    } else {
      playSFX('assets/audio/sfx/gacha_reveal.mp3', 0.8);
    }
  }

  // Destrava o áudio no primeiro clique em qualquer lugar da tela
  document.addEventListener('click', unlock, { once: true });

  return {
    playMenuBgm,
    pauseBgm,
    playSFX,
    playGachaPull,
    playGachaReveal,
    unlock
  };
})();
