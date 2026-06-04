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
    desc: 'Um meteoro misterioso caiu nas florestas do País do Fogo, trazendo criaturas de outra dimensão. O começo de uma colisão multiversal.',
    stages: [
      {
        id: 'evt1_p1',
        name: 'Parte 1: O Meteoro Laranja',
        world: 'naruto',
        difficulty: 'normal',
        description: 'Proteja o guerreiro inconsciente no centro! 5 Caminhos simultâneos. Se 5 inimigos passarem, você perde. Efeito: 15% de lentidão nas torres.',
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
        ],
        dialogues: {
          start: [
            { name: 'Naruto', text: 'Ei, Sasuke! Tem alguém ali no meio daquela cratera! Ele está usando laranja, que bom gosto!', side: 'left', leftImg: 'assets/towers/update0/Naruto.png' },
            { name: 'Sasuke', text: 'Idiota, preste atenção. Essa fumaça roxa ao redor da cratera... está sugando nosso chakra. Sinto meus movimentos mais lentos.', side: 'right', rightImg: 'assets/towers/update0/Sasuke.png', leftImg: 'assets/towers/update0/Naruto.png' },
            { name: 'Naruto', text: 'Tem ninjas renegados vindo! Eles parecem controlados pela fumaça... Vamos proteger o cara de laranja!', side: 'left', leftImg: 'assets/towers/update0/Naruto.png', rightImg: 'assets/towers/update0/Sasuke.png' }
          ],
          end: [
            { name: 'Sasuke', text: 'Eles recuaram. Vamos ver quem é esse cara.', side: 'right', rightImg: 'assets/towers/update0/Sasuke.png' },
            { name: '???', text: 'Ugh... meu corpo... Onde eu tô? Tem comida?', side: 'left', leftImg: 'assets/towers/update0/Goku.png', rightImg: 'assets/towers/update0/Sasuke.png' }
          ]
        }
      },
      {
        id: 'evt1_p2',
        name: 'Parte 2: Bestas Sem Rosto',
        world: 'naruto',
        difficulty: 'normal',
        description: 'A energia atrai bestas espirituais. O mapa está em Breu Total. Torres de dano Físico dão 30% menos dano.',
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
        ],
        dialogues: {
          start: [
            { name: 'Goku', text: 'Oi! Eu sou o Goku! Eu sinto energias estranhas vindo do céu... que escuro é esse de repente?', side: 'left', leftImg: 'assets/towers/update0/Goku.png' },
            { name: 'Sasuke', text: 'O céu foi coberto por uma névoa negra. E o pior... tem monstros vindo.', side: 'right', rightImg: 'assets/towers/update0/Sasuke.png', leftImg: 'assets/towers/update0/Goku.png' },
            { name: 'Naruto', text: 'Minhas kunais não causam tanto dano neles! Precisamos usar jutsus de fogo ou sangramento!', side: 'left', leftImg: 'assets/towers/update0/Naruto.png', rightImg: 'assets/towers/update0/Sasuke.png' }
          ],
          end: [
            { name: 'Goku', text: 'Esses caras são fortes! Mas eu não entendo... por que eles vieram parar aqui?', side: 'left', leftImg: 'assets/towers/update0/Goku.png' }
          ]
        }
      },
      {
        id: 'evt1_p3',
        name: 'Parte 3: O Experimento Sombrio',
        world: 'naruto',
        difficulty: 'hard',
        description: 'A Batalha Final. A cada 20 segundos, Pain invoca Meteoros que atordoam áreas por 8s, e um Shinra Tensei global que empurra os inimigos para frente e atordoa o resto por 2.5s!',
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
        ],
        dialogues: {
          start: [
            { name: 'Pain', text: 'O mundo conhecerá a verdadeira dor...', side: 'right' },
            { name: 'Sasuke', text: 'Pain! O que há de errado com o chakra dele?', side: 'left', leftImg: 'assets/towers/update0/Sasuke.png' },
            { name: 'Pain', text: 'Eu absorvi a energia da anomalia.', side: 'right' }
          ],
          mid_boss: [
            { name: 'Pain', text: 'Sintam a dor divina!', side: 'right' }
          ],
          end: [
            { name: 'Pain', text: 'Impossível... Aizen-sama estava certo. O multiverso... está acordando...', side: 'right' },
            { name: 'Goku', text: 'Aizen? Quem é esse cara? Acho que a gente precisa descobrir, Naruto!', side: 'left', leftImg: 'assets/towers/update0/Goku.png' },
            { name: 'Naruto', text: 'Pode apostar, Goku! A Equipe Popnime acabou de nascer!', side: 'right', rightImg: 'assets/towers/update0/Naruto.png', leftImg: 'assets/towers/update0/Goku.png' }
          ]
        }
      }
    ]
  }
];
