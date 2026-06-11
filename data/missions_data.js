// ── Conquistas (fixas, completáveis uma única vez) ─────────────────────────────
const MISSIONS_LIST = [

  // ── Dano total ──────────────────────────────────────────────────────────────
  { id:'dmg_1k',    label:'Cause 1.000 de dano total',        type:'stat_threshold', stat:'dano_total_causado',         target:1_000,       reward:{ gems:20  } },
  { id:'dmg_10k',   label:'Cause 10.000 de dano total',       type:'stat_threshold', stat:'dano_total_causado',         target:10_000,      reward:{ gems:50  } },
  { id:'dmg_50k',   label:'Cause 50.000 de dano total',       type:'stat_threshold', stat:'dano_total_causado',         target:50_000,      reward:{ gems:100 } },
  { id:'dmg_200k',  label:'Cause 200.000 de dano total',      type:'stat_threshold', stat:'dano_total_causado',         target:200_000,     reward:{ gems:200 } },
  { id:'dmg_1m',    label:'Cause 1.000.000 de dano total',    type:'stat_threshold', stat:'dano_total_causado',         target:1_000_000,   reward:{ gems:400 } },
  { id:'dmg_5m',    label:'Cause 5.000.000 de dano total',    type:'stat_threshold', stat:'dano_total_causado',         target:5_000_000,   reward:{ tickets:5 } },

  // ── Inimigos derrotados ─────────────────────────────────────────────────────
  { id:'kill_50',   label:'Derrote 50 inimigos',              type:'stat_threshold', stat:'inimigos_derrotados',        target:50,          reward:{ gems:30  } },
  { id:'kill_200',  label:'Derrote 200 inimigos',             type:'stat_threshold', stat:'inimigos_derrotados',        target:200,         reward:{ gems:60  } },
  { id:'kill_500',  label:'Derrote 500 inimigos',             type:'stat_threshold', stat:'inimigos_derrotados',        target:500,         reward:{ gems:100 } },
  { id:'kill_2000', label:'Derrote 2.000 inimigos',           type:'stat_threshold', stat:'inimigos_derrotados',        target:2_000,       reward:{ gems:200 } },
  { id:'kill_5k',   label:'Derrote 5.000 inimigos',           type:'stat_threshold', stat:'inimigos_derrotados',        target:5_000,       reward:{ gems:350 } },
  { id:'kill_10k',  label:'Derrote 10.000 inimigos',          type:'stat_threshold', stat:'inimigos_derrotados',        target:10_000,      reward:{ tickets:5 } },

  // ── Torres colocadas ────────────────────────────────────────────────────────
  { id:'place_5',   label:'Coloque 5 torres em campo',        type:'stat_threshold', stat:'torres_colocadas',           target:5,           reward:{ tickets:1 } },
  { id:'place_20',  label:'Coloque 20 torres em campo',       type:'stat_threshold', stat:'torres_colocadas',           target:20,          reward:{ tickets:2 } },
  { id:'place_50',  label:'Coloque 50 torres em campo',       type:'stat_threshold', stat:'torres_colocadas',           target:50,          reward:{ gems:80  } },
  { id:'place_100', label:'Coloque 100 torres em campo',      type:'stat_threshold', stat:'torres_colocadas',           target:100,         reward:{ gems:150 } },
  { id:'place_300', label:'Coloque 300 torres em campo',      type:'stat_threshold', stat:'torres_colocadas',           target:300,         reward:{ tickets:5 } },

  // ── Fases gerais ────────────────────────────────────────────────────────────
  { id:'stage_1',   label:'Complete 1 fase',                  type:'stat_threshold', stat:'fases_completas',            target:1,           reward:{ tickets:1 } },
  { id:'stage_3',   label:'Complete 3 fases',                 type:'stat_threshold', stat:'fases_completas',            target:3,           reward:{ tickets:2 } },
  { id:'stage_10',  label:'Complete 10 fases',                type:'stat_threshold', stat:'fases_completas',            target:10,          reward:{ gems:100 } },

  // ── Mundo Naruto ────────────────────────────────────────────────────────────
  { id:'stage_all',     label:'Complete todas as fases do Mundo Naruto',   type:'stat_threshold', stat:'fases_naruto_completas', target:6, reward:{ tickets:5, crystals:150 } },

  // ── Grand Line (One Piece) ──────────────────────────────────────────────────
  { id:'stage_op',      label:'Complete todas as fases da Grand Line',      type:'stat_threshold', stat:'fases_op_completas',    target:6, reward:{ tickets:5, crystals:150 } },

  // ── Soul Society (Bleach) ───────────────────────────────────────────────────
  { id:'stage_bleach',  label:'Complete todas as fases da Soul Society',    type:'stat_threshold', stat:'fases_bleach_completas', target:6, reward:{ tickets:5, crystals:150 } },

  // ── Nova York (Marvel) ──────────────────────────────────────────────────────
  { id:'stage_marvel',  label:'Complete todas as fases de Nova York',       type:'stat_threshold', stat:'fases_marvel_completas', target:6,  reward:{ tickets:5, crystals:150 } },

  // ── Metrópolis (DC) ─────────────────────────────────────────────────────────
  { id:'stage_dc',      label:'Complete todas as fases de Metrópolis',      type:'stat_threshold', stat:'fases_dc_completas',     target:6,  reward:{ tickets:5, crystals:150 } },

  // ── Conquistador de Mundos (todos os 5 mundos) ──────────────────────────────
  { id:'stage_all_worlds', label:'Complete todos os mundos (30 fases)',     type:'stat_threshold', stat:'fases_completas',        target:30, reward:{ tickets:10, crystals:500 } },

  // ── Modo Infinito ───────────────────────────────────────────────────────────
  { id:'inf_wave5',    label:'Alcance a onda 5 no Modo Infinito',   type:'stat_threshold', stat:'melhor_onda_infinita',   target:5,   reward:{ gems:40,  crystals:50  } },
  { id:'inf_wave10',   label:'Alcance a onda 10 no Modo Infinito',  type:'stat_threshold', stat:'melhor_onda_infinita',   target:10,  reward:{ gems:80,  crystals:100 } },
  { id:'inf_wave25',   label:'Alcance a onda 25 no Modo Infinito',  type:'stat_threshold', stat:'melhor_onda_infinita',   target:25,  reward:{ gems:150, crystals:200 } },
  { id:'inf_wave50',   label:'Alcance a onda 50 no Modo Infinito',  type:'stat_threshold', stat:'melhor_onda_infinita',   target:50,  reward:{ gems:300, crystals:400 } },
  { id:'inf_total50',  label:'Sobreviva a 50 ondas no Modo Infinito (total)', type:'stat_threshold', stat:'ondas_infinito', target:50,  reward:{ gems:50,  crystals:80  } },
  { id:'inf_total200', label:'Sobreviva a 200 ondas no Modo Infinito (total)',type:'stat_threshold', stat:'ondas_infinito', target:200, reward:{ gems:150, crystals:200 } },

  // ── Minibosses ──────────────────────────────────────────────────────────────
  { id:'miniboss',    label:'Derrote 1 miniboss',             type:'stat_threshold', stat:'minibosses_derrotados',      target:1,           reward:{ tickets:2 } },
  { id:'miniboss_5',  label:'Derrote 5 minibosses',           type:'stat_threshold', stat:'minibosses_derrotados',      target:5,           reward:{ tickets:3 } },
  { id:'miniboss_20', label:'Derrote 20 minibosses',          type:'stat_threshold', stat:'minibosses_derrotados',      target:20,          reward:{ gems:200 } },
  { id:'miniboss_50', label:'Derrote 50 minibosses',          type:'stat_threshold', stat:'minibosses_derrotados',      target:50,          reward:{ tickets:8 } },

  // ── Boss Pain ───────────────────────────────────────────────────────────────
  { id:'pain',        label:'Derrote o Boss Pain pela primeira vez',        type:'stat_threshold', stat:'boss_pain_derrotado',   target:1, reward:{ tickets:5 } },

  // ── Gacha ───────────────────────────────────────────────────────────────────
  { id:'pull_1',   label:'Role o banner 1 vez',               type:'stat_threshold', stat:'pulls_realizados',           target:1,           reward:{ tickets:1 } },
  { id:'pull_5',   label:'Role o banner 5 vezes',             type:'stat_threshold', stat:'pulls_realizados',           target:5,           reward:{ tickets:2 } },
  { id:'pull_10',  label:'Role o banner 10 vezes',            type:'stat_threshold', stat:'pulls_realizados',           target:10,          reward:{ tickets:3 } },
  { id:'pull_50',  label:'Role o banner 50 vezes',            type:'stat_threshold', stat:'pulls_realizados',           target:50,          reward:{ gems:150 } },
  { id:'pull_100', label:'Role o banner 100 vezes',           type:'stat_threshold', stat:'pulls_realizados',           target:100,         reward:{ tickets:5 } },
  { id:'pull_300', label:'Role o banner 300 vezes',           type:'stat_threshold', stat:'pulls_realizados',           target:300,         reward:{ tickets:10 } },

  // ── Raridade ────────────────────────────────────────────────────────────────
  { id:'get4',     label:'Obtenha uma unidade 4⭐',           type:'stat_threshold', stat:'unidades_4estrelas_obtidas', target:1,           reward:{ tickets:2 } },
  { id:'get5',     label:'Obtenha uma unidade 5⭐',           type:'stat_threshold', stat:'unidades_5estrelas_obtidas', target:1,           reward:{ tickets:5 } },
  { id:'get5_x3',  label:'Obtenha 3 unidades 5⭐',           type:'stat_threshold', stat:'unidades_5estrelas_obtidas', target:3,           reward:{ tickets:10 } },

  // ── Coleção de personagens ──────────────────────────────────────────────────
  { id:'col_5',    label:'Colecione 5 personagens diferentes',   type:'unit_count', target:5,   reward:{ tickets:2 } },
  { id:'col_10',   label:'Colecione 10 personagens diferentes',  type:'unit_count', target:10,  reward:{ gems:100 } },
  { id:'col_20',   label:'Colecione 20 personagens diferentes',  type:'unit_count', target:20,  reward:{ gems:200 } },
  { id:'col_30',   label:'Colecione 30 personagens diferentes',  type:'unit_count', target:30,  reward:{ tickets:5 } },
  { id:'col_40',   label:'Colecione 40 personagens diferentes',  type:'unit_count', target:40,  reward:{ tickets:10 } },

  // ── Progressão ──────────────────────────────────────────────────────────────
  { id:'feed_1',    label:'Alimente uma unidade',              type:'stat_threshold', stat:'feeds_realizados',          target:1,           reward:{ tickets:1 } },
  { id:'feed_10',   label:'Alimente 10 unidades',              type:'stat_threshold', stat:'feeds_realizados',          target:10,          reward:{ gems:50  } },
  { id:'feed_30',   label:'Alimente 30 unidades',              type:'stat_threshold', stat:'feeds_realizados',          target:30,          reward:{ gems:150 } },
  { id:'feed_50',   label:'Alimente 50 unidades',              type:'stat_threshold', stat:'feeds_realizados',          target:50,          reward:{ gems:300 } },
  { id:'feed_100',  label:'Alimente 100 unidades',             type:'stat_threshold', stat:'feeds_realizados',          target:100,         reward:{ tickets:5 } },
  { id:'evolve_1',  label:'Evolua uma unidade',                type:'stat_threshold', stat:'evolucoes_realizadas',      target:1,           reward:{ gems:100 } },
  { id:'evolve_3',  label:'Evolua 3 unidades',                 type:'stat_threshold', stat:'evolucoes_realizadas',      target:3,           reward:{ tickets:3 } },
  { id:'evolve_5',  label:'Evolua 5 unidades',                 type:'stat_threshold', stat:'evolucoes_realizadas',      target:5,           reward:{ tickets:5 } },
  { id:'evolve_10', label:'Evolua 10 unidades',                type:'stat_threshold', stat:'evolucoes_realizadas',      target:10,          reward:{ gems:250 } },

  // ── Torres ──────────────────────────────────────────────────────────────────
  { id:'place_500',  label:'Coloque 500 torres em campo',      type:'stat_threshold', stat:'torres_colocadas',          target:500,         reward:{ tickets:8 } },
  { id:'place_1000', label:'Coloque 1.000 torres em campo',    type:'stat_threshold', stat:'torres_colocadas',          target:1_000,       reward:{ tickets:15 } },

  // ── Inimigos (extremos) ─────────────────────────────────────────────────────
  { id:'kill_15k',  label:'Derrote 15.000 inimigos',           type:'stat_threshold', stat:'inimigos_derrotados',       target:15_000,      reward:{ tickets:5 } },
  { id:'kill_25k',  label:'Derrote 25.000 inimigos',           type:'stat_threshold', stat:'inimigos_derrotados',       target:25_000,      reward:{ tickets:8 } },
  { id:'kill_50k',  label:'Derrote 50.000 inimigos',           type:'stat_threshold', stat:'inimigos_derrotados',       target:50_000,      reward:{ tickets:15 } },

  // ── Dano (extremos) ─────────────────────────────────────────────────────────
  { id:'dmg_10m',   label:'Cause 10.000.000 de dano total',    type:'stat_threshold', stat:'dano_total_causado',        target:10_000_000,  reward:{ tickets:8 } },
  { id:'dmg_50m',   label:'Cause 50.000.000 de dano total',    type:'stat_threshold', stat:'dano_total_causado',        target:50_000_000,  reward:{ tickets:15 } },
  { id:'dmg_100m',  label:'Cause 100.000.000 de dano total',   type:'stat_threshold', stat:'dano_total_causado',        target:100_000_000, reward:{ tickets:20 } },

  // ── Fases (extremos) ────────────────────────────────────────────────────────
  { id:'stage_25',  label:'Complete 25 fases',                 type:'stat_threshold', stat:'fases_completas',           target:25,          reward:{ gems:200 } },
  { id:'stage_50',  label:'Complete 50 fases',                 type:'stat_threshold', stat:'fases_completas',           target:50,          reward:{ tickets:5 } },
  { id:'stage_100', label:'Complete 100 fases',                type:'stat_threshold', stat:'fases_completas',           target:100,         reward:{ tickets:15 } },

  // ── Modo Infinito (extremos) ────────────────────────────────────────────────
  { id:'inf_wave75',   label:'Alcance a onda 75 no Modo Infinito',  type:'stat_threshold', stat:'melhor_onda_infinita', target:75,   reward:{ gems:400 } },
  { id:'inf_wave100',  label:'Alcance a onda 100 no Modo Infinito', type:'stat_threshold', stat:'melhor_onda_infinita', target:100,  reward:{ tickets:10 } },
  { id:'inf_wave150',  label:'Alcance a onda 150 no Modo Infinito', type:'stat_threshold', stat:'melhor_onda_infinita', target:150,  reward:{ tickets:15 } },
  { id:'inf_wave200',  label:'Alcance a onda 200 no Modo Infinito', type:'stat_threshold', stat:'melhor_onda_infinita', target:200,  reward:{ tickets:20 } },
  { id:'inf_total500', label:'Sobreviva a 500 ondas no Infinito (total)', type:'stat_threshold', stat:'ondas_infinito', target:500,  reward:{ tickets:8 } },

  // ── Gacha (extremos) ────────────────────────────────────────────────────────
  { id:'pull_500',  label:'Role o banner 500 vezes',           type:'stat_threshold', stat:'pulls_realizados',          target:500,         reward:{ tickets:15 } },
  { id:'get5_x5',   label:'Obtenha 5 unidades 5⭐',           type:'stat_threshold', stat:'unidades_5estrelas_obtidas', target:5,           reward:{ tickets:15 } },
  { id:'get5_x10',  label:'Obtenha 10 unidades 5⭐',          type:'stat_threshold', stat:'unidades_5estrelas_obtidas', target:10,          reward:{ tickets:20 } },

  // ── Miniboss (extremos) ─────────────────────────────────────────────────────
  { id:'miniboss_100', label:'Derrote 100 minibosses',         type:'stat_threshold', stat:'minibosses_derrotados',     target:100,         reward:{ tickets:10 } },
];

// ── Missões Diárias — pool sorteia 15 por dia (baseado na data) ────────────────
const DAILY_MISSIONS_POOL = [
  // ── Kills ──────────────────────────────────────────────────────────────────
  { id:'d_kill_30',    label:'Derrote 30 inimigos',           type:'stat_delta', stat:'inimigos_derrotados',    target:30,      reward:{ gems:20  } },
  { id:'d_kill_50',    label:'Derrote 50 inimigos',           type:'stat_delta', stat:'inimigos_derrotados',    target:50,      reward:{ gems:30  } },
  { id:'d_kill_80',    label:'Derrote 80 inimigos',           type:'stat_delta', stat:'inimigos_derrotados',    target:80,      reward:{ gems:40  } },
  { id:'d_kill_150',   label:'Derrote 150 inimigos',          type:'stat_delta', stat:'inimigos_derrotados',    target:150,     reward:{ gems:70  } },
  { id:'d_kill_300',   label:'Derrote 300 inimigos',          type:'stat_delta', stat:'inimigos_derrotados',    target:300,     reward:{ gems:100 } },
  { id:'d_kill_500',   label:'Derrote 500 inimigos',          type:'stat_delta', stat:'inimigos_derrotados',    target:500,     reward:{ gems:160 } },
  { id:'d_kill_1000',  label:'Derrote 1.000 inimigos',        type:'stat_delta', stat:'inimigos_derrotados',    target:1_000,   reward:{ gems:280 } },
  // ── Dano ───────────────────────────────────────────────────────────────────
  { id:'d_dmg_500',    label:'Cause 500 de dano',             type:'stat_delta', stat:'dano_total_causado',     target:500,     reward:{ gems:10  } },
  { id:'d_dmg_5k',     label:'Cause 5.000 de dano',           type:'stat_delta', stat:'dano_total_causado',     target:5_000,   reward:{ gems:20  } },
  { id:'d_dmg_30k',    label:'Cause 30.000 de dano',          type:'stat_delta', stat:'dano_total_causado',     target:30_000,  reward:{ gems:50  } },
  { id:'d_dmg_100k',   label:'Cause 100.000 de dano',         type:'stat_delta', stat:'dano_total_causado',     target:100_000, reward:{ gems:90  } },
  { id:'d_dmg_300k',   label:'Cause 300.000 de dano',         type:'stat_delta', stat:'dano_total_causado',     target:300_000, reward:{ gems:130 } },
  { id:'d_dmg_1m',     label:'Cause 1.000.000 de dano',       type:'stat_delta', stat:'dano_total_causado',     target:1_000_000, reward:{ gems:250 } },
  // ── Fases gerais ───────────────────────────────────────────────────────────
  { id:'d_stage_1',    label:'Complete 1 fase',               type:'stat_delta', stat:'fases_completas',        target:1,       reward:{ gems:30  } },
  { id:'d_stage_3',    label:'Complete 3 fases',              type:'stat_delta', stat:'fases_completas',        target:3,       reward:{ gems:80  } },
  { id:'d_stage_5',    label:'Complete 5 fases',              type:'stat_delta', stat:'fases_completas',        target:5,       reward:{ gems:120 } },
  { id:'d_stage_8',    label:'Complete 8 fases',              type:'stat_delta', stat:'fases_completas',        target:8,       reward:{ gems:200 } },
  { id:'d_stage_10',   label:'Complete 10 fases',             type:'stat_delta', stat:'fases_completas',        target:10,      reward:{ gems:300 } },
  // ── Fases por mundo ────────────────────────────────────────────────────────
  { id:'d_stage_naruto_1', label:'Complete 1 fase no Mundo Naruto',   type:'stat_delta', stat:'fases_naruto_jogadas', target:1, reward:{ gems:50  } },
  { id:'d_stage_naruto_3', label:'Complete 3 fases no Mundo Naruto',  type:'stat_delta', stat:'fases_naruto_jogadas', target:3, reward:{ gems:120 } },
  { id:'d_stage_op_1',     label:'Complete 1 fase na Grand Line',     type:'stat_delta', stat:'fases_op_jogadas',     target:1, reward:{ gems:50  } },
  { id:'d_stage_op_3',     label:'Complete 3 fases na Grand Line',    type:'stat_delta', stat:'fases_op_jogadas',     target:3, reward:{ gems:120 } },
  { id:'d_stage_bleach_1', label:'Complete 1 fase na Soul Society',   type:'stat_delta', stat:'fases_bleach_jogadas', target:1, reward:{ gems:50  } },
  { id:'d_stage_bleach_3', label:'Complete 3 fases na Soul Society',  type:'stat_delta', stat:'fases_bleach_jogadas', target:3, reward:{ gems:120 } },
  { id:'d_stage_marvel_1', label:'Complete 1 fase em Nova York',      type:'stat_delta', stat:'fases_marvel_jogadas', target:1, reward:{ gems:50  } },
  { id:'d_stage_marvel_3', label:'Complete 3 fases em Nova York',     type:'stat_delta', stat:'fases_marvel_jogadas', target:3, reward:{ gems:120 } },
  { id:'d_stage_dc_1',     label:'Complete 1 fase em Metrópolis',     type:'stat_delta', stat:'fases_dc_jogadas',     target:1, reward:{ gems:50  } },
  { id:'d_stage_dc_3',     label:'Complete 3 fases em Metrópolis',    type:'stat_delta', stat:'fases_dc_jogadas',     target:3, reward:{ gems:120 } },
  // ── Gacha ──────────────────────────────────────────────────────────────────
  { id:'d_pull_1',     label:'Role o banner 1 vez',           type:'stat_delta', stat:'pulls_realizados',       target:1,       reward:{ tickets:3 } },
  { id:'d_pull_3',     label:'Role o banner 3 vezes',         type:'stat_delta', stat:'pulls_realizados',       target:3,       reward:{ tickets:5 } },
  { id:'d_pull_5',     label:'Role o banner 5 vezes',         type:'stat_delta', stat:'pulls_realizados',       target:5,       reward:{ tickets:8 } },
  { id:'d_pull_10',    label:'Role o banner 10 vezes',        type:'stat_delta', stat:'pulls_realizados',       target:10,      reward:{ tickets:15 } },
  // ── Torres ─────────────────────────────────────────────────────────────────
  { id:'d_tower_3',    label:'Coloque 3 torres em campo',     type:'stat_delta', stat:'torres_colocadas',       target:3,       reward:{ gems:15  } },
  { id:'d_tower_8',    label:'Coloque 8 torres em campo',     type:'stat_delta', stat:'torres_colocadas',       target:8,       reward:{ gems:25  } },
  { id:'d_tower_15',   label:'Coloque 15 torres em campo',    type:'stat_delta', stat:'torres_colocadas',       target:15,      reward:{ gems:50  } },
  { id:'d_tower_25',   label:'Coloque 25 torres em campo',    type:'stat_delta', stat:'torres_colocadas',       target:25,      reward:{ gems:80  } },
  // ── Miniboss ───────────────────────────────────────────────────────────────
  { id:'d_miniboss',   label:'Derrote 1 miniboss',            type:'stat_delta', stat:'minibosses_derrotados',  target:1,       reward:{ gems:60  } },
  { id:'d_miniboss_3', label:'Derrote 3 minibosses',          type:'stat_delta', stat:'minibosses_derrotados',  target:3,       reward:{ tickets:3 } },
  { id:'d_miniboss_5', label:'Derrote 5 minibosses',          type:'stat_delta', stat:'minibosses_derrotados',  target:5,       reward:{ gems:200 } },
  // ── Modo Infinito ──────────────────────────────────────────────────────────
  { id:'d_inf_5',      label:'Sobreviva a 5 ondas no Infinito',   type:'stat_delta', stat:'ondas_infinito',     target:5,       reward:{ gems:40  } },
  { id:'d_inf_10',     label:'Sobreviva a 10 ondas no Infinito',  type:'stat_delta', stat:'ondas_infinito',     target:10,      reward:{ gems:70  } },
  { id:'d_inf_20',     label:'Sobreviva a 20 ondas no Infinito',  type:'stat_delta', stat:'ondas_infinito',     target:20,      reward:{ gems:120 } },
  // ── Progressão ─────────────────────────────────────────────────────────────
  { id:'d_evolve',     label:'Evolua 1 unidade',              type:'stat_delta', stat:'evolucoes_realizadas',   target:1,       reward:{ gems:50  } },
  { id:'d_evolve_3',   label:'Evolua 3 unidades',             type:'stat_delta', stat:'evolucoes_realizadas',   target:3,       reward:{ gems:150 } },
  { id:'d_feed',       label:'Alimente 3 unidades',           type:'stat_delta', stat:'feeds_realizados',       target:3,       reward:{ gems:30  } },
  { id:'d_feed_10',    label:'Alimente 10 unidades',          type:'stat_delta', stat:'feeds_realizados',       target:10,      reward:{ gems:70  } },
];

// Seleção determinística: data ISO → 10 missões únicas por dia.
function getDailyMissions(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0;
  }
  const rng = () => {
    h ^= h >>> 13;
    h  = Math.imul(h, 1540483477) | 0;
    h ^= h >>> 15;
    return Math.abs(h) / 2147483647;
  };
  const pool = [...DAILY_MISSIONS_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 15);
}

function getMissionById(id) {
  return MISSIONS_LIST.find(m => m.id === id)
      || DAILY_MISSIONS_POOL.find(m => m.id === id)
      || null;
}
