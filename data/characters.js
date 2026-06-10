const CHARACTERS = {
  // ── Star Experience (drop exclusivo do Modo Infinito) ─────────────────────
  // Nv1 = XP equivalente a um personagem 4⭐. Cada nível superior multiplica.
  star_exp_1: { id: 'star_exp_1', name: 'Star Experience Nv1', rarity: 3, series: 'infinito', playable: false, xp_value: 3000, initials: 'SE1', image: 'assets/ingredients/infinite/Star Experience Nv1.png' },
  star_exp_2: { id: 'star_exp_2', name: 'Star Experience Nv2', rarity: 4, series: 'infinito', playable: false, xp_value: 7000, initials: 'SE2', image: 'assets/ingredients/infinite/Star Experience Nv2.png' },
  star_exp_3: { id: 'star_exp_3', name: 'Star Experience Nv3', rarity: 5, series: 'infinito', playable: false, xp_value: 16000, initials: 'SE3', image: 'assets/ingredients/infinite/Star Experience Nv3.png' },
  star_exp_4: { id: 'star_exp_4', name: 'Star Experience Nv4', rarity: 5, series: 'infinito', playable: false, xp_value: 38000, initials: 'SE4', image: 'assets/ingredients/infinite/Star Experience Nv4.png' },
  star_exp_5: { id: 'star_exp_5', name: 'Star Experience Nv5', rarity: 5, series: 'infinito', playable: false, xp_value: 90000, initials: 'SE5', image: 'assets/ingredients/infinite/Star Experience Nv5.png' },

  // ── Materials ─────────────────────────────────────────────────────────────
  ninja_generico_1: { id: 'ninja_generico_1', name: 'Ninja Genérico I', rarity: 0, series: 'naruto', playable: false, xp_value: 50, initials: 'NG1', image: 'assets/ingredients/world1/Ninja 1.png', upgrades_to: 'ninja_generico_2', upgrade_cost: 3 },
  ninja_generico_2: { id: 'ninja_generico_2', name: 'Ninja Genérico II', rarity: 1, series: 'naruto', playable: false, xp_value: 150, initials: 'NG2', image: 'assets/ingredients/world1/Ninja 2.png', upgrades_to: 'ninja_generico_3', upgrade_cost: 3 },
  ninja_generico_3: { id: 'ninja_generico_3', name: 'Ninja Genérico III', rarity: 2, series: 'naruto', playable: false, xp_value: 400, initials: 'NG3', image: 'assets/ingredients/world1/Ninja 3.png' },

  // ── Materials Marvel ──
  avenger_material_1: { id: 'avenger_material_1', name: 'Material Vingador I', rarity: 0, series: 'marvel', playable: false, xp_value: 50, initials: 'AM1', image: 'assets/ingredients/world4/Avenger 1.png', upgrades_to: 'avenger_material_2', upgrade_cost: 3 },
  avenger_material_2: { id: 'avenger_material_2', name: 'Material Vingador II', rarity: 1, series: 'marvel', playable: false, xp_value: 150, initials: 'AM2', image: 'assets/ingredients/world4/Avenger 2.png', upgrades_to: 'avenger_material_3', upgrade_cost: 3 },
  avenger_material_3: { id: 'avenger_material_3', name: 'Material Vingador III', rarity: 2, series: 'marvel', playable: false, xp_value: 400, initials: 'AM3', image: 'assets/ingredients/world4/Avenger 3.png' },

  // ── Materials DC ──
  dc_material_1: { id: 'dc_material_1', name: 'Material Cósmico I', rarity: 0, series: 'dc', playable: false, xp_value: 50, initials: 'DC1', image: 'assets/ingredients/world5/DC1.png', upgrades_to: 'dc_material_2', upgrade_cost: 3 },
  dc_material_2: { id: 'dc_material_2', name: 'Material Cósmico II', rarity: 1, series: 'dc', playable: false, xp_value: 150, initials: 'DC2', image: 'assets/ingredients/world5/DC2.png', upgrades_to: 'dc_material_3', upgrade_cost: 3 },
  dc_material_3: { id: 'dc_material_3', name: 'Material Cósmico III', rarity: 2, series: 'dc', playable: false, xp_value: 400, initials: 'DC3', image: 'assets/ingredients/world5/DC3.png' },

  // ══════════════════════════════════════════════════════════════════════════
  //  3⭐  —  Sem AOE. Poder vem de passivas, status effects e multiplicadores.
  //  Tipos permitidos: single_target, linha, cone (1-2 unidades), AOE só L.
  // ══════════════════════════════════════════════════════════════════════════

  // Ichigo — Stacker de Sangramento | 6 upgrades
  // Single → Linha | Bleed escala de 10 → 20 DPS
  ichigo_base: {
    id: 'ichigo_base', name: 'Ichigo (Base)', rarity: 3, series: 'bleach', playable: true, xp_value: 1000, initials: 'IB',
    image: 'assets/towers/update0/Ichigo.png',
    passive: {
      type: 'status_on_hit', status: 'sangramento', dps: 10, duration: 3,
      label: 'Espírito Feroz: cada acerto causa sangramento (10 DPS/3s, acumula)'
    },
    base_stats: { damage: 83, range: 91, attack_speed: 0.86, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 65, chain_mult: 0.50, chains: 1, label: 'Zanpakutō Ressonante: cortes encadeiam para 1 inimigo próximo (50% dano)' },
      5: { type: 'spirit_surge', trigger_at: 5, mult: 3.5, label: 'Getsuga Acumulado: cada 5º ataque dispara um Getsuga (3.5× dano)' },
      10: { type: 'phantom_strike', trigger_at: 7, phantom_mult: 1.6, label: 'Eco do Bankai: cada 7º ataque cria um corte fantasma em toda a área' }
    },
    upgrades: [
      { name: 'Getsugatensho', desc: 'Tipo → Linha | Dano ×1.3', type: 'linha', damage_mult: 1.3, cost: 170 },
      { name: 'Bankai Parcial', desc: 'Alcance ×1.2 | Vel ×1.2', range_mult: 1.28, speed_mult: 1.2, cost: 340 },
      { name: 'Espírito de Luta', desc: 'Sangramento → 15 DPS / 4s', passive_override: { dps: 15, duration: 4 }, cost: 450 },
      { name: 'Kurosaki', desc: 'Dano ×1.4 | Vel ×1.1', damage_mult: 1.4, speed_mult: 1.1, cost: 580 },
      { name: 'Ichigo Verdadeiro', desc: 'Sangramento → 20 DPS / 5s', passive_override: { dps: 20, duration: 5 }, cost: 780 },
      { name: 'Bankai Completo', desc: 'Dano ×1.7 | Vel ×1.2 | Alcance ×1.1', damage_mult: 1.7, speed_mult: 1.2, range_mult: 1.21, cost: 1100 }
    ]
  },

  // Goku — Crítico Nuclear | 5 upgrades
  // Single → Linha | Crit escala de 20%/2.5× → 38%/3.5×
  goku_base: {
    id: 'goku_base', name: 'Goku (Base)', rarity: 3, series: 'dragonball', playable: true, xp_value: 1000, initials: 'GB',
    image: 'assets/towers/update0/Goku.png',
    passive: {
      type: 'critical', chance: 0.20, mult: 2.5,
      label: 'Ki Oculto: 20% de chance de acerto crítico (2.5× dano)'
    },
    base_stats: { damage: 99, range: 94, attack_speed: 0.68, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.20, crit_mult: 2.0, splash_r: 55, splash_mult: 0.40, label: 'Ki Explosivo: críticos liberam onda de ki (40% dano em área)' },
      5: { type: 'battle_rage', per_enemy: 0.025, max_bonus: 0.50, label: 'Kaio-Ken Adaptativo: +2.5% dano por inimigo vivo (máx 50%)' },
      10: { type: 'spirit_surge', trigger_at: 6, mult: 5.0, label: 'Genkidama: cada 6º ataque concentra toda a energia (5× dano)' }
    },
    upgrades: [
      { name: 'Kamehameha', desc: 'Tipo → Linha | Dano ×1.4', type: 'linha', damage_mult: 1.4, cost: 170 },
      { name: 'Kaio-Ken', desc: 'Vel ×1.4 | Dano ×0.85', speed_mult: 1.4, damage_mult: 0.85, cost: 340 },
      { name: 'Super Saiyajin', desc: 'Dano ×1.8 | Crit → 28% / 3.0×', damage_mult: 1.8, passive_override: { chance: 0.28, mult: 3.0 }, cost: 550 },
      { name: 'Super Saiyajin 2', desc: 'Vel ×1.2 | Dano ×1.3', speed_mult: 1.2, damage_mult: 1.3, cost: 750 },
      { name: 'Ultra Instinto', desc: 'Dano ×1.6 | Crit → 38% / 3.5× | Vel ×1.1', damage_mult: 1.6, speed_mult: 1.1, passive_override: { chance: 0.38, mult: 3.5 }, cost: 1000 }
    ]
  },

  // L — Farm Puro (sem ataques) | 4 upgrades
  // Gera ouro por wave: base 60 + nível×3 + upgrades
  // Upgrades 2-4 adicionam kill_gold (bônus por kill na área)
  l_deathnote: {
    id: 'l_deathnote', name: 'L (Death Note)', rarity: 3, series: 'deathnote', playable: true, xp_value: 1000, initials: 'LD',
    image: 'assets/towers/update0/L.png',
    is_farm_unit: true,
    passive: {
      type: 'wave_gold', base: 50, perLevel: 2, prestigeMultPerLevel: 0.4,
      label: 'Análise Dedutiva: gera ouro ao fim de cada wave (escala com nível, upgrades e prestígio)'
    },
    base_stats: { damage: 0, range: 136, attack_speed: 0, type: 'none' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'gold_detector', bonus: 8, label: 'Análise Criminal: +8 ouro extra quando torres aliadas matam no alcance de L' },
      5: { type: 'farm_aura', bonus_pct: 0.20, label: 'Rede de Influência: torres de farm aliadas no alcance geram +20% de ouro extra por wave' },
      10: { type: 'gold_detector', bonus: 20, label: 'Identificação Final: kill bonus de aliados no alcance sobe para +20 ouro (substitui P1)' }
    },
    upgrades: [
      { name: 'Planejamento', desc: '+50 ouro/wave | Alcance ×1.2', gold_bonus: 50, range_mult: 1.28, cost: 160 },
      { name: 'Rede de Espionagem', desc: '+100 ouro/wave | +5 ouro por kill na área', gold_bonus: 100, kill_gold: 5, cost: 300 },
      { name: 'Investigação Avançada', desc: '+150 ouro/wave | kill bonus → 10 ouro', gold_bonus: 150, kill_gold: 10, cost: 500 },
      { name: 'Kira Identificado', desc: '+150 ouro/wave | kill bonus → 15 ouro | Alcance ×1.3', gold_bonus: 150, kill_gold: 15, range_mult: 1.35, cost: 750 }
    ]
  },

  // Demolidor — Controlador de Corredor | 5 upgrades
  // Single → Linha | Slow Aura escala de 30% → 50%
  demolidor: {
    id: 'demolidor', name: 'Demolidor', rarity: 3, series: 'marvel', playable: true, xp_value: 1000, initials: 'DD',
    image: 'assets/towers/update0/Demolidor.png',
    passive: {
      type: 'slow_aura', slow_pct: 0.30,
      label: 'Radar Tático: desacelera passivamente todos os inimigos na área em 30%'
    },
    base_stats: { damage: 85, range: 84, attack_speed: 0.86, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 60, chain_mult: 0.48, chains: 1, label: 'Dupla Morte: bastão encadeia para 1 inimigo próximo (48% dano)' },
      5: { type: 'kill_frenzy', duration: 2.5, speed_mult: 2.5, label: 'Fúria Cega: ao matar, vel. de ataque 2.5× por 2.5s' },
      10: { type: 'phantom_strike', trigger_at: 8, phantom_mult: 1.4, label: 'Radar Ofensivo: cada 8º ataque emite pulso de radar em toda a área' }
    },
    upgrades: [
      { name: 'Sentidos Aguçados', desc: 'Alcance ×1.35 | Slow → 35%', range_mult: 1.38, passive_override: { slow_pct: 0.35 }, cost: 165 },
      { name: 'Fúria', desc: 'Vel ×1.3 | Dano ×1.2', speed_mult: 1.3, damage_mult: 1.2, cost: 350 },
      { name: 'Reflexos Apurados', desc: 'Slow → 40% | Dano ×1.2', damage_mult: 1.2, passive_override: { slow_pct: 0.40 }, cost: 500 },
      { name: 'Sem Misericórdia', desc: 'Tipo → Linha | Dano ×1.6', type: 'linha', damage_mult: 1.6, cost: 700 },
      { name: 'Demolidor', desc: 'Slow → 50% | Dano ×1.5 | Vel ×1.1', damage_mult: 1.5, speed_mult: 1.1, passive_override: { slow_pct: 0.50 }, cost: 950 }
    ]
  },

  // Sasuke — Precision Striker + Burn | 5 upgrades
  // Single → Linha | Sharingan ignora req | Burn escala de 20 → 30 DPS
  sasuke_uchiha: {
    id: 'sasuke_uchiha', name: 'Sasuke Uchiha', rarity: 3, series: 'naruto', playable: true, xp_value: 1000, initials: 'SU',
    image: 'assets/towers/update0/Sasuke.png',
    passive: {
      type: 'critical', chance: 0.18, mult: 2.5,
      label: 'Sharingan: antecipa os movimentos inimigos — 18% de chance de acerto crítico (2.5×)'
    },
    base_stats: { damage: 105, range: 104, attack_speed: 0.55, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'spirit_surge', trigger_at: 4, mult: 3.0, label: 'Chidori Carregado: cada 4º ataque dispara um Chidori (3× dano)' },
      5: { type: 'status_on_hit', status: 'burn', dps: 25, duration: 4, label: 'Amaterasu: todos os acertos incendeiam (25 DPS/4s)' },
      10: { type: 'phantom_strike', trigger_at: 6, phantom_mult: 1.8, label: 'Susanoo: cada 6º ataque invoca braço do Susanoo em toda a área' }
    },
    upgrades: [
      { name: 'Chidori', desc: 'Tipo → Linha | Dano ×1.5', type: 'linha', damage_mult: 1.5, cost: 180 },
      { name: 'Susanoo Parcial', desc: 'Alcance ×1.2 | Dano ×1.3', range_mult: 1.28, damage_mult: 1.3, cost: 370 },
      { name: 'Sharingan Completo', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 520 },
      { name: 'Amaterasu', desc: 'Burn 20 DPS / 3s por acerto', status_effect: { type: 'burn', dps: 20, duration: 3 }, cost: 700 },
      { name: 'Susanoo Completo', desc: 'Dano ×1.6 | Burn → 30 DPS / 4s | Alcance ×1.1', damage_mult: 1.6, range_mult: 1.21, status_effect: { type: 'burn', dps: 30, duration: 4 }, cost: 950 }
    ]
  },

  // Killua — Mais Rápido do Tier + Paralisador | 6 upgrades
  // Single → Cone (Godspeed) | Double hit escala de 25% → 35%
  killua_zoldyck: {
    id: 'killua_zoldyck', name: 'Killua Zoldyck', rarity: 3, series: 'hxh', playable: true, xp_value: 1000, initials: 'KZ',
    image: 'assets/towers/update0/Kilua.png',
    passive: {
      type: 'chain_lightning', chains: 1, radius: 65, mult: 0.45,
      label: 'Godspeed Elétrico: cada ataque encadeia um raio de eletricidade para 1 inimigo próximo (45% dano)'
    },
    base_stats: { damage: 66, range: 78, attack_speed: 1.23, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'paralisia', duration: 0.5, label: 'Descarga Residual: eletricidade residual paralisa o alvo por 0.5s' },
      5: { type: 'kill_frenzy', duration: 3.0, speed_mult: 3.5, label: 'Godspeed: ao matar, vel. de ataque 3.5× por 3s' },
      10: { type: 'spirit_surge', trigger_at: 5, mult: 4.5, label: 'Descarga Total: cada 5º ataque libera toda a eletricidade (4.5× dano)' }
    },
    upgrades: [
      { name: 'Narukami', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 160 },
      { name: 'Modo Assassino', desc: 'Paralisia 0.5s por acerto', status_effect: { type: 'paralisia', duration: 0.5 }, cost: 330 },
      { name: 'Velocidade Relâmpago', desc: 'Vel ×1.25 | Dano ×1.2', speed_mult: 1.25, damage_mult: 1.2, cost: 480 },
      { name: 'Campo de Raios', desc: 'Paralisia → 0.8s | Dano ×1.3', damage_mult: 1.3, status_effect: { type: 'paralisia', duration: 0.8 }, cost: 650 },
      { name: 'Dança da Morte', desc: 'Vel ×1.2 | Dano ×1.3', speed_mult: 1.2, damage_mult: 1.3, cost: 850 },
      { name: 'Godspeed', desc: 'Vel ×1.3 | Dano ×1.4 | Raio encadeia +2 inimigos', speed_mult: 1.3, damage_mult: 1.4, passive_override: { chains: 2 }, cost: 1100 }
    ]
  },

  // Tanjiro — Rei da Sinergia de Burn | 5 upgrades
  // Single → Cone | 2× vs queimados | Burn nos upgrades escala de 15 → 25 DPS
  tanjiro_kamado: {
    id: 'tanjiro_kamado', name: 'Tanjiro Kamado', rarity: 3, series: 'kimetsu', playable: true, xp_value: 1000, initials: 'TK',
    image: 'assets/towers/update0/Tanjiro.png',
    passive: {
      type: 'bonus_vs_burned', mult: 2.0,
      label: 'Respiração Total: causa 2× de dano em inimigos que estão queimando'
    },
    base_stats: { damage: 86, range: 91, attack_speed: 0.68, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'burn', dps: 15, duration: 3, label: 'Respiração Solar: cada acerto aplica chama solar (15 DPS/3s)' },
      5: { type: 'spirit_surge', trigger_at: 5, mult: 4.0, label: 'Hinokami Kagura: cada 5º ataque é a dança do Deus do Fogo (4× dano)' },
      10: { type: 'phantom_strike', trigger_at: 6, phantom_mult: 1.7, label: 'Dança do Deus do Fogo: cada 6º ataque irradia em toda a área' }
    },
    upgrades: [
      { name: 'Dança da Lareira', desc: 'Vel ×1.2 | Burn 15 DPS / 2s por acerto', speed_mult: 1.2, status_effect: { type: 'burn', dps: 15, duration: 2 }, cost: 175 },
      { name: 'Respiração Solar', desc: 'Dano ×1.5 | Alcance ×1.1', damage_mult: 1.5, range_mult: 1.21, cost: 360 },
      { name: 'Décima Forma', desc: 'Burn → 20 DPS / 3s | Dano ×1.3', damage_mult: 1.3, status_effect: { type: 'burn', dps: 20, duration: 3 }, cost: 520 },
      { name: 'Hinokami Kagura', desc: 'Dano ×1.5 | Vel ×1.15', damage_mult: 1.5, speed_mult: 1.15, cost: 720 },
      { name: 'Dança do Deus Fogo', desc: 'Dano ×1.6 | Vel ×1.1 | Burn → 25 DPS / 4s', damage_mult: 1.6, speed_mult: 1.1, status_effect: { type: 'burn', dps: 25, duration: 4 }, cost: 950 }
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  //  4⭐  —  Podem ter AOE (não Full AOE). Cada um com archetype distinto.
  // ══════════════════════════════════════════════════════════════════════════

  // Naruto — AOE Farmer consistente | 6 upgrades
  // AOE durante toda a progressão | Kill reduz CD
  naruto_shippuden: {
    id: 'naruto_shippuden', name: 'Naruto (Shippuden)', rarity: 4, series: 'naruto', playable: true, xp_value: 3000, initials: 'NS',
    image: 'assets/towers/update0/Naruto.png',
    passive: {
      type: 'kill_cooldown', reduction: 0.20,
      label: 'Kage Bunshin: ao matar, próximo ataque vem com 80% do cooldown reduzido'
    },
    base_stats: { damage: 163, range: 113, attack_speed: 0.8, type: 'single_target' },
    deploy_cost: 300, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 80, chain_mult: 0.60, chains: 2, label: 'Rasengan Duplo: chakra encadeia para 2 inimigos em sequência (60% dano)' },
      5: { type: 'phantom_strike', trigger_at: 5, phantom_mult: 1.8, label: 'Kage Bunshin em Combate: cada 5º ataque clones acertam toda a área' },
      10: { type: 'battle_rage', per_enemy: 0.040, max_bonus: 0.80, label: 'Modo Sábio: senjutsu escala massivamente (+4% dano/inimigo, máx 80%)' }
    },
    upgrades: [
      { name: 'Rasengan', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 200 },
      { name: 'Modo Clone', desc: 'Vel ×1.3 | Alcance ×0.9', speed_mult: 1.3, range_mult: 0.94, cost: 400 },
      { name: 'Rasengan Gigante', desc: 'Dano ×1.4 | Alcance ×1.1', damage_mult: 1.4, range_mult: 1.21, cost: 580 },
      { name: 'Modo Sábio', desc: 'Vel ×1.2 | Alcance ×1.15 | Kill CD → 90% reduzido', speed_mult: 1.2, range_mult: 1.25, passive_override: { reduction: 0.10 }, cost: 750 },
      { name: 'Rasenshuriken', desc: 'Tipo → Cone | Dano ×1.7', type: 'cone', damage_mult: 1.7, cost: 950 },
      { name: 'Modo Bijuu', desc: 'Dano ×1.5 | Vel ×1.15 | Alcance ×1.1', damage_mult: 1.5, speed_mult: 1.15, range_mult: 1.21, cost: 1300 }
    ]
  },


  // Levi — Kill Streak Ilimitado | 7 upgrades
  // Single → Linha | Stacks aumentam com upgrades (5 → 15)
  levi_ackerman: {
    id: 'levi_ackerman', name: 'Levi Ackerman', rarity: 4, series: 'snk', playable: true, xp_value: 3000, initials: 'LA',
    image: 'assets/towers/update0/Levi.png',
    passive: {
      type: 'kill_streak', stack_bonus: 0.20, decay_time: 4, max_stacks: 5,
      label: 'Chacina: cada kill empilha +20% de dano (máx 5 stacks, reseta 4s sem matar)'
    },
    base_stats: { damage: 141, range: 104, attack_speed: 1.05, type: 'single_target' },
    deploy_cost: 300, max_level: 50,
    prestige_passives: {
      1: { type: 'kill_frenzy', duration: 3.0, speed_mult: 3.0, label: 'ODM Veloz: ao matar, vel. de ataque 3× por 3s' },
      5: { type: 'spirit_surge', trigger_at: 4, mult: 4.5, label: 'Golpe Decisivo: cada 4º golpe é o ataque do Capitão (4.5× dano)' },
      10: { type: 'arc_chain', chain_r: 90, chain_mult: 0.70, chains: 2, label: 'Estilo Ackerman: cada ataque encadeia 2 inimigos via ODM' }
    },
    upgrades: [
      { name: 'Equipamento ODM', desc: 'Vel ×1.3 | Dano ×1.25', speed_mult: 1.3, damage_mult: 1.25, cost: 195 },
      { name: 'Reflexos', desc: 'Dano ×1.2 | Máx stacks → 7', damage_mult: 1.2, passive_override: { max_stacks: 7 }, cost: 390 },
      { name: 'Chacina de Titãs', desc: 'Alcance ×1.2 | Vel ×1.1', range_mult: 1.28, speed_mult: 1.1, cost: 550 },
      { name: 'Controle Total', desc: 'Máx stacks → 10 | Reset → 5s', passive_override: { max_stacks: 10, decay_time: 5 }, cost: 720 },
      { name: 'Melhor da Humanidade', desc: 'Dano ×1.5 | Vel ×1.2', damage_mult: 1.5, speed_mult: 1.2, cost: 900 },
      { name: 'Modo Combate', desc: 'Tipo → Linha | Dano ×1.5 | Vel ×0.9', type: 'linha', damage_mult: 1.5, speed_mult: 0.9, cost: 1100 },
      { name: 'Capitão Ackerman', desc: 'Vel ×1.3 | Dano ×1.5 | Máx stacks → 15', speed_mult: 1.3, damage_mult: 1.5, passive_override: { max_stacks: 15 }, cost: 1400 }
    ]
  },

  // Meliodas — DoT Duplo que se Espalha | 6 upgrades
  // Single → Cone → AOE | Burn + Bleed em todo acerto, DoTs escalam
  meliodas_base: {
    id: 'meliodas_base', name: 'Meliodas', rarity: 4, series: 'nanatsu', playable: true, xp_value: 3000, initials: 'ML',
    image: 'assets/towers/update0/Meliodas.png',
    passive: {
      type: 'dual_affliction', burn_dps: 14, burn_duration: 2, bleed_dps: 7, bleed_duration: 2,
      label: 'Dragão Pecado da Ira: todo acerto causa Burn (14 DPS) + Bleed (7 DPS) simultâneos'
    },
    base_stats: { damage: 152, range: 104, attack_speed: 0.77, type: 'single_target' },
    deploy_cost: 300, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.25, crit_mult: 2.0, splash_r: 65, splash_mult: 0.52, label: 'Daihāzan: críticos explodem em demonic slash (52% dano em área)' },
      5: { type: 'echo_strike', chance: 0.30, dmg_mult: 2.0, label: 'Fullcounter Passivo: 30% de chance de refletir o dano (2× dano)' },
      10: { type: 'spirit_surge', trigger_at: 4, mult: 5.5, label: 'Revenge Counter: cada 4º ataque é um Revenge Counter (5.5× dano!)' }
    },
    upgrades: [
      { name: 'Contra', desc: 'Tipo → Cone | Dano ×1.3', type: 'cone', damage_mult: 1.3, cost: 190 },
      { name: 'Escudo de Liz', desc: 'Vel ×1.3 | Dano ×1.2', speed_mult: 1.3, damage_mult: 1.2, cost: 380 },
      { name: 'Fúria do Dragão', desc: 'Burn → 18 DPS | Bleed → 10 DPS', passive_override: { burn_dps: 18, bleed_dps: 10 }, cost: 560 },
      { name: 'Modo Demônio', desc: 'Dano ×1.5 | Vel ×1.15 | Burn → 22 DPS | Bleed → 14 DPS', damage_mult: 1.5, speed_mult: 1.15, passive_override: { burn_dps: 22, bleed_dps: 14 }, cost: 750 },
      { name: 'Dez Mandamentos', desc: 'Vel ×1.1 | Burn → 24 DPS | Bleed → 16 DPS', speed_mult: 1.1, passive_override: { burn_dps: 24, bleed_dps: 16 }, cost: 950 },
      { name: 'Poder dos Demônios', desc: 'Dano ×1.8 | Alcance ×1.1 | Burn → 28 | Bleed → 18', damage_mult: 1.8, range_mult: 1.21, passive_override: { burn_dps: 28, bleed_dps: 18 }, cost: 1300 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  5⭐  —  Tier exclusivo. Gojo = Full AOE + suporte. Sage = exército de clones.
  // ══════════════════════════════════════════════════════════════════════════

  // Naruto Sage — Exército de Clones | 5 upgrades
  // Single target rápido — 8 clones independentes = cobertura real sem Full AOE por tipo
  naruto_sage: {
    id: 'naruto_sage', name: 'Naruto (Sage Mode)', rarity: 5, series: 'naruto', playable: true, xp_value: 8000, initials: 'NM',
    image: 'assets/towers/update0/Naruto Sage.png',
    passive: {
      type: 'clone_on_attack', chance: 0.15, duration: 60, maxClones: 3, damage_pct: 0.30,
      label: 'Senjutsu: 15% de chance por ataque de invocar um clone por 60s (máx 3, clones causam 30% do dano)'
    },
    base_stats: { damage: 270, range: 130, attack_speed: 1.36, type: 'single_target' },
    deploy_cost: 500, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 100, chain_mult: 0.72, chains: 2, label: 'Modo Sábio Aprimorado: chakra da natureza encadeia 2 inimigos (72% dano)' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 6.0, label: 'Rasenshuriken: cada 3º ataque é um Rasenshuriken (6× dano!)' },
      10: { type: 'phantom_strike', trigger_at: 4, phantom_mult: 2.8, label: 'Modo Seis Caminhos: cada 4º ataque os seis caminhos varrem toda a área' }
    },
    upgrades: [
      { name: 'Senjutsu', desc: 'Dano ×1.35 | Alcance ×1.1 | Clone chance → 20%', damage_mult: 1.35, range_mult: 1.21, passive_override: { chance: 0.20 }, cost: 400 },
      { name: 'Modo Sábio', desc: 'Vel ×1.2 | Clone duração → 75s', speed_mult: 1.2, passive_override: { duration: 75 }, cost: 700 },
      { name: 'Modo Sábio Completo', desc: 'Dano ×1.4 | Máx clones → 4', damage_mult: 1.4, passive_override: { maxClones: 4 }, cost: 1000 },
      { name: 'Monte Myoboku', desc: 'Vel ×1.15 | Alcance ×1.1 | Clone chance → 25%', speed_mult: 1.15, range_mult: 1.21, passive_override: { chance: 0.25 }, cost: 1300 },
      { name: 'Modo Bijuu', desc: 'Dano ×1.4 | Vel ×1.15 | Máx clones → 5', damage_mult: 1.40, speed_mult: 1.15, passive_override: { maxClones: 5 }, cost: 1700 }
    ],
    evolution: {
      source: 'naruto_shippuden', requires: [
        { id: 'naruto_shippuden', quantity: 2 },
        { id: 'ninja_generico_2', quantity: 3 },
        { id: 'ninja_generico_3', quantity: 2 }
      ]
    }
  },

  // Gojo — Full AOE + Suporte | 4 upgrades (menos upgrades, cada um mais pesado)
  // Full AOE + aura +25% a torres + Domínio Expandido (stun ativo)
  gojo_satoru: {
    id: 'gojo_satoru', name: 'Gojo Satoru', rarity: 5, series: 'jjk', playable: true, xp_value: 8000, initials: 'GS',
    image: 'assets/towers/update0/Gojo.png',
    passive: {
      type: 'damage_aura', bonus: 0.25,
      label: 'Amplificação Maldita: torres dentro do alcance causam +25% de dano'
    },
    active_ability: { type: 'domain_expansion', stun_duration: 3, cooldown: 35, label: 'Domínio Expandido' },
    base_stats: { damage: 407, range: 123, attack_speed: 1.05, type: 'aoe' },
    deploy_cost: 500, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.32, crit_mult: 2.5, splash_r: 90, splash_mult: 0.70, label: 'Cursed Energy Overflow: críticos colapsam o infinito em área (70% dano)' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 7.0, label: 'Purple — Hollow Purple: cada 3º ataque é a técnica Roxa (7× dano!)' },
      10: { type: 'phantom_strike', trigger_at: 4, phantom_mult: 3.0, label: 'Expansão do Território: cada 4º ataque expande o domínio por toda a área' }
    },
    upgrades: [
      { name: 'Infinito', desc: 'Dano ×1.25 | Alcance ×1.15', damage_mult: 1.25, range_mult: 1.25, cost: 420 },
      { name: 'Vermelho Maldito', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 750 },
      { name: 'Azul Maldito', desc: 'Alcance ×1.1 | Aura → +30% | Stun → 4s', range_mult: 1.21, passive_override: { bonus: 0.30 }, active_override: { stun_duration: 4 }, cost: 1100 },
      { name: 'Violeta Oco', desc: 'Dano ×1.8 | Vel ×1.15 | Alcance ×1.1', damage_mult: 1.8, speed_mult: 1.15, range_mult: 1.21, cost: 1700 }
    ]
  },

  // ── Ingredients (One Piece) ──
  pirata_generico_1: { id: 'pirata_generico_1', name: 'Pirata I', rarity: 0, series: 'onepiece', playable: false, xp_value: 60, initials: 'P1', image: 'assets/ingredients/world2/Pirata 1.png', upgrades_to: 'pirata_generico_2', upgrade_cost: 3 },
  pirata_generico_2: { id: 'pirata_generico_2', name: 'Pirata II', rarity: 1, series: 'onepiece', playable: false, xp_value: 180, initials: 'P2', image: 'assets/ingredients/world2/Pirata 2.png', upgrades_to: 'pirata_generico_3', upgrade_cost: 3 },
  pirata_generico_3: { id: 'pirata_generico_3', name: 'Pirata III', rarity: 2, series: 'onepiece', playable: false, xp_value: 500, initials: 'P3', image: 'assets/ingredients/world2/Pirata 3.png' },

  // ── Materiais Bleach ───────────────────────────────────────────────────────
  shinigami_generico_1: {
    id: 'shinigami_generico_1', name: 'Shinigami I', rarity: 0, series: 'bleach',
    playable: false, xp_value: 100, initials: 'S1', image: 'assets/ingredients/world3/Shinigami 1 (1).png',
    upgrades_to: 'shinigami_generico_2', upgrade_cost: 3
  },
  shinigami_generico_2: {
    id: 'shinigami_generico_2', name: 'Shinigami II', rarity: 1, series: 'bleach',
    playable: false, xp_value: 300, initials: 'S2', image: 'assets/ingredients/world3/Shinigami 2 (1).png',
    upgrades_to: 'shinigami_generico_3', upgrade_cost: 3
  },
  shinigami_generico_3: {
    id: 'shinigami_generico_3', name: 'Shinigami III', rarity: 2, series: 'bleach',
    playable: false, xp_value: 800, initials: 'S3', image: 'assets/ingredients/world3/Shinigame 3.png'
  },

  // ── Materiais Marvel ───────────────────────────────────────────────────────
  avenger_material_1: { id: 'avenger_material_1', name: 'Dados de Campo I', rarity: 0, series: 'marvel', playable: false, xp_value: 50, initials: 'AF1', image: 'assets/ingredients/world4/Avenger Material 1.png', upgrades_to: 'avenger_material_2', upgrade_cost: 3 },
  avenger_material_2: { id: 'avenger_material_2', name: 'Dados de Campo II', rarity: 1, series: 'marvel', playable: false, xp_value: 150, initials: 'AF2', image: 'assets/ingredients/world4/Avenger Material 2.png', upgrades_to: 'avenger_material_3', upgrade_cost: 3 },
  avenger_material_3: { id: 'avenger_material_3', name: 'Dados de Campo III', rarity: 2, series: 'marvel', playable: false, xp_value: 400, initials: 'AF3', image: 'assets/ingredients/world4/Avenger Material 3.png' },

  // ── 3⭐ Bleach ──────────────────────────────────────────────────────────────
  rukia_kuchiki: {
    id: 'rukia_kuchiki', name: 'Rukia Kuchiki', rarity: 3, series: 'bleach',
    playable: true, xp_value: 1000, initials: 'RK',
    image: 'assets/towers/update1/Rukia Kuchiki.png',
    passive: {
      type: 'freeze_on_hit', chance: 0.28, duration: 2.0,
      label: 'Sode no Shirayuki: 28% de chance de congelar o alvo por 2s a cada acerto'
    },
    base_stats: { damage: 88, range: 145, attack_speed: 0.7, type: 'single' },
    deploy_cost: 225, max_level: 50,
    prestige_passives: {
      1: { type: 'spirit_surge', trigger_at: 5, mult: 3.2, label: 'Dança Segunda Aprimorada: cada 5º ataque é uma dança de gelo (3.2× dano)' },
      5: { type: 'arc_chain', chain_r: 75, chain_mult: 0.52, chains: 1, label: 'Shirafune Perfurante: lâmina de gelo encadeia para 1 inimigo (52% dano)' },
      10: { type: 'phantom_strike', trigger_at: 7, phantom_mult: 1.5, label: 'Dança da Morte Gélida: cada 7º ataque fragmenta gelo em toda a área' }
    },
    upgrades: [
      { name: 'Dança Primeira', desc: 'Dano ×1.3 | Freeze dura 3s', damage_mult: 1.3, cost: 350 },
      { name: 'Dança Segunda', desc: 'Alcance ×1.2 | Vel ×1.15', range_mult: 1.2, speed_mult: 1.15, cost: 600 },
      { name: 'Dança Terceira: Shirafune', desc: 'Dano ×1.5 | Tipo: linha (corte gelo)', damage_mult: 1.5, type: 'linha', cost: 1000 },
      { name: 'Dança Quarta', desc: 'Freeze: 28%→42% | Dano ×1.3', damage_mult: 1.3, passive_override: { chance: 0.42, duration: 3 }, cost: 1400 },
      { name: 'Dança Última: Juhaku', desc: 'Dano ×1.6 | Vel ×1.15 | Freeze → 58%/3.5s', damage_mult: 1.6, speed_mult: 1.15, passive_override: { chance: 0.58, duration: 3.5 }, cost: 2000 }
    ]
  },
  renji_abarai: {
    id: 'renji_abarai', name: 'Renji Abarai', rarity: 3, series: 'bleach',
    playable: true, xp_value: 1000, initials: 'RA',
    image: 'assets/towers/update1/Renji Abarai.png',
    passive: {
      type: 'snake_venom', stacks: 5, burstMult: 4.5,
      label: 'Zabimaru: a cada 5 acertos no mesmo inimigo, explode causando 4.5× dano'
    },
    base_stats: { damage: 110, range: 115, attack_speed: 0.59, type: 'single' },
    deploy_cost: 240, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 90, chain_mult: 0.45, chains: 1, label: 'Serpente Extensível: Zabimaru encadeia para 1 inimigo distante (45% dano)' },
      5: { type: 'kill_frenzy', duration: 2.5, speed_mult: 3.0, label: 'Fúria Zabimaru: ao matar, vel. de ataque 3× por 2.5s' },
      10: { type: 'spirit_surge', trigger_at: 5, mult: 4.0, label: 'Bankai — Tiro Final: cada 5º ataque é a descarga total do Bankai (4× dano)' }
    },
    upgrades: [
      { name: 'Garra Alongada', desc: 'Alcance ×1.25 | Dano ×1.2', range_mult: 1.25, damage_mult: 1.2, cost: 380 },
      { name: 'Forma Serpente', desc: 'Vel ×1.3 | Stacks explodem em 4', speed_mult: 1.3, cost: 650 },
      { name: 'Bankai: Hihiō Zabimaru', desc: 'Dano ×2 | Cone ao explodir os stacks', damage_mult: 2.0, type: 'cone', cost: 1100 },
      { name: 'Zabimaru Devastador', desc: 'Burst stacks reduzem para 3 | Dano ×1.4', damage_mult: 1.4, passive_override: { stacks: 3 }, cost: 1500 },
      { name: 'Bankai Supremo', desc: 'Dano ×1.8 | Vel ×1.15 | BurstMult → 6×', damage_mult: 1.8, speed_mult: 1.15, passive_override: { burstMult: 6.0 }, cost: 2200 }
    ]
  },
  uryu_ishida: {
    id: 'uryu_ishida', name: 'Uryu Ishida', rarity: 3, series: 'bleach',
    playable: true, xp_value: 1000, initials: 'UI',
    image: 'assets/towers/update1/Uryu Ishida.png',
    passive: { type: 'quincy_pierce', label: 'Letzt Stil: flechas perfuram até 3 inimigos em linha' },
    base_stats: { damage: 80, range: 200, attack_speed: 0.76, type: 'pierce' },
    deploy_cost: 230, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.22, crit_mult: 2.0, splash_r: 55, splash_mult: 0.42, label: 'Flecha Explosiva: críticos explodem em energia Quincy (42% dano)' },
      5: { type: 'spirit_surge', trigger_at: 5, mult: 3.5, label: 'Letzt Stil Aprimorado: cada 5º tiro é o golpe supremo Quincy (3.5× dano)' },
      10: { type: 'phantom_strike', trigger_at: 6, phantom_mult: 1.5, label: 'Chuva Final de Reishi: cada 6º ataque cobre toda a área de flechas' }
    },
    upgrades: [
      { name: 'Reishi Avançado', desc: 'Dano ×1.3 | Alcance ×1.1', damage_mult: 1.3, range_mult: 1.1, cost: 340 },
      { name: 'Blut Vene', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 580 },
      { name: 'Vollständig', desc: 'Dano ×1.6 | Perfura 5 inimigos', damage_mult: 1.6, passive_override: { count: 5 }, cost: 950 },
      { name: 'Reishi Quincy', desc: 'Vel ×1.25 | Dano ×1.3 | Perfura 7 inimigos', damage_mult: 1.3, speed_mult: 1.25, passive_override: { count: 7 }, cost: 1300 },
      { name: 'Letzt Stil Quincy', desc: 'Dano ×1.7 | Vel ×1.15', damage_mult: 1.7, speed_mult: 1.15, cost: 2000 }
    ]
  },
  orihime_inoue: {
    id: 'orihime_inoue', name: 'Orihime Inoue', rarity: 3, series: 'bleach',
    playable: true, xp_value: 1000, initials: 'OI',
    image: 'assets/towers/update1/Orihime Inoue.png',
    passive: {
      type: 'santen_kesshun', radius: 145,
      label: 'Santen Kesshun: torres no alcance de Orihime ficam imunes a stun continuamente'
    },
    base_stats: { damage: 75, range: 145, attack_speed: 0.48, type: 'single' },
    deploy_cost: 210, max_level: 50,
    prestige_passives: {
      1: { type: 'gold_detector', bonus: 6, label: 'Cura de Campo: +6 ouro extra quando torres aliadas matam no alcance de Orihime' },
      5: { type: 'damage_aura', bonus: 0.20, label: 'Escudo Amplificador: torres aliadas no alcance de Orihime causam +20% de dano' },
      10: { type: 'bankai_pressure', mult: 1.25, label: 'Campo de Rejeição Total: inimigos no alcance de Orihime recebem +25% de dano de todas as fontes' }
    },
    upgrades: [
      { name: 'Koten Zanshun', desc: 'Dano ×1.35 | Alcance do escudo ×1.2', damage_mult: 1.35, cost: 320 },
      { name: 'Sōten Kisshun', desc: 'Vel ×1.2 | Raio de proteção +40px', speed_mult: 1.2, cost: 550 },
      { name: 'Tsubaki Pleno', desc: 'Dano ×1.5 | Tipo: cone (golpe à frente)', damage_mult: 1.5, type: 'cone', cost: 900 },
      { name: 'Sanshunō Reijin', desc: 'Dano ×1.4 | Alcance ×1.15', damage_mult: 1.4, range_mult: 1.15, cost: 1300 },
      { name: 'Sōten Kisshun Total', desc: 'Dano ×1.8 | Vel ×1.15 | Campo de Rejeição +30%', damage_mult: 1.8, speed_mult: 1.15, cost: 2000 }
    ]
  },
  chad_yasutora: {
    id: 'chad_yasutora', name: 'Chad Yasutora', rarity: 3, series: 'bleach',
    playable: true, xp_value: 1000, initials: 'CY',
    image: 'assets/towers/update1/Chad Yasutora.png',
    passive: {
      type: 'boss_slayer', mult: 2.2,
      label: 'Brazo Derecho: causa 2.2× dano a minibosses e bosses'
    },
    base_stats: { damage: 185, range: 85, attack_speed: 0.41, type: 'single_target' },
    deploy_cost: 260, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 65, chain_mult: 0.50, chains: 1, label: 'Impacto Ressoa: onda de choque encadeia para 1 inimigo próximo (50% dano)' },
      5: { type: 'battle_rage', per_enemy: 0.030, max_bonus: 0.55, label: 'Raiva Crescente: +3% dano por inimigo vivo (máx 55%)' },
      10: { type: 'spirit_surge', trigger_at: 5, mult: 4.0, label: 'El Directo Final: cada 5º ataque é um soco definitivo (4× dano)' }
    },
    upgrades: [
      { name: 'Brazo Izquierda', desc: 'Dano ×1.4 | Alcance ×1.2', damage_mult: 1.4, range_mult: 1.2, cost: 420 },
      { name: 'Armadura Completa', desc: 'Dano ×1.2 | Boss Slayer → 2.6×', damage_mult: 1.2, passive_override: { mult: 2.6 }, cost: 700 },
      { name: 'El Directo', desc: 'Dano ×1.8 | Tipo: cone (esmaga à frente)', damage_mult: 1.8, type: 'cone', cost: 1200 },
      { name: 'Braço de Ferro', desc: 'Dano ×1.5 | Boss Slayer → 3×', damage_mult: 1.5, passive_override: { mult: 3.0 }, cost: 1600 },
      { name: 'El Directo Final', desc: 'Dano ×2.0 | Vel ×1.15 | Boss Slayer → 3.5×', damage_mult: 2.0, speed_mult: 1.15, passive_override: { mult: 3.5 }, cost: 2400 }
    ]
  },

  // ── 4⭐ Bleach ──────────────────────────────────────────────────────────────
  byakuya_kuchiki: {
    id: 'byakuya_kuchiki', name: 'Byakuya Kuchiki', rarity: 4, series: 'bleach',
    playable: true, xp_value: 4000, initials: 'BK',
    image: 'assets/towers/update1/Byakuha Kuchiki (1).png',
    passive: {
      type: 'petal_mark', splashRadius: 95, splashMult: 1.3,
      label: 'Senbonzakura: ao matar, pétalas explodem causando 1.3× dano em área'
    },
    base_stats: { damage: 165, range: 160, attack_speed: 0.53, type: 'scatter' },
    deploy_cost: 380, max_level: 50,
    prestige_passives: {
      1: { type: 'spirit_surge', trigger_at: 4, mult: 4.0, label: 'Senbonzakura Dupla: cada 4º ataque desencadeia rajada de pétalas (4× dano)' },
      5: { type: 'phantom_strike', trigger_at: 5, phantom_mult: 2.0, label: 'Kageyoshi Fantasma: cada 5º ataque dispersa pétalas em toda a área' },
      10: { type: 'arc_chain', chain_r: 90, chain_mult: 0.68, chains: 2, label: 'Bankai Final: cada ataque encadeia 2 inimigos com cortes de pétala' }
    },
    upgrades: [
      { name: 'Senbonzakura Ativo', desc: 'Dano ×1.4 | Explosão de kill ×1.6×', damage_mult: 1.4, cost: 550 },
      { name: 'Kageyoshi', desc: 'Alcance ×1.2 | Vel ×1.15', range_mult: 1.2, speed_mult: 1.15, cost: 900 },
      { name: 'Bankai: Senbonzakura Kageyoshi', desc: 'Dano ×1.8 | Tipo: scatter full (todo o mapa)', damage_mult: 1.8, type: 'scatter', cost: 1600 },
      { name: 'Senbonzakura Avançada', desc: 'Explosão de kill: 1.6×→2.0× | Dano ×1.3', damage_mult: 1.3, passive_override: { splashMult: 2.0 }, cost: 2000 },
      { name: 'Supremacia do Kuchiki', desc: 'Dano ×1.8 | Vel ×1.15 | Explosão de kill: 2.5×', damage_mult: 1.8, speed_mult: 1.15, passive_override: { splashMult: 2.5 }, cost: 3000 }
    ]
  },
  toshiro_hitsugaya: {
    id: 'toshiro_hitsugaya', name: 'Toshiro Hitsugaya', rarity: 4, series: 'bleach',
    playable: true, xp_value: 4000, initials: 'TH',
    image: 'assets/towers/update1/Toshiro Hitsugaya.png',
    passive: {
      type: 'damage_pulse', interval: 5.0, dmg_mult: 0.45,
      label: 'Hyōrinmaru — Domínio do Dragão: o dragão de gelo pulsa a cada 5s causando dano glacial em área (45% dano)'
    },
    base_stats: { damage: 145, range: 148, attack_speed: 0.49, type: 'single_target' },
    deploy_cost: 400, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 90, chain_mult: 0.60, chains: 1, label: 'Tensō Jūrin: raio de gelo encadeia para 1 inimigo adicional (60% dano)' },
      5: { type: 'spirit_surge', trigger_at: 4, mult: 4.5, label: 'Ryūsenka Aprimorado: cada 4º ataque é a mordida do dragão de gelo (4.5×)' },
      10: { type: 'phantom_strike', trigger_at: 5, phantom_mult: 2.2, label: 'Dragão de Gelo: cada 5º ataque o dragão varre toda a área' }
    },
    upgrades: [
      { name: 'Tensō Jūrin', desc: 'Dano ×1.3 | Pulso a cada 4.5s', damage_mult: 1.3, passive_override: { interval: 4.5 }, cost: 580 },
      { name: 'Ryūsenka', desc: 'Tipo → Cone | Congela todos no cone', damage_mult: 1.2, type: 'cone', status_effect: { type: 'freeze', duration: 2.5 }, cost: 950 },
      { name: 'Bankai: Daiguren Hyōrinmaru', desc: 'Dano ×1.7 | Alcance ×1.3', damage_mult: 1.7, range_mult: 1.3, cost: 1700 },
      { name: 'Gelo Eterno', desc: 'Dano ×1.3 | Pulso a cada 3.5s/0.6×', damage_mult: 1.3, passive_override: { interval: 3.5, dmg_mult: 0.60 }, cost: 2100 },
      { name: 'Dragão Divino', desc: 'Dano ×1.8 | Vel ×1.15 | Pulso a cada 2.5s/0.75×', damage_mult: 1.8, speed_mult: 1.15, passive_override: { interval: 2.5, dmg_mult: 0.75 }, cost: 3000 }
    ]
  },
  kenpachi_zaraki: {
    id: 'kenpachi_zaraki', name: 'Kenpachi Zaraki', rarity: 4, series: 'bleach',
    playable: true, xp_value: 4000, initials: 'KZ',
    image: 'assets/towers/update1/Zenpachi Zaraki.png',
    passive: {
      type: 'berserker', maxStacks: 40, dmgPerStack: 0.04,
      label: 'Sede de Batalha: cada kill aumenta dano permanentemente (+4% por kill, máx 40 stacks)'
    },
    base_stats: { damage: 230, range: 85, attack_speed: 0.38, type: 'single' },
    deploy_cost: 420, max_level: 50,
    prestige_passives: {
      1: { type: 'kill_frenzy', duration: 4.0, speed_mult: 3.5, label: 'Sede de Sangue: ao matar, vel. de ataque 3.5× por 4s' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 5.5, label: 'Nozarashi: cada 3º ataque é o golpe do Nozarashi (5.5× dano!)' },
      10: { type: 'battle_rage', per_enemy: 0.045, max_bonus: 0.90, label: 'Frenesi Absoluto: +4.5% dano por inimigo vivo (máx 90%)' }
    },
    upgrades: [
      { name: 'Eyepatch Removido', desc: 'Vel ×1.5 | Dano ×1.3', speed_mult: 1.5, damage_mult: 1.3, cost: 600 },
      { name: 'Kenpachi Liberado', desc: 'Alcance ×1.3 | Dano ×1.4', range_mult: 1.3, damage_mult: 1.4, cost: 1000 },
      { name: 'Bankai: Unnamed', desc: 'Dano ×2 | Tipo: cone | Stacks máx: 60 (+4%/stack)', damage_mult: 2.0, type: 'cone', cost: 1800 },
      { name: 'Berserker Pleno', desc: 'Dano ×1.5 | Stacks máx → 80 | +4.5%/kill', damage_mult: 1.5, passive_override: { maxStacks: 80, dmgPerStack: 0.045 }, cost: 2300 },
      { name: 'Zaraki Definitivo', desc: 'Dano ×1.8 | Vel ×1.2 | Stacks máx → 100', damage_mult: 1.8, speed_mult: 1.2, passive_override: { maxStacks: 100 }, cost: 3500 }
    ]
  },

  // ── 5⭐ Gacha ───────────────────────────────────────────────────────────────
  ichigo_bankai: {
    id: 'ichigo_bankai', name: 'Ichigo (Bankai)', rarity: 5, series: 'bleach',
    playable: true, xp_value: 10000, initials: 'IB',
    image: 'assets/towers/update1/Ichigo Bankai.png',
    passive: {
      type: 'bankai_pressure', mult: 1.55,
      label: 'Pressão do Bankai: inimigos no alcance de Ichigo recebem 1.55× de dano de todas as torres'
    },
    base_stats: { damage: 640, range: 135, attack_speed: 0.42, type: 'single' },
    deploy_cost: 600, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 100, chain_mult: 0.72, chains: 2, label: 'Getsuga Expansivo: Getsuga encadeia 2 inimigos em sequência (72% dano)' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 8.0, label: 'Mugetsu: cada 3º ataque é o Mugetsu — o poder mais absoluto (8× dano!)' },
      10: { type: 'phantom_strike', trigger_at: 4, phantom_mult: 2.8, label: 'Colapso do Bankai: cada 4º ataque colapsa o Bankai por toda a área' }
    },
    upgrades: [
      { name: 'Getsuga Tensho', desc: 'Dano ×1.4 | Tipo: linha (corte de alcance total)', damage_mult: 1.4, type: 'linha', cost: 750 },
      { name: 'Tensão Máxima', desc: 'Aura de pressão ×1.8×', damage_mult: 1.2, cost: 1300 },
      { name: 'Bankai Completo', desc: 'Dano ×1.6 | Alcance ×1.25', damage_mult: 1.6, range_mult: 1.25, cost: 2200 },
      { name: 'Getsuga Final', desc: 'Dano ×1.4 | Pressão do Bankai → 1.75×', damage_mult: 1.4, passive_override: { mult: 1.75 }, cost: 3200 },
      { name: 'Além do Bankai', desc: 'Dano ×1.8 | Vel ×1.15 | Pressão → 2.0×', damage_mult: 1.8, speed_mult: 1.15, passive_override: { mult: 2.0 }, cost: 4500 }
    ]
  },

  // ── 6⭐ Evolução ────────────────────────────────────────────────────────────
  ichigo_vizard: {
    id: 'ichigo_vizard', name: 'Ichigo (Vizard)', rarity: 6, series: 'bleach',
    playable: true, xp_value: 15000, initials: 'IV',
    image: 'assets/towers/update1/Ichigo Vizard.png',
    evolution: {
      source: 'ichigo_bankai',
      requires: [
        { id: 'ichigo_bankai', quantity: 5 },
        { id: 'ichigo_base', quantity: 10 },
        { id: 'shinigami_generico_3', quantity: 10 },
        { id: 'rukia_kuchiki', quantity: 3 },
        { id: 'byakuya_kuchiki', quantity: 1 }
      ]
    },
    passive: [
      {
        type: 'cero_oscuras', every: 3, fear_duration: 4,
        label: 'Cero Oscuras: cada 3º ataque vira cone e aplica Medo (+25% dano recebido por 4s)'
      },
      {
        type: 'rei_dois_mundos', ally_bonus: 0.20, self_bonus: 0.10,
        label: 'Rei dos Dois Mundos: torres Bleach aliadas +20% dano; Ichigo +10% dano por aliado Bleach (máx 5)'
      },
      {
        type: 'mascara_eterna', max_stacks: 66, duration: 20.0, mode_dmg_mult: 2.0,
        label: 'Máscara Eterna: 66 ataques carregam a Máscara → 20s de Modo Vizard Total (2× dano, 2× vel, AOE total)'
      }
    ],
    base_stats: { damage: 980, range: 160, attack_speed: 0.36, type: 'single' },
    deploy_cost: 1400, max_level: 50,
    prestige_passives: {
      1: { type: 'kill_frenzy', duration: 5.0, speed_mult: 4.0, label: 'Descarga do Hollow: ao matar, máscara acelera 4× por 5s' },
      5: { type: 'crit_splash', crit_chance: 0.30, crit_mult: 3.0, splash_r: 95, splash_mult: 0.75, label: 'Cero Oscuras Total: críticos disparam Cero em área (75% dano)' },
      10: { type: 'spirit_surge', trigger_at: 4, mult: 10.0, label: 'Mugetsu Definitivo: cada 4º ataque é o poder mais absoluto (10×!)' }
    },
    upgrades: [
      { name: 'Máscara Estabilizada', desc: 'Dano ×1.4 | Vel ×1.2', damage_mult: 1.4, speed_mult: 1.2, cost: 850 },
      { name: 'Getsuga Jūjishō', desc: 'Tipo: cone | Dano ×1.3', damage_mult: 1.3, type: 'cone', cost: 1500 },
      { name: 'Hollow Pleno', desc: 'Dano ×1.6 | Alcance ×1.2', damage_mult: 1.6, range_mult: 1.2, cost: 2600 },
      { name: 'Pressão das Duas Almas', desc: 'Dano ×1.5 | Vel ×1.1 | Alcance ×1.1', damage_mult: 1.5, speed_mult: 1.1, range_mult: 1.1, cost: 4000 },
      { name: 'Forma Definitiva', desc: 'Dano ×2 | Alcance ×1.15 | Vel ×1.1', damage_mult: 2.0, speed_mult: 1.1, range_mult: 1.15, cost: 6000 }
    ]
  },

  // ── 3⭐ ──
  luffy_3: {
    id: 'luffy_3', name: 'Luffy (East Blue)', rarity: 3, series: 'onepiece', playable: true, xp_value: 1000, initials: 'LF',
    image: 'assets/towers/update0/Luffy.png',
    passive: {
      type: 'double_hit', chance: 1.0,
      label: 'Borracha Elástica: Luffy sempre ataca duas vezes no mesmo ciclo'
    },
    base_stats: { damage: 119, range: 90, attack_speed: 0.99, type: 'single_target' },
    deploy_cost: 120, max_level: 50,
    prestige_passives: {
      1: { type: 'kill_frenzy', duration: 2.0, speed_mult: 2.5, label: 'Gum-Gum Jet: ao matar, vel. 2.5× por 2s (Gear 2!)' },
      5: { type: 'battle_rage', per_enemy: 0.028, max_bonus: 0.55, label: 'Gear 2 Completo: +2.8% dano por inimigo vivo (máx 55%)' },
      10: { type: 'arc_chain', chain_r: 80, chain_mult: 0.55, chains: 2, label: 'Gum-Gum Gatling: ataque encadeia 2 inimigos em sequência' }
    },
    upgrades: [
      { name: 'Gomu Gomu no Pistol', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 150 },
      { name: 'Gomu Gomu no Gatling', desc: 'Vel ×1.3 | Dano ×1.2', speed_mult: 1.3, damage_mult: 1.2, cost: 300 },
      { name: 'Gear 2', desc: 'Vel ×1.25 | Dano ×1.25', speed_mult: 1.25, damage_mult: 1.25, cost: 480 },
      { name: 'Gear 3', desc: 'Dano ×1.6 | Alcance ×1.2', damage_mult: 1.6, range_mult: 1.2, cost: 800 },
      { name: 'Rei dos Piratas', desc: 'Dano ×1.5 | Vel ×1.15 | Double Hit sempre (100%)', damage_mult: 1.5, speed_mult: 1.15, passive_override: { chance: 1.0 }, cost: 1200 }
    ]
  },
  zoro_3: {
    id: 'zoro_3', name: 'Zoro (East Blue)', rarity: 3, series: 'onepiece', playable: true, xp_value: 1000, initials: 'ZR',
    image: 'assets/towers/update0/Zoro.png',
    passive: {
      type: 'critical', chance: 0.15, mult: 2.0,
      label: 'Espadachim Supremo: golpes de Zoro têm 15% de chance de corte perfeito (2.0× dano)'
    },
    base_stats: { damage: 158, range: 60, attack_speed: 0.74, type: 'cone' },
    deploy_cost: 140, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.22, crit_mult: 2.0, splash_r: 50, splash_mult: 0.40, label: 'Três Espadas: críticos explodem em corte triplo (40% dano em área)' },
      5: { type: 'spirit_surge', trigger_at: 5, mult: 3.8, label: 'Oni Giri: cada 5º ataque é um Oni Giri (3.8× dano)' },
      10: { type: 'arc_chain', chain_r: 70, chain_mult: 0.60, chains: 2, label: 'Tris Cortes: cada ataque encadeia 2 inimigos adicionais' }
    },
    upgrades: [
      { name: 'Oni Giri', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 200 },
      { name: 'Tatsumaki', desc: 'Alcance ×1.2 | Dano ×1.3', range_mult: 1.35, damage_mult: 1.3, cost: 400 },
      { name: 'Espírito Assassino', desc: 'Vel ×1.25 | Crítico → 20%', speed_mult: 1.25, passive_override: { chance: 0.20 }, cost: 580 },
      { name: 'Três Estilos Plenos', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 900 },
      { name: 'Alma de Espadas', desc: 'Dano ×1.7 | Vel ×1.15 | Crítico → 25%/2.3×', damage_mult: 1.7, speed_mult: 1.15, passive_override: { chance: 0.25, mult: 2.3 }, cost: 1300 }
    ]
  },
  nami_3: {
    id: 'nami_3', name: 'Nami', rarity: 3, series: 'onepiece', playable: true, xp_value: 1000, initials: 'NA',
    image: 'assets/towers/update1/Nami.png',
    passive: { type: 'tempo_acumulado', max_charges: 8, slow_pct: 0.40, slow_duration: 2.5, label: 'Tempestade Acumulada: a cada 8 ataques desencadeia tempestade global — desacelera TODOS os inimigos em tela em 40% por 2.5s' },
    base_stats: { damage: 79, range: 90, attack_speed: 0.62, type: 'cone' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 90, chain_mult: 0.45, chains: 1, label: 'Climatact Elétrico: relâmpago encadeia para 1 inimigo (45% dano)' },
      5: { type: 'status_on_hit_chance', chance: 0.35, status: 'freeze', duration: 2.0, label: 'Clima-Tact Tático: 35% de chance de congelar ao acertar' },
      10: { type: 'damage_pulse', interval: 4.5, dmg_mult: 0.45, label: 'Perfil Meteorológico: tempestade causa dano a cada 4.5s em área' }
    },
    upgrades: [
      { name: 'Thunderbolt Tempo', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 200 },
      { name: 'Tornado Tempo', desc: 'Vel ×1.25', speed_mult: 1.25, cost: 350 },
      { name: 'Navegação Perfeita', desc: 'Dano ×1.35 | Alcance ×1.2', damage_mult: 1.35, range_mult: 1.2, cost: 530 },
      { name: 'Tempestade Perfeita', desc: 'Vel ×1.2 | Tempestade a cada 7 ataques', speed_mult: 1.2, passive_override: { max_charges: 7 }, cost: 800 },
      { name: 'Rainha dos Mares', desc: 'Dano ×1.6 | Tempestade desacelera 56%', damage_mult: 1.6, passive_override: { slow_pct: 0.56 }, cost: 1200 }
    ]
  },
  usopp_3: {
    id: 'usopp_3', name: 'Usopp', rarity: 3, series: 'onepiece', playable: true, xp_value: 1000, initials: 'US',
    image: 'assets/towers/update1/Usopp.png',
    passive: { type: 'status_on_hit_chance', chance: 0.10, status: 'paralisia', duration: 0.5, label: 'Bala de Chumbo: 10% chance de Stun (0.5s)' },
    base_stats: { damage: 92, range: 200, attack_speed: 0.49, type: 'single_target' },
    deploy_cost: 160, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.20, crit_mult: 2.0, splash_r: 60, splash_mult: 0.38, label: 'Munição Explosiva: críticos explodem (38% dano em área)' },
      5: { type: 'spirit_surge', trigger_at: 5, mult: 4.2, label: 'Tiro Perfeito: cada 5º tiro é o golpe do Rei Sniper (4.2× dano)' },
      10: { type: 'phantom_strike', trigger_at: 7, phantom_mult: 1.5, label: 'Chuva de Estrelas: cada 7º ataque dispara salva em toda a área' }
    },
    upgrades: [
      { name: 'Estilingue Kabuto', desc: 'Dano ×1.4', damage_mult: 1.4, cost: 200 },
      { name: 'Firebird Star', desc: 'Dano ×1.5 | Alcance ×1.1', damage_mult: 1.5, range_mult: 1.25, cost: 400 },
      { name: 'Rei Atirador', desc: 'Vel ×1.2 | Dano ×1.3', speed_mult: 1.2, damage_mult: 1.3, cost: 600 },
      { name: 'Munição Verde', desc: 'Stun: 10%→28% chance | 0.5s→1.2s', passive_override: { chance: 0.28, duration: 1.2 }, cost: 900 },
      { name: 'Sogeking', desc: 'Dano ×1.7 | Alcance ×1.15 | Stun → 40%/1.8s', damage_mult: 1.7, range_mult: 1.15, passive_override: { chance: 0.40, duration: 1.8 }, cost: 1300 }
    ]
  },
  brook_3: {
    id: 'brook_3', name: 'Brook', rarity: 3, series: 'onepiece', playable: true, xp_value: 1000, initials: 'BR',
    image: 'assets/towers/update1/Brook.png',
    passive: { type: 'echo_strike', chance: 0.40, dmg_mult: 0.45, label: 'Yomi Yomi no Mi: energia da alma ressoa em cada ataque — 40% de chance de eco (45% dano extra)' },
    base_stats: { damage: 66, range: 120, attack_speed: 0.92, type: 'linha' },
    deploy_cost: 180, max_level: 50,
    prestige_passives: {
      1: { type: 'kill_streak', stack_bonus: 0.12, decay_time: 5, max_stacks: 5, label: 'Músico da Morte: cada kill aumenta o ritmo (+12% dano por stack, máx 5)' },
      5: { type: 'arc_chain', chain_r: 85, chain_mult: 0.50, chains: 1, label: 'Melodia da Alma: música encadeia para 1 inimigo próximo (50% dano)' },
      10: { type: 'phantom_strike', trigger_at: 6, phantom_mult: 1.6, label: 'Pulso da Morte: cada 6º ataque propaga energia espiritual em área' }
    },
    upgrades: [
      { name: 'Yahazu Giri', desc: 'Vel ×1.35', speed_mult: 1.35, cost: 220 },
      { name: 'Nemuri Uta', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 400 },
      { name: 'Soul King', desc: 'Vel ×1.25 | Eco → 55%', speed_mult: 1.25, passive_override: { chance: 0.55 }, cost: 620 },
      { name: 'Âncora da Alma', desc: 'Dano ×1.5 | Alcance ×1.15', damage_mult: 1.5, range_mult: 1.15, cost: 950 },
      { name: 'Milha da Alma', desc: 'Dano ×1.6 | Eco → 60%/0.6× | Vel ×1.15', damage_mult: 1.6, speed_mult: 1.15, passive_override: { chance: 0.60, dmg_mult: 0.60 }, cost: 1350 }
    ]
  },

  // ── 4⭐ ──
  sanji_4: {
    id: 'sanji_4', name: 'Sanji', rarity: 4, series: 'onepiece', playable: true, xp_value: 3000, initials: 'SJ',
    image: 'assets/towers/update1/Sanji.png',
    passive: { type: 'status_on_hit', status: 'burn', dps: 30, duration: 3, label: 'Diable Jambe: Causa Burn' },
    base_stats: { damage: 190, range: 65, attack_speed: 1.11, type: 'single_target' },
    deploy_cost: 250, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'burn', dps: 20, duration: 3, label: 'Diable Jambe: cada chute incendeia o alvo (20 DPS/3s)' },
      5: { type: 'kill_frenzy', duration: 3.5, speed_mult: 3.0, label: 'Ifrit Jambe: ao matar, vel. de ataque 3× por 3.5s' },
      10: { type: 'spirit_surge', trigger_at: 4, mult: 5.0, label: 'Hell Memories: cada 4º ataque é o Hell Memories (5× dano!)' }
    },
    upgrades: [
      { name: 'Flambage Shot', desc: 'Dano ×1.4', damage_mult: 1.4, cost: 300 },
      { name: 'Hell Memories', desc: 'Vel ×1.25 | Burn → 50 DPS', speed_mult: 1.25, passive_override: { dps: 50 }, cost: 600 },
      { name: 'Sky Walk', desc: 'Alcance ×1.25 | Vel ×1.1', range_mult: 1.25, speed_mult: 1.1, cost: 850 },
      { name: 'Ifrit Jambe', desc: 'Dano ×1.5 | Burn → 80 DPS', damage_mult: 1.5, passive_override: { dps: 80 }, cost: 1300 },
      { name: 'Sangre de la Flamme', desc: 'Dano ×1.8 | Vel ×1.15 | Burn → 110 DPS / 5s', damage_mult: 1.8, speed_mult: 1.15, passive_override: { dps: 110, duration: 5 }, cost: 1900 }
    ]
  },
  robin_4: {
    id: 'robin_4', name: 'Robin', rarity: 4, series: 'onepiece', playable: true, xp_value: 3000, initials: 'RB',
    image: 'assets/towers/update1/Robin.png',
    passive: { type: 'status_on_hit_chance', chance: 0.20, status: 'paralisia', duration: 1.0, label: 'Mil Fleurs: 20% chance de Stun (1s)' },
    base_stats: { damage: 185, range: 100, attack_speed: 0.55, type: 'single_target' },
    deploy_cost: 300, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 85, chain_mult: 0.62, chains: 2, label: 'Fleurs de Grapple: flores brotam em 2 inimigos próximos (62% dano)' },
      5: { type: 'status_on_hit_chance', chance: 0.35, status: 'paralisia', duration: 2.0, label: 'Clutch: 35% de paralisar completamente o alvo por 2s' },
      10: { type: 'phantom_strike', trigger_at: 5, phantom_mult: 2.0, label: 'Mil Flores: cada 5º ataque faz mil flores brotarem em toda a área' }
    },
    upgrades: [
      { name: 'Clutch', desc: 'Dano ×1.5 | Tipo → Cone', damage_mult: 1.5, type: 'cone', cost: 350 },
      { name: 'Gigantesco Mano', desc: 'Alcance ×1.2 | Dano ×1.4', range_mult: 1.35, damage_mult: 1.4, cost: 700 },
      { name: 'Cien Fleur', desc: 'Vel ×1.2 | Paralisia → 1.5s', speed_mult: 1.2, passive_override: { duration: 1.5 }, cost: 950 },
      { name: 'Mil Fleurs', desc: 'Dano ×1.5 | Stun: 20%→35%', damage_mult: 1.5, passive_override: { chance: 0.35 }, cost: 1400 },
      { name: 'Gigantesco Mano Completo', desc: 'Dano ×1.8 | Tipo → AOE | Paralisia → 2.5s', damage_mult: 1.8, type: 'aoe', passive_override: { duration: 2.5 }, cost: 2000 }
    ]
  },
  ace_4: {
    id: 'ace_4', name: 'Ace', rarity: 4, series: 'onepiece', playable: true, xp_value: 3000, initials: 'AC',
    image: 'assets/towers/update1/Ace.png',
    passive: { type: 'status_on_hit', status: 'burn', dps: 60, duration: 4, label: 'Mera Mera: Dano em chamas massivo' },
    base_stats: { damage: 290, range: 110, attack_speed: 0.62, type: 'cone' },
    deploy_cost: 320, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'burn', dps: 25, duration: 4, label: 'Chama Residual: cada acerto queima profundamente (25 DPS/4s)' },
      5: { type: 'spirit_surge', trigger_at: 4, mult: 4.5, label: 'Hiken: cada 4º ataque é o Fire Fist Ace (4.5× dano!)' },
      10: { type: 'crit_splash', crit_chance: 0.30, crit_mult: 2.5, splash_r: 80, splash_mult: 0.65, label: 'Entidade de Fogo: críticos provocam explosão de chamas (65% dano em área)' }
    },
    upgrades: [
      { name: 'Hiken', desc: 'Dano ×1.5', damage_mult: 1.5, cost: 400 },
      { name: 'Entei', desc: 'Dano ×1.6 | Burn → 100 DPS', damage_mult: 1.6, passive_override: { dps: 100 }, cost: 800 },
      { name: 'Chamas Espalhadas', desc: 'Dano ×1.3 | Burn → 120 DPS', damage_mult: 1.3, passive_override: { dps: 120 }, cost: 1100 },
      { name: 'Punho de Fogo', desc: 'Vel ×1.2 | Dano ×1.4', speed_mult: 1.2, damage_mult: 1.4, cost: 1600 },
      { name: 'Entidade do Inferno', desc: 'Dano ×1.8 | Burn → 150 DPS / 5s', damage_mult: 1.8, passive_override: { dps: 150, duration: 5 }, cost: 2200 }
    ]
  },

  // ── 5⭐ ──
  zoro_5: {
    id: 'zoro_5', name: 'Zoro (Ashura)', rarity: 5, series: 'onepiece', playable: true, xp_value: 10000, initials: 'Z5',
    image: 'assets/towers/update1/Zoro Ashura.png',
    evolution: {
      source: 'zoro_3',
      requires: [
        { id: 'zoro_3', quantity: 5 },
        { id: 'luffy_3', quantity: 2 },
        { id: 'pirata_generico_1', quantity: 3 },
        { id: 'pirata_generico_2', quantity: 3 },
        { id: 'pirata_generico_3', quantity: 3 }
      ]
    },
    passive: { type: 'zoro_burst', label: 'Foco Ashura: 3x Dano Base, ataca 3 vezes e descansa 3' },
    base_stats: { damage: 594, range: 130, attack_speed: 0.74, type: 'linha' },
    deploy_cost: 600, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.30, crit_mult: 2.5, splash_r: 80, splash_mult: 0.65, label: 'Espírito do Rei das Espadas: críticos causam explosão de corte (65% dano)' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 6.5, label: 'Ashura — Ichibugin: cada 3º ataque é o golpe titânico Ichibugin (6.5×!)' },
      10: { type: 'phantom_strike', trigger_at: 4, phantom_mult: 3.0, label: 'Rei do Inferno: cada 4º ataque o Rei do Inferno varre toda a área' }
    },
    upgrades: [
      { name: 'Kiki Kyutoryu', desc: 'Dano ×1.4', damage_mult: 1.4, cost: 700 },
      { name: 'Ichidai Sanzen', desc: 'Alcance ×1.15 | Dano ×1.5', range_mult: 1.30, damage_mult: 1.5, cost: 1500 },
      { name: 'Ashura Plena', desc: 'Dano ×1.4 | Vel ×1.15', damage_mult: 1.4, speed_mult: 1.15, cost: 2200 },
      { name: 'Rei do Inferno Absoluto', desc: 'Dano ×1.7 | Alcance ×1.1', damage_mult: 1.7, range_mult: 1.1, cost: 3200 }
    ]
  },
  luffy_5: {
    id: 'luffy_5', name: 'Luffy (Gear 4)', rarity: 5, series: 'onepiece', playable: true, xp_value: 10000, initials: 'L4',
    image: 'assets/towers/update1/Luffy G4.png',
    passive: { type: 'silence_buffs', chance: 0.3, label: 'Haki: 30% chance no 1º hit de anular o buff inimigo' },
    base_stats: { damage: 500, range: 100, attack_speed: 0.86, type: 'cone' },
    deploy_cost: 650, max_level: 50,
    prestige_passives: {
      1: { type: 'battle_rage', per_enemy: 0.050, max_bonus: 1.0, label: 'Haki do Rei: Haki do Conquistador escala com inimigos (+5%/inimigo, máx 100%!)' },
      5: { type: 'arc_chain', chain_r: 100, chain_mult: 0.75, chains: 2, label: 'Kong Gatling: soco do Gear 4 encadeia 2 inimigos em sequência (75% dano)' },
      10: { type: 'spirit_surge', trigger_at: 3, mult: 7.0, label: 'Gear 5: cada 3º ataque é o Gear 5 distorcendo a realidade (7× dano!)' }
    },
    upgrades: [
      { name: 'Kong Gun', desc: 'Dano ×1.4', damage_mult: 1.4, cost: 800 },
      { name: 'King Kong Gun', desc: 'Dano ×1.6 | Alcance ×1.1', damage_mult: 1.6, range_mult: 1.25, cost: 1600 },
      { name: 'Gear 4 Pleno', desc: 'Dano ×1.3 | Vel ×1.15', damage_mult: 1.3, speed_mult: 1.15, cost: 2300 },
      { name: 'Gear 5', desc: 'Dano ×1.7 | Vel ×1.1 | Haki: 50% chance anular buff', damage_mult: 1.7, speed_mult: 1.1, passive_override: { chance: 0.50 }, cost: 3200 }
    ]
  },
  barbabranca_5: {
    id: 'barbabranca_5', name: 'Barba Branca', rarity: 5, series: 'onepiece', playable: true, xp_value: 10000, initials: 'BB',
    image: 'assets/towers/update1/Barba Branca.png',
    passive: { type: 'tsunami', interval: 15, hp: 5000, label: 'Tsunami: Invoca onda reversa na base a cada 15s (HP 5000)' },
    base_stats: { damage: 554, range: 150, attack_speed: 0.49, type: 'linha' },
    deploy_cost: 700, max_level: 50,
    prestige_passives: {
      1: { type: 'crit_splash', crit_chance: 0.28, crit_mult: 2.5, splash_r: 100, splash_mult: 0.65, label: 'Tremor de Terra: críticos provocam terremoto maciço (65% dano em área)' },
      5: { type: 'spirit_surge', trigger_at: 3, mult: 6.0, label: 'Punho de Terremoto: cada 3º ataque é o Punho de Terremoto (6× dano)' },
      10: { type: 'phantom_strike', trigger_at: 4, phantom_mult: 2.8, label: 'Fim do Mundo: cada 4º ataque o terremoto abala toda a área' }
    },
    upgrades: [
      { name: 'Gura Gura', desc: 'Dano ×1.4 | Tsunami HP 8000', damage_mult: 1.4, passive_override: { hp: 8000 }, cost: 900 },
      { name: 'Terremoto', desc: 'Dano ×1.5 | Tsunami HP 15000', damage_mult: 1.5, passive_override: { hp: 15000 }, cost: 1800 },
      { name: 'Tsunami Gigante', desc: 'Dano ×1.3 | Tsunami HP 22000', damage_mult: 1.3, passive_override: { hp: 22000 }, cost: 2600 },
      { name: 'Lendário dos Mares', desc: 'Dano ×1.7 | Vel ×1.15 | Tsunami HP 32000', damage_mult: 1.7, speed_mult: 1.15, passive_override: { hp: 32000 }, cost: 3800 }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // UNIDADES DE EVENTO EXCLUSIVAS
  // ──────────────────────────────────────────────────────────────────────────
  orochimaru_base: {
    id: 'orochimaru_base', name: 'Orochimaru', rarity: 4, series: 'naruto', playable: true, xp_value: 4000, initials: 'OR',
    image: 'assets/towers/events/Orochimaru.png',
    passive: [
      { type: 'status_on_hit', status: 'sangramento', dps: 20, duration: 3, label: 'Marca da Maldição: Aplica DoT venenoso' },
      { type: 'edo_tensei_economy', label: 'Imortalidade: Vende por 100% do ouro investido' }
    ],
    base_stats: { damage: 200, range: 120, attack_speed: 0.62, type: 'cone' },
    deploy_cost: 450, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 85, chain_mult: 0.58, chains: 2, label: 'Serpente Multiplicada: cobras encadeiam 2 inimigos em sequência (58% dano)' },
      5: { type: 'status_on_hit', status: 'sangramento', dps: 30, duration: 5, label: 'Veneno Hebisuji: cada acerto injeta veneno tóxico (30 DPS/5s)' },
      10: { type: 'spirit_surge', trigger_at: 4, mult: 5.0, label: 'Imortalidade: cada 4º ataque é o golpe da serpente imortal (5× dano)' }
    },
    upgrades: [
      { name: 'Serpente Branca', desc: 'Dano ×1.3 | Veneno 35 DPS', damage_mult: 1.3, passive_override: { dps: 35, duration: 3 }, cost: 500 },
      { name: 'Kusanagi', desc: 'Dano ×1.5 | Veneno 60 DPS | Tipo → cone maior', damage_mult: 1.5, passive_override: { dps: 60, duration: 4 }, cost: 950 }
    ]
  },
  pain_base: {
    id: 'pain_base', name: 'Pain (Seis Caminhos)', rarity: 5, series: 'naruto', playable: true, xp_value: 10000, initials: 'PN',
    image: 'assets/towers/events/Pain.png',
    passive: [
      { type: 'sharingan', label: 'Rinnegan: Ignora qualquer imunidade do inimigo (Bypass)' },
      { type: 'bansho_tenin', attacks_required: 4, push_dist: 35, label: 'Bansho Ten\'in: A cada 4 ataques, puxa os inimigos para trás' }
    ],
    base_stats: { damage: 350, range: 150, attack_speed: 0.62, type: 'cone' },
    deploy_cost: 800, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 110, chain_mult: 0.70, chains: 2, label: 'Gravitação: força gravitacional do Rinnegan encadeia 2 inimigos (70% dano)' },
      5: { type: 'battle_rage', per_enemy: 0.050, max_bonus: 1.0, label: 'Caminho do Humano: absorve a força de cada alma — +5%/inimigo (máx 100%)' },
      10: { type: 'spirit_surge', trigger_at: 3, mult: 7.5, label: 'Shinra Tensei Pleno: cada 3º ataque é o Shinra Tensei absoluto (7.5×!)' }
    },
    upgrades: [
      { name: 'Puxão Sombrio', desc: 'Dano ×1.4 | Puxa mais forte (50px)', damage_mult: 1.4, passive_override: { attacks_required: 4, push_dist: 50 }, cost: 1100 },
      { name: 'Devastação', desc: 'Dano ×1.8 | Alcance ×1.2', damage_mult: 1.8, range_mult: 1.2, cost: 2500 }
    ]
  },

  // ── EVENTO 2 — Operação: Ressurreição ─────────────────────────────────────
  tsunade: {
    id: 'tsunade', name: 'Tsunade', rarity: 4, series: 'naruto', playable: true, xp_value: 6000, initials: 'TN',
    image: 'assets/towers/events/Tsunade.png',
    event_exclusive: true,
    passive: [
      { type: 'cem_sobrancelhas', drain_interval_mult: 1.5, label: 'Cem Sobrancelhas: inimigos com drain drenam a base 50% mais devagar enquanto Tsunade está em campo' },
      { type: 'byakugou', trigger_at: 40, cooldown: 40, label: 'Byakugou: após 40s de wave ativa, restaura 1 vida perdida nessa wave (máx 1 por ativação)' }
    ],
    base_stats: { damage: 480, range: 75, attack_speed: 0.34, type: 'single_target' },
    deploy_cost: 600, max_level: 50,
    prestige_passives: {
      1: { type: 'field_commander', bonus: 0.10, label: 'Vontade de Ferro: presença de Tsunade inspira o time, +10% de dano a todas as torres' },
      5: { type: 'byakugou_shield', stun_immune_duration: 2, label: 'Cura da Hokage: ativação do Byakugou também concede 2s de imunidade a stun para todas as torres' },
      10: { type: 'last_stand', restore_lives: 3, label: 'Renascimento: uma vez por sessão, quando lives chegam a 0, Tsunade restaura 3 vidas' }
    },
    upgrades: [
      { name: 'Raio Terrestre', desc: 'Raio AOE ×1.35 | Dano ×1.3', damage_mult: 1.3, range_mult: 1.0, passive_override: { aoe_radius_mult: 1.35 }, cost: 900 },
      { name: 'Byakugou Avançado', desc: 'Byakugou CD -8s | Restaura 2 vidas', passive_override: { cooldown: 32, restore: 2 }, cost: 1500 },
      { name: 'Punho da Hokage', desc: 'Dano ×1.6 | Aplica sangramento 90 DPS / 5s', damage_mult: 1.6, statusEffect: { type: 'sangramento', dps: 90, duration: 5 }, cost: 2200 },
      { name: 'Sannin Supremo', desc: 'Dano ×2.0 | Vel ×1.15', damage_mult: 2.0, speed_mult: 1.15, cost: 3500 }
    ]
  },

  killer_bee: {
    id: 'killer_bee', name: 'Killer Bee', rarity: 5, series: 'naruto', playable: true, xp_value: 10000, initials: 'KB',
    image: 'assets/towers/events/Killer Bee.png',
    event_exclusive: true,
    passive: [
      {
        type: 'gyuki_ink', min_hits: 3, bonus: 0.55, duration: 5,
        label: 'Tinta do Gyuki: quando um scatter acerta 3+ inimigos ao mesmo tempo, todos ficam Marcados por 5s — recebem +55% de dano de TODAS as fontes'
      },
      {
        type: 'modo_bijuu_gyuki', cooldown: 15, duration: 4, damage_mult: 4.0,
        label: 'Modo Bijuu (Gyuki): a cada 15s transforma por 4s — paralisa todos por 1.5s, marca TODOS com Tinta do Gyuki e causa 4× dano base'
      }
    ],
    base_stats: { damage: 320, range: 145, attack_speed: 0.67, type: 'scatter' },
    deploy_cost: 800, max_level: 50,
    prestige_passives: {
      1: { type: 'mark_on_nth_hit', n: 5, bonus: 0.30, duration: 3, label: 'Mestre do Enka: a cada 5ª espada que acerta, o inimigo fica Marcado (+30% dano por 3s)' },
      5: { type: 'bijuu_boost', duration_bonus: 2, damage_bonus: 0.5, label: 'Bijuu Completo: duração do Modo Bijuu +2s e dano +50%' },
      10: { type: 'bijuu_fast', cooldown_override: 10, label: 'Oito Caudas Liberadas: Modo Bijuu a cada 10s com Tinta global ao transformar' }
    },
    upgrades: [
      { name: 'Sete Espadas', desc: '+2 projéteis (→ 9) | Dano ×1.2', damage_mult: 1.2, passive_override: { extra_projectiles: 2 }, cost: 1000 },
      { name: 'Tinta Corrosiva', desc: 'Tinta ativa com 2+ hits | Bônus → +80% dano | Dura 6s', passive_override: { min_hits: 2, bonus: 0.80, ink_duration: 6 }, cost: 1600 },
      { name: 'Pierce Total', desc: 'Cada espada perfura +1 inimigo extra', passive_override: { pierce: 1 }, cost: 2300 },
      { name: 'Oito Estilos Plenos', desc: 'Dano ×1.8 | Bijuu CD → 12s', damage_mult: 1.8, passive_override: { cooldown: 12 }, cost: 3000 },
      { name: 'Mestre Shinobi', desc: 'Vel ×1.2 | Alcance ×1.15 | Tinta dura 8s', speed_mult: 1.2, range_mult: 1.15, passive_override: { ink_duration: 8 }, cost: 4000 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  MARVEL — Mundo 4  |  3⭐  Sem AOE de base (web_zone é habilidade, não tipo)
  // ══════════════════════════════════════════════════════════════════════════

  // Spider-Man — Teias no solo que paralisam inimigos | 6 upgrades
  // Single → Cone | web_zone: acerto deixa teia (slow 60% / 2.5s em área 55px)
  spider_man: {
    id: 'spider_man', name: 'Homem-Aranha', rarity: 3, series: 'marvel', playable: true, xp_value: 1000, initials: 'SM',
    image: 'assets/towers/update2/Homem-Aranha.png',
    passive: {
      type: 'web_zone', web_radius: 55, duration: 2.5,
      label: 'Teia de Aranha: cada acerto deixa teia no solo (slow 60% / 2.5s em raio de 55px)'
    },
    base_stats: { damage: 105, range: 100, attack_speed: 0.92, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'double_hit', chance: 0.30, label: 'Sentido Aranha: 30% de chance de atacar uma segunda vez no mesmo ciclo' },
      5: { type: 'slow_aura', slow_pct: 0.35, label: 'Campo de Teia: aura passiva reduz a velocidade de inimigos próximos em 35%' },
      10: { type: 'spirit_surge', trigger_at: 6, mult: 5.0, label: 'Teia Máxima: a cada 6 ataques, dispara uma teia gigante (5× dano + área total)' }
    },
    upgrades: [
      { name: 'Teias Duplas', desc: 'Vel ×1.2 | Teia dura 3.5s', speed_mult: 1.2, passive_override: { duration: 3.5 }, cost: 170 },
      { name: 'Tiro em Arco', desc: 'Tipo → Cone | Dano ×1.3', type: 'cone', damage_mult: 1.3, cost: 340 },
      { name: 'Sentido Aranha', desc: 'Alcance ×1.25 | Vel ×1.15', range_mult: 1.25, speed_mult: 1.15, cost: 480 },
      { name: 'Teia Elétrica', desc: 'Raio da teia → 75px | Teia dura 4.5s', passive_override: { web_radius: 75, duration: 4.5 }, cost: 650 },
      { name: 'Instinto de Perigo', desc: 'Dano ×1.6 | Vel ×1.1', damage_mult: 1.6, speed_mult: 1.1, cost: 900 },
      { name: 'No Way Home', desc: 'Dano ×1.8 | Raio da teia → 90px', damage_mult: 1.8, passive_override: { web_radius: 90, duration: 5.0 }, cost: 1300 }
    ]
  },

  // Black Widow — Marcas de mira que amplificam o dano global | 6 upgrades
  // Single → Linha | cross_mark: kills marcam inimigos próximos (+25% dano de todos)
  black_widow: {
    id: 'black_widow', name: 'Viúva Negra', rarity: 3, series: 'marvel', playable: true, xp_value: 1000, initials: 'BW',
    image: 'assets/towers/update2/Viuva Negra.png',
    passive: {
      type: 'cross_mark', bonus: 0.25, duration: 6,
      label: 'Mira de Mestre: kills marcam inimigos próximos por 6s (todos recebem +25% dano)'
    },
    base_stats: { damage: 90, range: 118, attack_speed: 1.04, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'paralisia', duration: 1.2, label: 'Pistola de Viúva: cada acerto aplica paralisia de 1.2s' },
      5: { type: 'kill_streak', stack_bonus: 0.12, max_stacks: 8, decay_time: 5, label: 'Modo Assassina: kills acumulam +12% dano por stack (máx 8, decai em 5s)' },
      10: { type: 'critical', chance: 0.38, mult: 3.5, label: 'Precisão Letal: 38% de chance de acerto crítico (3.5× dano)' }
    },
    upgrades: [
      { name: 'Pistola Sonda', desc: 'Vel ×1.3 | Dano ×1.1', speed_mult: 1.3, damage_mult: 1.1, cost: 170 },
      { name: 'Treinamento Russo', desc: 'Tipo → Linha | Dano ×1.2', type: 'linha', damage_mult: 1.2, cost: 340 },
      { name: 'Marca Amplificada', desc: 'Marca → +35% dano | dura 8s', passive_override: { bonus: 0.35, duration: 8 }, cost: 470 },
      { name: 'Agente Triplo', desc: 'Alcance ×1.2 | Vel ×1.1', range_mult: 1.2, speed_mult: 1.1, cost: 640 },
      { name: 'Marca de Elite', desc: 'Marca → +45% dano | dura 10s', passive_override: { bonus: 0.45, duration: 10 }, cost: 850 },
      { name: 'Viúva Negra Letal', desc: 'Dano ×2.0 | Marca → +55% dano', damage_mult: 2.0, passive_override: { bonus: 0.55, duration: 10 }, cost: 1250 }
    ]
  },

  // Hawkeye — Ciclo de 4 tipos de flecha (Normal ×1.8, AOE, Gelo, Pierce) | 6 upgrades
  // Single → Pierce | arrow_rotation: alterna entre 4 tipos de flecha a cada ataque
  hawkeye: {
    id: 'hawkeye', name: 'Gavião Arqueiro', rarity: 3, series: 'marvel', playable: true, xp_value: 1000, initials: 'HW',
    image: 'assets/towers/update2/Gavião Arqueiro.png',
    passive: {
      type: 'arrow_rotation', freeze_dur: 3,
      label: 'Aljava Tática: cicla entre flechas Normal (×1.8), Explosiva (AOE), Gelo (3s), Perfurante (×3)'
    },
    base_stats: { damage: 85, range: 132, attack_speed: 0.53, type: 'single_target' },
    deploy_cost: 150, max_level: 50,
    prestige_passives: {
      1: { type: 'boss_slayer', bonus: 0.30, label: 'Olho de Falcão: +30% de dano contra minibosses e bosses' },
      5: { type: 'bankai_pressure', aoe_r: 75, aoe_mult: 0.70, label: 'Flecha-Bomba: kills causam explosão (70% dano em raio de 75px)' },
      10: { type: 'quincy_pierce', count: 5, label: 'Trick Arrows: flecha perfurante acerta até 5 inimigos simultâneos' }
    },
    upgrades: [
      { name: 'Aljava Completa', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 170 },
      { name: 'Flecha Perfurante', desc: 'Tipo → Pierce | Dano ×1.3', type: 'pierce', damage_mult: 1.3, cost: 340 },
      { name: 'Arsenal Avançado', desc: 'Gelo → 4s | Explosiva dano ×1.1', passive_override: { freeze_dur: 4 }, cost: 460 },
      { name: 'Olho de Falcão', desc: 'Alcance ×1.3 | Vel ×1.15', range_mult: 1.3, speed_mult: 1.15, cost: 620 },
      { name: 'Flechas de Vibranium', desc: 'Dano ×1.6 | Normal → ×2.2', damage_mult: 1.6, cost: 880 },
      { name: 'Mestre dos Arcos', desc: 'Dano ×1.5 | Gelo → 5.5s | AOE +', damage_mult: 1.5, passive_override: { freeze_dur: 5.5 }, cost: 1300 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  MARVEL — 4⭐  |  Ataques mais versáteis com mecânicas complexas
  // ══════════════════════════════════════════════════════════════════════════

  // Black Panther — Ataques de vibranium que ricocheteiam | 6 upgrades
  // Single | ricochet_aura: após acertar, bounces para N inimigos próximos (55%)
  black_panther: {
    id: 'black_panther', name: 'Pantera Negra', rarity: 4, series: 'marvel', playable: true, xp_value: 2500, initials: 'BP',
    image: 'assets/towers/update2/Pantera Negra.png',
    passive: {
      type: 'ricochet_aura', bounces: 2, radius: 80, mult: 0.55,
      label: 'Vibranium Cinético: cada acerto ricocheteia para 2 inimigos próximos (55% dano, raio 80px)'
    },
    base_stats: { damage: 195, range: 118, attack_speed: 0.8, type: 'single_target' },
    deploy_cost: 350, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'sangramento', dps: 30, duration: 4, label: 'Garras de Vibranium: cada acerto causa sangramento (30 DPS / 4s)' },
      5: { type: 'bankai_pressure', aoe_r: 80, aoe_mult: 0.80, label: 'Impacto Cinético: kills liberam energia vibranium em área (80% dano / raio 80px)' },
      10: { type: 'battle_rage', per_enemy: 0.06, max_bonus: 0.80, label: 'Rei de Wakanda: presença de inimigos amplifica dano (+6%/inimigo, máx 80%)' }
    },
    upgrades: [
      { name: 'Garras de Vibranium', desc: 'Dano ×1.3 | Ricochet → 65% dano', damage_mult: 1.3, passive_override: { mult: 0.65 }, cost: 400 },
      { name: 'Traje T\'Challa', desc: 'Alcance ×1.2 | Vel ×1.2', range_mult: 1.2, speed_mult: 1.2, cost: 600 },
      { name: 'Absorção Cinética', desc: 'Ricochet → 3 inimigos | 70% dano', passive_override: { bounces: 3, mult: 0.70 }, cost: 800 },
      { name: 'Rei de Wakanda', desc: 'Dano ×1.4 | Vel ×1.15', damage_mult: 1.4, speed_mult: 1.15, cost: 1100 },
      { name: 'Vibranium Puro', desc: 'Ricochet → 4 inimigos | 80% dano', passive_override: { bounces: 4, mult: 0.80 }, cost: 1500 },
      { name: 'Pantera Definitiva', desc: 'Dano ×2.0 | Raio ricochet → 110px', damage_mult: 2.0, passive_override: { bounces: 4, radius: 110, mult: 0.85 }, cost: 2200 }
    ]
  },

  // Thor — Raios que encadeiam entre inimigos | 6 upgrades
  // Single → AOE | chain_lightning: após acertar, encadeia raio para N inimigos mais próximos
  thor: {
    id: 'thor', name: 'Thor', rarity: 4, series: 'marvel', playable: true, xp_value: 2500, initials: 'TH',
    image: 'assets/towers/update2/Thor.png',
    passive: {
      type: 'chain_lightning', chains: 3, radius: 90, mult: 0.40,
      label: 'Relâmpago de Asgard: cada acerto encadeia raio para 3 inimigos próximos (40% dano, raio 90px)'
    },
    base_stats: { damage: 215, range: 128, attack_speed: 0.71, type: 'single_target' },
    deploy_cost: 350, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'paralisia', duration: 1.5, label: 'Mjolnir Atordoante: cada acerto aplica paralisia de 1.5s' },
      5: { type: 'spirit_surge', trigger_at: 4, mult: 5.0, label: 'Stormbreaker: a cada 4 ataques, dispara o golpe completo (5× dano)' },
      10: { type: 'damage_aura', range: 140, aura_mult: 0.30, label: 'Aura de Trovão: presença de Thor concede +30% dano a todas as torres aliadas' }
    },
    upgrades: [
      { name: 'Mjolnir', desc: 'Dano ×1.4 | Raio → 50% dano', damage_mult: 1.4, passive_override: { mult: 0.50 }, cost: 400 },
      { name: 'Deus do Trovão', desc: 'Vel ×1.2 | Dano ×1.2', speed_mult: 1.2, damage_mult: 1.2, cost: 600 },
      { name: 'Tempestade de Asgard', desc: 'Cadeia → 4 inimigos | Raio 100px', passive_override: { chains: 4, radius: 100 }, cost: 820 },
      { name: 'Stormbreaker', desc: 'Vel ×1.15 | Dano ×1.4', speed_mult: 1.15, damage_mult: 1.4, cost: 1100 },
      { name: 'Raio Divino', desc: 'Cadeia → 5 inimigos | 60% dano', passive_override: { chains: 5, radius: 110, mult: 0.60 }, cost: 1500 },
      { name: 'Odinson', desc: 'Dano ×1.9 | Cadeia paralisa 1.5s', damage_mult: 1.9, passive_override: { chains: 5, radius: 120, mult: 0.65 }, cost: 2200 }
    ]
  },

  // Hulk — Fúria acumulada por presença de inimigos | 6 upgrades → evolui
  // AOE | rage_stack: +5% dano por inimigo no alcance (máx 50%), persiste 3s
  hulk_base: {
    id: 'hulk_base', name: 'Hulk', rarity: 4, series: 'marvel', playable: true, xp_value: 2500, initials: 'HK',
    image: 'assets/towers/update2/Hulk.png',
    passive: {
      type: 'rage_stack', per_enemy: 0.05, max_bonus: 0.50, fade_time: 3,
      label: 'Fúria Implacável: +5% dano por inimigo no alcance (máx 50%); bônus persiste 3s'
    },
    base_stats: { damage: 180, range: 95, attack_speed: 0.49, type: 'single_target' },
    deploy_cost: 350, max_level: 50,
    prestige_passives: {
      1: { type: 'berserker', per_enemy: 0.05, max_bonus: 0.50, label: 'Modo Rage: +5% de vel de ataque por inimigo próximo (máx 50%)' },
      5: { type: 'bankai_pressure', aoe_r: 90, aoe_mult: 0.90, label: 'Smash Sísmico: kills causam impacto devastador em área (90% dano / raio 90px)' },
      10: { type: 'three_swords', trigger_at: 3, mult: 4.5, label: 'HULK SMASH: a cada 3 ataques, o golpe é LEGENDÁRIO (4.5× dano)' }
    },
    upgrades: [
      { name: 'Punho do Hulk', desc: '+6% / inimigo (máx 55%)', passive_override: { per_enemy: 0.06, max_bonus: 0.55 }, cost: 400 },
      { name: 'Fúria Verde', desc: 'Vel ×1.3 | Alcance ×1.1', speed_mult: 1.3, range_mult: 1.1, cost: 600 },
      { name: 'Hulk Definitivo', desc: 'Tipo → Cone | Dano ×1.4 | +7% / inimigo (máx 65%)', type: 'cone', damage_mult: 1.4, passive_override: { per_enemy: 0.07, max_bonus: 0.65 }, cost: 820 },
      { name: 'Rage Mode', desc: 'Bônus persiste 4s | Dano ×1.2', damage_mult: 1.2, passive_override: { per_enemy: 0.07, max_bonus: 0.70, fade_time: 4 }, cost: 1100 },
      { name: 'Punho Sísmico', desc: 'Alcance ×1.15 | Dano ×1.4', range_mult: 1.15, damage_mult: 1.4, cost: 1500 },
      { name: 'HULK SMASH!!!', desc: 'Dano ×1.8 | +8% / inimigo (máx 80%)', damage_mult: 1.8, passive_override: { per_enemy: 0.08, max_bonus: 0.80, fade_time: 5 }, cost: 2200 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  MARVEL — 5⭐  |  Drop exclusivo (Fase 6) + evolução do Hulk
  // ══════════════════════════════════════════════════════════════════════════

  // Iron Man Mark 50 — Unibeam periódico de altíssimo dano | 6 upgrades
  // Linha | unibeam: a cada 8 ataques, dispara Unibeam (8× dano em linha)
  iron_man_mark50: {
    id: 'iron_man_mark50', name: 'Iron Man Mark 50', rarity: 5, series: 'marvel', playable: true, xp_value: 10000, initials: 'IM',
    image: 'assets/towers/update2/Iron Man Mark 50.png',
    passive: {
      type: 'unibeam', attacks_required: 8, mult: 8,
      label: 'Unibeam: a cada 8 ataques, dispara o Unibeam central (8× dano em linha, acerta todos)'
    },
    base_stats: { damage: 340, range: 152, attack_speed: 0.66, type: 'linha' },
    deploy_cost: 800, max_level: 50,
    prestige_passives: {
      1: { type: 'arc_chain', chain_r: 90, chain_mult: 0.50, chains: 2, label: 'Repulsor Duplo: disparos encadeiam para 2 inimigos próximos (50% dano)' },
      5: { type: 'critical', chance: 0.25, mult: 3.0, label: 'Sistema de Mira JARVIS: 25% de chance de disparo crítico (3× dano)' },
      10: { type: 'spirit_surge', trigger_at: 5, mult: 10.0, label: 'Modo Extremis: a cada 5 ataques, ativa modo pleno (10× dano total)' }
    },
    upgrades: [
      { name: 'Repulsor Mk.45', desc: 'Dano ×1.3 | Vel ×1.2', damage_mult: 1.3, speed_mult: 1.2, cost: 900 },
      { name: 'Modo Assalto', desc: 'Alcance ×1.15 | Unibeam → 9× dano', range_mult: 1.15, passive_override: { mult: 9 }, cost: 1300 },
      { name: 'JARVIS Online', desc: 'Vel ×1.15 | Unibeam a cada 7 ataques', speed_mult: 1.15, passive_override: { attacks_required: 7, mult: 9 }, cost: 1700 },
      { name: 'Nanites Mark 50', desc: 'Dano ×1.4 | Alcance ×1.15', damage_mult: 1.4, range_mult: 1.15, cost: 2200 },
      { name: 'Modo Extremis', desc: 'Unibeam → 10× | Unibeam a cada 6 ataques', passive_override: { attacks_required: 6, mult: 10 }, cost: 2800 },
      { name: 'Iron Man Superior', desc: 'Dano ×2.0 | Unibeam a cada 5 ataques | 12×', damage_mult: 2.0, passive_override: { attacks_required: 5, mult: 12 }, cost: 4000 }
    ]
  },

  // World Breaker Hulk — Explosões gamma em cadeia amplificadas | 6 upgrades
  // AOE | gamma_burst: kills causam explosão AOE (3× dano base, +20% por kill consecutiva)
  world_breaker_hulk: {
    id: 'world_breaker_hulk', name: 'Hulk Quebra-Mundo', rarity: 5, series: 'marvel', playable: true, xp_value: 10000, initials: 'WBH',
    image: 'assets/towers/update2/Hulk Quebra Mundo.png',
    evolution: {
      source: 'hulk_base',
      requires: [
        { id: 'hulk_base', quantity: 2 },
        { id: 'thor', quantity: 1 },
        { id: 'black_panther', quantity: 1 },
        { id: 'avenger_material_3', quantity: 3 },
        { id: 'avenger_material_2', quantity: 5 },
        { id: 'avenger_material_1', quantity: 10 }
      ]
    },
    passive: {
      type: 'gamma_burst', burst_mult: 3.0, streak_bonus: 0.20, streak_dur: 3, radius: 120,
      label: 'Explosão Gamma: kills causam explosão em área (3× dano / raio 120px; +20% por kill consecutiva em 3s)'
    },
    base_stats: { damage: 370, range: 108, attack_speed: 0.53, type: 'cone' },
    deploy_cost: 1000, max_level: 50,
    prestige_passives: {
      1: { type: 'bankai_pressure', aoe_r: 100, aoe_mult: 1.0, label: 'Fúria Gamma: kills adicionais criam ondas de choque duplas (100% dano, raio 100px)' },
      5: { type: 'berserker', per_enemy: 0.07, max_bonus: 1.2, label: 'Raiva Primordial: +7% vel de ataque por inimigo próximo (máx 120%)' },
      10: { type: 'slow_aura', slow_pct: 0.50, label: 'Campo de Radiação Gamma: aura passiva reduz velocidade de todos os inimigos em 50%' }
    },
    upgrades: [
      { name: 'Corpo Destruidor', desc: 'Dano ×1.4 | Burst → raio 140px', damage_mult: 1.4, passive_override: { radius: 140 }, cost: 1100 },
      { name: 'Fúria Gamma', desc: 'Vel ×1.2 | Burst → 3.5× dano', speed_mult: 1.2, passive_override: { burst_mult: 3.5 }, cost: 1600 },
      { name: 'Terra Partido', desc: 'Alcance ×1.2 | +25% por kill consecutiva', range_mult: 1.2, passive_override: { streak_bonus: 0.25 }, cost: 2100 },
      { name: 'Quebra-Mundo Ativo', desc: 'Dano ×1.5 | Burst → raio 160px', damage_mult: 1.5, passive_override: { burst_mult: 4.0, radius: 160 }, cost: 2700 },
      { name: 'Nível Sentry', desc: 'Vel ×1.15 | Burst → 4.5× | +30% por kill', speed_mult: 1.15, passive_override: { burst_mult: 4.5, streak_bonus: 0.30, radius: 170 }, cost: 3500 },
      { name: 'Fim do Mundo', desc: 'Dano ×2.0 | Burst → 5× | raio 200px', damage_mult: 2.0, passive_override: { burst_mult: 5.0, streak_bonus: 0.35, radius: 200 }, cost: 5000 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  DC — Mundo 5  |  3⭐ → 5⭐ | Crise nas Infinitas Terras
  // ══════════════════════════════════════════════════════════════════════════

  // Flash (Barry Allen) — DPS Acumulativo / Speed Force burst | 6 upgrades
  // Single → Linha | speed_force: a cada N ataques dispara raio que atravessa todo o caminho
  flash_barry: {
    id: 'flash_barry', name: 'Flash (Barry Allen)', rarity: 3, series: 'dc', playable: true, xp_value: 1000, initials: 'FL',
    image: 'assets/towers/update3/Flash.png',
    passive: {
      type: 'speed_force', burst_every: 8, burst_mult: 6.0,
      label: 'Força da Velocidade: a cada 8 ataques dispara um Raio de Velocidade causando 6× dano base em TODOS os inimigos'
    },
    base_stats: { damage: 90, range: 112, attack_speed: 0.38, type: 'single_target' },
    deploy_cost: 250, max_level: 50,
    prestige_passives: {
      1: { type: 'double_hit', chance: 0.30, label: 'Pós-Imagem: 30% de chance de atacar duas vezes no mesmo ciclo' },
      5: { type: 'arc_chain', chain_r: 75, chain_mult: 0.60, chains: 1, label: 'Velocidade Suprema: ataques encadeiam para 1 inimigo próximo (60% dano)' },
      10: { type: 'slow_aura', slow_pct: 0.30, label: 'Speed Force Global: aura da Speed Force desacelera inimigos próximos em 30%' }
    },
    upgrades: [
      { name: 'Corrida Relâmpago', desc: 'Tipo → Linha | Dano ×1.25', type: 'linha', damage_mult: 1.25, cost: 200 },
      { name: 'Velocidade da Luz', desc: 'Vel ×1.35', speed_mult: 1.35, cost: 340 },
      { name: 'Speed Force Ampliada', desc: 'Burst a cada 7 ataques | Dano burst ×1.3', passive_override: { burst_every: 7, burst_mult: 7.8 }, cost: 480 },
      { name: 'Corredor Escarlate', desc: 'Dano ×1.4 | Alcance ×1.15', damage_mult: 1.4, range_mult: 1.15, cost: 620 },
      { name: 'Força Máxima', desc: 'Vel ×1.25 | Burst a cada 6 ataques', speed_mult: 1.25, passive_override: { burst_every: 6, burst_mult: 7.8 }, cost: 820 },
      { name: 'Flash Completo', desc: 'Dano ×1.6 | Vel ×1.2 | Burst → 8× dano', damage_mult: 1.6, speed_mult: 1.2, passive_override: { burst_mult: 8.0 }, cost: 1100 }
    ]
  },

  // Batgirl (Barbara Gordon) — Suporte / Marcação | 5 upgrades
  // Single → Cone | target_mark: inimigos atingidos recebem cross_mark (+18% dano de todos)
  batgirl: {
    id: 'batgirl', name: 'Batgirl (Barbara Gordon)', rarity: 3, series: 'dc', playable: true, xp_value: 1000, initials: 'BG',
    image: 'assets/towers/update3/Batgirl.png',
    passive: {
      type: 'critical', chance: 0.20, mult: 2.2,
      label: 'Combate de Precisão: treinamento do Batman deu a Barbara reflexos de elite — 20% de chance de crítico (2.2× dano)'
    },
    base_stats: { damage: 132, range: 122, attack_speed: 0.74, type: 'single_target' },
    deploy_cost: 255, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'paralisia', duration: 0.8, label: 'Batcombate: cada acerto aplica paralisia relâmpago de 0.8s' },
      5: { type: 'mark_on_nth_hit', n: 3, duration: 5, bonus: 0.25, label: 'Marca Propagante: cada 3º ataque reaaplica a marca (+25% bônus)' },
      10: { type: 'kill_streak', stack_bonus: 0.08, max_stacks: 6, decay_time: 8, label: 'Vigilante Implacável: cada kill acumula maestria de combate (+8% dano por stack, máx 6)' }
    },
    upgrades: [
      { name: 'Pellet de Fumaça', desc: 'Vel ×1.2 | Alcance ×1.1', speed_mult: 1.2, range_mult: 1.1, cost: 220 },
      { name: 'Batarang', desc: 'Tipo → Cone', type: 'cone', cost: 350 },
      { name: 'Foco de Batalha', desc: 'Dano ×1.2 | Crítico → 26%', damage_mult: 1.2, passive_override: { chance: 0.26 }, cost: 510 },
      { name: 'Vigilante de Gotham', desc: 'Dano ×1.45 | Vel ×1.15', damage_mult: 1.45, speed_mult: 1.15, cost: 700 },
      { name: 'Oracle', desc: 'Dano ×1.7 | Crítico → 32%/2.5× | Alcance ×1.2', damage_mult: 1.7, range_mult: 1.2, passive_override: { chance: 0.32, mult: 2.5 }, cost: 1050 }
    ]
  },

  // Aquaman (Arthur Curry) — Controle de Zona / Slow | 5 upgrades
  // AOE | tide_zone: cada ataque cria zona de slow no ponto de impacto
  aquaman: {
    id: 'aquaman', name: 'Aquaman (Arthur Curry)', rarity: 3, series: 'dc', playable: true, xp_value: 1000, initials: 'AQ',
    image: 'assets/towers/update3/Aquaman.png',
    passive: {
      type: 'tide_zone', zone_r: 40, zone_duration: 3, slow_pct: 0.40,
      label: 'Zona de Maré: cada ataque cria uma zona no ponto de impacto (dura 3s, reduz velocidade em 40%)'
    },
    base_stats: { damage: 155, range: 132, attack_speed: 0.81, type: 'single_target' },
    deploy_cost: 270, max_level: 50,
    prestige_passives: {
      1: { type: 'slow_aura', slow_pct: 0.20, label: 'Correnteza: aura passiva desacelera inimigos próximos em 20%' },
      5: { type: 'tsunami', hp: 3500, interval: 55, label: 'Tsunami: invoca onda gigante a cada 55s' },
      10: { type: 'status_on_hit', status: 'sangramento', dps: 80, duration: 3, label: 'Abismo: zona causa 80 DPS de pressão adicional além do slow' }
    },
    upgrades: [
      { name: 'Tridente Afiado', desc: 'Dano ×1.3', damage_mult: 1.3, cost: 230 },
      { name: 'Ondas Profundas', desc: 'Raio zona: 40→55 | Duração: 3s→4s', passive_override: { zone_r: 55, zone_duration: 4 }, cost: 380 },
      { name: 'Comando Marítimo', desc: 'Slow: 40%→55%', passive_override: { slow_pct: 0.55 }, cost: 520 },
      { name: 'Rei dos Sete Mares', desc: 'Dano ×1.5 | Vel ×1.15', damage_mult: 1.5, speed_mult: 1.15, cost: 720 },
      { name: 'Força Atlante', desc: 'Dano ×1.8 | Raio zona: 70 | Slow: 65% | Duração: 5s', damage_mult: 1.8, passive_override: { zone_r: 70, slow_pct: 0.65, zone_duration: 5 }, cost: 1100 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  DC — 4⭐  |  Mecânicas de suporte e controle mais elaboradas
  // ══════════════════════════════════════════════════════════════════════════

  // Batman (Bruce Wayne) — DPS + Amplificador de Equipe | 6 upgrades
  // Cone → AOE | detective_mark: inimigos marcados recebem +22% dano de TODOS os aliados
  batman_bruce: {
    id: 'batman_bruce', name: 'Batman (Bruce Wayne)', rarity: 4, series: 'dc', playable: true, xp_value: 2500, initials: 'BM',
    image: 'assets/towers/update3/Batman.png',
    passive: {
      type: 'detective_mark', mark_duration: 5, mark_bonus: 0.22,
      label: 'Detetive de Elite: inimigos atingidos recebem Marca do Detetive por 5s — aliados que os atacarem causam +22% dano'
    },
    base_stats: { damage: 218, range: 138, attack_speed: 0.71, type: 'cone' },
    deploy_cost: 500, max_level: 50,
    prestige_passives: {
      1: { type: 'ally_damage_aura', bonus: 0.08, label: 'Vigilante: torres aliadas no alcance ganham +8% de dano' },
      5: { type: 'boss_slayer', bonus: 0.40, label: 'Protocolo Arkham: +40% de dano contra minibosses e bosses' },
      10: { type: 'arc_chain', chain_r: 100, chain_mult: 0.60, chains: 2, label: 'Bat-Família: ataques encadeiam para 2 inimigos próximos (60% dano)' }
    },
    upgrades: [
      { name: 'Utilidade do Cinto', desc: 'Dano ×1.25 | Alcance ×1.15', damage_mult: 1.25, range_mult: 1.15, cost: 350 },
      { name: 'Batarang Explosivo', desc: 'Dano ×1.3 | Vel ×1.15', damage_mult: 1.3, speed_mult: 1.15, cost: 600 },
      { name: 'Análise Tática', desc: 'Bônus aliados: 22%→30%', passive_override: { mark_bonus: 0.30 }, cost: 820 },
      { name: 'Traje Blindado', desc: 'Vel ×1.2 | Dano ×1.4', speed_mult: 1.2, damage_mult: 1.4, cost: 1050 },
      { name: 'Protocolo Batman', desc: 'Dano ×1.55 | Marca: 5s→7s', damage_mult: 1.55, passive_override: { mark_duration: 7 }, cost: 1300 },
      { name: 'Cavaleiro das Trevas', desc: 'Dano ×1.8 | Vel ×1.15 | Bônus: 40% | Alcance ×1.2', damage_mult: 1.8, speed_mult: 1.15, range_mult: 1.2, passive_override: { mark_bonus: 0.40 }, cost: 1800 }
    ]
  },

  // Lois Lane — Farmer Superior (supera L no late game) | 5 upgrades
  // Passiva wave_gold com base maior e escalonamento de prestígio superior
  lois_lane: {
    id: 'lois_lane', name: 'Lois Lane', rarity: 4, series: 'dc', playable: true, xp_value: 2500, initials: 'LL',
    image: 'assets/towers/update3/Lois Lane.png',
    is_farm_unit: true,
    passive: {
      type: 'wave_gold', base: 80, perLevel: 3, prestigeMultPerLevel: 0.5,
      label: 'Matéria de Capa: gera ouro ao fim de cada wave (base 80 + Nv×3). Prestígio multiplica o valor'
    },
    base_stats: { damage: 0, range: 128, attack_speed: 0, type: 'none' },
    deploy_cost: 300, max_level: 50,
    prestige_passives: {
      1: { type: 'lois_kill_gold', label: 'Fonte Confiável: +8 ouro por kill na área de alcance' },
      5: { type: 'lois_farm_bonus', label: 'Rede de Fontes: +30% gold/wave por unidade de farm aliada em campo' },
      10: { type: 'lois_manchete', label: 'Manchete: dobra o gold/wave gerado enquanto 3+ unidades deployadas' }
    },
    upgrades: [
      { name: 'Reportagem de Campo', desc: '+80 gold/wave | Alcance ×1.2', gold_bonus: 80, range_mult: 1.2, cost: 280 },
      { name: 'Furo Exclusivo', desc: '+150 gold/wave', gold_bonus: 150, cost: 450 },
      { name: 'Rede de Contatos', desc: '+200 gold/wave | +10 ouro por kill', gold_bonus: 200, kill_gold: 10, cost: 650 },
      { name: 'Capa do Planeta', desc: '+200 gold/wave | kill bonus: 20 ouro | Alcance ×1.3', gold_bonus: 200, kill_gold: 20, range_mult: 1.3, cost: 900 },
      { name: 'Superman Me Ligou', desc: '+200 gold/wave | kill bonus: 30 ouro', gold_bonus: 200, kill_gold: 30, cost: 1200 }
    ]
  },

  // Lanterna Verde (Hal Jordan) — Controle / Barreiras no caminho | 5 upgrades
  // Single | construct_barrier: cria barreira no caminho (slow + DPS aos inimigos que a atravessam)
  lanterna_verde: {
    id: 'lanterna_verde', name: 'Lanterna Verde (Hal Jordan)', rarity: 4, series: 'dc', playable: true, xp_value: 2500, initials: 'LV',
    image: 'assets/towers/update3/Lanterna Verde.png',
    passive: {
      type: 'construct_barrier', barrier_cd: 15, barrier_dur: 8, barrier_dps: 180, slow_pct: 0.50, max_barriers: 1,
      label: 'Barreira de Construto: a cada 15s cria barreira no caminho (dura 8s, slow 50%, 180 DPS aos inimigos que a atravessam)'
    },
    base_stats: { damage: 192, range: 145, attack_speed: 0.76, type: 'single_target' },
    deploy_cost: 520, max_level: 50,
    prestige_passives: {
      1: { type: 'gl_barrier_explosion', label: 'Construto Ofensivo: barreiras causam explosão de impacto ao aparecer (500 dano em AOE)' },
      5: { type: 'ally_damage_aura', bonus: 0.08, label: 'Juramento: torres aliadas ganham +8% de dano enquanto GL está em campo' },
      10: { type: 'gl_barrier_power', label: 'Bateria de Poder: CD → 6s | barreiras duram 15s | cria barreira em cada caminho do Mundo 5' }
    },
    upgrades: [
      { name: 'Anel de Poder', desc: 'Dano ×1.25 | Vel ×1.1', damage_mult: 1.25, speed_mult: 1.1, cost: 360 },
      { name: 'Construto Reforçado', desc: 'Barreira: 8s→12s | DPS: 180→300', passive_override: { barrier_dur: 12, barrier_dps: 300 }, cost: 590 },
      { name: 'Vontade de Ferro', desc: 'Dano ×1.4 | Slow barreira: 50%→65%', damage_mult: 1.4, passive_override: { slow_pct: 0.65 }, cost: 820 },
      { name: 'Tropa dos Lanternas', desc: 'Vel ×1.2 | CD barreira: 15s→10s', speed_mult: 1.2, passive_override: { barrier_cd: 10 }, cost: 1080 },
      { name: 'Guardião do Setor', desc: 'Dano ×1.75 | 2 barreiras simultâneas | DPS barreira: 400', damage_mult: 1.75, passive_override: { max_barriers: 2, barrier_dps: 400 }, cost: 1550 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  DC — 5⭐  |  Drop exclusivo (Fase 6) + evolução do Flash
  // ══════════════════════════════════════════════════════════════════════════

  // Superman (Clark Kent) — DPS + Aura Global | 6 upgrades
  // AOE | heat_vision_aura: aura global +15% dano aliado + Visão de Calor periódica
  superman_clark: {
    id: 'superman_clark', name: 'Superman (Clark Kent)', rarity: 5, series: 'dc', playable: true, xp_value: 10000, initials: 'SC',
    image: 'assets/towers/update3/Superman.png',
    passive: {
      type: 'heat_vision_aura', heat_vision_cd: 20, heat_vision_dmg: 3000, aura_bonus: 0.15,
      label: 'Homem de Aço: torres aliadas ganham +15% dano. A cada 20s dispara Visão de Calor (3.000 dano em todos os inimigos)'
    },
    base_stats: { damage: 450, range: 162, attack_speed: 0.64, type: 'single_target' },
    deploy_cost: 950, max_level: 50,
    prestige_passives: {
      1: { type: 'boss_slayer', bonus: 0.20, label: 'Invulnerabilidade: +20% dano contra bosses e minibosses' },
      5: { type: 'superman_heat_burn', label: 'Calor de Krypton: Visão de Calor também aplica Burn (200 DPS / 3s) em todos os atingidos' },
      10: { type: 'superman_prime', label: 'Superman Prime: aura sobe para +50% dano; Visão de Calor dispara nos dois caminhos' }
    },
    upgrades: [
      { name: 'Aço de Krypton', desc: 'Dano ×1.3 | Vel ×1.1', damage_mult: 1.3, speed_mult: 1.1, cost: 600 },
      { name: 'Visão de Raio X', desc: 'Alcance ×1.25 | Vel ×1.15', range_mult: 1.25, speed_mult: 1.15, cost: 900 },
      { name: 'Velocidade Kryptoniana', desc: 'Dano ×1.4 | Vel ×1.2', damage_mult: 1.4, speed_mult: 1.2, cost: 1200 },
      { name: 'Aura de Aço', desc: 'Aura: +15%→+25% dano aliado', passive_override: { aura_bonus: 0.25 }, cost: 1500 },
      { name: 'Visão de Calor Amplificada', desc: 'CD: 20s→14s | Dano: 3.000→5.500', passive_override: { heat_vision_cd: 14, heat_vision_dmg: 5500 }, cost: 1800 },
      { name: 'Homem de Aço', desc: 'Dano ×1.8 | Vel ×1.2 | Aura +35% | Visão CD 10s | Dano 8.000', damage_mult: 1.8, speed_mult: 1.2, passive_override: { aura_bonus: 0.35, heat_vision_cd: 10, heat_vision_dmg: 8000 }, cost: 2400 }
    ]
  },

  // Shazam (Billy Batson → Shazam) — Transformação / Payoff Longo Prazo | 6 upgrades
  // Billy: Single fraco → Shazam: AOE pesado | shazam_transform: 6 ataques revelam letras S-H-A-Z-A-M
  shazam_billy: {
    id: 'shazam_billy', name: 'Shazam (Billy Batson)', rarity: 5, series: 'dc', playable: true, xp_value: 10000, initials: 'SB',
    image: 'assets/towers/update3/Shazam.png',
    passive: {
      type: 'shazam_transform', attacks_to_transform: 6, olympus_dmg: 4000, olympus_every: 10, chain_r: 80, chain_mult: 0.50, chain_count: 2,
      label: 'SHAZAM!: Billy revela S-H-A-Z-A-M ao atacar. Após transformação: encadeia relâmpago para 2 alvos (50% dano) e a cada 10 ataques invoca Raio do Olimpo (4.000 dano AOE)'
    },
    base_stats: { damage: 45, range: 105, attack_speed: 0.42, type: 'single_target' },
    transformed_stats: { damage: 550, range: 168, attack_speed: 0.57, type: 'cone' },
    deploy_cost: 1100, max_level: 50,
    prestige_passives: {
      1: { type: 'shazam_stun_immune', label: 'Proteção Mágica: Shazam é imune ao atordoamento de destroços da Mecânica Viva' },
      5: { type: 'shazam_chain_para', label: 'Magia de Salomão: relâmpagos encadeados têm 25% de chance de paralisar o alvo por 1s' },
      10: { type: 'shazam_final_ray', label: 'Campeão Eterno: ao completar a transformação, dispara Raio do Olimpo de 12.000 dano em TODOS os inimigos' }
    },
    upgrades: [
      { name: 'SHAZAM!', desc: 'Vel ×1.3 (Billy) | Dano ×1.25 (Shazam)', speed_mult: 1.3, damage_mult: 1.25, cost: 650 },
      { name: 'Poder de Salomão', desc: 'Vel ×1.2 | Raio do Olimpo: 4k→5.5k', speed_mult: 1.2, passive_override: { olympus_dmg: 5500 }, cost: 950 },
      { name: 'Força de Hércules', desc: 'Dano ×1.4', damage_mult: 1.4, cost: 1200 },
      { name: 'Coragem de Aquiles', desc: 'Vel ×1.2', speed_mult: 1.2, cost: 1500 },
      { name: 'Velocidade de Hermes', desc: 'Vel ×1.2 | CD Raio: 10s→7s', speed_mult: 1.2, passive_override: { olympus_every: 7 }, cost: 1800 },
      { name: 'O Campeão', desc: 'Dano ×1.8 | 3 alvos encadeados | Raio: 8.500', damage_mult: 1.8, passive_override: { chain_count: 3, olympus_dmg: 8500 }, cost: 2500 }
    ]
  },

  // Flash Reverso (Eobard Thawne) — DPS + Paralisia | 5 upgrades (evolução do Flash)
  // Linha | negative_speed: acumula stacks no alvo → 5 stacks = paralisia ou dano massivo (stun_immune)
  flash_reverso: {
    id: 'flash_reverso', name: 'Flash Reverso (Eobard Thawne)', rarity: 5, series: 'dc', playable: true, xp_value: 10000, initials: 'FR',
    image: 'assets/towers/update3/Flash Reverso.png',
    evolution: {
      source: 'flash_barry',
      requires: [
        { id: 'flash_barry', quantity: 2 },
        { id: 'batgirl', quantity: 1 },
        { id: 'dc_material_3', quantity: 3 },
        { id: 'dc_material_2', quantity: 5 },
        { id: 'dc_material_1', quantity: 10 }
      ]
    },
    passive: {
      type: 'negative_speed', stacks_to_trigger: 5, paralysis_dur: 2, stun_immune_mult: 5,
      label: 'Velocidade Negativa: cada acerto acumula 1 stack no alvo. 5 stacks → paralisia 2s (ou 5× dano em inimigos stun_immune)'
    },
    base_stats: { damage: 480, range: 148, attack_speed: 0.31, type: 'linha' },
    deploy_cost: 800, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'sangramento', dps: 100, duration: 2, label: 'Rastro de Ódio: cada ataque causa sangramento (100 DPS / 2s)' },
      5: { type: 'kill_streak', stack_bonus: 0.10, max_stacks: 10, decay_time: 8, label: 'Linha do Tempo Corrompida: kills acumulam velocidade (+10% dano por stack, máx 10)' },
      10: { type: 'negative_speed_p10', label: 'Velocidade Suprema: cada stack além do 3º adiciona +0.5s à paralisia (máx 6s)' }
    },
    upgrades: [
      { name: 'Força Negativa', desc: 'Dano ×1.3 | Vel ×1.15', damage_mult: 1.3, speed_mult: 1.15, cost: 600 },
      { name: 'Velocidade do Ódio', desc: 'Stacks para paralisia: 5→4', passive_override: { stacks_to_trigger: 4 }, cost: 900 },
      { name: 'Singularidade Reversa', desc: 'Paralisia: 2s→3s | Dano stun_immune: 5×→7×', passive_override: { paralysis_dur: 3, stun_immune_mult: 7 }, cost: 1200 },
      { name: 'Paradoxo Temporal', desc: 'Dano ×1.5 | Vel ×1.2', damage_mult: 1.5, speed_mult: 1.2, cost: 1500 },
      { name: 'Professor Zoom', desc: 'Dano ×1.8 | Stacks: 3 | Paralisia: 3.5s | Dano stun_immune: 10×', damage_mult: 1.8, passive_override: { stacks_to_trigger: 3, paralysis_dur: 3.5, stun_immune_mult: 10 }, cost: 2000 }
    ]
  },

  // ┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼
  //  Ω  Este registro foi corrompido.  Ω
  // ┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼
  darkseid_7star: {
    id: 'darkseid_7star', name: 'Darkseid', rarity: 7, series: 'dc', playable: true, xp_value: 99999, initials: 'Ω',
    image: 'assets/towers/update3/Darkseid.png',
    visible_in_banner: false,
    counts_pity: false,
    gacha_chance: 0.000005,
    deploy_cost: 4500,
    base_stats: { damage: 350, range: 195, attack_speed: 1.12, type: 'omega' },
    max_level: 50,
    passive: [
      { type: 'omega_chain_ray', triggerEveryNAttacks: 4, branches: 3, branchDamageRatio: 0.70, doubleHitDamageRatio: 2.50, label: '⚡ Raios Omega: a cada 4 ataques, dispara raios encadeados nos 3 inimigos com maior HP (70% dano cada). Acertos duplos causam 2.5× dano.' },
      { type: 'will_break', stacksRequired: 5, stacksRequiredStunImmune: 8, label: '🧠 Quebra de Vontade: ao aplicar 5 cargas (ou 8 em imunes), o inimigo sofre Dano Real igual a 15% do seu HP máximo.' },
      { type: 'tyrant_rising', tyrant_dmgPerStack: 0.02, label: '👑 Tirano Implacável: cada Quebra de Vontade aumenta permanentemente o dano de Darkseid em +2% (acumula).' },
      { type: 'apokolips_shadows', shadow_chance: 0.20, shadow_dur: 5, label: '👤 Sombras de Apokolips: 20% de chance por acerto de invocar uma Sombra que ataca o inimigo por 5s.' },
      { type: 'omega_bond', bond_trio: false, label: '⛓️ Vínculo Omega: vincula 2 inimigos. Dano causado a um também afeta o outro.' },
      { type: 'abyss_embrace', abyss_count: 2, abyss_dur: 10, label: '🕳️ Abraço do Abismo: envia até 2 inimigos menores para o abismo, instakill (CD: 10s).' }
    ],
    prestige_passives: {
      1: { type: 'omega_decree', cooldown: 90, label: 'Decreto Omega: uma vez por wave, reduz o inimigo com maior HP a 1 HP (CD: 90s).' },
      5: { type: 'anti_life_spread', freeStacksGranted: 2, label: 'Propagação Anti-Vida: ao quebrar a vontade de um inimigo, todos os outros recebem 2 cargas de Corrupção.' },
      10: { type: 'absolute_dominion', maxPermanentShadows: 10, label: 'Domínio Absoluto: Sombras de Apokolips tornam-se permanentes (máx 10 simultâneas).' }
    },
    upgrades: [
      { name: 'Foco Omega', desc: 'Dano +350 | Alcance ×1.10 | Raio Triplo a cada 3 ataques', damage_bonus: 350, range_mult: 1.10, passive_override: { triggerEveryNAttacks: 3 }, cost: 3000 },
      { name: 'Equação Anti-Vida', desc: 'Dano +500 | Quebra de Vontade: 4 cargas (stun_immune: 6)', damage_bonus: 500, passive_override: { stacksRequired: 4, stacksRequiredStunImmune: 6 }, cost: 5500 },
      { name: 'Soberania Absoluta', desc: 'Dano +700 | Alcance ×1.08 | Tirano: +4%/stack | Sombras: 28% / 8s', damage_bonus: 700, range_mult: 1.08, passive_override: { tyrant_dmgPerStack: 0.04, shadow_chance: 0.28, shadow_dur: 8 }, cost: 9000 },
      { name: 'Senhor Apokolips', desc: 'Dano +1000 | Vínculo: trios | Abraço: 3 inimigos / 15s', damage_bonus: 1000, passive_override: { bond_trio: true, abyss_count: 3, abyss_dur: 15 }, cost: 14000 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  NEMESIS — Unidade Exclusiva de Missão Global (5⭐ Evento)
  //  Perfil: Invocação + DoT | Invoca horda zumbi periódica + infecta inimigos
  //  Inimigos infectados que morrem ressurgem como zumbis no ponto de morte.
  // ══════════════════════════════════════════════════════════════════════════
  nemesis: {
    id: 'nemesis', name: 'Nemesis', rarity: 5, series: 'evento', playable: true, xp_value: 10000, initials: 'NM',
    image: 'assets/towers/events/Nemesis.png',
    event_exclusive: true,
    passive: {
      type: 'zombie_spawn',
      interval: 18,
      zombie_hp: 4000,
      zombie_speed: 52,
      zombie_dps: 100,
      label: 'Praga Zumbi: invoca horda de zumbis na base a cada 18s — caminham devagar infectando tudo que tocam. Inimigos infectados que morrem ressurgem como zumbis no ponto de morte.'
    },
    base_stats: { damage: 520, range: 130, attack_speed: 0.5, type: 'aoe' },
    deploy_cost: 750, max_level: 50,
    prestige_passives: {
      1: { type: 'status_on_hit', status: 'infectado', dps: 35, duration: 7, label: 'Vírus Primário: cada acerto aplica infecção zumbi (35 DPS/7s, desacelera 35%)' },
      5: { type: 'spirit_surge', trigger_at: 4, mult: 4.5, label: 'Carga Viral: cada 4º ataque libera carga de veneno (4.5× dano)' },
      10: { type: 'phantom_strike', trigger_at: 6, phantom_mult: 1.8, label: 'Proliferação Final: cada 6º ataque espalha infecção em toda a área' }
    },
    upgrades: [
      { name: 'Infecção Alfa', desc: 'Dano ×1.3 | Infectado: 30 DPS / 6s por acerto', damage_mult: 1.3, status_effect: { type: 'infectado', dps: 30, duration: 6 }, cost: 650 },
      { name: 'Mutação Viral', desc: 'Vel ×1.2 | Alcance ×1.1', speed_mult: 1.2, range_mult: 1.21, cost: 1000 },
      { name: 'Horda Resistente', desc: 'Zumbis invocados com HP 1.5× | Dano ×1.1', damage_mult: 1.1, zombie_hp_mult: 1.5, cost: 1350 },
      { name: 'Pandemia', desc: 'Dano ×1.5 | Infectado → 60 DPS / 10s', damage_mult: 1.5, status_effect: { type: 'infectado', dps: 60, duration: 10 }, cost: 1600 }
    ]
  },
};

// Full pool — usado pelo BannerSystem
const ALL_CHARACTERS_POOL = {
  star3: ['ichigo_base', 'goku_base', 'l_deathnote', 'demolidor', 'sasuke_uchiha', 'killua_zoldyck', 'tanjiro_kamado', 'zoro_3', 'luffy_3', 'nami_3', 'usopp_3', 'brook_3', 'rukia_kuchiki', 'renji_abarai', 'uryu_ishida', 'orihime_inoue', 'chad_yasutora', 'spider_man', 'black_widow', 'hawkeye', 'flash_barry', 'batgirl', 'aquaman'],
  star4: ['naruto_shippuden', 'levi_ackerman', 'meliodas_base', 'sanji_4', 'robin_4', 'ace_4', 'byakuya_kuchiki', 'toshiro_hitsugaya', 'kenpachi_zaraki', 'black_panther', 'thor', 'hulk_base', 'batman_bruce', 'lois_lane', 'lanterna_verde'],
  star5: ['gojo_satoru', 'luffy_5', 'ichigo_bankai', 'superman_clark', 'shazam_billy']
};

// Populado em runtime por BannerSystem.init()
const GACHA_POOL = { star3: [], star4: [], star5: [] };

const RARITY_COLORS = { 0: '#666', 1: '#27ae60', 2: '#2980b9', 3: '#9b59b6', 4: '#e67e22', 5: '#f1c40f', 6: '#e63939', 7: '#1a0a0a' };
const RARITY_LABELS = { 0: '0⭐', 1: '1⭐', 2: '2⭐', 3: '3⭐', 4: '4⭐', 5: '5⭐', 6: '6⭐', 7: '7 <span style="color:#39FF14">⭐</span>' };
const SERIES_LABELS = {
  naruto: 'Naruto', bleach: 'Bleach', dragonball: 'Dragon Ball',
  deathnote: 'Death Note', marvel: 'Marvel', onepiece: 'One Piece',
  hxh: 'HxH', kimetsu: 'Kimetsu', snk: 'SNK', nanatsu: '7DS', jjk: 'JJK',
  dc: 'DC Comics', evento: 'Evento'
};

function getCharById(id) { return CHARACTERS[id] || null; }
function getPlayable() { return Object.values(CHARACTERS).filter(c => c.playable); }

function charIconInner(char) {
  if (!char) return '?';
  if (char.image) return `<img src="${char.image}" class="char-portrait" alt="${char.name}">`;
  return char.initials;
}

function getCurrentStats(charData, level) {
  const b = level - 1;
  return {
    damage: charData.base_stats.damage * (1 + 0.02 * b),
    range: charData.base_stats.range * (1 + 0.01 * b),
    attack_speed: charData.base_stats.attack_speed * (1 + 0.01 * b),
    type: charData.base_stats.type
  };
}

function xpForNextLevel(level, rarity = 3) {
  const multiplier = Math.max(1, Math.pow(2, rarity - 3));
  return level * 100 * multiplier;
}

function applyXPToUnit(unitSave, xpGain) {
  unitSave.xp_atual += xpGain;
  const char = getCharById(unitSave.id);
  const rarity = char ? char.rarity : 3;
  const maxLevel = char && char.max_level ? char.max_level : 50;
  while (unitSave.nivel < maxLevel) {
    const needed = xpForNextLevel(unitSave.nivel, rarity);
    if (unitSave.xp_atual >= needed) { unitSave.xp_atual -= needed; unitSave.nivel++; }
    else break;
  }
}
