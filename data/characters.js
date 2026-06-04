const CHARACTERS = {
  // ── Materials ─────────────────────────────────────────────────────────────
  ninja_generico_1: { id:'ninja_generico_1', name:'Ninja Genérico I',   rarity:0, series:'naruto', playable:false, xp_value:50,  initials:'NG1', image: 'assets/ingredients/world1/Ninja 1.png', upgrades_to:'ninja_generico_2', upgrade_cost:3 },
  ninja_generico_2: { id:'ninja_generico_2', name:'Ninja Genérico II',  rarity:1, series:'naruto', playable:false, xp_value:150, initials:'NG2', image: 'assets/ingredients/world1/Ninja 2.png', upgrades_to:'ninja_generico_3', upgrade_cost:3 },
  ninja_generico_3: { id:'ninja_generico_3', name:'Ninja Genérico III', rarity:2, series:'naruto', playable:false, xp_value:400, initials:'NG3', image: 'assets/ingredients/world1/Ninja 3.png' },

  // ══════════════════════════════════════════════════════════════════════════
  //  3⭐  —  Sem AOE. Poder vem de passivas, status effects e multiplicadores.
  //  Tipos permitidos: single_target, linha, cone (1-2 unidades), AOE só L.
  // ══════════════════════════════════════════════════════════════════════════

  // Ichigo — Stacker de Sangramento | 6 upgrades
  // Single → Linha | Bleed escala de 10 → 20 DPS
  ichigo_base: {
    id:'ichigo_base', name:'Ichigo (Base)', rarity:3, series:'bleach', playable:true, xp_value:1000, initials:'IB',
    image: 'assets/towers/update0/Ichigo.png',
    passive:{ type:'status_on_hit', status:'sangramento', dps:10, duration:3,
      label:'Espírito Feroz: cada acerto causa sangramento (10 DPS/3s, acumula)' },
    base_stats:{ damage:83, range:91, attack_speed:1.54, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Getsugatensho',    desc:'Tipo → Linha | Dano ×1.3',                        type:'linha', damage_mult:1.3,                                      cost:170 },
      { name:'Bankai Parcial',   desc:'Alcance ×1.2 | Vel ×1.2',                          range_mult:1.28, speed_mult:1.2,                                      cost:340 },
      { name:'Espírito de Luta', desc:'Sangramento → 15 DPS / 4s',                        passive_override:{ dps:15, duration:4 },                             cost:450 },
      { name:'Kurosaki',         desc:'Dano ×1.4 | Vel ×1.1',                             damage_mult:1.4, speed_mult:1.1,                                      cost:580 },
      { name:'Ichigo Verdadeiro',desc:'Sangramento → 20 DPS / 5s',                        passive_override:{ dps:20, duration:5 },                             cost:780 },
      { name:'Bankai Completo',  desc:'Dano ×1.7 | Vel ×1.2 | Alcance ×1.1',             damage_mult:1.7, speed_mult:1.2, range_mult:1.21,                     cost:1100 }
    ]
  },

  // Goku — Crítico Nuclear | 5 upgrades
  // Single → Linha | Crit escala de 20%/2.5× → 38%/3.5×
  goku_base: {
    id:'goku_base', name:'Goku (Base)', rarity:3, series:'dragonball', playable:true, xp_value:1000, initials:'GB',
    image: 'assets/towers/update0/Goku.png',
    passive:{ type:'critical', chance:0.20, mult:2.5,
      label:'Ki Oculto: 20% de chance de acerto crítico (2.5× dano)' },
    base_stats:{ damage:99, range:94, attack_speed:1.21, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Kamehameha',      desc:'Tipo → Linha | Dano ×1.4',                          type:'linha', damage_mult:1.4,                                       cost:170 },
      { name:'Kaio-Ken',        desc:'Vel ×1.4 | Dano ×0.85',                             speed_mult:1.4, damage_mult:0.85,                                    cost:340 },
      { name:'Super Saiyajin',  desc:'Dano ×1.8 | Crit → 28% / 3.0×',                    damage_mult:1.8, passive_override:{ chance:0.28, mult:3.0 },          cost:550 },
      { name:'Super Saiyajin 2',desc:'Vel ×1.2 | Dano ×1.3',                             speed_mult:1.2, damage_mult:1.3,                                      cost:750 },
      { name:'Ultra Instinto',  desc:'Dano ×1.6 | Crit → 38% / 3.5× | Vel ×1.1',        damage_mult:1.6, speed_mult:1.1, passive_override:{ chance:0.38, mult:3.5 }, cost:1000 }
    ]
  },

  // L — Farm Puro (sem ataques) | 4 upgrades
  // Gera ouro por wave: base 60 + nível×3 + upgrades
  // Upgrades 2-4 adicionam kill_gold (bônus por kill na área)
  l_deathnote: {
    id:'l_deathnote', name:'L (Death Note)', rarity:3, series:'deathnote', playable:true, xp_value:1000, initials:'LD',
    image: 'assets/towers/update0/L.png',
    is_farm_unit: true,
    passive:{ type:'wave_gold', base:60, perLevel:3,
      label:'Análise Dedutiva: gera ouro ao fim de cada wave (escala com nível e upgrades)' },
    base_stats:{ damage:0, range:136, attack_speed:0, type:'none' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Planejamento',         desc:'+30 ouro/wave | Alcance ×1.2',                  gold_bonus:30, range_mult:1.28,                                       cost:160 },
      { name:'Rede de Espionagem',   desc:'+40 ouro/wave | +5 ouro por kill na área',       gold_bonus:40, kill_gold:5,                                          cost:300 },
      { name:'Investigação Avançada',desc:'+50 ouro/wave | kill bonus → 10 ouro',           gold_bonus:50, kill_gold:10,                                         cost:500 },
      { name:'Kira Identificado',    desc:'+80 ouro/wave | kill bonus → 15 ouro | Alcance ×1.3', gold_bonus:80, kill_gold:15, range_mult:1.35,                  cost:750 }
    ]
  },

  // Demolidor — Controlador de Corredor | 5 upgrades
  // Single → Linha | Slow Aura escala de 30% → 50%
  demolidor: {
    id:'demolidor', name:'Demolidor', rarity:3, series:'marvel', playable:true, xp_value:1000, initials:'DD',
    image: 'assets/towers/update0/Demolidor.png',
    passive:{ type:'slow_aura', slow_pct:0.30,
      label:'Radar Tático: desacelera passivamente todos os inimigos na área em 30%' },
    base_stats:{ damage:75, range:84, attack_speed:1.54, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Sentidos Aguçados', desc:'Alcance ×1.35 | Slow → 35%',                       range_mult:1.38, passive_override:{ slow_pct:0.35 },                 cost:165 },
      { name:'Fúria',             desc:'Vel ×1.3 | Dano ×1.2',                              speed_mult:1.3, damage_mult:1.2,                                     cost:350 },
      { name:'Reflexos Apurados', desc:'Slow → 40% | Dano ×1.2',                           damage_mult:1.2, passive_override:{ slow_pct:0.40 },                 cost:500 },
      { name:'Sem Misericórdia',  desc:'Tipo → Linha | Dano ×1.6',                          type:'linha', damage_mult:1.6,                                       cost:700 },
      { name:'Demolidor',         desc:'Slow → 50% | Dano ×1.5 | Vel ×1.1',               damage_mult:1.5, speed_mult:1.1, passive_override:{ slow_pct:0.50 },  cost:950 }
    ]
  },

  // Sasuke — Precision Striker + Burn | 5 upgrades
  // Single → Linha | Sharingan ignora req | Burn escala de 20 → 30 DPS
  sasuke_uchiha: {
    id:'sasuke_uchiha', name:'Sasuke Uchiha', rarity:3, series:'naruto', playable:true, xp_value:1000, initials:'SU',
    image: 'assets/towers/update0/Sasuke.png',
    passive:{ type:'sharingan',
      label:'Sharingan: ignora o requisito de upgrade de todos os inimigos' },
    base_stats:{ damage:77, range:104, attack_speed:0.99, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Chidori',          desc:'Tipo → Linha | Dano ×1.5',                          type:'linha', damage_mult:1.5,                                       cost:180 },
      { name:'Susanoo Parcial',  desc:'Alcance ×1.2 | Dano ×1.3',                          range_mult:1.28, damage_mult:1.3,                                     cost:370 },
      { name:'Sharingan Completo',desc:'Vel ×1.2 | Dano ×1.2',                             speed_mult:1.2, damage_mult:1.2,                                     cost:520 },
      { name:'Amaterasu',        desc:'Burn 20 DPS / 3s por acerto',                        status_effect:{ type:'burn', dps:20, duration:3 },                   cost:700 },
      { name:'Susanoo Completo', desc:'Dano ×1.6 | Burn → 30 DPS / 4s | Alcance ×1.1',   damage_mult:1.6, range_mult:1.21, status_effect:{ type:'burn', dps:30, duration:4 }, cost:950 }
    ]
  },

  // Killua — Mais Rápido do Tier + Paralisador | 6 upgrades
  // Single → Cone (Godspeed) | Double hit escala de 25% → 35%
  killua_zoldyck: {
    id:'killua_zoldyck', name:'Killua Zoldyck', rarity:3, series:'hxh', playable:true, xp_value:1000, initials:'KZ',
    image: 'assets/towers/update0/Kilua.png',
    passive:{ type:'double_hit', chance:0.25,
      label:'Velocidade Divina: 25% de chance de atacar duas vezes no mesmo ciclo' },
    base_stats:{ damage:66, range:78, attack_speed:2.2, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Narukami',          desc:'Vel ×1.2 | Dano ×1.2',                             speed_mult:1.2, damage_mult:1.2,                                     cost:160 },
      { name:'Modo Assassino',    desc:'Paralisia 0.5s por acerto',                         status_effect:{ type:'paralisia', duration:0.5 },                    cost:330 },
      { name:'Velocidade Relâmpago',desc:'Vel ×1.25 | Dano ×1.2',                          speed_mult:1.25, damage_mult:1.2,                                    cost:480 },
      { name:'Campo de Raios',    desc:'Paralisia → 0.8s | Dano ×1.3',                     damage_mult:1.3, status_effect:{ type:'paralisia', duration:0.8 },    cost:650 },
      { name:'Dança da Morte',    desc:'Tipo → Cone | Vel ×1.2',                           type:'cone', speed_mult:1.2,                                          cost:850 },
      { name:'Godspeed',          desc:'Vel ×1.3 | Dano ×1.4 | Double hit → 35%',         speed_mult:1.3, damage_mult:1.4, passive_override:{ chance:0.35 },    cost:1100 }
    ]
  },

  // Tanjiro — Rei da Sinergia de Burn | 5 upgrades
  // Single → Cone | 2× vs queimados | Burn nos upgrades escala de 15 → 25 DPS
  tanjiro_kamado: {
    id:'tanjiro_kamado', name:'Tanjiro Kamado', rarity:3, series:'kimetsu', playable:true, xp_value:1000, initials:'TK',
    image: 'assets/towers/update0/Tanjiro.png',
    passive:{ type:'bonus_vs_burned', mult:2.0,
      label:'Respiração Total: causa 2× de dano em inimigos que estão queimando' },
    base_stats:{ damage:86, range:91, attack_speed:1.21, type:'single_target' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Dança da Lareira',  desc:'Vel ×1.2 | Burn 15 DPS / 2s por acerto',          speed_mult:1.2, status_effect:{ type:'burn', dps:15, duration:2 },    cost:175 },
      { name:'Respiração Solar',  desc:'Dano ×1.5 | Alcance ×1.1',                         damage_mult:1.5, range_mult:1.21,                                      cost:360 },
      { name:'Décima Forma',      desc:'Burn → 20 DPS / 3s | Dano ×1.3',                  damage_mult:1.3, status_effect:{ type:'burn', dps:20, duration:3 },   cost:520 },
      { name:'Hinokami Kagura',   desc:'Tipo → Cone | Dano ×1.5',                          type:'cone', damage_mult:1.5,                                         cost:720 },
      { name:'Dança do Deus Fogo',desc:'Dano ×1.6 | Vel ×1.1 | Burn → 25 DPS / 4s',      damage_mult:1.6, speed_mult:1.1, status_effect:{ type:'burn', dps:25, duration:4 }, cost:950 }
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  //  4⭐  —  Podem ter AOE (não Full AOE). Cada um com archetype distinto.
  // ══════════════════════════════════════════════════════════════════════════

  // Naruto — AOE Farmer consistente | 6 upgrades
  // AOE durante toda a progressão | Kill reduz CD
  naruto_shippuden: {
    id:'naruto_shippuden', name:'Naruto (Shippuden)', rarity:4, series:'naruto', playable:true, xp_value:3000, initials:'NS',
    image: 'assets/towers/update0/Naruto.png',
    passive:{ type:'kill_cooldown', reduction:0.20,
      label:'Kage Bunshin: ao matar, próximo ataque vem com 80% do cooldown reduzido' },
    base_stats:{ damage:163, range:113, attack_speed:1.43, type:'aoe' },
    deploy_cost:300, max_level:50,
    upgrades:[
      { name:'Rasengan',          desc:'Dano ×1.5',                                         damage_mult:1.5,                                                    cost:200 },
      { name:'Modo Clone',        desc:'Vel ×1.3 | Alcance ×0.9',                           speed_mult:1.3, range_mult:0.94,                                      cost:400 },
      { name:'Rasengan Gigante',  desc:'Dano ×1.4 | Alcance ×1.1',                          damage_mult:1.4, range_mult:1.21,                                     cost:580 },
      { name:'Modo Sábio',        desc:'Vel ×1.2 | Alcance ×1.15 | Kill CD → 90% reduzido', speed_mult:1.2, range_mult:1.25, passive_override:{ reduction:0.10 }, cost:750 },
      { name:'Rasenshuriken',     desc:'Dano ×1.7 | Vel ×0.85',                             damage_mult:1.7, speed_mult:0.85,                                    cost:950 },
      { name:'Modo Bijuu',        desc:'Dano ×1.5 | Vel ×1.15 | Alcance ×1.1',             damage_mult:1.5, speed_mult:1.15, range_mult:1.21,                    cost:1300 }
    ]
  },


  // Levi — Kill Streak Ilimitado | 7 upgrades
  // Single → Linha | Stacks aumentam com upgrades (5 → 15)
  levi_ackerman: {
    id:'levi_ackerman', name:'Levi Ackerman', rarity:4, series:'snk', playable:true, xp_value:3000, initials:'LA',
    image: 'assets/towers/update0/Levi.png',
    passive:{ type:'kill_streak', stack_bonus:0.20, decay_time:4, max_stacks:5,
      label:'Chacina: cada kill empilha +20% de dano (máx 5 stacks, reseta 4s sem matar)' },
    base_stats:{ damage:141, range:104, attack_speed:1.87, type:'single_target' },
    deploy_cost:300, max_level:50,
    upgrades:[
      { name:'Equipamento ODM',     desc:'Vel ×1.3 | Dano ×1.25',                          speed_mult:1.3, damage_mult:1.25,                                    cost:195 },
      { name:'Reflexos',            desc:'Dano ×1.2 | Máx stacks → 7',                     damage_mult:1.2, passive_override:{ max_stacks:7 },                  cost:390 },
      { name:'Chacina de Titãs',    desc:'Alcance ×1.2 | Vel ×1.1',                        range_mult:1.28, speed_mult:1.1,                                      cost:550 },
      { name:'Controle Total',      desc:'Máx stacks → 10 | Reset → 5s',                   passive_override:{ max_stacks:10, decay_time:5 },                    cost:720 },
      { name:'Melhor da Humanidade',desc:'Dano ×1.5 | Vel ×1.2',                           damage_mult:1.5, speed_mult:1.2,                                     cost:900 },
      { name:'Modo Combate',        desc:'Tipo → Linha | Dano ×1.5 | Vel ×0.9',            type:'linha', damage_mult:1.5, speed_mult:0.9,                       cost:1100 },
      { name:'Capitão Ackerman',    desc:'Vel ×1.3 | Dano ×1.5 | Máx stacks → 15',        speed_mult:1.3, damage_mult:1.5, passive_override:{ max_stacks:15 }, cost:1400 }
    ]
  },

  // Meliodas — DoT Duplo que se Espalha | 6 upgrades
  // Single → Cone → AOE | Burn + Bleed em todo acerto, DoTs escalam
  meliodas_base: {
    id:'meliodas_base', name:'Meliodas', rarity:4, series:'nanatsu', playable:true, xp_value:3000, initials:'ML',
    image: 'assets/towers/update0/Meliodas.png',
    passive:{ type:'dual_affliction', burn_dps:14, burn_duration:2, bleed_dps:7, bleed_duration:2,
      label:'Dragão Pecado da Ira: todo acerto causa Burn (14 DPS) + Bleed (7 DPS) simultâneos' },
    base_stats:{ damage:152, range:104, attack_speed:1.38, type:'single_target' },
    deploy_cost:300, max_level:50,
    upgrades:[
      { name:'Contra',            desc:'Tipo → Cone | Dano ×1.3',                          type:'cone', damage_mult:1.3,                                        cost:190 },
      { name:'Escudo de Liz',     desc:'Vel ×1.3 | Dano ×1.2',                             speed_mult:1.3, damage_mult:1.2,                                     cost:380 },
      { name:'Fúria do Dragão',   desc:'Burn → 18 DPS | Bleed → 10 DPS',                  passive_override:{ burn_dps:18, bleed_dps:10 },                      cost:560 },
      { name:'Modo Demônio',      desc:'Tipo → AOE | Dano ×1.5',                           type:'aoe', damage_mult:1.5,                                         cost:750 },
      { name:'Dez Mandamentos',   desc:'Vel ×1.2 | Burn → 22 DPS | Bleed → 14 DPS',       speed_mult:1.2, passive_override:{ burn_dps:22, bleed_dps:14 },      cost:950 },
      { name:'Poder dos Demônios',desc:'Dano ×1.8 | Alcance ×1.1 | Burn → 28 | Bleed → 18', damage_mult:1.8, range_mult:1.21, passive_override:{ burn_dps:28, bleed_dps:18 }, cost:1300 }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  5⭐  —  Tier exclusivo. Gojo = Full AOE + suporte. Sage = exército de clones.
  // ══════════════════════════════════════════════════════════════════════════

  // Naruto Sage — Exército de Clones | 5 upgrades
  // Single target rápido — 8 clones independentes = cobertura real sem Full AOE por tipo
  naruto_sage: {
    id:'naruto_sage', name:'Naruto (Sage Mode)', rarity:5, series:'naruto', playable:true, xp_value:8000, initials:'NM',
    image: 'assets/towers/update0/Naruto Sage.png',
    passive:{ type:'clone_on_attack', chance:0.15, duration:60, maxClones:5,
      label:'Senjutsu: 15% de chance por ataque de invocar um clone por 60s (máx 5, cada clone ataca independentemente)' },
    base_stats:{ damage:308, range:130, attack_speed:2.42, type:'single_target' },
    deploy_cost:500, max_level:50,
    upgrades:[
      { name:'Senjutsu',            desc:'Dano ×1.35 | Alcance ×1.1 | Clone chance → 20%',  damage_mult:1.35, range_mult:1.21, passive_override:{ chance:0.20 },          cost:400 },
      { name:'Modo Sábio',          desc:'Vel ×1.2 | Clone duração → 75s',                   speed_mult:1.2, passive_override:{ duration:75 },                            cost:700 },
      { name:'Modo Sábio Completo', desc:'Dano ×1.4 | Máx clones → 6',                       damage_mult:1.4, passive_override:{ maxClones:6 },                           cost:1000 },
      { name:'Monte Myoboku',       desc:'Vel ×1.15 | Alcance ×1.1 | Clone chance → 25%',    speed_mult:1.15, range_mult:1.21, passive_override:{ chance:0.25 },           cost:1300 },
      { name:'Modo Bijuu',          desc:'Dano ×1.55 | Vel ×1.15 | Máx clones → 8',         damage_mult:1.55, speed_mult:1.15, passive_override:{ maxClones:8 },          cost:1700 }
    ],
    evolution:{ source:'naruto_shippuden', requires:[
      { id:'naruto_shippuden', quantity:2 },
      { id:'ninja_generico_2', quantity:3 },
      { id:'ninja_generico_3', quantity:2 }
    ]}
  },

  // Gojo — Full AOE + Suporte | 4 upgrades (menos upgrades, cada um mais pesado)
  // Full AOE + aura +25% a torres + Domínio Expandido (stun ativo)
  gojo_satoru: {
    id:'gojo_satoru', name:'Gojo Satoru', rarity:5, series:'jjk', playable:true, xp_value:8000, initials:'GS',
    image: 'assets/towers/update0/Gojo.png',
    passive:{ type:'damage_aura', bonus:0.25,
      label:'Amplificação Maldita: torres dentro do alcance causam +25% de dano' },
    active_ability:{ type:'domain_expansion', stun_duration:3, cooldown:35, label:'Domínio Expandido' },
    base_stats:{ damage:407, range:123, attack_speed:1.87, type:'aoe_full' },
    deploy_cost:500, max_level:50,
    upgrades:[
      { name:'Infinito',        desc:'Dano ×1.25 | Alcance ×1.15',                        damage_mult:1.25, range_mult:1.25,                                   cost:420 },
      { name:'Vermelho Maldito',desc:'Vel ×1.2 | Dano ×1.2',                               speed_mult:1.2, damage_mult:1.2,                                     cost:750 },
      { name:'Azul Maldito',    desc:'Alcance ×1.1 | Aura → +30% | Stun → 4s',           range_mult:1.21, passive_override:{ bonus:0.30 }, active_override:{ stun_duration:4 }, cost:1100 },
      { name:'Violeta Oco',     desc:'Dano ×1.8 | Vel ×1.15 | Alcance ×1.1',             damage_mult:1.8, speed_mult:1.15, range_mult:1.21,                    cost:1700 }
    ]
  },

  // ── Ingredients (One Piece) ──
  pirata_generico_1: { id:'pirata_generico_1', name:'Pirata Novato',   rarity:0, series:'onepiece', playable:false, xp_value:60, initials:'P1', image: 'assets/ingredients/world2/Pirata 1.png', upgrades_to:'pirata_generico_2', upgrade_cost:3 },
  pirata_generico_2: { id:'pirata_generico_2', name:'Pirata Saqueador',  rarity:1, series:'onepiece', playable:false, xp_value:180, initials:'P2', image: 'assets/ingredients/world2/Pirata 2.png', upgrades_to:'pirata_generico_3', upgrade_cost:3 },
  pirata_generico_3: { id:'pirata_generico_3', name:'Pirata Veterano', rarity:2, series:'onepiece', playable:false, xp_value:500, initials:'P3', image: 'assets/ingredients/world2/Pirata 3.png' },

  // ── 3⭐ ──
  luffy_3: {
    id:'luffy_3', name:'Luffy (East Blue)', rarity:3, series:'onepiece', playable:true, xp_value:1000, initials:'LF',
    image: 'assets/towers/update0/Luffy.png',
    passive:{ type:'double_hit', chance:1.0,
      label:'Borracha Elástica: Luffy sempre ataca duas vezes no mesmo ciclo' },
    base_stats:{ damage:119, range:70, attack_speed:1.76, type:'single_target' },
    deploy_cost:120, max_level:50,
    upgrades:[
      { name:'Gomu Gomu no Pistol', desc:'Dano ×1.5', damage_mult:1.5, cost:150 },
      { name:'Gomu Gomu no Gatling', desc:'Vel ×1.4 | Dano ×1.2', speed_mult:1.4, damage_mult:1.2, cost:300 }
    ]
  },
  zoro_3: {
    id:'zoro_3', name:'Zoro (East Blue)', rarity:3, series:'onepiece', playable:true, xp_value:1000, initials:'ZR',
    image: 'assets/towers/update0/Zoro.png',
    passive:{ type:'slow_aura', slow_pct:0.15,
      label:'Corte Debilitante: inimigos na área de Zoro ficam enfraquecidos (−15% velocidade)' },
    base_stats:{ damage:158, range:60, attack_speed:1.32, type:'cone' },
    deploy_cost:140, max_level:50,
    upgrades:[
      { name:'Oni Giri', desc:'Dano ×1.5', damage_mult:1.5, cost:200 },
      { name:'Tatsumaki', desc:'Alcance ×1.2 | Dano ×1.3', range_mult:1.35, damage_mult:1.3, cost:400 }
    ]
  },
  nami_3: {
    id:'nami_3', name:'Nami', rarity:3, series:'onepiece', playable:true, xp_value:1000, initials:'NA',
    image: 'assets/towers/update1/Nami.png',
    passive:{ type:'ladra', chance:0.05, label:'Gatuna: 5% de chance de gerar +1 Ouro ao atacar' },
    base_stats:{ damage:79, range:90, attack_speed:1.1, type:'cone' },
    deploy_cost:150, max_level:50,
    upgrades:[
      { name:'Thunderbolt Tempo', desc:'Dano ×1.5', damage_mult:1.5, cost:200 },
      { name:'Tornado Tempo', desc:'Vel ×1.3', speed_mult:1.3, cost:350 }
    ]
  },
  usopp_3: {
    id:'usopp_3', name:'Usopp', rarity:3, series:'onepiece', playable:true, xp_value:1000, initials:'US',
    image: 'assets/towers/update1/Usopp.png',
    passive:{ type:'status_on_hit_chance', chance:0.10, status:'paralisia', duration:0.5, label:'Bala de Chumbo: 10% chance de Stun (0.5s)' },
    base_stats:{ damage:92, range:200, attack_speed:0.88, type:'single_target' },
    deploy_cost:160, max_level:50,
    upgrades:[
      { name:'Estilingue Kabuto', desc:'Dano ×1.4', damage_mult:1.4, cost:200 },
      { name:'Firebird Star', desc:'Dano ×1.5 | Alcance ×1.1', damage_mult:1.5, range_mult:1.25, cost:400 }
    ]
  },
  brook_3: {
    id:'brook_3', name:'Brook', rarity:3, series:'onepiece', playable:true, xp_value:1000, initials:'BR',
    image: 'assets/towers/update1/Brook.png',
    passive:{ type:'status_on_hit', status:'freeze', duration:1.5, label:'Soul Solid: Lentidão severa' },
    base_stats:{ damage:66, range:120, attack_speed:1.65, type:'linha' },
    deploy_cost:180, max_level:50,
    upgrades:[
      { name:'Yahazu Giri', desc:'Vel ×1.4', speed_mult:1.4, cost:220 },
      { name:'Nemuri Uta', desc:'Dano ×1.5', damage_mult:1.5, cost:400 }
    ]
  },

  // ── 4⭐ ──
  sanji_4: {
    id:'sanji_4', name:'Sanji', rarity:4, series:'onepiece', playable:true, xp_value:3000, initials:'SJ',
    image: 'assets/towers/update1/Sanji.png',
    passive:{ type:'status_on_hit', status:'burn', dps:30, duration:3, label:'Diable Jambe: Causa Burn' },
    base_stats:{ damage:238, range:65, attack_speed:1.98, type:'single_target' },
    deploy_cost:250, max_level:50,
    upgrades:[
      { name:'Flambage Shot', desc:'Dano ×1.4', damage_mult:1.4, cost:300 },
      { name:'Hell Memories', desc:'Vel ×1.3 | Burn → 50 DPS', speed_mult:1.3, passive_override:{dps:50}, cost:600 }
    ]
  },
  robin_4: {
    id:'robin_4', name:'Robin', rarity:4, series:'onepiece', playable:true, xp_value:3000, initials:'RB',
    image: 'assets/towers/update1/Robin.png',
    passive:{ type:'status_on_hit_chance', chance:0.20, status:'paralisia', duration:1.0, label:'Mil Fleurs: 20% chance de Stun (1s)' },
    base_stats:{ damage:185, range:100, attack_speed:0.99, type:'aoe_full' },
    deploy_cost:300, max_level:50,
    upgrades:[
      { name:'Clutch', desc:'Dano ×1.5', damage_mult:1.5, cost:350 },
      { name:'Gigantesco Mano', desc:'Alcance ×1.2 | Dano ×1.4', range_mult:1.35, damage_mult:1.4, cost:700 }
    ]
  },
  ace_4: {
    id:'ace_4', name:'Ace', rarity:4, series:'onepiece', playable:true, xp_value:3000, initials:'AC',
    image: 'assets/towers/update1/Ace.png',
    passive:{ type:'status_on_hit', status:'burn', dps:60, duration:4, label:'Mera Mera: Dano em chamas massivo' },
    base_stats:{ damage:290, range:110, attack_speed:1.1, type:'cone' },
    deploy_cost:320, max_level:50,
    upgrades:[
      { name:'Hiken', desc:'Dano ×1.5', damage_mult:1.5, cost:400 },
      { name:'Entei', desc:'Dano ×1.6 | Burn → 100 DPS', damage_mult:1.6, passive_override:{dps:100}, cost:800 }
    ]
  },

  // ── 5⭐ ──
  zoro_5: {
    id:'zoro_5', name:'Zoro (Ashura)', rarity:5, series:'onepiece', playable:true, xp_value:10000, initials:'Z5',
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
    passive:{ type:'zoro_burst', label:'Foco Ashura: 3x Dano Base, ataca 3 vezes e descansa 3' },
    base_stats:{ damage:594, range:130, attack_speed:1.32, type:'linha' },
    deploy_cost:600, max_level:50,
    upgrades:[
      { name:'Kiki Kyutoryu', desc:'Dano ×1.4', damage_mult:1.4, cost:700 },
      { name:'Ichidai Sanzen', desc:'Alcance ×1.15 | Dano ×1.5', range_mult:1.30, damage_mult:1.5, cost:1500 }
    ]
  },
  luffy_5: {
    id:'luffy_5', name:'Luffy (Gear 4)', rarity:5, series:'onepiece', playable:true, xp_value:10000, initials:'L4',
    image: 'assets/towers/update1/Luffy G4.png',
    passive:{ type:'silence_buffs', chance:0.3, label:'Haki: 30% chance no 1º hit de anular o buff inimigo' },
    base_stats:{ damage:660, range:100, attack_speed:1.54, type:'aoe' },
    deploy_cost:650, max_level:50,
    upgrades:[
      { name:'Kong Gun', desc:'Dano ×1.4', damage_mult:1.4, cost:800 },
      { name:'King Kong Gun', desc:'Dano ×1.6 | Alcance ×1.1', damage_mult:1.6, range_mult:1.25, cost:1600 }
    ]
  },
  barbabranca_5: {
    id:'barbabranca_5', name:'Barba Branca', rarity:5, series:'onepiece', playable:true, xp_value:10000, initials:'BB',
    image: 'assets/towers/update1/Barba Branca.png',
    passive:{ type:'tsunami', interval:15, hp:5000, label:'Tsunami: Invoca onda reversa na base a cada 15s (HP 5000)' },
    base_stats:{ damage:554, range:150, attack_speed:0.88, type:'linha' },
    deploy_cost:700, max_level:50,
    upgrades:[
      { name:'Gura Gura', desc:'Dano ×1.4 | Tsunami HP 8000', damage_mult:1.4, passive_override:{hp:8000}, cost:900 },
      { name:'Terremoto', desc:'Dano ×1.5 | Tsunami HP 15000', damage_mult:1.5, passive_override:{hp:15000}, cost:1800 }
    ]
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // UNIDADES DE EVENTO EXCLUSIVAS
  // ──────────────────────────────────────────────────────────────────────────
  orochimaru_base: {
    id:'orochimaru_base', name:'Orochimaru', rarity:4, series:'naruto', playable:true, xp_value:4000, initials:'OR',
    image: 'assets/towers/update1/Orochimaru.png',
    passive:[
      { type:'status_on_hit', status:'sangramento', dps:20, duration:3, label:'Marca da Maldição: Aplica DoT venenoso' },
      { type:'edo_tensei_economy', label:'Imortalidade: Vende por 100% do ouro investido' }
    ],
    base_stats:{ damage:115, range:120, attack_speed:1.1, type:'cone' },
    deploy_cost:450, max_level:50,
    upgrades:[
      { name:'Serpente Branca', desc:'Dano ×1.3 | Veneno 35 DPS', damage_mult:1.3, passive_override:{dps:35, duration:3}, cost:500 },
      { name:'Kusanagi',        desc:'Tipo → AOE | Dano ×1.5 | Veneno 60 DPS', type:'aoe', damage_mult:1.5, passive_override:{dps:60, duration:4}, cost:950 }
    ]
  },
  pain_base: {
    id:'pain_base', name:'Pain (Seis Caminhos)', rarity:5, series:'naruto', playable:true, xp_value:10000, initials:'PN',
    image: 'assets/towers/update1/Pain.png',
    passive:[
      { type:'sharingan', label:'Rinnegan: Ignora qualquer imunidade do inimigo (Bypass)' },
      { type:'bansho_tenin', attacks_required:4, push_dist:35, label:'Bansho Ten\'in: A cada 4 ataques, puxa os inimigos para trás' }
    ],
    base_stats:{ damage:210, range:150, attack_speed:0.85, type:'aoe' },
    deploy_cost:800, max_level:50,
    upgrades:[
      { name:'Puxão Sombrio', desc:'Dano ×1.4 | Puxa mais forte (50px)', damage_mult:1.4, passive_override:{attacks_required:4, push_dist:50}, cost:1100 },
      { name:'Devastação',   desc:'Dano ×1.8 | Alcance ×1.2', damage_mult:1.8, range_mult:1.2, cost:2500 }
    ]
  }
};

// Full pool — usado pelo BannerSystem
const ALL_CHARACTERS_POOL = {
  star3: ['ichigo_base','goku_base','l_deathnote','demolidor','sasuke_uchiha','killua_zoldyck','tanjiro_kamado','zoro_3','luffy_3','nami_3','usopp_3','brook_3'],
  star4: ['naruto_shippuden','levi_ackerman','meliodas_base','sanji_4','robin_4','ace_4'],
  star5: ['gojo_satoru','zoro_5','luffy_5']
};

// Populado em runtime por BannerSystem.init()
const GACHA_POOL = { star3:[], star4:[], star5:[] };

const RARITY_COLORS = { 0:'#666',1:'#27ae60',2:'#2980b9',3:'#9b59b6',4:'#e67e22',5:'#f1c40f' };
const RARITY_LABELS = { 0:'0⭐',1:'1⭐',2:'2⭐',3:'3⭐',4:'4⭐',5:'5⭐' };
const SERIES_LABELS  = {
  naruto:'Naruto', bleach:'Bleach', dragonball:'Dragon Ball',
  deathnote:'Death Note', marvel:'Marvel', onepiece:'One Piece',
  hxh:'HxH', kimetsu:'Kimetsu', snk:'SNK', nanatsu:'7DS', jjk:'JJK'
};

function getCharById(id) { return CHARACTERS[id] || null; }
function getPlayable()   { return Object.values(CHARACTERS).filter(c => c.playable); }

function charIconInner(char) {
  if (!char) return '?';
  if (char.image) return `<img src="${char.image}" class="char-portrait" alt="${char.name}">`;
  return char.initials;
}

function getCurrentStats(charData, level) {
  const b = level - 1;
  return {
    damage:       charData.base_stats.damage       * (1 + 0.02 * b),
    range:        charData.base_stats.range        * (1 + 0.01 * b),
    attack_speed: charData.base_stats.attack_speed * (1 + 0.01 * b),
    type:         charData.base_stats.type
  };
}

function xpForNextLevel(level) { return level * 100; }

function applyXPToUnit(unitSave, xpGain) {
  unitSave.xp_atual += xpGain;
  while (unitSave.nivel < 50) {
    const needed = xpForNextLevel(unitSave.nivel);
    if (unitSave.xp_atual >= needed) { unitSave.xp_atual -= needed; unitSave.nivel++; }
    else break;
  }
}
