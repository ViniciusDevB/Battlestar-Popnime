# Evento: Protocolo Nemesis — Última Resistência

**Tema:** Resident Evil clássico (RE1/RE2/RE3)
**Duração prevista:** 7 dias
**Recompensa principal:** Nemesis (unidade 5⭐ exclusiva, já implementada)
**Época de lançamento:** Junto com a missão comunitária "Contenção do Nemesis" (a partir de 08/07/2026)

---

## Visão Geral

Modo de evento roguelike com mapa especial da Raccoon City. O jogador defende um posto de controle contra ondas de zumbis enquanto o Nemesis caça suas torres ativamente. Cada run é única graças a relíquias, eventos aleatórios e escolhas de risco.

Tudo que foi decidido está neste documento. Implemente **parte por parte na ordem das seções**.

---

## Mecânicas Principais (resumo)

| Mecânica | Status |
|---|---|
| Torres com HP próprio | A implementar |
| Nemesis como entidade caçadora | A implementar |
| Nemesis repelível por dano | A implementar |
| Caixas de Suprimento clicáveis | A implementar |
| Sistema de Ervas (Verde / Verde+Vermelha / Azul) | A implementar |
| Countdown — bomba de Raccoon City | A implementar |
| Sobreviventes S.T.A.R.S. (Jill, Leon, Carlos, Ada) | A implementar |
| Relíquias (escolha no início do run) | A implementar |
| Escolhas de risco entre ondas | A implementar |
| Eventos aleatórios por onda | A implementar |
| Safe Room a cada 5 ondas | A implementar |
| Meta-progressão — Arquivo Umbrella | A implementar |

---

## Parte 1 — Estrutura Base do Modo Evento

### 1.1 Novo arquivo: `js/event-manager.js`

Módulo central que controla se um evento está ativo e qual é.

```javascript
const EventManager = (() => {
  let _active = null; // null ou objeto do evento ativo

  function getActive()       { return _active; }
  function isActive(eventId) { return _active?.id === eventId; }
  function start(eventId)    { _active = EVENT_DEFINITIONS[eventId] || null; }
  function end()             { _active = null; }

  return { getActive, isActive, start, end };
})();
```

### 1.2 Novo arquivo: `data/events.js`

Define todos os eventos disponíveis. Por enquanto apenas o Protocolo Nemesis.

```javascript
const EVENT_DEFINITIONS = {
  protocolo_nemesis: {
    id: 'protocolo_nemesis',
    name: 'Protocolo Nemesis',
    mapId: 'raccoon_city',          // mapa especial
    waves: 25,                       // ondas por run
    countdownMinutes: 180,           // 3 horas = pressão do míssil
    nemesisFirstAppearance: 4,       // Nemesis aparece primeiro na onda 4
    nemesisInterval: 4,              // depois a cada 4 ondas
    safeRoomInterval: 5,             // Safe Room a cada 5 ondas
    choiceInterval: 3,               // escolha de risco a cada 3 ondas
    supplyDropRate: 0.4,             // chance por segundo de uma caixa cair
  }
};
```

### 1.3 Entrada no mapa especial: `data/stages.js`

Adicionar a fase do evento ao final do arquivo:

```javascript
raccoon_city: {
  id: 'raccoon_city',
  name: 'Raccoon City',
  world: 'evento',
  isEvent: true,
  eventId: 'protocolo_nemesis',
  path: RACCOON_PATH,   // definir pontos do caminho (ver Parte 2)
  waves: 25,
  thumbnail: 'assets/stages/raccoon_city.png',
  bgColor: '#1a0a00',
}
```

---

## Parte 2 — Mapa de Raccoon City

### 2.1 Novo arquivo: `data/raccoon_path.js`

Caminho temático que passa por pontos reconhecíveis da cidade:

```javascript
const RACCOON_PATH = [
  { x: 0,   y: 300 },   // Entrada da cidade (esquerda)
  { x: 180, y: 300 },   // Rua principal
  { x: 180, y: 150 },   // Curva — direção à RPD
  { x: 380, y: 150 },   // Em frente à Delegacia
  { x: 380, y: 380 },   // Beco lateral
  { x: 580, y: 380 },   // Rua dos laboratórios
  { x: 580, y: 200 },   // Subida para o posto de controle
  { x: 780, y: 200 },   // Posto de controle (base do jogador)
];
```

Ajustar coordenadas conforme o canvas real. O caminho deve ter curvas suficientes para criar zonas de posicionamento interessantes.

### 2.2 Background do mapa

Criar `assets/stages/raccoon_city.png` (ou desenhar via canvas com retângulos escuros e detalhes de cidade à noite). Se for canvas-only, adicionar em `game-renderer.js` uma função `drawRaccoonCityBg()` chamada antes de `drawPath()`.

---

## Parte 3 — Torres com HP (evento only)

### 3.1 Modificar `js/game.js` — função `placeTower()`

Ao colocar uma torre durante o evento, adicionar campos de HP:

```javascript
if (EventManager.isActive('protocolo_nemesis')) {
  const baseTowerHp = 1000 + (tower.rarity * 200);
  tower._eventHp    = baseTowerHp;
  tower._eventMaxHp = baseTowerHp;
}
```

### 3.2 Renderizar barra de HP das torres: `js/game-renderer.js`

Na função que desenha torres (`drawTowers()`), adicionar após o desenho normal:

```javascript
if (EventManager.isActive('protocolo_nemesis') && t._eventHp !== undefined) {
  const pct = t._eventHp / t._eventMaxHp;
  const bw  = 36, bh = 4;
  const bx  = t.x - bw / 2, by = t.y - t.radius - 10;
  ctx.fillStyle = '#111';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
  ctx.fillRect(bx, by, bw * pct, bh);
}
```

### 3.3 Remover torre destruída pelo HP

Em `js/game.js`, no final do game loop principal, adicionar:

```javascript
if (EventManager.isActive('protocolo_nemesis')) {
  towers = towers.filter(t => {
    if (t._eventHp !== undefined && t._eventHp <= 0) {
      addEffect({ type: 'explosion', x: t.x, y: t.y }); // efeito visual
      _applyCountdownPenalty(8);  // −8 minutos (ver Parte 5)
      return false;
    }
    return true;
  });
}
```

---

## Parte 4 — Nemesis como Entidade Caçadora

### 4.1 Estrutura de dados do Nemesis

```javascript
// Estado global do Nemesis durante o evento (em game.js)
let _nemesisEntity = null;

// Estrutura quando ativo:
{
  x: 0, y: 0,           // posição atual no canvas
  targetTower: null,     // referência à torre que ele está caçando
  hp: 40000,            // HP desta visita
  maxHp: 40000,
  speed: 55,            // px/s
  phase: 1,             // 1, 2 ou 3 (escala com ondas)
  state: 'hunting',     // 'hunting' | 'attacking' | 'retreating'
  retreatTimer: 0,      // tempo de retirada após ser repelido
  attackDps: 300,       // dano por segundo na torre
  hitIds: new Set(),    // torres já danificadas nessa visita (reset por visita)
}
```

### 4.2 Escolher o alvo do Nemesis

Função a adicionar em `js/game.js`:

```javascript
function _nemesisPickTarget() {
  if (!towers.length) return null;
  // Ordena por DPS acumulado na última onda (usar tower._waveKills * tower.damage como proxy)
  const sorted = [...towers].sort((a, b) =>
    (b._waveKills || 0) * b.damage - (a._waveKills || 0) * a.damage
  );
  // Escolhe entre as top 3 aleatoriamente para não ser sempre previsível
  // (relíquia "Chave da Armaria" remove o random e sempre pega o #1)
  const pool = sorted.slice(0, Math.min(3, sorted.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
```

### 4.3 Loop do Nemesis: `js/game.js`

Adicionar no game loop principal, após o zombie loop:

```javascript
if (EventManager.isActive('protocolo_nemesis') && _nemesisEntity) {
  _updateNemesis(dt);
}
```

Função `_updateNemesis(dt)`:

```javascript
function _updateNemesis(dt) {
  const n = _nemesisEntity;
  if (!n) return;

  if (n.state === 'retreating') {
    n.retreatTimer -= dt;
    // Move para fora do mapa
    n.x -= n.speed * 2 * dt;
    if (n.retreatTimer <= 0 || n.x < -80) {
      _nemesisEntity = null;
      UI.toast('Nemesis recuou!', 2000);
    }
    return;
  }

  // Hunting: move em linha reta até a torre alvo
  if (n.targetTower && !n.targetTower.disabled) {
    const dx = n.targetTower.x - n.x;
    const dy = n.targetTower.y - n.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 40) {
      n.x += (dx / dist) * n.speed * dt;
      n.y += (dy / dist) * n.speed * dt;
      n.state = 'hunting';
    } else {
      // Chegou na torre — ataca
      n.state = 'attacking';
      n.targetTower._eventHp = Math.max(0, (n.targetTower._eventHp || 0) - n.attackDps * dt);
    }
  }

  // Torres em range atacam Nemesis automaticamente
  towers.forEach(t => {
    if (distSq(t.x, t.y, n.x, n.y) < t.range * t.range) {
      const dmg = getTowerStats(t).damage * dt * (t.charData.base_stats?.attack_speed || 1);
      n.hp -= dmg;
    }
  });

  // Repelido?
  if (n.hp <= 0) {
    n.state = 'retreating';
    n.retreatTimer = 1.5;
    UI.toast('🔥 Nemesis foi repelido!', 2500);
    _applyCountdownBonus(3); // salvar tempo por repelir
  }
}
```

### 4.4 Spawnar o Nemesis por onda

Em `js/game.js`, na função `onWaveStart()` (ou onde ondas começam):

```javascript
function _checkNemesisSpawn(waveNum) {
  if (!EventManager.isActive('protocolo_nemesis')) return;
  const cfg = EVENT_DEFINITIONS.protocolo_nemesis;
  if (waveNum < cfg.nemesisFirstAppearance) return;
  if ((waveNum - cfg.nemesisFirstAppearance) % cfg.nemesisInterval !== 0) return;

  const target = _nemesisPickTarget();
  if (!target) return;

  // Fase do Nemesis escala com a onda
  const phase = waveNum <= 8 ? 1 : waveNum <= 16 ? 2 : 3;
  const hpByPhase = { 1: 40000, 2: 60000, 3: 85000 };
  // HP escala também com número de vezes que já apareceu
  const appearances = _nemesisAppearances || 0;
  _nemesisAppearances = appearances + 1;

  _nemesisEntity = {
    x: -60, y: target.y,              // entra pela esquerda
    targetTower: target,
    hp:    hpByPhase[phase] * (1 + appearances * 0.15),
    maxHp: hpByPhase[phase] * (1 + appearances * 0.15),
    speed: 55 + (phase - 1) * 20,
    phase,
    state: 'hunting',
    retreatTimer: 0,
    attackDps: 300 * phase,
    hitIds: new Set(),
  };

  UI.toast(`☣️ NEMESIS DETECTADO — FASE ${phase}`, 3000);
}
```

### 4.5 Renderizar Nemesis: `js/game-renderer.js`

```javascript
// Após drawZombies(), antes de drawTowers()
if (EventManager.isActive('protocolo_nemesis') && typeof _nemesisEntity !== 'undefined' && _nemesisEntity) {
  const n = _nemesisEntity;
  ctx.save();
  ctx.shadowBlur = 25; ctx.shadowColor = '#7f1d1d';
  // Corpo
  ctx.fillStyle = '#1c0a0a';
  ctx.beginPath(); ctx.arc(n.x, n.y, 34, 0, Math.PI * 2); ctx.fill();
  // Contorno pulsante vermelho
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(n.x, n.y, 34, 0, Math.PI * 2); ctx.stroke();
  // Inicial
  ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 18px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', n.x, n.y);
  // Barra de HP
  const pct = n.hp / n.maxHp;
  ctx.fillStyle = '#450a0a'; ctx.fillRect(n.x - 34, n.y - 46, 68, 6);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(n.x - 34, n.y - 46, 68 * pct, 6);
  ctx.restore();
}
```

---

## Parte 5 — Countdown (Bomba de Raccoon City)

### 5.1 Estado global em `js/game.js`

```javascript
let _eventCountdown = 0;  // segundos restantes
let _eventCountdownActive = false;
```

### 5.2 Inicializar ao começar o evento

```javascript
function _startEventCountdown() {
  const cfg = EventManager.getActive();
  _eventCountdown       = (cfg.countdownMinutes * 60);
  _eventCountdownActive = true;
}
```

### 5.3 Atualizar no loop

```javascript
if (_eventCountdownActive && _eventCountdown > 0) {
  _eventCountdown -= dt;
  if (_eventCountdown <= 0) {
    _eventCountdown = 0;
    _triggerCountdownExplosion(); // game over
  }
}
```

### 5.4 Penalidades e bônus

```javascript
function _applyCountdownPenalty(minutes) {
  _eventCountdown = Math.max(0, _eventCountdown - minutes * 60);
  UI.toast(`💣 −${minutes} minutos!`, 1500);
}
function _applyCountdownBonus(minutes) {
  _eventCountdown += minutes * 60;
  UI.toast(`⏱ +${minutes} minutos salvos!`, 1500);
}
```

| Evento | Efeito |
|---|---|
| Torre destruída por Nemesis | −8 minutos |
| Vida perdida | −5 minutos |
| Nemesis chega à torre (começa a atacar) | −3 minutos por segundo |
| Nemesis repelido | +3 minutos |
| Sobrevivente resgatado | +5 minutos |

### 5.5 Renderizar contador: `js/game-renderer.js`

No HUD do evento (no canto superior):

```javascript
if (_eventCountdownActive) {
  const s   = Math.max(0, Math.floor(_eventCountdown));
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const str = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  const urgent = s < 600; // últimos 10 minutos
  ctx.save();
  ctx.fillStyle = urgent ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.75)';
  ctx.fillRect(CANVAS_W / 2 - 80, 8, 160, 32);
  ctx.fillStyle = urgent ? '#fca5a5' : '#f1f5f9';
  ctx.font = `bold ${urgent ? 18 : 16}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`💣 ${str}`, CANVAS_W / 2, 24);
  ctx.restore();
}
```

---

## Parte 6 — Caixas de Suprimento

### 6.1 Estrutura de dados em `js/game.js`

```javascript
let _supplyCrates = []; // array de caixas ativas no canvas

// Estrutura de cada caixa:
{
  x: 200, y: 180,
  item: 'green_herb',  // ver tabela de itens
  timer: 12,           // desaparece após 12s se não coletada
  collected: false,
}
```

### 6.2 Tabela de itens e pesos de drop

```javascript
const SUPPLY_ITEMS = [
  { id: 'repair_kit',   label: '🔧 Kit de Reparo',          weight: 35 },
  { id: 'green_herb',   label: '💊 Erva Verde',              weight: 30 },
  { id: 'blue_herb',    label: '🌿 Erva Azul',               weight: 15 },
  { id: 'red_herb',     label: '❤️ Erva Vermelha',           weight: 10 },
  { id: 'radio',        label: '📡 Rádio de Emergência',     weight: 7  },
  { id: 'ammo_cache',   label: '🔫 Cache de Munição',        weight: 3  },
];
```

### 6.3 Spawn aleatório em `js/game.js`

```javascript
let _supplySpawnTimer = 0;

// No loop:
if (EventManager.isActive('protocolo_nemesis') && waveActive) {
  _supplySpawnTimer += dt;
  if (_supplySpawnTimer >= 8 && Math.random() < 0.4) { // a cada ~8s, 40% chance
    _supplySpawnTimer = 0;
    _spawnSupplyCrate();
  }
}

function _spawnSupplyCrate() {
  // Posição aleatória fora do caminho principal
  const x = 80 + Math.random() * (CANVAS_W - 160);
  const y = 60 + Math.random() * (CANVAS_H - 120);
  const item = _weightedRandom(SUPPLY_ITEMS);
  _supplyCrates.push({ x, y, item: item.id, label: item.label, timer: 12, collected: false });
}
```

### 6.4 Click para coletar

Em `js/game.js`, no handler de click do canvas:

```javascript
if (EventManager.isActive('protocolo_nemesis')) {
  for (let i = _supplyCrates.length - 1; i >= 0; i--) {
    const c = _supplyCrates[i];
    if (distSq(clickX, clickY, c.x, c.y) < 900) { // raio 30px
      _collectSupplyCrate(c);
      _supplyCrates.splice(i, 1);
      break;
    }
  }
}
```

### 6.5 Efeitos dos itens

```javascript
function _collectSupplyCrate(crate) {
  switch (crate.item) {
    case 'repair_kit':
      // Próximo click em torre restaura HP — entra em modo "selecionar torre"
      _pendingItem = 'repair_kit';
      UI.toast('🔧 Clique em uma torre para reparar!', 3000);
      break;
    case 'green_herb':
      _herbInventory.green++;
      UI.toast('💊 Erva Verde coletada!', 2000);
      break;
    case 'red_herb':
      _herbInventory.red++;
      UI.toast('❤️ Erva Vermelha coletada!', 2000);
      break;
    case 'blue_herb':
      // Limpa infecção de todas as torres em área
      towers.forEach(t => { if (t._infected) t._infected = false; });
      UI.toast('🌿 Erva Azul usada — infecção removida!', 2500);
      break;
    case 'radio':
      towers.forEach(t => t._radioBoost = 20); // 20s de +40% atk speed
      UI.toast('📡 Rádio de Emergência — ataque +40% por 20s!', 2500);
      break;
    case 'ammo_cache':
      towers.forEach(t => t._eventHp = t._eventMaxHp); // restaura todos
      UI.toast('🔫 Cache de Munição — todas as torres reparadas!', 2500);
      break;
  }
}
```

### 6.6 Combinar Verde + Vermelha

```javascript
function _tryHerbCombine() {
  if (_herbInventory.green > 0 && _herbInventory.red > 0) {
    _herbInventory.green--;
    _herbInventory.red--;
    _pendingItem = 'combined_herb';
    UI.toast('🌿❤️ Erva Combinada! Clique em uma torre.', 3000);
  }
}
```

Combinação: restaura 100% HP da torre e a torna imune ao dano do Nemesis por 25s (brilho dourado na torre).

---

## Parte 7 — Sobreviventes S.T.A.R.S.

### 7.1 Estrutura de dados

```javascript
const STARS_SURVIVORS = {
  jill: {
    id: 'jill', name: 'Jill Valentine', color: '#60a5fa',
    hp: 300, speed: 80,
    ability: 'trap',       // ao chegar: planta armadilha (slow forte em área)
    abilityDesc: 'Planta armadilha — slow 70% em área por 8s',
  },
  leon: {
    id: 'leon', name: 'Leon Kennedy', color: '#a78bfa',
    hp: 250, speed: 90,
    ability: 'shotgun',    // ao chegar: stun no Nemesis por 4s
    abilityDesc: 'Shotgun blast — atordoa Nemesis por 4s',
  },
  carlos: {
    id: 'carlos', name: 'Carlos Oliveira', color: '#34d399',
    hp: 350, speed: 70,
    ability: 'firstaid',   // ao chegar: cura todas torres próximas em 40%
    abilityDesc: 'First Aid Spray — cura torres próximas em 40%',
  },
  ada: {
    id: 'ada', name: 'Ada Wong', color: '#f472b6',
    hp: 200, speed: 100,
    ability: 'intel',      // ao chegar: revela próximo alvo do Nemesis por 20s
    abilityDesc: 'Intel — revela próximo alvo do Nemesis com 20s de antecedência',
  },
};
```

### 7.2 Sobreviventes como entidades no mapa

Movem-se pelo caminho na MESMA direção que os inimigos (do spawn para a base), mas são amigos. Inimigos não os atacam — mas o Nemesis sim, se estiver em range.

```javascript
let _starsEntities = [];

// Estrutura:
{
  survivor: STARS_SURVIVORS.jill,
  hp: 300, maxHp: 300,
  dist: 0,              // começa no início do caminho
  speed: 80,
  reached: false,
  dead: false,
}
```

### 7.3 Loop dos sobreviventes em `js/game.js`

```javascript
_starsEntities.forEach(s => {
  if (s.dead || s.reached) return;
  s.dist += s.speed * dt;
  const pos = getPosOnPath(s.dist, PATH_POINTS);
  s.x = pos.x; s.y = pos.y;

  // Nemesis ataca sobrevivente se em range
  if (_nemesisEntity && distSq(s.x, s.y, _nemesisEntity.x, _nemesisEntity.y) < 3600) {
    s.hp -= 150 * dt;
  }

  // Chegou à base?
  if (s.dist >= getPathLength(PATH_POINTS)) {
    s.reached = true;
    _activateStarsSurvivor(s.survivor);
    _applyCountdownBonus(5);
    UI.toast(`✅ ${s.survivor.name} chegou! ${s.survivor.abilityDesc}`, 4000);
  }

  if (s.hp <= 0) {
    s.dead = true;
    _applyCountdownPenalty(10);
    UI.toast(`💀 ${s.survivor.name} foi eliminado! −10 minutos`, 3000);
  }
});
_starsEntities = _starsEntities.filter(s => !s.dead && !s.reached);
```

### 7.4 Spawn a cada 5 ondas

```javascript
function _spawnStarsSurvivor(waveNum) {
  if (!EventManager.isActive('protocolo_nemesis')) return;
  if (waveNum % 5 !== 0) return;
  const keys = Object.keys(STARS_SURVIVORS);
  const key  = keys[Math.floor(Math.random() * keys.length)];
  const surv = STARS_SURVIVORS[key];
  _starsEntities.push({
    survivor: surv,
    hp: surv.hp, maxHp: surv.hp,
    dist: 0, speed: surv.speed,
    reached: false, dead: false,
  });
  UI.toast(`⚠️ ${surv.name} detectada no perímetro!`, 2500);
}
```

---

## Parte 8 — Relíquias (início do run)

### 8.1 Definição em `data/events.js`

```javascript
const EVENT_RELICS = [
  {
    id: 'armory_key',
    name: 'Chave da Armaria',
    icon: '🔑',
    desc: '+1 slot de torre. Nemesis sempre mira a torre mais forte.',
    apply(ctx) { ctx.extraTowerSlot = true; ctx.nemesisAlwaysTop = true; }
  },
  {
    id: 'experimental_serum',
    name: 'Soro Experimental',
    icon: '💉',
    desc: 'Ervas curam 100% do HP. Torres começam com 50% de vida.',
    apply(ctx) { ctx.herbHealFull = true; ctx.towerHpMult = 0.5; }
  },
  {
    id: 'stars_transmitter',
    name: 'Transmissor S.T.A.R.S.',
    icon: '📡',
    desc: 'Sobreviventes a cada 3 ondas (normal: 5). Chegam com 50% HP.',
    apply(ctx) { ctx.starsInterval = 3; ctx.starsHpMult = 0.5; }
  },
  {
    id: 'rigged_clock',
    name: 'Relógio Engatilhado',
    icon: '⏱️',
    desc: 'Countdown começa com +1 hora. Nemesis 30% mais frequente.',
    apply(ctx) { ctx.countdownBonus = 3600; ctx.nemesisIntervalMult = 0.7; }
  },
  {
    id: 'g_virus_sample',
    name: 'Amostra Vírus-G',
    icon: '🧬',
    desc: 'Torres infectam Nemesis (+25% dano acumulado). Torres perdem 2 HP/s.',
    apply(ctx) { ctx.infectionDamageBonus = 0.25; ctx.passiveHpDrain = 2; }
  },
];
```

### 8.2 Tela de seleção de relíquia

Antes de iniciar a run, renderizar um modal (pode ser HTML puro, como os outros modais):

```javascript
// Em js/event-relic-ui.js (novo arquivo)
function showRelicSelection(onChoose) {
  // Sortear 3 relíquias aleatórias do pool
  const shuffled = [...EVENT_RELICS].sort(() => Math.random() - 0.5);
  const options  = shuffled.slice(0, 3);
  // Renderizar modal com as 3 cartas
  // Ao clicar em uma: onChoose(relic) → aplicar e fechar modal
}
```

---

## Parte 9 — Escolhas de Risco entre Ondas

### 9.1 Pool de escolhas em `data/events.js`

```javascript
const EVENT_CHOICES = [
  {
    id: 'experimental_ammo',
    label: 'Munição Experimental',
    pros: '+40% dano por 3 ondas',
    cons: 'Torres perdem HP 2× mais rápido',
    apply(ctx) { ctx.damageMult3Waves = 1.4; ctx.hpDrainMult = 2; }
  },
  {
    id: 'sector_reinforcement',
    label: 'Reforço de Setor',
    pros: 'Escolha uma torre: HP dobrado permanentemente',
    cons: '−10 minutos no countdown',
    apply(ctx) { ctx.pendingDoubleHp = true; _applyCountdownPenalty(10); }
  },
  {
    id: 'umbrella_air_support',
    label: 'Cobertura Aérea Umbrella',
    pros: 'Caixas de suprimento automáticas por 2 ondas',
    cons: 'Barris de gás causam dano em área aleatória',
    apply(ctx) { ctx.autoSupply2Waves = true; ctx.gasCanisters = true; }
  },
  {
    id: 'sacrifice_protocol',
    label: 'Protocolo de Sacrifício',
    pros: 'Destrua uma torre → todas as outras curam 100%',
    cons: 'Torre sacrificada demora 2 ondas para voltar',
    apply(ctx) { ctx.pendingSacrifice = true; }
  },
  {
    id: 'nemesis_data',
    label: 'Dados de Rastreio do Nemesis',
    pros: 'Revela o próximo alvo do Nemesis sempre',
    cons: 'Nemesis aparece com +20% HP nesse run',
    apply(ctx) { ctx.showNemesisTarget = true; ctx.nemesisHpMult = (ctx.nemesisHpMult||1) * 1.2; }
  },
];
```

### 9.2 Apresentar escolha entre ondas

Na função de fim de onda (`onWaveEnd()`):

```javascript
if (EventManager.isActive('protocolo_nemesis') && wave % 3 === 0) {
  const shuffled = [...EVENT_CHOICES].sort(() => Math.random() - 0.5);
  showEventChoice(shuffled[0], shuffled[1]); // modal com 2 opções
}
```

---

## Parte 10 — Eventos Aleatórios por Onda

### 10.1 Pool de eventos em `data/events.js`

```javascript
const WAVE_EVENTS = [
  {
    id: 'licker_outbreak',
    label: '⚠️ Surto de Lickers',
    desc: 'Inimigos desta onda ignoram slow e freeze.',
    chance: 0.15,
    apply(waveEnemies) { waveEnemies.forEach(e => e.immuneToSlow = true); }
  },
  {
    id: 'umbrella_cleanup',
    label: '🚁 Equipe de Contenção',
    desc: 'Soldados Umbrella causam dano colateral em torres.',
    chance: 0.12,
    apply() { _spawnUmbrellaTeam(); }
  },
  {
    id: 'mass_mutation',
    label: '🧬 Mutação em Massa',
    desc: 'Inimigos lentos se tornam Crimson Heads.',
    chance: 0.18,
    apply() { _enableCrimsonHeadMutation(); }
  },
  {
    id: 'nemesis_rage',
    label: '☣️ Fúria do Nemesis',
    desc: 'Nemesis aparece DURANTE esta onda.',
    chance: 0.10,
    apply(waveNum) { _checkNemesisSpawn(waveNum, true); } // force spawn
  },
  {
    id: 'power_surge',
    label: '⚡ Sobrecarga Elétrica',
    desc: 'Torres causam 3× dano, mas perdem 30% HP max ao fim.',
    chance: 0.15,
    apply() { _activePowerSurge = true; }
  },
];
```

### 10.2 Sortear evento ao iniciar onda

```javascript
function _rollWaveEvent(waveNum) {
  for (const ev of WAVE_EVENTS) {
    if (Math.random() < ev.chance) {
      UI.toast(`${ev.label}: ${ev.desc}`, 3500);
      ev.apply(waveNum);
      return ev;
    }
  }
  return null;
}
```

---

## Parte 11 — Safe Room

### 11.1 Triggerar a cada 5 ondas

```javascript
function _checkSafeRoom(waveNum) {
  if (!EventManager.isActive('protocolo_nemesis')) return;
  if (waveNum % 5 !== 0) return;
  _enterSafeRoom();
}

function _enterSafeRoom() {
  // Pausa o spawn de inimigos
  betweenWaves = true;
  betweenTimer = 25; // 25 segundos
  // Muda música (disparar evento de áudio)
  // Mostra UI de Safe Room com: inventário de ervas, estado das torres, typewriter
  showSafeRoomUI();
}
```

### 11.2 Typewriter — salvar bônus

Clicar no typewriter dentro da Safe Room dá uma escolha:
- Congelar HP atual de uma torre (não pode regredir mesmo sem ervas)
- Guardar 1 erva verde no "bolso" (usável a qualquer momento com botão de atalho)

---

## Parte 12 — Meta-progressão (Arquivo Umbrella)

### 12.1 Salvar progresso em `js/save.js`

Adicionar ao `defaultSave()`:

```javascript
evento_nemesis: {
  runs_completas:    0,
  nemesis_repelidos: 0,
  survivors_rescued: 0,
  best_countdown:    0,  // maior countdown restante ao completar
  unlocked_files:    [], // IDs dos arquivos desbloqueados
}
```

### 12.2 Arquivo Umbrella — tabela completa

| ID | Como desbloquear | Bônus permanente |
|---|---|---|
| `vt_report_1` | Completar 1 run | Nemesis 10% mais lento |
| `jill_field_notes` | Resgatar Jill 5x | Jill spawna sempre com HP cheio |
| `anti_infection` | Repelir Nemesis 10x | Torres +15% HP base |
| `carlos_diary` | Run sem perder torres | Carlos cura +50% |
| `nemesis_dossier` | Run com countdown > 1h restante | Skin visual do Nemesis |
| `stars_final_report` | Resgatar todos os 4 survivors numa run | +5 min de bônus ao resgatar survivors |

---

## Ordem de Implementação Recomendada

```
1. EventManager + data/events.js             (base, sem isso nada funciona)
2. Mapa Raccoon City (path + background)      (visual, fácil de testar)
3. Torres com HP + renderização               (fundação das mecânicas)
4. Countdown                                  (pressão constante)
5. Caixas de Suprimento + Ervas              (loop de recursos)
6. Nemesis entidade (hunting + repel)         (mecânica principal)
7. Sobreviventes S.T.A.R.S.                  (camada de narrativa)
8. Safe Room                                  (respiro entre ondas)
9. Relíquias + tela de seleção               (roguelike layer 1)
10. Escolhas de risco entre ondas             (roguelike layer 2)
11. Eventos aleatórios por onda               (roguelike layer 3)
12. Meta-progressão (Arquivo Umbrella)        (loop de longo prazo)
```

---

## Arquivos a Criar

| Arquivo | Propósito |
|---|---|
| `js/event-manager.js` | Controle central de eventos ativos |
| `js/event-nemesis.js` | Lógica específica do evento (Nemesis, countdown, etc.) |
| `js/event-ui.js` | Modais: seleção de relíquia, escolha de risco, safe room |
| `data/events.js` | Dados: definições, relíquias, escolhas, eventos de onda |
| `data/raccoon_path.js` | Coordenadas do caminho de Raccoon City |

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| `js/game.js` | Loop: Nemesis, survivors, supply crates, countdown, evento hooks |
| `js/game-renderer.js` | Desenhar: Nemesis, survivors, caixas, HP towers, countdown HUD |
| `js/save.js` | Novo campo `evento_nemesis` no defaultSave |
| `data/stages.js` | Fase `raccoon_city` |
| `index.html` | Incluir novos scripts |
