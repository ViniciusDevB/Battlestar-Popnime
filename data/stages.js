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
      buildWave([{type:'op_bandido',count:6,gap:1.5}]),
      buildWave([{type:'op_bandido',count:7,gap:1.4}]),
      buildWave([{type:'op_bandido',count:8,gap:1.3}]),
      buildWave([{type:'op_bandido',count:9,gap:1.2}]),
      buildWave([{type:'op_bandido',count:10,gap:1.4}]),
      buildWave([{type:'op_bandido',count:12,gap:1.2}]),
      buildWave([{type:'op_bandido',count:10,gap:1.2}, {type:'op_bandido_veterano',count:2,gap:2.0}]),
      buildWave([{type:'op_bandido',count:12,gap:1.0}, {type:'op_bandido_veterano',count:3,gap:1.8}]),
      buildWave([{type:'op_bandido',count:14,gap:1.0}, {type:'op_bandido_veterano',count:4,gap:1.5}]),
      buildWave([{type:'op_bandido',count:5,gap:1.0}, {type:'op_bandido_veterano',count:2,gap:1.0}, {type:'capitao_morgan',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase2', name: 'Emboscada Pirata', world: 'onepiece',
    drops: [{ id: 'pirata_generico_1', chance: 50 }, { id: 'pirata_generico_2', chance: 30 }, { id: 'pirata_generico_3', chance: 5 }],
    waves: [
      buildWave([{type:'op_pirata_comum',count:8,gap:1.5}]),
      buildWave([{type:'op_pirata_comum',count:10,gap:1.4}]),
      buildWave([{type:'op_pirata_comum',count:12,gap:1.3}]),
      buildWave([{type:'op_pirata_comum',count:14,gap:1.2}]),
      buildWave([{type:'op_pirata_comum',count:16,gap:1.1}]),
      buildWave([{type:'op_pirata_comum',count:12,gap:1.1}, {type:'op_pirata_veterano',count:2,gap:2.0}]),
      buildWave([{type:'op_pirata_comum',count:12,gap:1.0}, {type:'op_pirata_veterano',count:3,gap:2.0}]),
      buildWave([{type:'op_pirata_comum',count:12,gap:1.0}, {type:'op_pirata_veterano',count:4,gap:1.5}]),
      buildWave([{type:'op_pirata_comum',count:10,gap:1.0}, {type:'op_pirata_veterano',count:6,gap:1.0}]),
      buildWave([{type:'op_pirata_comum',count:5,gap:1.0}, {type:'op_pirata_veterano',count:2,gap:1.0}, {type:'don_krieg',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase3', name: 'Ataque Marítimo', world: 'onepiece',
    drops: [{ id: 'pirata_generico_1', chance: 30 }, { id: 'pirata_generico_2', chance: 50 }, { id: 'pirata_generico_3', chance: 15 }],
    waves: [
      buildWave([{type:'op_homem_peixe',count:8,gap:1.5}]),
      buildWave([{type:'op_homem_peixe',count:10,gap:1.4}]),
      buildWave([{type:'op_homem_peixe',count:12,gap:1.3}]),
      buildWave([{type:'op_homem_peixe',count:14,gap:1.2}]),
      buildWave([{type:'op_homem_peixe',count:10,gap:1.2}, {type:'op_hp_guerreiro',count:2,gap:2.0}]),
      buildWave([{type:'op_homem_peixe',count:10,gap:1.1}, {type:'op_hp_guerreiro',count:3,gap:2.0}]),
      buildWave([{type:'op_homem_peixe',count:10,gap:1.0}, {type:'op_hp_guerreiro',count:4,gap:2.0}]),
      buildWave([{type:'op_homem_peixe',count:10,gap:1.0}, {type:'op_hp_guerreiro',count:5,gap:1.5}]),
      buildWave([{type:'op_homem_peixe',count:8,gap:1.0}, {type:'op_hp_guerreiro',count:7,gap:1.0}]),
      buildWave([{type:'op_homem_peixe',count:5,gap:1.0}, {type:'op_hp_guerreiro',count:3,gap:1.0}, {type:'arlong',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase4', name: 'Baroque Works', world: 'onepiece',
    drops: [{ id: 'pirata_generico_2', chance: 40 }, { id: 'pirata_generico_3', chance: 20 }],
    waves: [
      buildWave([{type:'op_agente_bw',count:10,gap:1.5}]),
      buildWave([{type:'op_agente_bw',count:12,gap:1.4}]),
      buildWave([{type:'op_agente_bw',count:14,gap:1.3}]),
      buildWave([{type:'op_agente_bw',count:10,gap:1.2}, {type:'op_bw_oficial',count:2,gap:2.0}]),
      buildWave([{type:'op_agente_bw',count:12,gap:1.1}, {type:'op_bw_oficial',count:3,gap:1.8}]),
      buildWave([{type:'op_agente_bw',count:10,gap:1.1}, {type:'op_bw_speed',count:3,gap:1.2}, {type:'op_bw_oficial',count:4,gap:1.5}]),
      buildWave([{type:'op_agente_bw',count:10,gap:1.0}, {type:'op_bw_speed',count:4,gap:1.0}, {type:'op_bw_oficial',count:5,gap:1.2}]),
      buildWave([{type:'op_agente_bw',count:8,gap:1.0}, {type:'op_bw_speed',count:4,gap:1.0}, {type:'op_bw_oficial',count:5,gap:1.0}, {type:'op_bw_elite',count:2,gap:2.0}]),
      buildWave([{type:'op_agente_bw',count:6,gap:1.0}, {type:'op_bw_speed',count:5,gap:1.0}, {type:'op_bw_oficial',count:4,gap:1.0}, {type:'op_bw_elite',count:4,gap:1.5}]),
      buildWave([{type:'op_bw_oficial',count:4,gap:1.0}, {type:'op_bw_elite',count:3,gap:1.0}, {type:'mr_1',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase5', name: 'Justiça Sombria', world: 'onepiece',
    drops: [{ id: 'pirata_generico_2', chance: 20 }, { id: 'pirata_generico_3', chance: 40 }],
    waves: [
      buildWave([{type:'op_agente_cp9',count:10,gap:1.5}]),
      buildWave([{type:'op_agente_cp9',count:12,gap:1.4}]),
      buildWave([{type:'op_agente_cp9',count:14,gap:1.3}]),
      buildWave([{type:'op_agente_cp9',count:10,gap:1.2}, {type:'op_cp9_oficial',count:2,gap:2.0}]),
      buildWave([{type:'op_agente_cp9',count:10,gap:1.1}, {type:'op_cp9_speed',count:3,gap:1.2}, {type:'op_cp9_oficial',count:3,gap:1.8}]),
      buildWave([{type:'op_agente_cp9',count:10,gap:1.0}, {type:'op_cp9_speed',count:4,gap:1.2}, {type:'op_cp9_oficial',count:4,gap:1.5}]),
      buildWave([{type:'op_agente_cp9',count:10,gap:1.0}, {type:'op_cp9_speed',count:5,gap:1.0}, {type:'op_cp9_oficial',count:5,gap:1.2}]),
      buildWave([{type:'op_agente_cp9',count:8,gap:1.0}, {type:'op_cp9_speed',count:5,gap:1.0}, {type:'op_cp9_oficial',count:4,gap:1.0}, {type:'op_cp9_elite',count:2,gap:2.0}]),
      buildWave([{type:'op_agente_cp9',count:6,gap:1.0}, {type:'op_cp9_speed',count:6,gap:1.0}, {type:'op_cp9_oficial',count:4,gap:1.0}, {type:'op_cp9_elite',count:4,gap:1.5}]),
      buildWave([{type:'op_cp9_oficial',count:4,gap:1.0}, {type:'op_cp9_elite',count:3,gap:1.0}, {type:'rob_lucci',count:1,gap:0}])
    ]
  },
  {
    id: 'op_fase6', name: 'Guerra dos Melhores', world: 'onepiece', isBoss: true,
    drops: [{ id: 'pirata_generico_3', chance: 60 }, { id: 'barbabranca_5', chance: 0.1, pity: 200 }],
    waves: [
      buildWave([{type:'op_marinheiro',count:12,gap:1.4}]),
      buildWave([{type:'op_marinheiro',count:15,gap:1.3}]),
      buildWave([{type:'op_marinheiro',count:18,gap:1.2}]),
      buildWave([{type:'op_marinheiro',count:12,gap:1.1}, {type:'op_marinha_capitao',count:3,gap:2.0}]),
      buildWave([{type:'op_marinheiro',count:14,gap:1.0}, {type:'op_marinha_capitao',count:4,gap:1.8}]),
      buildWave([{type:'op_marinheiro',count:16,gap:0.9}, {type:'op_marinha_capitao',count:5,gap:1.5}]),
      buildWave([{type:'op_marinheiro',count:12,gap:0.8}, {type:'op_marinha_capitao',count:6,gap:1.2}]),
      buildWave([{type:'op_marinheiro',count:10,gap:0.8}, {type:'op_marinha_capitao',count:5,gap:1.0}, {type:'op_marinha_elite',count:3,gap:2.0}]),
      buildWave([{type:'op_marinheiro',count:8,gap:0.8}, {type:'op_marinha_capitao',count:5,gap:1.0}, {type:'op_marinha_elite',count:5,gap:1.5}]),
      buildWave([{type:'op_marinha_capitao',count:6,gap:1.0}, {type:'op_marinha_elite',count:4,gap:1.0}, {type:'akainu',count:1,gap:0}])
    ]
  }
  ,{
    id: 'bl_fase1', name: 'Karakura Town', world: 'bleach',
    drops: [
      { id: 'shinigami_generico_1', chance: 70 },
      { id: 'shinigami_generico_2', chance: 20 },
      { id: 'shinigami_generico_3', chance: 8 }
    ],
    waves: [
      buildWave([{type:'hollow_pequeno',count:6,gap:1.6}]),
      buildWave([{type:'hollow_pequeno',count:8,gap:1.5}]),
      buildWave([{type:'hollow_pequeno',count:9,gap:1.4}]),
      buildWave([{type:'hollow_pequeno',count:10,gap:1.3}]),
      buildWave([{type:'hollow_pequeno',count:12,gap:1.2}]),
      buildWave([{type:'hollow_pequeno',count:10,gap:1.2},{type:'hollow_grande',count:2,gap:3.0}]),
      buildWave([{type:'hollow_pequeno',count:10,gap:1.1},{type:'hollow_grande',count:3,gap:2.8}]),
      buildWave([{type:'hollow_pequeno',count:8,gap:1.0},{type:'hollow_grande',count:4,gap:2.5}]),
      buildWave([{type:'hollow_pequeno',count:6,gap:1.0},{type:'hollow_grande',count:6,gap:2.2}]),
      buildWave([{type:'hollow_pequeno',count:4,gap:1.0},{type:'hollow_grande',count:4,gap:2.0},{type:'espada_decima',count:1,gap:0}])
    ]
  },
  {
    id: 'bl_fase2', name: 'Portão da Seireitei', world: 'bleach',
    drops: [
      { id: 'shinigami_generico_1', chance: 50 },
      { id: 'shinigami_generico_2', chance: 30 },
      { id: 'shinigami_generico_3', chance: 15 }
    ],
    waves: [
      buildWave([{type:'hollow_grande',count:6,gap:1.6}]),
      buildWave([{type:'hollow_grande',count:8,gap:1.5}]),
      buildWave([{type:'hollow_grande',count:9,gap:1.4}]),
      buildWave([{type:'hollow_grande',count:10,gap:1.3}]),
      buildWave([{type:'hollow_grande',count:8,gap:1.3},{type:'hollow_mascara',count:2,gap:3.2}]),
      buildWave([{type:'hollow_grande',count:8,gap:1.2},{type:'hollow_mascara',count:3,gap:3.0}]),
      buildWave([{type:'hollow_grande',count:6,gap:1.1},{type:'hollow_mascara',count:4,gap:2.8}]),
      buildWave([{type:'hollow_grande',count:6,gap:1.0},{type:'hollow_mascara',count:4,gap:2.5},{type:'arrancar',count:2,gap:2.0}]),
      buildWave([{type:'hollow_grande',count:4,gap:1.0},{type:'hollow_mascara',count:4,gap:2.2},{type:'arrancar',count:4,gap:1.8}]),
      buildWave([{type:'hollow_mascara',count:3,gap:1.2},{type:'arrancar',count:3,gap:1.8},{type:'espada_decima',count:1,gap:0}])
    ]
  },
  {
    id: 'bl_fase3', name: 'Las Noches', world: 'bleach',
    drops: [
      { id: 'shinigami_generico_2', chance: 30 },
      { id: 'shinigami_generico_3', chance: 40 }
    ],
    waves: [
      buildWave([{type:'hollow_mascara',count:8,gap:1.5}]),
      buildWave([{type:'hollow_mascara',count:10,gap:1.4}]),
      buildWave([{type:'hollow_mascara',count:8,gap:1.3},{type:'arrancar',count:3,gap:2.0}]),
      buildWave([{type:'hollow_mascara',count:8,gap:1.2},{type:'arrancar',count:4,gap:1.8}]),
      buildWave([{type:'hollow_mascara',count:6,gap:1.2},{type:'arrancar',count:5,gap:1.6}]),
      buildWave([{type:'hollow_mascara',count:6,gap:1.1},{type:'arrancar',count:6,gap:1.4}]),
      buildWave([{type:'arrancar',count:8,gap:1.3},{type:'espada_decima',count:2,gap:0}]),
      buildWave([{type:'hollow_mascara',count:4,gap:1.0},{type:'arrancar',count:8,gap:1.2}]),
      buildWave([{type:'arrancar',count:6,gap:1.1},{type:'espada_decima',count:2,gap:4.0},{type:'arrancar',count:4,gap:1.1}]),
      buildWave([{type:'arrancar',count:5,gap:1.0},{type:'espada_decima',count:2,gap:3.5},{type:'menos_grande',count:1,gap:0}])
    ]
  },
  {
    id: 'bl_fase4', name: 'O Vazio', world: 'bleach', isBoss: true,
    drops: [
      { id: 'shinigami_generico_3', chance: 60 },
      { id: 'rukia_kuchiki', chance: 0.15, pity: 200 }
    ],
    waves: [
      buildWave([{type:'hollow_mascara',count:10,gap:1.4},{type:'arrancar',count:4,gap:1.8}]),
      buildWave([{type:'hollow_mascara',count:12,gap:1.3},{type:'arrancar',count:5,gap:1.6}]),
      buildWave([{type:'hollow_mascara',count:10,gap:1.2},{type:'arrancar',count:6,gap:1.5}]),
      buildWave([{type:'hollow_mascara',count:8,gap:1.1},{type:'arrancar',count:8,gap:1.3}]),
      buildWave([{type:'arrancar',count:10,gap:1.2},{type:'espada_decima',count:2,gap:4.0}]),
      buildWave([{type:'arrancar',count:12,gap:1.0},{type:'espada_decima',count:2,gap:3.5}]),
      buildWave([{type:'arrancar',count:8,gap:1.0},{type:'espada_decima',count:3,gap:3.0}]),
      buildWave([{type:'arrancar',count:6,gap:1.0},{type:'espada_decima',count:3,gap:2.8},{type:'menos_grande',count:1,gap:0}]),
      buildWave([{type:'arrancar',count:8,gap:1.0},{type:'espada_decima',count:4,gap:2.5}]),
      buildWave([{type:'espada_decima',count:3,gap:3.0},{type:'arrancar',count:5,gap:1.0},{type:'menos_grande',count:2,gap:0}])
    ]
  },
  {
    id: 'infinito_partida',
    name: '♾ Modo Infinito',
    world: 'infinito',
    isInfinite: true,
    base_hp: 20,
    drops: [
      { id: 'star_exp_1', chance: 55 },
      { id: 'star_exp_2', chance: 28 },
      { id: 'star_exp_3', chance: 12 },
      { id: 'star_exp_4', chance: 4 },
      { id: 'star_exp_5', chance: 1 }
    ],
    waves: []
  }
];

function getStage(id) {
  let s = STAGES.find(s => s.id === id);
  if (s) return s;
  if (typeof EVENTS_DATA !== 'undefined') {
    for (const evt of EVENTS_DATA) {
      const est = evt.stages.find(st => st.id === id);
      if (est) return est;
    }
  }
  return null;
}
function getStagesByWorld(worldId) { return STAGES.filter(s => s.world === worldId); }
