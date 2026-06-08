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
          evtWave([{ type: 'ninja_ambu', count: 30, gap: 0.6 }])
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
          evtWave([{ type: 'caminho_humano', count: 15, gap: 1.0 }])
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
      {
        id: 'evt2_p1',
        name: 'Capítulo 1: A Queda da Areia',
        world: 'naruto',
        difficulty: 'hard',
        story: 'A Aldeia da Areia caiu silenciosamente. Um replicante do Kazekage governa com punho de ferro — e cada soldado sob seu comando carrega um escudo de areia que resiste a ataques ordinários. Apenas um dano concentrado e explosivo consegue quebrar essa proteção. Gaara está desaparecido. Temari e Kankuro pedem ajuda.',
        description: '⚠️ Escudo de Areia — todos os inimigos nascem protegidos. Apenas burst damage (>800 em 1.5s) destrói o escudo. DoTs e slows não quebram o escudo.',
        modifiers: {
          sandShield: true
        },
        drops: [
          { id: 'tsunade_piece_1', chance: 100 }
        ],
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
          evtWave([{ type:'replicante_kazekage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 2: Névoa Sangrenta ──────────────────────────────────────────
      {
        id: 'evt2_p2',
        name: 'Capítulo 2: Névoa Sangrenta',
        world: 'naruto',
        difficulty: 'hard',
        story: 'Uma névoa densa e impenetrável cobre a Aldeia da Névoa. Os inimigos são invisíveis — suas formas surgem apenas como sombras. Nomes, tipos e vida: nada pode ser lido. O Replicante do Mizukage usa genjutsu para confundir e paralisar. Apenas o instinto e a agilidade podem prevalecer.',
        description: '⚠️ Nevoeiro Mortal — HP, nomes e tipos de todos os inimigos estão ocultos. Apenas silhuetas visíveis no caminho. O Mizukage usa genjutsu para paralisar torres.',
        modifiers: {
          fogOfWar: true
        },
        drops: [
          { id: 'tsunade_piece_2', chance: 100 }
        ],
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
          evtWave([{ type:'replicante_mizukage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 3: O Coração de Pedra ──────────────────────────────────────
      {
        id: 'evt2_p3',
        name: 'Capítulo 3: O Coração de Pedra',
        world: 'naruto',
        difficulty: 'hard',
        story: 'A Aldeia da Pedra resiste — mas o Replicante do Tsuchikage abriu duas frentes simultâneas. Enquanto um exército avança pelo caminho principal, reforços surgem já a meio percurso, usando jutsu de partícula para se teletransportar. Dividir as forças defensivas ou concentrá-las é a grande decisão.',
        description: '⚠️ Frente Dupla — cada wave tem dois grupos. O Grupo B surge a 50% do caminho. O Tsuchikage invoca guerreiros a cada 15s.',
        modifiers: {
          dualFront: true
        },
        drops: [
          { id: 'tsunade_piece_3', chance: 100 }
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
          evtWave([{ type:'replicante_tsuchikage', count:1, gap:1 }])
        ]
      },

      // ── Capítulo 4: Tempestade de Trovões ───────────────────────────────────
      {
        id: 'evt2_p4',
        name: 'Capítulo 4: Tempestade de Trovões',
        world: 'naruto',
        difficulty: 'very_hard',
        story: 'A Aldeia das Nuvens. O Replicante de Killer Bee usa o poder do Gyuki corrompido para alternar imunidades a tipos de ataque. Seus olhos brilham em tons roxos — cada 30 segundos, muda o que pode machucá-lo. Adapte-se ou perca. Ao derrotar o Replicante, as peças de Tsunade são completadas — e o verdadeiro Killer Bee aparece como aliado.',
        description: '⚠️ Modo Jinchuuriki — o boss alterna imunidade a tipos de ataque a cada 30s. Ícone sobre o boss indica o tipo imunizado. Adapte suas torres!',
        modifiers: {
          jinchuurikiMode: true
        },
        drops: [
          { id: 'tsunade_piece_4', chance: 100 },
          { id: 'killer_bee', chance: 0.10, pity: 80 }
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
          evtWave([{ type:'replicante_killerbee', count:1, gap:1 }])
        ]
      }

    ]
  }
];
