const AudioManager = (() => {
  // Inicializamos a música do menu
  let menuBgm = new Audio('assets/audio/bgm/menu_theme.wav');
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

  // Destrava o áudio no primeiro clique em qualquer lugar da tela
  document.addEventListener('click', unlock, { once: true });

  return {
    playMenuBgm,
    pauseBgm,
    playSFX,
    unlock
  };
})();
