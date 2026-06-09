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
- **Equação Anti-Vida (passiva):** torres na linha de visão de Darkseid têm cooldown aumentado em `+0.5s` passivamente
- **Gravidade Omega (ativo a cada 20s):** cria zona de gravidade em área de `raio 8` por `4s` — inimigos dentro se movem `60%` mais rápido; torres dentro têm alcance reduzido em `30%`
- Ao atingir `20% HP`: invoca uma wave final de reforço (Unidade Omega ×3)

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
| `soldado_apokolips` | Soldado Apokolips | Normal | 750 | 1.0 | — |
| `paradem_comum` | Parademônio | Normal | 1.300 | 1.2 | — |
| `paradem_elite` | Parademônio Elite | Powerful 1 | 3.200 | 1.0 | Armadura: -10% dano físico |
| `unidade_omega` | Unidade Omega | Powerful 2 | 7.500 | 0.85 | Regenera 150 HP/s |
| `destruidor` | Destruidor | Elite | 18.000 | 0.7 | Imune a Slow/Freeze |
| `darkseid` | Darkseid | Boss | 220.000 | 0.5 | Ver seção Boss |

### Materiais Drops (Mundo 5)

| ID | Nome | Rarity | Upgrade |
|----|------|--------|---------|
| `dc_material_1` | Material Cósmico I | 0 | → Material Cósmico II (3×) |
| `dc_material_2` | Material Cósmico II | 1 | → Material Cósmico III (3×) |
| `dc_material_3` | Material Cósmico III | 2 | — |

---

## 5. Próximas Partes do Planejamento

- **Parte 2:** Personagens jogáveis DC (8 unidades, raridades 3★–5★, passivas, upgrades)
- **Parte 3:** Inimigos detalhados (stats por dificuldade, wave templates das 6 fases)
- **Parte 4:** Evento DC (paralelo ao update, similar à Operação Ressurreição)
- **Parte 5:** Implementação técnica (mudanças em `world.js`, `game.js`, `game-renderer.js`)
