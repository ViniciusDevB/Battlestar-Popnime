# GDD — Update 4: Colapso Multiversal (Expansão & Evento)

> Documento de design técnico e mecânico para o Update 4. Contém tanto as novas features globais (Sistemas de Base e Relíquias) quanto as mecânicas do evento temporário Marvel vs DC.

---

## 1. Visão Geral do Update

O **Update 4** é o ponto de virada para o "endgame" de *Battlestar Popnime*. Com o acúmulo de recursos (ingredientes e gemas) pelos jogadores veteranos, o jogo introduz novos *resource sinks* que afetam a conta de forma permanente. 

As duas grandes features do update dão utilidade real aos ingredientes: a **Construção de Base** e a **Forja de Relíquias**. Tudo isso embalado no aguardado mega-evento de dificuldade extrema: a colisão entre os mundos Marvel e DC.

---

## 2. Nova Feature: Construção de Base (O Nexus)

O jogador agora possui um "Quartel General" (Nexus) acessível pelo menu principal. O Nexus permite a construção e aprimoramento de **Estruturas** que fornecem bônus passivos permanentes para a conta inteira.

### Custo e Evolução
- **Construção e Upgrades:** Custam Gemas + Quantidades específicas de Ingredientes.
- **Upgrades de Nível Máximo:** Podem exigir o sacrifício de personagens 4★ ou 5★ específicos do mundo temático daquela estrutura para liberar o potencial total.

### Estruturas Iniciais:

* 🏥 **Centro Médico de Metrópolis** (Requer ingredientes DC)
  * *Bônus:* Aumenta o HP com o qual o jogador inicia todas as fases.
  * *Nvl 1 (Custo: 50 Ing. + 20 Gemas):* +5 HP Base.
  * *Nvl 5 (Máximo):* +25 HP Base (Requer sacrifício de um curandeiro 4★).

* 💰 **Cofre de Tesouros Pirata** (Requer ingredientes One Piece)
  * *Bônus:* Aumenta o Ouro Inicial da partida.
  * *Nvl 1 (Custo: 50 Ing. + 20 Gemas):* +10 Ouro Inicial.

* 🧪 **Academia Shinen** (Requer ingredientes Bleach)
  * *Bônus:* Aumenta o multiplicador de XP recebido no sistema de "Feed".
  * *Nvl 1 (Custo: 50 Ing. + 20 Gemas):* +5% XP extra no Feed.

**Implementação Técnica:**
- Adicionar ao Save: `save.nexus.structures = { hospital: { level: 1 }, cofre: { level: 0 } }`.
- O `game.js` deve checar as estruturas ativas no momento de `initStage()` para setar HP e Ouro.

---

## 3. Nova Feature: Sistema de Relíquias (Forja)

Para aprofundar as builds e dar utilidade aos personagens de baixo dano, cada herói ganha **1 Slot de Equipamento (Relíquia)** no inventário. O jogador crafta essas relíquias na aba "Forja".

### A Forja & Relíquias Corrompidas
- **Custo Baixo e Frequente:** Para incentivar o "gacha de equipamentos", fabricar uma relíquia custa apenas **20 ingredientes** de uma facção.
- **Sorte Suprema (1.5%):** Toda vez que uma relíquia é forjada, há uma chance exata de **1.5%** dela vir na versão **"Corrompida" (Lendária)**. Versões corrompidas dobram os atributos padrão ou adicionam efeitos devastadores (como ignorar armadura ou aplicar Stun).

### Receitas Iniciais:

* 🎯 **Lente do Ciclope** (Custo: 20 Ingredientes Marvel)
  * *Padrão:* +15% de Dano Físico.
  * *Corrompida:* +30% Dano Físico e tiros têm 5% de chance de causar Queimadura Cósmica.

* 🧭 **Bússola Log Pose** (Custo: 20 Ingredientes One Piece)
  * *Padrão:* +10% de Alcance (Range).
  * *Corrompida:* +25% de Alcance.

* ☁️ **Manto da Akatsuki** (Custo: 20 Ingredientes Naruto)
  * *Padrão:* Gera +3 Ouro ao final de cada wave completada.
  * *Corrompida:* Gera +8 Ouro por wave.

**Implementação Técnica:**
- Nova estrutura no personagem: `tower.equippedRelic = { id: 'log_pose', isCorrupted: false }`.
- Efeitos calculados em `applyStats()` após os buffs de Prestígio.

---

## 4. O Evento Temporário: Colapso Multiversal (Marvel vs DC)

Modo temporário de dificuldade lendária. Diferente dos mundos normais, possui regras exclusivas que quebram o motor base do jogo.

**Prêmio máximo:** Superman (Mergulho Solar) 6★ (Loja do Evento).

### Mecânicas Globais do Evento
1. **Inimigo Infinite (`ptype: infinite`):** Se chegar à base, dá dano e teleporta de volta para o spawn em vez de morrer. Um ciclo contínuo até ser derrotado pelas torres.
2. **Incursão Dupla:** Dois portais (Vermelho/Marvel e Azul/DC) cujos caminhos se cruzam no centro do mapa. O choke point exige gestão de frotas duplas.
3. **Sinergia de Facção:** 
   - Torres Marvel quebram escudos de inimigos DC e dão +dano.
   - Torres DC ignoram esquiva de inimigos Marvel e atacam mais rápido.
4. **Moeda:** Fragmentos de Colisão (usados na Loja de Convergência para pegar o Superman).

---

## As 9 Fases do Evento

Cada fase do evento tem uma regra bizarra que pune o uso das estratégias convencionais.

### Fase 1 — A Fusão Equivalente
**Regra da fase:** Upgrades normais via ouro estão desativados. É obrigatório comprar cópias e "fundir" arrastando as torres umas sobre as outras.
**Miniboss — Lex Luthor:** Irradia pulso que trava qualquer tentativa de fusão nas torres próximas a ele.

### Fase 2 — Terreno Desmoronando
**Regra da fase:** Blocos do cenário caem no abismo durante a partida, destruindo as torres em cima deles sem reembolso.
**Miniboss — Surtur:** Deixa rastro de chamas no mapa. Torres construídas nessas chamas roubam ouro do jogador.

### Fase 3 — Imunidade Rotativa
**Regra da fase:** Inimigos têm escudos coloridos que mudam periodicamente, ficando 100% imunes a tipos específicos de ataque (Single, AOE, Pierce).
**Miniboss — Brainiac:** Projeta e dita a cor do escudo de todos os inimigos menores ao seu redor.

### Fase 4 — Nevoeiro Tangível
**Regra da fase:** Torres só causam dano se o inimigo estiver a no máximo 2 "tiles" de distância. Alcance longo (Snipers) é inútil.
**Miniboss — Amazo:** Copia o tipo de ataque da sua torre mais cara e a silencia continuamente.

### Fase 5 — Geometria Variável
**Regra da fase:** Barreiras caem do céu no meio da partida, bloqueando rotas antigas e forçando os inimigos a andarem por novos caminhos longe das suas torres.
**Miniboss — Sinestro:** Cria pontes de luz dura e corta caminho em linha reta para a sua base ignorando os trajetos normais.

### Fase 6 — O Clímax Multiversal (Incursão Dupla + Loop Temporal)
**Miniboss — Flash Reverso:** Corre em círculos no mapa apenas aumentando a velocidade passiva do Boss.
**Boss Principal — Kang, o Conquistador:** 
Ele possui 3 "Loops". Toda vez que chega à base, rebobina o tempo da partida. No Loop 2, ele transforma a torre que deu mais dano nele em uma Estátua Inativa para sempre. No Loop 3 ele faz o mesmo. Requer múltiplas fontes de DPS.

### Fase 7 — O Estalar do Titã
**Regra da fase:** "Aura do Infinito". A cada wave, uma das joias aplica um debuff global (ex: lentidão, paralisação, delay de cooldown).
**Miniboss — Thanos:** Cria "portais espaciais" no caminho. Inimigos que encostam pulam 30% do mapa. Em 30% de HP, dá um Stun massivo de 6s em área.

### Fase 8 — A Equação Anti-Vida
**Regra da fase:** "Desespero". Qualquer torre que passe 10 segundos sem atacar recebe 50% de redução de velocidade permanentemente. Acaba com táticas de guardar torre apenas no fundo do mapa.
**Miniboss — Darkseid:** Dispara Raios Ômega curvados que perseguem a torre de maior dano (ignorando distância) e aplicam silence.

### Fase 9 — O Ápice da Convergência (25 Waves)
O último grande mapa, enorme, com portais simultâneos.
- **Wave 10 — Thanos:** Concede escudos massivos para inimigos próximos.
- **Wave 20 — Darkseid:** Esponja de HP que drena 1 HP da sua base passivamente a cada 5 segundos que continua vivo.
- **Wave 25 (Boss Final) — Thanoseid:**
  - **O Estalo Anti-Vida:** Ao perder a primeira barra de HP, ele apaga 50% das suas torres (escolhidas aleatoriamente) do tabuleiro.
  - **Sobrecarga de Realidade:** Ganha imunidade absoluta à facção (Marvel/DC) que o atacou por último. O jogador DEVE intercalar heróis das duas editoras para ficar "quebrando" a imunidade do escudo a cada milissegundo. Heróis neutros (Naruto/OP) causam apenas 20% do dano nele.
  - **Raios Ômega:** Elimina temporariamente (15s) a torre mais cara do mapa.

---

## 5. Estrutura de Arquivos

### Novo: `js/event-marvel-dc.js`
Contém toda a lógica exclusiva do evento (fases, loja, mecânicas do Thanoseid, etc).

### Novo: `js/nexus-base.js`
Gerenciador das Estruturas e Upgrades passivos (lê do `save.nexus`).

### Atualizado: `js/inventory.js`
Aba de "Forja" de Relíquias (Sistema de Gacha 1.5% chance) e UI do slot de Equipamento nos cards de personagens.

---

## 6. Banco de Dados e Sincronização (Supabase)

**Atenção:** Como o Update 4 introduz dois novos sistemas globais de longo prazo (Construção de Base e Relíquias Equipadas), **é obrigatório** que esta atualização contemple mudanças estruturais no **Supabase**.

Qualquer adição ou alteração nos objetos de salvamento do jogador (`save.nexus.structures`, relíquias no inventário, etc.) precisa ser refletida nas políticas de banco de dados, migrações de dados antigos e no payload de sincronização na nuvem (`Save Sync`), garantindo que o progresso da base e do equipamento não seja perdido quando o jogador trocar de dispositivo (Web para Desktop).
