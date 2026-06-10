const Gacha = (() => {
  function rollOne(useTickets) {
    const d = Save.get();
    let pool, rates;
    if (useTickets) {
      rates = { s3: 0.54, s4: 0.45, s5: 0.01 };
    } else {
      rates = { s3: 0.70, s4: 0.29, s5: 0.01 };
    }

    // Clamp defensivo: pity adulterado não garante 5★ infinitos nem quebra a lógica
    d.pity_contador = Math.max(0, Math.min(149, d.pity_contador || 0)) + 1;
    if (typeof Integrity !== 'undefined' && d.pity_contador > 151) {
      Integrity.recordViolation('pity_overflow', { pity: d.pity_contador });
    }

    let rarity;
    if (d.pity_contador >= 150) {
      rarity = GACHA_POOL.star5.length > 0 ? 5 : 4;
      Save.get().pity_contador = 0;
    } else {
      const r = Math.random();
      if (r < rates.s5 && GACHA_POOL.star5.length > 0) rarity = 5;
      else if (r < rates.s5 + rates.s4) rarity = 4;
      else rarity = 3;
    }

    let pool_arr;
    let actualRarity = rarity;
    if (rarity === 5) {
      if (GACHA_POOL.star5.length > 0) pool_arr = GACHA_POOL.star5;
      else { pool_arr = GACHA_POOL.star4; actualRarity = 4; }
    } else if (rarity === 4) pool_arr = GACHA_POOL.star4;
    else pool_arr = GACHA_POOL.star3;

    const id = pool_arr[Math.floor(Math.random() * pool_arr.length)];
    return { id, rarity: actualRarity };
  }

  async function pull(count, currency) {
    // Server-side path: sorteio, dedução de moeda e gravação no banco são atômicos.
    // Impede que o cliente forge gemas ou injete unidades.
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) {
      const result = await Online.gachaPull(count, currency);
      if (result?.ok) {
        // Aplica o save autoritativo do servidor localmente
        Save._setData(result.save);
        // Stats não rastreados pelo servidor — incrementar localmente e mesclar no próximo sync
        Save.incStat('pulls_realizados', count);
        result.results.forEach(r => {
          if (r.rarity === 4) Save.incStat('unidades_4estrelas_obtidas');
          if (r.rarity === 5) Save.incStat('unidades_5estrelas_obtidas');
        });
        const _cm = Online.getActiveMission();
        if (_cm && _cm.goal_type === 'pulls') Online.contributeToMission(_cm.id, count);
        Missions.check();
        updateGachaUI();
        showResult(result.results);
        return;
      }
      // Rejeições definitivas do servidor — não cai no cliente
      const HARD_ERRORS = { insufficient_gems: I18N.t('err_server_gems'), insufficient_tickets: I18N.t('err_server_tickets'), unauthorized: I18N.t('err_server_auth'), invalid_qty: I18N.t('err_server_qty'), invalid_currency: I18N.t('err_server_currency') };
      if (result?.error && HARD_ERRORS[result.error]) {
        UI.toast(HARD_ERRORS[result.error]);
        return;
      }
      // Servidor indisponível — não usar fallback cliente pois syncSave reverteria
      // as mudanças econômicas (gems/inventário são autoritativos do servidor)
      console.warn('[Gacha] RPC falhou:', result?.error);
      UI.toast(I18N.t('err_server_gacha'), 3000);
      return;
    }

    // Darkseid 7★ — roll secreto antes de qualquer lógica normal (não conta pity)
    if (Math.random() < 0.0000005) {
      const darkChar = getCharById('darkseid_7star');
      if (darkChar) {
        Save.addUnit('darkseid_7star');
        showResult([{ id: 'darkseid_7star', rarity: 7 }]);
        return;
      }
    }

    // Fallback client-side — só ativo se não estiver logado (modo demo/offline)
    const d = Save.get();
    const cost = currency === 'gems' ? (count === 1 ? 100 : 950) : count;
    const useTickets = currency === 'tickets';

    if (useTickets) {
      if (d.tickets < cost) { UI.toast(I18N.t('err_no_tickets')); return; }
      Save.spendTickets(cost);
    } else {
      if (d.gemas < cost) { UI.toast(I18N.t('err_no_gems')); return; }
      Save.spendGems(cost);
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      const r = rollOne(useTickets);
      results.push(r);
      const char = getCharById(r.id);
      if (char) {
        if (char.playable) {
          Save.addUnit(r.id);
        } else {
          Save.addMaterial(r.id);
        }
        if (r.rarity === 4) Save.incStat('unidades_4estrelas_obtidas');
        if (r.rarity === 5) Save.incStat('unidades_5estrelas_obtidas');
      }
    }

    Save.incStat('pulls_realizados', count);
    Missions.check();
    updateGachaUI();
    showResult(results);
  }

  function showResult(results) {
    const modal = document.getElementById('gacha-result-modal');
    const grid = document.getElementById('gacha-results-grid');
    grid.innerHTML = '';

    // Darkseid 7★ — animação completamente diferente
    if (results.length === 1 && results[0].rarity === 7) {
      _showDarkseidReveal(modal, results[0]);
      return;
    }

    let maxRarity = 3;
    results.forEach((r, i) => {
      if (r.rarity > maxRarity) maxRarity = r.rarity;
      const char = getCharById(r.id);
      if (!char) return;
      const card = document.createElement('div');
      card.className = `gacha-card rarity-${r.rarity}`;
      card.style.animationDelay = `${i * 0.08}s`;
      const glow = r.rarity >= 5 ? ' glow-gold' : r.rarity === 4 ? ' glow-orange' : '';
      card.innerHTML = `
        <div class="gacha-card-inner${glow}">
          <div class="gacha-card-icon" style="background:${RARITY_COLORS[r.rarity]}">${charIconInner(char)}</div>
          <div class="gacha-card-stars">${RARITY_LABELS[r.rarity]}</div>
          <div class="gacha-card-name">${char.name}</div>
        </div>`;
      grid.appendChild(card);
    });

    const animOverlay = document.getElementById('gacha-animation-overlay');
    if (animOverlay) {
      // Configura a cor da estrela dependendo da maior raridade
      let animClass = maxRarity >= 5 ? 'anim-gold' : (maxRarity === 4 ? 'anim-orange' : 'anim-red');
      
      // Reinicia a animação caso o elemento já estivesse no DOM
      animOverlay.style.display = 'none';
      void animOverlay.offsetWidth; // trigger reflow
      
      animOverlay.className = `gacha-anim-container ${animClass} active`;
      animOverlay.style.display = 'flex';
      
      if (typeof AudioManager !== 'undefined') AudioManager.playGachaPull();

      // Tempo aproximado para a estrela cadente chegar ao meio da tela
      setTimeout(() => {
        animOverlay.classList.add('flash-active');
        if (typeof AudioManager !== 'undefined') AudioManager.playGachaReveal(maxRarity);
        
        // Exibe as cartas logo após o clarão estourar
        setTimeout(() => {
          modal.style.display = 'flex';
          
          // Oculta a tela de animação de fundo quando o clarão sumir completamente
          setTimeout(() => {
            animOverlay.style.display = 'none';
            animOverlay.className = 'gacha-anim-container';
          }, 1000);
        }, 150);
      }, 1400);
    } else {
      modal.style.display = 'flex';
    }
  }

  function closeResult() {
    document.getElementById('gacha-result-modal').style.display = 'none';
    updateGachaUI();
    UI.updateCurrencyDisplay();
  }

  function updateGachaUI() {
    const d = Save.get();
    const pity = d.pity_contador || 0;
    const pc = document.getElementById('pity-counter');
    const gg = document.getElementById('gacha-gems');
    const gt = document.getElementById('gacha-tickets');
    if (pc) pc.textContent = pity;
    if (gg) gg.textContent = d.gemas;
    if (gt) gt.textContent = d.tickets;

    const fill = document.getElementById('gacha-pity-fill');
    if (fill) {
      const pct = Math.min(100, (pity / 150) * 100);
      fill.style.width = `${pct}%`;
      // Coloração por faixa: azul → amarelo → vermelho
      if (pity >= 131) {
        fill.style.background = '#ef4444';
        fill.classList.add('pity-near-guarantee');
      } else if (pity >= 100) {
        fill.style.background = '#f59e0b';
        fill.classList.remove('pity-near-guarantee');
      } else {
        fill.style.background = '#3b82f6';
        fill.classList.remove('pity-near-guarantee');
      }
    }

    const hint = document.querySelector('.gacha-pity-hint');
    if (hint) {
      const remaining = 150 - pity;
      hint.textContent = I18N.t('gacha_pity_hint')
        .replace('{current}', pity)
        .replace('{remaining}', remaining)
        .replace('{s}', remaining !== 1 ? 's' : '');
    }
  }

  function _showDarkseidReveal(modal, result) {
    const char = getCharById(result.id);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes dk-lightning{0%,100%{opacity:0}4%{opacity:1}8%{opacity:0}14%{opacity:.7}18%{opacity:0}24%{opacity:.9}28%{opacity:0}}
      @keyframes dk-eq-text{0%{opacity:0;letter-spacing:.3em}25%{opacity:1}75%{opacity:1}100%{opacity:0;letter-spacing:.7em}}
      @keyframes dk-omega-corner{0%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(.2)}30%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      @keyframes dk-omega-pulse{0%,100%{text-shadow:0 0 30px #f00,0 0 60px #800}50%{text-shadow:0 0 70px #f40,0 0 140px #c00,0 0 200px #800}}
      @keyframes dk-shake{0%,100%{transform:translateX(0) translateY(0)}10%{transform:translateX(-9px) rotate(-1.5deg)}20%{transform:translateX(9px) rotate(1.5deg)}30%{transform:translateX(-7px) translateY(-3px)}40%{transform:translateX(7px) translateY(3px)}50%{transform:translateX(-5px)}60%{transform:translateX(5px)}70%{transform:translateX(-3px) translateY(-2px)}80%{transform:translateX(3px)}}
      @keyframes dk-explode{0%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}25%{transform:translate(-50%,-50%) scale(2.8);filter:brightness(4)}60%{transform:translate(-50%,-50%) scale(5);opacity:.4;filter:brightness(6) saturate(2)}100%{transform:translate(-50%,-50%) scale(8);opacity:0}}
      @keyframes dk-redflash{0%{opacity:0}15%{opacity:.9}65%{opacity:.5}100%{opacity:0}}
      @keyframes dk-beams{0%{opacity:0;transform:translateX(-50%) scaleX(0)}20%{opacity:1}60%{opacity:.6}100%{opacity:0;transform:translateX(-50%) scaleX(1)}}
      @keyframes dk-card-shatter{0%{opacity:0;transform:scale(.3) translateY(40px);filter:brightness(5) blur(4px)}40%{transform:scale(1.12) translateY(-6px);filter:brightness(2) blur(0)}70%{transform:scale(.97) translateY(2px)}100%{opacity:1;transform:scale(1) translateY(0);filter:brightness(1)}}
      @keyframes dk-glow-card{0%,100%{box-shadow:0 0 30px #f45,0 0 60px #800}50%{box-shadow:0 0 60px #f45,0 0 120px #c00,0 0 180px #500}}
    `;
    document.head.appendChild(style);

    // Tela preta
    const curtain = document.createElement('div');
    curtain.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;opacity:0;transition:opacity 0.35s';
    document.body.appendChild(curtain);
    requestAnimationFrame(() => { curtain.style.opacity = '1'; });

    setTimeout(() => {

      // Relâmpagos vermelhos cruzando a tela
      for (let i = 0; i < 7; i++) {
        const bolt = document.createElement('div');
        const top = 5 + Math.random() * 90;
        const rot = -20 + Math.random() * 40;
        bolt.style.cssText = `position:fixed;top:${top}%;left:0;width:100%;height:${1 + Math.random() * 2}px;background:linear-gradient(90deg,transparent 0%,#cc0000 20%,#ff6600 50%,#cc0000 80%,transparent 100%);z-index:10000;transform-origin:left center;transform:rotate(${rot}deg);animation:dk-lightning ${0.6 + Math.random() * 0.5}s ease-in-out ${i * 0.1}s 4`;
        document.body.appendChild(bolt);
        setTimeout(() => bolt.remove(), 2400);
      }

      // Texto "EQUAÇÃO ANTI-VIDA"
      setTimeout(() => {
        const eq = document.createElement('div');
        eq.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);color:#cc0000;font-size:12px;font-family:monospace;font-weight:bold;letter-spacing:.3em;z-index:10002;white-space:nowrap;animation:dk-eq-text 1.6s ease-in-out forwards;text-shadow:0 0 12px #ff0000,0 0 24px #880000';
        eq.textContent = '— EQUAÇÃO ANTI-VIDA ATIVADA —';
        document.body.appendChild(eq);
        setTimeout(() => eq.remove(), 1700);
      }, 200);

      // 4 símbolos Ω disparados dos cantos em direção ao centro
      const corners = [
        { x: '15%', y: '15%', tx: 'calc(-15vw - 50%)', ty: 'calc(-15vh - 50%)' },
        { x: '85%', y: '15%', tx: 'calc(15vw - 50%)',  ty: 'calc(-15vh - 50%)' },
        { x: '15%', y: '85%', tx: 'calc(-15vw - 50%)', ty: 'calc(15vh - 50%)'  },
        { x: '85%', y: '85%', tx: 'calc(15vw - 50%)',  ty: 'calc(15vh - 50%)'  },
      ];
      corners.forEach(({ x, y, tx, ty }, idx) => {
        const o = document.createElement('div');
        o.style.cssText = `position:fixed;top:50%;left:50%;font-size:68px;font-family:serif;font-weight:bold;color:#8b0000;z-index:10001;--tx:${tx};--ty:${ty};transform:translate(${tx},${ty}) scale(.2);opacity:0;animation:dk-omega-corner .9s cubic-bezier(.2,1,.3,1) ${600 + idx * 80}ms forwards,dk-omega-pulse .7s ease-in-out ${1.5 + idx * .08}s 2;text-shadow:0 0 40px #ff0000,0 0 80px #880000`;
        o.textContent = 'Ω';
        document.body.appendChild(o);
        setTimeout(() => o.remove(), 3000);
      });

      // Raios Omega — linhas diagonais convergindo ao centro
      setTimeout(() => {
        [['-45deg','top:50%;left:0;width:100%'],['45deg','top:50%;left:0;width:100%']].forEach(([rot, pos]) => {
          const beam = document.createElement('div');
          beam.style.cssText = `position:fixed;${pos};height:2px;background:linear-gradient(90deg,transparent,#cc0000 30%,#ff4400 50%,#cc0000 70%,transparent);z-index:10000;transform-origin:center;transform:rotate(${rot}) translateX(-50%);animation:dk-beams .5s ease-out 1.4s forwards;opacity:0`;
          document.body.appendChild(beam);
          setTimeout(() => beam.remove(), 2100);
        });
      }, 1400);

      // Tela treme
      setTimeout(() => {
        document.body.style.animation = 'dk-shake .65s ease-in-out';
        setTimeout(() => { document.body.style.animation = ''; }, 650);
      }, 1700);

      // Ω central gigante explode
      setTimeout(() => {
        const bigO = document.createElement('div');
        bigO.style.cssText = 'position:fixed;top:50%;left:50%;font-size:180px;font-family:serif;font-weight:bold;color:#ff2200;z-index:10003;animation:dk-explode 1s ease-out forwards;text-shadow:0 0 80px #ff0000,0 0 160px #cc0000,0 0 240px #880000;pointer-events:none';
        bigO.textContent = 'Ω';
        document.body.appendChild(bigO);

        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,#cc0000 0%,#550000 60%,#000 100%);z-index:10002;opacity:0;animation:dk-redflash .8s ease-out forwards;pointer-events:none';
        document.body.appendChild(flash);

        setTimeout(() => { bigO.remove(); flash.remove(); }, 1100);
      }, 2100);

      // Carta irrompe
      setTimeout(() => {
        style.remove();
        const grid = document.getElementById('gacha-results-grid');
        grid.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'gacha-card';
        card.style.cssText = 'border:2px solid #3d0000;animation:dk-card-shatter .7s cubic-bezier(.2,1.2,.4,1) forwards,dk-glow-card 1.5s ease-in-out 0.7s infinite';
        card.innerHTML = `
          <div class="gacha-card-inner" style="background:linear-gradient(135deg,#0a0505 0%,#1a0808 50%,#0d0202 100%);border:1px solid #3d0000">
            <div class="gacha-card-icon" style="background:#1a0a0a;border:2px solid #ff4500;box-shadow:0 0 25px #ff4500,inset 0 0 15px #3d0000">${charIconInner(char)}</div>
            <div class="gacha-card-stars" style="color:#8b0000;letter-spacing:2px;text-shadow:0 0 12px #ff0000">${RARITY_LABELS[7]}</div>
            <div class="gacha-card-name" style="color:#ff6b1a;text-shadow:0 0 10px #ff4500">${char?.name || 'Darkseid'}</div>
          </div>`;
        grid.appendChild(card);
        curtain.style.opacity = '0';
        setTimeout(() => { curtain.remove(); modal.style.display = 'flex'; }, 400);
      }, 3000);

    }, 350);
  }

  return { pull, closeResult, updateGachaUI };
})();
