# Battlestar Popnime

<p align="center">
  <img src="assets/cover.jpg" alt="Battlestar Popnime Cover" width="100%">
</p>

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de animes e quadrinhos (Naruto, Bleach, One Piece, Marvel, DC e outros). O jogo conta com um sistema completo de progressão — Gacha, Inventário, Prestígio, Relíquias, Base de Operações e recursos online com save sincronizado na nuvem.

---

## Como Jogar

> **Login obrigatório.** Battlestar Popnime é um jogo exclusivamente online. Não há modo offline.

### Instalador Desktop (Windows)

**[Baixar — Battlestar Popnime para Windows](https://github.com/ViniciusDevB/Battlestar-Popnime/releases/latest)**

- Instala como qualquer programa; cria atalho na área de trabalho
- Atualizações automáticas silenciosas ao abrir o jogo
- Requer internet e login para jogar

### Versão Web (Navegador)

**[viniciusdevb.github.io/Battlestar-Popnime](https://viniciusdevb.github.io/Battlestar-Popnime/)**

Sem instalação. O progresso é sincronizado — sua conta funciona nas duas versões.

---

## Funcionalidades

### Gameplay
- **Tower Defense Dinâmico** — posicione unidades estrategicamente. Cada personagem tem tipo de ataque único (Single, Linha, Cone, AOE, Pierce, Scatter), passivas exclusivas e upgrades ramificados.
- **4 Mundos + DC** — Naruto, One Piece, Bleach, Marvel e DC. 6 fases por mundo, 10 waves por fase, três dificuldades (Normal, Difícil, Lendário).
- **Modo Infinito** — waves sem fim com 8 tiers de dificuldade. Farm de Star Experience e Gemas. Limite de 3 cópias por unidade.
- **Eventos** — capítulos narrativos estendidos (10–15 waves) com modificadores únicos e personagens exclusivos.

### Progressão
- **Gacha** — invoque personagens (3★ a 5★) com pity garantido no 150º pull. Banners rotativos. Darkseid 7★ secreto (1 em 2.000.000). Sorteio 100% server-side — inviolável.
- **Feed & Evolução** — suba de nível via Feed e evolua para formas superiores com materiais dropados em fases.
- **Prestígio** — ao atingir Lv50, transmute a unidade (máx P10). Unidades de dano ganham +10%/tier de dano; unidades de farm ganham +2%/tier de ouro por wave.
- **Relíquias** — artefatos de 4★ e 5★ forjados na Forja de Relíquias. Cada mundo tem relíquias únicas com versão Normal e Corrompida. Receitas desbloqueadas via gacha.
- **Base de Operações (Nexus)** — 10 estruturas melhoráveis com Gemas que persistem entre partidas (Hospital, Cofre, Academia, Quartel, Forja, Laboratório, Banco de Guerra, Torre de Vigilância, Templo e Centro de Retransmissão).

### Online
- **Contas e Perfil** — registro com username. Contas novas iniciam com 500 💎 e 3 personagens 3★ do banner ativo.
- **Leaderboard** — ranking global de Modo Infinito e fases. Posição pessoal destacada.
- **Trocas** — ofertas assíncronas de até 3 unidades, expiração automática em 7 dias.
- **Missões de Comunidade** — meta coletiva global com barra de progresso em tempo real. Recompensa de personagem 5★ para todos os contribuintes.
- **Save Sync** — progresso salvo automaticamente na nuvem a cada partida.

### Qualidade de Vida
- Deck Panel redesenhado — layout horizontal com raridade, prestígio, pips de upgrade e indicador de habilidade
- Auto-Place com 3 slots por fase
- Undo da última torre (tecla `Z`)
- Filtro múltiplo no inventário
- Preview de wave com alerta de miniboss/boss
- Comparação de atributos no painel de upgrade
- Barra de pity colorida
- HUD totalmente responsivo (adapta-se a qualquer resolução)

---

## Histórico de Updates

> Veja o [Patch Notes completo](./PATCH_NOTES.md) para todas as mudanças detalhadas de balanceamento, sistemas e correções.

---

### 🆕 Update 3.2.1 — Interface e Correções *(Lançado — 12 Jun 2026)*

- **Deck Panel Redesenhado** — cards horizontais com borda colorida por raridade, badge de prestígio, pips de upgrade da torre deployada, indicador de habilidade ativa (⚡ PRONTO / cooldown em segundos) e custo com desconto do Quartel aplicado em tempo real.
- **10 Bugs Críticos Corrigidos** — prestígio do admin perdido no reload, grant repetido a cada carregamento, nexus/gemas do admin não persistidos, cristais injetáveis em conta nova, blueprint revogável via `false`, `in_trade` não persistia no servidor, `bonusGems` zerado em partidas repetidas, craft sem receita permitido.
- **Receitas de Relíquias via Gacha** — relíquias agora exigem que a receita seja desbloqueada pelo banner antes de poder ser forjada. Validação client e server-side.
- **HUD Totalmente Responsivo** — todos os elementos do HUD de combate adaptam-se a qualquer resolução de tela.

---

### ✅ Update 3.1 — Base de Operações e Relíquias *(Lançado — 11 Jun 2026)*

- **Base de Operações (Nexus)** — 10 estruturas melhoráveis com Gemas que persistem entre partidas, cada uma com efeito distinto sobre gameplay.
- **Sistema de Relíquias** — artefatos equipáveis de 4★ e 5★ (um por mundo) com versão Normal e Corrompida. Forjados com materiais de Chefes e Elites.
- **Rebalanceamento de Prestígio** — dano: +10%/tier (P1–P5) e +2%/tier (P6–P10). Farm: +2% ouro/wave por tier.
- **Gacha 100% Server-Side** — `fn_gacha_pull` RPC atômica: sorteio, pity e dedução de moeda no servidor. Nenhum dado econômico vem do cliente.
- **Anti-Exploit de Trocas** — unidades em oferta ativa recebem flag `in_trade` — bloqueadas para Feed, Evolução e Prestígio até cancelamento.

---

### ✅ Update 3 — Crise nas Infinitas Terras *(Lançado — Jun 2026)*

<p align="center">
  <img src="assets/update3crisenasinfinitasterras.jpg" alt="Update 3 — Crise nas Infinitas Terras" width="100%">
</p>

- **Mundo 5 — DC Universe** — 6 novas fases sob a invasão de Apokolips com Darkseid como Boss. 9 personagens DC: Flash, Batgirl, Aquaman, Batman, Lois Lane, Lanterna Verde, Superman, Shazam e Flash Reverso.
- **Versão Desktop (Windows)** — instalador nativo com atualizações automáticas em segundo plano.
- **Sistema Online Completo** — contas, leaderboard global, trocas assíncronas, missões de comunidade e save sync na nuvem.
- **Internacionalização** — suporte completo a Inglês com ~140 novas chaves de tradução em todas as telas do jogo.
- **Darkseid 7★** — unidade secreta com chance de 1 em 2.000.000 no gacha, reveal épico e mecânicas únicas.

---

### ✅ Update 2 — Invasão Secreta *(Lançado)*

<p align="center">
  <img src="assets/update2invasõessecretas.jpg" alt="Update 2 — Invasão Secreta" width="100%">
</p>

- **Mundo 4 — Nova York** — 6 novas fases com Thanos como Boss final de 2 fases.
- **8 novos personagens** — Homem-Aranha, Viúva Negra, Gavião Arqueiro, Pantera Negra, Thor, Hulk, Iron Man e World Breaker Hulk.
- **Evento — Operação: Ressurreição** — 4 capítulos narrativos com modificadores e inimigos temáticos.

---

### ✅ Update 1 — Soul Society *(Lançado)*

- **Mundo 3 — Bleach** — 6 novas fases com Aizen & Hōgyoku como Boss final.
- **10 novos personagens** do universo Bleach.
- **Prestígio ✦** — sistema de transmutação P1–P10 com passivas exclusivas por tier.
- **Modo Infinito** — waves sem fim com 8 tiers e farm de Star Experience.

---

### ✅ Updates Anteriores

- **0.6** — Evento: A Anomalia de Konoha.
- **0.5** — Mundo 2: Grand Line (One Piece).
- **0** — Lançamento: Mundo Ninja (Naruto), mecânica base e gacha.

---

## Em Breve

### Evento: Protocolo Nemesis — Última Resistência

Modo temporário inspirado em Resident Evil. Defenda Raccoon City contra infectados enquanto o **Nemesis** caça ativamente suas torres. Bomba-relógio, meta-progressão permanente e a unidade exclusiva 5★ **Nemesis** como recompensa final.

### Update 4 — Marvel vs DC *(Planejado)*

Confronto entre os universos Marvel e DC. Novo mundo, novos personagens e mecânicas de crossover.

---

## Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
