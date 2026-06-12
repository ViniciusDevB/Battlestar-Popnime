# Patch Notes Oficiais — Battlestar Popnime

Histórico completo de atualizações, balanceamento, correções e novos sistemas.
Veja o [README](./README.md) para o resumo de cada update.

---

## Update 3.2.1 — Interface e Correções
**Lançado em 12 de Junho de 2026**

_"Um patch de polimento focado em três frentes: o Deck Panel ganha redesign completo com informações ricas de combate, 10 bugs críticos de save e segurança são eliminados, e o sistema de Relíquias evolui com receitas obtidas via gacha."_

---

### ↳ Deck Panel Redesenhado

_"O painel de seleção de unidades durante as partidas foi completamente refeito para transmitir mais informação com menos ruído visual."_

#### Novo Layout

- **Cards horizontais** — ícone (42px) à esquerda, bloco de info à direita em até 3 linhas. Melhor aproveitamento dos 188px de largura do painel.
- **Borda colorida por raridade** — borda esquerda de 3px com a cor da raridade de cada unidade para identificação visual imediata.
- **Badge de prestígio** — overlay `✦N` dourado no canto do ícone quando `prestige > 0`.

#### Mais Informação por Card

- **Pips de upgrade** — quadrados dourados/cinzas indicando o nível de upgrade da torre deployada. Visíveis apenas quando a unidade está em campo.
- **Indicador de habilidade** — badge `⚡ PRONTO` em azul quando a habilidade ativa está disponível; timer `Ns` enquanto recarrega. Usa o mesmo padrão de `|| 0` do resto do codebase.
- **Custo real com desconto** — o custo exibido agora aplica o desconto do Nexus Quartel automaticamente (antes mostrava custo bruto sem desconto).
- **Pill de cópias** — badge `X/Y` colorido: amarelo dentro do limite, vermelho no limite máximo.

#### Estados Visuais Distintos

- **Deploying** — borda superior/direita/inferior verde + glow suave. Borda de raridade mantida na esquerda.
- **Cant-afford** — 45% de opacidade (ouro insuficiente, ainda dentro do limite de cópias).
- **At-limit** — 60% de opacidade + `🚫 Máximo` no lugar do custo. Click mostra toast em vez de tentar deployar.

---

### ↳ Correções de Save e Segurança

_"10 bugs críticos identificados em auditoria profunda do sistema de save, admin e economia — todos corrigidos."_

#### Bugs Corrigidos

- **Prestígio perdido no reload (admin)** — `updateInventory()` era chamado sem `await` em 7 funções de inventário (Prestígio, Feed, Evolução, Combinar, Forjar, Equipar e Desequipar Relíquia). A requisição ao servidor era descartada pelo GC antes de completar. Corrigido com `async/await` em todas as funções.
- **Admin grant repetido a cada reload** — `_grantAdminInventory` rodava em todo carregamento da conta admin, apagando as modificações do desenvolvedor. Agora roda apenas quando `inventario.unidades.length === 0` (conta fresca ou recém-resetada).
- **Nexus admin não persistido no grant** — após o grant inicial, `nexus.blueprints` e `nexus.relicRecipes` não eram enviados ao servidor. Corrigido com chamada direta a `fn_sync_progress` após o grant.
- **Gemas admin não chegando ao servidor** — o grant local de 999.999 gemas era sobrescrito na leitura do servidor no sync seguinte. Corrigido no SQL: `fn_sync_progress` detecta `is_admin` server-side e aplica a economia completa no primeiro acesso.
- **Cristais injetáveis em conta nova** — uma conta nova podia enviar cristais inflados e o servidor aceitava. Corrigido: `cristais` são forçados a `0` para contas não-admin no primeiro acesso.
- **Blueprint revogado via `false`** — o operador `||` do PostgreSQL permitia que um cliente enviasse `{ "forge": false }` e sobrescrevesse um blueprint já desbloqueado. Corrigido com subquery que filtra apenas valores `true` vindos do cliente.
- **`in_trade` não persistia após criar troca** — a flag era marcada apenas em memória local. Se o jogador recarregasse antes do próximo sync, as unidades apareciam desbloqueadas. Corrigido com `await updateInventory()` imediato após `lockUnit()`.
- **`bonusGems` zerado em partidas repetidas** — ao completar uma fase já completada, a tela de resultado mostrava 0 gemas de bônus mesmo havendo bônus por dificuldade/evento. Corrigido.
- **Craft de relíquia sem receita** — era possível forjar relíquias sem ter desbloqueado a receita. Adicionada validação client-side e server-side (`fn_craft_relic` retorna `recipe_not_found`).
- **Borda deploying sobrescrevia raridade** — `border-color !important` no estado deploying apagava a borda esquerda de raridade. Corrigido usando `border-top/right/bottom-color` individualmente.

---

### ↳ Receitas de Relíquias via Gacha

_"Relíquias agora exigem que a receita seja desbloqueada antes de poder ser forjada — mais intenção, menos farm cego."_

- Ao puxar no banner de Relíquias, é possível obter a **Receita** de uma relíquia específica.
- Apenas relíquias com receita desbloqueada aparecem como disponíveis na Forja.
- Validação server-side em `fn_craft_relic` — sem bypass via console.
- Ao tentar construir uma estrutura Nexus já possuída, o jogador recebe **Cristais** como compensação.

---

### ↳ HUD Totalmente Responsivo

_"O HUD de combate agora funciona corretamente em qualquer resolução de tela — de 1024×768 a 4K."_

- Todos os elementos do HUD (barra de status, painel lateral, painel de upgrade, wave preview) se adaptam proporcionalmente à resolução atual.
- Fontes, ícones e painéis usam unidades relativas em vez de valores fixos de pixel.

---

## Update 3.1 — Base de Operações e Relíquias
**Lançado em 11 de Junho de 2026**

_"A meta-progressão chega ao Battlestar Popnime. Construa e melhore sua Base de Operações entre partidas, equipe Relíquias poderosas nas suas unidades e aproveite um sistema de gacha agora 100% server-side."_

---

### ↳ Base de Operações (Nexus)

_"10 estruturas persistentes que moldam sua experiência de jogo a cada partida."_

#### Estruturas Disponíveis

| Estrutura | Efeito | Níveis |
|---|---|---|
| 🏥 Hospital de Campo | +1 vida inicial por nível | 5 |
| 💰 Cofre de Suprimentos | +60 de ouro inicial por nível | 5 |
| 📚 Academia de Heróis | +15% XP de Feed por nível | 3 |
| 🗼 Torre de Vigilância | Nv1: preview de onda · Nv2: +6% alcance · Nv3: +12% alcance + marca Elites | 3 |
| ⚒ Forja de Relíquias | Desbloqueia a Forja. Nv2: -20% custo · Nv3: +5% chance rara | 3 |
| 🏛 Quartel | -8% de custo de deploy de todas as torres por nível | 3 |
| 🔬 Laboratório de Campo | Chefes/Elites têm chance de dropar ingredientes de relíquia (10%/20%/35%) | 3 |
| 🏦 Banco de Guerra | Ouro não gasto entre ondas é mantido parcialmente (15%/25%/40%, máx 500) | 3 |
| ⛩ Templo dos Campeões | +5% de dano global de todas as torres por nível | 4 |
| 📡 Centro de Retransmissão | -15% cooldown de habilidades ativas por nível | 3 |

---

### ↳ Sistema de Relíquias

_"Artefatos lendários de cada mundo, forjados com materiais raros. Cada relíquia tem versão Normal e Corrompida."_

#### Mecânica

- Relíquias são forjadas na Forja de Relíquias (requer Nexus Nv1) com materiais de Chefes e Elites.
- Ao forjar, há chance de corrupção por relíquia (Hōgyoku: 15%). Corrompida = mais poder com desvantagem.
- Cada unidade equipa 1 relíquia. Desequipar devolve ao Relic Stash.
- Relíquias são persistentes — ficam no save e podem ser transferidas entre unidades.

#### Relíquias por Mundo

- **Naruto:** Kunai do 4º Hokage (vel. ataque +20%), Colar da Sannin (escudo absorvente)
- **One Piece:** Chapéu de Palha (aura +15% dano), Yoru — A Noite (dano +25%)
- **Bleach:** Tensa Zangetsu (dano +25%, ignora escudos), Hōgyoku (dano +10% / Corrompida: +60% / -20% alcance)
- **Marvel:** Escudo do Capitão (redução AOE, ricochete), Mjolnir (dano relâmpago +30%, stun)
- **DC:** Manopla do Infinito (dano +15%, buffs rotativos), Anel da Lanterna (aura de recarga), Laço da Verdade (-20% resistência inimiga)

---

### ↳ Rebalanceamento de Prestígio

_"O bônus de prestígio agora diferencia o papel da unidade: dano vira dano, farm vira economia."_

#### Novas Taxas

**Unidades de Dano** (Ichigo, Naruto, Goku…)
- Tier 1–5: `+10% dano` por nível de prestígio
- Tier 6–10: `+2% dano` adicional por nível

**Unidades de Farm / Suporte** (L, Nami, Orihime…)
- `+2% de ouro extra por wave` por nível de prestígio (máx P10 = +20% ouro/wave)

---

### ↳ Gacha Server-Side e Segurança

_"O sistema de gacha agora roda integralmente no servidor. Nenhum dado econômico vem do cliente."_

- **Gacha 100% Server-Side:** `fn_gacha_pull` realiza sorteio, verifica saldo, deduz moeda, atualiza pity e inventário em transação atômica com `FOR UPDATE`. Injeção de gemas via Postman ou console é impossível.
- **Darkseid no Backend:** Easter Egg Darkseid 7★ processado dentro da RPC — persistido atomicamente com o pull.
- **Anti-Exploit de Trocas:** Unidades em oferta ativa recebem flag `in_trade: true` — bloqueadas para Feed, Evolução e Prestígio até cancelamento.
- **`Object.freeze` no Save:** O objeto `Save` exportado é congelado — funções internas não podem ser substituídas via DevTools.
- **INSERT/UPDATE bloqueados no RLS:** Apenas RPCs `SECURITY DEFINER` podem escrever no save.

---

### ↳ Correções de Bugs

- **Missões: perda de gemas em falha de rede** — gemas eram concedidas localmente antes da confirmação do servidor. Em falha, as gemas ficavam mas a missão voltava a pendente (duplo claim). Corrigido: missão só marcada como concluída após confirmação. Em falha, gemas são revertidas.
- **`cancelTrade` não limpava `in_trade`** — chamava `_pushSave` bloqueado pelo RLS. Corrigido para usar `updateInventory()` via RPC segura.
- **Passivas de Área com CPU excessivo** — `slow_aura` e `santen_kesshun` iteravam todos os inimigos a cada frame. Adicionado throttle interno (0.2s e 0.5s).
- **Pool Tier 0 no Infinito** — incluía acidentalmente unidades do tier anterior. Corrigido.

---

## Update 3 — Crise nas Infinitas Terras
**Lançado em Junho de 2026**

_"O maior update de Battlestar Popnime até hoje. Novo mundo DC, 9 personagens, versão desktop, sistema online completo, rebalanceamento global e suporte a inglês."_

---

### ↳ Mundo 5 — DC Universe

- **6 novas fases** sob a invasão de Apokolips, com Darkseid como Boss final de 2 fases.
- **9 novos personagens:** Flash, Batgirl, Aquaman, Batman, Lois Lane, Lanterna Verde, Superman, Shazam e Flash Reverso.
- **Mecânica Viva:** eventos ambientais em tempo real alteram o campo durante as waves.
- **Darkseid 7★ Secreto:** chance de 1 em 2.000.000 no gacha, com reveal épico e passivas únicas.

---

### ↳ Lançamento Desktop

- **Instalador Windows:** o jogo pode ser instalado como aplicativo nativo — sem navegador, com atalho na área de trabalho.
- **Atualizações Automáticas:** novas versões baixadas em segundo plano e aplicadas com um clique ao reiniciar.

---

### ↳ Internacionalização Completa

_"Todo o texto visível do jogo traduzido ao selecionar EN — HUD, menus, toasts, online, leaderboard, trocas e missões."_

- **~140 novas chaves de tradução** nos arquivos EN e PT.
- Suporte ao atributo `data-i18n-title` para tooltips traduzidos automaticamente.
- Cobertura completa: HUD de Jogo, Seleção de Fase, Pré/Pós-Batalha, Gacha, Inventário, Online, Leaderboard, Trocas, Modo Infinito e Missões.

---

### ↳ Sistema Online Completo

#### Contas de Jogador

- Registro por username e senha. Pacote de boas-vindas: `500 Gemas` + 3 unidades 3★ do banner ativo.

#### Leaderboard e Rankings

- Ranking global de Modo Infinito (wave e dano) e fases normais.
- Posição pessoal e porcentagem no ranking exibidas para o jogador.

#### Sistema de Trocas

- Ofertas públicas de até `3 unidades` por oferta.
- Expiração automática em `7 dias`. Possível especificar unidades desejadas em troca.

#### Missões Unificadas

- **Diárias:** 10 missões sorteadas com reset à meia-noite (UTC).
- **Conquistas:** 55 permanentes cobrindo mundos, kills, dano, gacha, coleção, Infinito e prestígio.
- **Comunidade:** meta coletiva global com barra de progresso em tempo real. Recompensa de 5★ para todos os contribuintes.

#### Save Sync

- Progresso salvo automaticamente na nuvem a cada partida concluída.

---

### ↳ Rebalanceamento Global

#### Economia

- **Ouro Inicial:** `200` → `300` em todas as partidas.
- **Ouro por Kill:** variável (35–65) → `50 fixo`. Elites e Minibosses concedem bônus `×3` (150 ouro).
- **Skip Progressivo:** `+10 ouro` na Wave 1, crescendo `+5 por wave pulada`, teto de `+60` no late game.

#### Buffs

- **Naruto Sage (5★):** Dano Base `120` → `150` (+25%) | Alcance `20` → `22`.
- **Nami:** Nova Passiva "Tempestade Acumulada" — a cada 8 ataques, atinge todos os inimigos na tela com slow de 40% por 2.5s.
- **Orihime e Tsunade:** Escalonamento de Cura (Prestígio) `+0.5%` → `+1.2%`.

#### Nerfs

- **Hawkeye (4★):** Cooldown Base `1.2s` → `1.5s` | Cooldown Máximo `0.4s` → `0.65s`.
- **Pain (5★):** Dano da Explosão -10% em todos os níveis | Raio de Impacto `15` → `18`.

#### Reworks

- **L (Death Note) (4★):** Dano bruto -60%. Nova Passiva "Dedução" — +5 ouro extra por abate no alcance de L. Passiva P5 "Aura Investigativa" — custo de upgrades -10% para torres aliadas num raio de 15.

#### Ajustes de QoL

- **Sanji, Byakuya e Sasuke:** Custo do Upgrade 1 e 2 reduzido em 15%.
- **Ichigo Bankai:** Tempo de cast do Getsuga Tensho encurtado em 0.2s.

---

### ↳ Segurança e Anti-Cheat

- **Deploy Público** via GitHub Pages.
- **Anti-Cheat e Banimento Automático** — múltiplas camadas de proteção para integridade do leaderboard.
- **Sistema de Admin** — identificação visual exclusiva para contas de desenvolvedores.

---

### ↳ Gacha e Áudio

- **Animação Épica no Gacha:** portal mágico, warp speed, meteoro e onda de choque com intensidade proporcional à raridade.
- **Áudio Contínuo:** música do menu sem reinício entre transições de tela.

---

## Update 2 — Invasão Secreta
**Lançado**

_"A maior atualização de conteúdo até então. O universo Marvel chega ao Battlestar Popnime com um novo mundo, 8 personagens, evento narrativo e a fundação do sistema online."_

---

### ↳ Mundo 4 — Nova York

- HP base e Velocidade dos inimigos com multiplicador `×1.3` comparado ao Mundo 3.
- **Nova Mecânica — Armadura de Vanguarda:** alguns Elites têm redução de 15% contra dano físico.

### ↳ Boss Final — Thanos, O Titã Louco

**Status:** `100.000 HP` (Normal) | `350.000 HP` (Lendário)

**Fase 1 — Armadura Impenetrável:**
- **Dreno de Vida:** a cada checkpoint, drena `2 HP` da base do jogador.
- **The Snap:** a cada `20s`, Stun Absoluto em todas as torres por `4.0s` num raio de 25.

**Fase 2 — Manopla Ativada** (50% HP):
- Imune a Slow e Freeze.
- **Roleta do Infinito** a cada `10s`: Teletransporte (`+5m` no caminho), Aceleração (+40% vel. por 3s) ou Reflexo (reflete 15% do dano recebido em AOE).

### ↳ Novos Personagens (8)

Homem-Aranha · Viúva Negra · Gavião Arqueiro · Pantera Negra · Thor · Hulk · Iron Man Mark 50 · World Breaker Hulk

### ↳ Evento — Operação: Ressurreição

4 capítulos narrativos com modificadores de gameplay únicos e inimigos temáticos exclusivos.

---

## Update 1 — Soul Society
**Lançado**

_"O Mundo Bleach chega ao Battlestar Popnime junto com dois dos sistemas mais impactantes da progressão: Prestígio e Modo Infinito."_

---

### ↳ Mundo 3 — Soul Society

- 6 novas fases com Aizen & Hōgyoku como Boss final de 2 fases.
- 10 novos personagens do universo Bleach.

### ↳ Boss Final — Aizen & Hōgyoku

**Status:** `60.000 HP` (Normal) | `180.000 HP` (Lendário)

**Fase 1 — Ilusão Perfeita:**
- Over-Shield com `20.000 HP`.
- **Kyoka Suigetsu (Passiva):** 30% de chance de esquivar ataques Críticos por 3s.

**Fase 2 — Transcendência:**
- **Aura de Reatsu:** drena `1 HP` da base por segundo passivamente.
- **Regeneração Hōgyoku:** cura `2%` da vida máxima a cada `5s`.

### ↳ Sistema de Prestígio (P1 a P10)

- **Requisito:** Lv50 (nível máximo da unidade).
- `+20%` Dano Bruto e `+6%` Alcance Base por tier de prestígio.
- Passivas exclusivas desbloqueadas nos tiers P1, P5 e P10.

### ↳ Modo Infinito

- Waves sem fim com 8 tiers de dificuldade progressiva.
- Recompensas de Gemas e Star Experience a cada 5 waves.
- **Star Experience (Nv1–5):** materiais exclusivos com XP massivo para qualquer personagem.

---

## Updates Anteriores

### 0.6 — Evento: A Anomalia de Konoha

Primeiro evento do jogo. Modo narrativo com modificadores únicos e farm de personagens exclusivos.

### 0.5 — Grand Line (One Piece)

Mundo 2 completo com 6 fases, inimigos e personagens de One Piece.

### 0 — Lançamento Base

- Mundo 1 (Naruto) com 6 fases e inimigos do universo ninja.
- Sistema de Gacha com pity, sistema de Feed e missões.
- Fundação da arquitetura modular do jogo.
