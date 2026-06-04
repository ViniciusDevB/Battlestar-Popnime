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
        description: '⚠️ A cada 20s: Pain invoca meteoros (stun 8s nas torres atingidas) + Shinra Tensei global (empurra inimigos + stun 2.5s em todas as torres).',
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
  }
];
