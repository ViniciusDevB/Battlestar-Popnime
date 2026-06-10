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
    Save.save();

    let rarity;
    if (d.pity_contador >= 150) {
      rarity = GACHA_POOL.star5.length > 0 ? 5 : 4;
      Save.get().pity_contador = 0;
      Save.save();
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
        // Incrementa stats de estrela (servidor não rastreia, merge por max no próximo sync)
        result.results.forEach(r => {
          if (r.rarity === 4) Save.incStat('unidades_4estrelas_obtidas');
          if (r.rarity === 5) Save.incStat('unidades_5estrelas_obtidas');
        });
        Save.save();
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
      // Erro de rede/servidor — usa cliente como fallback
      console.warn('[Gacha] RPC falhou, usando cliente:', result?.error);
    }

    // Darkseid 7★ — roll secreto antes de qualquer lógica normal (não conta pity)
    if (Math.random() < 0.000005) {
      const darkChar = getCharById('darkseid_7star');
      if (darkChar) {
        Save.addUnit('darkseid_7star');
        showResult([{ id: 'darkseid_7star', rarity: 7 }]);
        return;
      }
    }

    // Fallback client-side (offline ou RPC indisponível)
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
    if (typeof Online !== 'undefined' && Online.isLoggedIn()) {
      const _cm = Online.getActiveMission();
      if (_cm && _cm.goal_type === 'pulls') Online.contributeToMission(_cm.id, count);
    }
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
    const overlay = document.getElementById('gacha-animation-overlay') || document.body;

    // Fade screen to absolute black
    const curtain = document.createElement('div');
    curtain.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;transition:opacity 0.4s';
    curtain.style.opacity = '0';
    document.body.appendChild(curtain);

    requestAnimationFrame(() => { curtain.style.opacity = '1'; });

    setTimeout(() => {
      // Silence — 1.5s of nothing
      setTimeout(() => {
        // Ω symbol burns through
        const omega = document.createElement('div');
        omega.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:120px;font-family:monospace;font-weight:bold;color:#8b0000;z-index:10000;text-shadow:0 0 40px #ff0000,0 0 80px #880000;animation:darkseid-omega-burn 1.5s ease-out forwards';
        omega.textContent = 'Ω';

        const style = document.createElement('style');
        style.textContent = '@keyframes darkseid-omega-burn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.2)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.3);text-shadow:0 0 80px #ff0000,0 0 160px #880000}100%{opacity:0.8;transform:translate(-50%,-50%) scale(1)}}';
        document.head.appendChild(style);
        document.body.appendChild(omega);

        setTimeout(() => {
          omega.remove();
          style.remove();
          // Reveal card — dark style
          const grid = document.getElementById('gacha-results-grid');
          grid.innerHTML = '';
          const card = document.createElement('div');
          card.className = 'gacha-card';
          card.style.cssText = 'border:2px solid #3d0000;box-shadow:0 0 30px #ff4500,0 0 60px #8b0000';
          card.innerHTML = `
            <div class="gacha-card-inner" style="background:linear-gradient(135deg,#0a0505,#1a0808);border:1px solid #3d0000">
              <div class="gacha-card-icon" style="background:#1a0a0a;border:2px solid #ff4500;box-shadow:0 0 20px #ff4500">${charIconInner(char)}</div>
              <div class="gacha-card-stars" style="color:#8b0000;letter-spacing:1px">${RARITY_LABELS[7]}</div>
              <div class="gacha-card-name" style="color:#ff6b1a">${char?.name || 'Darkseid'}</div>
            </div>`;
          grid.appendChild(card);
          curtain.style.opacity = '0';
          setTimeout(() => { curtain.remove(); modal.style.display = 'flex'; }, 400);
        }, 1500);
      }, 1500);
    }, 400);
  }

  return { pull, closeResult, updateGachaUI };
})();
