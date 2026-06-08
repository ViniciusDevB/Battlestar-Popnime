function evtWave(spawns) {
  let wave = [];
  let d = 0;
  spawns.forEach(s => {
    d += s.delay || 0;
    for(let i=0; i<s.count; i++){
      wave.push({ type: s.type, delay: d + i*(s.gap || 1) });
    }
    d += (s.count-1)*(s.gap||1);
  });
  return wave;
}

// ── Caminhos exclusivos do Evento 2 ───────────────────────────────────────────
// Canvas: 1024 × 600

// Cap.1 — Areia: S-duplo aberto, amplas áreas para posicionar torres
const PATH_EVT2_P1 = [
  {x:-20,  y:480},
  {x:220,  y:480},
  {x:220,  y:180},
  {x:530,  y:180},
  {x:530,  y:440},
  {x:820,  y:440},
  {x:820,  y:160},
  {x:1044, y:160}
];

// Cap.2 — Névoa: ziguezague fechado, muitas curvas, difícil de cobrir
const PATH_EVT2_P2 = [
  {x:-20,  y:100},
  {x:150,  y:100},
  {x:150,  y:460},
  {x:390,  y:460},
  {x:390,  y:185},
  {x:640,  y:185},
  {x:640,  y:490},
  {x:880,  y:490},
  {x:880,  y:130},
  {x:1044, y:130}
];

// Cap.3 — Pedra: U profundo — com dualFront, Grupo B entra no fundo do U
const PATH_EVT2_P3 = [
  {x:-20,  y:110},
  {x:200,  y:110},
  {x:200,  y:490},
  {x:830,  y:490},
  {x:830,  y:110},
  {x:1044, y:110}
];

// Cap.4 — Trovões: montanha dramática, sobe-desce-sobe
const PATH_EVT2_P4 = [
  {x:-20,  y:300},
  {x:160,  y:300},
  {x:160,  y:80},
  {x:500,  y:80},
  {x:500,  y:520},
  {x:840,  y:520},
  {x:840,  y:180},
  {x:1044, y:180}
];

const EVENTS_DATA = [
  {
    id: 'evento_1',
    name: 'A Anomalia de Konoha',
    flyer: 'assets/events/evento1_flyer.png',
    desc: 'Um meteoro misterioso caiu nas florestas do País do Fogo, trazendo um viajante de outro mundo e despertando uma ameaça que transcende o chakra. O começo de uma colisão multiversal.',
    stages: [
      {
        id: 'evt1_p1',
        name: 'Parte 1: O Meteoro Laranja',
        world: 'naruto',
        difficulty: 'normal',
        story: 'Naruto e Sasuke investigam uma cratera fumegante nas florestas do Leste de Konoha. No centro, envolto em fumaça roxa que suprime o chakra de todos ao redor, jaz um desconhecido em trajes laranja — caído literalmente do céu junto com o meteoro. "Esse poder que emana dele não é chakra", percebe Sasuke. "Seja lá de onde ele veio, não vou deixar ninguém machucá-lo!", responde Naruto. Ninjas renegados com olhos completamente vazios surgem de todos os lados, controlados pela névoa. A batalha começa com chakra reduzido e cinco frentes simultâneas.',
        description: '⚠️ 5 caminhos simultâneos até o centro. Torres com 15% de lentidão. Perca 5 vidas e é derrota.',
        bgm: 'battle_naruto',
        base_hp: 5,
        paths: [
          [{x: -20, y: 300}, {x: 512, y: 300}],
          [{x: 1044, y: 300}, {x: 512, y: 300}],
          [{x: 512, y: -20}, {x: 512, y: 300}],
          [{x: -20, y: 620}, {x: 512, y: 300}],
          [{x: 1044, y: 620}, {x: 512, y: 300}]
        ],
        modifiers: {
          tower_speed_mult: 0.85
        },
        drops: [],
        waves: [
          evtWave([{ type: 'ninja_comum', count: 12, gap: 1.5 }]),
          evtWave([{ type: 'ninja_comum', count: 18, gap: 1.2 }]),
          evtWave([{ type: 'ninja_ambu', count: 15, gap: 1.0 }]),
          evtWave([{ type: 'ninja_comum', count: 25, gap: 0.8 }, { type: 'ninja_ambu', count: 10, gap: 0.8, delay: 5 }]),
          evtWave([{ type: 'ninja_ambu', count: 30, gap: 0.6 }]),
          evtWave([{ type: 'ninja_comum', count: 35, gap: 0.6 }]),
          evtWave([{ type: 'ninja_ambu', count: 35, gap: 0.6 }]),
          evtWave([{ type: 'ninja_comum', count: 40, gap: 0.5 }, { type: 'ninja_ambu', count: 20, gap: 0.5, delay: 2 }]),
          evtWave([{ type: 'ninja_ambu', count: 45, gap: 0.5 }]),
          evtWave([{ type: 'ninja_ambu', count: 50, gap: 0.4 }])
        ]
      },
      {
        id: 'evt1_p2',
        name: 'Parte 2: Bestas Sem Rosto',
        world: 'naruto',
        difficulty: 'normal',
        story: 'O guerreiro laranja acorda. Ele se chama Son Goku, veio de outro mundo através de um buraco dimensional acidental — e está com fome. Mas não há tempo: o céu escurece numa névoa negra sobrenatural, e criaturas sem ki, sem rosto e sem vontade própria emergem das sombras. Goku percebe que são marionetes controladas remotamente por alguém distante. Ataques físicos mal as afetam. Quando a batalha termina, uma voz fria emerge das trevas: Orochimaru esteve observando tudo. Ele avisa que as criaturas são corpos pilotados por um Rinnegan — e que quando o verdadeiro controlador aparecer pessoalmente, a situação será muito pior.',
        description: '⚠️ Breu Total — torres iluminam apenas seu raio de alcance. Torres físicas causam 30% menos dano.',
        modifiers: {
          dark_mode: true,
          physical_damage_mult: 0.70
        },
        drops: [
          { id: 'orochimaru_base', chance: 1 }
        ],
        waves: [
          evtWave([{ type: 'ninja_comum', count: 15, gap: 1.2 }]),
          evtWave([{ type: 'ninja_ambu', count: 12, gap: 1.0 }]),
          evtWave([{ type: 'caminho_animal', count: 8, gap: 1.5 }]),
          evtWave([{ type: 'caminho_animal', count: 12, gap: 1.2 }, { type: 'ninja_ambu', count: 15, gap: 0.8, delay: 5 }]),
          evtWave([{ type: 'caminho_humano', count: 15, gap: 1.0 }]),
          evtWave([{ type: 'ninja_ambu', count: 25, gap: 0.9 }]),
          evtWave([{ type: 'caminho_animal', count: 20, gap: 1.0 }]),
          evtWave([{ type: 'caminho_humano', count: 25, gap: 0.9 }]),
          evtWave([{ type: 'caminho_animal', count: 25, gap: 0.8 }, { type: 'ninja_ambu', count: 20, gap: 0.7, delay: 4 }]),
          evtWave([{ type: 'caminho_humano', count: 35, gap: 0.8 }])
        ]
      },
      {
        id: 'evt1_p3',
        name: 'Parte 3: O Experimento Sombrio',
        world: 'naruto',
        difficulty: 'hard',
        story: 'Pain aparece, tendo absorvido a energia da anomalia pelos Seis Caminhos do Rinnegan. Ele revela que não agiu por conta própria: serve a um ser de um terceiro mundo — Aizen Sousuke — que está deliberadamente rasgando as fronteiras entre dimensões. A batalha é devastadora: meteoros caem sobre as posições defensivas e um Shinra Tensei global paralisa tudo no campo. Ao ser derrotado, Pain entrega um aviso final: "O que Aizen está construindo ultrapassa qualquer destruição que eu já causei. Quando ele terminar, não haverá mundo separado para ninguém fugir." A Equipe Popnime nasce aqui — com um nome, um inimigo e um objetivo.',
        description: '⚠️ A cada 20s: meteoros (stun 1-5s aleatório por torre) + Shinra Tensei (stun 1-5s por torre, empurra inimigos). Torres têm 5s de imunidade após serem stunadas. Pain invoca escudos de Rinnegan aleatoriamente — destrua-os para atingir sua vida!',
        modifiers: {
          meteors_and_shinra: true
        },
        drops: [
          { id: 'pain_base', chance: 0.5 }
        ],
        waves: [
          evtWave([{ type: 'ninja_comum', count: 15, gap: 1.2 }]),
          evtWave([{ type: 'ninja_ambu', count: 20, gap: 1.0 }]),
          evtWave([{ type: 'caminho_animal', count: 15, gap: 1.0 }]),
          evtWave([{ type: 'caminho_humano', count: 20, gap: 0.8 }]),
          evtWave([{ type: 'caminho_asura', count: 15, gap: 0.8 }]),
          evtWave([{ type: 'ninja_ambu', count: 35, gap: 0.8 }]),
          evtWave([{ type: 'caminho_animal', count: 30, gap: 0.9 }]),
          evtWave([{ type: 'caminho_humano', count: 35, gap: 0.7 }]),
          evtWave([{ type: 'caminho_asura', count: 25, gap: 0.7 }]),
          evtWave([{ type: 'caminho_humano', count: 40, gap: 0.6 }]),
          evtWave([{ type: 'caminho_asura', count: 35, gap: 0.6 }]),
          evtWave([{ type: 'pain', count: 1, gap: 1 }])
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  EVENTO 2 — OPERAÇÃO: RESSURREIÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'evento_2',
    name: 'Operação: Ressurreição',
    flyer: 'assets/events/evento2_flyer.png',
    desc: 'Kabuto, nas sombras, usou células do Pain para replicar os Kages das quatro grandes aldeias. O objetivo: desestabilizar a aliança shinobi enquanto Orochimaru prepara o retorno definitivo. Quatro aldeias. Quatro batalhas. Um único inimigo por trás de tudo.',
    stages: [

      // ── Capítulo 1: A Queda da Areia ────────────────────────────────────────
      // Mapa: S-duplo — inimigos percorrem 3 corredores horizontais separados
      // Mecânica: Tempestade de Areia — a cada 25s reduz alcance de todas as torres
      //           por 6s. Inimigos com escudo de areia (sandShield).
      {
        id: 'evt2_p1',
        name: 'Capítulo 1: A Queda da Areia',
        world: 'naruto',
        difficulty: 'hard',
        story: 'A Aldeia da Areia caiu silenciosamente. Um replicante do Kazekage governa com punho de ferro — e cada soldado sob seu comando carrega um escudo de areia que resiste a ataques ordinários. Apenas um dano concentrado e explosivo consegue quebrar essa proteção. Gaara está desaparecido. Temari e Kankuro pedem ajuda.',
        description: '⚠️ Escudo de Areia — inimigos só tomam dano por burst (>800 em 1.5s). DoTs e slows não quebram. Tempestade de Areia a cada 25s reduz alcance das torres por 6s.',
        paths: [PATH_EVT2_P1],
        modifiers: {
          sandShield: true,
          sandStorm: true
        },
        drops: [],
        waves: [
          evtWave([{ type:'areia_soldado', count:14, gap:1.4 }]),
          evtWave([{ type:'areia_soldado', count:20, gap:1.1 }]),
          evtWave([{ type:'areia_soldado', count:16, gap:1.0 }, { type:'areia_marionete', count:6, gap:1.5, delay:5 }]),
          evtWave([{ type:'areia_marionete', count:12, gap:1.1 }, { type:'areia_soldado', count:10, gap:0.9, delay:3 }]),
          evtWave([{ type:'areia_soldado', count:10, gap:1.0 }, { type:'areia_golem', count:3, gap:5, delay:4 }]),
          evtWave([{ type:'areia_soldado', count:18, gap:0.8 }, { type:'areia_marionete', count:8, gap:1.0, delay:3 }, { type:'areia_golem', count:2, gap:6, delay:6 }]),
          evtWave([{ type:'areia_golem', count:5, gap:4 }, { type:'areia_marionete', count:10, gap:0.8, delay:2 }]),
          evtWave([{ type:'areia_soldado', count:25, gap:0.7 }, { type:'areia_golem', count:3, gap:5, delay:5 }]),
          evtWave([{ type:'areia_marionete', count:15, gap:0.9 }, { type:'areia_golem', count:4, gap:4, delay:4 }]),
          evtWave([{ type:'areia_soldado', count:35, gap:0.6 }]),
          evtWave([{ type:'areia_marionete', count:25, gap:0.8 }, { type:'areia_golem', count:3, gap:4, delay:3 }]),
          evtWave([{ type:'areia_golem', count:7, gap:3.5 }]),
          evtWave([{ type:'areia_soldado', count:45, gap:0.5 }, { type:'areia_marionete', count:20, gap:0.7, delay:5 }]),
          evtWave([{ type:'areia_marionete', count:35, gap:0.7 }, { type:'areia_golem', count:6, gap:3, delay:4 }]),
          evtWave([{ type:'replicante_kazekage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 2: Névoa Sangrenta ──────────────────────────────────────────
      // Mapa: ziguezague fechado simulando ruas estreitas da Aldeia da Névoa
      // Mecânica: Fog of War (oculta HP/nomes) + inimigos 22% mais rápidos no nevoeiro
      {
        id: 'evt2_p2',
        name: 'Capítulo 2: Névoa Sangrenta',
        world: 'naruto',
        difficulty: 'hard',
        story: 'Uma névoa densa e impenetrável cobre a Aldeia da Névoa. Os inimigos são invisíveis — suas formas surgem apenas como sombras. Nomes, tipos e vida: nada pode ser lido. O Replicante do Mizukage usa genjutsu para confundir e paralisar. Apenas o instinto e a agilidade podem prevalecer.',
        description: '⚠️ Nevoeiro Mortal — HP, nomes e tipos ocultos. Silhuetas apenas. Inimigos se movem 22% mais rápido amparados pela névoa. O Mizukage usa genjutsu para paralisar torres.',
        paths: [PATH_EVT2_P2],
        modifiers: {
          fogOfWar: true,
          fogSpeedBonus: 0.22
        },
        drops: [],
        waves: [
          evtWave([{ type:'nebulino', count:16, gap:1.3 }]),
          evtWave([{ type:'nebulino', count:22, gap:1.0 }]),
          evtWave([{ type:'nebulino', count:18, gap:0.9 }, { type:'espada_nebulosa', count:6, gap:1.4, delay:5 }]),
          evtWave([{ type:'espada_nebulosa', count:12, gap:1.1 }, { type:'nebulino', count:12, gap:0.8, delay:3 }]),
          evtWave([{ type:'nebulino', count:12, gap:1.0 }, { type:'zumbi_kaguya', count:3, gap:5, delay:4 }]),
          evtWave([{ type:'nebulino', count:20, gap:0.8 }, { type:'espada_nebulosa', count:8, gap:1.0, delay:4 }, { type:'zumbi_kaguya', count:2, gap:6, delay:6 }]),
          evtWave([{ type:'zumbi_kaguya', count:5, gap:4.5 }, { type:'espada_nebulosa', count:10, gap:0.9, delay:2 }]),
          evtWave([{ type:'nebulino', count:28, gap:0.65 }, { type:'zumbi_kaguya', count:3, gap:5, delay:5 }]),
          evtWave([{ type:'espada_nebulosa', count:16, gap:0.85 }, { type:'zumbi_kaguya', count:4, gap:4.5, delay:3 }]),
          evtWave([{ type:'nebulino', count:38, gap:0.6 }]),
          evtWave([{ type:'espada_nebulosa', count:25, gap:0.8 }, { type:'zumbi_kaguya', count:3, gap:4.5, delay:4 }]),
          evtWave([{ type:'zumbi_kaguya', count:7, gap:4 }]),
          evtWave([{ type:'nebulino', count:45, gap:0.5 }, { type:'espada_nebulosa', count:20, gap:0.7, delay:5 }]),
          evtWave([{ type:'espada_nebulosa', count:35, gap:0.7 }, { type:'zumbi_kaguya', count:6, gap:3.5, delay:4 }]),
          evtWave([{ type:'replicante_mizukage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 3: O Coração de Pedra ──────────────────────────────────────
      // Mapa: U profundo — Grupo B (dualFront) nasce no fundo do U
      // Mecânica: Formações rochosas bloqueiam posicionamento em zonas centrais
      // Recompensa: Tsunade desbloqueada automaticamente ao concluir
      {
        id: 'evt2_p3',
        name: 'Capítulo 3: O Coração de Pedra',
        world: 'naruto',
        difficulty: 'hard',
        story: 'A Aldeia da Pedra resiste — mas o Replicante do Tsuchikage abriu duas frentes simultâneas. Enquanto um exército avança pelo caminho principal, reforços surgem já a meio percurso, usando jutsu de partícula para se teletransportar. Dividir as forças defensivas ou concentrá-las é a grande decisão.',
        description: '⚠️ Frente Dupla — Grupo B surge a 50% do caminho. Formações rochosas no centro do mapa bloqueiam posicionamento. Concluir este capítulo desbloqueia Tsunade.',
        paths: [PATH_EVT2_P3],
        modifiers: {
          dualFront: true,
          blockZones: [
            { x: 512, y: 300, r: 70 },
            { x: 340, y: 400, r: 50 },
            { x: 680, y: 400, r: 50 },
            { x: 340, y: 200, r: 45 },
            { x: 680, y: 200, r: 45 }
          ]
        },
        drops: [
          { id: 'tsunade', chance: 100, oneTime: true }
        ],
        waves: [
          evtWave([{ type:'guerreiro_pedra', count:16, gap:1.2 }]),
          evtWave([{ type:'guerreiro_pedra', count:24, gap:0.95 }]),
          evtWave([{ type:'guerreiro_pedra', count:18, gap:0.9 }, { type:'explosao_terra', count:8, gap:1.4, delay:4 }]),
          evtWave([{ type:'explosao_terra', count:12, gap:1.0 }, { type:'guerreiro_pedra', count:14, gap:0.8, delay:3 }]),
          evtWave([{ type:'guerreiro_pedra', count:14, gap:0.9 }, { type:'golem_terra', count:3, gap:5, delay:4 }]),
          evtWave([{ type:'guerreiro_pedra', count:22, gap:0.75 }, { type:'explosao_terra', count:8, gap:1.0, delay:3 }, { type:'golem_terra', count:2, gap:6, delay:6 }]),
          evtWave([{ type:'golem_terra', count:5, gap:4 }, { type:'explosao_terra', count:10, gap:0.85, delay:2 }]),
          evtWave([{ type:'guerreiro_pedra', count:30, gap:0.65 }, { type:'golem_terra', count:3, gap:5, delay:5 }]),
          evtWave([{ type:'explosao_terra', count:15, gap:0.8 }, { type:'golem_terra', count:4, gap:4, delay:3 }]),
          evtWave([{ type:'guerreiro_pedra', count:40, gap:0.6 }]),
          evtWave([{ type:'explosao_terra', count:25, gap:0.75 }, { type:'golem_terra', count:3, gap:4.5, delay:4 }]),
          evtWave([{ type:'golem_terra', count:7, gap:3.5 }]),
          evtWave([{ type:'guerreiro_pedra', count:50, gap:0.5 }, { type:'explosao_terra', count:20, gap:0.7, delay:5 }]),
          evtWave([{ type:'explosao_terra', count:35, gap:0.6 }, { type:'golem_terra', count:6, gap:3, delay:4 }]),
          evtWave([{ type:'replicante_tsuchikage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 4: Tempestade de Trovões ───────────────────────────────────
      // Mapa: montanha dramática — sobe ao pico, desce ao vale, sobe à saída
      // Mecânica: Raio Errante a cada 12s acerta inimigos em área; boss alterna imunidades
      // Recompensa: Farm de Killer Bee (10% por run, pity 80)
      {
        id: 'evt2_p4',
        name: 'Capítulo 4: Tempestade de Trovões',
        world: 'naruto',
        difficulty: 'very_hard',
        story: 'A Aldeia das Nuvens. O Replicante de Killer Bee usa o poder do Gyuki corrompido para alternar imunidades a tipos de ataque. Seus olhos brilham em tons roxos — cada 30 segundos, muda o que pode machucá-lo. Raios errantes caem sobre o campo de batalha, tornando o combate ainda mais caótico. Tsunade está com você. Adapte-se ou perca.',
        description: '⚠️ Modo Jinchuuriki — boss alterna imunidade a tipos de ataque a cada 30s. Raio Errante a cada 12s atinge inimigos em área. Farm de Killer Bee (10% por conclusão, pity 80).',
        paths: [PATH_EVT2_P4],
        modifiers: {
          jinchuurikiMode: true,
          lightningStrike: true
        },
        drops: [
          { id: 'killer_bee', chance: 1, pity: 80 }
        ],
        waves: [
          evtWave([{ type:'kumo_ninja', count:14, gap:1.2 }]),
          evtWave([{ type:'kumo_ninja', count:22, gap:0.95 }]),
          evtWave([{ type:'kumo_ninja', count:18, gap:0.9 }, { type:'kumo_rapido', count:6, gap:1.3, delay:5 }]),
          evtWave([{ type:'kumo_rapido', count:14, gap:1.0 }, { type:'kumo_ninja', count:12, gap:0.8, delay:3 }]),
          evtWave([{ type:'kumo_ninja', count:14, gap:0.9 }, { type:'jinchuuriki_corrompido', count:2, gap:6, delay:4 }]),
          evtWave([{ type:'kumo_ninja', count:22, gap:0.75 }, { type:'kumo_rapido', count:8, gap:1.0, delay:3 }, { type:'jinchuuriki_corrompido', count:2, gap:6, delay:6 }]),
          evtWave([{ type:'jinchuuriki_corrompido', count:4, gap:5 }, { type:'kumo_rapido', count:10, gap:0.85, delay:2 }]),
          evtWave([{ type:'kumo_ninja', count:28, gap:0.65 }, { type:'jinchuuriki_corrompido', count:3, gap:5, delay:5 }]),
          evtWave([{ type:'kumo_rapido', count:16, gap:0.8 }, { type:'jinchuuriki_corrompido', count:4, gap:4.5, delay:3 }]),
          evtWave([{ type:'kumo_ninja', count:40, gap:0.6 }]),
          evtWave([{ type:'kumo_rapido', count:25, gap:0.75 }, { type:'jinchuuriki_corrompido', count:3, gap:4.5, delay:4 }]),
          evtWave([{ type:'jinchuuriki_corrompido', count:7, gap:3.5 }]),
          evtWave([{ type:'kumo_ninja', count:50, gap:0.5 }, { type:'kumo_rapido', count:20, gap:0.7, delay:5 }]),
          evtWave([{ type:'kumo_rapido', count:35, gap:0.6 }, { type:'jinchuuriki_corrompido', count:6, gap:3, delay:4 }]),
          evtWave([{ type:'replicante_killerbee', count:1, gap:1 }])
        ]
      }

    ]
  }
];
