// js/game-renderer.js — Toda renderização Canvas do jogo.
// Depende de: _renderCtx (game-utils.js), RARITY_COLORS (characters.js),
//             CHAR_COLORS (game-passives.js), INFINITE_TIERS/getInfiniteTierIdx (game-infinite.js),
//             drawProjectileShape (game-projectile-render.js), CANVAS_W/CANVAS_H/PATH_POINTS (world.js).

// ── Cache de imagens (torres e inimigos) ──────────────────────────────────────

const _imgCache = {};
function getTowerImg(charId) {
  const char = getCharById(charId);
  if (!char?.image) return null;
  if (!_imgCache[charId]) {
    const img = new Image();
    img.src = char.image;
    _imgCache[charId] = img;
  }
  return _imgCache[charId];
}

const _enemyImgCache = {};
function getEnemyImg(enemyType) {
  const d = typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS[enemyType] : null;
  if (!d || !d.image) return null;
  if (!_enemyImgCache[enemyType]) {
    const img = new Image();
    img.src = d.image;
    _enemyImgCache[enemyType] = img;
  }
  return _enemyImgCache[enemyType];
}

// ── Constantes visuais ────────────────────────────────────────────────────────

const RARITY_GLOW = { 3:'rgba(159,122,234,', 4:'rgba(251,146,60,', 5:'rgba(255,200,70,', 6:'rgba(230,57,57,' };

const TAG_DEFS = {
  ptype: {
    powerful1:   { t:'P1',   bg:'#9b59b6', fg:'#fff' },
    powerful2:   { t:'P2',   bg:'#6c3483', fg:'#fff' },
    powerful3:   { t:'P3',   bg:'#4a235a', fg:'#fff' },
    strong1:     { t:'STR1', bg:'#5d6d7e', fg:'#fff' },
    strong2:     { t:'STR2', bg:'#4a5568', fg:'#fff' },
    strong3:     { t:'STR3', bg:'#34495e', fg:'#fff' },
    strong4:     { t:'STR4', bg:'#2c3e50', fg:'#fff' },
    strong5:     { t:'STR5', bg:'#1a252f', fg:'#fff' },
    speed:       { t:'SPD',  bg:'#d4ac0d', fg:'#000' },
    fortified:   { t:'SHLD', bg:'#f59e0b', fg:'#000' },
    regenerator: { t:'REG',  bg:'#27ae60', fg:'#fff' },
    bomber:      { t:'BOOM', bg:'#c0392b', fg:'#fff' },
    clooner:     { t:'CLN',  bg:'#1e8449', fg:'#fff' },
    kamikaze:    { t:'KMK',  bg:'#e67e22', fg:'#fff' }
  },
  special: {
    explosion:              { t:'BOOM', bg:'#e74c3c', fg:'#fff' },
    base_drain:             { t:'DRN',  bg:'#1f618d', fg:'#fff' },
    genjutsu:               { t:'GNJ',  bg:'#1c2833', fg:'#fff' },
    shinra_tensei:          { t:'ST',   bg:'#922b21', fg:'#fff' },
    pain_boss:              { t:'ST+S', bg:'#922b21', fg:'#fff' },
    grand_fisher_special:   { t:'SPWN', bg:'#607d8b', fg:'#fff' },
    grimmjow_special:       { t:'SPWN', bg:'#1e88e5', fg:'#fff' },
    nnoitra_special:        { t:'SHLD+',bg:'#f59e0b', fg:'#000' },
    aizen_hogyoku_phase1:   { t:'ILSN', bg:'#1a1a2e', fg:'#fff' },
    aizen_hogyoku_phase2:   { t:'DRN',  bg:'#4c1d95', fg:'#fff' }
  }
};

// ── render() — game loop entry point ─────────────────────────────────────────

function render() {
  const ctx = _renderCtx.ctx;
  const canvas = _renderCtx.canvas;
  const renderOffX = _renderCtx.renderOffX;
  const renderOffY = _renderCtx.renderOffY;
  const renderScale = _renderCtx.renderScale;
  const screenShakeAmount = _renderCtx.screenShakeAmount;
  const vizardOverlayAlpha = _renderCtx.vizardOverlayAlpha;
  const stage = _renderCtx.stage;
  const towers = _renderCtx.towers;
  const tsunamis = _renderCtx.tsunamis;

  ctx.fillStyle = '#04040c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  let cx = renderOffX;
  let cy = renderOffY;
  if (screenShakeAmount > 0) {
    cx += (Math.random() - 0.5) * screenShakeAmount;
    cy += (Math.random() - 0.5) * screenShakeAmount;
  }
  ctx.translate(cx, cy);
  ctx.scale(renderScale, renderScale);

  drawBackground();
  drawPath();
  drawBlockZones();
  drawTowerRangePreview();
  drawPlacementPreview();
  drawTowers();
  drawEnemies();
  drawProjectiles();

  // Draw Zombies (Nemesis passive)
  const zombies = _renderCtx.zombies || [];
  zombies.forEach(z => {
    const r = z.fromInfection ? 18 : 30;
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = '#39FF14';
    ctx.fillStyle = z.fromInfection ? 'rgba(100,255,50,0.88)' : 'rgba(57,255,20,0.78)';
    ctx.beginPath();
    ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
    ctx.fill();
    const hpPct = Math.max(0, z.hp / z.maxHp);
    const bw = r * 2;
    ctx.fillStyle = '#111';
    ctx.fillRect(z.x - r, z.y - r - 12, bw, 5);
    ctx.fillStyle = '#39FF14';
    ctx.fillRect(z.x - r, z.y - r - 12, bw * hpPct, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(z.x - r, z.y - r - 12, bw, 5);
    ctx.fillStyle = '#fff';
    ctx.font = `${z.fromInfection ? 12 : 16}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', z.x, z.y);
    ctx.restore();
  });

  // Draw Tsunamis
  tsunamis.forEach(tsu => {
    ctx.save();
    ctx.shadowBlur = 15; ctx.shadowColor = '#5b9cf6';
    ctx.fillStyle = 'rgba(91, 156, 246, 0.7)';
    ctx.beginPath();
    ctx.arc(tsu.x, tsu.y, 45, 0, Math.PI * 2);
    ctx.fill();
    const hpPct = Math.max(0, tsu.hp / tsu.maxHp);
    ctx.fillStyle = '#111';
    ctx.fillRect(tsu.x - 30, tsu.y - 60, 60, 6);
    ctx.fillStyle = '#5b9cf6';
    ctx.fillRect(tsu.x - 30, tsu.y - 60, 60 * hpPct, 6);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(tsu.x - 30, tsu.y - 60, 60, 6);
    ctx.restore();
  });

  drawEffects();

  // Dark Mode (Fog of War)
  if (stage && stage.modifiers && stage.modifiers.dark_mode) {
    if (!window.darkCanvas) {
      window.darkCanvas = document.createElement('canvas');
      window.darkCanvas.width = CANVAS_W;
      window.darkCanvas.height = CANVAS_H;
      window.darkCtx = window.darkCanvas.getContext('2d');
    }
    const dCtx = window.darkCtx;
    dCtx.globalCompositeOperation = 'source-over';
    dCtx.fillStyle = 'rgba(0,0,0,0.98)';
    dCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    dCtx.globalCompositeOperation = 'destination-out';
    towers.forEach(t => {
      const rad = _renderCtx.getTowerStats(t).range || 150;
      const grad = dCtx.createRadialGradient(t.x, t.y, 0, t.x, t.y, rad);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      dCtx.fillStyle = grad;
      dCtx.beginPath();
      dCtx.arc(t.x, t.y, rad, 0, Math.PI * 2);
      dCtx.fill();
    });
    const pathsToDraw = window.currentPaths || [PATH_POINTS];
    if (pathsToDraw && pathsToDraw[0] && pathsToDraw[0].length > 0) {
      const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
      const grad = dCtx.createRadialGradient(endP.x, endP.y, 0, endP.x, endP.y, 100);
      grad.addColorStop(0, 'rgba(255,255,255,0.6)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      dCtx.fillStyle = grad;
      dCtx.beginPath();
      dCtx.arc(endP.x, endP.y, 100, 0, Math.PI * 2);
      dCtx.fill();
    }
    ctx.drawImage(window.darkCanvas, 0, 0);
  }

  if (vizardOverlayAlpha > 0) {
    ctx.save();
    const cornerDist = Math.hypot(CANVAS_W/2, CANVAS_H/2);
    const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, cornerDist * 0.65, CANVAS_W/2, CANVAS_H/2, cornerDist * 1.05);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(10, 0, 0, ${vizardOverlayAlpha * 0.95})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const cornerGrad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, cornerDist * 0.8, CANVAS_W/2, CANVAS_H/2, cornerDist);
    cornerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    cornerGrad.addColorStop(1, `rgba(180, 0, 0, ${vizardOverlayAlpha * 0.9})`);
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }

  // DC — Blackout overlay (Destruidor passa pelos cruzamentos)
  if (_renderCtx._dcBlackoutActive) {
    const t = Math.min(1, (_renderCtx._dcBlackoutTimer || 0) / 0.5);
    ctx.save();
    ctx.fillStyle = `rgba(10,8,40,${0.55 * t})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Flicker de raios elétricos nos cantos
    if (Math.random() < 0.25) {
      ctx.strokeStyle = `rgba(100,80,255,${0.5 * t})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const ex = Math.random() * CANVAS_W;
      ctx.moveTo(ex, 0); ctx.lineTo(ex + (Math.random()-0.5)*40, CANVAS_H * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }
  // DC — Gravity zones (círculos roxos translúcidos)
  if (_renderCtx._gravityZones && _renderCtx._gravityZones.length > 0) {
    ctx.save();
    _renderCtx._gravityZones.forEach(gz => {
      const alpha = Math.min(0.30, gz.timer * 0.15);
      ctx.beginPath(); ctx.arc(gz.x, gz.y, gz.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,58,237,${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(167,139,250,${alpha * 2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawOverlay();
  ctx.restore();
}

// ── Funções draw individuais ──────────────────────────────────────────────────

function drawBlockZones() {
  const ctx = _renderCtx.ctx;
  const zones = _renderCtx.stage?.modifiers?.blockZones;
  if (!zones || !Array.isArray(zones)) return;
  zones.forEach(z => {
    ctx.save();
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,65,45,0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,150,90,0.75)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.clip();
    ctx.strokeStyle = 'rgba(50,30,10,0.30)';
    ctx.lineWidth = 1;
    for (let i = -z.r * 2; i < z.r * 2; i += 12) {
      ctx.beginPath();
      ctx.moveTo(z.x + i, z.y - z.r);
      ctx.lineTo(z.x + i + z.r, z.y + z.r);
      ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(z.r * 0.5)}px sans-serif`;
    ctx.fillText('🪨', z.x, z.y - 4);
    ctx.font = 'bold 7px Inter,sans-serif';
    ctx.fillStyle = 'rgba(255,220,140,0.85)';
    ctx.fillText(I18N.t('hud_blocked'), z.x, z.y + z.r * 0.45);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  });
}

function drawBackground() {
  const ctx = _renderCtx.ctx;
  const stage = _renderCtx.stage;
  const isOP = stage?.world === 'onepiece';
  const isNaruto = stage?.world === 'naruto';

  if (isOP) {
    const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
    grad.addColorStop(0, '#102a40'); grad.addColorStop(1, '#05121c');
    ctx.fillStyle = grad;
  } else if (isNaruto) {
    const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
    grad.addColorStop(0, '#2b3a20'); grad.addColorStop(1, '#11180c');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#080e08';
  }

  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.015)' : isNaruto ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke();
  }
  const dots = [[60,60],[140,380],[220,200],[380,50],[420,430],[500,90],[570,300],[650,430],[760,80],[850,250],[950,420],[900,100]];
  dots.forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2);
    ctx.fillStyle = isOP ? 'rgba(15, 60, 80, 0.6)' : isNaruto ? 'rgba(46, 204, 113, 0.15)' : 'rgba(30,60,30,0.6)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x+8, y-4, 9, 0, Math.PI*2);
    ctx.fillStyle = isOP ? 'rgba(20, 80, 100, 0.5)' : isNaruto ? 'rgba(39, 174, 96, 0.2)' : 'rgba(24,50,24,0.5)'; ctx.fill();
  });
}

function drawPath() {
  const ctx = _renderCtx.ctx;
  const stage = _renderCtx.stage;
  const isOP = stage?.world === 'onepiece';
  const isNaruto = stage?.world === 'naruto';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  const pathsToDraw = window.currentPaths || [PATH_POINTS];
  pathsToDraw.forEach(pArr => {
    if (!pArr || pArr.length === 0) return;
    ctx.strokeStyle = isOP ? 'rgba(52, 152, 219, 0.15)' : isNaruto ? 'rgba(230, 126, 34, 0.12)' : 'rgba(180,140,60,0.12)';
    ctx.lineWidth = 46;
    ctx.beginPath();
    ctx.moveTo(pArr[0].x, pArr[0].y);
    pArr.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = isOP ? 'rgba(26, 82, 118, 0.6)' : isNaruto ? 'rgba(110, 44, 0, 0.6)' : 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 36;
    ctx.beginPath();
    ctx.moveTo(pArr[0].x, pArr[0].y);
    pArr.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = isOP ? '#2980b9' : isNaruto ? '#ba4a00' : '#3e2723';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(pArr[0].x, pArr[0].y);
    pArr.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = isOP ? '#3498db' : isNaruto ? '#d35400' : '#4e342e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(pArr[0].x, pArr[0].y);
    pArr.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.2)' : isNaruto ? 'rgba(255,200,70,0.2)' : 'rgba(255,200,70,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 16]);
    ctx.beginPath();
    ctx.moveTo(pArr[0].x, pArr[0].y);
    pArr.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245,101,101,0.7)';
    ctx.font = '600 10px Inter,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('SPAWN', pArr[0].x + 4, pArr[0].y + 4);
  });

  if (pathsToDraw && pathsToDraw.length > 0 && pathsToDraw[0].length > 0) {
    const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
    ctx.fillStyle = 'rgba(57,255,20,0.85)';
    ctx.beginPath();
    ctx.roundRect(endP.x - 18, endP.y - 12, 36, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Inter,sans-serif';
    ctx.fillText('BASE', endP.x - 12, endP.y + 20);
  }
}

function drawPlacementPreview() {
  const deployingCharId = _renderCtx.deployingCharId;
  if (!deployingCharId) return;
  const char = getCharById(deployingCharId);
  if (!char) return;
  const ctx = _renderCtx.ctx;
  const hoverX = _renderCtx.hoverX;
  const hoverY = _renderCtx.hoverY;

  const valid = _renderCtx.isValidPlacement(hoverX, hoverY);
  const color = valid ? '57,255,20' : '245,101,101';
  const pulse = (Math.sin(Date.now() / 200) + 1) / 2;

  ctx.beginPath();
  ctx.arc(hoverX, hoverY, 24, 0, Math.PI*2);
  ctx.fillStyle = `rgba(${color}, ${0.2 + pulse * 0.1})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${color}, 0.8)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  const baseStats = getCurrentStats(char, Save.getBestUnitData(deployingCharId)?.nivel || 1);
  ctx.beginPath();
  ctx.arc(hoverX, hoverY, baseStats.range, 0, Math.PI*2);
  ctx.fillStyle = `rgba(${color}, 0.05)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${color}, 0.3)`;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTowerRangePreview() {
  const selectedTowerIdx = _renderCtx.selectedTowerIdx;
  const towers = _renderCtx.towers;
  if (selectedTowerIdx < 0 || !towers[selectedTowerIdx]) return;
  const ctx = _renderCtx.ctx;
  const tower = towers[selectedTowerIdx];
  const stats = _renderCtx.getTowerStats(tower);
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,200,70,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,70,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTowers() {
  const ctx = _renderCtx.ctx;
  const towers = _renderCtx.towers;
  const shinraTenseiActive = _renderCtx.shinraTenseiActive;
  const selectedTowerIdx = _renderCtx.selectedTowerIdx;
  const _gojoBuffedSet = _renderCtx._gojoBuffedSet;
  const waveActive = _renderCtx.waveActive;

  // Darkseid 7★ — Omega Bond lines between paired enemies
  const allEnemies = _renderCtx.enemies || [];
  const drawnBonds = new Set();
  allEnemies.forEach(e => {
    const p = e._omegaBondPartner;
    if (!p || p.dead || e.dead) return;
    const key = [e, p].sort((a, b) => (a.x - b.x)).map(x => x.x + ',' + x.y).join('|');
    if (drawnBonds.has(key)) return;
    drawnBonds.add(key);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(255,69,0,0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  // Darkseid 7★ — Apokolips Shadows
  towers.forEach(t => {
    if (!t._darkseidshadows) return;
    t._darkseidshadows.forEach(sh => {
      ctx.save();
      ctx.globalAlpha = Math.min(0.85, sh.timer === Infinity ? 0.85 : sh.timer * 0.14);
      // Shadow body — dark silhouette
      ctx.beginPath(); ctx.arc(sh.x, sh.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0505';
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff4500';
      ctx.fill();
      // Orange eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff4500';
      ctx.beginPath(); ctx.arc(sh.x - 5, sh.y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sh.x + 5, sh.y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  });

  // Darkseid 7★ — Abyss Embrace converted enemies visual
  allEnemies.forEach(e => {
    if (!e._abyssConverted) return;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0505';
    ctx.fill();
    ctx.fillStyle = '#ff4500';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Ω', e.x, e.y);
    ctx.restore();
  });

  // DC — Tide zones (Aquaman) e Construct barriers (GL)
  towers.forEach(t => {
    if (t._tideZones && t._tideZones.length > 0) {
      t._tideZones.forEach(z => {
        const alpha = Math.min(0.35, z.timer * 0.12);
        ctx.save();
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(14,165,233,${alpha * 2.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    }
    if (t._glBarriers && t._glBarriers.length > 0) {
      t._glBarriers.forEach(b => {
        const alpha = Math.min(0.55, b.timer * 0.10);
        ctx.save();
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,197,94,${alpha * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(74,222,128,${alpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });
    }
  });

  towers.forEach(t => {
    const disabled = t.disabled || shinraTenseiActive;
    ctx.globalAlpha = disabled ? 0.35 : (t.isClone ? 0.72 : 1);
    const col = RARITY_COLORS[t.rarity];
    const selected = selectedTowerIdx >= 0 && towers[selectedTowerIdx] === t;
    if (t.isClone) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(159,122,234,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(200,180,255,0.85)';
      ctx.font = '600 8px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${Math.ceil(t.cloneTimer)}s`, t.x, t.y + 33);
    }
    if (!disabled && t.rarity >= 3) {
      const g = RARITY_GLOW[t.rarity] || 'rgba(255,255,255,';
      ctx.beginPath();
      ctx.arc(t.x, t.y, selected ? 30 : 26, 0, Math.PI*2);
      ctx.fillStyle = g + (selected ? '0.22)' : '0.10)');
      ctx.fill();
    }
    if (selected) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 25, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // ═══ 7★ Darkseid Aura ═══
    if (!disabled && t.rarity >= 7) {
      const n7 = Date.now();
      const p7 = (Math.sin(n7 / 600) + 1) / 2;
      const stacks = t._tyrantStacks || 0;
      ctx.save();
      ctx.translate(t.x, t.y);
      // Dark void circle
      ctx.beginPath(); ctx.arc(0, 0, 44 + p7 * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10,2,2,${0.25 + p7 * 0.15})`;
      ctx.fill();
      // Omega ring
      ctx.rotate(n7 * 0.0006);
      ctx.beginPath(); ctx.arc(0, 0, 42 + p7 * 4, 0, Math.PI * 2);
      ctx.shadowBlur = 16 + stacks * 0.8; ctx.shadowColor = '#ff4500';
      ctx.strokeStyle = `rgba(255,69,0,${0.5 + p7 * 0.35 + Math.min(stacks * 0.02, 0.3)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      // Ω symbol above tower
      ctx.save();
      ctx.font = `bold ${10 + Math.min(stacks, 10)}px monospace`;
      ctx.fillStyle = `rgba(255,100,30,${0.7 + p7 * 0.3})`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Ω', t.x, t.y - 36);
      if (stacks > 0) {
        ctx.font = 'bold 8px Inter,sans-serif';
        ctx.fillStyle = '#ff8c5a';
        ctx.fillText(`+${Math.round(stacks * 3)}%`, t.x, t.y - 46);
      }
      ctx.restore();
    }

    // ═══ 6★ Aura Visual (apenas rarity exatamente 6) ═══
    if (!disabled && t.rarity === 6) {
      const n6 = Date.now();
      const p6a = (Math.sin(n6 / 800) + 1) / 2;
      const p6b = (Math.sin(n6 / 500 + Math.PI) + 1) / 2;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(n6 * 0.0008);
      ctx.beginPath();
      ctx.arc(0, 0, 38 + p6a * 4, 0, Math.PI * 2);
      ctx.shadowBlur = 14; ctx.shadowColor = '#dc2626';
      ctx.strokeStyle = `rgba(220,38,38,${0.4 + p6a * 0.35})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(-n6 * 0.0012);
      ctx.beginPath();
      ctx.arc(0, 0, 30 + p6b * 2, 0, Math.PI * 2);
      ctx.shadowBlur = 9; ctx.shadowColor = '#f97316';
      ctx.strokeStyle = `rgba(249,115,22,${0.30 + p6b * 0.30})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save();
      ctx.translate(t.x, t.y);
      const layers = [
        { color: 'rgba(220, 10, 20, 0.7)', blur: 25, blurCol: '#ff0000', comp: 'lighter', baseR: 38, spikeMult: 28 },
        { color: 'rgba(80, 0, 0, 0.9)', blur: 15, blurCol: '#aa0000', comp: 'source-over', baseR: 28, spikeMult: 20 },
        { color: 'rgba(5, 5, 10, 0.98)', blur: 5, blurCol: '#000000', comp: 'source-over', baseR: 22, spikeMult: 14 }
      ];
      layers.forEach((ly, idx) => {
        ctx.globalCompositeOperation = ly.comp;
        ctx.fillStyle = ly.color;
        ctx.shadowBlur = ly.blur;
        ctx.shadowColor = ly.blurCol;
        ctx.beginPath();
        const spikes = 14 + idx * 2;
        for (let i = 0; i <= spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2;
          const timePhase = n6 * 0.006 + idx * 10 + i;
          const flameLen = ly.baseR + Math.abs(Math.sin(timePhase)) * ly.spikeMult;
          const isTop = Math.sin(angle) < 0;
          const upStretch = isTop ? Math.abs(Math.sin(angle)) * 30 : 0;
          const pxTip = Math.cos(angle) * (flameLen + upStretch * 0.4);
          const pyTip = Math.sin(angle) * (flameLen + upStretch) - upStretch * 0.6;
          const nextAngle = ((i + 0.5) / spikes) * Math.PI * 2;
          const valleyLen = ly.baseR - 4;
          const isTopValley = Math.sin(nextAngle) < 0;
          const valleyUpStretch = isTopValley ? Math.abs(Math.sin(nextAngle)) * 12 : 0;
          const pxVal = Math.cos(nextAngle) * valleyLen;
          const pyVal = Math.sin(nextAngle) * (valleyLen + valleyUpStretch) - valleyUpStretch * 0.4;
          if (i === 0) ctx.moveTo(pxTip, pyTip);
          else ctx.lineTo(pxTip, pyTip);
          if (i < spikes) ctx.lineTo(pxVal, pyVal);
        }
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
      if (t._vizardActive) {
        const vp = (Math.sin(Date.now() / 180) + 1) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, 43 + vp * 7, 0, Math.PI * 2);
        ctx.shadowBlur = 28; ctx.shadowColor = '#f97316';
        ctx.strokeStyle = `rgba(249,115,22,${0.55 + vp * 0.45})`;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }
    }
    const circleR = t.rarity >= 6 ? 22 : 20;
    ctx.beginPath();
    ctx.arc(t.x, t.y, circleR, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = disabled ? '#222' : (t.rarity >= 6 ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.2)');
    ctx.lineWidth = t.rarity >= 6 ? 2 : 1.5;
    ctx.stroke();
    const portrait = getTowerImg(t.charId);
    const imgR = circleR - 1;
    if (portrait && portrait.complete && portrait.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(t.x, t.y, imgR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(portrait, t.x - imgR, t.y - imgR, imgR * 2, imgR * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = disabled ? 'rgba(255,255,255,0.4)' : '#fff';
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t.initials, t.x, t.y);
    }
    if (t.rarity >= 6) {
      ctx.save();
      ctx.shadowBlur = 8; ctx.shadowColor = '#dc2626';
      ctx.fillStyle = '#e63939';
      ctx.font = 'bold 8px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('6★', t.x + 16, t.y - 19);
      ctx.restore();
    }
    if (t.upgradeLevel > 0) {
      const spacing = t.upgradeLevel > 6 ? 6 : 7;
      const pipR    = t.upgradeLevel > 6 ? 2.5 : 3;
      const startX  = t.x - ((t.upgradeLevel - 1) * spacing) / 2;
      for (let i = 0; i < t.upgradeLevel; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, t.y + 25, pipR, 0, Math.PI*2);
        ctx.fillStyle = '#ffc846';
        ctx.fill();
      }
    }
    if (_gojoBuffedSet.has(t)) {
      const gPulse = (Math.sin(Date.now() / 700) + 1) / 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,200,70,${0.35 + gPulse * 0.25})`;
      ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = `rgba(255,200,70,${0.12 + gPulse * 0.08})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2); ctx.fill();
    }
    if ((t.miniStunTimer || 0) > 0) {
      const sPulse = (Math.sin(Date.now() / 150) + 1) / 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, 26, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(229,57,53,${0.55 + sPulse * 0.4})`;
      ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#f56565'; ctx.font = 'bold 8px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${Math.ceil(t.miniStunTimer)}s`, t.x, t.y - 30);
    }
    if ((t.stunCooldown || 0) > 0 && (t.miniStunTimer || 0) <= 0) {
      ctx.beginPath(); ctx.arc(t.x - 16, t.y - 16, 7, 0, Math.PI*2);
      ctx.fillStyle = '#1d4ed8'; ctx.fill();
      ctx.fillStyle = '#93c5fd'; ctx.font = 'bold 6px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.ceil(t.stunCooldown)}s`, t.x - 16, t.y - 16);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    if (!t.isClone) {
      const badge = _passiveCtx.PASSIVE_SYSTEM.renderBadge(t);
      if (badge) {
        ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(badge.text, t.x, t.y - 46);
        ctx.fillStyle = badge.color;
        ctx.fillText(badge.text, t.x, t.y - 46);
      }
    }
    if (!t.isClone && t.charData?.active_ability) {
      const ready = (t.abilityTimer || 0) <= 0;
      ctx.beginPath();
      ctx.arc(t.x + 18, t.y - 18, 6, 0, Math.PI*2);
      ctx.fillStyle = ready ? '#3ecf8e' : 'rgba(91,156,246,0.85)';
      ctx.fill();
      if (!ready) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 6px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(t.abilityTimer), t.x + 18, t.y - 18);
      }
    }
    if ((t.prestige || 0) > 0) {
      const pPulse = (Math.sin(Date.now() / 600) + 1) / 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, 22 + pPulse * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,215,0,${0.5 + pPulse * 0.45})`;
      ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 7px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`P${t.prestige}`, t.x, t.y + 28);
    }
    if (waveActive && !t.isClone && (t.realtimeDPS || 0) > 0) {
      const _dv = t.realtimeDPS;
      const _ds = _dv >= 1000 ? (_dv/1000).toFixed(1)+'k' : Math.round(_dv).toString();
      ctx.font = '600 7px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(_ds, t.x+1, t.y+38);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(_ds, t.x, t.y+37);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
  });
}

function drawEnemies() {
  const ctx = _renderCtx.ctx;
  const enemies = _renderCtx.enemies;
  const stage = _renderCtx.stage;
  const fogActive = !!(stage?.modifiers?.fogOfWar);

  enemies.forEach(e => {
    if (e.dead || e.reached_end) return;
    ctx.save();
    const s        = e.size;
    const hasBurn  = e.status.burn.active;
    const hasFreeze = e.status.freeze.active;
    const hasPara  = e.status.paralisia.active;
    const bleedN   = e.status.sangramento.length;

    if      (hasPara)   { ctx.shadowBlur = 16; ctx.shadowColor = '#fbbf24'; }
    else if (hasFreeze) { ctx.shadowBlur = 14; ctx.shadowColor = '#5b9cf6'; }
    else if (hasBurn)   { ctx.shadowBlur = 12; ctx.shadowColor = '#f97316'; }

    if (e.hitFlash > 0) ctx.globalAlpha = 0.55;

    if (bleedN > 0) {
      const bp = (Math.sin(Date.now() / 160) + 1) / 2;
      ctx.strokeStyle = `rgba(229,57,53,${0.5 + bp * 0.4})`;
      ctx.lineWidth = 1.5 + Math.min(bleedN, 4) * 0.4;
      const r2 = Math.min(5, s * 0.18) + 1;
      ctx.beginPath(); ctx.roundRect(e.x-s/2-2, e.y-s/2-2, s+4, s+4, r2); ctx.stroke();
    }

    const img = getEnemyImg(e.type);
    if (img && img.complete && img.naturalWidth > 0) {
      if (e.is_boss)     { ctx.shadowBlur = 16; ctx.shadowColor = '#f56565'; }
      else if (e.is_miniboss) { ctx.shadowBlur = 10; ctx.shadowColor = '#ffc846'; }
      ctx.drawImage(img, e.x - s/2, e.y - s/2, s, s);
      ctx.shadowBlur = 0;
      if (hasBurn || hasFreeze || hasPara) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        if (hasBurn) ctx.fillStyle = '#f97316';
        else if (hasFreeze) ctx.fillStyle = '#5b9cf6';
        else if (hasPara) ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, Math.min(5, s * 0.18)); ctx.fill();
        ctx.restore();
      }
      if (!fogActive) {
        if (e.is_boss) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else if (e.is_miniboss) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        }
      }
    } else {
      const col = hasBurn ? '#f97316' : e.col;
      const r   = Math.min(5, s * 0.18);
      ctx.fillStyle = fogActive ? '#374151' : col;
      if (e.is_boss) {
        const pulse = 2 + Math.sin(Date.now() / 180) * 1.5;
        ctx.shadowBlur = 16; ctx.shadowColor = '#f56565';
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
        ctx.strokeStyle = '#f56565'; ctx.lineWidth = pulse;
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
        ctx.shadowBlur = 0;
        if (!fogActive) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        }
      } else if (e.is_miniboss) {
        const pulse = 1.5 + Math.sin(Date.now() / 260) * 1;
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
        ctx.strokeStyle = '#ffc846'; ctx.lineWidth = pulse;
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
        if (!fogActive) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        }
      } else {
        ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
      }
    }

    if (e.jinchuurikiImmuneType && !fogActive) {
      const IMMUNE_LABELS = { single:'1 alvo', aoe:'AOE', pierce:'Pierce', scatter:'Scatter', ricochet:'Ricochet' };
      const txt = `IMUNE: ${(IMMUNE_LABELS[e.jinchuurikiImmuneType] || e.jinchuurikiImmuneType).toUpperCase()}`;
      ctx.save();
      ctx.font = 'bold 7px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(txt).width;
      const bw = tw + 10, bh = 12;
      const bx = e.x - bw/2, by = e.y - s/2 - 24;
      ctx.fillStyle = 'rgba(109,40,217,0.88)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.fillText(txt, e.x, by + bh/2);
      ctx.restore();
    }

    if (e.sandShield) {
      const sPulse = (Math.sin(Date.now() / 180) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 0.6 + 6 + sPulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(217,119,6,${0.65 + sPulse * 0.3})`;
      ctx.lineWidth = 3 + sPulse * 2;
      ctx.shadowBlur = 10 + sPulse * 8; ctx.shadowColor = '#d97706';
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
    }

    if ((e.shieldHp || 0) > 0) {
      const sPulse = (Math.sin(Date.now() / 200) + 1) / 2;
      const isFort = (e.ptypes || []).includes('fortified');
      const shRgb  = isFort ? '245,158,11' : '96,165,250';
      const shSolid= isFort ? '#f59e0b'    : '#3b82f6';
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 0.6 + 8 + sPulse * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${shRgb},${0.6 + sPulse * 0.35})`;
      ctx.lineWidth = 3.5 + sPulse * 2.5;
      ctx.shadowBlur = 14 + sPulse * 10; ctx.shadowColor = shSolid;
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
    }

    if (!fogActive) {
      const hpPct = e.hp / e.maxHp;
      const bw = s + 10, bh = 3, bx = e.x - bw/2, by = e.y - s/2 - 7;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = hpPct > 0.55 ? '#3ecf8e' : hpPct > 0.28 ? '#fbbf24' : '#f56565';
      ctx.beginPath(); ctx.roundRect(bx, by, bw * hpPct, bh, 2); ctx.fill();

      if ((e.shieldHp || 0) > 0 && e.maxShieldHp > 0) {
        const shPct = e.shieldHp / e.maxShieldHp;
        const shby = by - 5;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(bx, shby, bw, bh, 2); ctx.fill();
        ctx.fillStyle = (e.ptypes || []).includes('fortified') ? '#f59e0b' : '#60a5fa';
        ctx.beginPath(); ctx.roundRect(bx, shby, bw * shPct, bh, 2); ctx.fill();
      }

      const tags = [];
      (e.ptypes || [e.ptype]).forEach(pt => {
        const ptDef = TAG_DEFS.ptype[pt];
        if (ptDef) tags.push(ptDef);
      });
      const spDef = e.special ? TAG_DEFS.special[e.special] : null;
      if (spDef) tags.push(spDef);
      if (e.on_death && !spDef) tags.push({ t:'SPWN', bg:'#1e8449', fg:'#fff' });

      if (tags.length > 0) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 7px Inter,sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const tagH = 9, tagGap = 2;
        const tagY  = by - tagH - tagGap;
        let tx = bx;
        tags.forEach(tag => {
          const tw = ctx.measureText(tag.t).width + 5;
          ctx.fillStyle = tag.bg;
          ctx.beginPath(); ctx.roundRect(tx, tagY, tw, tagH, 2); ctx.fill();
          ctx.fillStyle = tag.fg;
          ctx.fillText(tag.t, tx + 2.5, tagY + tagH - 1.5);
          tx += tw + tagGap;
        });
      }
    }

    const dots = [];
    if (hasBurn)   dots.push({ col:'#f97316', l:'B' });
    if (hasFreeze) dots.push({ col:'#5b9cf6', l:'S' });
    if (hasPara)   dots.push({ col:'#fbbf24', l:'P' });
    if (bleedN > 0) {
      const show = Math.min(bleedN, 4);
      for (let i = 0; i < show; i++) dots.push({ col:'#e53935', l:'•' });
      if (bleedN > 4) dots.push({ col:'#c0392b', l:`+${bleedN-4}` });
    }
    if (dots.length > 0) {
      ctx.shadowBlur = 0;
      const dR = 4.5, dSp = dR * 2 + 2;
      const startX = e.x - (dots.length * dSp) / 2 + dR;
      const dY = e.y + s/2 + dR + 3;
      ctx.font = '600 6px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      dots.forEach((d, i) => {
        const dx = startX + i * dSp;
        ctx.beginPath(); ctx.arc(dx, dY, dR, 0, Math.PI*2);
        ctx.fillStyle = d.col; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(d.l, dx, dY + 0.5);
      });
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

    // Darkseid — Corruption stacks indicator
    if ((e._corruptionStacks || 0) > 0) {
      const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = 0.5 + pulse * 0.3;
      ctx.beginPath(); ctx.arc(e.x, e.y, s/2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(124,58,237,${0.4 + e._corruptionStacks * 0.08})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#c4b5fd';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Ω${e._corruptionStacks}`, e.x, e.y - s/2 - 10);
      ctx.restore();
    }

    // Darkseid — Will Break aura (moving backwards)
    if (e._willBroken) {
      const wp = (Math.sin(Date.now() / 180) + 1) / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(e.x, e.y, s/2 + 7 + wp * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(88,28,135,${0.25 + wp * 0.20})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(139,92,246,${0.6 + wp * 0.35})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.translate(e.x, e.y);
      ctx.rotate(Date.now() * 0.003);
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = `rgba(196,181,253,${0.75 + wp * 0.25})`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Ω', 0, -s/2 - 14);
      ctx.restore();
    }

    ctx.restore();
  });
  ctx.textAlign = 'left';
}

function drawProjectile(p) {
  const ctx = _renderCtx.ctx;
  ctx.save();
  ctx.translate(p.x, p.y);
  drawProjectileShape(ctx, p.charId || '', p.angle, p.color, Date.now());
  ctx.restore();
}

function drawProjectiles() {
  _renderCtx.projectiles.forEach(p => drawProjectile(p));
}

function drawEffects() {
  const ctx = _renderCtx.ctx;
  _renderCtx.effects.forEach(ef => {
    const maxTimer = ef.maxTimer || (ef.type === 'ring' ? 0.35 : ef.type === 'shockwave' ? 1.0 : 0.4);
    const alpha = Math.max(0, Math.min(1, ef.timer / maxTimer));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (ef.type === 'ring' || ef.type === 'shockwave') {
      ctx.shadowBlur = 14; ctx.shadowColor = ef.color;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.r || 10, 0, Math.PI * 2);
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = ef.type === 'shockwave' ? 4 : 3;
      ctx.stroke();
    } else if (ef.type === 'line') {
      ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
      const dx = ef.tx - ef.x, dy = ef.ty - ef.y;
      const len = Math.max(1, Math.sqrt(dx*dx + dy*dy));
      const nx = dx/len, ny = dy/len;
      const w = 30;
      ctx.beginPath();
      ctx.moveTo(ef.x - ny*w, ef.y + nx*w);
      ctx.lineTo(ef.tx - ny*w, ef.ty + nx*w);
      ctx.lineTo(ef.tx + ny*w, ef.ty - nx*w);
      ctx.lineTo(ef.x + ny*w, ef.y - nx*w);
      ctx.closePath();
      ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = ef.color; ctx.fill();
      ctx.globalAlpha = alpha;
    } else if (ef.type === 'cone_flash') {
      const cdx = ef.tx - ef.x, cdy = ef.ty - ef.y;
      const cangle = Math.atan2(cdy, cdx);
      const crange = Math.min(Math.sqrt(cdx*cdx + cdy*cdy) + 18, 220);
      ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
      ctx.beginPath();
      ctx.moveTo(ef.x, ef.y);
      ctx.arc(ef.x, ef.y, crange, cangle - Math.PI / 4, cangle + Math.PI / 4);
      ctx.closePath();
      ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = ef.color; ctx.fill();
      ctx.globalAlpha = alpha;
    } else if (ef.type === 'death') {
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 15 * (1 - alpha), 0, Math.PI * 2);
      ctx.fillStyle = ef.color;
      ctx.fill();
    } else if (ef.type === 'coin') {
      const prog = 1 - alpha;
      ctx.shadowBlur = 5; ctx.shadowColor = '#f1c40f';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y - prog * 20, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c40f';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', ef.x, ef.y - prog * 20);
    } else if (ef.type === 'silenced') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = ef.color || '#9b59b6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ef.text || 'Silenced!', ef.x, ef.y - (1-alpha)*20);
    } else if (ef.type === 'crit') {
      const prog = 1 - alpha;
      ctx.shadowBlur = 12; ctx.shadowColor = ef.color || '#ffc846';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 20 * prog, 0, Math.PI * 2);
      ctx.fillStyle = ef.color || '#ffc846';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 9 * prog, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    } else if (ef.type === 'hollow_burst') {
      ctx.shadowBlur = 22; ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.r || 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.shadowColor = '#7b0000';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, Math.max(2, (ef.r || 2) * 0.55), 0, Math.PI * 2);
      ctx.strokeStyle = '#7b0000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.shadowBlur = 8; ctx.shadowColor = '#f97316';
      const cr = Math.max(4, (ef.r || 2) * 0.35);
      ctx.strokeStyle = `rgba(249,115,22,${alpha * 0.65})`; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ef.x - cr, ef.y); ctx.lineTo(ef.x + cr, ef.y);
      ctx.moveTo(ef.x, ef.y - cr); ctx.lineTo(ef.x, ef.y + cr);
      ctx.stroke();
    } else if (ef.type === 'vizard_mode_flash') {
      const prog = 1 - alpha;
      ctx.shadowBlur = 40; ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 65 * prog, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(249,115,22,${alpha * 0.95})`; ctx.lineWidth = 4.5; ctx.stroke();
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 45 * prog, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249,115,22,${alpha * 0.16})`; ctx.fill();
      ctx.shadowColor = '#1c0000';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, 28 * prog, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(30,0,0,${alpha * 0.85})`; ctx.lineWidth = 3; ctx.stroke();
      ctx.shadowBlur = 16; ctx.shadowColor = '#dc2626';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4) + prog * Math.PI * 0.4;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * 9, ef.y + Math.sin(a) * 9);
        ctx.lineTo(ef.x + Math.cos(a) * (9 + 52 * prog), ef.y + Math.sin(a) * (9 + 52 * prog));
        ctx.strokeStyle = `rgba(220,38,38,${alpha * 0.60})`; ctx.lineWidth = 1.6; ctx.stroke();
      }
    }
    ctx.restore();
  });
}

function drawOverlay() {
  const ctx = _renderCtx.ctx;
  const betweenWaves = _renderCtx.betweenWaves;
  const betweenTimer = _renderCtx.betweenTimer;
  const wave = _renderCtx.wave;
  const totalWaves = _renderCtx.totalWaves;
  const isInfiniteMode = _renderCtx.isInfiniteMode;
  const shinraTenseiActive = _renderCtx.shinraTenseiActive;
  const shinraTenseiTimer = _renderCtx.shinraTenseiTimer;
  const _sandStormActive = _renderCtx._sandStormActive;
  const _sandStormDuration = _renderCtx._sandStormDuration;

  if (betweenWaves && betweenTimer < 0 && wave < totalWaves) {
    ctx.fillStyle = 'rgba(6,6,14,0.42)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const cx = CANVAS_W/2, cy = CANVAS_H/2;
    ctx.fillStyle = 'rgba(10,10,26,0.88)';
    ctx.beginPath(); ctx.roundRect(cx-165, cy-36, 330, 76, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,20,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(cx-165, cy-36, 330, 76, 14); ctx.stroke();
    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 17px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(I18N.t('hud_prepare'), cx, cy - 8);
    ctx.fillStyle = 'rgba(238,240,255,0.65)';
    ctx.font = '500 10px Inter,sans-serif';
    ctx.fillText(I18N.t('hud_place_towers'), cx, cy + 15);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  if (betweenWaves && betweenTimer > 0 && wave < totalWaves) {
    ctx.fillStyle = 'rgba(6,6,14,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const cx = CANVAS_W/2, cy = CANVAS_H/2;
    ctx.fillStyle = 'rgba(10,10,26,0.9)';
    ctx.beginPath(); ctx.roundRect(cx-145, cy-44, 290, 92, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,70,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(cx-145, cy-44, 290, 92, 14); ctx.stroke();
    ctx.fillStyle = 'rgba(238,240,255,0.45)';
    ctx.font = '500 12px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(I18N.t('hud_next_wave'), cx, cy - 20);
    ctx.fillStyle = '#ffc846';
    ctx.font = 'bold 26px Inter,sans-serif';
    ctx.fillText(`Wave ${wave + 1}  —  ${Math.ceil(betweenTimer)}s`, cx, cy + 7);
    if (isInfiniteMode) {
      const tier = INFINITE_TIERS[getInfiniteTierIdx(wave + 1)];
      ctx.fillStyle = tier.color;
      ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`⚡ ${getTierName(tier).toUpperCase()}  •  ${I18N.t('hud_skip')}`, cx, cy + 28);
      const best = Save.get().stats.melhor_onda_infinita || 0;
      if (best > 0) {
        ctx.fillStyle = 'rgba(251,191,36,0.55)';
        ctx.font = '500 9px Inter,sans-serif';
        ctx.fillText(I18N.t('hud_record_wave', { best }), cx, cy + 42);
      }
    } else {
      ctx.fillStyle = 'rgba(57,255,20,0.75)';
      ctx.font = '500 10px Inter,sans-serif';
      ctx.fillText(`+${(wave + 1) * 11}\u{1F4B0} ${I18N.t('hud_on_complete')}  •  ${I18N.t('hud_skip')}`, cx, cy + 28);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  if (shinraTenseiActive) {
    ctx.fillStyle = 'rgba(245,101,101,0.08)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(245,101,101,0.85)';
    ctx.font = 'bold 13px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ SHINRA TENSEI  ${Math.ceil(shinraTenseiTimer)}s`, CANVAS_W/2, 28);
    ctx.textAlign = 'left';
  }
  if (_sandStormActive) {
    ctx.fillStyle = 'rgba(180,110,20,0.18)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(230,170,50,0.9)';
    ctx.font = 'bold 12px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(I18N.t('evt_sand_active', { s: Math.ceil(_sandStormDuration) }), CANVAS_W/2, 44);
    ctx.textAlign = 'left';
  }
}
