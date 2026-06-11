// data/relics.js — Relic definitions, crafting recipes, and Nexus structure definitions.

const RELICS = {
  // ── Naruto ────────────────────────────────────────────────────────────────
  relic_kunai_minato: {
    id: 'relic_kunai_minato', name: 'Kunai do 4º Hokage', world: 'naruto', rarity: 4, icon: '⚡',
    desc: '+20% vel. de ataque. A cada 8 ataques, causa um golpe bônus com 2× dano.',
    corrupted_desc: '+10% vel. ataque. Golpe bônus a cada 5 ataques com 1.5× dano.',
    effects:           { attack_speed_mult: 1.20, teleport_every: 8, teleport_dmg_mult: 2.0 },
    corrupted_effects: { attack_speed_mult: 1.10, teleport_every: 5, teleport_dmg_mult: 1.5 }
  },
  relic_colar_sannin: {
    id: 'relic_colar_sannin', name: 'Colar da Sannin', world: 'naruto', rarity: 4, icon: '💠',
    desc: 'Escudo de 40 pts que absorve dano. Regenera completamente entre ondas.',
    corrupted_desc: 'Escudo de 20 pts. Não regenera entre ondas.',
    effects:           { shield_hp: 40, shield_regen_on_wave_end: true },
    corrupted_effects: { shield_hp: 20, shield_regen_on_wave_end: false }
  },

  // ── One Piece ─────────────────────────────────────────────────────────────
  relic_chapeu_palha: {
    id: 'relic_chapeu_palha', name: 'Chapéu de Palha', world: 'onepiece', rarity: 4, icon: '🎩',
    desc: 'Torres a até 120px ganham +15% de dano (aura). Não acumula.',
    corrupted_desc: 'Torres a até 80px ganham +10% de dano.',
    effects:           { aura_range: 120, aura_damage_bonus: 0.15 },
    corrupted_effects: { aura_range: 80,  aura_damage_bonus: 0.10 }
  },
  relic_yoru: {
    id: 'relic_yoru', name: 'Yoru — A Noite', world: 'onepiece', rarity: 5, icon: '🗡',
    desc: '+25% dano. Ataques ignoram 30% da resistência inimiga.',
    corrupted_desc: '+35% dano, mas -10% de alcance.',
    effects:           { damage_mult: 1.25, armor_pen: 0.30 },
    corrupted_effects: { damage_mult: 1.35, range_mult: 0.90 }
  },

  // ── Bleach ────────────────────────────────────────────────────────────────
  relic_tensa_zangetsu: {
    id: 'relic_tensa_zangetsu', name: 'Tensa Zangetsu', world: 'bleach', rarity: 5, icon: '⚔',
    desc: '+25% dano base. Ataques ignoram escudo de inimigos com ptype Shield.',
    corrupted_desc: '+15% dano. 20% de penetração de escudo.',
    effects:           { damage_mult: 1.25, shield_ignore: true },
    corrupted_effects: { damage_mult: 1.15, shield_pen: 0.20 }
  },
  relic_hogyoku: {
    id: 'relic_hogyoku', name: 'Hōgyoku', world: 'bleach', rarity: 5, icon: '🔮',
    desc: 'Normal: +10% dano. Corrompido: +60% dano, -20% alcance (alto risco).',
    corrupted_desc: '+60% dano, mas -20% alcance. Chance de corrupção: 15%.',
    corruptChance: 0.15,
    effects:           { damage_mult: 1.10 },
    corrupted_effects: { damage_mult: 1.60, range_mult: 0.80 }
  },

  // ── Marvel ────────────────────────────────────────────────────────────────
  relic_escudo_capita: {
    id: 'relic_escudo_capita', name: 'Escudo do Capitão', world: 'marvel', rarity: 4, icon: '🛡',
    desc: '-40% dano de área recebido. A cada 5 ataques, ricocheteia em 1 inimigo extra.',
    corrupted_desc: '-20% dano de área recebido. Ricochete a cada 7 ataques.',
    effects:           { aoe_dmg_reduction: 0.40, ricochet_every: 5 },
    corrupted_effects: { aoe_dmg_reduction: 0.20, ricochet_every: 7 }
  },
  relic_mjolnir: {
    id: 'relic_mjolnir', name: 'Mjolnir', world: 'marvel', rarity: 5, icon: '🔨',
    desc: '15% de chance por ataque de invocar raio em AoE (80px): stun 1.2s.',
    corrupted_desc: '25% de chance, mas stun apenas 0.5s.',
    effects:           { lightning_chance: 0.15, lightning_range: 80, lightning_stun: 1.2 },
    corrupted_effects: { lightning_chance: 0.25, lightning_range: 80, lightning_stun: 0.5 }
  },

  // ── DC ────────────────────────────────────────────────────────────────────
  relic_anel_lanterna: {
    id: 'relic_anel_lanterna', name: 'Anel do Lanterna Verde', world: 'dc', rarity: 4, icon: '💚',
    desc: 'Uma vez por onda: barreira que desacelera 50% inimigos por 4s na posição da torre.',
    corrupted_desc: 'Uma vez por onda: desacelera 30% por 2s.',
    effects:           { wave_slow_zone: true, slow_pct: 0.50, slow_duration: 4.0 },
    corrupted_effects: { wave_slow_zone: true, slow_pct: 0.30, slow_duration: 2.0 }
  },
  relic_laco_verdade: {
    id: 'relic_laco_verdade', name: 'Laço da Verdade', world: 'dc', rarity: 4, icon: '🌟',
    desc: 'Uma vez por onda: prende o inimigo mais avançado por 3s (+20% dano recebido).',
    corrupted_desc: 'Uma vez por onda: prende por 1.5s (+10% dano recebido).',
    effects:           { wave_root: true, root_duration: 3.0, root_dmg_amp: 0.20 },
    corrupted_effects: { wave_root: true, root_duration: 1.5, root_dmg_amp: 0.10 }
  }
};

const RELIC_CRAFTS = {
  relic_kunai_minato:   [{ id: 'ninja_generico_3', qty: 8 },  { id: 'ninja_generico_2', qty: 12 }],
  relic_colar_sannin:   [{ id: 'ninja_generico_3', qty: 5 },  { id: 'ninja_generico_1', qty: 15 }],
  relic_chapeu_palha:   [{ id: 'pirata_generico_3', qty: 6 }, { id: 'pirata_generico_2', qty: 14 }],
  relic_yoru:           [{ id: 'pirata_generico_3', qty: 8 }, { id: 'pirata_generico_1', qty: 12 }],
  relic_tensa_zangetsu: [{ id: 'shinigami_generico_3', qty: 8 }, { id: 'shinigami_generico_2', qty: 12 }],
  relic_hogyoku:        [{ id: 'shinigami_generico_3', qty: 5 }, { id: 'shinigami_generico_2', qty: 10 }, { id: 'shinigami_generico_1', qty: 5 }],
  relic_escudo_capita:  [{ id: 'avenger_material_3', qty: 6 }, { id: 'avenger_material_1', qty: 14 }],
  relic_mjolnir:        [{ id: 'avenger_material_3', qty: 8 }, { id: 'avenger_material_2', qty: 12 }],
  relic_anel_lanterna:  [{ id: 'dc_material_3', qty: 6 }, { id: 'dc_material_2', qty: 14 }],
  relic_laco_verdade:   [{ id: 'dc_material_3', qty: 5 }, { id: 'dc_material_2', qty: 10 }, { id: 'dc_material_1', qty: 5 }]
};

// NEXUS_STRUCTURES: ordered list of base constructions.
const NEXUS_STRUCTURES = [
  { id: 'hospital',   name: 'Hospital de Campo',       icon: '🏥', maxLevel: 5, baseCost: 300, costPerLevel: 200,
    desc: '+1 vida inicial por nível.' },
  { id: 'vault',      name: 'Cofre de Suprimentos',    icon: '💰', maxLevel: 5, baseCost: 300, costPerLevel: 200,
    desc: '+60 de ouro inicial por nível.' },
  { id: 'academia',   name: 'Academia de Heróis',      icon: '📚', maxLevel: 3, baseCost: 400, costPerLevel: 300,
    desc: '+15% XP de feed por nível.' },
  { id: 'watchtower', name: 'Torre de Vigilância',     icon: '🗼', maxLevel: 3, baseCost: 500, costPerLevel: 400,
    desc: 'Nv1: preview da próxima onda. Nv2: +6% alcance global. Nv3: +12% alcance + marca Elites.' },
  { id: 'forge',      name: 'Forja de Relíquias',      icon: '⚒',  maxLevel: 3, baseCost: 600, costPerLevel: 500,
    desc: 'Nv1: desbloqueia a Forja. Nv2: -20% custo de materiais. Nv3: +5% chance de relíquia rara.' },
  { id: 'barracks',   name: 'Quartel',                 icon: '🏛',  maxLevel: 3, baseCost: 350, costPerLevel: 300,
    desc: '-8% de custo de deploy de todas as torres por nível.' },
  { id: 'lab',        name: 'Laboratório de Campo',    icon: '🔬', maxLevel: 3, baseCost: 450, costPerLevel: 350,
    desc: 'Chefes e Elites têm chance de dropar ingrediente de relíquia. Nv1: 10%. Nv2: 20%. Nv3: 35%.' },
  { id: 'bank',       name: 'Banco de Guerra',         icon: '🏦', maxLevel: 3, baseCost: 400, costPerLevel: 300,
    desc: 'Ouro não gasto entre ondas é parcialmente mantido. Nv1: 15%. Nv2: 25%. Nv3: 40% (máx 500).' },
  { id: 'temple',     name: 'Templo dos Campeões',     icon: '⛩',  maxLevel: 4, baseCost: 550, costPerLevel: 400,
    desc: '+5% de dano global de todas as torres por nível.' },
  { id: 'relay',      name: 'Centro de Retransmissão', icon: '📡', maxLevel: 3, baseCost: 500, costPerLevel: 400,
    desc: '-15% cooldown de habilidades ativas por nível.' }
];

function getRelicById(id) { return RELICS[id] || null; }

function getRelicEffects(relicSave) {
  if (!relicSave || !relicSave.id) return null;
  const relic = RELICS[relicSave.id];
  if (!relic) return null;
  return relicSave.isCorrupted ? relic.corrupted_effects : relic.effects;
}

function getNexusStructureDef(id) { return NEXUS_STRUCTURES.find(s => s.id === id) || null; }

function getNexusUpgradeCost(structId, currentLevel) {
  const s = getNexusStructureDef(structId);
  if (!s) return 0;
  return s.baseCost + currentLevel * s.costPerLevel;
}
