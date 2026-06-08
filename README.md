# 🌟 Battlestar Popnime

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos dos animes (Naruto, Bleach, Dragon Ball, One Piece, entre outros). O jogo conta com um sistema completo de progressão, incluindo mecânicas de **Gacha**, missões, gerenciamento de inventário, evolução e prestígio de personagens.

---

---

## 🚀 Como Jogar / Executar o Projeto

O projeto é construído em **HTML5, CSS3 e Vanilla JavaScript**. Não é necessário configurar nenhum ambiente complexo para rodar o jogo:

1. Clone o repositório:
   ```bash
   git clone https://github.com/ViniciusDevB/Battlestar-Popnime.git
   ```
2. Abra a pasta do projeto.
3. Abra o `index.html` no navegador.

*(Recomendado: usar Live Server do VS Code para melhor experiência de desenvolvimento.)*

---

## ✨ Funcionalidades

- **Tower Defense Dinâmico**: Posicione unidades estrategicamente para defender sua base. Cada personagem possui tipo de ataque único (Single, Linha, Cone, AOE, Pierce, Scatter), sistema de passivas e upgrades exclusivos.
- **Sistema de Gacha ⚡**: Invoque personagens (3⭐ a 5⭐) com sistema de *pity* (garantia no 150º pull) e banners rotativos a cada 30 minutos. Chance de 5⭐: **1%** em ambos os banners.
- **Gerenciamento e Evolução 🔮**: Suba de nível unidades via Feed e evolua-as para formas superiores com materiais dropados nas fases.
- **Sistema de Prestígio ✦**: Ao atingir o nível máximo, transmute uma unidade para Prestígio (máx P10). Cada nível de Prestígio concede +20% de dano e +6% de alcance permanentes, além de desbloquear passivas exclusivas nos níveis P1, P5 e P10.
- **Missões 📋**: Sistema de missões progressivas com recompensas em Gemas e Tickets.
- **Sagas de Eventos 🌟**: Capítulos narrativos com modificadores únicos e personagens exclusivos.
- **Mundos e Fases 🗺️**: Fases por mundos temáticos com três dificuldades (Normal, Difícil, Lendário).
- **♾ Modo Infinito**: Waves sem fim com dificuldade escalável (Fácil → Lendário → Além do Limite). Farm de **Star Experience** e Gemas. Limite de 3 cópias por torre por partida.
- **Star Experience ✨**: Materiais exclusivos do Modo Infinito (Nv1–5) com XP massivo. Podem ser usados diretamente no **Feed** de qualquer personagem. Chance de drop que cresce com o número da wave.
- **Sistema de Salvamento 💾**: Progresso salvo automaticamente no LocalStorage.

---

## 📁 Estrutura do Projeto

- `/` — `index.html` (estrutura) e `style.css` (estilos).
- `/js` — Lógica do jogo:
  - `game.js` — Loop principal, canvas, passivas, tipos de ataque, modo infinito.
  - `game-projectile-render.js` — Renderização visual dos projéteis de cada personagem.
  - `gacha.js` / `banner.js` — Sistema de invocação e banner rotativo.
  - `save.js` — Persistência via `localStorage` (inclui prestígio).
  - `inventory.js` — Inventário, feed, evolução, prestígio (botão Transmutar).
  - `ui.js` — Controle de telas e DOM.
  - `missions.js` / `main.js` — Missões e entry-point.
- `/data` — Dados do universo:
  - `characters.js` — Personagens, passivas, upgrades, prestígio passives, Star Experience.
  - `enemies.js` — Inimigos dos 3 mundos + handlers especiais.
  - `events_data.js` — Sagas de eventos.
  - `stages.js` — Fases de todos os mundos + estágio infinito.
  - `world.js` — Mundos, caminhos e paths (W1, W2, W3, Infinito).

---

## 📈 Histórico de Updates

### ✅ Update 2: Invasão Secreta *(Lançado)*

**Universo Marvel entra no Battlestar Popnime + Evento narrativo shinobi:**

**Mundo 4 — Nova York** com caminho temático de Manhattan (cruzamentos em Z):
- **6 fases completas** com 10 waves cada:
  - Fase 1 — **Manhattan (Hydra)**: backbone de invasores padrão.
  - Fase 2 — **Helicarrier SHIELD**: introduz Invasor Speed (ptype Speed).
  - Fase 3 — **Sokovia (Ultron)**: adiciona Invasor Fortified (escudo + ptype Fortified).
  - Fase 4 — **Wakanda**: adiciona Invasor Regen (regeneração passiva).
  - Fase 5 — **Titan**: adiciona Invasor Bomb (explosor com AOE de atordoamento).
  - Fase 6 — **O Espaço (Gauntlet)**: todos os tipos simultâneos + Boss Thanos em 2 fases.

**Novos inimigos comuns:**
- `Invasor` — backbone das 6 fases, ptype normal.
- `Invasor Speed` — rápido (speed 155), introduzido na Fase 2.
- `Invasor Fortified` — tanque blindado (HP 20k + escudo 10k).
- `Invasor Regen` — regenera 210 HP/s.
- `Invasor Bomb` — explosor com raio de 125px e stun de 1.8s.

**Minibosses (W10 de cada fase):**
- **Batroc** (F1): avança ativamente no caminho pelo Golpe de Savate a cada 12s.
- **Crossbones** (F2): Colete Suicida — mata rápido (explosão colossal) ou ele entra em Berserk.
- **Ronan** (F3): O Veredito — bloqueia a torre de maior DPS por 7s a cada 22s.
- **Corvus Glaive** (F4): Imortal enquanto o escudo estiver ativo; escudo regenera se inimigos suficientes estiverem em campo.
- **Ebony Maw** (F5): Telecinese Dupla — empurra todos os inimigos no caminho + inverte targeting de torres aleatórias.

**Boss de duas fases — Thanos (F6 W10):**
- **Thanos — O Eterno**: 300k HP + escudo 100k. Snap stuna todas as torres a cada 25s. Drena 1 vida da base a cada 3s.
- **Thanos — Manopla Completa**: 300k HP, speed 55. Imune a slow. Snap a cada 10s. Ativa 1 das 6 Gemas do Infinito a cada 20s em rotação (Espaço, Mente, Realidade, Poder, Tempo, Alma).

**8 novos personagens jogáveis** (3⭐ a 5⭐):
- 3⭐: Homem-Aranha (slow de teia por hit), Viúva Negra (marca inimigos ao matar), Gavião Arqueiro (rotação de 4 tipos de flecha).
- 4⭐: Pantera Negra (ricochet 2–4 bounces + aura), Thor (chain lightning em cascata), Hulk (stacks de Raiva crescentes).
- 5⭐ Gacha: Iron Man Mark 50 — drop exclusivo da Fase 6. Multi-míssil + Unibeam ao detectar boss.
- 5⭐ Evolução: World Breaker Hulk — evolui do Hulk. Gamma Burst ao atingir 60 stacks.

**Evento — Operação: Ressurreição** (4 capítulos, continuação de "A Anomalia de Konoha"):
- **Capítulo 1 — A Queda da Areia**: Modificador *Escudo de Areia* — todos os inimigos só tomam dano por burst (>800 em 1.5s).
- **Capítulo 2 — Névoa Sangrenta**: Modificador *Nevoeiro Mortal* — HP bars, nomes e tipos ocultos (só silhuetas).
- **Capítulo 3 — O Coração de Pedra**: Modificador *Frente Dupla* — metade da wave surge a 50% do caminho simultaneamente. Recompensa de conclusão: **Tsunade** (desbloqueio garantido).
- **Capítulo 4 — Tempestade de Trovões**: Modificador *Modo Jinchuuriki* — boss alterna imunidade de tipo de ataque a cada 30s (ícone visível). Drop farmável: **Killer Bee** (1% chance, pity 80).

**2 personagens exclusivos do evento** (não dropam no gacha):
- **Tsunade** (4⭐): AOE corpo-a-corpo. Passiva dupla — *Cem Sobrancelhas* (inimigos com base_drain drenam mais lentamente) + *Byakugou* (restaura 1 vida após 40s de wave ativa, 1× por wave).
- **Killer Bee** (5⭐, pity 80 runs): 8 Estilos de Espada em 360° (único ataque omnidirecional). Passiva *Modo Bijuu (Gyuki)* — a cada 20s, paralisa todos os inimigos e causa 3× dano base.

**Qualidade de Vida:**
- **Auto-Place**: 3 slots (A, B, C) para salvar e recarregar posicionamento de torres por fase.
- **Undo de Posicionamento**: desfaz a última torre colocada (tecla `Z`), bloqueado após inimigos spawnar.
- **Preview Expandido de Wave**: overlay mostra ícones coloridos de cada ptype da próxima wave com contagem. Alerta vermelho para miniboss/boss.
- **Filtro no Inventário**: chips de filtro múltiplo (Naruto, One Piece, Bleach, Marvel, Evento, ⭐⭐⭐ a ⭐⭐⭐⭐⭐). Estado persiste no localStorage.
- **Comparação de Torres**: painel de upgrade mostra stats atuais → próximo nível (números melhores em verde).
- **Barra de Pity colorida**: azul (0–99) → amarelo (100–130) → vermelho (131–150) com texto "X/150 pulls — Pity em Y pulls".

---

### ✅ Update 1: Soul Society *(Lançado)*

**Bleach — Mundo 3 completo com 6 fases e sistema de inimigos redesenhado:**

- **Mundo 3: Soul Society** com caminho exclusivo (curva em S tripla).
- **6 fases completas** com 10 waves cada, miniboss na W10 de cada fase e boss de duas fases na fase 6:
  - Fase 1 — **Karakura**: backbone de Hollows, abertura suave sem mecânicas especiais.
  - Fase 2 — **Seireitei**: introduz inimigos Speed (`Hollow Speed`).
  - Fase 3 — **Hueco Mundo**: combinação de Speed e tanques velozes (`Vasto Lorde`).
  - Fase 4 — **Las Noches**: introduz Fortified (`Hollow Fortified` com escudo).
  - Fase 5 — **Cúpula de Las Noches**: introduz Regenerator (`Hollow Regen`).
  - Fase 6 — **Fake Karakura**: gauntlet com todos os tipos + Boss de 2 fases.

**Novos inimigos comuns (com tags visuais de buff):**
- `Hollow` — inimigo base, ptype normal.
- `Hollow Powerful` — normal mais resistente.
- `Hollow Shield` — Powerful 1, aparência mascarada.
- `Arrancar` — Powerful 1, velocidade elevada.
- `Hollow Speed` — Powerful 1 + Speed, 150 de velocidade.
- `Vasto Lorde` — Powerful 2, tank veloz.
- `Hollow Fortified` — Powerful 2 + Fortified, escudo de 9.000 HP.
- `Hollow Regen` — Powerful 2 + Regenerator, regen de 200 HP/s.
- `Hollow Explosion` — Powerful 1 + Bomber, spawnable pelo Grimmjow.

**Minibosses (W10 de cada fase):**
- **Grand Fisher** (F1): stuna todas as torres ao surgir + spawna Hollows periodicamente a partir de si.
- **Gin Ichimaru** (F2): drena 1 HP da base a cada 3s enquanto vivo.
- **Grimmjow** (F3): velocidade 98, spawna 2 Hollow Explosions a cada 10s.
- **Nnoitra** (F4): Powerful 3 + Fortified com escudo de 45.000 HP que regenera após 40s.
- **Ulquiorra** (F5): Powerful 3 + Regenerator (350 HP/s) + drena a base a cada 2s.

**Boss de duas fases — Aizen/Hogyoku (F6 W10):**
- **Fase 1 — Estrategista**: 200.000 HP + escudo Hogyoku de 80.000 HP regenerativo (35s). Kyoka Suigetsu trava todas as torres por 3s a cada 18s. Lento (speed 22).
- **Fase 2 — Hogyoku Desperto**: ao morrer na Fase 1, ressurge com HP resetado e speed 90. Sem escudo, imune a lentidão (freeze/paralisia). Drena 1 HP da base a cada 2s e se cura 100 HP por drenagem.

**10 novos personagens jogáveis** (3⭐ a 5⭐) com passivas únicas:
- 3⭐: Rukia Kuchiki, Renji Abarai, Uryu Ishida, Orihime Inoue, Chad Yasutora.
- 4⭐: Byakuya Kuchiki, Toshiro Hitsugaya, Kenpachi Zaraki.
- 5⭐ Gacha: Ichigo (Bankai) — drop exclusivo da Fase 6.
- 5⭐ Evolução: Ichigo (Vizard) — evolui do Bankai.
- Novos tipos de ataque: `pierce` (Uryu), `scatter` (Byakuya).
- Novos tipos de passiva: `freeze_on_hit`, `boss_slayer`, `snake_venom`, `santen_kesshun`, `petal_mark`, `berserker`, `bankai_pressure`, `hollow_sync`.

**Sistema de Prestígio ✦:**
- Máximo de **Prestígio 10** por personagem.
- Transmutação requer nível máximo (Lv50).
- Bônus base: **+20% dano** e **+6% alcance** por nível de Prestígio.
- Passivas exclusivas em P1, P5 e P10 únicas por personagem.
- Anel dourado pulsante + indicador `P1`–`P10` na torre.
- Painel de inventário mostra passivas ativas (✦) e futuras (🔒) com valores exatos.

**♾ Modo Infinito:**
- Waves geradas dinamicamente com 8 tiers de dificuldade (Fácil → Além do Limite).
- Escalonamento de HP: 1× → 1.8× → 3.2× → 5.5× → 9× → 15× → 25× → 40×+.
- Miniboss a cada 10 waves; boss a cada 30 waves.
- Recompensas a cada 5 waves: Gemas escalando por tier (15–200💎).
- Limite de 3 cópias da mesma unidade por partida.

**Star Experience ✨:**
- Materiais exclusivos do Modo Infinito, Nv1 a Nv5.
- XP: Nv1=3.000 · Nv2=7.000 · Nv3=16.000 · Nv4=38.000 · Nv5=90.000.
- Usáveis diretamente no Feed de qualquer personagem.

**Sistema de tags visuais de buff corrigido:**
- `fortified`, `regenerator`, `bomber`, `clooner` e `kamikaze` agora exibem corretamente suas tags (`SHLD`, `REG`, `BOOM`, `CLN`, `KMK`) pois foram movidos para a seção `ptype` do `TAG_DEFS`.
- Novos specials com tags dedicadas: `SPWN` (Grand Fisher, Grimmjow), `SHLD+` (Nnoitra), `ILSN` (Aizen F1), `DRN` (Gin, Ulquiorra, Aizen F2).

**Regra de drops padronizada:**
- Fases 1–5 de cada mundo dropam apenas ingredientes (materiais de progressão).
- Personagens raros são drop exclusivo da Fase 6 de cada mundo: `naruto_sage` (Naruto), `barbabranca_5` (One Piece), `ichigo_bankai` (Bleach).

**Qualidade de Vida:**
- Overlay "Próxima Wave" com bônus de ouro e atalho `[S]`.
- Indicador de imunidade a stun nas torres (badge azul com countdown).
- Indicador `✦ MAXIMIZADO` no painel de upgrade.
- Velocidade colorida: 1× branco, 2× amarelo, 3× vermelho.
- Status completo da torre no painel de upgrade.
- Projéteis de todos os personagens extraídos para `game-projectile-render.js`.

---

### Update 0 (Base): Fundação Ninja *(Lançado)*
- Loop principal, canvas, sistema de defesa, Gacha, Save, Missões.
- Mundo de Naruto + primeiros heróis (Bleach, JJK, Dragon Ball, HxH, Kimetsu).

### Update 0.5: Grand Line *(Lançado)*
- Mundo de One Piece com 9 personagens, atalhos de teclado, QoL geral.

### Update 0.6: Evento — A Anomalia de Konoha *(Lançado)*
- Saga em 3 capítulos, Orochimaru (4⭐) e Pain (5⭐), modificadores de fase exclusivos.

---

## 🗺️ Roadmap

> As atualizações abaixo estão planejadas e em fase de concepção. Detalhes de personagens, mecânicas e conteúdo serão definidos conforme o desenvolvimento avança.

---

### 🔜 Update 3: Crise nas Infinitas Terras *(Planejado)*

**O universo DC chega com força total.**

- **Novo Mundo**: um mundo temático DC com caminho e fases exclusivas.
- **Novos Personagens**: heróis e vilões do universo DC (3⭐ a 5⭐), com passivas e sinergias próprias.
- **Qualidade de Vida**: novas mecânicas e refinamentos gerais.

> ⚠️ Detalhes de personagens, inimigos e mecânicas a definir.

---

### 🔜 Update 4: Marvel vs DC *(Planejado)*

**O confronto dos universos — sem novo mundo, mas com o maior evento já visto no jogo.**

- **Evento Especial**: ao invés de um mundo novo, esta atualização traz um **evento inédito** centrado no conflito direto entre os universos Marvel e DC.
- O formato do evento, recompensas e mecânicas exclusivas ainda serão definidos.

> ⚠️ Conceito em discussão — detalhes a definir.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** — renderização 2D do gameplay.
- **CSS3** — variáveis e animações para UI rica.
- **Vanilla JavaScript** — sem frameworks, controle total e leveza máxima.

---

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
