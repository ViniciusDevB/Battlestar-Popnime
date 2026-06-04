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

  // Seed starter inventory if new player
  const d = Save.get();
  if (!d._initialized) {
    Save.addUnit('naruto_shippuden', 1, 0);
    Save.addUnit('ichigo_base', 1, 0);
    Save.addUnit('goku_base', 1, 0);
    Save.addMaterial('ninja_generico_1', 5);
    Save.addMaterial('ninja_generico_2', 2);
    d._initialized = true;
    Save.save();
  }

  // Initialize banner (must run before Gacha so pool is set)
  const initBanner = BannerSystem.init();

  // Initialize systems
  Missions.init();
  Game.init();

  // Start at hub
  UI.showHub();
  UI.updateCurrencyDisplay();
  UI.updateBannerDisplay(initBanner);

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
    skipWave:    () => Game.skipWave()
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

  console.log('Battlestar Popnime loaded!');
});
