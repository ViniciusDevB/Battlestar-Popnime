// data/banners-crystal.js — Pools dos banners de Cristal (Estruturas e Relíquias).
// Custo: 150 cristais × 1 pull / 1350 cristais × 10 pulls (10% desconto).
// Pity independente de cada banner: 80 pulls garantem 5⭐.

// ── Banner de Estruturas ───────────────────────────────────────────────────────
// Pool por raridade. IDs espelham NEXUS_STRUCTURES.id em relics.js.
const STRUCTURE_BANNER_POOL = {
  star3: ['hospital', 'vault', 'barracks'],
  star4: ['academia', 'bank', 'lab'],
  star5: ['forge', 'watchtower', 'temple', 'relay'],
};

// Taxas do banner de estruturas
const STRUCTURE_BANNER_RATES = { s3: 0.59, s4: 0.40, s5: 0.01 };

// Conversão de duplicata → cristais (50 / 100 / 200 por raridade).
const STRUCTURE_DUPLICATE_CRYSTALS = {
  hospital:    50,  // 3★
  vault:       50,  // 3★
  barracks:    50,  // 3★
  academia:   100,  // 4★
  bank:       100,  // 4★
  lab:        100,  // 4★
  forge:      200,  // 5★
  watchtower: 200,  // 5★
  temple:     200,  // 5★
  relay:      200,  // 5★
};

// ── Banner de Relíquias ────────────────────────────────────────────────────────
// Pool por raridade. IDs espelham RELICS em relics.js.
// Nota: não há 3⭐ — mínimo é 4⭐.
const RELIC_BANNER_POOL = {
  star4: [
    'relic_kunai_minato',
    'relic_colar_sannin',
    'relic_chapeu_palha',
    'relic_escudo_capita',
    'relic_anel_lanterna',
    'relic_laco_verdade',
  ],
  star5: [
    'relic_yoru',
    'relic_tensa_zangetsu',
    'relic_hogyoku',
    'relic_mjolnir',
  ],
};

// Taxas do banner de relíquias (sem 3⭐; 4⭐ absorve o slot delas)
const RELIC_BANNER_RATES = { s4: 0.99, s5: 0.01 };

// Custo em cristais
const CRYSTAL_PULL_COST_1  = 150;
const CRYSTAL_PULL_COST_10 = 1350;
