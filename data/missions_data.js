// ── Conquistas (fixas, completáveis uma única vez) ─────────────────────────────
const MISSIONS_LIST = [
  // Dano
  { id:'dmg_1k',    label:'Cause 1.000 de dano total',               type:'stat_threshold', stat:'dano_total_causado',          target:1000,    reward:{ gems:20  } },
  { id:'dmg_10k',   label:'Cause 10.000 de dano total',              type:'stat_threshold', stat:'dano_total_causado',          target:10000,   reward:{ gems:50  } },
  { id:'dmg_50k',   label:'Cause 50.000 de dano total',              type:'stat_threshold', stat:'dano_total_causado',          target:50000,   reward:{ gems:100 } },
  { id:'dmg_200k',  label:'Cause 200.000 de dano total',             type:'stat_threshold', stat:'dano_total_causado',          target:200000,  reward:{ gems:200 } },
  // Inimigos
  { id:'kill_50',   label:'Derrote 50 inimigos',                     type:'stat_threshold', stat:'inimigos_derrotados',         target:50,      reward:{ gems:30  } },
  { id:'kill_200',  label:'Derrote 200 inimigos',                    type:'stat_threshold', stat:'inimigos_derrotados',         target:200,     reward:{ gems:60  } },
  { id:'kill_500',  label:'Derrote 500 inimigos',                    type:'stat_threshold', stat:'inimigos_derrotados',         target:500,     reward:{ gems:100 } },
  { id:'kill_2000', label:'Derrote 2.000 inimigos',                  type:'stat_threshold', stat:'inimigos_derrotados',         target:2000,    reward:{ gems:200 } },
  // Torres
  { id:'place_5',   label:'Coloque 5 torres em campo',               type:'stat_threshold', stat:'torres_colocadas',            target:5,       reward:{ tickets:1 } },
  { id:'place_20',  label:'Coloque 20 torres em campo',              type:'stat_threshold', stat:'torres_colocadas',            target:20,      reward:{ tickets:2 } },
  { id:'place_50',  label:'Coloque 50 torres em campo',              type:'stat_threshold', stat:'torres_colocadas',            target:50,      reward:{ gems:80  } },
  // Fases
  { id:'stage_1',   label:'Complete 1 fase',                         type:'stat_threshold', stat:'fases_completas',             target:1,       reward:{ tickets:1 } },
  { id:'stage_3',   label:'Complete 3 fases',                        type:'stat_threshold', stat:'fases_completas',             target:3,       reward:{ tickets:2 } },
  { id:'stage_all', label:'Complete todas as fases do Mundo Naruto', type:'stat_threshold', stat:'fases_naruto_completas',      target:6,       reward:{ tickets:5 } },
  // Gacha
  { id:'pull_1',    label:'Role o banner 1 vez',                     type:'stat_threshold', stat:'pulls_realizados',            target:1,       reward:{ tickets:1 } },
  { id:'pull_5',    label:'Role o banner 5 vezes',                   type:'stat_threshold', stat:'pulls_realizados',            target:5,       reward:{ tickets:2 } },
  { id:'pull_10',   label:'Role o banner 10 vezes',                  type:'stat_threshold', stat:'pulls_realizados',            target:10,      reward:{ tickets:3 } },
  { id:'pull_50',   label:'Role o banner 50 vezes',                  type:'stat_threshold', stat:'pulls_realizados',            target:50,      reward:{ gems:150 } },
  // Progressão
  { id:'feed_1',    label:'Alimente uma unidade',                    type:'stat_threshold', stat:'feeds_realizados',            target:1,       reward:{ tickets:1 } },
  { id:'evolve_1',  label:'Evolua uma unidade',                      type:'stat_threshold', stat:'evolucoes_realizadas',        target:1,       reward:{ gems:100 } },
  // Raridade
  { id:'get4',      label:'Obtenha uma unidade 4⭐',                 type:'stat_threshold', stat:'unidades_4estrelas_obtidas',  target:1,       reward:{ tickets:2 } },
  { id:'get5',      label:'Obtenha uma unidade 5⭐',                 type:'stat_threshold', stat:'unidades_5estrelas_obtidas',  target:1,       reward:{ tickets:5 } },
  // Boss
  { id:'miniboss',  label:'Derrote um miniboss',                     type:'stat_threshold', stat:'minibosses_derrotados',       target:1,       reward:{ tickets:2 } },
  { id:'pain',      label:'Derrote o Boss Pain',                     type:'stat_threshold', stat:'boss_pain_derrotado',         target:1,       reward:{ tickets:5 } },
];

// ── Missões Diárias — pool sorteia 3 por dia (baseado na data) ─────────────────
const DAILY_MISSIONS_POOL = [
  { id:'d_kill_30',   label:'Derrote 30 inimigos',       type:'stat_delta', stat:'inimigos_derrotados',    target:30,      reward:{ gems:20  } },
  { id:'d_kill_80',   label:'Derrote 80 inimigos',       type:'stat_delta', stat:'inimigos_derrotados',    target:80,      reward:{ gems:40  } },
  { id:'d_kill_150',  label:'Derrote 150 inimigos',      type:'stat_delta', stat:'inimigos_derrotados',    target:150,     reward:{ gems:70  } },
  { id:'d_dmg_5k',    label:'Cause 5.000 de dano',       type:'stat_delta', stat:'dano_total_causado',     target:5000,    reward:{ gems:20  } },
  { id:'d_dmg_30k',   label:'Cause 30.000 de dano',      type:'stat_delta', stat:'dano_total_causado',     target:30000,   reward:{ gems:50  } },
  { id:'d_dmg_100k',  label:'Cause 100.000 de dano',     type:'stat_delta', stat:'dano_total_causado',     target:100000,  reward:{ gems:90  } },
  { id:'d_stage_1',   label:'Complete 1 fase',            type:'stat_delta', stat:'fases_completas',        target:1,       reward:{ gems:30  } },
  { id:'d_stage_3',   label:'Complete 3 fases',           type:'stat_delta', stat:'fases_completas',        target:3,       reward:{ gems:80  } },
  { id:'d_pull_1',    label:'Role o banner 1 vez',        type:'stat_delta', stat:'pulls_realizados',       target:1,       reward:{ tickets:3 } },
  { id:'d_pull_5',    label:'Role o banner 5 vezes',      type:'stat_delta', stat:'pulls_realizados',       target:5,       reward:{ tickets:8 } },
  { id:'d_tower_8',   label:'Coloque 8 torres em campo',  type:'stat_delta', stat:'torres_colocadas',       target:8,       reward:{ gems:25  } },
  { id:'d_miniboss',  label:'Derrote 1 miniboss',         type:'stat_delta', stat:'minibosses_derrotados',  target:1,       reward:{ gems:60  } },
];

// Seleção determinística: data ISO → 3 missões únicas por dia.
// Mesmo seed = mesmas missões para o mesmo dia.
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
  return pool.slice(0, 3);
}

function getMissionById(id) {
  return MISSIONS_LIST.find(m => m.id === id)
      || DAILY_MISSIONS_POOL.find(m => m.id === id)
      || null;
}
