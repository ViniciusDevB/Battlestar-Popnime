# 🌟 Battlestar Popnime

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos de anime e quadrinhos (Naruto, Bleach, One Piece, Marvel, entre outros). O jogo conta com um sistema completo de progressão, incluindo **Gacha**, missões, inventário, evolução, prestígio e recursos online.

---

## 🚀 Como Jogar / Executar

O projeto é construído em **HTML5, CSS3 e Vanilla JavaScript**. Nenhuma instalação necessária:

1. Clone o repositório:
   ```bash
   git clone https://github.com/ViniciusDevB/Battlestar-Popnime.git
   ```
2. Abra a pasta do projeto.
3. Abra o `index.html` no navegador.

*(Recomendado: usar Live Server do VS Code para melhor experiência de desenvolvimento.)*

> **Online**: os recursos online (leaderboard, trocas, missões da comunidade) requerem a configuração do Supabase em `data/online_config.js`.

---

## ✨ Funcionalidades

**Gameplay:**
- **Tower Defense Dinâmico** — posicione unidades estrategicamente no canvas. Cada personagem tem tipo de ataque único (Single, Linha, Cone, AOE, Pierce, Scatter), passivas e upgrades exclusivos.
- **Mundos e Fases** — 4 mundos temáticos (Naruto, One Piece, Bleach, Marvel) com 6 fases cada, 10 waves por fase. Três dificuldades por fase (Normal, Difícil, Lendário).
- **♾ Modo Infinito** — waves sem fim com dificuldade escalável (8 tiers). Farm de Star Experience e Gemas. Limite de 3 cópias por unidade por partida.
- **Sagas de Eventos** — capítulos narrativos com modificadores únicos e personagens exclusivos.

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
- **Integridade** — HMAC do save + validação de plausibilidade bloqueiam scores e trocas com saves adulterados.

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
│   ├── game.js             — loop principal, canvas, IA de inimigos, passivas, infinito
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
    ├── migrate_trades_v2.sql      — schema completo (players, saves, trades, etc.)
    └── community_missions_seed.sql — seed das missões da comunidade
```

---

## 📈 Histórico de Updates

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
- Fase 1 — 300k HP + escudo 100k. Snap stuna torres a cada 25s. Drena 1 vida a cada 3s.
- Fase 2 — 300k HP, speed 55. Imune a slow. Ativa 1 das 6 Gemas do Infinito a cada 20s em rotação.

**8 novos personagens** (3⭐ a 5⭐): Homem-Aranha, Viúva Negra, Gavião Arqueiro, Pantera Negra, Thor, Hulk, Iron Man Mark 50 (5⭐ Gacha), World Breaker Hulk (5⭐ Evolução).

**Evento — Operação: Ressurreição** (4 capítulos):
- Escudo de Areia, Nevoeiro Mortal, Frente Dupla, Modo Jinchuuriki.
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
Saga em 3 capítulos, Orochimaru (4⭐) e Pain (5⭐), modificadores exclusivos de fase.

### ✅ Update 0.5: Grand Line *(Lançado)*
Mundo 2 de One Piece com 9 personagens, atalhos de teclado, QoL geral.

### ✅ Update 0: Fundação Ninja *(Lançado)*
Loop principal, canvas, sistema de defesa, Gacha, Save, Missões, Mundo Naruto.

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
