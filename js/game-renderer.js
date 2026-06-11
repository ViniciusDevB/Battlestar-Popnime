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
  drawDarkseidGroundCracks();
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

// ── Background helpers per world ──────────────────────────────────────────────

function _bgNaruto(ctx, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#152610'); sky.addColorStop(0.55, '#1e3412'); sky.addColorStop(1, '#0d1a08');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Distant mountain range (far, lighter)
  ctx.fillStyle = 'rgba(25,42,14,0.75)';
  ctx.beginPath();
  [[0,410],[80,345],[190,375],[275,305],[390,335],[490,285],[570,325],[660,265],[760,305],[875,255],[960,295],[1024,330],[1024,CANVAS_H],[0,CANVAS_H]].forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.closePath(); ctx.fill();

  // Near mountain range (closer, darker)
  ctx.fillStyle = 'rgba(12,20,7,0.88)';
  ctx.beginPath();
  [[0,478],[110,428],[215,448],[315,408],[420,438],[525,398],[635,428],[735,388],[840,418],[940,378],[1024,408],[1024,CANVAS_H],[0,CANVAS_H]].forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.closePath(); ctx.fill();

  // Tree line (pine silhouettes at bottom, slight sway)
  [35,85,150,215,275,365,420,495,565,635,705,780,855,930].forEach((tx,i) => {
    const h = 55 + (i%3)*22; const sw = Math.sin(t*0.7+i*1.4)*2.5;
    ctx.fillStyle='#1c1008'; ctx.fillRect(tx+sw-3,CANVAS_H-h*0.38,6,h*0.38);
    [[1,0.32],[0.78,0.22],[0.58,0.14]].forEach(([sc,off])=>{
      ctx.fillStyle = sc===1?'#183d0d':sc<0.8?'#1e4a10':'#234f14';
      ctx.beginPath(); ctx.moveTo(tx+sw,CANVAS_H-h*(0.32+off*2.8));
      ctx.lineTo(tx+sw-20*sc,CANVAS_H-h*(0.32+off*2.8)+24*sc);
      ctx.lineTo(tx+sw+20*sc,CANVAS_H-h*(0.32+off*2.8)+24*sc);
      ctx.closePath(); ctx.fill();
    });
  });

  // Floating leaves
  [0.12,0.37,0.63,0.81,0.24,0.55,0.70,0.42,0.18,0.93,0.08,0.76,0.31,0.59,0.85,0.47].forEach((s,i) => {
    const lx=((s*1024+t*(22+s*32))%1060)-20, ly=60+Math.sin(t*0.8+i*0.7)*45+s*420;
    const a=0.25+Math.sin(t+i)*0.18;
    ctx.fillStyle=i%3===0?`rgba(200,110,25,${a})`:i%3===1?`rgba(80,165,35,${a})`:`rgba(215,155,35,${a})`;
    ctx.save(); ctx.translate(lx,ly); ctx.rotate(t*0.5+i);
    ctx.beginPath(); ctx.ellipse(0,0,4,2,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  });

  // Ground mist
  const fog=ctx.createLinearGradient(0,CANVAS_H-90,0,CANVAS_H);
  fog.addColorStop(0,'rgba(170,215,140,0)'); fog.addColorStop(1,'rgba(170,215,140,0.07)');
  ctx.fillStyle=fog; ctx.fillRect(0,CANVAS_H-90,CANVAS_W,90);
}

function _bgOnePiece(ctx, t) {
  const sky=ctx.createLinearGradient(0,0,0,CANVAS_H);
  sky.addColorStop(0,'#020c1c'); sky.addColorStop(0.45,'#041428'); sky.addColorStop(0.72,'#06203e'); sky.addColorStop(1,'#0a2e58');
  ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Stars
  [0.10,0.22,0.35,0.47,0.58,0.69,0.78,0.88,0.95,0.03,0.15,0.28,0.41,0.52,0.64,0.73,0.83,0.91,0.07,0.19,0.32,0.44,0.56,0.67,0.77,0.87,0.98,0.13,0.26,0.39].forEach((s,i)=>{
    const tw=(Math.sin(t*1.5+i*0.9)+1)*0.5;
    ctx.fillStyle=`rgba(255,255,225,${0.35+tw*0.55})`;
    ctx.beginPath(); ctx.arc(s*1024,s*210,0.7+tw*0.9,0,Math.PI*2); ctx.fill();
  });

  // Moon
  const mx=820,my=75;
  const mg=ctx.createRadialGradient(mx,my,0,mx,my,75);
  mg.addColorStop(0,'rgba(215,228,255,0.14)'); mg.addColorStop(1,'rgba(215,228,255,0)');
  ctx.fillStyle=mg; ctx.fillRect(mx-75,my-75,150,150);
  ctx.fillStyle='#c5d5ee'; ctx.beginPath(); ctx.arc(mx,my,26,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#7d8fa8'; ctx.beginPath(); ctx.arc(mx+9,my-4,9,0,Math.PI*2); ctx.fill();

  // Island silhouette
  ctx.fillStyle='rgba(4,18,38,0.85)';
  ctx.beginPath();
  [[0,418],[65,398],[130,378],[210,355],[295,375],[360,348],[435,368],[492,398],[1024,398],[1024,CANVAS_H],[0,CANVAS_H]].forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.closePath(); ctx.fill();

  // Animated ocean waves
  [0,1,2].forEach(layer=>{
    const wy=418+layer*48, a=0.10+layer*0.09, sp=0.6+layer*0.32, amp=9-layer*2.5;
    ctx.strokeStyle=`rgba(25,110,195,${a})`; ctx.lineWidth=2.5-layer*0.6;
    ctx.beginPath();
    for(let x=0;x<=CANVAS_W;x+=5){
      const y=wy+Math.sin((x/82)+t*sp)*amp+Math.sin((x/42)+t*sp*1.4)*(amp*0.38);
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
  });

  // Ship silhouette
  const sx=810,sy=390;
  ctx.fillStyle='rgba(4,14,28,0.92)';
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+62,sy); ctx.lineTo(sx+52,sy+20); ctx.lineTo(sx+10,sy+20); ctx.closePath(); ctx.fill();
  ctx.fillRect(sx+26,sy-48,3,48);
  ctx.fillStyle='rgba(25,75,118,0.55)';
  ctx.beginPath(); ctx.moveTo(sx+29,sy-48); ctx.lineTo(sx+29,sy-10); ctx.lineTo(sx+58,sy-26); ctx.closePath(); ctx.fill();
}

function _bgBleach(ctx, t) {
  const sky=ctx.createLinearGradient(0,0,0,CANVAS_H);
  sky.addColorStop(0,'#0c0916'); sky.addColorStop(0.55,'#130f28'); sky.addColorStop(1,'#090710');
  ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Seireitei curved rooftop silhouettes
  [{x:20,y:355,w:205,p:62},{x:272,y:322,w:162,p:52},{x:490,y:362,w:225,p:72},{x:744,y:328,w:184,p:58},{x:888,y:372,w:145,p:47}].forEach(r=>{
    ctx.fillStyle='rgba(13,9,28,0.92)';
    ctx.beginPath(); ctx.moveTo(r.x,r.y+r.p);
    ctx.bezierCurveTo(r.x+r.w*0.2,r.y-r.p*0.28,r.x+r.w*0.42,r.y,r.x+r.w*0.5,r.y);
    ctx.bezierCurveTo(r.x+r.w*0.58,r.y,r.x+r.w*0.8,r.y-r.p*0.28,r.x+r.w,r.y+r.p);
    ctx.lineTo(r.x+r.w,CANVAS_H); ctx.lineTo(r.x,CANVAS_H); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(50,35,90,0.5)'; ctx.fillRect(r.x+r.w*0.5-3,r.y-5,7,7);
  });

  // Reishi particles (spirit energy rising)
  [0.08,0.17,0.29,0.43,0.54,0.62,0.74,0.83,0.91,0.05,0.21,0.33,0.48,0.57,0.69,0.79,0.88,0.96,0.12,0.25,0.38,0.51,0.66,0.77].forEach((s,i)=>{
    const speed=22+s*42;
    const ry=((CANVAS_H+30-(t*speed+s*CANVAS_H)%(CANVAS_H+50)));
    const a=0.18+Math.sin(t*2.2+i)*0.13;
    ctx.fillStyle=`rgba(${175+i%2*45},198,255,${a})`;
    ctx.beginPath(); ctx.arc(s*1024,ry,1.4+s*1.8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=`rgba(145,175,255,${a*0.28})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(s*1024,ry); ctx.lineTo(s*1024,ry+9); ctx.stroke();
  });

  // Cherry blossom petals
  [0.15,0.38,0.62,0.84,0.07,0.29,0.51,0.73,0.95,0.22,0.46,0.68].forEach((s,i)=>{
    const px=((s*1024+t*(16+s*26))%1120)-50, py=55+Math.sin(t*0.55+i*1.1)*32+s*445;
    const a=0.22+Math.sin(t+i*0.7)*0.14;
    ctx.fillStyle=`rgba(255,175,198,${a})`;
    ctx.save(); ctx.translate(px,py); ctx.rotate(t*0.35+i);
    ctx.beginPath(); ctx.ellipse(0,0,5,2.5,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  });

  // Spirit glow at ground
  const sg=ctx.createLinearGradient(0,CANVAS_H-140,0,CANVAS_H);
  sg.addColorStop(0,'rgba(55,38,115,0)'); sg.addColorStop(1,'rgba(55,38,115,0.11)');
  ctx.fillStyle=sg; ctx.fillRect(0,CANVAS_H-140,CANVAS_W,140);
}

function _bgMarvel(ctx, t) {
  const sky=ctx.createLinearGradient(0,0,0,CANVAS_H);
  sky.addColorStop(0,'#050710'); sky.addColorStop(0.6,'#090e1a'); sky.addColorStop(1,'#0d1420');
  ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Building silhouettes (NYC skyline)
  [
    {x:0,w:82,h:282},{x:72,w:62,h:355},{x:126,w:42,h:225},{x:160,w:92,h:402},
    {x:244,w:52,h:265},{x:288,w:112,h:465},{x:392,w:66,h:305},{x:450,w:88,h:385},
    {x:530,w:56,h:245},{x:578,w:102,h:425},{x:672,w:72,h:325},{x:736,w:82,h:375},
    {x:810,w:92,h:295},{x:895,w:62,h:355},{x:950,w:72,h:275}
  ].forEach(b=>{
    const baseY=CANVAS_H-b.h;
    ctx.fillStyle='rgba(7,9,17,0.96)'; ctx.fillRect(b.x,baseY,b.w,b.h);
    // Windows
    for(let r=0;r<6;r++) for(let c=0;c<2;c++){
      if(b.w<50&&c>0) continue;
      const wx=b.x+8+c*(b.w-22), wy=baseY+18+r*45;
      if(wy>CANVAS_H-10) continue;
      const lit=Math.sin(b.x*0.11+r*7.3+c*13.7)>-0.55;
      if(lit){ ctx.fillStyle=`rgba(255,215,95,${0.38+Math.sin(b.x*0.05+r)*0.18})`; ctx.fillRect(wx,wy,7,9); }
    }
    // Antenna + blink on tall buildings
    if(b.h>360){
      ctx.fillStyle='rgba(18,22,38,0.9)'; ctx.fillRect(b.x+b.w*0.5-1,baseY-22,2,22);
      if(Math.sin(t*2.6+b.x)>0){ ctx.fillStyle='rgba(255,45,45,0.85)'; ctx.beginPath(); ctx.arc(b.x+b.w*0.5,baseY-22,2.2,0,Math.PI*2); ctx.fill(); }
    }
  });

  // Searchlight beam
  const ba=Math.sin(t*0.42)*0.28+0.52;
  ctx.save(); ctx.globalAlpha=0.55;
  const bg2=ctx.createLinearGradient(195,0,195+Math.cos(ba)*420,Math.sin(ba)*420);
  bg2.addColorStop(0,'rgba(195,218,255,0.09)'); bg2.addColorStop(1,'rgba(195,218,255,0)');
  ctx.fillStyle=bg2; ctx.beginPath(); ctx.moveTo(195,0);
  ctx.lineTo(195+Math.cos(ba-0.04)*520,Math.sin(ba-0.04)*520);
  ctx.lineTo(195+Math.cos(ba+0.04)*520,Math.sin(ba+0.04)*520);
  ctx.closePath(); ctx.fill(); ctx.restore();

  // City ambient glow
  const cg=ctx.createLinearGradient(0,CANVAS_H-110,0,CANVAS_H);
  cg.addColorStop(0,'rgba(255,175,45,0)'); cg.addColorStop(1,'rgba(255,175,45,0.07)');
  ctx.fillStyle=cg; ctx.fillRect(0,CANVAS_H-110,CANVAS_W,110);
}

function _bgDC(ctx, t) {
  const sky=ctx.createLinearGradient(0,0,0,CANVAS_H);
  sky.addColorStop(0,'#090202'); sky.addColorStop(0.42,'#160404'); sky.addColorStop(0.72,'#200506'); sky.addColorStop(1,'#280506');
  ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Omega watermark
  ctx.save(); ctx.globalAlpha=0.038+Math.sin(t*0.5)*0.01;
  ctx.font='bold 340px serif'; ctx.fillStyle='#ff1a00';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('Ω',CANVAS_W*0.5,CANVAS_H*0.5); ctx.restore();

  // Parademon shadow swarms
  [0.10,0.28,0.44,0.61,0.77,0.92,0.15,0.35,0.55,0.72].forEach((s,i)=>{
    const px=((s*1200+t*(62+s*42))%1250)-110, py=28+s*215;
    const a=0.13+Math.sin(t+i)*0.04;
    ctx.fillStyle=`rgba(28,8,4,${a})`;
    ctx.save(); ctx.translate(px,py);
    ctx.beginPath(); ctx.ellipse(0,0,11,4.5,0,0,Math.PI*2);
    ctx.moveTo(-11,0); ctx.lineTo(-21,-7); ctx.lineTo(-7,0);
    ctx.moveTo(11,0); ctx.lineTo(21,-7); ctx.lineTo(7,0); ctx.fill(); ctx.restore();
  });

  // Metropolis buildings (damaged)
  [
    {x:0,w:102,h:252},{x:92,w:72,h:382},{x:157,w:122,h:302},
    {x:268,w:82,h:445},{x:342,w:57,h:262},{x:392,w:92,h:352},
    {x:477,w:112,h:482},{x:581,w:67,h:292},{x:640,w:97,h:402},
    {x:729,w:77,h:322},{x:798,w:108,h:462},{x:898,w:72,h:282},{x:962,w:68,h:372}
  ].forEach(b=>{
    const baseY=CANVAS_H-b.h;
    ctx.fillStyle='rgba(9,3,3,0.96)'; ctx.fillRect(b.x,baseY,b.w,b.h);
    // Damaged fire-lit windows
    for(let r=0;r<4;r++) for(let c=0;c<2;c++){
      if(b.w<60&&c>0) continue;
      const wx=b.x+8+c*28, wy=baseY+14+r*52;
      if(wy>CANVAS_H-10) continue;
      if(Math.sin(b.x*0.32+r*7.1+c*13)>0.15){
        const a=0.12+Math.sin(t*1.6+b.x+r)*0.1;
        ctx.fillStyle=`rgba(215,55,8,${a})`; ctx.fillRect(wx,wy,11,14);
      }
    }
    // Base fire
    if(Math.sin(b.x*0.71)>0.28){
      const fh=22+Math.sin(t*3.1+b.x)*10;
      const ff=ctx.createLinearGradient(b.x+b.w*0.5,baseY+b.h-fh,b.x+b.w*0.5,baseY+b.h);
      ff.addColorStop(0,'rgba(255,75,0,0)'); ff.addColorStop(1,'rgba(255,75,0,0.38)');
      ctx.fillStyle=ff; ctx.fillRect(b.x,baseY+b.h-fh,b.w,fh);
    }
  });

  // Distant explosion glows
  [145,372,642,875].forEach((gx,i)=>{
    const gy=75+i*42, p=0.5+Math.sin(t*2.2+i*1.8)*0.32;
    const gg=ctx.createRadialGradient(gx,gy,0,gx,gy,62);
    gg.addColorStop(0,`rgba(255,78,0,${0.11*p})`); gg.addColorStop(1,'rgba(255,78,0,0)');
    ctx.fillStyle=gg; ctx.fillRect(gx-62,gy-62,124,124);
  });
}

function _bgDefault(ctx, t) {
  const g=ctx.createRadialGradient(CANVAS_W/2,CANVAS_H/2,0,CANVAS_W/2,CANVAS_H/2,CANVAS_W);
  g.addColorStop(0,'#1a2010'); g.addColorStop(1,'#080e08');
  ctx.fillStyle=g; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
}

function drawBackground() {
  const ctx=_renderCtx.ctx, stage=_renderCtx.stage, world=stage?.world, t=Date.now()*0.001;
  switch(world){
    case 'naruto':   _bgNaruto(ctx,t);   break;
    case 'onepiece': _bgOnePiece(ctx,t); break;
    case 'bleach':   _bgBleach(ctx,t);   break;
    case 'marvel':   _bgMarvel(ctx,t);   break;
    case 'dc':       _bgDC(ctx,t);       break;
    default:         _bgDefault(ctx,t);  break;
  }
}

function drawPath() {
  const ctx=_renderCtx.ctx, stage=_renderCtx.stage, world=stage?.world;
  const pathsToDraw=window.currentPaths||[PATH_POINTS];
  const S={
    naruto:   {o:'rgba(95,55,18,0.18)',  m:'rgba(55,28,8,0.68)',  c:'#5a3015',  s:'#6a3c1c',  e:'rgba(255,195,65,0.13)'},
    onepiece: {o:'rgba(18,75,148,0.22)', m:'rgba(9,48,98,0.72)',  c:'#184888',  s:'#1e5c9e',  e:'rgba(95,198,255,0.18)'},
    bleach:   {o:'rgba(75,58,138,0.22)', m:'rgba(28,18,68,0.72)', c:'#281858',  s:'#38236e',  e:'rgba(158,128,252,0.2)' },
    marvel:   {o:'rgba(28,28,48,0.22)',  m:'rgba(8,10,22,0.72)',  c:'#121622',  s:'#1a1f2e',  e:'rgba(195,215,255,0.14)'},
    dc:       {o:'rgba(78,8,4,0.22)',    m:'rgba(38,4,4,0.78)',   c:'#280303',  s:'#340404',  e:'rgba(255,55,0,0.14)'   }
  };
  const s=S[world]||{o:'rgba(175,138,58,0.14)',m:'rgba(0,0,0,0.62)',c:'#3c2520',s:'#4c3228',e:'rgba(255,195,65,0.12)'};

  pathsToDraw.forEach(pArr=>{
    if(!pArr||pArr.length===0) return;
    ctx.lineJoin='round'; ctx.lineCap='round';
    [[46,s.o],[36,s.m],[28,s.c],[14,s.s]].forEach(([lw,col])=>{
      ctx.strokeStyle=col; ctx.lineWidth=lw;
      ctx.beginPath(); ctx.moveTo(pArr[0].x,pArr[0].y); pArr.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
    });
    // Surface detail line
    ctx.lineWidth=2;
    if(world==='naruto'){ ctx.strokeStyle='rgba(75,38,8,0.32)'; ctx.setLineDash([4,9]); }
    else if(world==='marvel'||world==='dc'){ ctx.strokeStyle=world==='dc'?'rgba(255,55,0,0.13)':'rgba(255,255,195,0.14)'; ctx.setLineDash([14,20]); }
    else{ ctx.strokeStyle=s.e; ctx.setLineDash([10,16]); }
    ctx.beginPath(); ctx.moveTo(pArr[0].x,pArr[0].y); pArr.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle='rgba(245,101,101,0.7)'; ctx.font='600 10px Inter,sans-serif';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('SPAWN',pArr[0].x+4,pArr[0].y+4);
  });

  if(pathsToDraw&&pathsToDraw.length>0&&pathsToDraw[0].length>0){
    const endP=pathsToDraw[0][pathsToDraw[0].length-1];
    ctx.fillStyle='rgba(57,255,20,0.85)'; ctx.beginPath(); ctx.roundRect(endP.x-18,endP.y-12,36,24,4); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 9px Inter,sans-serif';
    ctx.fillText('BASE',endP.x-12,endP.y+20);
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

// Rachaduras + magma do Darkseid desenhadas NO CHÃO (antes de torres/inimigos)
function drawDarkseidGroundCracks() {
  const towers = _renderCtx.towers;
  const ctx    = _renderCtx.ctx;
  const ds = towers.find(t => t.rarity >= 7);
  if (!ds) return;

  if (!ds._crackLines) {
    const prng = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5; return x - Math.floor(x); };
    ds._crackLines = [];
    for (let ci = 0; ci < 8; ci++) {          // 8 rachaduras em setores iguais de 45°
      const segs = [{ x: ds.x, y: ds.y }];
      // Setor garantido: cada rachadura ocupa 1/8 do círculo, com pequena variação
      const sectorAng = (ci / 8) * Math.PI * 2;
      let cx = ds.x, cy = ds.y, ang = sectorAng + (prng(ci) - 0.5) * (Math.PI / 8);
      for (let s = 0; s < 5; s++) {            // segmentos mais longos
        const len = 60 + prng(ci * 13 + s) * 90;  // 60-150px cada
        ang += (prng(ci + s * 7) - 0.5) * 0.7;
        cx += Math.cos(ang) * len;
        cy += Math.sin(ang) * len;
        segs.push({ x: cx, y: cy });
      }
      ds._crackLines.push(segs);
    }
  }

  const n = Date.now();
  const mp = (Math.sin(n / 230) + 1) / 2;     // magma pulse
  ctx.save();
  ctx.lineCap = 'round';

  for (const segs of ds._crackLines) {
    // Magma glow — source-over, não sangra por cima de unidades
    ctx.beginPath();
    for (let i = 0; i < segs.length; i++) i === 0 ? ctx.moveTo(segs[i].x, segs[i].y) : ctx.lineTo(segs[i].x, segs[i].y);
    ctx.strokeStyle = `rgba(255,${55 + Math.round(mp * 85)},0,${0.32 + mp * 0.18})`;
    ctx.lineWidth = 7 + mp * 5;
    ctx.shadowBlur = 12 + mp * 10; ctx.shadowColor = '#ff5500';
    ctx.stroke();
    // Crack escura na superfície
    ctx.beginPath();
    for (let i = 0; i < segs.length; i++) i === 0 ? ctx.moveTo(segs[i].x, segs[i].y) : ctx.lineTo(segs[i].x, segs[i].y);
    ctx.strokeStyle = `rgba(6,0,0,${0.72 + mp * 0.1})`;
    ctx.lineWidth = 2; ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // Pool de magma central (sob Darkseid, no chão)
  const pr = ctx.createRadialGradient(ds.x, ds.y, 0, ds.x, ds.y, 58 + mp * 14);
  pr.addColorStop(0,   `rgba(255,100,0,${0.32 + mp * 0.16})`);
  pr.addColorStop(0.55, `rgba(180,20,0,${0.15 + mp * 0.07})`);
  pr.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = pr;
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(ds.x, ds.y, 72, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawTowers() {
  const ctx = _renderCtx.ctx;
  const towers = _renderCtx.towers;
  const shinraTenseiActive = _renderCtx.shinraTenseiActive;
  const selectedTowerIdx = _renderCtx.selectedTowerIdx;
  const _gojoBuffedSet = _renderCtx._gojoBuffedSet;
  const waveActive = _renderCtx.waveActive;

  // Apokolips atmosphere — borda única do Darkseid (diferente do Ichigo)
  if (towers.some(t => t.rarity >= 7)) {
    const n = Date.now();
    const vP = (Math.sin(n / 700) + 1) / 2;
    ctx.save();

    // 1. Escuridão opressiva nas bordas (preto profundo, não vermelho como Ichigo)
    const darkV = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_H * 0.3, CANVAS_W/2, CANVAS_H/2, CANVAS_H * 1.05);
    darkV.addColorStop(0,    'rgba(0,0,0,0)');
    darkV.addColorStop(0.55, `rgba(4,0,0,0.08)`);
    darkV.addColorStop(0.78, `rgba(8,0,0,${0.20 + vP * 0.05})`);
    darkV.addColorStop(1,    `rgba(0,0,0,${0.55 + vP * 0.08})`);
    ctx.fillStyle = darkV; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Magma queimando pelos cantos
    [[0,0],[CANVAS_W,0],[0,CANVAS_H],[CANVAS_W,CANVAS_H]].forEach(([cx,cy], i) => {
      const cP = (Math.sin(n / 550 + i * 0.9) + 1) / 2;
      const cG = ctx.createRadialGradient(cx, cy, 0, cx, cy, CANVAS_H * 0.38);
      cG.addColorStop(0,    `rgba(150,18,0,${0.26 + cP * 0.13})`);
      cG.addColorStop(0.45, `rgba(80,4,0,${0.09 + cP * 0.05})`);
      cG.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = cG; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    });

    // 3. Rachaduras entrando pelas bordas da tela (geradas uma vez, estáveis)
    if (!window._apokolipsBorderCracks) {
      const rng = (s) => { const x = Math.sin(s * 91.3 + 78.9) * 43758.5; return x - Math.floor(x); };
      window._apokolipsBorderCracks = [];
      for (let ci = 0; ci < 8; ci++) {
        const side = ci % 4;
        let sx, sy, ang;
        if (side === 0) { sx = 0.1*CANVAS_W + rng(ci)*0.8*CANVAS_W; sy = 0;        ang =  Math.PI/2 + (rng(ci+10)-0.5)*0.7; }
        if (side === 1) { sx = CANVAS_W;  sy = 0.1*CANVAS_H + rng(ci)*0.8*CANVAS_H; ang =  Math.PI   + (rng(ci+10)-0.5)*0.7; }
        if (side === 2) { sx = 0.1*CANVAS_W + rng(ci)*0.8*CANVAS_W; sy = CANVAS_H;  ang = -Math.PI/2 + (rng(ci+10)-0.5)*0.7; }
        if (side === 3) { sx = 0;         sy = 0.1*CANVAS_H + rng(ci)*0.8*CANVAS_H; ang =            (rng(ci+10)-0.5)*0.7; }
        const segs = [{ x: sx, y: sy }];
        let bx = sx, by = sy, a = ang;
        for (let s = 0; s < 3; s++) {
          const len = 18 + rng(ci*5+s) * 28;
          a += (rng(ci*3+s+20)-0.5)*0.8;
          bx += Math.cos(a) * len; by += Math.sin(a) * len;
          segs.push({ x: bx, y: by });
        }
        window._apokolipsBorderCracks.push(segs);
      }
    }
    const bP = (Math.sin(n / 400) + 1) / 2;
    ctx.lineCap = 'round';
    for (const segs of window._apokolipsBorderCracks) {
      ctx.beginPath();
      for (let i = 0; i < segs.length; i++) i === 0 ? ctx.moveTo(segs[i].x, segs[i].y) : ctx.lineTo(segs[i].x, segs[i].y);
      ctx.strokeStyle = `rgba(255,${45+Math.round(bP*70)},0,${0.38 + bP*0.25})`;
      ctx.lineWidth = 3 + bP*2; ctx.shadowBlur = 10+bP*8; ctx.shadowColor = '#ff4500'; ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < segs.length; i++) i === 0 ? ctx.moveTo(segs[i].x, segs[i].y) : ctx.lineTo(segs[i].x, segs[i].y);
      ctx.strokeStyle = 'rgba(4,0,0,0.82)'; ctx.lineWidth = 1.2; ctx.shadowBlur = 0; ctx.stroke();
    }

    // 4. Símbolo Ω nos 4 cantos — domínio de Darkseid
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pad = 20;
    [[pad,pad],[CANVAS_W-pad,pad],[pad,CANVAS_H-pad],[CANVAS_W-pad,CANVAS_H-pad]].forEach(([cx,cy], i) => {
      const oP = (Math.sin(n / 650 + i * 0.75) + 1) / 2;
      ctx.font = `bold ${14 + Math.round(oP*5)}px monospace`;
      ctx.fillStyle = `rgba(180,22,0,${0.14 + oP*0.12})`;
      ctx.shadowBlur = 5 + oP*7; ctx.shadowColor = '#ff4500';
      ctx.fillText('Ω', cx, cy);
    });

    ctx.restore();
  }

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
      const stacks    = t._tyrantStacks || 0;
      const intensity = Math.min(1 + stacks * 0.03, 2.5);
      const pulse1    = (Math.sin(n7 / 400 * intensity) + 1) / 2;

      // ── Omega Beam path generator (right-angle turns like the comics) ──
      const _genOmegaPath = (sx, sy, mirror) => {
        const pts = [{ x: sx, y: sy }];
        // 8 possible starting angles (octants), mirrored for right eye
        const startAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
        let ang = startAngles[Math.floor(Math.random() * startAngles.length)];
        if (mirror) ang = Math.PI - ang;
        let cx = sx, cy = sy;
        for (let s = 0; s < 5; s++) {
          const len = 120 + Math.random() * 200;
          cx += Math.cos(ang) * len;
          cy += Math.sin(ang) * len;
          // Allow beams to go slightly off-map for dramatic effect
          cx = Math.max(-120, Math.min(CANVAS_W + 120, cx));
          cy = Math.max(-120, Math.min(CANVAS_H + 120, cy));
          pts.push({ x: cx, y: cy });
          ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2; // exact 90° turn
        }
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
          const ddx = pts[i].x - pts[i-1].x, ddy = pts[i].y - pts[i-1].y;
          total += Math.sqrt(ddx*ddx + ddy*ddy);
        }
        return { pts, total, drawn: 0 };
      };

      // ── Initialize beam state machine ──
      if (!t._omegaBeamState) {
        t._omegaBeamState = {
          left:      _genOmegaPath(t.x - 5, t.y - 8, false),
          right:     _genOmegaPath(t.x + 5, t.y - 8, true),
          phase:     'extend',   // extend | hold | retract
          holdMs:    0,
          lastTime:  n7,
        };
      }

      // ── Update beam animation ──
      const bs = t._omegaBeamState;
      const dt = Math.min(n7 - bs.lastTime, 100); // cap to avoid jumps
      bs.lastTime = n7;
      const BEAM_SPEED = 380 * intensity; // px/s

      if (bs.phase === 'extend') {
        const delta = BEAM_SPEED * dt / 1000;
        bs.left.drawn  = Math.min(bs.left.drawn  + delta, bs.left.total);
        bs.right.drawn = Math.min(bs.right.drawn + delta, bs.right.total);
        if (bs.left.drawn >= bs.left.total && bs.right.drawn >= bs.right.total) {
          bs.phase = 'hold'; bs.holdMs = 0;
        }
      } else if (bs.phase === 'hold') {
        bs.holdMs += dt;
        if (bs.holdMs > 500) bs.phase = 'retract';
      } else {
        const delta = BEAM_SPEED * 2.2 * dt / 1000;
        bs.left.drawn  = Math.max(bs.left.drawn  - delta, 0);
        bs.right.drawn = Math.max(bs.right.drawn - delta, 0);
        if (bs.left.drawn <= 0 && bs.right.drawn <= 0) {
          bs.left  = _genOmegaPath(t.x - 5, t.y - 8, false);
          bs.right = _genOmegaPath(t.x + 5, t.y - 8, true);
          bs.phase = 'extend';
        }
      }

      // ── Draw one Omega Beam (sharp right-angle corners, 3-layer glow) ──
      const _drawOmegaBeam = (beam) => {
        if (beam.drawn <= 0) return;
        ctx.save();
        ctx.lineJoin   = 'miter';
        ctx.miterLimit = 12;
        ctx.globalCompositeOperation = 'lighter';
        let tipX = beam.pts[0].x, tipY = beam.pts[0].y;

        // Build partial polyline up to `drawn` pixels
        const buildPath = () => {
          ctx.beginPath();
          ctx.moveTo(beam.pts[0].x, beam.pts[0].y);
          let rem = beam.drawn;
          for (let i = 1; i < beam.pts.length; i++) {
            const ddx = beam.pts[i].x - beam.pts[i-1].x;
            const ddy = beam.pts[i].y - beam.pts[i-1].y;
            const slen = Math.sqrt(ddx*ddx + ddy*ddy);
            if (rem <= slen) {
              const frac = rem / slen;
              tipX = beam.pts[i-1].x + ddx * frac;
              tipY = beam.pts[i-1].y + ddy * frac;
              ctx.lineTo(tipX, tipY);
              break;
            }
            ctx.lineTo(beam.pts[i].x, beam.pts[i].y);
            tipX = beam.pts[i].x; tipY = beam.pts[i].y;
            rem -= slen;
          }
        };

        // Outer diffuse glow
        buildPath();
        ctx.strokeStyle = 'rgba(255,20,0,0.14)';
        ctx.lineWidth = 24; ctx.shadowBlur = 40; ctx.shadowColor = '#ff1800'; ctx.stroke();
        // Mid glow
        buildPath();
        ctx.strokeStyle = `rgba(255,90,0,${0.4 + pulse1 * 0.15})`;
        ctx.lineWidth = 8; ctx.shadowBlur = 20; ctx.shadowColor = '#ff4500'; ctx.stroke();
        // Bright core
        buildPath();
        ctx.strokeStyle = 'rgba(255,210,120,0.92)';
        ctx.lineWidth = 2.5; ctx.shadowBlur = 10; ctx.shadowColor = '#ffbb44'; ctx.stroke();

        // Tip corona
        const tipPulse = (Math.sin(n7 * 0.006 * intensity) + 1) / 2;
        ctx.beginPath(); ctx.arc(tipX, tipY, 10 + tipPulse * 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,70,0,0.75)';
        ctx.shadowBlur = 32; ctx.shadowColor = '#ff4500'; ctx.fill();
        ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,235,180,0.98)'; ctx.shadowBlur = 6; ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      };

      _drawOmegaBeam(bs.left);
      _drawOmegaBeam(bs.right);

      // ── Floating Embers + Rings (kept) ───────────────────────────────────
      ctx.save();
      ctx.translate(t.x, t.y);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) {
        const sparkPhase = ((n7 * 0.001 * intensity + i * 2.5) % (Math.PI * 2));
        const sr = 25 + Math.abs(Math.cos(sparkPhase * 2)) * 30;
        const sa = sparkPhase * 1.5;
        const sx = Math.cos(sa) * sr;
        const sy = Math.sin(sa) * sr - (sparkPhase * 15);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#ff8c00' : '#ff2200';
        ctx.shadowBlur = 10; ctx.shadowColor = '#ff4500';
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.rotate(-n7 * 0.0012 * intensity);
      ctx.beginPath(); ctx.arc(0, 0, 52 + pulse1 * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 69, 0, ${0.5 + pulse1 * 0.4})`;
      ctx.lineWidth = 2.5; ctx.setLineDash([15, 12, 5, 12]); ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.rotate(n7 * 0.0018 * intensity);
      ctx.beginPath(); ctx.arc(0, 0, 58 + pulse1 * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(139, 0, 0, ${0.6 + pulse1 * 0.4})`;
      ctx.lineWidth = 1.5; ctx.setLineDash([35, 15]); ctx.stroke();
      ctx.restore();

      ctx.restore();

      // Omega Hologram + TYRANT counter
      ctx.save();
      const pOmega = (Math.sin(n7 / 300 * intensity) + 1) / 2;
      ctx.font = `bold ${18 + Math.min(stacks, 12)}px monospace`;
      ctx.fillStyle = `rgba(255, 69, 0, ${0.85 + pOmega * 0.15})`;
      ctx.shadowBlur = 15 + pOmega * 15; ctx.shadowColor = '#ff0000';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Ω', t.x, t.y - 42);
      if (stacks > 0) {
        ctx.font = 'bold 9px Inter,sans-serif';
        ctx.fillStyle = '#ffc846';
        ctx.shadowBlur = 8; ctx.shadowColor = '#d97706';
        ctx.fillText(`+${Math.round(stacks * 3)}% TYRANT`, t.x, t.y - 56);
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
      const is7 = t.rarity === 7;
      ctx.save();
      ctx.shadowBlur = is7 ? 10 : 8; 
      ctx.shadowColor = is7 ? '#39FF14' : '#dc2626';
      ctx.fillStyle = is7 ? '#39FF14' : '#e63939';
      ctx.font = 'bold 8px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(is7 ? '7★' : '6★', t.x + 16, t.y - 19);
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
    } else if (ef.type === 'omega_beam_strike') {
      // Darkseid chain ray: right-angle glowing beam + impact burst
      const dx = ef.tx - ef.x, dy = ef.ty - ef.y;
      const useH = Math.abs(dx) >= Math.abs(dy); // horizontal first?
      const midX = useH ? ef.tx : ef.x;
      const midY = useH ? ef.y : ef.ty;
      const prog = 1 - alpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'miter'; ctx.miterLimit = 15;
      const _beamPath = () => { ctx.beginPath(); ctx.moveTo(ef.x, ef.y); ctx.lineTo(midX, midY); ctx.lineTo(ef.tx, ef.ty); };
      // Outer diffuse glow
      _beamPath(); ctx.strokeStyle = `rgba(255,20,0,${alpha * 0.18})`; ctx.lineWidth = 28; ctx.shadowBlur = 42; ctx.shadowColor = '#ff1800'; ctx.stroke();
      // Mid glow
      _beamPath(); ctx.strokeStyle = `rgba(255,90,0,${alpha * 0.7})`; ctx.lineWidth = 10; ctx.shadowBlur = 22; ctx.shadowColor = '#ff4500'; ctx.stroke();
      // Bright core
      _beamPath(); ctx.strokeStyle = `rgba(255,210,120,${alpha * 0.95})`; ctx.lineWidth = 3; ctx.shadowBlur = 12; ctx.shadowColor = '#ffbb44'; ctx.stroke();
      // Source flash at Darkseid
      ctx.beginPath(); ctx.arc(ef.x, ef.y, 9 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,235,180,${alpha})`; ctx.shadowBlur = 18; ctx.shadowColor = '#ff4500'; ctx.fill();
      // Impact burst at target
      ctx.beginPath(); ctx.arc(ef.tx, ef.ty, 18 + 12 * prog, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,55,0,${alpha * 0.65})`; ctx.shadowBlur = 38; ctx.shadowColor = '#ff4500'; ctx.fill();
      ctx.beginPath(); ctx.arc(ef.tx, ef.ty, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,235,150,${alpha})`; ctx.fill();
      // Cross beams at impact (4 cardinal spokes)
      for (let ci = 0; ci < 4; ci++) {
        const ca = ci * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(ef.tx, ef.ty);
        ctx.lineTo(ef.tx + Math.cos(ca) * (22 + 14 * prog), ef.ty + Math.sin(ca) * (22 + 14 * prog));
        ctx.strokeStyle = `rgba(255,140,0,${alpha * 0.7})`; ctx.lineWidth = 1.8; ctx.shadowBlur = 10; ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    } else if (ef.type === 'omega_eye_flash') {
      // Flash at Darkseid's eyes when chain ray fires
      const prog = 1 - alpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.arc(ef.x, ef.y, 55 * prog, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,20,0,${alpha * 0.14})`; ctx.shadowBlur = 35; ctx.shadowColor = '#ff2200'; ctx.fill();
      for (const offX of [-5, 5]) {
        ctx.beginPath(); ctx.arc(ef.x + offX, ef.y - 8, 7 + 5 * prog, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,80,${alpha})`; ctx.shadowBlur = 22; ctx.shadowColor = '#ff4500'; ctx.fill();
        ctx.beginPath(); ctx.arc(ef.x + offX, ef.y - 8, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,200,${alpha})`; ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    } else if (ef.type === 'will_shatter') {
      // Will Break — soul fracture: dark void implosion + purple fractures + Ω
      const prog = 1 - alpha;
      ctx.globalCompositeOperation = 'lighter';
      for (let ri = 0; ri < 3; ri++) {
        const rp = Math.max(0, prog - ri * 0.08);
        ctx.beginPath(); ctx.arc(ef.x, ef.y, (22 + ri * 20) * rp + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${90 + ri * 35},0,${170 + ri * 25},${alpha * (0.75 - ri * 0.18)})`;
        ctx.lineWidth = 3.5 - ri * 0.7; ctx.shadowBlur = 22 - ri * 4; ctx.shadowColor = '#7c3aed'; ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const bend = ang + (i % 2 === 0 ? 0.38 : -0.38);
        const fLen = 48 * prog;
        ctx.beginPath(); ctx.moveTo(ef.x, ef.y);
        ctx.lineTo(ef.x + Math.cos(bend) * fLen * 0.5, ef.y + Math.sin(bend) * fLen * 0.5);
        ctx.lineTo(ef.x + Math.cos(ang) * fLen, ef.y + Math.sin(ang) * fLen);
        ctx.strokeStyle = `rgba(167,85,247,${alpha * 0.82})`; ctx.lineWidth = 1.5; ctx.shadowBlur = 9; ctx.shadowColor = '#a855f7'; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(ef.x, ef.y, 13 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,0,140,${alpha * 0.9})`; ctx.shadowBlur = 28; ctx.shadowColor = '#7c3aed'; ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `bold ${10 + prog * 11}px monospace`;
      ctx.fillStyle = `rgba(200,150,255,${alpha})`;
      ctx.shadowBlur = 18; ctx.shadowColor = '#a855f7';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Ω', ef.x, ef.y);
    } else if (ef.type === 'omega_decree_blast') {
      // Omega Decree — cosmic smiting: doom pillar + rings + descending Ω
      const prog = 1 - alpha;
      ctx.globalCompositeOperation = 'lighter';
      // Vertical doom pillar
      const pH = 170 * prog;
      const pGrad = ctx.createLinearGradient(ef.x, ef.y, ef.x, ef.y - pH);
      pGrad.addColorStop(0, `rgba(255,65,0,${alpha * 0.9})`);
      pGrad.addColorStop(0.4, `rgba(255,175,55,${alpha * 0.55})`);
      pGrad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.beginPath();
      ctx.moveTo(ef.x - 9, ef.y); ctx.lineTo(ef.x + 9, ef.y);
      ctx.lineTo(ef.x + 3, ef.y - pH); ctx.lineTo(ef.x - 3, ef.y - pH);
      ctx.closePath();
      ctx.fillStyle = pGrad; ctx.shadowBlur = 38; ctx.shadowColor = '#ff4500'; ctx.fill();
      // Expanding rings
      for (let ri = 0; ri < 3; ri++) {
        const rp = Math.max(0, prog - ri * 0.09);
        ctx.beginPath(); ctx.arc(ef.x, ef.y, (28 + ri * 24) * rp, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,${15 + ri * 28},0,${alpha * (0.85 - ri * 0.2)})`;
        ctx.lineWidth = 4.5 - ri; ctx.shadowBlur = 24; ctx.shadowColor = '#ff3300'; ctx.stroke();
      }
      // Ground corona
      ctx.beginPath(); ctx.arc(ef.x, ef.y, 22 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,90,0,${alpha * 0.55})`; ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // Descending Ω
      const symY = ef.y - 70 + 70 * prog;
      ctx.font = `bold ${22 + prog * 16}px monospace`;
      ctx.fillStyle = `rgba(255,69,0,${alpha})`; ctx.shadowBlur = 32; ctx.shadowColor = '#ff0000';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Ω', ef.x, symY);
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
    } else if (ef.type === 'meteor_strike') {
      // Pain meteorite impact: expanding fiery ring + debris spokes
      const prog = 1 - alpha;
      const maxR = ef.maxR || 90;
      ctx.globalCompositeOperation = 'lighter';
      // Outer fire ring
      ctx.beginPath(); ctx.arc(ef.x, ef.y, maxR * prog, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245,101,101,${alpha * 0.85})`; ctx.lineWidth = 5;
      ctx.shadowBlur = 28; ctx.shadowColor = '#f56565'; ctx.stroke();
      // Inner hot core
      ctx.beginPath(); ctx.arc(ef.x, ef.y, maxR * 0.45 * prog + 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,180,60,${alpha * 0.7})`; ctx.lineWidth = 3;
      ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24'; ctx.stroke();
      // Ground flash at impact
      ctx.beginPath(); ctx.arc(ef.x, ef.y, 18 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,100,${alpha * 0.9})`; ctx.shadowBlur = 22; ctx.shadowColor = '#fde68a'; ctx.fill();
      // Debris spokes
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const len = maxR * 0.6 * prog;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * 10, ef.y + Math.sin(a) * 10);
        ctx.lineTo(ef.x + Math.cos(a) * len, ef.y + Math.sin(a) * len);
        ctx.strokeStyle = `rgba(239,68,68,${alpha * 0.55})`; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6; ctx.shadowColor = '#f56565'; ctx.stroke();
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
