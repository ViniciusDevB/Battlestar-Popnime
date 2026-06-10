# Personagem: Superman (Mergulho Solar) ★★★★★★

> Documento de design. Não implementar sem decisão explícita.

---

## Identidade

| Campo | Valor |
|---|---|
| ID | `superman_solar` |
| Raridade | 6★ (exclusivo de evento) |
| Série | DC |
| Papel | Suporte Supremo / Âncora de Defesa |
| Fonte | Loja de Convergência — Evento: Colapso Multiversal |
| Custo (fragmentos) | A balancear — deve ser a recompensa de maior custo da loja |
| Limite por conta | 1 unidade |

**Filosofia de design:** Superman não é um DPS. Ele não mata nada sozinho. Seu valor está em tornar o time ao redor dele exponencialmente mais eficiente. O jogador que posicionar Superman mal ou solo não vai sentir diferença. O que posicionar corretamente vai sentir como se todas as suas outras torres subiram de estrela.

---

## Ataque Base — Visão de Calor Contínua

- **Tipo:** Raio contínuo (beam), single-target.
- **Dano:** Intencionalmente ínfimo — nunca deve ser a causa da morte de um inimigo.
- **Alvo automático:** Sempre foca no inimigo com o **maior HP máximo** dentro do alcance, ignorando o comportamento de targeting padrão (`first`, `last`, etc.).
- **Propósito mecânico:** O beam é o gatilho para todas as passivas. Sem ele ativo e travado no alvo, Superman não faz nada.
- **Interrupção:** O beam se quebra se Superman ficar inativo (ver Mártir Indestrutível) ou se o alvo morrer/sair do alcance. Ao quebrar, todos os efeitos acumulados zeram.

### Notas de implementação

O beam deve ser renderizado como um raio fino e constante (similar ao tsunami, mas sem dano em área). A cada tick de ataque, em vez de disparar um projétil, verifica se o mesmo alvo ainda está no alcance. Se estiver, aplica os efeitos de passiva diretamente no inimigo.

```js
// Pseudocódigo — lógica de targeting do beam
tower._beamTarget = aliveEnemies
  .filter(e => distSq(tower, e) <= tower.rangeSq)
  .sort((a, b) => b.maxHp - a.maxHp)[0] || null;
```

---

## Passivas Iniciais (Desbloqueadas na criação)

---

### Passiva 1 — Símbolo da Esperança (Aura de Vantagem)

**Efeito:** Todas as torres aliadas dentro do raio de Superman recebem o status **Vantagem**.

**O que é Vantagem:** Sempre que uma torre com Vantagem rolar uma chance — seja de passiva, crítico, ou qualquer proc baseado em porcentagem — o motor do jogo calcula o roll **duas vezes** e aplica o **melhor resultado** (o que for mais favorável ao jogador).

**Alcance da aura:** Raio separado do alcance do beam (pode ser maior). A definir durante balanceamento — sugestão inicial: ~30–40% maior que o alcance do ataque.

**Visual:** Halo dourado pulsando ao redor do Superman. Torres dentro do raio ganham um brilho sutil (tint amarelo claro).

#### Notas de implementação

Vantagem funciona como um flag `tower.hasAdvantage = true` setado enquanto a torre estiver dentro do raio da aura. O motor de passivas precisa de um hook genérico:

```js
function rollChance(chance, tower) {
  const r1 = Math.random() < chance;
  if (!tower.hasAdvantage) return r1;
  const r2 = Math.random() < chance;
  return r1 || r2; // aplica o melhor (true > false)
}
```

Todas as passivas que hoje fazem `Math.random() < chance` devem passar por `rollChance()`. Isso garante que Vantagem funciona com qualquer passiva presente e futura sem modificação individual.

**Sinergia intencional:** Projetada especificamente para potencializar Ichigo (Bankai) — cujas passivas de slice têm chances percentuais. Com Vantagem, as procs de Ichigo praticamente dobram de frequência.

---

### Passiva 2 — Mártir Indestrutível (Para-raios)

**Efeito:** Sempre que um chefe aplicar um debuff **global** ou **em área** (stun em torres, silence, slow de aura), Superman atrai o efeito **totalmente para si mesmo**.

- Todas as outras torres ficam **imunes** ao efeito naquele cast.
- Superman fica **inativo** durante a duração do debuff absorvido.
- Enquanto inativo: beam se quebra, aura de Vantagem é suspensa, Foco de Concentração reseta.

**Condição de ativação:** Apenas debuffs com origem em chefes e com flag `isAreaDebuff: true` ou `isGlobalDebuff: true` nos dados do inimigo. Debuffs single-target normais não são absorvidos.

#### Notas de implementação

No sistema de aplicação de debuffs de chefes:

```js
function applyBossDebuff(debuff, towers) {
  const superman = towers.find(t => t.charId === 'superman_solar' && !t.inactive);
  if (superman && (debuff.isAreaDebuff || debuff.isGlobalDebuff)) {
    applyDebuffToTower(debuff, superman);
    superman.inactive = true;
    superman._inactiveDuration = debuff.duration;
    return; // outras torres não recebem nada
  }
  towers.forEach(t => applyDebuffToTower(debuff, t));
}
```

**Risco de design:** Superman pode ficar inativo em momentos críticos. Isso é intencional — o custo de ser Para-raios é perder o suporte temporariamente. O jogador deve compensar com outras torres de suporte ou aceitar a janela de vulnerabilidade.

---

### Passiva 3 — Foco de Concentração (Vulnerabilidade Acumulada)

**Efeito:** Enquanto o beam estiver travado continuamente no **mesmo inimigo**, esse inimigo acumula stacks de **Vulnerabilidade** a cada segundo.

| Stacks | Aumento de dano recebido |
|---|---|
| 1 | +5% |
| 2 | +10% |
| 3 | +16% |
| 4 | +23% |
| 5 (cap) | +30% |

- A cada segundo de beam contínuo no mesmo alvo: +1 stack (até cap 5).
- O bônus se aplica a **todas as fontes de dano** recebidas pelo inimigo afetado.
- **Condição de reset:** Se o beam for interrompido por qualquer motivo (alvo morreu, saiu do alcance, Superman ficou inativo por Mártir), todos os stacks zeram instantaneamente.

**Interação com Mártir:** Superman absorve um stun → fica inativo → beam quebra → stacks de Vulnerabilidade zeram. O jogador perde o buildup. Isso cria uma tensão estratégica real entre usar Superman como Para-raios vs. manter o Foco ativo.

#### Notas de implementação

```js
// No tick do beam, se mesmo alvo do frame anterior:
if (tower._beamTarget && tower._beamTarget === tower._lastBeamTarget) {
  tower._concentrationTimer = (tower._concentrationTimer || 0) + dt;
  if (tower._concentrationTimer >= 1000) { // 1 segundo
    tower._concentrationTimer = 0;
    tower._beamTarget.vulnerabilityStacks = Math.min(
      (tower._beamTarget.vulnerabilityStacks || 0) + 1, 5
    );
  }
} else {
  // Alvo mudou ou beam quebrou — reseta tudo
  if (tower._lastBeamTarget) {
    tower._lastBeamTarget.vulnerabilityStacks = 0;
  }
  tower._concentrationTimer = 0;
}
tower._lastBeamTarget = tower._beamTarget;
```

No `dealDamage`, multiplicar dano pelo fator de Vulnerabilidade:

```js
const vulnMult = 1 + (enemy.vulnerabilityStacks || 0) * 0.06; // aprox. escala acima
finalDamage *= vulnMult;
```

---

## Passiva de Prestígio — P10: Absorção Solar

**Desbloqueada em:** Prestígio 10 (requer 10 cópias de Superman — altíssimo custo, reforça exclusividade).

**Efeito:** Enquanto o beam está ativo em um alvo, esse inimigo recebe o debuff **Armadura Derretida**.

- Todo o dano recebido pelo inimigo marcado **ignora resistências** (tags de resistência a tipos de dano).
- Todo o dano recebido **ignora escudos Fortified** — torres atacam o HP diretamente, sem precisar quebrar o escudo primeiro.
- O debuff persiste enquanto o beam estiver ativo. Quebrou o beam → debuff some imediatamente.

**Por que P10 e não menor:** Armadura Derretida + Vulnerabilidade no mesmo alvo cria uma janela de dano absurda. Contra um boss com Fortified e resistência, isso pode dobrar ou triplicar o DPS efetivo do time. Essa passiva deve ser rara o suficiente para nunca ser padrão no meta — apenas para os jogadores mais dedicados.

---

## Perfil de Balanceamento

| Atributo | Valor sugerido | Justificativa |
|---|---|---|
| Alcance do beam | Médio (similar a Naruto Shippuden) | Não deve cobrir o mapa inteiro |
| Alcance da aura (Símbolo) | +35% do alcance do beam | Deve cobrir 2–3 torres adjacentes |
| Dano do beam | ~5% de um DPS padrão | Literalmente irrelevante |
| Custo de deploy | Alto (acima dos 5★) | 6★ deve ser investimento sério |
| Custo de upgrade | A definir | Cada upgrade amplia alcance da aura, não o dano |

### Cenário de uso ideal

```
[Ichigo Bankai] [Gojo Satoru] [Superman ☀] [Luffy G5] [Torre DPS]
                              ↑ aura cobre os adjacentes
                              ↑ beam trava no boss
                              → Ichigo tem Vantagem (procs dobrados)
                              → Boss com Vulnerabilidade 5 stacks (+30% dano)
                              → Superman absorve o stun do boss no turno crítico
```

---

## Pontos em Aberto

- [ ] Valor exato de dano do beam (mínimo que não quebre o balanceamento ao matar um inimigo fraco antes do tempo)
- [ ] Alcance numérico da aura vs. alcance do beam
- [ ] Custo em fragmentos na Loja de Convergência
- [ ] Visual do beam (cor, espessura, partículas)
- [ ] Custo e escalada de upgrades (o que cada nível de upgrade melhora?)
- [ ] Interação com o sistema de Prestígio existente (Superman precisa de entrada em `PRESTIGE_CONFIG`?)
- [ ] Comportamento do beam quando há dois targets com mesmo HP máximo (desempate por distância?)
