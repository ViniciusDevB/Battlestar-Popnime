# 🌟 Battlestar Popnime

<p align="center">
  <img src="assets/cover.jpg" alt="Battlestar Popnime Cover" width="100%">
</p>

**Battlestar Popnime** é um web-game no estilo **Tower Defense** que reúne personagens icônicos de diversos universos de anime e quadrinhos (Naruto, Bleach, One Piece, Marvel, entre outros). O jogo conta com um sistema completo de progressão, incluindo **Gacha**, missões, inventário, evolução, prestígio e recursos online.

---

## 🚀 Como Jogar

Acesse diretamente pelo navegador, sem necessidade de instalação ou download:

**🔗 [viniciusdevb.github.io/Battlestar-Popnime](https://viniciusdevb.github.io/Battlestar-Popnime/)**

Todos os recursos online (conta, leaderboard, trocas, missões da comunidade) funcionam perfeitamente na versão web.

---

## ✨ Funcionalidades

**Gameplay:**
- **Tower Defense Dinâmico** — posicione unidades estrategicamente. Cada personagem tem tipo de ataque único (Single, Linha, Cone, AOE, Pierce, Scatter), passivas e upgrades exclusivos.
- **Mundos e Fases** — 4 mundos temáticos (Naruto, One Piece, Bleach, Marvel) com progressão linear de HP ajustada. 6 fases cada, 10 waves por fase. Três dificuldades por fase (Normal, Difícil, Lendário).
- **♾ Modo Infinito** — waves sem fim com dificuldade escalável (8 tiers). Farm de Star Experience e Gemas. Limite de 3 cópias por unidade por partida.
- **Sagas de Eventos** — capítulos narrativos estendidos (10 a 15 waves) para maior farm de ouro, com modificadores únicos e personagens exclusivos.

**Progressão:**
- **Gacha ⚡** — invoque personagens (3⭐ a 5⭐) com pity garantido no 150º pull. Banners rotativos a cada 30 minutos com pool diferente.
- **Feed & Evolução 🔮** — suba de nível unidades via Feed e evolua-as para formas superiores com materiais dropados em fases.
- **Prestígio ✦** — ao atingir Lv50, transmute uma unidade para Prestígio (máx P10). Cada nível concede +20% de dano e +6% de alcance, além de passivas exclusivas.
- **Star Experience ✨** — materiais exclusivos do Modo Infinito (Nv1–5) com XP massivo, usáveis no Feed de qualquer personagem.

**Missões 📋**
- **Diárias** — 10 missões sorteadas por dia (resets automático à meia-noite), recompensas em Gemas e Tickets.
- **Conquistas** — 55 missões permanentes cobrindo todos os mundos, kills, dano, gacha, coleção de personagens, modo infinito e progressão.
- **Comunidade** — missão online coletiva com meta global, barra de progresso em tempo real e recompensa de personagem 5⭐ aleatório para quem contribuiu.

**Online:**
- **Contas e Perfil** — registro/login com username e senha. Barra de status online no HUD. Contas novas iniciam com 500 💎 e os 3 personagens 3⭐ do banner ativo.
- **Leaderboard e Rankings** — envio de scores (infinito e fases), ranking global paginado com destaque do próprio rank.
- **Trocas** — ofertas assíncronas de personagens entre jogadores com até 3 unidades, pedido opcional e expiração automática (7 dias).
- **Save Sync** — save automático na nuvem garantindo a segurança do seu progresso.

**Qualidade de Vida:**
- Auto-Place com 3 slots por fase (salva e recarrega posicionamento).
- Undo da última torre colocada (tecla `Z`).
- Filtro múltiplo no inventário (mundo, raridade).
- Preview de wave com ícones de tipos e alerta de miniboss/boss.
- Comparação de atributos no painel de upgrade.
- Barra de pity colorida.
- Atalhos de teclado para principais ações do jogo.

---

## 📈 Histórico de Updates

> ⚖️ **Procurando pelos detalhes de balanceamento?**
> Veja o nosso documento de [Patch Notes (Buffs e Nerfs)](./PATCH_NOTES.md) para acompanhar todas as mudanças específicas em personagens e mundos!

### ✅ Update 2: Invasão Secreta *(Lançado)*
- **Mundo 4 — Nova York**: 6 novas fases enfrentando a invasão da Marvel, com Thanos como Boss final.
- **8 novos personagens**: Homem-Aranha, Viúva Negra, Gavião Arqueiro, Pantera Negra, Thor, Hulk, Iron Man e World Breaker Hulk.
- **Evento — Operação: Ressurreição**: 4 capítulos narrativos com modificadores e inimigos temáticos.

#### ↳ 2.9 — Rebalanceamento Global
- **Rebalanceamento Geral**: Ajuste completo nos atributos e passivas das torres em todas as raridades.
- **Nova Economia**: Os inimigos agora concedem um valor fixo de ouro (50). O ouro inicial foi padronizado (300).
- **Rework de Prestígio e Farm**: Personagens focados em farm como L (Death Note) receberam novas mecânicas.
- **Passiva Única (Nami)**: Adicionada nova mecânica de "Tempestade Acumulada".
- **Melhorias de Performance e Visuais**: Otimização do jogo em fases avançadas e novas animações no Gacha.

#### ↳ 2.9.5 — Segurança, Deploy Público e Missões Em Breve
- **Deploy Público**: jogo disponível via GitHub Pages.
- **Missões Em Breve**: nova seção na aba Comunidade exibindo as próximas missões em carousel navegável.
- **Correção de Missões Diárias**: missões de mundo específico agora rastreiam partidas jogadas corretamente.
- **Melhorias de Segurança e Integridade**: múltiplas camadas de proteção, incluindo novo sistema de banimento automático.
- **Sistema de Admin**: contas oficiais de desenvolvedores com identificação visual exclusiva no perfil e leaderboard.

#### ↳ 2.5.10 — Melhorias no Gacha e Áudio
- **Animação Épica no Gacha**: Novo overlay em CSS com portal mágico, warp speed, queda de meteoro e onda de choque.
- **Áudio Contínuo**: A música do menu agora flui perfeitamente entre transições de tela sem reiniciar do zero.

#### ↳ 2.9.10 — Internacionalização Completa
- **Suporte completo a Inglês**: todo o texto visível do jogo — HUD, menus, toasts, modais, formulários online, leaderboard, trocas, missões, passivas e prestígio — agora traduzido corretamente ao selecionar EN.
- **Sistema i18n expandido**: suporte a `data-i18n-title` para tooltips e ~140 novas chaves de tradução adicionadas.
- **Cobertura total**: mais de 100 strings em PT hardcoded corrigidas em 20+ arquivos (JS e HTML).

### ✅ Update 1: Soul Society *(Lançado)*
- **Mundo 3 — Bleach**: 6 novas fases enfrentando Hollows e Arrancars, com Aizen como Boss final.
- **10 novos personagens**: do universo de Bleach.
- **Sistema de Prestígio ✦**: progressão estendida para unidades nível 50.
- **♾ Modo Infinito**: waves sem fim e sistema de Star Experience.

### ✅ Updates Anteriores
- **0.6:** Evento — A Anomalia de Konoha.
- **0.5:** Grand Line (Mundo 2).
- **0:** Fundação Ninja (Lançamento base).

---

## ⏳ Por Vir

### ☣️ Evento: Protocolo Nemesis — Última Resistência

Um modo de jogo temporário inspirado em **Resident Evil clássico**. Defenda Raccoon City contra ondas de infectados enquanto o **Nemesis caça ativamente suas torres**. O confronto exige gerenciamento de recursos, coletando itens pelo mapa enquanto uma bomba-relógio ameaça a partida.
Completar runs desbloqueia o **Arquivo Umbrella**, uma meta-progressão permanente com bônus desbloqueáveis, além da unidade 5⭐ exclusiva **Nemesis**.

---

## 🗺️ Roadmap

### 🔜 Update 3: Crise nas Infinitas Terras *(Planejado)*
O universo DC chega ao Battlestar Popnime com um novo mundo temático e novos personagens.

### 🔜 Update 4: Marvel vs DC *(Planejado)*
Evento especial centrado no confronto entre os universos Marvel e DC.

---

## 👨‍💻 Créditos

Projeto criado e mantido por [ViniciusDevB](https://github.com/ViniciusDevB).
