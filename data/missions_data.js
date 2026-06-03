// ─────────────────────────────────────────────────────────────────────────────
// MISSIONS_LIST — lista de todas as missões do jogo.
//
// Campos:
//   id       → identificador único
//   label    → texto exibido ao jogador
//   type     → tipo de verificação (veja MISSION_CHECKERS em missions.js)
//   stat     → (stat_threshold) chave em Save.stats
//   target   → (stat_threshold) valor alvo
//   reward   → objeto { tickets?, gems?, materials?: [{id, qty}] }
//
// Para criar uma nova missão: defina o type, preencha os campos que ele usa
// e adicione o reward no formato objeto. Se precisar de um novo type de
// condição, registre-o em MISSION_CHECKERS (missions.js) sem tocar aqui.
// ─────────────────────────────────────────────────────────────────────────────
const MISSIONS_LIST = [
  { id:'dmg_1k',   label:'Cause 1.000 de dano total',               type:'stat_threshold', stat:'dano_total_causado',         target:1000,   reward:{ tickets:1 } },
  { id:'dmg_10k',  label:'Cause 10.000 de dano total',              type:'stat_threshold', stat:'dano_total_causado',         target:10000,  reward:{ tickets:2 } },
  { id:'dmg_50k',  label:'Cause 50.000 de dano total',              type:'stat_threshold', stat:'dano_total_causado',         target:50000,  reward:{ tickets:3 } },
  { id:'kill_50',  label:'Derrote 50 inimigos',                     type:'stat_threshold', stat:'inimigos_derrotados',        target:50,     reward:{ tickets:1 } },
  { id:'kill_200', label:'Derrote 200 inimigos',                    type:'stat_threshold', stat:'inimigos_derrotados',        target:200,    reward:{ tickets:2 } },
  { id:'kill_500', label:'Derrote 500 inimigos',                    type:'stat_threshold', stat:'inimigos_derrotados',        target:500,    reward:{ tickets:3 } },
  { id:'place_5',  label:'Coloque 5 torres em campo',               type:'stat_threshold', stat:'torres_colocadas',           target:5,      reward:{ tickets:1 } },
  { id:'place_20', label:'Coloque 20 torres em campo',              type:'stat_threshold', stat:'torres_colocadas',           target:20,     reward:{ tickets:2 } },
  { id:'stage_1',  label:'Complete 1 fase',                         type:'stat_threshold', stat:'fases_completas',            target:1,      reward:{ tickets:1 } },
  { id:'stage_3',  label:'Complete 3 fases',                        type:'stat_threshold', stat:'fases_completas',            target:3,      reward:{ tickets:2 } },
  { id:'stage_all',label:'Complete todas as fases do Mundo Naruto', type:'stat_threshold', stat:'fases_naruto_completas',     target:6,      reward:{ tickets:5 } },
  { id:'pull_1',   label:'Role o banner 1 vez',                     type:'stat_threshold', stat:'pulls_realizados',           target:1,      reward:{ tickets:1 } },
  { id:'pull_5',   label:'Role o banner 5 vezes',                   type:'stat_threshold', stat:'pulls_realizados',           target:5,      reward:{ tickets:2 } },
  { id:'pull_10',  label:'Role o banner 10 vezes',                  type:'stat_threshold', stat:'pulls_realizados',           target:10,     reward:{ tickets:3 } },
  { id:'feed_1',   label:'Alimente uma unidade 1 vez',              type:'stat_threshold', stat:'feeds_realizados',           target:1,      reward:{ tickets:1 } },
  { id:'evolve_1', label:'Evolua uma unidade',                      type:'stat_threshold', stat:'evolucoes_realizadas',       target:1,      reward:{ tickets:3 } },
  { id:'get4',     label:'Obtenha uma unidade 4⭐',                 type:'stat_threshold', stat:'unidades_4estrelas_obtidas', target:1,      reward:{ tickets:2 } },
  { id:'get5',     label:'Obtenha uma unidade 5⭐',                 type:'stat_threshold', stat:'unidades_5estrelas_obtidas', target:1,      reward:{ tickets:5 } },
  { id:'miniboss', label:'Derrote um miniboss',                     type:'stat_threshold', stat:'minibosses_derrotados',      target:1,      reward:{ tickets:2 } },
  { id:'pain',     label:'Derrote o Boss Pain',                     type:'stat_threshold', stat:'boss_pain_derrotado',        target:1,      reward:{ tickets:5 } }
];

function getMissionById(id) { return MISSIONS_LIST.find(m => m.id === id); }
