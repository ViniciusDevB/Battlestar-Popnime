# Update 3 — Personagens DC (Parte 2)

> **Referência de calibração:** U2 (Marvel) 4★ base ~195–215 dano | 5★ base ~340+ dano  
> **Multiplicador U3:** 1.21× sobre U2 → 3★ ~145–160 dmg | 4★ ~220–260 dmg | 5★ ~410–550 dmg  
> Ver [Guia de Balanceamento](../balanceamento.md) e [Parte 1](update3_dc.md) para contexto.

---

## Visão Geral do Roster

| # | Personagem | Raridade | Tipo | Role |
|---|-----------|----------|------|------|
| 1 | Flash (Barry Allen) | 3★ | Linha | DPS Acumulativo / Velocidade |
| 2 | Batgirl (Barbara Gordon) | 3★ | Single → Cone | Suporte / Marcação |
| 3 | Aquaman (Arthur Curry) | 3★ | AOE | Controle de Zona / Slow |
| 4 | Batman (Bruce Wayne) | 4★ | Cone → AOE | DPS + Amplificador de Equipe |
| 5 | Lois Lane | 4★ | — | Farmer (superior ao L) |
| 6 | Lanterna Verde (Hal Jordan) | 4★ | Single | Controle / Barreiras |
| 7 | Superman (Clark Kent) | 5★ | AOE | DPS + Aura Global |
| 8 | Shazam (Billy Batson) | 5★ | Transformação | Payoff de Longo Prazo |
| 9 | Flash Reverso (Eobard Thawne) | 5★ evolução | Linha | DPS + Paralisia |

---

## 3★ — Personagens

---

### 1. Flash (Barry Allen)
**Conceito:** Ataque mais rápido do jogo entre os 3★. Dano por hit baixo, compensado pela velocidade absurda e pelo burst da Speed Force a cada 8 ataques — um raio que percorre todo o caminho.

**Passiva base — "Força da Velocidade":**
A cada 8 ataques, dispara um Raio de Velocidade que percorre todo o caminho causando `6× dano base` em todos os inimigos que toca.

```
base_stats: { damage: 90, range: 112, attack_speed: 0.68, type: 'single_target' }
deploy_cost: 250
```

**Upgrades (6):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Corrida Relâmpago | Tipo → Linha \| Dano ×1.25 | 200 |
| 2 | Velocidade da Luz | Vel ×1.35 | 340 |
| 3 | Speed Force Ampliada | Burst a cada 7 ataques \| Dano burst ×1.3 | 480 |
| 4 | Corredor Escarlate | Dano ×1.4 \| Alcance ×1.15 | 620 |
| 5 | Força Máxima | Vel ×1.25 \| Burst a cada 6 ataques | 820 |
| 6 | Flash Completo | Dano ×1.6 \| Vel ×1.2 \| Burst → 8× dano | 1.100 |

**Prestígios:**
- **P1 — Pós-Imagem:** cada 3º ataque deixa uma imagem residual que continua atacando por 1.5s
- **P5 — Velocidade Suprema:** +15% vel. de ataque acumulado por nível de prestígio
- **P10 — Speed Force Global:** o Raio de Velocidade causa Slow 50% por 2s em todos os atingidos

**Evolução:** Flash → **Flash Reverso** (ver seção de evoluções)

---

### 2. Batgirl (Barbara Gordon)
**Conceito:** Personagem de suporte estratégico. Seus ataques marcam inimigos, fazendo que TODAS as fontes de dano (outras torres, burn, bleed) causem mais neles. Sinergiza fortemente com Batman (P10 de Batman).

**Passiva base — "Alvo Marcado":**
Inimigos atingidos por Batgirl ficam **marcados** por 4s. Inimigos marcados recebem `+18% de dano` de qualquer fonte.

```
base_stats: { damage: 132, range: 122, attack_speed: 1.32, type: 'single_target' }
deploy_cost: 255
```

**Upgrades (5):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Pellet de Fumaça | Vel ×1.2 \| Alcance ×1.1 | 220 |
| 2 | Batarang | Tipo → Cone (3 alvos) | 350 |
| 3 | Marca Profunda | Duração: 4s → 6s \| Bônus: 18% → 25% | 510 |
| 4 | Vigilante de Gotham | Dano ×1.45 \| Vel ×1.15 | 700 |
| 5 | Oracle | Dano ×1.7 \| Marca: 8s \| +35% dano recebido \| Alcance ×1.2 | 1.050 |

**Prestígios:**
- **P1 — Multimarca:** pode manter marca em até 3 inimigos simultaneamente
- **P5 — Marca Propagante:** inimigo marcado que morre transfere a marca para o inimigo mais próximo
- **P10 — Marca Letal:** inimigos marcados por 3+ stacks (múltiplas Batgirls ou reaplicações) recebem `+60% dano`

---

### 3. Aquaman (Arthur Curry)
**Conceito:** Controle de zona via "Maré". Ataques criam uma zona persistente de slow no ponto de impacto. Melhor posicionado nos cruzamentos de caminho do Mundo 5 — a zona cobre as duas rotas simultaneamente.

**Passiva base — "Zona de Maré":**
Cada ataque cria uma **Zona de Maré** no ponto de impacto que persiste por 3s. Inimigos na zona têm velocidade reduzida em 40%.

```
base_stats: { damage: 155, range: 132, attack_speed: 1.45, type: 'aoe' }
deploy_cost: 270
```

**Upgrades (5):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Tridente Afiado | Dano ×1.3 | 230 |
| 2 | Ondas Profundas | Raio zona: 3→4 \| Duração: 3s→4s | 380 |
| 3 | Comando Marítimo | Slow: 40%→55% | 520 |
| 4 | Rei dos Sete Mares | Dano ×1.5 \| Vel ×1.15 | 720 |
| 5 | Força Atlante | Dano ×1.8 \| Raio: 5 \| Slow: 65% \| Duração: 5s | 1.100 |

**Prestígios:**
- **P1 — Correnteza:** inimigos na zona são empurrados levemente para trás (delay extra no caminho)
- **P5 — Tsunami:** ao ser deployado, cria onda que empurra inimigos em raio 8 por 0.5s
- **P10 — Abismo:** zona causa 80 DPS de dano de pressão adicional além do slow

---

## 4★ — Personagens

---

### 4. Batman (Bruce Wayne)
**Conceito:** Atacante em cone com passiva de marcação que amplifica o dano de TODA a equipe nos alvos atingidos. Sinergiza com Batgirl — P10 cria combo único entre os dois.

**Passiva base — "Detetive de Elite":**
Inimigos atingidos recebem **Marca do Detetive** por 5s. Aliados que atacarem inimigos marcados causam `+22% dano`.

```
base_stats: { damage: 218, range: 138, attack_speed: 1.28, type: 'cone' }
deploy_cost: 500
```

**Upgrades (6):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Utilidade do Cinto | Dano ×1.25 \| Alcance ×1.15 | 350 |
| 2 | Batarang Explosivo | Cone → AOE (raio 4) | 600 |
| 3 | Análise Tática | Bônus aliados: 22%→30% | 820 |
| 4 | Traje Blindado | Vel ×1.2 \| Dano ×1.4 | 1.050 |
| 5 | Protocolo Batman | Dano ×1.55 \| Marca: 5s→7s | 1.300 |
| 6 | Cavaleiro das Trevas | Dano ×1.8 \| Vel ×1.15 \| Bônus: 40% \| Alcance ×1.2 | 1.800 |

**Prestígios:**
- **P1 — Vigilante:** reduz cooldown de torres aliadas no alcance em 8%
- **P5 — Protocolo Arkham:** quando um inimigo Elite entra no alcance, Batman lança automaticamente uma bomba de atordoamento (Stun 1.5s, CD interno: 12s)
- **P10 — Bat-Família:** enquanto Batgirl estiver em campo, ambos ganham `+20% dano` e as marcas de ambos se acumulam (efeito de stack)

---

### 5. Lois Lane
**Conceito:** Farmer superior ao L. Usa o mesmo template `wave_gold` mas com valores base e escalonamento maiores. O L é o farmer de early game barato; a Lois domina o late game de farm com investimento maior.

**Passiva base — "Matéria de Capa":**
Gera ouro ao fim de cada wave. `base: 80 | perLevel: 3 | prestigeMultPerLevel: 0.5`

> Comparativo: L tem `base: 50 | perLevel: 2 | prestigeMultPerLevel: 0.4`  
> Lois Lv50 sem upgrades: **227 gold/wave** vs L Lv50: **148 gold/wave**  
> Lois máx sem prestígio: **1.057 gold/wave** vs L: **598 gold/wave**  
> Lois P10 absoluto: **~6.342 gold/wave** vs L: **~2.990 gold/wave**

```
base_stats: { damage: 0, range: 128, attack_speed: 0, type: 'none' }
deploy_cost: 300
is_farm_unit: true
```

**Upgrades (5):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Reportagem de Campo | +80 gold/wave \| Alcance ×1.2 | 280 |
| 2 | Furo Exclusivo | +150 gold/wave | 450 |
| 3 | Rede de Contatos | +200 gold/wave \| +10 ouro por kill | 650 |
| 4 | Capa do Planeta | +200 gold/wave \| kill bonus → 20 ouro \| Alcance ×1.3 | 900 |
| 5 | Superman Me Ligou | +200 gold/wave \| kill bonus → 30 ouro | 1.200 |

**Prestígios:**
- **P1 — Fonte Confiável:** +8 ouro por kill de aliados no alcance
- **P5 — Rede de Fontes:** +30% gold/wave para cada outra unidade de farm em campo (L, outra Lois)
- **P10 — Manchete:** dobra o gold/wave gerado enquanto 3+ unidades deployadas

---

### 6. Lanterna Verde (Hal Jordan)
**Conceito:** Único personagem que interage diretamente com o caminho. Passiva cria automaticamente **Barreiras de Construto** em pontos do caminho — zonas físicas que aplicam slow intenso e dano contínuo aos inimigos que as atravessam. Especialmente poderoso no Mundo 5 com dois caminhos.

**Passiva base — "Barreira de Construto":**
A cada 15s, cria automaticamente uma Barreira de Construto no ponto do caminho dentro do alcance de GL. A barreira dura 8s, aplica slow de 50% e causa 180 DPS aos inimigos que a atravessam.

```
base_stats: { damage: 192, range: 145, attack_speed: 1.35, type: 'single_target' }
deploy_cost: 520
```

**Upgrades (5):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Anel de Poder | Dano ×1.25 \| Vel ×1.1 | 360 |
| 2 | Construto Reforçado | Barreira: 8s→12s \| DPS: 180→300 | 590 |
| 3 | Vontade de Ferro | Dano ×1.4 \| Slow barreira: 50%→65% | 820 |
| 4 | Tropa dos Lanternas | Vel ×1.2 \| CD barreira: 15s→10s | 1.080 |
| 5 | Guardião do Setor | Dano ×1.75 \| 2 barreiras simultâneas \| DPS barreira: 400 | 1.550 |

**Prestígios:**
- **P1 — Construto Ofensivo:** barreiras causam explosão de impacto ao aparecer (AOE único de 500 no raio)
- **P5 — Juramento:** enquanto GL está em campo, todos os aliados ganham +8% de alcance
- **P10 — Bateria de Poder:** CD da barreira: 6s; barreiras duram 15s; barreira em cada caminho simultâneo do Mundo 5

---

## 5★ — Personagens

---

### 7. Superman (Clark Kent)
**Conceito:** DPS pesado em AOE combinado com aura global permanente que buffa toda a equipe. A cada 20s dispara Visão de Calor — um raio que percorre todo o caminho causando dano massivo.

**Passiva base — "Homem de Aço":**
Aura global: torres aliadas ganham `+15% dano` enquanto Superman estiver em campo.
A cada 20s, dispara **Visão de Calor**: raio que percorre o caminho causando `3.000 dano fixo`.

```
base_stats: { damage: 450, range: 162, attack_speed: 1.15, type: 'aoe' }
deploy_cost: 950
```

**Upgrades (6):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Aço de Krypton | Dano ×1.3 \| Vel ×1.1 | 600 |
| 2 | Visão de Raio X | Alcance ×1.25 \| Vel ×1.15 | 900 |
| 3 | Velocidade Kryptoniana | Dano ×1.4 \| Vel ×1.2 | 1.200 |
| 4 | Aura de Aço | Aura: +15%→+25% dano aliado | 1.500 |
| 5 | Visão de Calor Amplificada | CD: 20s→14s \| Dano: 3.000→5.500 | 1.800 |
| 6 | Homem de Aço | Dano ×1.8 \| Vel ×1.2 \| Aura: +35% \| Visão CD: 10s \| Dano: 8.000 | 2.400 |

**Prestígios:**
- **P1 — Invulnerabilidade:** 20% de chance de ignorar atordoamento da mecânica viva (destroços)
- **P5 — Calor de Krypton:** Visão de Calor também causa Burn (200 DPS / 3s) em todos os atingidos
- **P10 — Superman Prime:** aura sobe para `+50% dano`; Visão de Calor percorre os **dois caminhos** do Mundo 5 simultaneamente

---

### 8. Shazam (Billy Batson → Shazam)
**Conceito:** O personagem de maior payoff do jogo. Começa como Billy Batson, uma criança com stats piores que qualquer 3★. Cada ataque faz surgir uma letra de "SHAZAM" acima dele. Ao completar as 6 letras, transforma-se permanentemente no verdadeiro Shazam — o 5★ de maior dano base do update, porém mais fraco que uma eventual unidade 6★ futura.

**Passiva base — "SHAZAM!":**
Billy Batson começa com stats propositalmente fracos. Cada ataque revela uma letra: **S → H → A → Z → A → M**. Ao completar as 6, transforma-se permanentemente em Shazam com stats completamente diferentes.

**Passiva pós-transformação — "Raio do Olimpo":**
Cada ataque encadeia relâmpago para até 2 inimigos adicionais (50% dano). A cada 10 ataques invoca um **Raio do Olimpo**: 4.000 dano em AOE.

```
// Billy (pré-transformação)
base_stats: { damage: 45, range: 105, attack_speed: 2.5, type: 'single_target' }

// Shazam (pós-transformação — permanente)
base_stats: { damage: 550, range: 168, attack_speed: 1.02, type: 'aoe' }

deploy_cost: 1.100
```

> A transformação acontece no combate. Billy é propositalmente o personagem mais fraco em campo antes da transformação — o custo de 1.100 é o investimento no payoff.

**Upgrades (6) — afetam ambas as formas:**
| # | Nome | Efeito Billy | Efeito Shazam | Custo |
|---|------|-------------|---------------|-------|
| 1 | SHAZAM! | Vel ×1.3 (acelera transformação) | Dano ×1.25 | 650 |
| 2 | Poder de Salomão | Vel ×1.2 | Raio do Olimpo: 4k→5.5k | 950 |
| 3 | Força de Hércules | — | Dano ×1.4 | 1.200 |
| 4 | Coragem de Aquiles | Vel ×1.2 | Vel ×1.15 | 1.500 |
| 5 | Velocidade de Hermes | — | Vel ×1.2 \| CD Raio: 10s→7s | 1.800 |
| 6 | O Campeão | — | Dano ×1.8 \| Relâmpago: 3 alvos adicionais \| Raio: 8.500 | 2.500 |

**Prestígios:**
- **P1 — Proteção Mágica:** Shazam é imune ao atordoamento da mecânica viva (destroços)
- **P5 — Magia de Salomão:** relâmpagos encadeados têm 25% de chance de paralisar o alvo por 1s
- **P10 — Campeão Eterno:** ao completar a transformação, dispara automaticamente um Raio do Olimpo de 12.000 dano em TODOS os inimigos em campo

---

## 5★ Evolução

---

### 9. Flash Reverso (Eobard Thawne)
**Obtido via evolução:** Flash + materiais DC (similar ao Hulk Quebra-Mundo)  
**Não disponível no gacha direto.**

**Conceito:** Velocidade de ataque mais alta do jogo. Passiva "Velocidade Negativa" acumula stacks de lentidão nos inimigos — ao atingir 5, paralisa por 2s. Inimigos imunes a stun sofrem dano massivo no lugar.

**Passiva base — "Velocidade Negativa":**
Cada ataque acumula 1 stack de **Lentidão Negativa** no alvo.
- **5 stacks em inimigo comum:** **Paralisia** de 2s
- **5 stacks em inimigo `stun_immune`:** **5× dano base** instantâneo (sem paralisia)

```
base_stats: { damage: 480, range: 148, attack_speed: 0.55, type: 'linha' }
deploy_cost: — (evolução, não tem custo próprio de deploy)
evolution: {
  source: 'flash_barry',
  requires: [
    { id: 'flash_barry', quantity: 2 },
    { id: 'batgirl', quantity: 1 },
    { id: 'dc_material_3', quantity: 3 },
    { id: 'dc_material_2', quantity: 5 },
    { id: 'dc_material_1', quantity: 10 }
  ]
}
```

**Upgrades (5):**
| # | Nome | Efeito | Custo |
|---|------|--------|-------|
| 1 | Força Negativa | Dano ×1.3 \| Vel ×1.15 | 600 |
| 2 | Velocidade do Ódio | Stacks para paralisia: 5→4 | 900 |
| 3 | Singularidade Reversa | Paralisia: 2s→3s \| Dano stun_immune: 5×→7× | 1.200 |
| 4 | Paradoxo Temporal | Dano ×1.5 \| Vel ×1.2 | 1.500 |
| 5 | Professor Zoom | Dano ×1.8 \| Stacks: 4→3 \| Paralisia: 3.5s \| Dano stun_immune: 10× | 2.000 |

**Prestígios:**
- **P1 — Rastro de Ódio:** deixa rastro de dano atrás dos inimigos atingidos (100 DPS / 2s)
- **P5 — Linha do Tempo Corrompida:** inimigos que se recuperam da paralisia têm velocidade permanentemente reduzida em 25% pelo resto da fase
- **P10 — Velocidade Suprema:** cada ataque além do 3º stack adiciona +0.5s à paralisia (máx 6s)

---

## Materiais Drops (Mundo 5)

| ID | Nome | Rarity | Upgrade |
|----|------|--------|---------|
| `dc_material_1` | Material Cósmico I | 0 | → Material Cósmico II (3×) |
| `dc_material_2` | Material Cósmico II | 1 | → Material Cósmico III (3×) |
| `dc_material_3` | Material Cósmico III | 2 | — |

> Necessários para evoluir Flash → Flash Reverso e para upgrades de Shazam.

---

## Resumo de Sinergia

| Combo | Efeito |
|-------|--------|
| Batman + Batgirl | Marcas de ambos acumulam (P10 Batman). +20% dano para os dois. |
| Batman + qualquer DPS | Marca do Detetive amplifica todos os ataques aliados em até 40% |
| Superman + qualquer equipe | Aura global +15–35% dano para todo o time |
| Lois Lane + L | P5 de Lois (+30% gold/wave por farm aliada) torna as duas melhores do que cada uma sozinha |
| Flash Reverso + Batman | Inimigos marcados pelo Batman + paralisados pelo Flash Reverso = janela de dano massivo para toda a equipe |
| Shazam + GL | GL segura inimigos com barreiras enquanto Billy completa a transformação sem morrer |
