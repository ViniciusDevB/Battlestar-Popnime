# GDD — Update 4: Marvel vs DC — Colapso Multiversal

> Documento de design técnico e mecânico. Nada aqui deve ser implementado até decisão explícita.

---

## Visão Geral

Evento especial do Update 4. Modo temporário com regras próprias, mapa exclusivo e mecânicas que subvertem o motor base do jogo. Diferente dos mundos anteriores, não adiciona conteúdo permanente — é uma campanha de extrema dificuldade com economia de fragmentos e loja exclusiva.

**Prêmio máximo:** Superman (Mergulho Solar) 6★ — ver `docs/personagens/superman-mergulho-solar.md`.

---

## Mecânicas Globais do Evento

### 1. Novo Tipo de Inimigo — `ptype: infinite`

Nova classe de inimigo exclusiva do evento. Diferente de qualquer inimigo existente:

- Atributos base de velocidade e resistência muito superiores ao normal, mesmo sem as tags `Speed` ou `Fortified`.
- **Ciclo Contínuo:** Se um inimigo `infinite` chegar ao fim do caminho, causa dano à base normalmente — mas **em vez de desaparecer, é teleportado de volta ao ponto de spawn**. Continua fazendo esse ciclo e drenando a base até ser morto pelas torres.
- Forçam o jogador a garantir DPS suficiente para eliminar antes que o ciclo se estabeleça — um único inimigo `infinite` não tratado pode fazer o run inteiro desmoronar lentamente.

#### Implementação

```js
// Em updateEnemiesLoop(), após e.reachedEnd:
if (e.ptype === 'infinite') {
  base.hp -= e.damage;
  e.x = spawnPoint.x;
  e.y = spawnPoint.y;
  e.waypointIndex = 0;
  // NÃO marca como morto — continua no array de vivos
  return;
}
```

---

### 2. Incursão Dupla — Mapa em X (Dois Spawns)

O mapa não tem um spawn único. Existem **dois portais**:

- **Portal Vermelho** → inimigos Marvel
- **Portal Azul** → inimigos DC

Os caminhos partem das extremidades opostas e se cruzam no **centro do mapa**. A base do jogador fica em um ponto seguro após o cruzamento.

- Forçam divisão de defesas entre os dois flancos.
- O ponto central de cruzamento é o **choke point natural** — concentrar torres ali cobre ambos os caminhos, mas qualquer mecânica que bloqueie esse ponto (ex: fase 5) desestrutura toda a formação.
- Implementação: dois arrays de waypoints independentes em `stages.js`. O motor de pathfinding não precisa de alteração — cada inimigo recebe o array do portal de origem ao spawnar.

---

### 3. Sinergia de Facção

Torres não são restritas por facção (o jogador pode usar qualquer personagem disponível). Em vez disso, torres ganham **bônus ao atacar a facção oposta**:

| Torre | Atacando inimigos... | Bônus |
|---|---|---|
| Marvel | DC | +X% de dano, quebra de escudo (ignora Fortified) |
| DC | Marvel | +X% de velocidade de ataque, ignora esquiva/velocidade |

Os valores de X são a definir durante balanceamento. O bônus é passivo e automático — sem ativação manual.

#### Implementação

```js
// Em dealDamage(), antes de aplicar dano:
if (tower.faction === 'marvel' && enemy.faction === 'dc') {
  damage *= MARVEL_DC_BONUS_MULT;
  enemy.fortified = false; // quebra escudo temporariamente
}
if (tower.faction === 'dc' && enemy.faction === 'marvel') {
  tower._attackCooldown *= DC_MARVEL_SPEED_MULT; // ataca mais rápido
  // ignora esquiva — aplicar flag no enemy
}
```

Cada personagem em `characters.js` precisa do campo `faction: 'marvel' | 'dc' | null`. Personagens de outras séries têm `faction: null` e não recebem nem aplicam o bônus.

---

### 4. Economia de Fragmentos

Inimigos derrotados no evento dropam **Fragmentos de Colisão**.

| Dificuldade | Fragmentos por inimigo comum | Boss |
|---|---|---|
| Normal | 1 | 50 |
| Difícil | 2 | 120 |
| Lendário | 4 | 300 |

Valores a calibrar. Os fragmentos ficam em `save.eventos.marvel_dc.fragmentos` e são exibidos numa UI específica do evento.

---

## Loja de Convergência

Moeda exclusiva: Fragmentos de Colisão. Itens disponíveis:

| Item | Custo | Limite |
|---|---|---|
| **Superman (Mergulho Solar) 6★** | Massivo (a definir) | 1 por conta |
| Ticket de invocação 5★ aleatória | Alto | Ilimitado |
| Ticket de invocação 4★ aleatória | Médio | Ilimitado |
| Gemas | Baixo | Ilimitado |
| Ticket padrão (gacha) | Baixo | Ilimitado |
| Pacote ingredientes Naruto | Baixo | Ilimitado |
| Pacote ingredientes One Piece | Baixo | Ilimitado |
| Pacote ingredientes Bleach | Baixo | Ilimitado |
| Pacote ingredientes Marvel | Baixo | Ilimitado |

---

## As 6 Fases — Campanha Colapso Multiversal

Cada fase introduz uma **regra que altera o motor base do jogo**. O miniboss de cada fase personifica e explora essa quebra de regra.

---

### Fase 1 — A Fusão Equivalente

**Regra da fase:** Upgrade de torres via ouro está **desativado**. Para subir o nível de uma torre, o jogador deve comprar cópias idênticas e **fundi-las** (arrastar uma sobre a outra no mapa).

**Miniboss — Lex Luthor (Traje de Guerra)**

Irradia um pulso supressor em área. Torres dentro do raio do pulso têm fusões desativadas temporariamente, regredindo para Nível 1 até Luthor ser abatido ou sair do alcance.

**Notas de implementação:**
- Flag `EventMarvelDC.fusionMode = true` durante a fase.
- No `buyNextUpgrade()`: se `fusionMode`, bloqueiar e exibir feedback "Fusão necessária".
- UI de fusão: arrastar card de torre sobre outra idêntica no mapa abre modal de confirmação.
- Luthor emite `aoe_suppress` que seta `tower.fusionLocked = true` nas torres no raio.

---

### Fase 2 — Terreno Desmoronando

**Regra da fase:** O mapa é instável. Ocasionalmente, **blocos do cenário desmoronam**. Torres posicionadas nessas áreas são destruídas sem reembolso.

**Miniboss — Surtur**

A cada passo, deixa rastro de chamas no caminho e nos espaços de construção ao redor. Colocar ou vender uma torre nas cinzas de Surtur aplica penalidades severas na economia do jogador (perda de ouro ou fragmentos).

**Notas de implementação:**
- `EventMarvelDC.unstableTiles` → array de `{x, y}` que colapsa em intervalos aleatórios.
- Torres em `unstableTiles` ao colapsar: `tower.hp = 0`, removida sem reembolso, UI avisa.
- Surtur deixa `burntTiles` no caminho. Colocar torre em `burntTile` → penalidade.

---

### Fase 3 — Imunidade Rotativa

**Regra da fase:** Inimigos têm **escudos cromáticos** que mudam de cor com o tempo. Cada cor concede imunidade total a um tipo de ataque (Single, AOE, Cone, Beam, etc.). Exige diversidade de tipos de ataque no time.

**Miniboss — Brainiac**

Projeta um **escudo adaptativo** em si mesmo que irradia para todos os inimigos comuns ao redor. A imunidade do campo alterna rapidamente. A horda fica impenetrável se Brainiac não for focado primeiro.

**Notas de implementação:**
- Cada inimigo recebe `immuneType` que rotaciona a cada N segundos.
- Em `dealDamage()`: `if (enemy.immuneType === tower.attackType) return 0`.
- Brainiac sincroniza o `immuneType` de inimigos próximos ao seu próprio.
- UI: indicador visual da cor do escudo sobre cada inimigo afetado.

---

### Fase 4 — Nevoeiro Tangível

**Regra da fase:** Inimigos só recebem dano se estiverem **dentro de um raio curto** das torres. Alcance global ou massivo é anulado. Sniper/long range perde toda eficácia.

**Miniboss — Amazo**

Escaneia a torre de **maior custo total** em campo e copia seu tipo de ataque. Amazo então ataca as torres do jogador continuamente — a torre atingida fica **silenciada e inativa** por curto período.

**Notas de implementação:**
- `EventMarvelDC.fogMode = true` → em `dealDamage()`, checar se `distSq(tower, enemy) <= FOG_RANGE_SQ` antes de aplicar dano.
- `FOG_RANGE` a definir (sugestão: raio de 2 tiles ao redor da torre).
- Amazo: a cada X segundos, `target = towers.sort((a,b) => b._goldSpent - a._goldSpent)[0]`, aplica silence.

---

### Fase 5 — Geometria Variável

**Regra da fase:** O mapa tem múltiplas rotas. **Barreiras físicas caem do céu** dinamicamente a cada poucas waves, bloqueando o trajeto atual e forçando os inimigos a usarem rotas alternativas. Desestabiliza choke points.

**Miniboss — Sinestro**

Ignora completamente o trajeto do mapa. Usa o anel do medo para criar uma **ponte em linha reta até a base**. Outros inimigos começam a usar esse atalho se Sinestro não for destruído rapidamente.

**Notas de implementação:**
- Múltiplos arrays de waypoints para esta fase. Barreiras ativam/desativam rotas no `stageData.paths`.
- Sinestro: `enemy.ignoresPath = true` → segue em linha reta até a base com lógica separada de movimento.
- Torres de área (AOE) valorizam enormemente nesta fase — design intencional.

---

### Fase 6 — O Clímax Multiversal (Incursão Dupla + Loop Temporal)

**Miniboss — Flash Reverso**

Spawna no **centro da Incursão Dupla**. Não caminha para a base — corre em círculos, acelerando massivamente a velocidade de movimento do **Chefe Final**. Deve ser eliminado o mais rápido possível.

```js
// Cada tick de Flash Reverso vivo:
bossKang.speed += REVERSE_FLASH_ACCEL_TICK;
```

---

**Chefe Final — Kang, O Conquistador**

Kang spawna no segundo zero da Fase 6, avançando lentamente em direção à base. O jogador defende as waves normais enquanto Kang se aproxima. Tem três loops:

#### Loop 1 — Aproximação

- Kang apenas caminha e sofre dano passivamente.
- Ao encostar na base: tela pisca, tempo rebobina para início da Wave 9.
- **HP de Kang não regenera entre loops.**

#### Loop 2 — Poda Temporal

- Kang ativa **Poda Temporal** na unidade que lhe causou mais dano no Loop 1.
- Essa unidade torna-se uma **estátua inativa**: ocupa espaço no tabuleiro, não ataca, não concede buffs/passivas.
- Kang ressurge no início do mapa, **mais rápido**.
- Ao tocar a base: último rebobinar.

```js
// Ao iniciar Loop 2:
const topDamageDealer = towers.sort((a,b) => b._damageToKang - a._damageToKang)[0];
topDamageDealer.pruned = true; // inativa permanentemente até fim da fase
```

#### Loop 3 — Poda Final

- Kang aplica **segunda Poda Temporal** à segunda maior ameaça.
- Atinge velocidade máxima.
- Se tocar na base: **Game Over definitivo** (não rebobina).
- Requer múltiplas fontes de alto DPS — duas estátuas no tabuleiro é uma penalidade severa.

**Tracking de dano a Kang:** Cada torre precisa de `tower._damageToKang` incrementado a cada hit em Kang especificamente. Reseta entre loops.

---

## Estrutura de Arquivos

### Novo: `js/event-marvel-dc.js`

Contém toda a lógica do evento:

```js
EventMarvelDC = {
  active: false,
  currentPhase: null,

  // Hooks chamados pelo game.js
  onEnemyReachedEnd(enemy),      // ciclo dos infinite
  onDealDamage(tower, enemy, dmg), // sinergia de facção, nevoeiro, imunidade
  onTowerDeploy(tower),
  onUpgradeBought(tower, cost),
  onEnemyUpdate(enemy, dt),

  // Por fase
  phase1: { fusionMode, onFusionAttempt },
  phase2: { unstableTiles, onTileCollapse },
  phase3: { immunityRotation },
  phase4: { fogMode },
  phase5: { activePaths, barriers },
  phase6: { kangState, loopCount, onKangReachBase, pruneUnit },

  // Economia
  addFragments(amount),
  getFragments(),
  openShop(),
}
```

### Hooks mínimos em `game.js`

```js
// deployTower()
if (EventMarvelDC?.active) EventMarvelDC.onTowerDeploy(tower);

// dealDamage()
if (EventMarvelDC?.active) EventMarvelDC.onDealDamage(tower, enemy, damage);

// updateEnemiesLoop() — após reachedEnd
if (EventMarvelDC?.active && e.ptype === 'infinite') EventMarvelDC.onEnemyReachedEnd(e);
```

---

## Pontos em Aberto

- [ ] Personagens Marvel e DC disponíveis (definir após Updates 2 e 3)
- [ ] Valores de bônus de sinergia de facção (%, multiplicadores)
- [ ] Custo de Superman em fragmentos (calibrar pela curva de dificuldade)
- [ ] Mecânica de fusão de torres (Fase 1): UX de arrastar ou botão?
- [ ] Valores de fragmentos por inimigo (normal/elite/boss/infinite)
- [ ] Quantas waves por fase?
- [ ] Kang: velocidade base e aceleração por Loop
- [ ] Visual do beam do Superman vs. Kang para o tracker `_damageToKang`
- [ ] Inimigos `infinite`: HP base, velocidade, resistência
- [ ] Raio do Nevoeiro (Fase 4): equilibrar para não tornar o modo impossível
