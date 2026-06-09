# Update 3 — Crise nas Infinitas Terras

> **Status:** Planejamento  
> **Tema:** DC Universe  
> **Referência README:** "Update 3: Crise nas Infinitas Terras"

---

## 1. Visão Geral

O universo DC entra em Battlestar Popnime com o quinto mundo jogável: **Metrópolis Sitiada**. Diferente dos mundos anteriores, este introduce dois avanços estruturais inéditos no jogo:

- **Caminhos que se cruzam** — o mapa tem duas rotas que se intersectam, criando zonas de cobertura dupla e obrigando o jogador a pensar em posicionamento estratégico diferente
- **Mecânica viva** — eventos ambientais acontecem *durante* as waves, alterando o estado do campo em tempo real

O antagonista principal é **Darkseid**, boss final do mundo. O update acompanha 8 novos personagens jogáveis do universo DC.

---

## 2. Mundo 5 — Metrópolis Sitiada

### Identidade Visual
- Cenário urbano futurista sob ataque: arranha-céus, fumaça, clarões de energia
- Paleta: cinza-aço, laranja de explosão, azul elétrico (Força da Velocidade), dourado (Superman)
- BGM sugerida: épica orquestral com batidas de ação (contraste com o cosmic do menu)

### Campo — Caminhos que se Cruzam

O mapa usa **dois caminhos independentes** que se intersectam em dois pontos. Inimigos alternados emergem por rotas diferentes, forçando cobertura de múltiplas direções.

**Estrutura técnica:**
O engine atual usa um único `PATH_POINTS` por mundo. Para suportar dois caminhos, será necessário:
- Adicionar `PATH_POINTS_W5_A` e `PATH_POINTS_W5_B` em `world.js`
- No `game.js`, adaptar o spawn para distribuir inimigos entre os dois paths (ex.: inimigos ímpares → path A, pares → path B, ou grupos por wave)
- As torres cobrem os dois caminhos normalmente pelo alcance (range circular)
- O cruzamento é **visual e estratégico**: torres na interseção cobrem ambos os fluxos

**Rascunho dos waypoints (canvas 1024×600):**

```
PATH_POINTS_W5_A (rota superior):
  entrada: (-20, 150)
  → (150, 150) → (150, 350) → (400, 350)   ← cruzamento 1
  → (400, 150) → (650, 150)                  ← cruzamento 2
  → (650, 400) → (870, 400) → (1044, 400)

PATH_POINTS_W5_B (rota inferior):
  entrada: (-20, 450)
  → (200, 450) → (400, 450) → (400, 350)   ← cruzamento 1
  → (600, 350) → (650, 150)                  ← cruzamento 2
  → (800, 150) → (900, 300) → (1044, 300)
```

> Os dois caminhos convergem nos pontos `(400, 350)` e `(650, 150)`, depois divergem novamente. Torres posicionadas nesses cruzamentos atacam inimigos das duas rotas simultaneamente.

### Fases (6 fases, 10 waves cada)

> HP calibrado pelo [Guia de Balanceamento](../balanceamento.md) — W5 aplica multiplicador **1.35×** sobre Marvel (W4).
> Lacaios W1–5: 700–1.600 HP | W6–10: 2.700–9.500 HP | Boss Normal: 190k–300k HP

| # | Nome | Inimigos principais | Mini-Boss (W10) |
|---|------|---------------------|-----------------|
| 1 | Invasão de Metrópolis | Soldado Apokolips | Granny Goodness |
| 2 | As Ruas em Chamas | Soldado Apokolips + Parademônio | Kalibak |
| 3 | O Escudo Caiu | Parademônio + Parademônio Elite | Steppenwolf |
| 4 | Equação Anti-Vida | Parademônio Elite + Unidade Omega | Mantis |
| 5 | Linha de Frente | Unidade Omega + Destruidor | Desaad |
| 6 | Convergência Final | Horda mista + Destruidor | **Darkseid** (Boss Final) |

### Boss Final — Darkseid, O Tirano de Apokolips

**HP Base:** `220.000` (Normal) | `680.000` (Lendário)
> Calibrado: jogador W5 tem ~50.000–60.000 DPS. Boss Normal morre em ~4s de burst focado — tenso mas viável sem farm perfeito.

**Fase 1 — Armadura Omega (100% → 60% HP):**
- **Passiva: Armadura Omega** — redução de `20%` de todo dano recebido
- **Omega Beams (ativo a cada 15s):** raio de energia que percorre um dos dois caminhos do início ao fim, atordoando todas as torres no caminho por `3s`

**Fase 2 — Equação Anti-Vida (60% → 0% HP):**
- Armadura Omega removida. Darkseid entra em fúria
- **Equação Anti-Vida (passiva — o núcleo da fase):**
  - A cada segundo que Darkseid permanece vivo, todas as torres perdem **1.5% de dano e 1.5% de velocidade de ataque**
  - O debuff acumula até um cap de **−50%** por torre (atingido em ~33 segundos)
  - Quando qualquer torre atinge o cap de 50%, Darkseid começa a **regenerar vida**:
    - Cura = `torresTorresCap × 6.67%` do HP máximo da Fase 2 a cada 5 segundos
    - 1 torre no cap → ~7% (≈11.200 HP) a cada 5s
    - 3 torres no cap → 20% (≈32.000 HP) a cada 5s
    - 6 torres no cap → ~40% (≈64.000 HP) a cada 5s
  - Ao morrer: todos os debuffs das torres são removidos imediatamente
- **Gravidade Omega (ativo a cada 20s):** cria zona de gravidade em área de `raio 8` por `4s` — inimigos dentro se movem `60%` mais rápido; torres dentro têm alcance reduzido em `30%`
- Ao atingir `20% HP`: invoca uma wave final de reforço (Unidade Omega ×3)

> **Tensão de design:** o jogador tem ~33s para matar Darkseid antes das torres começarem a alimentar a cura dele. Com 3+ torres no cap, a cura pode superar o DPS médio do jogador, forçando uso de actives (Gojo, Viúva Negra) ou sacrifício de posicionamento.

---

## 3. Mecânica Viva — Ruínas de Metrópolis

### Conceito
Durante as fases do Mundo 5, **eventos ambientais** ocorrem em intervalos semi-aleatórios, alterando o campo sem depender das waves de inimigos. É o primeiro mundo com esse sistema.

### Evento: Queda de Destroços

**Trigger:** a cada `45–75s` (intervalo aleatório), um destroço de arranha-céu cai em uma posição aleatória do campo.

**Mecânica:**
1. Aviso visual `2s` antes: sombra no chão na posição de impacto (círculo vermelho piscando)
2. Impacto: explosão visual + efeito de tela
3. **Efeito:** torres dentro do raio de impacto (`raio 4`) ficam atordoadas por `2.5s`
4. Torres com **Prestígio 5+** têm `50%` de chance de ignorar o atordoamento

**Implementação sugerida (`game.js`):**
```js
// No loop principal, checar timer de debris
if (debrisTimer <= 0 && currentWorld === 'dc') {
  triggerDebrisFall();
  debrisTimer = 45 + Math.random() * 30; // 45–75s
}
```

### Variações por Fase (escala de intensidade)

| Fase | Frequência | Raio de Impacto | Stun Duration |
|------|-----------|----------------|---------------|
| 1–2 | 60–90s | 3 | 2s |
| 3–4 | 45–75s | 4 | 2.5s |
| 5–6 | 30–60s | 5 | 3s |

### Evento Secundário: Falha na Grade Elétrica (Fases 4–6)

**Trigger:** quando um inimigo do tipo Destruidor atravessa o cruzamento dos caminhos.

**Efeito:** blackout local de `3s` — torres numa faixa horizontal do mapa têm alcance visual reduzido para `50%` temporariamente (efeito cosmético + funcional).

> Esses dois eventos foram desenhados para serem **anunciados com antecedência** (efeito de aviso), nunca surpreendendo o jogador de forma injusta.

---

## 4. Inimigos do Mundo 5

HP baseado no multiplicador 1.35× sobre Marvel. Ver [Guia de Balanceamento](../balanceamento.md).

| ID | Nome | Tipo | HP (Normal) | Velocidade | Habilidade |
|----|------|------|-------------|------------|------------|
| `soldado_apokolips` | Soldado Apokolips | Normal | 2.000 | 85 | — |
| `paradem_comum` | Parademônio | Speed | 2.500 | 155 | — |
| `paradem_elite` | Parademônio Elite | Fortified + Shield 12k | 27.000 | 50 | — |
| `unidade_omega` | Unidade Omega | Regen 280/s | 32.000 | 40 | — |
| `destruidor` | Destruidor | Bomber + Stun Immune | 1.800 | 120 | Radius 140, stun 2s |
| `darkseid` | Darkseid | Boss (2 fases) | 220k + 160k | 20 / 45 | Ver seção Boss + [Parte 3](update3_dc_inimigos_waves.md) |

> Valores calibrados a partir dos stats reais da Marvel (W4) × 1.35. Ver [Parte 3](update3_dc_inimigos_waves.md) para `enemies.js` completo.

### Materiais Drops (Mundo 5)

| ID | Nome | Rarity | Upgrade |
|----|------|--------|---------|
| `dc_material_1` | Material Cósmico I | 0 | → Material Cósmico II (3×) |
| `dc_material_2` | Material Cósmico II | 1 | → Material Cósmico III (3×) |
| `dc_material_3` | Material Cósmico III | 2 | — |

---

## 5. Partes do Planejamento

- ✅ **Parte 1:** Mundo, mecânicas, boss, fases — este arquivo
- ✅ **Parte 2:** [Personagens jogáveis DC](update3_dc_personagens.md) — 9 unidades, raridades 3★–5★, passivas, upgrades
- ✅ **Parte 3:** [Inimigos e Wave Templates](update3_dc_inimigos_waves.md) — stats calibrados, `enemies.js`, wave por fase
- ~~Parte 4: Evento DC~~ — cancelado; o evento será no Update 4 cruzando DC × Marvel
- ✅ **Especial:** [Darkseid 7★ Secreto](darkseid_7star_secreto.md) — raridade oculta, 6 passivas, chance 0.0005%
- ⬜ **Parte 4:** Implementação técnica (mudanças em `world.js`, `game.js`, `game-renderer.js`)
