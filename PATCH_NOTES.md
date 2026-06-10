# 📝 Patch Notes Oficiais (Histórico de Atualizações)

Bem-vindos ao portal de atualizações de **Battlestar Popnime**. Aqui você encontrará todas as informações detalhadas sobre mudanças de balanceamento, ajustes sistêmicos, correções de bugs e novos conteúdos. Nosso objetivo é manter total transparência com a comunidade sobre os números e os motivos por trás de cada mudança.

---

## 🔄 Update 3: Crise nas Infinitas Terras *(Em Desenvolvimento)*

*"O maior update de Battlestar Popnime até hoje. Além do novo mundo DC e dos 9 novos personagens em desenvolvimento, o Update 3 traz o lançamento desktop, a camada online completa, rebalanceamento global e suporte a inglês — consolidando a base do jogo para o futuro."*

---

### ↳ Lançamento Desktop — 10 de Junho de 2026

*"Battlestar Popnime agora tem uma versão instalável para Windows. A mesma experiência do jogo web, agora como aplicativo nativo — sem abrir o navegador, com atualizações automáticas."*

> ⚠️ **O jogo não possui modo offline.** Login e conexão com a internet são sempre obrigatórios para jogar, em qualquer versão.

#### 🖥️ Instalador Windows

* Baixe e instale como qualquer programa. Atalho criado automaticamente na área de trabalho e no menu iniciar.
* Ao abrir o jogo, ele verifica silenciosamente se há nova versão disponível. Caso haja, baixa em segundo plano e exibe notificação para reiniciar — sem precisar baixar um novo instalador manualmente.
* Os arquivos do jogo são empacotados e protegidos no instalador.
* Conta, leaderboard, trocas, missões de comunidade e save sync funcionam normalmente.

---

### ↳ Internacionalização Completa — 09 de Junho de 2026

*"Finalizamos a cobertura total do sistema de tradução. Todo o texto visível ao jogador agora responde corretamente ao idioma selecionado — seja na tela de login, no meio de uma wave ou nas telas de trocas."*

#### 🌐 Suporte a Inglês (EN)

Todas as seguintes áreas agora estão completamente traduzidas ao selecionar o idioma inglês:

* **HUD de Jogo:** Stats de torres (Dano, Alcance, Velocidade, Tipo), painel de upgrade, botões de vender/maximizar, badge de habilidade pronta, tooltips dos controles de partida (Skip, Pause, Speed), toasts de combate (ouro insuficiente, seleção de slot, upgrade ativado, Last Stand da Tsunade).
* **Seleção de Fase:** Botões de voltar, dificuldades, iniciar batalha, fases bloqueadas/concluídas, contador de fases por mundo.
* **Pré-Batalha:** Hint de remover unidade do time, seção de recompensas possíveis, seção de unidades disponíveis.
* **Pós-Batalha:** Título de recompensas, botões de Tentar Novamente, Mapa e Hub.
* **Gacha:** Título do portal, seções "Com Gemas" e "Com Tickets", resultado da invocação, hint de pity.
* **Inventário:** Título da tela, aba de Evolução, modal de Feed (título, labels de XP e materiais), modal de Evolução (título e botão Evoluir).
* **Interface Online:** Formulários de login e registro, perfil do jogador, tela de servidor offline, erros de autenticação.
* **Leaderboard:** Abas de categorias, mensagem de board vazio, linha de rank pessoal, convite para convidados, títulos de rank.
* **Trocas:** Mensagens de board vazio, status de ofertas, fluxo completo de criação e aceite.
* **Modo Infinito:** Nomes de tiers (Fácil → Além do Limite), toast de recompensa de wave.
* **Missões:** Toast de missão concluída e mensagem de todas as missões feitas.

#### 🔧 Melhorias Técnicas

* Suporte ao atributo `data-i18n-title` para tooltips traduzidos automaticamente.
* **~140 novas chaves de tradução** adicionadas nos arquivos de idioma EN e PT.
* Todas as variáveis dinâmicas nos templates de tradução corrigidas (nomes de personagens, valores de ouro, contagens de wave).

---

### ↳ Segurança, Deploy Público e Missões Em Breve — 09 de Junho de 2026

*"Neste patch de manutenção, focamos em preparar o terreno para os próximos eventos, tornar o jogo acessível ao público e reforçar a integridade competitiva."*

#### 🛠️ Correções de Bugs

* **Missões Diárias:** Corrigido problema crítico no rastreamento de partidas. Jogadores veteranos com a conquista de "Completar Mundo X" não estavam progredindo em missões diárias ao jogar o mesmo mundo novamente.
* **Barra de Prestígio:** A barra de XP de Prestígio agora exibe o valor percentual correto após reiniciar a partida.

#### ✨ Novidades e Melhorias

* **Deploy Público:** O jogo está oficialmente disponível via GitHub Pages para qualquer jogador, sem instalação.
* **Missões "Em Breve":** Nova seção na aba de Comunidade exibindo um carousel dinâmico com as próximas missões globais e eventos sazonais.
* **Segurança e Anti-Cheat:** Reforçadas as camadas de validação para garantir que o Leaderboard seja justo. Jogadores com condições de rede adversas não são penalizados.
* **Identidade Visual de Desenvolvedores:** Contas oficiais de desenvolvimento com identificação visual exclusiva no perfil e no leaderboard.

---

### ↳ Melhorias no Gacha e Áudio — 09 de Junho de 2026

*"Nesta atualização focamos em polir a experiência visual do Gacha e melhorar o comportamento da trilha sonora para uma navegação mais fluida e imersiva."*

#### ✨ Melhorias Visuais

* **Animação do Gacha Reformulada:** A sequência agora exibe estrelas em warp speed, um portal mágico animado se abrindo, um meteoro caindo e uma onda de choque com intensidade proporcional à raridade obtida (3⭐, 4⭐ ou 5⭐).

#### 🛠️ Correções e QoL

* **Áudio do Menu:** Ao navegar entre o Hub, a Seleção de Mundo e o Inventário, a música agora mantém continuidade e volume sem reiniciar do zero.

---

### ↳ Rebalanceamento Global — 09 de Junho de 2026

*"A versão 2.9 é um dos nossos maiores esforços de balanceamento até hoje. Ajustamos a economia para ser mais previsível e recompensadora, e reworkamos personagens que estavam fora da curva de poder."*

#### 💰 Economia e Sistemas de Jogo

* **Padronização de Ouro Inicial:** Ouro base no início de TODAS as partidas ajustado: `200` ⇒ `300`.
* **Recompensa de Abates:** Ouro por eliminação padronizado: `Variável (35–65)` ⇒ `50 Fixo`. Inimigos Elite e Minibosses concedem bônus multiplicador fixo de `×3` (150 ouro).
* **Bônus de Skip Progressivo:** Inicia em `+10 de ouro` na Wave 1 e cresce `+5 por wave pulada`, até teto de `+60` no late game.

#### ⚔️ Personagens: Buffs, Nerfs e Reworks

##### ⬆️ Buffs

* **Naruto Sage (5⭐):** Dano Base `120` ⇒ `150` (+25%) | Dano Máximo `4.500` ⇒ `5.250` | Alcance `20` ⇒ `22`.
* **Nami (4⭐):** Nova Passiva "Tempestade Acumulada" — a cada 8 ataques básicos, atinge todos os inimigos visíveis na tela, reduzindo velocidade em `40%` por `2.5s`.
* **Orihime e Tsunade:** Escalonamento de Cura (Prestígio) `+0.5%` ⇒ `+1.2%`.

##### ⬇️ Nerfs

* **Hawkeye (4⭐):** Cooldown Base `1.2s` ⇒ `1.5s` | Cooldown Máximo `0.4s` ⇒ `0.65s`.
* **Pain (5⭐):** Dano da Explosão reduzido em `10%` em todos os níveis | Raio de Impacto `15` ⇒ `18`.

##### 🔄 Reworks

* **L (Death Note) (4⭐):** Dano Bruto reduzido em `60%`. Nova Passiva Base "Dedução" — a cada abate no alcance de visão de L, gera `+5 de Ouro Extra`. Passiva P5 "Aura Investigativa" — torres aliadas num raio de `15` têm custo de upgrades reduzido em `10%`.

##### ⚙️ Ajustes Menores de QoL

* **Sanji, Byakuya e Sasuke:** Custo do Upgrade 1 e Upgrade 2 reduzido em `15%`.
* **Ichigo Bankai:** Tempo de cast do Getsuga Tensho encurtado em `0.2s`.

---

### ↳ A Era do Online — 09 de Junho de 2026

*"A atualização que conectou todos os jogadores. Com a Era do Online, Battlestar Popnime passou de um jogo local para uma experiência online completa."*

#### 👤 Contas de Jogador

* Jogadores recém-registrados iniciam com **Pacote de Boas-Vindas** contendo `500 Gemas` e as **três unidades 3⭐** do banner ativo no cadastro.
* Sistema de autenticação por username e senha, sem necessidade de e-mail real.

#### 🏆 Leaderboard e Rankings

* Ranking global exibindo os melhores jogadores no Modo Infinito (por wave e por dano) e nas fases normais.
* Cada jogador pode visualizar sua própria posição e porcentagem no ranking.

#### 🔄 Sistema de Trocas

* Jogadores podem publicar ofertas públicas de até `3 unidades` por oferta.
* Ofertas expiram automaticamente após `7 dias` caso não sejam aceitas, devolvendo as unidades ao ofertante.
* É possível especificar unidades desejadas em troca ou aceitar qualquer oferta.

#### 📋 Missões Unificadas

* **Missões Diárias:** `10 missões` sorteadas por dia com reset automático à meia-noite (UTC).
* **Conquistas:** `55` conquistas permanentes cobrindo todos os mundos, kills, dano, gacha, coleção, Modo Infinito e prestígio.
* **Missão de Comunidade:** Meta coletiva online com barra de progresso global em tempo real. Recompensa de personagem 5⭐ aleatório para todos os contribuintes ao completar.

#### ☁️ Save Sync

* O progresso é salvo automaticamente na nuvem a cada partida concluída.

---

## 🟢 Update 2: Invasão Secreta (Evento Marvel)

<p align="center">
  <img src="assets/update2invas%C3%B5essecretas.jpg" alt="Update 2 — Invasão Secreta" width="100%">
</p>

*"A maior atualização de conteúdo até então. O universo Marvel chega ao Battlestar Popnime com um novo mundo temático, novos personagens, um evento narrativo inédito e a fundação do sistema online que moldaria o futuro do jogo."*

### 🗺️ Novos Desafios: Mundo 4 — Nova York

* **Status dos Inimigos:** O HP base e a Velocidade de Movimento das unidades inimigas receberam um multiplicador de `1.3x` comparado aos inimigos do Mundo 3.
* **Nova Mecânica — Armadura de Vanguarda:** Alguns inimigos Elite agora possuem redução inata contra dano físico em `15%`. Priorize tipos de ataque elemental ou mágico para máxima eficiência.

### 👿 Boss Final: Thanos, O Titã Louco

* **Status Base:** `100.000 HP` (Normal) | `350.000 HP` (Lendário)
* **Fase 1 — Armadura Impenetrável:**
  * **Dreno de Vida:** A cada checkpoint crítico avançado no mapa, Thanos drena `2 HP` diretamente da base do jogador.
  * **Habilidade — The Snap:** A cada `20 segundos`, Thanos estala os dedos aplicando Stun Absoluto em todas as torres por `4.0 segundos` completos em um raio massivo de `25`.
* **Fase 2 — Manopla Ativada (ao atingir 50% HP):**
  * Thanos torna-se imune a todos os efeitos de Crowd Control (Slow, Freeze).
  * **Roleta do Infinito:** A cada `10 segundos`, uma das joias do infinito concede um buff aleatório:
    * *Joia do Espaço:* Teletransporte instantâneo avançando `5 metros` no caminho.
    * *Joia do Tempo:* Velocidade de movimento aumentada em `+40%` por `3 segundos`.
    * *Joia da Realidade:* Reflete passivamente `15%` de todo dano recebido em explosão de área ao redor dele.

### 🦸 Novos Personagens (8)

Homem-Aranha · Viúva Negra · Gavião Arqueiro · Pantera Negra · Thor · Hulk · Iron Man Mark 50 · World Breaker Hulk

### 🎭 Evento — Operação: Ressurreição

Quatro capítulos narrativos com modificadores de gameplay únicos e inimigos temáticos exclusivos deste evento.

---

## 🟢 Update 1: Soul Society (Evento Bleach)

### 👿 Boss Final: Aizen & Hogyoku

* **Status Base:** `60.000 HP` (Normal) | `180.000 HP` (Lendário)
* **Fase 1 — Ilusão Perfeita:**
  * Inicia a luta protegido por um Over-Shield com durabilidade de `20.000 HP`.
  * **Kyoka Suigetsu (Passiva):** Toda vez que Aizen sofre um ataque Crítico, possui `30%` de chance de esquivar completamente (Miss) por `3 segundos`.
* **Fase 2 — Transcendência:**
  * O Escudo é quebrado. Aizen entra no estado de fúria final.
  * **Aura de Reatsu:** Drena `1 HP` da base do jogador por segundo passivamente enquanto estiver no campo.
  * **Regeneração Hogyoku:** Cura `2%` da própria vida máxima a cada `5 segundos`. DPS alto e posicionamento preciso são essenciais para superar a regeneração.

### ⭐ Sistema de Prestígio (P1 a P10)

* **Requisito:** Atingir o nível máximo da unidade (Lv50).
* **Escalonamento por Tier:** Cada evolução de Prestígio aumenta permanentemente os atributos base:
  * `+20%` Dano Bruto.
  * `+6%` Alcance Base.
  * Desbloqueio de Passiva Única nos Tiers P1, P5 e P10 — verifique o inventário para os efeitos específicos de cada personagem.

### ♾️ Modo Infinito

* Waves sem fim com escalonamento progressivo dividido em 8 tiers de dificuldade.
* Recompensas de Gemas e Star Experience a cada 5 waves concluídas.
* Star Experience (Nv1–5): materiais exclusivos do Modo Infinito com XP massivo, usáveis no Feed de qualquer personagem.
