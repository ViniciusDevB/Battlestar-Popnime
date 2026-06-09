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
      const HARD_ERRORS = { insufficient_gems: 'Gemas insuficientes!', insufficient_tickets: 'Tickets insuficientes!', unauthorized: 'Faça login para continuar.', invalid_qty: 'Quantidade inválida.', invalid_currency: 'Moeda inválida.' };
      if (result?.error && HARD_ERRORS[result.error]) {
        UI.toast(HARD_ERRORS[result.error]);
        return;
      }
      // Erro de rede/servidor — usa cliente como fallback
      console.warn('[Gacha] RPC falhou, usando cliente:', result?.error);
    }

    // Fallback client-side (offline ou RPC indisponível)
    const d = Save.get();
    const cost = currency === 'gems' ? (count === 1 ? 100 : 950) : count;
    const useTickets = currency === 'tickets';

    if (useTickets) {
      if (d.tickets < cost) { UI.toast('Tickets insuficientes!'); return; }
      Save.spendTickets(cost);
    } else {
      if (d.gemas < cost) { UI.toast('Gemas insuficientes!'); return; }
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

    results.forEach((r, i) => {
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

    modal.style.display = 'flex';
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
      hint.textContent = `${pity} / 150 pulls — Pity em ${remaining} pull${remaining !== 1 ? 's' : ''}`;
    }
  }

  return { pull, closeResult, updateGachaUI };
})();
