const CheatMode = (() => {
  function open() {
    const modal = document.getElementById('cheat-modal');
    const input = document.getElementById('cheat-input');
    const feedback = document.getElementById('cheat-feedback');
    input.value = '';
    feedback.textContent = '';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    document.getElementById('cheat-modal').style.display = 'none';
  }

  function activate() {
    const input = document.getElementById('cheat-input');
    const feedback = document.getElementById('cheat-feedback');
    const code = input.value.trim().toUpperCase();

    if (code === 'MONEY') {
      if (typeof Game === 'undefined' || !Game.addGold) {
        feedback.textContent = 'Inicie uma partida primeiro!';
        feedback.style.color = '#f87171';
        return;
      }
      Game.addGold(999999);
      feedback.textContent = '+999.999 de ouro adicionados!';
      feedback.style.color = '#facc15';
      setTimeout(close, 2000);
      return;
    }

    if (code !== 'CHEATON') {
      feedback.textContent = 'Código inválido!';
      feedback.style.color = '#f87171';
      return;
    }

    // Marca sessão como cheat — bloqueia leaderboard
    Save.get()._cheatMode = true;
    Save.save();

    // Unlock all playable characters
    getPlayable().forEach(char => {
      if (Save.getUnitQty(char.id) === 0) Save.addUnit(char.id, 1, 0);
    });

    // Set all materials to 99
    Object.values(CHARACTERS).filter(c => !c.playable).forEach(mat => {
      const have = Save.getMaterialQty(mat.id);
      if (have < 99) Save.addMaterial(mat.id, 99 - have);
    });

    Save.save();
    UI.updateCurrencyDisplay();

    feedback.textContent = 'Modo Cheat ativado! Personagens desbloqueados e ingredientes x99!';
    feedback.style.color = '#4ade80';
    setTimeout(close, 2500);
  }

  return { open, close, activate };
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

  // Initialize online layer
  Online.init();

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

    // Start at hub
    UI.showHub();
    UI.updateCurrencyDisplay();
    UI.updateBannerDisplay(initBanner);

    if (Save.wasCorrupted()) {
      UI.toast('⚠️ Save corrompido detectado — progresso reiniciado automaticamente.', 8000);
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
    undoLastTower: () => Game.undoLastTower(),
    saveSetup:   (slot) => Game.saveSetup(slot),
    loadSetup:   (slot) => Game.loadSetup(slot)
  };

  // Global: " key opens cheat modal (anywhere, except while typing)
  window.addEventListener('keydown', (e) => {
    if (e.key === '"' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      CheatMode.open();
      e.preventDefault();
    }
  });

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

  console.log('Battlestar Popnime loaded!');
});
