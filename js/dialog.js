const Dialog = (() => {
  let queue = [];
  let onComplete = null;
  let isPlaying = false;

  function play(sequence, callback) {
    if (!sequence || sequence.length === 0) {
      if (callback) callback();
      return;
    }
    queue = [...sequence];
    onComplete = callback;
    isPlaying = true;

    // Pause the game if it is running
    if (typeof Game !== 'undefined') Game.setDialogPause(true);

    const overlay = document.getElementById('dialog-overlay');
    if (overlay) overlay.style.display = 'flex';
    next();
  }

  function next() {
    if (queue.length === 0) {
      isPlaying = false;
      const overlay = document.getElementById('dialog-overlay');
      if (overlay) overlay.style.display = 'none';
      if (typeof Game !== 'undefined') Game.setDialogPause(false);
      if (onComplete) onComplete();
      return;
    }
    
    const line = queue.shift();
    const nameEl = document.getElementById('dialog-name');
    const textEl = document.getElementById('dialog-text');
    const leftEl = document.getElementById('dialog-char-left');
    const rightEl = document.getElementById('dialog-char-right');

    if (nameEl) nameEl.textContent = line.name;
    if (textEl) textEl.innerHTML = line.text; 

    // Character Image logic
    if (line.leftImg) {
      leftEl.style.backgroundImage = `url('${line.leftImg}')`;
      leftEl.style.opacity = 1;
    } else {
      leftEl.style.opacity = 0;
    }
    
    if (line.rightImg) {
      rightEl.style.backgroundImage = `url('${line.rightImg}')`;
      rightEl.style.opacity = 1;
    } else {
      rightEl.style.opacity = 0;
    }

    // Highlight active speaker
    leftEl.className = 'dialog-char-left' + (line.side === 'left' ? ' dialog-char-active' : '');
    rightEl.className = 'dialog-char-right' + (line.side === 'right' ? ' dialog-char-active' : '');
  }

  // Handle click to advance
  window.addEventListener('click', (e) => {
    if (isPlaying) { 
      // check if click is inside the game screen or overlay
      next(); 
      e.stopPropagation(); 
    }
  }, true);

  // Handle space to advance
  window.addEventListener('keydown', (e) => {
    if (isPlaying && (e.code === 'Space' || e.code === 'Enter')) { 
      next(); 
      e.preventDefault(); 
      e.stopPropagation(); 
    }
  }, true);

  return { play, isPlaying: () => isPlaying };
})();
