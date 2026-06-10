// ── Global UI sounds (hover + click on interactive elements) ─────────────
(function () {
  const INTERACTIVE = 'button, .btn, .avail-unit, .world-card, .stage-card, .gacha-card, select, [role="button"]';

  // Use relatedTarget to fire hover sound only when entering a new element,
  // not when moving between child nodes inside the same button.
  document.addEventListener('mouseover', e => {
    const el   = e.target.closest(INTERACTIVE);
    if (!el) return;
    const from = e.relatedTarget?.closest?.(INTERACTIVE);
    if (from === el) return; // still inside the same interactive element
    if (typeof AudioManager !== 'undefined') AudioManager.playHover();
  }, { passive: true });

  document.addEventListener('click', e => {
    if (e.target.closest(INTERACTIVE))
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
  }, { passive: true });
})();

// Polyfill roundRect for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y); this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r); this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h); this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r); this.quadraticCurveTo(x, y, x+r, y);
    this.closePath();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  // Initialize save system
  Save.load();

  let onlineReady = false;
  try { onlineReady = Online.init(); } catch (e) {
    console.error('[Online] Falha crítica na inicialização:', e.message);
  }
  // Jogo requer conta — sem Supabase não há como jogar
  if (!onlineReady) {
    LoginScreen.showServerDown();
    return;
  }

  // Initialize banner before new-player seed so starters match current banner
  const initBanner = BannerSystem.init();

  // Seed starter inventory if new player — grants the 3★ units from the active banner
  const d = Save.get();
  if (!d._initialized) {
    initBanner.star3.forEach(id => Save.addUnit(id, 1, 0));
    Save.addMaterial('ninja_generico_1', 5);
    Save.addMaterial('ninja_generico_2', 2);
    d._initialized = true;
    Save.save();
  }

  // Initialize systems
  try {
    Missions.init();       // inicia conquistas + reseta diárias se necessário
    Game.init();

    // Mostra loading enquanto Supabase verifica sessão salva
    LoginScreen.showLoading();
    UI.updateCurrencyDisplay();
    UI.updateBannerDisplay(initBanner);

    Online.onReady((hasSession) => {
      if (hasSession) {
        UI.showHub();
      } else {
        LoginScreen.show();
      }
    });

    if (Save.wasCorrupted()) {
      UI.toast(I18N.t('save_corrupted'), 8000);
    }

    // Integrity guards — snapshot das funções críticas + monitoramento de DevTools
    Integrity.FunctionGuard.snapshot({
      'Save.addUnit':     Save.addUnit,
      'Save.addGems':     Save.addGems,
      'Save.spendGems':   Save.spendGems,
      'Save.addTickets':  Save.addTickets,
      'Save.addMaterial': Save.addMaterial,
    });
    Integrity.DevToolsGuard.startMonitoring();
    setInterval(() => {
      const patched = Integrity.FunctionGuard.audit({
        'Save.addUnit':     Save.addUnit,
        'Save.addGems':     Save.addGems,
        'Save.spendGems':   Save.spendGems,
        'Save.addTickets':  Save.addTickets,
        'Save.addMaterial': Save.addMaterial,
      });
      if (patched.length > 0) {
        Integrity.recordViolation('function_patched', { fns: patched });
      }
    }, 30_000);
  } catch (err) {
    document.body.innerHTML = `<div style="color:red; background:black; padding:20px; font-family:monospace; font-size:20px; z-index:999999; position:absolute; top:0; left:0; right:0; bottom:0;">
      <h2>CRITICAL ERROR</h2>
      <pre>${err.stack || err.message || err}</pre>
    </div>`;
  }

  // Banner timer — update every second, check rotation every minute
  setInterval(() => UI.updateBannerTimer(), 1000);
  setInterval(() => {
    const rotated = BannerSystem.checkRotation();
    if (rotated) UI.updateBannerDisplay(rotated);
  }, 60000);

  // Expose GameController alias for HTML onclick
  window.GameController = {
    startGame:   () => Game.startGame(),
    togglePause: () => Game.togglePause(),
    toggleSpeed: () => Game.toggleSpeed(),
    sellTower:   () => Game.sellTower(),
    buyNextUpgrade: () => Game.buyNextUpgrade(),
    retryStage:  () => Game.retryStage(),
    useAbility:  (idx) => Game.useAbility(idx),
    deselectTower: () => Game.deselectTower(),
    skipWave:    () => Game.skipWave(),
    undoLastTower: () => Game.undoLastTower()
  };

  // Keyboard Shortcuts (Hotkeys)
  window.addEventListener('keydown', (e) => {
    // Only apply if the game screen is active
    if (!document.getElementById('screen-game').classList.contains('active')) return;
    
    // Ignore if typing in an input (just in case)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      GameController.togglePause();
      e.preventDefault();
    } else if (e.code === 'Escape') {
      GameController.deselectTower();
      e.preventDefault();
    } else if (e.code === 'KeyS') {
      GameController.skipWave();
      e.preventDefault();
    } else if (e.code === 'KeyF') {
      GameController.toggleSpeed();
      e.preventDefault();
    } else if (e.code === 'KeyU') {
      GameController.buyNextUpgrade();
      e.preventDefault();
    } else if (e.code === 'KeyZ') {
      GameController.undoLastTower();
      e.preventDefault();
    } else if (e.code === 'Backspace' || e.code === 'Delete') {
      GameController.sellTower();
      e.preventDefault();
    } else if (['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'].includes(e.code)) {
      const idx = parseInt(e.key) - 1;
      const panel = document.getElementById('team-panel');
      if (panel && panel.children[idx]) {
        panel.children[idx].click();
      }
    }
  });

  // Sync volume panel labels/sliders to saved values
  if (typeof AudioManager !== 'undefined') {
    const bgmSlider = document.getElementById('vol-bgm');
    const sfxSlider = document.getElementById('vol-sfx');
    const bgmLabel  = document.getElementById('vol-bgm-label');
    const sfxLabel  = document.getElementById('vol-sfx-label');
    if (bgmSlider) bgmSlider.value = AudioManager.getBgmVolume();
    if (sfxSlider) sfxSlider.value = AudioManager.getSfxVolume();
    if (bgmLabel)  bgmLabel.textContent  = Math.round(AudioManager.getBgmVolume() * 100) + '%';
    if (sfxLabel)  sfxLabel.textContent  = Math.round(AudioManager.getSfxVolume() * 100) + '%';
  }

  console.log('Battlestar Popnime loaded!');
});
