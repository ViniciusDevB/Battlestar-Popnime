# 🌟 Battlestar Popnime

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos de anime e quadrinhos (Naruto, Bleach, One Piece, Marvel, entre outros). O jogo conta com um sistema completo de progressão, incluindo **Gacha**, missões, inventário, evolução, prestígio e recursos online.

---

## 🚀 Como Jogar

### Jogar agora (sem instalação)

Acesse diretamente pelo navegador:

**🔗 [viniciusdevb.github.io/Battlestar-Popnime](https://viniciusdevb.github.io/Battlestar-Popnime/)**

Nenhuma instalação, nenhum download. Todos os recursos online (conta, leaderboard, trocas, missões da comunidade) funcionam normalmente.

### Rodar localmente (desenvolvimento)

O projeto é construído em **HTML5, CSS3 e Vanilla JavaScript** — sem dependências ou build step:

1. Clone o repositório:
   ```bash
   git clone https://github.com/ViniciusDevB/Battlestar-Popnime.git
   ```
2. Abra a pasta no VS Code e inicie o **Live Server** (`Alt+L Alt+O`).

> O arquivo `data/online_config.js` com as credenciais do Supabase já está versionado — os recursos online funcionam imediatamente após o clone.

---

## ✨ Funcionalidades

**Gameplay:**
- **Tower Defense Dinâmico** — posicione unidades estrategicamente no canvas. Cada personagem tem tipo de ataque único (Single, Linha, Cone, AOE, Pierce, Scatter), passivas e upgrades exclusivos.
- **Mundos e Fases** — 4 mundos temáticos (Naruto, One Piece, Bleach, Marvel) com progressão linear de HP ajustada. 6 fases cada, 10 waves por fase. Três dificuldades por fase (Normal, Difícil, Lendário).
- **♾ Modo Infinito** — waves sem fim com dificuldade escalável (8 tiers). Farm de Star Experience e Gemas. Limite de 3 cópias por unidade por partida.
- **Sagas de Eventos** — capítulos narrativos estendidos (10 a 15 waves) para maior farm de ouro, com modificadores únicos e personagens exclusivos.

**Progressão:**
- **Gacha ⚡** — invoque personagens (3⭐ a 5⭐) com pity garantido no 150º pull. Banners rotativos a cada 30 minutos com pool diferente. Chance de 5⭐: 1%.
- **Feed & Evolução 🔮** — suba de nível unidades via Feed e evolua-as para formas superiores com materiais dropados em fases.
- **Prestígio ✦** — ao atingir Lv50, transmute uma unidade para Prestígio (máx P10). Cada nível concede +20% de dano e +6% de alcance, além de passivas exclusivas em P1, P5 e P10.
- **Star Experience ✨** — materiais exclusivos do Modo Infinito (Nv1–5) com XP massivo, usáveis no Feed de qualquer personagem.

**Missões 📋** — modal unificado com três abas:
- **Diárias** — 10 missões sorteadas por dia (resets automático à meia-noite), recompensas em Gemas e Tickets.
- **Conquistas** — 55 missões permanentes cobrindo todos os mundos, kills, dano, gacha, coleção de personagens, modo infinito e progressão. Exibe 8 por vez em fila.
- **Comunidade** — missão online coletiva com meta global, barra de progresso em tempo real e recompensa de personagem 5⭐ aleatório para quem contribuiu.

**Online (via Supabase):**
- **Contas e Perfil** — registro/login com username e senha. Barra de status online no HUD. Contas novas iniciam com 500 💎 e os 3 personagens 3⭐ do banner ativo.
- **Leaderboard e Rankings** — envio de scores (infinito e fases), ranking global paginado com destaque do próprio rank.
- **Trocas** — ofertas assíncronas de personagens entre jogadores com até 3 unidades, pedido opcional e expiração automática (7 dias).
- **Save Sync** — save automático na nuvem com merge inteligente (último timestamp vence em inventário/moedas; stats e completões de fases fazem union).
- **Reset de Conta** — o botão ⚙ apaga o save local e, se logado, remove o save do servidor e faz logout.
- **Integridade** — HMAC do save + validação server-side de scores (trigger SQL) + sistema de banimento automático por violações bloqueiam adulteração de saves e cheats.

**Qualidade de Vida:**
- Auto-Place com 3 slots por fase (salva e recarrega posicionamento).
- Undo da última torre colocada (tecla `Z`), bloqueado após spawn de inimigos.
- Filtro múltiplo no inventário (mundo, raridade) persistido no localStorage.
- Preview de wave com ícones de ptype e alerta de miniboss/boss.
- Comparação de stats no painel de upgrade (atual → próximo nível em verde).
- Barra de pity colorida (azul → amarelo → vermelho).
- Atalhos de teclado: `Space` pausar, `S` skip wave, `F` velocidade, `U` upgrade, `Z` undo, `Del` vender, `1–6` selecionar torre.

---

## 📁 Estrutura do Projeto

```
/
├── index.html              — estrutura e layout principal
├── style.css               — estilos globais e componentes de UI
├── js/
│   ├── game.js             — loop principal, IA de inimigos, controle de loop (reduzido)
│   ├── game-utils.js       — utilitários compartilhados e declarações de contexto
│   ├── game-infinite.js    — geração de waves infinitas e recompensas
│   ├── game-attack.js      — manipuladores de ataque e mira
│   ├── game-renderer.js    — funções de renderização do canvas
│   ├── game-hud.js         — controles de interface, upgrades, preview de waves
│   ├── game-towers.js      — posicionamento, seleção e evolução de torres
│   ├── game-waves.js       — spawn de waves, progressão e modificadores
│   ├── game-passives.js    — sistema de passivas modular
│   ├── game-projectile-render.js — renderização visual de projéteis
│   ├── gacha.js            — sistema de invocação
│   ├── banner.js           — banners rotativos com seed determinístico
│   ├── save.js             — persistência via localStorage + API de save
│   ├── inventory.js        — inventário, feed, evolução, prestígio
│   ├── missions.js         — checkers e lógica de conquistas e diárias
│   ├── ui.js               — controle de telas, DOM e hub
│   ├── ui-missions-online.js — modal unificado de missões (3 abas)
│   ├── online.js           — camada Supabase (auth, sync, leaderboard, trocas)
│   ├── ui-online.js        — UI de login/registro/perfil
│   ├── ui-leaderboard.js   — UI do ranking global
│   ├── ui-trades.js        — UI do sistema de trocas
│   ├── integrity.js        — HMAC, validação de plausibilidade, DevTools guard
│   └── main.js             — entry-point, inicialização e atalhos globais
├── data/
│   ├── characters.js       — personagens, passivas, upgrades, prestígio, Star Exp
│   ├── enemies.js          — inimigos de todos os mundos + handlers especiais
│   ├── stages.js           — fases de todos os mundos + estágio infinito
│   ├── world.js            — mundos, caminhos e paths
│   ├── events_data.js      — sagas de eventos
│   ├── missions_data.js    — pool de conquistas (55) e diárias (24)
│   └── online_config.js    — credenciais Supabase (não versionado)
└── supabase/
    ├── schema.sql                  — schema completo (players, saves, trades, etc.)
    ├── setup_community.sql         — setup idempotente das missões comunitárias
    ├── community_missions_seed.sql — seed das missões da comunidade
    ├── security_patch.sql          — correções de segurança aplicáveis a bancos existentes
    ├── ban_system.sql              — sistema de banimento e log de violações
    ├── admin_setup.sql             — configuração da conta admin
    └── functions/
        └── log-violation/          — Edge Function: log de violações com IP real
```

---

## 📈 Histórico de Updates

### ✅ Update 2.9.5: Segurança, Deploy Público e Missões Em Breve *(Lançado)*

**O jogo agora é jogável online por qualquer pessoa, com múltiplas camadas de segurança:**

- **Deploy Público**: jogo disponível via GitHub Pages sem necessidade de clonar o repositório. Todos os recursos online funcionam diretamente no browser.
- **Missões Em Breve**: nova seção na aba Comunidade exibindo as próximas missões em carousel navegável, com card especial e animação para o evento do Nemesis.
- **Correção de Missões Diárias**: missões de mundo específico (Naruto, One Piece, Bleach, Marvel) agora rastreiam partidas jogadas corretamente, funcionando para jogadores veteranos que já completaram todos os mundos.
- **Segurança — Client-side**: remoção dos códigos de cheat (`CHEATON`/`MONEY`) que estavam visíveis no código público; `Game.addGold()` removido da API pública; clamp defensivo no pity counter; rotação da constante do HMAC.
- **Segurança — Server-side**: trigger SQL valida scores antes de inserir (tetos de valores, rate limit de 30/hora); funções `accept_trade` e `contribute_to_mission` corrigidas para derivar identidade do auth context em vez de aceitar parâmetro externo; RLS de trades restrita ao cancelamento pelo próprio ofertante.
- **Sistema de Banimento**: tabela `banned_ips`, log de violações com IP real via Edge Function (`log-violation`), ban automático de conta + IP após 3 violações graves em 7 dias.
- **Sistema de Admin**: conta `GordaneliGM` com acesso total, isenta de todas as verificações de integridade. Username bloqueado por índice case-insensitive. Identificação visual exclusiva: nome dourado animado, badge `DESENVOLVEDOR` no perfil e tag `DEV` no leaderboard.
- **Validação de Delta do Save**: servidor compara o save novo com o anterior antes de aceitar o upsert, rejeitando ganhos implausíveis de gemas ou unidades.

---

### ✅ Update 2.9: Arquitetura Modular e Rebalanceamento Global *(Lançado)*

**Uma grande atualização técnica e de balanceamento para o jogo:**

- **Arquitetura Modular**: O arquivo `game.js` monolítico de mais de 3100 linhas foi dividido em 7 módulos focados (`game-utils.js`, `game-infinite.js`, `game-attack.js`, `game-renderer.js`, `game-hud.js`, `game-towers.js`, `game-waves.js`), melhorando muito a manutenibilidade.
- **Rebalanceamento Geral**: Ajuste completo nos atributos e passivas das torres em todas as raridades (ex: Naruto Sage, Sanji, Byakuya, Ichigo Bankai, Sasuke, Kenpachi, Hawkeye, Luffy Gear 4, Orochimaru, Pain e Killer Bee).
- **Nova Economia**: Os inimigos agora concedem um valor fixo de ouro (50). O ouro inicial foi padronizado (300). O bônus por pular waves agora é progressivo. A mecânica antiga de ouro variável baseada no tipo de inimigo foi removida.
- **Rework de Prestígio e Farm**: L (Death Note) passou por um redesign e se tornou ainda mais focado em farm, com uma nova passiva `farm_aura` no P5. Melhorias nas passivas de prestígio de Orihime e Tsunade.
- **Passiva Única (Nami)**: "Tempestade Acumulada" — A cada 8 ataques de Nami, todos os inimigos na tela sofrem uma redução de velocidade global com efeito visual exclusivo.
- **Performance**: O cálculo de distâncias pesado por frame (usando raiz quadrada) foi substituído por `distSq` (distância ao quadrado), melhorando substancialmente o desempenho do jogo no final das fases.
- **Limpeza**: Foram removidos scripts de patch antigos (`patch3.js` e `patch4.js`) e ajustada a corrida de concorrência da verificação de integridade no salvamento automático.
- **Visuals**: A tela do Gacha recebeu background animado e estendido.

---

### ✅ Update 2.5: Sistema Online *(Lançado)*

**Camada online assíncrona via Supabase — foco em comunidade, sem PvP/co-op:**

- **Contas**: registro e login com username/senha. Novas contas recebem 500 💎 e os 3 personagens 3⭐ do banner ativo no momento do cadastro.
- **Leaderboard**: scores do modo infinito e fases enviados automaticamente, ranking global paginado.
- **Sistema de Trocas**: ofertas públicas assíncronas com até 3 unidades (3⭐+), pedido opcional, aceite com picker, cancelamento com desbloqueio automático e expiração de 7 dias.
- **Missões unificadas**: modal com três abas — Diárias (10/dia, reset automático), Conquistas (55 permanentes cobrindo todos os mundos) e Comunidade (meta global com recompensa de 5⭐ aleatório).
- **Missão de Comunidade**: meta coletiva visível a todos os jogadores com barra de progresso em tempo real via Realtime do Supabase.
- **Reset de conta**: apaga save local e, se logado, remove o save remoto e faz logout.
- **Integridade**: HMAC + validação de plausibilidade bloqueiam adulteração de saves.
- **Banco de dados**: schema e migrations em `/supabase/`.

---

### ✅ Update 2: Invasão Secreta *(Lançado)*

**Universo Marvel entra no Battlestar Popnime + Evento narrativo shinobi:**

**Mundo 4 — Nova York** com caminho temático de Manhattan:
- **6 fases** com 10 waves cada, miniboss na W10 e Boss Thanos em 2 fases na F6.

**Inimigos:**
- `Invasor`, `Invasor Speed` (speed 155), `Invasor Fortified` (HP 20k + escudo 10k), `Invasor Regen` (210 HP/s), `Invasor Bomb` (AOE stun 1.8s).

**Minibosses:** Batroc (F1), Crossbones (F2), Ronan (F3), Corvus Glaive (F4), Ebony Maw (F5).

**Boss — Thanos (F6 W10):**
- Fase 1 — 100k HP + escudo 100k. Snap stuna torres a cada 25s. Drena 1 vida a cada 3s.
- Fase 2 — 120k HP, speed 55. Imune a slow. Ativa 1 das 6 Gemas do Infinito a cada 20s em rotação.

**8 novos personagens** (3⭐ a 5⭐): Homem-Aranha, Viúva Negra, Gavião Arqueiro, Pantera Negra, Thor, Hulk, Iron Man Mark 50 (5⭐ Gacha), World Breaker Hulk (5⭐ Evolução).

**Evento — Operação: Ressurreição** (4 capítulos, 15 waves cada):
- Escudo de Areia, Nevoeiro Mortal, Frente Dupla, Modo Jinchuuriki.
- Chefes Replicantes balanceados (50k a 100k HP) para escalar com o ouro fixo da economia.
- Personagens exclusivos: Tsunade (4⭐) e Killer Bee (5⭐, pity 80 runs).

**Qualidade de Vida:** Auto-Place (3 slots), Undo de posicionamento (tecla `Z`), Preview expandido de wave, Filtro múltiplo no inventário, Comparação de torres no upgrade, Barra de pity colorida.

---

### ✅ Update 1: Soul Society *(Lançado)*

**Bleach — Mundo 3 com 6 fases e sistema de prestígio:**

- Mundo 3: Soul Society com caminho exclusivo (curva em S tripla).
- 6 fases com 10 waves cada, miniboss na W10 e Boss Aizen em 2 fases na F6.
- **Inimigos:** Hollow, Arrancar, Vasto Lorde, Hollow Fortified, Hollow Regen, Hollow Explosion.
- **Minibosses:** Grand Fisher, Gin Ichimaru, Grimmjow, Nnoitra, Ulquiorra.
- **Boss Aizen/Hogyoku:** Fase 1 com escudo regenerativo e Kyoka Suigetsu. Fase 2 sem escudo, imune a slow, drena base e se cura.
- **10 novos personagens** (3⭐ a 5⭐): Rukia, Renji, Uryu, Orihime, Chad, Byakuya, Hitsugaya, Kenpachi, Ichigo Bankai (Gacha), Ichigo Vizard (Evolução).
- **Sistema de Prestígio ✦** — até P10, +20% dano e +6% alcance por nível, passivas em P1/P5/P10.
- **♾ Modo Infinito** — 8 tiers de dificuldade, miniboss a cada 10 waves, boss a cada 30 waves.
- **Star Experience** — Nv1–5 com XP 3k→90k, drop exclusivo do Modo Infinito.

---

### ✅ Update 0.6: Evento — A Anomalia de Konoha *(Lançado)*
Saga em 3 capítulos estendidos (10 a 12 waves), Orochimaru (4⭐) e Pain (5⭐), modificadores exclusivos de fase.

### ✅ Update 0.5: Grand Line *(Lançado)*
Mundo 2 de One Piece com 9 personagens, atalhos de teclado, QoL geral.

### ✅ Update 0: Fundação Ninja *(Lançado)*
Loop principal, canvas, sistema de defesa, Gacha, Save, Missões, Mundo Naruto.

---

## ⏳ Por Vir

### ☣️ Evento: Protocolo Nemesis — Última Resistência

Um modo de jogo temporário inspirado em **Resident Evil clássico**. Defend Raccoon City contra ondas de infectados enquanto o **Nemesis caça ativamente suas torres**, ignorando o caminho e mirando nas unidades mais poderosas. O confronto exige gerenciamento de recursos — ervas, kits de reparo e suprimentos aparecem no mapa e devem ser coletados em tempo real. Uma **bomba de contagem regressiva** de 3 horas paira sobre a partida, reduzida a cada dano sofrido.

Cada run é única: escolha uma **Relíquia** antes de começar, tome decisões de risco entre ondas e enfrente eventos aleatórios como Surtos de Lickers e Fúria do Nemesis. Sobreviventes S.T.A.R.S. (Jill, Leon, Carlos, Ada) podem aparecer no mapa — proteja-os para ativar habilidades únicas. Completar runs desbloqueia o **Arquivo Umbrella**, uma meta-progressão permanente com bônus desbloqueáveis.

**Recompensa:** Nemesis — unidade 5⭐ exclusiva do evento.

---

## 🗺️ Roadmap

### 🔜 Update 3: Crise nas Infinitas Terras *(Planejado)*

O universo DC chega ao Battlestar Popnime.

- Novo mundo temático DC com caminho e fases exclusivas.
- Novos personagens (3⭐ a 5⭐) com passivas e sinergias próprias.

> ⚠️ Personagens, inimigos e mecânicas a definir.

### 🔜 Update 4: Marvel vs DC *(Planejado)*

Evento especial centrado no confronto entre os universos Marvel e DC, sem novo mundo.

> ⚠️ Formato, recompensas e mecânicas a definir.

---

## 🛠️ Tecnologias

- **HTML5 Canvas** — renderização 2D do gameplay.
- **CSS3** — variáveis e animações para UI rica.
- **Vanilla JavaScript** — sem frameworks, controle total e leveza máxima.
- **Supabase** — backend online (Postgres, Auth, Realtime) para contas, leaderboard, trocas e missões da comunidade.

---

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
