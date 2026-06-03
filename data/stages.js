// buildWave: converte grupos de inimigos em fila de spawn com timestamps absolutos
function buildWave(groups) {
  const queue = [];
  let t = 0;
  groups.forEach(g => {
    for (let i = 0; i < g.count; i++) {
      queue.push({ type: g.type, delay: t });
      t += (g.gap !== undefined ? g.gap : 1.5);
    }
  });
  return queue;
}

const STAGES = [

  // ══════════════════════════════════════════════════════
  //  FASE 1 — A Perseguição da Akatsuki
  //  Inimigos: ninja_comum (Normal)
  //  Mini-Boss W10: Deidara (explode → 5 ninjas comuns)
  // ══════════════════════════════════════════════════════
  {
    id: 'fase1', name: 'A Perseguição da Akatsuki', world: 'naruto',
    drops: [
      { id: 'ninja_generico_1', chance: 70 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_3', chance: 10 }
    ],
    waves: [
      // W1 · Abertura — primeiros ninjas aparecem
      buildWave([{type:'ninja_comum',count:6,gap:1.5}]),

      // W2 · Reforço — chegam mais
      buildWave([{type:'ninja_comum',count:7,gap:1.4}]),

      // W3 · Pressão crescente
      buildWave([{type:'ninja_comum',count:8,gap:1.3}]),

      // W4 · Horda rápida
      buildWave([{type:'ninja_comum',count:9,gap:1.2}]),

      // W5 · Respiro/gold — muitos, mas espaçados
      buildWave([{type:'ninja_comum',count:10,gap:1.4}]),

      // W6 · Retomada
      buildWave([{type:'ninja_comum',count:9,gap:1.2}]),

      // W7 · Rush
      buildWave([{type:'ninja_comum',count:10,gap:1.0}]),

      // W8 · Assalto
      buildWave([{type:'ninja_comum',count:11,gap:1.1}]),

      // W9 · Gauntlet pré-boss — pressão máxima
      buildWave([{type:'ninja_comum',count:13,gap:1.0}]),

      // W10 · Deidara — escolta de ninjas + mini-boss
      buildWave([{type:'ninja_comum',count:3,gap:1.5},{type:'deidara',count:1,gap:0}])
    ]
  },

  // ══════════════════════════════════════════════════════
  //  FASE 2 — O Legado de Jiraya
  //  W1–8: ninja_ambu (Normal)
  //  W9–10: ninja_ambu + agente_ambu (Powerful 1) misturados
  //  Mini-Boss W10: Itachi Uchiha (Genjutsu: atordoa torres ao spawnar)
  // ══════════════════════════════════════════════════════
  {
    id: 'fase2', name: 'O Legado de Jiraya', world: 'naruto',
    drops: [
      { id: 'ninja_generico_1', chance: 70 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_3', chance: 10 }
    ],
    waves: [
      // W1 · Ambus chegam
      buildWave([{type:'ninja_ambu',count:5,gap:1.5}]),

      // W2
      buildWave([{type:'ninja_ambu',count:6,gap:1.4}]),

      // W3
      buildWave([{type:'ninja_ambu',count:6,gap:1.3}]),

      // W4
      buildWave([{type:'ninja_ambu',count:7,gap:1.3}]),

      // W5 · Respiro
      buildWave([{type:'ninja_ambu',count:8,gap:1.4}]),

      // W6
      buildWave([{type:'ninja_ambu',count:8,gap:1.1}]),

      // W7
      buildWave([{type:'ninja_ambu',count:9,gap:1.0}]),

      // W8 · Última wave só Normal
      buildWave([{type:'ninja_ambu',count:10,gap:1.0}]),

      // W9 · Primeiro mix: Normal + Powerful 1
      buildWave([
        {type:'ninja_ambu',   count:4, gap:1.2},
        {type:'agente_ambu',  count:2, gap:2.6},
        {type:'ninja_ambu',   count:3, gap:1.2}
      ]),

      // W10 · Mix intenso + Itachi (genjutsu ao spawnar!)
      buildWave([
        {type:'ninja_ambu',  count:3, gap:1.2},
        {type:'agente_ambu', count:2, gap:2.6},
        {type:'itachi_uchiha',count:1,gap:0}
      ])
    ]
  },

  // ══════════════════════════════════════════════════════
  //  FASE 3 — Caminho Para o Poder
  //  W1–7: serpente (Normal)
  //  W8–10: serpente + boa_constritora (Powerful 1) misturados
  //  Mini-Boss W10: Sasuke (Equipe Taka) — drena 1 vida/4s enquanto vivo
  // ══════════════════════════════════════════════════════
  {
    id: 'fase3', name: 'Caminho Para o Poder', world: 'naruto',
    drops: [
      { id: 'ninja_generico_1', chance: 70 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_3', chance: 10 }
    ],
    waves: [
      // W1
      buildWave([{type:'serpente',count:4,gap:1.7}]),

      // W2
      buildWave([{type:'serpente',count:5,gap:1.6}]),

      // W3
      buildWave([{type:'serpente',count:6,gap:1.5}]),

      // W4
      buildWave([{type:'serpente',count:6,gap:1.3}]),

      // W5 · Respiro
      buildWave([{type:'serpente',count:7,gap:1.5}]),

      // W6
      buildWave([{type:'serpente',count:8,gap:1.3}]),

      // W7 · Última wave só Normal
      buildWave([{type:'serpente',count:9,gap:1.1}]),

      // W8 · Primeiro mix
      buildWave([
        {type:'serpente',       count:5, gap:1.2},
        {type:'boa_constritora',count:2, gap:2.8}
      ]),

      // W9 · Mix mais denso
      buildWave([
        {type:'serpente',       count:4, gap:1.2},
        {type:'boa_constritora',count:3, gap:2.6}
      ]),

      // W10 · Mix + Sasuke Taka (drena base!)
      buildWave([
        {type:'serpente',       count:3, gap:1.3},
        {type:'boa_constritora',count:2, gap:2.8},
        {type:'sasuke_taka',    count:1, gap:0}
      ])
    ]
  },

  // ══════════════════════════════════════════════════════
  //  FASE 4 — Infiltração em Konoha
  //  W1–5: caminho_animal (Normal)
  //  W6–10: caminho_animal + caminho_humano (Powerful 1) misturados
  //  Mini-Boss W10: Konan (ao morrer → 3 mini_shinra_tenseis)
  // ══════════════════════════════════════════════════════
  {
    id: 'fase4', name: 'Infiltração em Konoha', world: 'naruto',
    drops: [
      { id: 'ninja_generico_1', chance: 70 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_3', chance: 10 }
    ],
    waves: [
      // W1
      buildWave([{type:'caminho_animal',count:4,gap:1.7}]),

      // W2
      buildWave([{type:'caminho_animal',count:5,gap:1.6}]),

      // W3
      buildWave([{type:'caminho_animal',count:5,gap:1.5}]),

      // W4
      buildWave([{type:'caminho_animal',count:6,gap:1.4}]),

      // W5 · Última wave só Normal
      buildWave([{type:'caminho_animal',count:7,gap:1.3}]),

      // W6 · Primeiro mix
      buildWave([
        {type:'caminho_animal', count:4, gap:1.4},
        {type:'caminho_humano', count:2, gap:3.0}
      ]),

      // W7
      buildWave([
        {type:'caminho_animal', count:3, gap:1.4},
        {type:'caminho_humano', count:3, gap:2.8}
      ]),

      // W8
      buildWave([
        {type:'caminho_animal', count:4, gap:1.3},
        {type:'caminho_humano', count:3, gap:2.7}
      ]),

      // W9 · Gauntlet — Powerful 1 dominam
      buildWave([
        {type:'caminho_animal', count:3, gap:1.3},
        {type:'caminho_humano', count:4, gap:2.5}
      ]),

      // W10 · Konan + escolta (ao morrer ela lança 3 mini-shinra!)
      buildWave([
        {type:'caminho_animal', count:2, gap:1.4},
        {type:'caminho_humano', count:2, gap:2.8},
        {type:'konan',          count:1, gap:0}
      ])
    ]
  },

  // ══════════════════════════════════════════════════════
  //  FASE 5 — O Caos na Vila
  //  W1–5: invocacao_slug (Normal)
  //  W6–10: invocacao_slug + invocacao_caranguejo (Powerful 1)
  //  Mini-Boss W10: caminho_deus_animal (ao morrer → 3 lesmas)
  // ══════════════════════════════════════════════════════
  {
    id: 'fase5', name: 'O Caos na Vila', world: 'naruto',
    drops: [
      { id: 'ninja_generico_1', chance: 70 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_3', chance: 10 }
    ],
    waves: [
      // W1
      buildWave([{type:'invocacao_slug',count:3,gap:2.0}]),

      // W2
      buildWave([{type:'invocacao_slug',count:4,gap:1.8}]),

      // W3
      buildWave([{type:'invocacao_slug',count:4,gap:1.7}]),

      // W4
      buildWave([{type:'invocacao_slug',count:5,gap:1.6}]),

      // W5 · Última wave só Normal
      buildWave([{type:'invocacao_slug',count:6,gap:1.5}]),

      // W6 · Primeiro mix
      buildWave([
        {type:'invocacao_slug',      count:3, gap:1.6},
        {type:'invocacao_caranguejo',count:2, gap:3.2}
      ]),

      // W7
      buildWave([
        {type:'invocacao_slug',      count:3, gap:1.6},
        {type:'invocacao_caranguejo',count:2, gap:3.0},
        {type:'invocacao_slug',      count:2, gap:1.8}
      ]),

      // W8
      buildWave([
        {type:'invocacao_slug',      count:2, gap:1.6},
        {type:'invocacao_caranguejo',count:3, gap:2.8},
        {type:'invocacao_slug',      count:2, gap:1.8}
      ]),

      // W9 · Caranguejo em massa
      buildWave([
        {type:'invocacao_slug',      count:2, gap:1.7},
        {type:'invocacao_caranguejo',count:4, gap:2.6}
      ]),

      // W10 · Caminho Deus Animal (ao morrer → 3 lesmas extras)
      buildWave([
        {type:'invocacao_slug',      count:2, gap:1.7},
        {type:'invocacao_caranguejo',count:2, gap:3.0},
        {type:'caminho_deus_animal', count:1, gap:0}
      ])
    ]
  },

  // ══════════════════════════════════════════════════════
  //  FASE 6 — O Julgamento
  //  W1–5: ninja_chuva (Normal)
  //  W6–10: ninja_chuva + akatsuki_chuva (Powerful 1) + mini_shinra_tensei
  //  W9: primeiro ninja_chuva_veloz (Speed) aparece
  //  Boss W10: Pain (Nagato) — Shinra Tensei periódico
  // ══════════════════════════════════════════════════════
  {
    id: 'fase6', name: 'O Julgamento', world: 'naruto', isBoss: true,
    drops: [
      { id: 'naruto_sage', chance: 0.1, pity: 200 },
      { id: 'ninja_generico_3', chance: 9.9 },
      { id: 'ninja_generico_2', chance: 20 },
      { id: 'ninja_generico_1', chance: 70 }
    ],
    waves: [
      // W1
      buildWave([{type:'ninja_chuva',count:4,gap:1.6}]),

      // W2
      buildWave([{type:'ninja_chuva',count:5,gap:1.5}]),

      // W3
      buildWave([{type:'ninja_chuva',count:5,gap:1.4}]),

      // W4
      buildWave([{type:'ninja_chuva',count:6,gap:1.3}]),

      // W5 · Última wave só Normal
      buildWave([{type:'ninja_chuva',count:7,gap:1.2}]),

      // W6 · Primeiro mix + mini shinras
      buildWave([
        {type:'ninja_chuva',       count:4, gap:1.3},
        {type:'akatsuki_chuva',    count:2, gap:3.0},
        {type:'mini_shinra_tensei',count:2, gap:1.8}
      ]),

      // W7 · Mais presença de Powerful 1 e mini shinras
      buildWave([
        {type:'ninja_chuva',       count:3, gap:1.3},
        {type:'akatsuki_chuva',    count:3, gap:2.8},
        {type:'mini_shinra_tensei',count:2, gap:1.8}
      ]),

      // W8 · Mini shinras no meio — surpreende
      buildWave([
        {type:'ninja_chuva',       count:3, gap:1.2},
        {type:'mini_shinra_tensei',count:3, gap:1.7},
        {type:'akatsuki_chuva',    count:3, gap:2.8}
      ]),

      // W9 · PRIMEIRO Speed enemy (ninja_chuva_veloz) + mix completo
      buildWave([
        {type:'ninja_chuva',        count:2, gap:1.3},
        {type:'ninja_chuva_veloz',  count:2, gap:1.4},
        {type:'akatsuki_chuva',     count:2, gap:2.8},
        {type:'mini_shinra_tensei', count:3, gap:1.7}
      ]),

      // W10 · Pain (Nagato) — boss com Shinra Tensei
      buildWave([
        {type:'ninja_chuva',        count:2, gap:1.3},
        {type:'mini_shinra_tensei', count:2, gap:1.7},
        {type:'akatsuki_chuva',     count:2, gap:2.8},
        {type:'pain',               count:1, gap:0}
      ])
    ]
  },
  {
    id: 'op_fase1', name: 'Início na Grand Line', world: 'onepiece',
    drops: [{ id: 'pirata_generico_1', chance: 70 }, { id: 'pirata_generico_2', chance: 20 }],
    waves: [
      buildWave([{type:'pirata_fraco',count:6,gap:1.5}]),
      buildWave([{type:'pirata_fraco',count:7,gap:1.4}]),
      buildWave([{type:'pirata_fraco',count:8,gap:1.3}]),
      buildWave([{type:'pirata_fraco',count:9,gap:1.2}]),
      buildWave([{type:'pirata_fraco',count:10,gap:1.4}]),
      buildWave([{type:'pirata_fraco',count:12,gap:1.2}]),
      buildWave([{type:'pirata_fraco',count:14,gap:1.0}]),
      buildWave([{type:'pirata_fraco',count:15,gap:0.9}]),
      buildWave([{type:'pirata_fraco',count:18,gap:0.8}]),
      buildWave([{type:'pirata_boss1',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase2', name: 'Emboscada Pirata', world: 'onepiece',
    drops: [{ id: 'pirata_generico_1', chance: 50 }, { id: 'pirata_generico_2', chance: 30 }, { id: 'pirata_generico_3', chance: 5 }],
    waves: [
      buildWave([{type:'pirata_fraco',count:8,gap:1.5}]),
      buildWave([{type:'pirata_fraco',count:5,gap:1.0}, {type:'pirata_medio',count:3,gap:1.5}]),
      buildWave([{type:'pirata_medio',count:6,gap:1.3}]),
      buildWave([{type:'pirata_fraco',count:5,gap:1.0}, {type:'pirata_medio',count:5,gap:1.5}]),
      buildWave([{type:'pirata_boss1',count:1,gap:0}]),
      buildWave([{type:'pirata_medio',count:10,gap:1.0}]),
      buildWave([{type:'pirata_fraco',count:8,gap:0.8}, {type:'pirata_medio',count:6,gap:1.0}]),
      buildWave([{type:'pirata_medio',count:12,gap:0.9}]),
      buildWave([{type:'pirata_medio',count:15,gap:0.8}]),
      buildWave([{type:'pirata_boss1',count:2,gap:2.0}])
    ]
  },
  {
    id: 'op_fase3', name: 'Ataque Marítimo', world: 'onepiece',
    drops: [{ id: 'pirata_generico_1', chance: 30 }, { id: 'pirata_generico_2', chance: 50 }, { id: 'pirata_generico_3', chance: 15 }],
    waves: [
      buildWave([{type:'pirata_medio',count:8,gap:1.5}]),
      buildWave([{type:'pirata_medio',count:10,gap:1.4}]),
      buildWave([{type:'pirata_forte',count:4,gap:2.0}]),
      buildWave([{type:'pirata_medio',count:6,gap:1.0}, {type:'pirata_forte',count:3,gap:1.5}]),
      buildWave([{type:'pirata_boss1',count:1,gap:0}, {type:'pirata_forte',count:2,gap:1.0}]),
      buildWave([{type:'pirata_forte',count:8,gap:1.2}]),
      buildWave([{type:'pirata_medio',count:10,gap:0.8}, {type:'pirata_forte',count:5,gap:1.0}]),
      buildWave([{type:'pirata_forte',count:12,gap:1.0}]),
      buildWave([{type:'pirata_forte',count:15,gap:0.8}]),
      buildWave([{type:'pirata_boss1',count:3,gap:2.0}])
    ]
  },
  {
    id: 'op_fase4', name: 'Forças da Marinha', world: 'onepiece',
    drops: [{ id: 'pirata_generico_2', chance: 40 }, { id: 'pirata_generico_3', chance: 20 }],
    waves: [
      buildWave([{type:'marinha_soldado',count:10,gap:1.5}]),
      buildWave([{type:'marinha_soldado',count:15,gap:1.2}]),
      buildWave([{type:'marinha_soldado',count:12,gap:1.0}, {type:'marinha_capitao',count:2,gap:2.0}]),
      buildWave([{type:'marinha_capitao',count:4,gap:1.5}]),
      buildWave([{type:'pirata_boss1',count:1,gap:0}, {type:'marinha_soldado',count:5,gap:1.0}]),
      buildWave([{type:'marinha_soldado',count:20,gap:0.8}]),
      buildWave([{type:'marinha_capitao',count:6,gap:1.2}]),
      buildWave([{type:'marinha_soldado',count:15,gap:0.8}, {type:'marinha_capitao',count:4,gap:1.0}]),
      buildWave([{type:'marinha_capitao',count:10,gap:1.0}]),
      buildWave([{type:'pirata_boss1',count:4,gap:2.0}])
    ]
  },
  {
    id: 'op_fase5', name: 'Cerco Implacável', world: 'onepiece',
    drops: [{ id: 'pirata_generico_2', chance: 20 }, { id: 'pirata_generico_3', chance: 40 }],
    waves: [
      buildWave([{type:'marinha_soldado',count:15,gap:1.0}]),
      buildWave([{type:'marinha_capitao',count:8,gap:1.2}]),
      buildWave([{type:'pirata_forte',count:10,gap:1.0}]),
      buildWave([{type:'marinha_capitao',count:5,gap:1.0}, {type:'pirata_forte',count:5,gap:1.0}]),
      buildWave([{type:'pirata_boss1',count:2,gap:2.0}]),
      buildWave([{type:'marinha_soldado',count:25,gap:0.6}]),
      buildWave([{type:'marinha_capitao',count:12,gap:1.0}]),
      buildWave([{type:'pirata_forte',count:15,gap:0.8}]),
      buildWave([{type:'marinha_capitao',count:10,gap:0.8}, {type:'pirata_forte',count:10,gap:0.8}]),
      buildWave([{type:'pirata_boss1',count:5,gap:1.5}])
    ]
  },
  {
    id: 'op_fase6', name: 'O Almirante', world: 'onepiece', isBoss: true,
    drops: [{ id: 'pirata_generico_3', chance: 60 }, { id: 'barbabranca_5', chance: 0.1, pity: 200 }],
    waves: [
      buildWave([{type:'marinha_capitao',count:10,gap:1.0}]),
      buildWave([{type:'pirata_forte',count:15,gap:0.8}]),
      buildWave([{type:'marinha_capitao',count:12,gap:0.8}, {type:'pirata_forte',count:8,gap:1.0}]),
      buildWave([{type:'pirata_boss1',count:3,gap:1.5}]),
      buildWave([{type:'marinha_soldado',count:30,gap:0.5}]),
      buildWave([{type:'marinha_capitao',count:15,gap:0.8}]),
      buildWave([{type:'pirata_forte',count:20,gap:0.7}]),
      buildWave([{type:'marinha_capitao',count:10,gap:0.5}, {type:'pirata_forte',count:15,gap:0.5}]),
      buildWave([{type:'pirata_boss1',count:5,gap:1.0}]),
      buildWave([{type:'almirante_boss',count:1,gap:0}])
    ]
  }
];

function getStage(id) { return STAGES.find(s => s.id === id) || null; }
function getStagesByWorld(worldId) { return STAGES.filter(s => s.world === worldId); }
