// Logical canvas size: 1024 x 600
const CANVAS_W = 1024;
const CANVAS_H = 600;

const PATH_POINTS_W1 = [
  {x: -20, y: 300},
  {x: 100, y: 300},
  {x: 100, y: 125},
  {x: 350, y: 125},
  {x: 350, y: 450},
  {x: 650, y: 450},
  {x: 650, y: 200},
  {x: 900, y: 200},
  {x: 1044, y: 200}
];

const PATH_POINTS_W2 = [
  {x: -20, y: 150},
  {x: 200, y: 150},
  {x: 350, y: 250},
  {x: 350, y: 450},
  {x: 550, y: 500},
  {x: 750, y: 450},
  {x: 750, y: 250},
  {x: 600, y: 150},
  {x: 850, y: 100},
  {x: 1044, y: 150}
];

const PATH_POINTS_W3 = [
  {x: -20,  y: 480},
  {x: 140,  y: 480},
  {x: 140,  y: 320},
  {x: 340,  y: 320},
  {x: 340,  y: 140},
  {x: 580,  y: 140},
  {x: 580,  y: 380},
  {x: 800,  y: 380},
  {x: 800,  y: 200},
  {x: 1044, y: 200}
];

// Caminho especial do Modo Infinito — curva em S com 3 viradas
const PATH_POINTS_INF = [
  {x: -20,  y: 300},
  {x: 170,  y: 300},
  {x: 170,  y: 110},
  {x: 430,  y: 110},
  {x: 430,  y: 490},
  {x: 660,  y: 490},
  {x: 660,  y: 200},
  {x: 870,  y: 200},
  {x: 870,  y: 420},
  {x: 1044, y: 420}
];

let PATH_POINTS = PATH_POINTS_W1;
let PATH_LENGTH = 0;

const WORLDS = [
  {
    id: 'naruto', name: 'Mundo Naruto',
    unlocked: true,
    completionStat: 'fases_naruto_completas',
    stages: ['fase1','fase2','fase3','fase4','fase5','fase6'],
    description: 'O mundo dos ninjas. Enfrente as forças da Akatsuki!',
    color: '#e67e22',
    path: PATH_POINTS_W1
  },
  {
    id: 'onepiece', name: 'Grand Line',
    unlocked: true,
    completionStat: 'fases_op_completas',
    stages: ['op_fase1','op_fase2','op_fase3','op_fase4','op_fase5','op_fase6'],
    description: 'Navegue pelos mares perigosos e enfrente piratas terríveis!',
    color: '#3498db',
    path: PATH_POINTS_W2
  }
  ,{
    id: 'bleach', name: 'Soul Society',
    unlocked: true,
    completionStat: 'fases_bleach_completas',
    stages: ['bl_fase1','bl_fase2','bl_fase3','bl_fase4'],
    description: 'Adentre o mundo dos Shinigami. Enfrente Hollows, Arrancar e os temidos Menos!',
    color: '#2980b9',
    path: PATH_POINTS_W3
  },
  {
    id: 'infinito', name: '♾ Modo Infinito',
    unlocked: true,
    completionStat: 'ondas_infinito',
    stages: ['infinito_partida'],
    description: 'Ondas sem fim. Dificuldade escala a cada tier. Farm de Star Experience e materiais raros. Máx 3 cópias por torre.',
    color: '#8b5cf6',
    path: PATH_POINTS_INF
  }
];

function getPathLength(pathArr = PATH_POINTS) {
  let len = 0;
  for (let i = 1; i < pathArr.length; i++) {
    const dx = pathArr[i].x - pathArr[i-1].x;
    const dy = pathArr[i].y - pathArr[i-1].y;
    len += Math.sqrt(dx*dx + dy*dy);
  }
  return len;
}

function updatePath(points) {
  PATH_POINTS = points;
  PATH_LENGTH = getPathLength(points);
}

function getPosOnPath(dist, pathArr = PATH_POINTS) {
  let rem = dist;
  for (let i = 1; i < pathArr.length; i++) {
    const dx = pathArr[i].x - pathArr[i-1].x;
    const dy = pathArr[i].y - pathArr[i-1].y;
    const seg = Math.sqrt(dx*dx + dy*dy);
    if (rem <= seg) {
      const t = rem / seg;
      return { x: pathArr[i-1].x + dx*t, y: pathArr[i-1].y + dy*t };
    }
    rem -= seg;
  }
  return { x: pathArr[pathArr.length-1].x, y: pathArr[pathArr.length-1].y };
}

updatePath(PATH_POINTS_W1);
