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
    
    // Se a música do menu já estiver tocando, não fazemos nada
    if (currentBgm === menuBgm && !menuBgm.paused) {
      return;
    }
    
    // Se tiver outra música tocando (ex: boss), pausa ela
    if (currentBgm && currentBgm !== menuBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }
    
    currentBgm = menuBgm;
    menuBgm.volume = 0; // Começa no 0 para não assustar
    menuBgm.play().catch(e => console.warn('Autoplay prevenido:', e));

    // Efeito Fade-In até 50% (0.5)
    let fadeAudio = setInterval(() => {
      if (menuBgm.volume < 0.45) {
        menuBgm.volume = Math.min(0.5, menuBgm.volume + 0.05);
      } else {
        menuBgm.volume = 0.5;
        clearInterval(fadeAudio);
      }
    }, 150); // Aumenta 5% a cada 150ms
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
    playSFX('assets/audio/sfx/gacha_pull.wav', 0.8);
  }

  function playGachaReveal(rarity) {
    // Pode ter sons diferentes por raridade no futuro se quiser
    if (rarity === 5) {
      playSFX('assets/audio/sfx/gacha_reveal_5star.wav', 1.0);
    } else {
      playSFX('assets/audio/sfx/gacha_reveal.wav', 0.8);
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
