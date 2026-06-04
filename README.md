# 🌟 Battlestar Popnime

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos dos animes (Naruto, Bleach, Dragon Ball, One Piece, entre outros). O jogo conta com um sistema completo de progressão, incluindo mecânicas de **Gacha**, missões, gerenciamento de inventário e evolução de personagens.

## 🚀 Como Jogar / Executar o Projeto

O projeto é construído em **HTML5, CSS3 e Vanilla JavaScript**. Não é necessário configurar nenhum ambiente complexo (como Node.js, Webpack, etc.) para rodar o jogo:

1. Clone o repositório para a sua máquina:
   ```bash
   git clone https://github.com/ViniciusDevB/Battlestar-Popnime.git
   ```
2. Abra a pasta do projeto.
3. Clique duas vezes no arquivo `index.html` para abri-lo no seu navegador de preferência.
4. Jogue e divirta-se!

*(Opcional: Você pode utilizar extensões como o Live Server do VS Code para uma melhor experiência de desenvolvimento local).*

## ✨ Funcionalidades

- **Tower Defense Dinâmico**: Posicione suas unidades estrategicamente pelo mapa para defender sua base de hordas de inimigos. Cada personagem possui tipo de ataque único (Single, Linha, Cone, AOE, Full AOE), sistema de passivas (Bleed, Burn, Crítico, Aura, Clones, Kill Streak e mais) e upgrades exclusivos durante a partida.
- **Sistema de Gacha ⚡**: Use Gemas e Tickets ganhos nas fases para invocar novos personagens (3⭐, 4⭐ e 5⭐). Inclui *pity* (garantia no 150º pull) e banners rotativos a cada 30 minutos.
- **Gerenciamento e Evolução 🔮**: Suba de nível suas unidades via Feed (com bônus de série) e evolua-as para formas superiores usando materiais dropados em fases específicas.
- **Missões 📋**: Sistema de missões progressivas para guiar a jornada e recompensar o jogador com Gemas e Tickets.
- **Sagas de Eventos 🌟**: Capítulos narrativos com história própria, fases exclusivas, modificadores únicos (Breu Total, Meteoros, Shinra Tensei) e personagens exclusivos como Orochimaru e Pain que só podem ser obtidos nesses eventos.
- **Mundos e Fases 🗺️**: Fases divididas por mundos temáticos (Naruto, One Piece). Cada fase possui três dificuldades (Normal, Difícil e Lendário) com recompensas crescentes.
- **Sistema de Salvamento Automático 💾**: Todo o progresso é salvo no LocalStorage do navegador automaticamente.

## 📁 Estrutura do Projeto

O código-fonte é separado de forma lógica entre a lógica base, definições de dados e estilos.

- `/` (Raiz): Contém a estrutura principal no `index.html` e os estilos e tokens em `style.css`.
- `/js`: Contém toda a lógica de funcionamento e os sistemas do jogo:
  - `game.js`: Loop principal, renderização no `<canvas>`, lógica de inimigos, projéteis, habilidades de defesa e sistema de passivas.
  - `gacha.js` e `banner.js`: Sistemas de invocação (RNG, pity e banner rotativo de 30 minutos).
  - `save.js`: Controle de dados via `localStorage`.
  - `inventory.js`: Lógica do inventário, feed, combinação de materiais e evolução de personagens.
  - `ui.js`: Controle das telas, menus e manipulação do DOM.
  - `missions.js` e `main.js`: Sistema de missões e entry-point.
- `/data`: Contém os dados estruturados do universo:
  - `characters.js`: Definição dos personagens, passivas, upgrades e mecânicas in-game.
  - `enemies.js`: Tipos de inimigos, status especiais e handlers de habilidades.
  - `events_data.js`: Sagas de eventos com história, fases, waves e drops exclusivos.
  - `stages.js` e `world.js`: Configuração dos mundos, caminhos (waypoints) e waves de inimigos.

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** (para renderização gráfica 2D de alta performance do gameplay).
- **CSS3** (com variáveis CSS e animações para uma UI rica).
- **Vanilla JavaScript** (Sem frameworks, focando em controle total e leveza).

## 📈 Atualizações (Patch Notes)

### Update 0: Fundação Ninja
- **Foco:** Criação do loop principal de gameplay, sistema de defesa de torres, evolução de personagens, Gacha e Save.
- **Conteúdo:** Implementação do mundo de Naruto e primeiros heróis baseados em Bleach, Jujutsu Kaisen, Dragon Ball e Hunter x Hunter. Inimigos iniciais (Ninjas, Cobras e Pain).

### Update 1: One Piece e QoL
- **Foco:** Expansão de conteúdo e melhorias na experiência do jogador.
- **Conteúdo:** Adição do mundo de One Piece com 9 novos personagens (Sanji, Robin, Ace, Zoro Ashura, Luffy G4, Barba Branca, Nami, Usopp, Brook). Atalhos de teclado (Espaço, 1–6, S, F, U, Del/Backspace). Funcionalidade "Combinar Tudo" no inventário e botão de "Antecipar Wave" (até 2 waves extras simultâneas).

### Update 2: Evento — A Anomalia de Konoha
- **Foco:** Sistema de eventos com narrativa, modificadores e personagens exclusivos.
- **Conteúdo:** Primeira saga de evento em 3 capítulos. Novos personagens exclusivos de evento: **Orochimaru (4⭐)** e **Pain — Seis Caminhos (5⭐)**. Modificadores de fase exclusivos (Breu Total, Meteoros + Shinra Tensei, 5 caminhos simultâneos). Correções de bugs: paths de imagem dos personagens de evento, Domínio Expandido do Gojo, mecânica de burst do Zoro Ashura, passivas de array, efeitos visuais duplicados e sistema de feed sem materiais One Piece.

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
