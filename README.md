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

- **Tower Defense Dinâmico**: Posicione suas unidades estrategicamente pelo mapa para defender sua base de hordas de inimigos. Cada personagem possui ataques únicos, variações de área de dano, status (Burn, Bleed, Stun, Slow) e upgrades exclusivos durante a partida.
- **Sistema de Gacha ⚡**: Use Gemas e Tickets ganhos nas fases para invocar novos personagens (3⭐, 4⭐ e 5⭐). O sistema inclui *pity* (garantia após 150 invocações) e banners rotativos.
- **Gerenciamento e Evolução 🔮**: Suba de nível suas unidades ("Feed" / alimentação) e as evolua para versões mais poderosas utilizando materiais dropados em fases específicas.
- **Missões 📋**: Missões diárias e de conquistas para guiar a progressão e fornecer mais recompensas.
- **Mundos e Fases 🗺️**: Dezenas de fases divididas por mundos temáticos. Cada fase possui dificuldades (Normal, Difícil e Lendário) que recompensam com mais gemas.
- **Sistema de Salvamento Automático 💾**: Todo seu progresso fica salvo no LocalStorage do navegador. Você pode pausar e continuar de onde parou.

## 📁 Estrutura do Projeto

O código-fonte é separado de forma lógica entre a lógica base, definições de dados e estilos.

- `/` (Raiz): Contém a estrutura principal no `index.html` e os estilos e tokens em `style.css`.
- `/js`: Contém toda a lógica de funcionamento e os sistemas do jogo:
  - `game.js`: Loop principal, renderização no `<canvas>`, lógica de inimigos, projéteis, e habilidades de defesa.
  - `gacha.js` e `banner.js`: Sistemas de invocação (RNG, pity e banner rotativo).
  - `save.js`: Controle de dados via `localStorage`.
  - `inventory.js`: Lógica do inventário, evolução e sacrifício de personagens.
  - `ui.js`: Controle das telas, menus e manipulação do DOM.
  - `missions.js` e `main.js`: Sistema de missões e entry-point.
- `/data`: Contém os dados estruturados do universo:
  - `characters.js`: Definição dos personagens e suas mecânicas in-game.
  - `enemies.js`: Tipos de inimigos e seus status.
  - `stages.js` e `world.js`: Configuração do mapa, caminhos (waypoints) e waves de inimigos.

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** (para renderização gráfica 2D de alta performance do gameplay).
- **CSS3** (com variáveis CSS e animações para uma UI rica).
- **Vanilla JavaScript** (Sem frameworks, focando em controle total e leveza).

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
