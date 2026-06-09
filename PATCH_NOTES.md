# 📝 Patch Notes Oficiais (Histórico de Atualizações)

Bem-vindos ao portal de atualizações de **Battlestar Popnime**. Aqui você encontrará todas as informações detalhadas sobre mudanças de balanceamento, ajustes sistêmicos, correções de bugs e novos conteúdos. Nosso objetivo é manter total transparência com a comunidade sobre os números e os motivos por trás de cada mudança.

---

## 🟢 Atualização 2.9.10: Internacionalização Completa

**Data de Lançamento:** 09 de Junho de 2026

*"Nesta atualização finalizamos a cobertura total do sistema de internacionalização (i18n). Todo o texto visível ao jogador — de toasts de combate a formulários de conta — agora responde corretamente ao idioma selecionado."*

### 🌐 Internacionalização (i18n)

#### Arquivos de idioma (`en.js` / `pt.js`)
* Adicionadas **~140 novas chaves de tradução** cobrindo todas as áreas que ainda estavam com texto em português fixo.
* Chaves organizadas por domínio: `online_*`, `trade_*`, `lb_*`, `hud_*`, `feed_*`, `evo_*`, `warn_*`, `passive_*`, `tower_*`, `result_*`, entre outras.

#### Motor i18n (`i18n.js`)
* Suporte a `data-i18n-title` em `translateDOM()` — tooltips de botões agora também são traduzidos automaticamente.

#### Interface Online (`ui-online.js`)
* Perfil de jogador: seções de Estatísticas, Modo Infinito, "Membro desde", badges de rank e avisos de integridade.
* Formulários de Login e Registro: labels, hints de campo, abas de navegação e botões de envio.
* `LoginScreen` dedicado: abas, tela de servidor offline, spinner de carregamento de sessão, validações client-side e toast de boas-vindas.
* Ambas as funções `_translateError()` (OnlineUI e LoginScreen) unificadas em chaves `err_*`.
* Botões Sync e Sair da Conta.

#### Sistema de Trocas (`ui-trades.js`)
* Mensagens de board vazio e sem ofertas próprias.
* Mapa de status: Aberta / Concluída / Cancelada / Expirada.
* Hints de seleção, seções do formulário de criação (oferta, pedido, mensagem).
* Fluxo de aceite: confirmação gratuita e picker de unidades.
* Tela de conclusão de troca e toast de cancelamento.

#### Leaderboard (`ui-leaderboard.js`)
* Abas Dano e Fases; mensagem de board vazio; linha de rank próprio; convite de login para convidados; rank "Acadêmico".

#### HUD e Gameplay (`game-hud.js`, `game-towers.js`, `game.js`)
* Tooltip dinâmico do botão Skip com valor de ouro da wave.
* Toast de upgrade de torre ativado.
* Toast do Last Stand da Tsunade com contagem de vidas restauradas.

#### `index.html`
* Botões "← Voltar" nas telas de seleção de fase e pré-batalha.
* Hint "clique para remover" no painel de time.
* Tela de pós-batalha: título de recompensas e botões Tentar Novamente / Mapa / Hub.
* Seções "Com Gemas" e "Com Tickets" no gacha.
* Modal de Feed: título, label de XP, materiais disponíveis, selecionados e botão confirmar.
* Modal de Evolução: título e botão Evoluir.
* Tooltips dos botões de controle do HUD (Skip, Pause, Speed).

---

## 🟢 Atualização 2.5.10: Melhorias no Gacha e Áudio

**Data de Lançamento:** 09 de Junho de 2026

*“Nesta atualização focamos em polir a experiência visual do Gacha e melhorar o comportamento da música de fundo para uma navegação mais agradável.”*

### ✨ Melhorias Visuais e de UI
* **Animação do Gacha:** O sistema de invocações (Pulls) recebeu uma repaginada visual épica. Agora, a tela exibe estrelas em velocidade de dobra (warp speed), um portal mágico animado se abre, um meteoro cai em direção ao portal e cria um feixe de luz acompanhado de uma onda de choque explosiva, tudo baseado na raridade (3⭐, 4⭐ ou 5⭐) da unidade obtida.

### 🛠️ Correções de Bugs e Qualidade de Vida (QoL)
* **Áudio do Menu:** Ajustado o comportamento da música de fundo (BGM). Agora, ao navegar entre o Hub, a Seleção de Mundo e o Inventário, a música não reinicia mais seu volume do zero, garantindo uma transição contínua e muito mais imersiva.

## 🟢 Atualização 2.9.5: O Futuro das Missões e Segurança

**Data de Lançamento:** 09 de Junho de 2026

*“Neste pequeno patch de manutenção, focamos em preparar o terreno para os próximos eventos e reforçar a segurança do jogo.”*

### 🛠️ Correções de Bugs
* **Missões Diárias:** Corrigido um problema crítico no rastreamento de partidas. Jogadores veteranos que já possuíam a conquista de "Completar Mundo X" não estavam progredindo em missões diárias ao jogar o mesmo mundo.
* **UI:** A barra de XP de Prestígio agora reflete o valor correto em porcentagem exata após reiniciar a partida (anteriormente mostrava 0 visualmente devido a um erro de sincronia local).

### ✨ Novidades e Melhorias Sistêmicas
* **Missões "Em Breve":** Adicionada uma nova seção na aba de Comunidade exibindo um carousel dinâmico (atualizado a cada 12h) com as próximas missões globais e eventos sazonais.
* **Segurança e Anti-Cheat:** Refinamos a validação de dano no lado do cliente para prevenir explorações e ferramentas de terceiros durante o Modo Infinito. Isso garante que o Leaderboard seja justo e preciso. *(Nota: as tolerâncias de latência foram ajustadas em 150ms para não punir injustamente jogadores com ping alto)*.
* **Identidade Visual:** Desenvolvedores e Moderadores oficiais agora possuem Nomes Dourados Animados e tags `[DEV]` ou `[MOD]` exclusivas no chat global e leaderboard.

---

## 🟢 Atualização 2.9: A Grande Revisão de Balanceamento

*“A versão 2.9 é um dos nossos maiores esforços de balanceamento até hoje. Sentimos que o "early game" estava punitivo demais para iniciantes, enquanto o "late game" era trivializado por personagens de suporte específicos. Ajustamos a economia para ser mais previsível e recompensadora.”*

### 💰 Economia e Sistemas de Jogo

* **Padronização de Ouro Inicial:**
  * Ouro base no início de TODAS as partidas ajustado: `200` ⇒ `300`.
  * *Comentário dos Devs:* Isso permite que os jogadores posicionem pelo menos uma unidade 4⭐ ou duas 3⭐ imediatamente, reduzindo a frustração extrema na Wave 1.
* **Recompensa de Abates (Bounties):**
  * Ouro por eliminação padronizado: `Variável (35 a 65)` ⇒ `50 Fixo` para inimigos comuns.
  * Inimigos Elite e Minibosses agora concedem um bônus multiplicador fixo de `x3` (150 ouro).
* **Bônus de Skip (Avanço Rápido de Wave):**
  * Mecânica anterior: +25 Ouro fixo por skip.
  * Nova Mecânica Progressiva: Inicia concedendo `+10 de ouro` na Wave 1. O valor ganha um incremento de `+5 de ouro` a cada nova wave pulada, acumulando até um teto máximo de `+60 de ouro` por skip no late game.

### ⚔️ Personagens: Buffs, Nerfs e Reworks

#### ⬆️ Buffs (Melhorias)
* **Naruto Sage (5⭐)**
  * *Comentário dos Devs:* Naruto estava caindo de rendimento contra chefes com muita armadura devido ao seu dano base defasado em comparação a outros lendários.
  * **Dano Base:** `120` ⇒ `150` (+25%)
  * **Dano (Nível Máximo 100):** `4.500` ⇒ `5.250`
  * **Alcance:** `20` ⇒ `22`
* **Nami (4⭐)**
  * **Nova Passiva - "Tempestade Acumulada":** A cada 8 ataques básicos, o próximo ataque atinge todos os inimigos visíveis na tela, reduzindo a velocidade de movimento deles em `40%` por `2.5 segundos`.
* **Orihime e Tsunade (Suportes)**
  * **Escalonamento de Cura (Prestígio):** O ganho de regeneração da base (HP) por nível de prestígio aumentou de `+0.5%` ⇒ `+1.2%`.

#### ⬇️ Nerfs (Enfraquecimentos)
* **Hawkeye (4⭐)**
  * *Comentário dos Devs:* Hawkeye estava superando unidades 5⭐ nativas graças à sua velocidade de ataque insana ao atingir o nível máximo de upgrades.
  * **Cooldown (Tempo de Ataque) Base:** `1.2s` ⇒ `1.5s`
  * **Cooldown (Nível Máximo):** `0.4s` ⇒ `0.65s`
* **Pain (5⭐)**
  * **Dano da Explosão (Shinra Tensei):** Reduzido em `10%` em todos os níveis.
  * **Raio de Impacto (Área):** Aumentado de `15` ⇒ `18`.
  * *Comentário dos Devs:* A intenção com Pain é ser o melhor controlador e limpador de hordas (AOE), não um "matador de chefes". Aumentamos o seu alcance efetivo em área, mas cortamos um pouco do dano burst.

#### 🔄 Reworks (Reformulação)
* **L (Death Note) (4⭐)**
  * *Comentário dos Devs:* Transformamos totalmente o kit de habilidades do 'L' para convertê-lo na nossa principal unidade focada em Farm Econômico.
  * **Dano Bruto:** Reduzido em `60%`.
  * **Nova Passiva Base - "Dedução":** A cada abate ocorrido no alcance de visão de L, ele gera `+5 de Ouro Extra` direto para o banco do jogador.
  * **Passiva de Prestígio 5 - "Aura Investigativa":** Torres aliadas posicionadas dentro de um raio de `15` têm seu custo de todos os upgrades reduzidos de forma passiva em `10%`.

#### ⚙️ Ajustes Menores de Qualidade de Vida (QoL)
* **Sanji, Byakuya e Sasuke:** Custo do Upgrade 1 e Upgrade 2 reduzido em `15%` de forma geral.
* **Ichigo Bankai:** Tempo de "cast" da animação do Getsuga Tensho encurtado em `0.2s` (o dano aplica mais rápido ao inimigo entrar no raio).

---

## 🟢 Atualização 2.5: A Era do Online

### ✨ Funcionalidades Globais
* **Contas de Jogador:** Jogadores recém-registrados agora iniciam com um pacote de Boas-Vindas contendo **500 Gemas** e as **três unidades 3⭐** do banner atual para garantir um bom início.
* **Mercado de Trocas Seguras:** Introduzido sistema de "Trade".
  * Limite rigoroso de `3 unidades` enviadas por oferta.
  * Expiração automática e devolução após `168 horas` (7 dias) se não houver resposta.
  * Implementação de uma taxa de transação de `10 Gemas` por troca completada para combater a criação de múltiplas contas (farming bots).
* **Sistema de Conquistas (Achievements):**
  * Tracker para `55` conquistas permanentes divididas por tiers de progressão e maestria de mundo.
  * Adição de 10 Missões Diárias randomizadas com resets globais todos os dias às `00:00 UTC`.

---

## 🟢 Atualização 2: Invasão Secreta (Evento Marvel)

### 🗺️ Novos Desafios: Mundo 4 (Nova York)
* **Status dos Inimigos:** O HP base e a Velocidade de Movimento das unidades inimigas receberam um multiplicador de `1.3x` comparado aos inimigos do Mundo 3.
* **Nova Mecânica - Armadura de Vanguarda:** Alguns elites agora possuem redução inata contra dano físico em `15%` (priorizem tipos de ataque elemental/mágico).

### 👿 Boss Final: Thanos, O Titã Louco
* **Status Base:** `100.000 HP` (Dificuldade Normal) | `350.000 HP` (Dificuldade Lendária)
* **Fase 1 (Armadura Impenetrável):** 
  * **Dreno Extremo:** A cada avanço em checkpoints críticos do mapa, Thanos drena `2 HP` direto da vida da base do jogador.
  * **Habilidade - The Snap:** A cada `20 segundos`, Thanos estala os dedos aplicando um efeito de Stun Absoluto (torres param de atacar e habilidades são pausadas) por `4.0 segundos` completos, em um raio massivo de `25`.
* **Fase 2 (Manopla Ativada - Ao atingir 50% HP):**
  * Entra no estado de imunidade total a efeitos de Crowd Control como "Slow" (Lentidão) ou "Freeze" (Congelamento).
  * **Roleta do Infinito:** A cada `10 segundos`, uma das joias ativa um buff massivo para o Boss:
    * *Espaço:* Salto de teletransporte instantâneo avançando no caminho em `5 metros`.
    * *Tempo:* Acelera o próprio movimento em `+40%` durante `3 segundos`.
    * *Realidade:* Reflete passivamente `15%` de todo dano recebido em uma explosão de área ao redor dele.

---

## 🟢 Atualização 1: Soul Society (Evento Bleach)

### 👿 Boss Final: Aizen & Hogyoku
* **Status Base:** `60.000 HP` (Dificuldade Normal) | `180.000 HP` (Dificuldade Lendária)
* **Fase 1 (Ilusão Perfeita):**
  * Inicia a luta protegido por um "Over-Shield" com durabilidade equivalente a `20.000 HP`.
  * **Kyoka Suigetsu (Passiva):** Toda vez que Aizen for alvo de um ataque Crítico, ele possui `30%` de chance de aplicar "Miss" (esquivar completamente da habilidade e anular seu dano) por `3 segundos`.
* **Fase 2 (Transcendência):**
  * O Escudo é quebrado. Aizen entra no estado de fúria final.
  * **Aura de Reatsu:** Exerce pressão espiritual constante, drenando `1 HP` da base do jogador a cada segundo passivamente enquanto ele estiver no campo.
  * **Regeneração Hogyoku:** Começa a curar `2%` da sua própria vida máxima a cada `5 segundos`. Um bom posicionamento de unidades com DPS (Dano por Segundo) alto é crucial para impedir a cura.

### ⭐ Sistema de Prestígio (P1 a P10)
* O sistema end-game foi desbloqueado para os veteranos!
* **Requisitos:** Nível Máximo de Conta (Lv 50) e sacrifício de 3 Cópias Base de raridade equivalente para transcender.
* **Escalonamento por Tier:** Cada evolução de Prestígio aumenta os Atributos Base da unidade permanentemente:
  * `+20.0%` Dano Bruto.
  * `+6.0%` Alcance Base (Range).
  * `Desbloqueio de Passiva Única` nos Tiers P1, P5 e P10 (verifique o inventário para os efeitos específicos).
