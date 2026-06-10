# Darkseid — 7★ Secreto

> **Status:** Planejamento  
> **Raridade:** ★★★★★★★ (7 estrelas — não existe outra)  
> **Chance no gacha:** `0.00005%` (1 em 2.000.000 pulls)  
> **Visibilidade:** Completamente oculto — não aparece nas odds do banner, não conta pity, não aparece na tela de informações do banner

---

## 1. Conceito e Lore

Darkseid não é simplesmente um personagem forte. Ele é uma **anomalia** dentro do sistema do jogo — um ser que não deveria existir como aliado. Sua ficha não aparece no gacha normal. Seu nome não consta em nenhum banner. Não há contador de pity para ele.

Quando obtido, o jogo não anuncia. Não há fanfarra. A tela escurece.

> *"Você não encontra o Darkseid. O Darkseid decide te encontrar."*

Na coleção, antes de ser obtido, aparece como `???` com silhueta completamente negra e a descrição: *"Este registro foi corrompido."*

---

## 2. Stats Base

| Stat | Valor |
|------|-------|
| Raridade | 7★ |
| Tipo de ataque | `omega` — ignora escudos e armadura nativamente |
| Dano base | 350 |
| Alcance | 195 |
| Cooldown | 2.0s |
| Deploy cost | 4.500 |

```js
darkseid_7star: {
  id: 'darkseid_7star',
  name: 'Darkseid',
  rarity: 7,
  stars: 7,
  world: 'secret',
  gacha_chance: 0.0000005,   // 0.00005%
  visible_in_banner: false,
  counts_pity: false,
  deploy_cost: 4500,
  base_stats: {
    damage: 350,
    range: 195,
    attack_speed: 2.0,
    type: 'omega'
  }
}
```

---

## 3. Upgrades

Upgrades melhoram apenas stats. As 6 passivas estão **todas ativas desde o primeiro deploy**.

```js
upgrades: [
  { cost: 3000,  damage_bonus: 350,  range_mult: 1.10 },  // dano total: 700
  { cost: 5500,  damage_bonus: 500                     },  // dano total: 1200
  { cost: 9000,  damage_bonus: 700,  range_mult: 1.08  },  // dano total: 1900
  { cost: 14000, damage_bonus: 1000                    },  // dano total: 2900
]
// Prestige: amplifica os valores numéricos de todas as 6 passivas
```

---

## 4. As 6 Passivas — Todas Ativas Desde o Deploy

---

### Passiva 1 — Raios Omega Encadeados

**A cada 4 ataques normais**, o disparo se transforma em um **Raio Omega Triplo**: o projétil se divide em 3 galhos no meio do voo, cada um curvando autonomamente em direção a um dos 3 inimigos com maior HP no alcance atual.

Cada galho causa **70% do dano base**. Se dois galhos acertam o mesmo inimigo no mesmo disparo (acontece quando há poucos alvos), o segundo galho causa **250% do dano base** em vez de 70% — a concentração de energia Omega num único ponto é devastadora.

```js
omega_chain_ray: {
  triggerEveryNAttacks: 4,
  branches: 3,
  targetsHighestHp: true,
  branchDamageRatio: 0.70,
  doubleHitDamageRatio: 2.50   // recompensa pela falta de alvos
}
```

**Visual:** Os 3 galhos são raios laranja-avermelhados que curvalm no ar como relâmpagos vivos, deixando um rastro de energia que desaparece em 0.3s. Símbolo **Ω** brilha no ponto de divisão.

---

### Passiva 2 — Quebra de Vontade

Cada ataque de Darkseid aplica **1 carga de Corrupção** no inimigo atingido. Ao acumular **5 cargas**, a vontade do inimigo é quebrada pela Equação Anti-Vida:

O inimigo **inverte a direção** e começa a andar para trás no caminho pelo qual veio durante **7 segundos**, afastando-se da base. Ao fim dos 7 segundos, morre automaticamente — independentemente do HP restante.

Inimigos com `stun_immune` precisam de **8 cargas** para ter a vontade quebrada.

```js
will_break: {
  stacksRequired: 5,
  stacksRequiredStunImmune: 8,
  reverseDuration: 7,
  killOnExpiry: true   // morre ao fim dos 7s independente do HP
}
```

**Visual:** A cada carga, o inimigo recebe um brilho roxo levemente mais intenso. Ao atingir o limite, um flash de energia roxa irrompe do inimigo, ele para por 0.5s, e então começa a andar para trás com uma aura roxa pulsando e o símbolo Ω giratório sobre ele. Ao morrer no fim dos 7s: dissolve em cinzas sem efeito de dano visual — desaparece como se nunca tivesse existido.

---

### Passiva 3 — Vínculo Omega

Darkseid conecta inimigos entre si com elos invisíveis de energia Omega. A cada **15 segundos**, ele cria vínculos entre pares de inimigos em tela — ligando o 1º ao 2º, o 3º ao 4º, e assim por diante.

Enquanto dois inimigos estão vinculados: **toda vez que um dos dois recebe dano, 40% desse dano é replicado instantaneamente no parceiro**, independente de onde ele esteja no caminho, ignorando escudo e armadura do receptor do espelho.

Os vínculos duram **12 segundos** e são renovados automaticamente. Inimigos que morrem antes da renovação simplesmente não têm parceiro até o próximo ciclo.

```js
omega_bond: {
  interval: 15,              // renova os pares a cada 15s
  duration: 12,
  mirrorDamageRatio: 0.40,   // 40% do dano replicado no parceiro
  ignoresShieldOnMirror: true,
  ignoresArmorOnMirror: true
}
```

**Visual:** Um fio tênue de energia laranja-avermelhada conecta visualmente os pares vinculados. Quando o espelho de dano é ativado, o fio pulsa brevemente em branco. Inimigos vinculados têm um pequeno símbolo Ω pulsando sobre eles.

---

### Passiva 4 — Tirano Crescente

A cada **5 inimigos mortos diretamente por Darkseid** (não por outras torres), ele acumula **+3% de dano permanente** enquanto estiver no campo, sem limite de cap.

Se Darkseid for removido do campo, todos os stacks são perdidos. Se colocado novamente, começa do zero.

```js
tyrant_rising: {
  killsPerStack: 5,
  damagePerStack: 0.03,   // +3% por stack, sem cap
  stacksLostOnRemoval: true
}
```

> *Exemplo: após matar 50 inimigos sozinho (+10 stacks), Darkseid tem +30% de dano permanente naquela partida. Após 100 kills (+20 stacks), +60%. Quanto mais tempo no campo matando, mais absurdo ele fica.*

**Visual:** A cada stack acumulado, a aura ao redor de Darkseid fica levemente mais intensa em laranja. Em stacks altos (10+), partículas de energia Omega escapam da base dele passivamente.

---

### Passiva 5 — Sombras de Apokolips

Quando **qualquer inimigo morre em qualquer lugar do mapa** enquanto Darkseid está no campo, há **20% de chance** de Darkseid "reclamar" a alma: uma **Sombra de Apokolips** emerge no ponto da morte.

A Sombra é uma torre temporária — visualmente uma silhueta preta com olhos laranja — que ataca inimigos próximos por **6 segundos** usando **35% do dano atual de Darkseid** (incluindo stacks do Tirano Crescente). Após os 6s, dissolve em fumaça escura.

Não há limite de quantas Sombras podem existir ao mesmo tempo.

```js
apokolips_shadows: {
  triggerChance: 0.20,
  triggerOnAnyDeath: true,   // qualquer morte no mapa, não só no alcance
  duration: 6,
  damageRatio: 0.35,         // 35% do dano atual do Darkseid (com stacks)
  maxActive: null             // sem limite
}
```

**Visual:** Sombras são silhuetas negras (~60% do tamanho de um personagem normal) com olhos laranja brilhando. Atacam com projéteis de fumaça preta. Ao expirar, colapsam para dentro de si mesmas em 0.5s e desaparecem.

---

### Passiva 6 — Abraço do Abismo

A cada **35 segundos**, Darkseid "reclama" os **2 inimigos com menor HP atual** em tela. Eles são arrancados do caminho, param de se mover, e são convertidos em **torres temporárias de Apokolips** por **12 segundos**.

Durante esse período, agem como torres aliadas: atacam outros inimigos com seus próprios stats originais, ficam ancorados na posição onde estavam quando foram reclamados, e são completamente ignorados pelos inimigos restantes (não são alvo). Ao fim dos 12 segundos, colapsam e morrem sem dar ouro ao jogador.

Bosses e mini-bosses são imunes.

```js
abyss_embrace: {
  interval: 35,
  targetsCount: 2,
  targetMode: 'lowest_current_hp',
  duration: 12,
  convertToAlly: true,       // usa os stats originais do inimigo para atacar
  grantGoldOnExpiry: false,  // não dá ouro ao morrer
  immunities: ['is_boss', 'is_miniboss']
}
```

**Visual:** Os 2 inimigos reclamados piscam em preto por 0.5s, param completamente, e suas cores invertem — ficam com paleta escura e olhos laranja (como as Sombras). Uma corrente fina de energia Omega os conecta ao Darkseid visualmente enquanto estão convertidos. Ao expirar: implode para dentro de si mesmo e desaparece sem som.

---

## 5. Upgrades — O que Darkseid Ganha

Upgrades não desbloqueiam passivas (todas já ativas). Cada nível melhora stats base **e amplifica valores de passivas específicas**.

| Nível | Custo | Dano Total | Melhoria de Passiva |
|-------|-------|-----------|---------------------|
| Base | — | 350 | Todas as 6 passivas ativas |
| U1 | 3.000 | 700 | **P1:** Raio Triplo dispara a cada **3** ataques (era 4) |
| U2 | 5.500 | 1.200 | **P2:** Quebra de Vontade precisa de **4** cargas (era 5); stun_immune precisa de **6** (era 8) |
| U3 | 9.000 | 1.900 + range ×1.10 | **P4:** Tirano Crescente dá **+4%** por stack (era +3%) · **P5:** Sombras com **28%** de chance (era 20%) e duram **8s** (era 6s) |
| U4 | 14.000 | 2.900 | **P3:** Vínculo Omega conecta **trios** (1º–2º–3º, 4º–5º–6º) com dano espelhado para os **outros 2** · **P6:** Abraço do Abismo reclama **3** inimigos (era 2) e os mantém por **15s** (era 12s) |

---

## 6. Prestígios — Passivas Extras

Cada nível de prestígio adiciona uma **passiva completamente nova** às 6 existentes. Darkseid pode ter até 9 passivas simultâneas com prestige máximo.

---

### Prestígio 1 — Decreto Omega

Uma vez por wave, Darkseid emite um **Decreto Omega** sobre o inimigo com maior HP atual em tela: esse inimigo é instantaneamente reduzido a **1 HP**, ignorando qualquer armadura, escudo ou passiva de resistência.

O inimigo sobrevive no 1 HP — cabe às torres aliadas terminar. O Decreto tem **cooldown de 90 segundos** após a primeira ativação.

```js
omega_decree: {
  oncePer: 'wave',
  targetsHighestHp: true,
  reduceToHp: 1,
  cooldown: 90,
  ignoresAllDefenses: true
}
```

> *Interação: um boss reduzido a 1 HP ainda tem Vínculo Omega ativo — cada ataque que o finaliza espelha 40% do dano no seu par vinculado. E se o parceiro estiver próximo do limite da Quebra de Vontade, esse espelho pode triggerar a inversão de direção.*

**Visual:** Darkseid abre os olhos completamente (animação única), um raio único e reto — diferente dos galhos do P1 — dispara direto no alvo em velocidade máxima. O inimigo congela por 0.3s com o corpo todo em laranja antes de cair para 1 HP.

---

### Prestígio 2 — Propagação Anti-Vida

Quando a **Quebra de Vontade (P2)** atinge o limite de cargas e inverte a direção de um inimigo, **todos os outros inimigos em tela recebem imediatamente 2 cargas de Corrupção** — a equação se propaga como contágio.

Não há cooldown entre propagações. Se dois inimigos quebrarem quase ao mesmo tempo, cada um propaga separadamente.

```js
anti_life_spread: {
  onWillBreakTrigger: true,   // ativa sempre que P2 inverte um inimigo
  freeStacksGranted: 2,       // todos os outros inimigos em tela recebem 2 cargas
  appliesGlobally: true
}
```

> *Em waves com muitos inimigos juntos, o primeiro a quebrar acelera todos os outros em direção à quebra. Com U2 (4 cargas necessárias), 2 cargas gratuitas deixam todos os outros a apenas 2 ataques da inversão.*

**Visual:** Ao quebrar a vontade do primeiro inimigo, uma onda roxa translúcida e fina se expande a partir dele varrendo toda a tela — cada inimigo que ela atravessa pisca brevemente em roxo sinalizando o recebimento das cargas.

---

### Prestígio 3 — Domínio Absoluto

As **Sombras de Apokolips (P5)** tornam-se permanentes. Elas não mais expiram após 6/8 segundos — ficam no campo indefinidamente, atacando como torres fixas, até que sejam destruídas por inimigos com mecânicas de área ou pelo fim da fase.

Máximo de **10 Sombras permanentes simultâneas**. Quando o limite é atingido, novas Sombras substituem a mais antiga.

```js
absolute_dominion: {
  shadowsPermanent: true,
  maxPermanentShadows: 10,
  replacementMode: 'oldest'  // remove a mais antiga ao ultrapassar o limite
}
```

> *Em fases longas com alta densidade de kills, o jogador pode acumular 10 Sombras permanentes espalhadas pelo mapa — cada uma usando 35% do dano atual de Darkseid (com stacks de Tirano Crescente). Com U4 (dano 2.900) e 20 stacks (+80%), cada Sombra faz ~1.827 de dano por ataque.*

**Visual:** Sombras permanentes ficam levemente maiores que as temporárias e têm uma coroa fina de energia Omega laranja ao redor da cabeça. Sombras temporárias (antes do P3) permanecem com o visual original.

---

## 7. Sinergia entre as Passivas

| Combinação | Efeito |
|------------|--------|
| **P1 + P2** | Raio Triplo aplica 3 cargas simultâneas em 3 alvos — Quebra de Vontade escala 3× mais rápido em waves densas |
| **P2 + P3** | Inimigo invertido ainda está vinculado — enquanto anda para trás recebendo dano, espelha 40% desse dano no parceiro |
| **P4 + P5** | Tirano Crescente stacks aumentam o dano das Sombras (35% do dano atual) — Sombras ficam exponencialmente mais fortes com o tempo |
| **P3 + P6** | Quando Abraço do Abismo converte um inimigo em torre aliada, ele ainda está vinculado pelo Vínculo Omega — seus ataques espelham 40% do dano no próprio parceiro |
| **P2 + Prestígio 2** | O primeiro inimigo que quebra propaga 2 cargas para todos em tela, acelerando quebras em cascata |
| **P4 + Prestígio 3** | Com 20 stacks de Tirano Crescente (+80%) e 10 Sombras permanentes, cada Sombra faz ~1.827 de dano por ataque |

---

## 8. Efeitos Visuais Exclusivos

### Animação de Gacha — "O Abismo Responde"

Quando Darkseid 7★ é puxado, a animação normal é completamente substituída:

1. A animação começa normalmente até o flash do resultado
2. **A tela inteira vai a preto absoluto** — sem gradiente, sem partículas, sem sons
3. Silêncio por **1.5 segundos**
4. O símbolo **Ω** aparece no centro em vermelho-escuro e **queima** a tela de dentro para fora, como papel incandescente
5. Darkseid emerge da escuridão em câmera lenta, sem nenhuma música de raridade tocando
6. Um único som grave e profundo (ressonância de metal) ao aparecer completamente
7. O card aparece com borda **preto fosco com runas Ômega vermelhas pulsando** nas bordas — não usa o template de card padrão

### Presença no Campo

| Elemento | Visual |
|----------|--------|
| Aura base | Círculo de escuridão — satura levemente o fundo em raio 6 ao redor |
| Ataque normal | Projétil cubo-dimensional escuro com traço vermelho, ignora o efeito padrão de projétil |
| Raio Omega (P1) | 3 galhos laranja que curvam no ar, rastro que desaparece em 0.3s, Ω no ponto de divisão |
| Quebra de Vontade (P2) | Inimigo corroído anda para trás com aura roxa e Ω giratório acima |
| Vínculo Omega (P3) | Fio laranja entre inimigos vinculados, pulsa branco ao espelhar dano |
| Tirano Crescente (P4) | Aura laranja progressivamente mais intensa por stack |
| Sombras (P5) | Silhuetas negras com olhos laranja, projéteis de fumaça preta |
| Abraço do Abismo (P6) | Inimigos piscam em preto, param, invertem paleta para escuro com olhos laranja, corrente fina os liga ao Darkseid |

### Card de Coleção

- **Antes de obter:** silhueta preta, nome `???`, descrição *"Este registro foi corrompido."*
- **Após obter:** borda preto-fosco com runas Ômega, fundo de arte único (não usa o template padrão de gacha), raridade exibida como `★★★★★★★` em vermelho escuro (não dourado)

---

## 7. Implementação — Pontos Técnicos

### Gacha (`js/gacha.js`)

```js
function rollGacha(banner) {
  // Roll de Darkseid acontece antes do roll normal, invisível ao pity
  if (Math.random() < 0.000005) {
    return getChar('darkseid_7star');
  }
  return rollNormalBanner(banner);
}
```

### Coleção (`js/collection.js`)

```js
function renderCollectionCard(char) {
  if (char.id === 'darkseid_7star' && !playerOwns(char.id)) {
    renderMysteryCard();   // silhueta preta + "???"
    return;
  }
}
```

### Engine de Passivas

- **P2 (Quebra de Vontade):** requer `enemy.pathIndex` e `enemy.dist` para inverter a direção — mover o inimigo subtraindo `speed * dt` em vez de somar
- **P3 (Dobra Gravitacional):** ao entrar no alcance pela primeira vez na wave, salvar `enemy.equidDistRewind = true` e reposicionar `enemy.dist` subtraindo `speed * 4`
- **P4 (Tirano Crescente):** contador na instância da torre, não no personagem
- **P5 (Sombras):** spawn de "pseudo-tower" temporária com timer — pode usar o mesmo sistema de `is_temp: true` para renderizar sem colocar no array principal de torres
- **P6 (Colapso Entrópico):** `waveGoldEarned` já pode ser rastreado somando o gold de cada kill durante a wave

### Segredo de Descoberta

- Nenhuma menção no jogo — zero referência em qualquer tela, tutorial ou UI
- Assets presentes no jogo desde o lançamento do Update 3 mas inacessíveis pela UI
- Em `data/characters.js`, a entrada de Darkseid usa um comentário diferente de todos os outros personagens como easter egg para quem lê o fonte
- A primeira pessoa a postar screenshot obtendo ele inicia a descoberta da comunidade
