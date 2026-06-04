# 🌟 Battlestar Popnime

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos dos animes (Naruto, Bleach, Dragon Ball, One Piece, entre outros). O jogo conta com um sistema completo de progressão, incluindo mecânicas de **Gacha**, missões, gerenciamento de inventário, evolução e prestígio de personagens.

---

> ## 🚧 Update 1 — Soul Society (Em Desenvolvimento)
>
> Esta versão está **em progresso ativo**. As funcionalidades abaixo foram implementadas e estão funcionais, mas o update ainda não foi finalizado — ajustes, balanceamento e novos conteúdos serão adicionados antes do release oficial.

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
- **Sistema de Gacha ⚡**: Invoque personagens (3⭐ a 5⭐) com sistema de *pity* (garantia no 150º pull) e banners rotativos a cada 30 minutos.
- **Gerenciamento e Evolução 🔮**: Suba de nível unidades via Feed e evolua-as para formas superiores com materiais dropados nas fases.
- **Sistema de Prestígio ✦**: Ao atingir o nível máximo, transmute uma unidade para Prestígio (máx P10). Cada nível de Prestígio concede +20% de dano e +6% de alcance permanentes, além de desbloquear passivas exclusivas nos níveis P1, P5 e P10.
- **Missões 📋**: Sistema de missões progressivas com recompensas em Gemas e Tickets.
- **Sagas de Eventos 🌟**: Capítulos narrativos com modificadores únicos e personagens exclusivos.
- **Mundos e Fases 🗺️**: Fases por mundos temáticos com três dificuldades (Normal, Difícil, Lendário).
- **♾ Modo Infinito**: Waves sem fim com dificuldade escalável (Fácil → Lendário → Além do Limite). Farm de **Star Experience** e Gemas. Limite de 3 cópias por torre por partida.
- **Star Experience ✨**: Materiais exclusivos do Modo Infinito (Nv1–5) com XP massivo. Nv1 = XP equivalente a um personagem 4⭐. Chance de drop por wave que cresce com o número da wave.
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

### 🚧 Update 1: Soul Society *(Em Desenvolvimento)*

**Bleach — Novo Mundo e Personagens:**
- **Mundo 3: Soul Society** com caminho exclusivo (curva em S tripla).
- **4 novas fases**: Karakura Town, Portão da Seireitei, Las Noches, O Vazio (boss).
- **6 novos inimigos**: Hollow Pequeno, Hollow Grande, Hollow Mascarado, Arrancar, Espada Décima (miniboss), Menos Grande (boss com explosão).
- **10 novos personagens** (3⭐ a 5⭐) com passivas únicas:
  - 3⭐: Rukia Kuchiki, Renji Abarai, Uryu Ishida, Orihime Inoue, Chad Yasutora.
  - 4⭐: Byakuya Kuchiki, Toshiro Hitsugaya, Kenpachi Zaraki.
  - 5⭐ Gacha: Ichigo (Bankai).
  - 5⭐ Evolução: Ichigo (Vizard) — evolui do Bankai.
- Novos tipos de ataque: `pierce` (Uryu), `scatter` (Byakuya).
- Novos tipos de passiva: `freeze_on_hit`, `boss_slayer`, `snake_venom`, `santen_kesshun`, `petal_mark`, `berserker`, `bankai_pressure`, `hollow_sync`.

**Sistema de Prestígio ✦:**
- Máximo de **Prestígio 10** por personagem.
- Transmutação requer nível máximo (Lv50).
- Bônus base: **+20% dano** e **+6% alcance** por nível de Prestígio.
- **Passivas exclusivas** em P1, P5 e P10 únicas por personagem, temáticas da série:
  - Novos tipos: `spirit_surge`, `arc_chain`, `phantom_strike`, `kill_frenzy`, `battle_rage`, `crit_splash`, `gold_detector`, `field_commander`.
- Anel dourado pulsante + indicador `P1`–`P10` na torre.
- Painel de inventário mostra passivas ativas (✦) e futuras (🔒) com valores exatos.

**♾ Modo Infinito:**
- Waves geradas dinamicamente com 8 tiers de dificuldade (Fácil → Além do Limite).
- Escalonamento de HP: 1× → 1.8× → 3.2× → 5.5× → 9× → 15× → 25× → 40×+.
- Inimigos de todos os mundos aparecem progressivamente conforme o tier.
- Miniboss a cada 10 waves; boss a cada 30 waves.
- Recompensas a cada 5 waves: Gemas escalando por tier (15–200💎).
- **Limite de 3 cópias** da mesma unidade no campo (contador visual no painel lateral).
- Recorde de wave salvo permanentemente.

**Star Experience ✨:**
- Materiais exclusivos do Modo Infinito, Nv1 a Nv5.
- XP: Nv1=3.000 · Nv2=7.000 · Nv3=16.000 · Nv4=38.000 · Nv5=90.000.
- Drop por wave com chance independente por nível: na wave 30 → SE1=10%, SE2=5%, SE3=2%, SE4=1%, SE5=0.5%.
- Fórmula: `chance = min(100%, wave/30 × base)` — escala linearmente, garantindo SE1 na wave ~300.

**Qualidade de Vida e Balanceamento:**
- Stun no mapa 3 do evento nerfado: duração aleatória (1–5s) por torre, imunidade de 5s.
- Pain (Nagato) invoca escudo de Rinnegan aleatório (4.000–6.000 HP) que bloqueia todo o dano.
- Overlay "Próxima Wave" mostra bônus de ouro e atalho `[S]`.
- Botão de skip mostra ouro do próximo skip no tooltip.
- Indicador de imunidade a stun nas torres (badge azul com countdown).
- Indicador `✦ MAXIMIZADO` no painel de upgrade quando todas as melhorias foram compradas.
- Velocidade do jogo colorida: 1× branco, 2× amarelo, 3× vermelho.
- Status da torre (dano, alcance, vel., tipo) exibidos no painel de upgrade.
- Zoro Ashura (5⭐ evolução) removido do pool do Gacha.
- `getTowerStats` com cache por torre (invalidado ao comprar upgrade).
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

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** — renderização 2D do gameplay.
- **CSS3** — variáveis e animações para UI rica.
- **Vanilla JavaScript** — sem frameworks, controle total e leveza máxima.

---

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
