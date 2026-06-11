// js/game-infinite.js — Modo Infinito: tiers, geração de waves e recompensas.
// Depende de: _infiniteSession (game-utils.js), Save, UI (já globals quando game.js roda).

const INFINITE_TIERS = [
  { key:'tier_easy',      name:'Fácil',          minWave:1,  maxWave:20,  color:'#39FF14', hp:1.0,  gold:1.0 },
  { key:'tier_medium',    name:'Médio',          minWave:21, maxWave:30,  color:'#facc15', hp:1.8,  gold:1.2 },
  { key:'tier_hard',      name:'Difícil',        minWave:31, maxWave:40,  color:'#f97316', hp:3.2,  gold:1.4 },
  { key:'tier_very_hard', name:'Muito Difícil',  minWave:41, maxWave:50,  color:'#ef4444', hp:5.5,  gold:1.6 },
  { key:'tier_extreme',   name:'Extremo',        minWave:51, maxWave:60,  color:'#dc2626', hp:9.0,  gold:1.8 },
  { key:'tier_brutal',    name:'Brutal',         minWave:61, maxWave:70,  color:'#9333ea', hp:15.0, gold:2.0 },
  { key:'tier_legendary', name:'Lendário',       minWave:71, maxWave:80,  color:'#c084fc', hp:25.0, gold:2.3 },
  { key:'tier_beyond',    name:'Além do Limite', minWave:81, maxWave:Infinity, color:'#f0abfc', hp:40.0, gold:2.6 }
];

function getTierName(tier) {
  return typeof I18N !== 'undefined' ? I18N.t(tier.key, {}, tier.name) : tier.name;
}

function getInfiniteTierIdx(waveNum) {
  if (waveNum <= 20) return 0;
  if (waveNum <= 30) return 1;
  if (waveNum <= 40) return 2;
  if (waveNum <= 50) return 3;
  if (waveNum <= 60) return 4;
  if (waveNum <= 70) return 5;
  if (waveNum <= 80) return 6;
  return 7;
}

function getInfiniteWaveMults(waveNum) {
  const idx  = getInfiniteTierIdx(waveNum);
  const tier = INFINITE_TIERS[idx];
  // Tier 7+ continua escalando a cada 10 waves
  let hp = tier.hp;
  if (idx === 7 && waveNum > 80) hp = 40 + Math.floor((waveNum - 81) / 10) * 8;
  return { hp, gold: tier.gold };
}

function generateInfiniteWave(waveNum) {
  const POOLS = [
    ['ninja_comum','ninja_comum','ninja_ambu','serpente'],
    ['ninja_ambu','agente_ambu','op_bandido','op_pirata_comum','serpente'],
    ['agente_ambu','op_pirata_veterano','hollow_pequeno','hollow_grande','boa_constritora'],
    ['op_homem_peixe','hollow_mascara','arrancar','caminho_animal','ninja_chuva'],
    ['caminho_humano','op_cp9_oficial','hollow_mascara','arrancar','ninja_chuva'],
    ['caminho_deus_animal','op_marinha_capitao','vasto_lorde','akatsuki_chuva','ninja_chuva_veloz','invasor','invasor_veloz'],
    ['op_marinha_elite','espada_hierro','vasto_lorde','espada_regen','invasor_veloz','invasor_blindado','invasor_regen'],
    ['op_marinha_elite','espada_hierro','espada_regen','invasor_blindado','invasor_regen','invasor_explosivo']
  ];
  const tierIdx = Math.min(getInfiniteTierIdx(waveNum), 7);
  const cur  = POOLS[tierIdx];
  const pool = tierIdx > 0 ? [...cur, ...POOLS[tierIdx - 1].slice(0, 2)] : [...cur];

  const count = Math.floor(10 + waveNum * 0.85);
  const gap   = Math.max(0.35, 1.6 - tierIdx * 0.18 - (waveNum % 10) * 0.015);

  const queue = [];
  let t = 0;
  for (let i = 0; i < count; i++) {
    queue.push({ type: pool[Math.floor(Math.random() * pool.length)], delay: t });
    t += gap;
  }

  // Miniboss a cada 10 waves
  if (waveNum % 10 === 0) {
    const MB = ['deidara','itachi_uchiha','sasuke_taka','konan','caminho_deus_animal','grimmjow','nnoitra','batroc','crossbones','ronan','corvus_glaive','ebony_maw'];
    queue.push({ type: MB[Math.min(Math.floor(waveNum / 10) - 1, MB.length - 1)], delay: t + 2 });
  }
  // Boss a cada 30 waves
  if (waveNum % 30 === 0) {
    const BS = ['pain','akainu','ulquiorra','thanos_fase1'];
    queue.push({ type: BS[Math.min(Math.floor(waveNum / 30) - 1, BS.length - 1)], delay: t + 5 });
  }
  return queue;
}

// Chamado a cada 5 waves: dá gemas + rola Star Experience
function giveInfiniteReward(waveNum) {

  // Gemas baseadas no tier
  const tierIdx = getInfiniteTierIdx(waveNum);
  const gemTable = [15, 25, 40, 60, 85, 115, 150, 200];
  const gems = gemTable[Math.min(tierIdx, 7)];
  Save.addGems(gems);
  _infiniteSession.gems += gems;
  UI.updateCurrencyDisplay();

  // Rolagem de Star Experience com chances baseadas na wave
  const dropped = rollInfiniteStarExp(waveNum);

  // Toast único combinando gemas + SE
  const seLabel = dropped.length > 0 ? `  ✨ ${dropped.map(lv => `SE Nv${lv}`).join(' + ')}` : '';
  UI.toast(I18N.t('inf_reward_toast', { wave: waveNum, gems, se: seLabel }), 3500);
}

// Rola chances de Star Experience — retorna array dos níveis que droparam
// Fórmula: chance_i(wave) = min(100, wave/30 × base_i)%
// Wave 30: SE1=10%, SE2=5%, SE3=2%, SE4=1%, SE5=0.5%
function rollInfiniteStarExp(waveNum) {
  const BASE_AT_30 = [10, 5, 2, 1, 0.5];
  const dropped = [];
  BASE_AT_30.forEach((base, i) => {
    const chance = Math.min(100, (waveNum / 30) * base);
    if (Math.random() * 100 < chance) dropped.push(i + 1);
  });
  dropped.forEach(lv => {
    const key = `star_exp_${lv}`;
    Save.addMaterial(key, 1);
    _infiniteSession.drops[key] = (_infiniteSession.drops[key] || 0) + 1;
  });
  return dropped;
}
