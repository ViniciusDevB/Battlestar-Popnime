# Planejamento — Evento: Marvel vs DC (Update 4)

> Documento de design técnico e mecânico. Nada aqui deve ser implementado até decisão explícita.

---

## Visão Geral

Evento especial do Update 4. Diferente dos mundos anteriores, não adiciona um mundo permanente — é um modo de jogo temporário com regras próprias, mapa exclusivo e mecânicas inéditas.

O jogador escolhe uma facção (Marvel ou DC) antes de entrar. Os inimigos são sempre a facção oposta. Torres têm vida e podem ser derrubadas pelos inimigos. Torres caídas podem ser revividas mediante custo em ouro.

---

## Mecânicas Novas

### 1. Escolha de Facção

- Modal exibido antes de iniciar o evento, com as duas opções: **Marvel** ou **DC**.
- A escolha determina quais personagens podem ser usados e quais inimigos aparecem:
  - Escolheu Marvel → só pode usar torres Marvel → inimigos são personagens DC.
  - Escolheu DC → só pode usar torres DC → inimigos são personagens Marvel.
- A escolha fica salva na variável local do evento (`EventMarvelDC.faction`).
- Personagens de outras séries (Naruto, Bleach, etc.) **não podem ser usados** neste evento.

---

### 2. Mapa Circular (Espiral para o Centro)

- Path definido em `world.js` como uma espiral de waypoints partindo das bordas do canvas em direção ao centro.
- A base do jogador fica no **centro do mapa**.
- Inimigos entram por pontos ao redor da borda e percorrem a espiral até o centro.
- Nenhuma mudança no engine de pathfinding — é apenas um novo array de waypoints.

---

### 3. Torres com Vida (HP)

- **Somente durante este evento**, torres recebem `hp` e `maxHp` ao serem deployadas.
- `maxHp` baseado nos stats da torre (a definir — pode ser proporcional ao `damage` ou um valor fixo por raridade).
- Inimigos próximos atacam as torres (ver seção 4). Quando `tower.hp <= 0`, a torre **cai**.
- Torre caída: permanece no campo visualmente em estado "inativa" (sem atacar, sem passivas), aguardando revivimento.
- **Torres não podem ser vendidas** durante o evento. O botão de venda fica desabilitado/oculto enquanto `EventMarvelDC.active === true`.

#### Rastreamento de Gold Gasto por Torre

Para calcular o custo de revivimento, cada torre precisa rastrear quanto ouro foi investido nela:

- `tower._goldSpent` inicializado com o `deploy_cost` do personagem no momento do deploy.
- A cada upgrade comprado, `tower._goldSpent += upg.cost`.
- Esse campo já existe implicitamente na lógica de upgrades — só precisa ser somado.

---

### 4. Inimigos Atacando Torres

- Inimigos do evento têm a flag `attacksTowers: true` nos dados.
- No loop de atualização de inimigos, se a flag existir:
  - O inimigo verifica torres ativas dentro de um raio (`e.towerAttackRange`, a definir).
  - Se houver uma torre no raio, aplica dano nela num cooldown próprio (`e._towerAttackTimer`).
  - O inimigo **continua andando** em direção ao centro — atacar torre é comportamento adicional, não substituto.
- Inimigos fora do evento nunca têm essa flag → zero impacto no gameplay normal.

---

### 5. Revivimento de Torres

- Torres caídas exibem um botão/indicador de revivimento ao serem clicadas.
- **Custo de revivimento = metade do total de ouro gasto na torre até o momento da queda.**
  - Fórmula: `Math.ceil(tower._goldSpent / 2)`
  - Exemplo: torre deployada por 800💰 e com um upgrade de 1.200💰 cai → custo de revivimento = `(800 + 1200) / 2 = 1.000💰`.
- Ao pagar, a torre volta com HP cheio e retoma o funcionamento normal.
- Se o jogador não tiver ouro suficiente, o botão fica bloqueado com feedback visual.

---

## Estrutura de Arquivos

### Novo arquivo: `js/event-marvel-dc.js`

Contém toda a lógica do evento:

- `EventMarvelDC.active` — flag booleana
- `EventMarvelDC.faction` — `'marvel'` ou `'dc'`
- `EventMarvelDC.openFactionModal()` — exibe a tela de escolha
- `EventMarvelDC.onTowerDeploy(tower)` — inicializa `hp`, `maxHp`, `_goldSpent`
- `EventMarvelDC.onUpgradeBought(tower, upgCost)` — incrementa `_goldSpent`
- `EventMarvelDC.onTowerUpdate(towers)` — verifica torres com `hp <= 0` e marca como caídas
- `EventMarvelDC.onEnemyUpdate(enemy, towers, dt)` — lógica de ataque de inimigos a torres
- `EventMarvelDC.renderTowerHP(ctx, tower)` — desenha a barra de HP
- `EventMarvelDC.reviveTower(tower)` — processa o revivimento
- `EventMarvelDC.getReviveCost(tower)` — retorna `Math.ceil(tower._goldSpent / 2)`

### Toques mínimos em `game.js`

Apenas hooks que delegam para o arquivo do evento:

```js
// em deployTower():
if (EventMarvelDC?.active) EventMarvelDC.onTowerDeploy(tower);

// em buyNextUpgrade(), após gold -= upg.cost:
if (EventMarvelDC?.active) EventMarvelDC.onUpgradeBought(tower, upg.cost);

// em updateTowersLoop(), no início do forEach:
if (EventMarvelDC?.active) EventMarvelDC.onTowerUpdate(towers);

// em updateEnemiesLoop(), dentro do loop de inimigos:
if (EventMarvelDC?.active && e.attacksTowers) EventMarvelDC.onEnemyUpdate(e, towers, dt);

// na renderização de torres (canvas):
if (EventMarvelDC?.active && tower.hp !== undefined) EventMarvelDC.renderTowerHP(ctx, tower);
```

São ~5 linhas adicionadas ao `game.js`. Todo o resto vive no arquivo do evento.

---

## Dados do Evento

### Personagens disponíveis

A definir quais personagens Marvel e DC serão adicionados nos Updates 2 e 3, respectivamente. O evento consome os dois pools.

### Inimigos

- Inimigos Marvel: personagens Marvel usados como inimigos quando o jogador escolhe DC.
- Inimigos DC: personagens DC usados como inimigos quando o jogador escolhe Marvel.
- Todos os inimigos do evento têm `attacksTowers: true`.
- Stats de HP, dano e velocidade a balancear durante o desenvolvimento.

### Fases do Evento

Estrutura a definir. Sugestão inicial: 4–5 fases com dificuldade crescente, culminando num boss que representa o confronto final dos dois universos.

---

## Pontos em Aberto (a decidir)

- [ ] Quantos personagens por facção estarão disponíveis neste evento?
- [ ] `maxHp` das torres: fixo por raridade ou proporcional a algum stat?
- [ ] Raio de ataque dos inimigos contra torres (`towerAttackRange`)?
- [ ] Velocidade de ataque dos inimigos contra torres?
- [ ] O que acontece se todas as torres caírem? (game over imediato ou só perde se o inimigo chegar ao centro?)
- [ ] Recompensas do evento (personagens exclusivos? skin? moeda de evento?)?
- [ ] O evento tem narrativa/capítulos ou é só um modo de jogo direto?
