# Guia de Balanceamento — Battlestar Popnime
### Versão: Update 3 (pós-rebalanceamento c3b5bda) | Fusão: balance_guide.md + análise qualitativa | 10/06/2026

> Documento vivo: atualize após cada update que adicione unidades, inimigos ou mundos.
> DPS Base = damage ÷ cooldown (attack_speed tratado como segundos por ataque).
> Execute `node analyze_balance.js` após novos updates para regenerar tabela de eficiência.

---

## 1. Princípios de Design (Regras Não Negociáveis)

### 1.1 Acessibilidade de Conteúdo

- **Nenhum estágio exige uma unidade específica.** Qualquer fase deve ser clearável com uma equipe razoável da raridade esperada para o mundo, sem prestige e sem composição metaforçada.
- **Margem de segurança mínima (P0, equipe de 4):** DPS disponível ≥ 1.0× DPS exigido pelo boss. Alvo confortável: ≥ 1.5×.
- **Prestige é bônus, não requisito.** Jogadores que nunca prestigiaram devem conseguir clear do último mundo disponível.

### 1.2 Progressão de Raridade

- **Unidades de raridade maior sempre superam** o DPS bruto de raridades menores. Um 6⭐ deve ser visivelmente mais forte que um 4⭐.
- **Novas unidades são marginalmente mais fortes** que as existentes da mesma raridade — dentro do envelope de design (seção 5), não fora dele.
- **Evolução tem custo oculto** (materiais de gacha). O DPS pós-evolução deve justificar isso vs simplesmente gachar um tier acima.

### 1.3 Economia

- **Farm não é requisito.** O jogador deve conseguir clear sem farm se construir a equipe de combate corretamente. Farm é acelerador.
- **Novos mundos calibram ouro ao custo de deploy** das unidades necessárias. Se o deploy médio subiu 3×, o ouro por wave ou kill deve escalar proporcionalmente.
- **Bosses entregam o mesmo ouro que capangas** (50 fixo). Próximo update: adicionar `boss_gold_bonus = floor(hp / 1000)` com teto 500.

### 1.4 Red Flags (Nunca Faça)

- ❌ Boss com HP/speed que resulta em margem < 1.0× com equipe P0 da raridade esperada
- ❌ Unidade de raridade menor mais eficiente (ouro/DPS) que todas as de raridade 2+ acima
- ❌ Unidade 6⭐ com ouro/DPS pior que a média dos 5⭐
- ❌ Unit event-exclusive com deploy > 2× a média da raridade sem DPS proporcional
- ❌ Balancear conteúdo assumindo que o jogador terá P5+ em múltiplas unidades

---

## 2. Classificação de Passivas

Toda passiva do jogo pertence a uma categoria. Isso define o papel do personagem independente do DPS.

| Tipo | O que faz | Exemplos |
|------|-----------|---------|
| **Amplificador** | Aumenta dano de OUTRAS torres (aura, marca) | Gojo (+25%), Ichigo Bankai (1.55×), Black Widow (+25%), Batman (+22%) |
| **CC Ativo** | Controla inimigos (freeze, paralisia, slow, stun) | Rukia, Killua, Thor (P1), Toshiro, Flash Barry, Aquaman |
| **Multi-alvo** | Distribui dano para vários inimigos ao mesmo tempo | Thor (chain ×3), BP (ricochet ×2), Hawkeye (AOE/pierce), Byakuya (scatter) |
| **Escalonamento** | Cresce com kills ou tempo de wave | Kenpachi, Levi, Hulk, WBH, Naruto Sage (clones) |
| **Burst Periódico** | Concentra dano alto em intervalos fixos | Iron Man (unibeam), Barba Branca (tsunami), Toshiro (pulso /5s) |
| **Reativo** | Responde a condições específicas | Tanjiro (2× vs queimados), Chad (boss slayer), Hawkeye (×3 perfurante) |
| **Conversor** | Muda estado do inimigo para outros explorarem | Black Widow (cross_mark), Killer Bee (tinta +55%), Orihime (P10 debuff) |
| **Farm** | Gera gold por wave ou kill | L, Lois Lane |
| **Suporte** | Utilitário não-dano (anti-stun, restaura vidas, drain) | Orihime (stun-immune), Tsunade (anti-drain + vidas) |

> **Regra prática:** Passivas de Amplificador ou CC permitem DPS individual menor — a passiva multiplica o output do time inteiro. Documente o multiplicador real ao adicionar Auras novas.

---

## 3. Todos os Personagens — DPS e Valor Efetivo

> **DPS Base** = damage ÷ attack_speed (sem upgrades, sem passivas proc).
> **Tier Efetivo** considera DPS + passiva + versatilidade + impacto em equipe.
> Escala: `SS` → `S` → `A+` → `A` → `B+` → `B` → `C`.
> Evento exclusivos marcados com *(Ev)*. Evoluções marcadas com 🔁.

### 3.1 — 3★

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| Hawkeye | Marvel | 179 | Multi-alvo + CC + Burst + Reativo | **S** | Cicla Normal ×1.8 / AOE / Gelo 3s / Pierce ×3 — o 3★ mais versátil do jogo |
| Chad Yasutora | Bleach | 354 | Reativo (boss slayer 2.2×) | **A+** | DPS bruto mais alto dos 3★; vs boss = 780 DPS efetivo |
| Flash Barry | DC | 237 | CC Ativo (speed force burst) | **A+** | DPS mais alto dos 3★ pós-rebalance; burst de velocidade |
| Orihime Inoue | Bleach | 125 | Suporte (stun-immune aura contínua) | **A+** | Nega Itachi, Gin, Mantis e DeSaad passivamente; P5 +20% aliadas |
| Sasuke Uchiha | Naruto | 191 | Burst (crit 18%) + Reativo (burn) | **A** | DPS mais alto dos 3★ U0; burn abre sinergia com Tanjiro |
| Batgirl | DC | 178 | Burst (crit 20%/2.2×) | **A** | Sólida e barata; boa relação deploy/output |
| Black Widow | Marvel | 75 | Conversor (cross_mark +25%) | **A** | Kills marcam inimigos próximos (+25% de TODOS por 6s); multiplicador constante em horda |
| Spider-Man | Marvel | 91 | CC Ativo (web zone slow 60%) | **A** | Cada acerto cria zona slow 60% no chão; controla corredores inteiros |
| Renji Abarai | Bleach | 156 | Burst (stack burst ×4.5 a cada 5 hits) | **B+** | Excelente em boss; fraco contra inimigos que morrem rápido |
| Zoro (East Blue) | One Piece | 214 | Burst (crit 15%) + cone | **B+** | Bom DPS para 3★ U1; cone cobre área |
| Usopp | One Piece | 159 | Multi-alvo (pierce) + CC (stun 10%) | **B+** | Alcance extremo (200px); excelente em corredor |
| Nami | One Piece | 127 | CC Ativo (storm global slow /8 ataques) | **B+** | Storm 40% desacelera TODO o mapa a cada ~5s |
| Luffy (East Blue) | One Piece | 240 efetivo | Multi-alvo (double hit garantido) | **B+** | Double hit sempre = 240 DPS efetivo; deploy baixíssimo (120 gold) |
| Rukia Kuchiki | Bleach | 100 | CC Ativo (freeze 28%/2s) | **B+** | Freeze frequente; sinergia com Toshiro |
| Goku Base | DB | 146 | Burst (crit 20%/2.5×) | **B+** | Bom combo com Tanjiro (vs queimados); P10 Genkidama 5× |
| Tanjiro Kamado | KnY | 106 | Reativo (2× vs queimados) | **B+** | Em combo com Ace/Sanji/Meliodas: 212 DPS efetivo |
| Ichigo Base | Bleach | 97 | Escalonamento (bleed) | **B+** | Bleed acumula em boss/miniboss ao longo da luta |
| Uryu Ishida | Bleach | 105 | Multi-alvo (pierce 3) | **B** | Nicho de corredor longo; fora disso é fraco |
| Aquaman | DC | 123 | CC Ativo (tide zone slow área) | **B** | Similar a Spider-Man; deploy maior para output equivalente |
| Demolidor | Marvel | 79 | CC Ativo (slow aura 30% passivo) | **B** | Slow constante é útil; DPS muito baixo para o slot |
| Killua Zoldyck | HxH | 54 | Multi-alvo (chain ×2) | **B** | DPS bruto baixo; útil até W2; outclassed por Thor em W3+ |
| Brook | One Piece | 72 | Burst (echo strike 40%) | **B** | Echo aleatório = output inconsistente; nicho para builds específicas |

### 3.2 — 4★

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| Kenpachi Zaraki | Bleach | 679 | Escalonamento (berserker +4%/kill, máx 100 stacks) | **S** | Com 100 kills = +400% → ~3.400 DPS; maior potencial de dano do tier no Infinito |
| Lois Lane | DC | — | Farm (wave_gold superior) | **A+** | Melhor farm do jogo; ~830 gold/wave maxada; essencial W4+ |
| Ace | One Piece | 468 | Multi-alvo (cone) + Reativo (burn 60 DPS) | **A+** | Maior DPS em cone do tier 4★; burn 60 DPS abre sinergias |
| Thor | Marvel | 303 | Multi-alvo (chain ×3) + CC (P1: paralisia 1.5s) | **A+** | Chain em 3 = 666 DPS efetivo em grupo; P10 aura +30% equipe |
| Byakuya Kuchiki | Bleach | 311 | Multi-alvo (scatter) + Burst (kill splash 1.3×) | **A+** | Scatter cobre toda a área; kills explodem; campeão de horda |
| Batman | DC | 237 | Amplificador (detective_mark +22% aliadas) | **A+** | Multiplicador de time sempre ativo |
| Naruto (Shippuden) | Naruto | 204 | Escalonamento (kill CDR 80%) + AOE cone | **A+** | Cone AOE + cada kill = próximo ataque quase imediato; massacrador de horda |
| Black Panther | Marvel | 244 | Multi-alvo (ricochet ×2/55%) | **A** | Cada ataque ricocheta 2× → 512 DPS efetivo vs grupos |
| Hulk Base | Marvel | 367 | Escalonamento (rage +5%/inimigo, máx 50%) | **A** | Com 10 inimigos → +50% = 550 DPS; evolui para WBH |
| Toshiro Hitsugaya | Bleach | 296 | Burst Periódico (pulso /5s área) + CC (cone freeze) | **A** | Pulso cobre toda a área independente do alvo |
| Levi Ackerman | SnK | 134 | Escalonamento (kill streak +20%/stack, máx 15) | **A** | Com 15 stacks = +300% → 536 DPS; sustenta stacks fácil em horda |
| Robin | One Piece | 269 | CC Ativo (paralisia 20%/1s) + cone final | **B+** | Paralisia frequente; outclassed por Thor em versatilidade |
| Sanji | One Piece | 171 | Reativo (burn 30 DPS constante) | **B+** | Burn abre sinergia com Tanjiro; P10 Hell Memories 5× |
| Meliodas | 7DS | 164 | Reativo (dual DoT burn+bleed simultâneos) | **B+** | Dual DoT abre sinergias duplas; P10 Revenge Counter 5.5× |
| Lanterna Verde | DC | 195 | Suporte (construct_barrier) | **B+** | Barreira absorve dano em fases específicas; nicho mas insubstituível lá |

### 3.3 — 5★ e Evoluções

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| 🔁 Ichigo (Vizard) | Bleach | 2.722 | Burst + Amplificador + Escalonamento (Máscara Eterna) | **SS** | Após 66 ataques: 20s de 2× tudo + Rei dos Dois Mundos +20% aliados Bleach |
| Ichigo (Bankai) | Bleach | 1.524 | Amplificador (bankai_pressure 1.55×) | **S** | Auto-suficiente E amplificador; melhor gacha 5★ do jogo |
| Gojo Satoru | JJK | 388 | Amplificador (aura +25%) + CC Ativo (stun 4s ativo) | **S** | Full AOE + aura +25% torres + Domínio Expandido; meta-definer U0 |
| 🔁 Flash Reverso | DC | 1.084 | CC Ativo (paralisia stack ×5 = lock) | **S** | Paralisia em 5 stacks = boss travado indefinidamente |
| 🔁 WBH (Hulk) | Marvel | 698 | Escalonamento + Burst (gamma_burst cascata) | **S** | Em horda: 1 kill deflagra cadeia de explosões; P10 slow aura 50% |
| Barba Branca | One Piece | 959 | Burst Periódico (tsunami bloqueador /15s) | **A+** | DPS de linha altíssimo + tsunami cria barreira HP 32k |
| Shazam | DC | 965 pós-transf. | Escalonamento (ramp-up 6 ataques) | **A+** | Peak DPS mais alto dos gacha 5★ de U3; ramp-up é a troca |
| Superman | DC | 703 | Amplificador (aura +15% global) + Burst (heat vision) | **A+** | DPS sólido + aura equipe + boss killer |
| Iron Man Mk50 | Marvel | 515 | Burst Periódico (unibeam 8× /5.3s) | **A** | 2.720 dano em linha a cada 5.3s; especialista em boss e corredor |
| 🔁 Luffy (Gear 4) | One Piece | 581 | CC Ativo (haki silencia buff /30%) | **A** | P10 Gear 5 (7× a cada 3 ataques) é absurdo com prestige completo |
| 🔁 Zoro (Ashura) | One Piece | 803 | Burst (Ashura: 3 ataques + pausa 3) | **A** | Alta rajada em linha; pausa de 3 ataques é a única fraqueza |
| 🔁 Naruto (Sage) | Naruto | 199 | Escalonamento (clone army, máx 5) | **A** | Clone army = DPS multiplicado; pressão multi-ponto |

### 3.4 — 6★ Evolução

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| 🔁 Ichigo (Vizard) | Bleach | 2.722 | Burst + Amplificador + Escalonamento | **SS** | Ver seção 3.3 — listado aqui por completude |

### 3.5 — 7★ Secreto

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| Darkseid | DC | 313 | Burst (omega) + Reativo (15% HP real) | **SS** | Mecânica única; gacha 0.000005%; inelegível para comparação direta |

### 3.6 — Unidades de Evento

| Nome | Série | DPS Base | Tipo Passiva | Tier | Observação |
|------|-------|----------|-------------|------|-----------|
| Tsunade *(Ev)* | Naruto | 706 | Suporte (anti-drain + restaura vida) | **SS** | 706 DPS + única fonte de recuperação de vida do jogo |
| Killer Bee *(Ev)* | Naruto | 478 | Conversor (tinta +55% todas as fontes /5s) | **SS** | O maior amplificador de equipe do jogo; combo com Bankai = devastador |
| Pain *(Ev)* | Naruto | 406 | CC Ativo (puxa /4 ataques) + Reativo (bypass imunidades) | **S** | Bypass de TODAS as imunidades; essencial em W5 |
| Orochimaru *(Ev)* | Naruto | 323 | Reativo (DoT) + Farm (reembolso 100% gold) | **A** | Único personagem que retorna 100% do gold investido |

### 3.7 — Farm

| Nome | Série | Raridade | Gold/Wave Máx | Tier | Observação |
|------|-------|----------|--------------|------|-----------|
| Lois Lane | DC | 4★ | ~830 + kill gold | **A+** | Melhor farm; essencial W4+ |
| L (Death Note) | DN | 3★ | ~500 + kill gold | **C** | Relevante W1–W3; obsoleto após Lois Lane |

---

## 4. Análise de Balanceamento

### 4.1 O "gap" U1 > U2 em DPS é design intencional

A análise bruta mostra U1 superior em DPS, mas U2 foi desenhado como um sistema de sinergia:

| Tier | U1 pico DPS | U2 pico DPS | Relação | Por que é aceitável |
|------|------------|------------|---------|---------------------|
| 3★ | 354 (Chad) | 179 (Hawkeye) | 1.97× | Hawkeye entrega CC + AOE + burst em 1 slot; Chad é só dano |
| 4★ | 679 (Kenpachi) | 468 (Hulk) | 1.45× | Hulk + ricochet BP + chain Thor = DPS efetivo em grupo maior |
| 5★ | 1.524 (Ichigo Bankai) | 698 (WBH) | 2.18× | WBH + cascata de kills em horda supera Bankai em onda de 20+ |

**U2 como sistema:** Spider-Man (web zones) + Black Widow (cross_mark) + Hawkeye (ciclo) + Thor (chain + paralisia) + Hulk (rage) → em horda, o DPS efetivo do conjunto é 3–5× maior que a soma dos números brutos. Nenhum U1 individualmente supera esse combo em multi-target.

**O que de fato está desequilibrado:** Ichigo Bankai (1.524 DPS + aura 1.55×) é auto-suficiente E amplificador ao mesmo tempo. Nenhum personagem de U2/U3 tem esse perfil combinado.

### 4.2 Hawkeye: o 3★ mais versátil do jogo

| Flecha | Efeito | Equivalente a |
|--------|--------|--------------|
| Normal ×1.8 | 171 dmg por disparo | DPS de Sasuke |
| Explosiva (AOE) | acerta grupo inteiro | Naruto Shippuden |
| Gelo 3s (garantido) | freeze sem % de chance | Rukia sem custo de RNG |
| Perfurante ×3 | 285 dmg, atravessa inimigos | Uryu com dano triplicado |

Com P5 (boss_slayer +30%) e P10 (pierce 5 inimigos): bom contra horda, boss, corredor, controle. DPS bruto de 179 subestima massivamente seu valor — equivale funcionalmente a um 4★.

### 4.3 Kenpachi: escalamento potencialmente fora da curva no Infinito

- P0 base: 679 DPS / alcance 85px
- 100 kills acumuladas (+400%): ~3.400 DPS
- P10 battle_rage (+4.5%/inimigo, máx 90%): ~6.460 DPS teórico
- Composição ideal: Orihime (stun-immune) + Nami (slow global) + Kenpachi no corredor

**Monitorar:** onda 50+ no Infinito. Se trivializar, adicionar `paralysis_immune` + `burn_immune` em inimigos altos.

### 4.4 WBH: cascata de kills em horda

Com P10 (slow aura 50%) + gamma_burst (3× kills):
`kill → burst 3× em raio 120px → acerta 5 → kill → burst 3.2× → kill → burst 3.4×...`

Em onda com 20+ inimigos, WBH elimina sozinho. Fraqueza real: baixo alcance (108px cone), sem valor vs boss único.

### 4.5 Orihime: suporte defensivo subestimado

Aura anti-stun **contínua** (sem cooldown) nega: Itachi (genjutsu 2.5s), Gin Ichimaru (drain), DeSaad (−35% dano), Mantis (stun /20s). Em W5, Orihime + Killer Bee = base invulnerável + todos os inimigos com +80% de dano recebido.

---

## 5. Envelopes de Design por Raridade

Use ao criar novas unidades. O objetivo: novas unidades são **marginalmente melhores** que a média, sem sair do envelope.

| Raridade | Deploy alvo | Custo total alvo | DPS Base alvo (dano puro) | DPS Base alvo (controle) |
|----------|-------------|-----------------|--------------------------|--------------------------|
| 3★ | 120–300 | 600–3.000 | 140–360 | 70–200 |
| 4★ | 300–600 | 1.500–6.000 | 200–700 | 130–370 |
| 5★ | 500–1.000 | 3.000–12.000 | 500–1.100 | 350–700 |
| 6★ | 1.000–1.800 | 5.000–16.000 | 900–3.000 | — |
| 7★ | 2.000+ | 10.000+ | mecânica única | — |

**Regra de controle:** personagens com CC passivo devem ter **25–50% menos DPS** que dano puro do mesmo tier. O tradeoff de pegar CC é abrir mão de DPS bruto.

---

## 6. Clearabilidade por Mundo — Boss Final

**Método:** DPS Necessário = HP ÷ (PathLength ÷ Speed). DPS Disponível = soma dos 4 melhores DPS Base (sem prestige, rarity ≤ cap do mundo).

| Mundo | Boss | HP | Vel | Caminho | Tempo | DPS Nec. | DPS Disp. (P0) | Margem |
|-------|------|-----|-----|---------|-------|----------|----------------|--------|
| W1 Naruto | Pain | 20.000 | 38 | 1.814px | 47.7s | 419 | ~7.000 | 🟢 **16.7×** |
| W2 One Piece | Akainu | 35.000 | 40 | 1.848px | 46.2s | 758 | ~7.000 | 🟢 **9.2×** |
| W3 Bleach | Aizen F1+F2 | ~240k efetivo | 22–90 | 1.824px | variável | ~2.900 | ~10.000 | 🟢 **3.5×** |
| W4 Marvel | Thanos F1+F2 | ~320k efetivo | 20–55 | 2.284px | variável | ~2.800 | ~16.000 | 🟢 **5.7×** |
| W5 DC | Darkseid F1+F2 | ~435k efetivo (DR 20% F1) | 25–65 | estimado | variável | ~3.500 | ~22.000 | 🟢 **6.3×** |

🟢 ≥ 2.0× confortável | 🟡 1.5–2.0× seguro | 🟠 1.0–1.5× apertado | 🔴 < 1.0× impossível sem prestige

> Se P0 já é ≥ 1.5×, prestige é bônus. Se P0 < 1.0×, o boss foi mal calibrado — corrija antes de lançar.

### 6.1 Impacto do Prestígio (referência)

| Prestígio | Mult. Dano | Bônus Range | Efeito |
|:---------:|----------:|------------|--------|
| P0 | ×1.00 | +0% | Base |
| P1 | ×1.20 | +6% | +20% DPS + passiva única P1 |
| P5 | ×2.00 | +30% | DPS dobrado + passiva única P5 |
| P10 | ×3.00 | +60% | DPS triplicado + passiva única P10 |

> **Cuidado:** uma 4⭐ P10 tem 3× o DPS de P0, aproximando-se de uma 6⭐ sem prestige. Nunca calibre estágio assumindo P5+ em múltiplas unidades.

---

## 7. Economia do Jogo

| Fonte | Ouro | Observação |
|-------|-----:|-----------|
| Inicial | 300 | Fixo |
| Por wave completa | 100 | Fixo |
| Por kill | 50 | Fixo — boss = mesmo que capanga |
| Skip de wave | 100 × mult | Mult sobe 1 por skip (começa em 2; max 1.000 ouro) |
| L maxado | +500/wave | Ver seção 3.7 |
| Lois Lane maxada | +830/wave + kill gold | Ver seção 3.7 |

### Orçamento Estimado — Stage de 6 Waves (W4+)

- **Sem farm/skip:** ~3.900 ouro (inicial + waves + ~10 kills/wave)
- **Com Lois maxada:** ~8.880 ouro
- **Com Lois + 2 skips:** ~9.580+ ouro

> Novos mundos: calibrar para que o jogador consiga 2–3 upgrades da equipe no orçamento sem farm. Se deploy médio subiu, aumentar ouro por wave ou kill dos estágios correspondentes.

---

## 8. Inimigos — Escalonamento de HP

### 8.1 Bosses e Minibosses (completo)

| Inimigo | HP | Vel | Tipos | Especial | Classe |
|---------|---:|---:|-------|---------|-------|
| Darkseid (F1) | 220.000 | 25 | powerful3 | DR 20% + omega | 🔴 Boss W5 |
| Darkseid Equação (F2) | 160.000 | 65 | powerful3 | Equação Anti-Vida | 🔴 Boss W5 |
| Thanos Manopla (F2) | 120.000 | 55 | powerful3 | thanos_manopla | 🔴 Boss W4 |
| Thanos Eterno (F1) | 100.000 | 20 | powerful3+fortified | shield 100k + snap | 🔴 Boss W4 |
| Replicante Killer Bee | 100.000 | 60 | powerful3 | killerbee_replica | 🔴 Boss Ev. |
| Aizen Hogyoku (F2) | 85.000 | 90 | powerful3 | aizen_phase2 | 🔴 Boss W3 |
| Replicante Tsuchikage | 80.000 | 42 | powerful3 | tsuchikage_special | 🔴 Boss Ev. |
| Aizen Estrategista (F1) | 75.000 | 22 | powerful3+fortified | shield 80k + drain | 🔴 Boss W3 |
| DeSaad | 90.000 | — | — | −35% dano torres raio 120 | 🟠 Miniboss W5 |
| Mantis | 70.000 | — | — | stun torre /20s | 🟠 Miniboss W5 |
| Ebony Maw | 65.000 | 48 | powerful3+regenerator | push + inverte mira | 🟠 Miniboss W4 |
| Jinchuuriki Corrompido | 70.000 | 55 | powerful2+fortified | — | 🟠 Miniboss Ev. |
| Steppenwolf | 55.000 | — | — | shield + spawn | 🟠 Miniboss W5 |
| Corvus Glaive | 55.000 | 55 | powerful3+fortified | shield regenerativo | 🟠 Miniboss W4 |
| Ulquiorra | 50.000 | 55 | powerful3+regenerator | base_drain | 🟠 Miniboss W3 |
| Replicante Kazekage | 50.000 | 48 | powerful3+fortified | base_drain | 🟠 Miniboss Ev. |
| Kalibak | 40.000 | — | — | berserk ×1.8 em 50% HP | 🟠 Miniboss W5 |
| Nnoitra Gilga | 40.000 | 42 | powerful3+fortified | shield 45k + regen | 🟠 Miniboss W3 |
| Ronan | 45.000 | 45 | powerful2 | verdict: trava DPS | 🟠 Miniboss W4 |
| Grimmjow | 32.000 | 98 | powerful2 | spawn arrancars bomb | 🟠 Miniboss W3 |
| Crossbones | 30.000 | 60 | powerful2+fortified | kamikaze → berserk ×1.65 | 🟠 Miniboss W4 |
| Granny Goodness | 27.000 | — | — | spawn soldados /15s | 🟠 Miniboss W5 |
| Gin Ichimaru | 20.000 | 72 | powerful2 | base_drain 3s | 🟠 Miniboss W3 |
| Batroc | 20.000 | 110 | powerful2 | dash +280px /12s | 🟠 Miniboss W4 |
| Grand Fisher | 14.000 | 50 | powerful2 | stun spawn + hollows | 🟠 Miniboss W3 |
| Caminho Deus Animal | 12.000 | 46 | powerful1 | on_death: invocação | 🟠 Miniboss W1 |
| Pain (Nagato) | 20.000 | 38 | powerful3 | pain_boss | 🔴 Boss W1 |
| Akainu | 35.000 | 40 | powerful3+bomber | — | 🔴 Boss W2 |
| Rob Lucci | 22.000 | 55 | powerful2 | — | 🟠 Miniboss W2 |
| Itachi | 6.000 | 54 | powerful1 | genjutsu 2.5s | 🟠 Miniboss W1 |
| Konan | 8.000 | 50 | powerful1 | on_death: shinra_tensei | 🟠 Miniboss W1 |
| Arlong | 8.000 | 50 | powerful1 | — | 🟠 Miniboss W2 |
| Don Krieg | 5.000 | 52 | powerful1 | — | 🟠 Miniboss W2 |

### 8.2 Lacaios — HP e Speed por Mundo

| Mundo | Lacaio Básico HP | Speed | Lacaio Elite HP | Speed Especial |
|-------|-----------------|-------|----------------|---------------|
| W1 Naruto | 200 | 75 | 700–2.800 | 140–152 (Ninja speed) |
| W2 One Piece | 400 | 72 | 1.200–5.500 | 140–160 (CP9) |
| W3 Bleach | 900 | 95 | 3.200–22.000 | 150 (Sonido) |
| W4 Marvel | 1.500 | 85 | 1.800–24.000 | 155 (Invasor veloz) |
| W5 DC | 2.000 | 85 | 27.000–32.000 | 155 (Paradem) |

---

## 9. Problemas Detectados

> ⚠️ = questão de balanceamento. ℹ️ = nota de design. 🆕 = identificado no rebalanceamento c3b5bda.

- ⚠️ **Ichigo Bankai (5★ gacha U1)** — 1.524 DPS + aura 1.55× é auto-suficiente E amplificador. Nenhum personagem de U2/U3 tem esse perfil combinado. Flash Reverso (evolução U3) tem DPS menor (1.084). Corrigir progressão em U4: gacha 5★ U4 deve superar 1.524 DPS.
- ⚠️ **Ichigo Vizard (6★)** — 2.722 DPS base; evoluções futuras devem superar. Flash Reverso (U3 evolução) está bem abaixo. U4 evolução deve atingir 2.400–3.000 DPS.
- ⚠️🆕 **DeSaad debuff afeta torres farm** — DeSaad aplica −35% dano a torres incluindo Lois Lane (dano=0). Semanticamente errado; filtrar `is_farm_unit: true` antes de aplicar debuffs de dano.
- ⚠️ **Kenpachi Zaraki** — com P10 + berserker máximo pode atingir ~6.460 DPS teórico, quebrando o Infinito acima de onda 50. Adicionar `paralysis_immune` + `burn_immune` em inimigos de onda alta.
- ℹ️🆕 **Personagens com apenas 2 upgrades** — Robin, Zoro Ashura, Luffy G4, Zoro EB, Ace, Luffy EB, Orochimaru, Pain, Barba Branca, Brook, Sanji, Nami, Usopp. Progressão limitada; candidatos a receber upgrades extras em updates futuros.
- ℹ️ **Boss economy** — bosses entregam 50 gold (mesmo que capanga com 400 HP). Próximo update: `boss_gold_bonus = floor(hp / 1000)`, teto 500.
- ℹ️ **Auras invisíveis no DPS** — Gojo (+25%), Bankai (1.55×), Killer Bee (+55%), Batman (+22%), Superman (+15%) multiplicam o output de toda a equipe mas o DPS individual subestima seu valor. Documentar multiplicador efetivo ao calibrar novos estágios.

---

## 10. Projeção de Balanceamento — Updates 4, 5 e 6

### Regras de Escalonamento

| Métrica | U1 atual | U2 atual | U3 atual | U4 target | U5 target | U6 target |
|---------|---------|---------|---------|-----------|-----------|-----------|
| 3★ DPS pico (dano) | 354 (Chad) | 179 (Hawkeye) | 237 (Flash) | **380–430** | **480–560** | **600–720** |
| 4★ DPS pico | 679 (Kenpachi) | 468 (Hulk) | 367 (Hulk) | **720–920** | **950–1.200** | **1.250–1.600** |
| 5★ DPS gacha | 1.524 (Bankai) | 515 (IM) | 965 (Shazam) | **1.250–1.550** | **1.650–2.050** | **2.150–2.750** |
| 5★ DPS evolução | 803 (Zoro) | 698 (WBH) | 1.084 (FR) | **1.800–2.200** | **2.500–3.200** | **3.400–4.300** |
| Boss final HP efetivo | — | — | 435k (Darkseid) | **650–850k** | **950k–1.3M** | **1.5–2.2M** |
| Lacaio básico HP | — | — | 2.000 | **2.600–3.200** | **3.600–4.600** | **5.000–7.000** |

### 10.1 Update 4 — Mundo 6

| Raridade | Dano | Speed (s) | DPS Alvo | Deploy | Passiva sugerida |
|----------|------|-----------|----------|--------|----------------|
| 3★ controle | 145–170 | 0.62–0.72 | 201–274 | 280–370 | CC + conversor |
| 3★ dano | 280–330 | 0.62–0.75 | 373–532 | 310–400 | Burst periódico ou reativo forte |
| 4★ controle | 310–360 | 0.60–0.70 | 443–600 | 560–760 | Amplificador + CC ativo |
| 4★ dano | 530–620 | 0.58–0.70 | 757–1.069 | 620–840 | Escalonamento exponencial |
| 5★ gacha | 700–820 | 0.52–0.62 | 1.129–1.577 | 1.000–1.400 | Amplificador + DPS alto (supera Ichigo Bankai) |
| 5★ evolução | 860–980 | 0.27–0.35 | 2.457–3.630 | 1.150–1.600 | Mecânica de transformação (supera Ichigo Vizard) |
| 4★ farm | 0 | — | — | 520–720 | gold/wave +25% vs Lois |

Boss W6: HP efetivo total ~826.000 (F1: 320k + shield 200k + F2: 252k).

### 10.2 Update 5 — Mundo 7

| Raridade | Dano | Speed (s) | DPS Alvo | Deploy | Passiva sugerida |
|----------|------|-----------|----------|--------|----------------|
| 3★ controle | 175–205 | 0.55–0.67 | 261–373 | 340–430 | CC global ou conversor forte |
| 3★ dano | 330–390 | 0.55–0.68 | 485–709 | 375–470 | Escalonamento em horda |
| 4★ controle | 370–425 | 0.53–0.64 | 578–802 | 700–920 | Aura de time + CC |
| 4★ dano | 640–730 | 0.53–0.64 | 1.000–1.378 | 750–980 | Burst massivo + multi-alvo |
| 5★ gacha | 865–990 | 0.48–0.57 | 1.518–2.063 | 1.260–1.680 | Multi-tipo passiva |
| 5★ evolução | 1.060–1.220 | 0.22–0.30 | 3.533–5.545 | 1.460–1.950 | 3 fases de poder |
| 4★ farm | 0 | — | — | 680–900 | gold/wave +25% vs U4 farm |

Boss W7: HP efetivo total ~980.000.

### 10.3 Update 6 — Mundo 8

| Raridade | Dano | Speed (s) | DPS Alvo | Deploy | Passiva sugerida |
|----------|------|-----------|----------|--------|----------------|
| 3★ controle | 212–248 | 0.49–0.61 | 348–506 | 412–525 | Dual CC + conversor |
| 3★ dano | 402–468 | 0.50–0.62 | 648–936 | 452–558 | Burst + reativo composto |
| 4★ controle | 452–510 | 0.48–0.58 | 779–1.063 | 875–1.120 | Amplificador + CC + suporte |
| 4★ dano | 784–880 | 0.48–0.58 | 1.352–1.833 | 938–1.200 | Escalonamento máximo do tier |
| 5★ gacha | 1.058–1.200 | 0.43–0.52 | 2.035–2.791 | 1.570–2.060 | Sintetiza 2 tipos de passiva |
| 5★ evolução | 1.312–1.510 | 0.18–0.26 | 5.046–8.389 | 1.820–2.360 | Mecânica de 3 condições |
| 4★ farm | 0 | — | — | 842–1.100 | gold/wave +25% vs U5 farm |

Boss W8: HP efetivo total ~2.027.000 (3 fases).

---

## 11. Tier List Completa

> Critérios: DPS base + valor da passiva + versatilidade + impacto em equipe + relevância W5/Infinito.
> *(Ev)* = evento exclusivo. 🔁 = evolução.

### SS — Classe Própria

| # | Nome | Raridade | Por que SS |
|---|------|----------|-----------|
| 1 | 🔁 Ichigo (Vizard) | 6★ Bleach | 2.722 DPS + Máscara Eterna (2× tudo após 66 ataques) + Rei dos Dois Mundos (+20% aliados Bleach) |
| 2 | Darkseid | 7★ DC | Omega rays + 15% HP real como dano fixo; mecânica única; 0.000005% de chance |
| 3 | Killer Bee *(Ev)* | 5★ Naruto | Tinta +55% de TODAS as fontes; o maior amplificador de equipe do jogo |
| 4 | Tsunade *(Ev)* | 4★ Naruto | 706 DPS + anti-drain (50% mais lento) + restaura vida; única fonte de recuperação de vida |

### S — Pilares do Meta

| # | Nome | Raridade | Por que S |
|---|------|----------|----------|
| 5 | Ichigo (Bankai) | 5★ Bleach | 1.524 DPS + bankai_pressure 1.55× global; auto-suficiente E amplificador |
| 6 | Gojo Satoru | 5★ JJK | 388 DPS Full AOE + aura +25% torres + Domínio stun 4s; meta-definer U0 |
| 7 | Kenpachi Zaraki | 4★ Bleach | 679 DPS base; maxado = ~3.400 DPS; maior potencial no Infinito |
| 8 | 🔁 WBH | 5★ Marvel | 698 DPS + cascata gamma em horda; P10 slow aura 50% |
| 9 | 🔁 Flash Reverso | 5★ DC | 1.084 DPS + paralisia stack; boss travado = insubstituível |
| 10 | Pain *(Ev)* | 5★ Naruto | 406 DPS + bypass de TODAS as imunidades; essencial em W5 |
| 11 | Hawkeye | 3★ Marvel | Cicla 4 flechas (Normal ×1.8 / AOE / Gelo 3s / Pierce ×3); mais versátil do tier |

### A+ — Extremamente Fortes

| # | Nome | Raridade | Por que A+ |
|---|------|----------|-----------|
| 12 | Barba Branca | 5★ One Piece | 959 DPS linha + tsunami bloqueador HP 32k /15s |
| 13 | Shazam | 5★ DC | 965 DPS pós-transform; peak mais alto dos gacha U3 |
| 14 | Superman | 5★ DC | 703 DPS + aura +15% global + heat vision |
| 15 | Lois Lane | 4★ DC | Melhor farm; ~830 gold/wave maxada |
| 16 | Ace | 4★ One Piece | 468 DPS cone + burn 60 DPS |
| 17 | Thor | 4★ Marvel | 303 DPS + chain ×3 + P1 paralisia 1.5s + P10 aura +30% |
| 18 | Byakuya | 4★ Bleach | 311 DPS scatter + kill explosão 1.3×; campeão de horda |
| 19 | Orihime | 3★ Bleach | 125 DPS mas aura anti-stun contínua; nega 4 mecânicas críticas de W3-W5 |
| 20 | Batman | 4★ DC | 237 DPS + detective_mark +22% todas as torres |
| 21 | Chad | 3★ Bleach | 354 DPS; 780 DPS efetivo vs boss (boss slayer 2.2×) |
| 22 | Naruto (Shippuden) | 4★ Naruto | 204 DPS AOE + kill CDR 80%; massacrador de horda |

### A — Confiáveis e Versáteis

| # | Nome | Raridade | Por que A |
|---|------|----------|----------|
| 23 | Iron Man Mk50 | 5★ Marvel | 515 DPS linha + unibeam 8× a cada 5.3s; boss/corredor |
| 24 | 🔁 Luffy (Gear 4) | 5★ One Piece | 581 DPS cone; P10 Gear 5 7× a cada 3 ataques |
| 25 | 🔁 Zoro (Ashura) | 5★ One Piece | 803 DPS linha em rajada |
| 26 | Black Panther | 4★ Marvel | 244 DPS → 512 efetivo em grupo (ricochet ×2/55%) |
| 27 | Hulk Base | 4★ Marvel | 367 DPS + rage +50% com 10 inimigos; evolui para WBH |
| 28 | Toshiro | 4★ Bleach | 296 DPS + pulso em área /5s + cone freeze |
| 29 | Flash Barry | 3★ DC | 237 DPS; speed force burst |
| 30 | Levi Ackerman | 4★ SnK | 134 DPS base → 536 DPS com 15 stacks |
| 31 | Sasuke Uchiha | 3★ Naruto | 191 DPS; DPS mais alto dos 3★ U0 |
| 32 | Black Widow | 3★ Marvel | 75 DPS mas cross_mark +25% de todos em kills; multiplicador constante |
| 33 | Spider-Man | 3★ Marvel | 91 DPS mas web zone 60% slow contínuo |
| 34 | Batgirl | 3★ DC | 178 DPS + crit 20%/2.2×; boa relação deploy/output |
| 35 | 🔁 Naruto (Sage) | 5★ Naruto | 199 DPS + clone army (máx 5); DPS multiplicado em multi-ponto |

### B+ — Bons no Nicho

| # | Nome | Raridade |
|---|------|----------|
| 36 | Goku Base | 3★ DB |
| 37 | Zoro (East Blue) | 3★ One Piece |
| 38 | Robin | 4★ One Piece |
| 39 | Sanji | 4★ One Piece |
| 40 | Tanjiro | 3★ KnY |
| 41 | Renji | 3★ Bleach |
| 42 | Rukia | 3★ Bleach |
| 43 | Nami | 3★ One Piece |
| 44 | Luffy (East Blue) | 3★ One Piece |
| 45 | Usopp | 3★ One Piece |
| 46 | Ichigo Base | 3★ Bleach |
| 47 | Meliodas | 4★ 7DS |
| 48 | Aquaman | 3★ DC |
| 49 | Lanterna Verde | 4★ DC |

### B — Situacionais

| # | Nome | Raridade |
|---|------|----------|
| 50 | Killua | 3★ HxH |
| 51 | Demolidor | 3★ Marvel |
| 52 | Brook | 3★ One Piece |
| 53 | Uryu | 3★ Bleach |
| 54 | Orochimaru *(Ev)* | 4★ Naruto |

### C — Outclassed

| # | Nome | Por que C |
|---|------|----------|
| 55 | L (Death Note) | Farm relevante W1–W3; obsoleto após Lois Lane |

### E — (Reservado para futuro)

Nenhum personagem atual está aqui. E é reservado para unidades completamente superadas sem nenhum nicho em updates futuros.

---

## 12. Times Perfeitos

> Cada time tem 10 slots. Custo de deploy estimado com todas as torres no máximo.

### Time 1 — "Amplificação Máxima"

**Foco:** Empilhar todos os multiplicadores de dano sobre os mesmos inimigos.
**Melhor em:** W4–W5, Infinito ondas 1–50, Boss fights.
**Requisito:** Alto (exige Ichigo Bankai + Killer Bee + Vizard).

| Slot | Personagem | Papel | Passiva ativa |
|------|-----------|-------|--------------|
| 1 | 🔁 Ichigo (Vizard) | Dano principal | Rei dos Dois Mundos +20% Bleach; Máscara Eterna 2× tudo |
| 2 | Ichigo (Bankai) | Amplificador central | bankai_pressure 1.55× — todos recebem 1.55× de qualquer fonte |
| 3 | Gojo Satoru | Full AOE + Buffer | aura +25% todas as torres; Domínio stun 4s ativo |
| 4 | Batman | Multiplicador permanente | detective_mark +22% todas as aliadas |
| 5 | Killer Bee | Amplificador máximo | tinta +55% de todas as fontes nos inimigos marcados |
| 6 | Superman | DPS + Aura global | aura +15% equipe; heat vision para boss |
| 7 | 🔁 Flash Reverso | Trava de boss | paralisia stack — boss parado dentro do bankai_pressure |
| 8 | Orihime | Anti-disrupção | stun-immune contínuo; P5 +20% aliadas |
| 9 | Kenpachi | Dano escalável | acumula stacks enquanto Flash Reverso paralisa o boss |
| 10 | Lois Lane | Farm | gold essencial para deploy |

**Multiplicador efetivo sobre inimigos marcados:**
`1.55 × 1.25 × 1.22 × 1.55 × 1.15 ≈ 5.2×` sobre todo dano de qualquer torre.

**Fraqueza:** Custo de deploy altíssimo. Sem Lois bem upada, pode faltar ouro no início.

---

### Time 2 — "Controle Perpétuo"

**Foco:** CC em camadas — inimigos nunca chegam à base.
**Melhor em:** W3–W5, fases com drain (Gin, Ulquiorra, DeSaad), minibosses lentos.
**Requisito:** Médio (sem exigir gacha 5★ raro).

| Slot | Personagem | Papel | CC aplicado |
|------|-----------|-------|------------|
| 1 | Toshiro | AOE + Freeze periódico | Pulso /5s em área + cone freeze todos |
| 2 | Rukia | Freeze on-hit | 28% freeze 2s a cada acerto |
| 3 | Nami | Slow global periódico | Storm: 40% slow em TODO o mapa /~5s |
| 4 | Spider-Man | Zona de slow permanente | Web zone 60% slow; cada acerto cria nova zona |
| 5 | Thor | Chain + Paralisia | chain ×3 + P1 paralisia 1.5s/acerto |
| 6 | 🔁 Flash Reverso | Lock de boss | paralisia acumulada = boss imóvel |
| 7 | Hawkeye | CC + DPS + Burst | gelo garantido a cada 4 ataques; pierce ×3 |
| 8 | Kenpachi | DPS principal | acumula stacks fácil — inimigos lentos ficam vivos mais tempo = mais kills |
| 9 | Orihime | Anti-disrupção | stun-immune bloqueia Itachi/Gin/Mantis de desligar as torres de CC |
| 10 | Lois Lane | Farm | gold essencial |

**Como funciona:** Nami slow global → Spider-Man web zones −60% → Rukia/Hawkeye/Toshiro freezes em rotação → Flash Reverso paralisa o miniboss → Kenpachi massacra com stacks crescentes.

**Fraqueza:** Contra `paralysis_immune` + `freeze_immune` (W6+), perde metade das ferramentas.

---

### Time 3 — "Cascata de Destruição"

**Foco:** Uma kill dispara reação em cadeia de explosões e DoTs.
**Melhor em:** Ondas de horda (10+ inimigos), W2–W4, Infinito ondas 1–40.
**Requisito:** Baixo a médio (sem gacha 5★ raro obrigatório).

| Slot | Personagem | Papel | Cadeia |
|------|-----------|-------|--------|
| 1 | 🔁 WBH | Gatilho principal | kills → gamma_burst 3× raio 120px; +20% por kill consecutiva em 3s |
| 2 | Byakuya | Gatilho secundário | kills → explosão de pétalas 1.3×; scatter cobre o mapa |
| 3 | Ace | Aplicador de burn | cone + burn 60 DPS; abre sinergia |
| 4 | Meliodas | Dual DoT | burn 14 + bleed 7 DPS em cada acerto; todo campo com DoTs |
| 5 | Tanjiro | Amplificador condicional | 2× vs queimados — com Ace + Meliodas, todos estão queimando |
| 6 | Killer Bee | Amplificador global | tinta +55% quando scatter acerta 3+ (Byakuya ativa constantemente) |
| 7 | Naruto (Shippuden) | AOE + kill CDR | cone AOE + cada kill = ataca quase imediatamente |
| 8 | Black Widow | Marca residual | cross_mark: kills marcam sobreviventes (+25% de todos por 6s) |
| 9 | Orihime | Anti-disrupção | stun-immune; P10 +25% dano recebido pelos inimigos |
| 10 | Lois Lane | Farm | gold essencial |

**Cadeia completa:** Ace/Meliodas aplicam burn → Tanjiro 2× → kill → WBH gamma burst → acerta 5 → kill → burst 3.2× → Byakuya scatter explode → Killer Bee tinta +55% → Black Widow marca sobreviventes → Naruto cone sem cooldown → onda de 20 inimigos limpa antes da metade.

**Fraqueza:** Boss único (sem horda). Substituir WBH por Iron Man Mk50 e Meliodas por Flash Reverso em fases de boss isolado.

---

## 13. Diretrizes para Futuras Atualizações

### 13.1 Checklist — Nova Unidade de Combate

- [ ] **Raridade coerente:** DPS Base ≥ DPS Base médio da raridade imediatamente abaixo
- [ ] **Envelope de eficiência:** deploy cost dentro do alvo da raridade (seção 5)
- [ ] **Progressão de upgrades:** ≥ 3 upgrades; primeiro upgrade ≤ 30% do custo de deploy
- [ ] **Passiva justificada:** Aura/CC pode reduzir DPS individual — documentar o multiplicador de equipe
- [ ] **Sem inversão:** verificar que nenhuma unidade de raridade ≥2 acima é menos eficiente
- [ ] **Prestige não quebra:** P10 desta unidade não deve tornar estágios triviais (margem > 5×)
- [ ] **Event-exclusive:** deploy ≤ 2× média da raridade; justificado por passiva diferenciada
- [ ] **Controle/suporte:** DPS base 25–50% abaixo do dano puro da mesma raridade

### 13.2 Checklist — Novo Mundo / Nova Fase

Fórmula de calibragem do boss: `HP_Boss = DPS_disponível × 0.65 × (pathLength / speed)` para margem confortável.

- [ ] **Margem de segurança:** top 4 unidades do tier, P0, margem ≥ 1.0× (alvo: 1.5×)
- [ ] **Dificuldade Normal/Lendário:** mods ×1.5 e ×2.2 de HP não tornam o boss intransponível (P0)
- [ ] **Ouro por wave calibrado:** cobre 2–3 upgrades ao longo do stage (ver orçamento seção 7)
- [ ] **Wave design:** waves anteriores ao boss não devem gastar tanto recurso que impeça o kill
- [ ] **Path length:** caminhos < 1.000px aumentam drasticamente o DPS necessário
- [ ] **Mecânica nova:** cada mundo introduz ≥1 tipo de inimigo ou ptype nunca visto
- [ ] **Anti-stall:** a partir de W6, ≥1 miniboss com `paralysis_immune` por mundo

### 13.3 Referência de HP de Boss por Mundo

| Mundo | Cap Raridade | DPS Disponível (P0) | HP Confortável | HP Atual | Status |
|-------|:---:|---:|---:|---:|---|
| W1 Naruto | ≤ 4★ | ~7.000 | ~210.000 | 20.000 | ✅ OK (mundo tutorial) |
| W2 One Piece | ≤ 4★ | ~7.000 | ~200.000 | 35.000 | ✅ OK (mundo tutorial) |
| W3 Bleach | ≤ 5★ | ~10.000 | ~520.000 | ~240k efetivo | ✅ OK |
| W4 Marvel | ≤ 6★ | ~16.000 | ~800.000 | ~320k efetivo | ✅ OK |
| W5 DC | ≤ 7★ | ~22.000 | ~900.000 | ~435k efetivo | ✅ OK |
| W6 (projeção U4) | ≤ 7★ | ~30.000 | ~826.000 | — | 📋 Planejar |
| W7 (projeção U5) | ≤ 7★ | ~40.000 | ~980.000 | — | 📋 Planejar |
| W8 (projeção U6) | ≤ 7★ | ~55.000 | ~2.027.000 | — | 📋 Planejar |

### 13.4 Recomendações Prioritárias

1. **Boss economy:** bosses entregam mesmo ouro que capangas. Próximo update: `boss_gold_bonus = floor(hp/1000)`, teto 500.
2. **Anti-stall Infinito:** adicionar `paralysis_immune` a partir de onda 30. `freeze_immune` a partir de onda 45. `burn_immune` a partir de onda 60. Resistência rotativa a partir de onda 80.
3. **Progressão U4:** gacha 5★ U4 deve superar Ichigo Bankai (1.524 DPS). Evolução U4 deve superar Ichigo Vizard (2.722 DPS). Isso restabelece a progressão linear quebrada em U1→U2.
4. **Personagens com 2 upgrades:** Robin, Zoro Ashura, Ace, Pain, Barba Branca, Nami, Usopp etc. — candidatos a receber upgrades 3+ em hotfix ou update menor.
5. **DeSaad fix:** filtrar `is_farm_unit: true` antes de aplicar debuffs de dano.

---

*Execute `node analyze_balance.js` após adicionar novas unidades ou mundos para regenerar tabela de eficiência gold/DPS.*
