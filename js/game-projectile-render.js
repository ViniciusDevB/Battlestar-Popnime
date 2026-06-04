// game-projectile-render.js
// Renderização visual de projéteis por personagem.
// Chamado por drawProjectile() em game.js.
// Recebe ctx já transladado para (p.x, p.y).

function drawProjectileShape(ctx, id, angle, color, now) {
  switch (id) {
    case 'ichigo_base': {
      ctx.rotate(angle + Math.PI * 0.5);
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff6b00';
      ctx.beginPath();
      ctx.arc(0, 0, 7, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.arc(-2, 0, 5, Math.PI * 0.65, -Math.PI * 0.65, true);
      ctx.closePath();
      ctx.fillStyle = '#ff6b00'; ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.arc(-1, 0, 2, Math.PI * 0.4, -Math.PI * 0.4, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,220,100,0.75)'; ctx.fill();
      break;
    }
    case 'goku_base': {
      ctx.shadowBlur = 14; ctx.shadowColor = '#4fc3f7';
      ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#4fc3f7'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.5, now * 0.005, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(129,212,250,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'l_deathnote': {
      ctx.rotate(Math.PI / 4 + now * 0.003);
      ctx.shadowBlur = 6; ctx.shadowColor = '#e0e0e0';
      ctx.beginPath(); ctx.rect(-4.5, -4.5, 9, 9);
      ctx.fillStyle = '#757575'; ctx.fill();
      ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.rect(-1.5, -1.5, 3, 3);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'demolidor': {
      ctx.rotate(angle);
      ctx.shadowBlur = 8; ctx.shadowColor = '#e53935';
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#c62828'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ef9a9a'; ctx.fill();
      break;
    }
    case 'sasuke_uchiha': {
      ctx.rotate(angle);
      ctx.shadowBlur = 12; ctx.shadowColor = '#5c6bc0';
      ctx.beginPath();
      ctx.moveTo(-6, 2); ctx.lineTo(-1, -4); ctx.lineTo(1, -1);
      ctx.lineTo(6, -4); ctx.lineTo(2, 5); ctx.lineTo(0, 1); ctx.closePath();
      ctx.fillStyle = '#7986cb'; ctx.fill();
      break;
    }
    case 'killua_zoldyck': {
      ctx.shadowBlur = 16; ctx.shadowColor = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e8eaf6'; ctx.fill();
      const t = now * 0.012;
      for (let i = 0; i < 4; i++) {
        const a = t + i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a + 0.45) * 10, Math.sin(a + 0.45) * 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'tanjiro_kamado': {
      ctx.rotate(angle + Math.PI / 2);
      ctx.shadowBlur = 10; ctx.shadowColor = '#ef5350';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(5, -3, 5, 3, 0, 6);
      ctx.bezierCurveTo(-5, 3, -5, -3, 0, -8);
      ctx.fillStyle = '#ef5350'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(2.5, -1, 2.5, 2, 0, 3.5);
      ctx.bezierCurveTo(-2.5, 2, -2.5, -1, 0, -5);
      ctx.fillStyle = '#ffd740'; ctx.fill();
      break;
    }
    case 'zoro_3': {
      ctx.rotate(angle + Math.PI / 4);
      ctx.shadowBlur = 8; ctx.shadowColor = '#43a047';
      ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke();
      break;
    }
    case 'naruto_shippuden': {
      ctx.shadowBlur = 14; ctx.shadowColor = '#ff8c00';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8c00'; ctx.fill();
      const spin = now * 0.009;
      for (let i = 0; i < 3; i++) {
        const a = spin + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,214,0,0.85)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'luffy_3': {
      ctx.rotate(angle);
      ctx.shadowBlur = 8; ctx.shadowColor = '#ef5350';
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ef5350'; ctx.fill();
      ctx.beginPath(); ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8a65'; ctx.fill();
      ctx.beginPath(); ctx.arc(6, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'levi_ackerman': {
      ctx.rotate(angle);
      ctx.shadowBlur = 6; ctx.shadowColor = '#eceff1';
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(-6, -2.5); ctx.lineTo(-7, 0); ctx.lineTo(-6, 2.5);
      ctx.closePath();
      ctx.fillStyle = '#cfd8dc'; ctx.fill();
      ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(2, -1);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    case 'meliodas_base': {
      ctx.rotate(now * 0.004);
      ctx.shadowBlur = 14; ctx.shadowColor = '#7b1fa2';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 7.5 : 3.5;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = '#6a0dad'; ctx.fill();
      ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    case 'naruto_sage': {
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff9800';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
      const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
      gr.addColorStop(0, '#fff3e0'); gr.addColorStop(1, '#ff9800');
      ctx.fillStyle = gr; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 3.5, now * 0.005, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,195,74,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'gojo_satoru': {
      ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(121,134,203,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
      break;
    }
    // ── Bleach ──────────────────────────────────────────────────────────────
    case 'rukia_kuchiki': {
      // Cristal de gelo hexagonal girando
      ctx.rotate(now * 0.006);
      ctx.shadowBlur = 12; ctx.shadowColor = '#bae6fd';
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.strokeStyle = 'rgba(186,230,253,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#e0f2fe'; ctx.fill();
      break;
    }
    case 'renji_abarai': {
      // Segmento de serpente óssea
      ctx.rotate(angle);
      ctx.shadowBlur = 8; ctx.shadowColor = '#7c3aed';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const rx = i * 5, w = 3.5 - i * 0.5;
        ctx.rect(rx - w/2, -w/2, w, w);
      }
      ctx.fillStyle = '#a78bfa'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2);
      ctx.fillStyle = '#6d28d9'; ctx.fill();
      break;
    }
    case 'uryu_ishida': {
      // Flecha de energia azul Quincy
      ctx.rotate(angle);
      ctx.shadowBlur = 10; ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(-5, -3); ctx.lineTo(-2, 0); ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fillStyle = '#60a5fa'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-8, 0);
      ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    case 'orihime_inoue': {
      // Pin de energia rosa (Koten Zanshun)
      ctx.rotate(angle);
      ctx.shadowBlur = 8; ctx.shadowColor = '#fb7185';
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fda4af'; ctx.fill();
      ctx.beginPath(); ctx.arc(5, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'chad_yasutora': {
      // Onda de impacto (braço de demônio)
      ctx.rotate(angle);
      ctx.shadowBlur = 14; ctx.shadowColor = '#b45309';
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d97706'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fef3c7'; ctx.fill();
      break;
    }
    case 'byakuya_kuchiki': {
      // Pétala de cerejeira rosa-branca
      ctx.rotate(angle + now * 0.008);
      ctx.shadowBlur = 6; ctx.shadowColor = '#f9a8d4';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fce7f3'; ctx.fill();
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'toshiro_hitsugaya': {
      // Dragão de gelo — espiral azul-claro
      ctx.rotate(angle);
      ctx.shadowBlur = 14; ctx.shadowColor = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(-8, 0); ctx.lineTo(-3, -4); ctx.lineTo(0, -1.5);
      ctx.lineTo(4, -5); ctx.lineTo(8, 0);
      ctx.lineTo(4, 5); ctx.lineTo(0, 1.5);
      ctx.lineTo(-3, 4); ctx.closePath();
      ctx.fillStyle = '#a5f3fc'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'kenpachi_zaraki': {
      // Corte de espada sem forma — slash bruto
      ctx.rotate(angle + Math.PI * 0.25);
      ctx.shadowBlur = 12; ctx.shadowColor = '#ef4444';
      ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, 2); ctx.stroke();
      break;
    }
    case 'ichigo_bankai': {
      // Getsuga — crescente preto-vermelho em alta velocidade
      ctx.rotate(angle + Math.PI * 0.5);
      ctx.shadowBlur = 16; ctx.shadowColor = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 8, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.arc(-3, 0, 6, Math.PI * 0.7, -Math.PI * 0.7, true);
      ctx.closePath();
      ctx.fillStyle = '#1c1917'; ctx.fill();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.arc(-1.5, 0, 3, Math.PI * 0.5, -Math.PI * 0.5, true);
      ctx.closePath();
      ctx.fillStyle = '#dc2626'; ctx.fill();
      break;
    }
    case 'ichigo_vizard': {
      // Máscara Hollow — crescente laranja-preto com fissura
      ctx.rotate(angle + Math.PI * 0.5);
      ctx.shadowBlur = 18; ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, 9, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.arc(-3.5, 0, 6.5, Math.PI * 0.65, -Math.PI * 0.65, true);
      ctx.closePath();
      ctx.fillStyle = '#0c0a09'; ctx.fill();
      ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2; ctx.stroke();
      // Fissura laranja no centro
      ctx.beginPath();
      ctx.moveTo(-2, -3); ctx.lineTo(2, 0); ctx.lineTo(-1, 3);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.2; ctx.stroke();
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }
  }
}
