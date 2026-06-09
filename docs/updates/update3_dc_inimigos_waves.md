# Update 3 — Inimigos, Mini-Bosses e Wave Templates (Parte 3)

> **Multiplicador W5:** 1.35× sobre Marvel (W4) em HP e gold  
> **Referência:** [Guia de Balanceamento](../balanceamento.md) | [Parte 1](update3_dc.md)

---

## 1. Inimigos Base

Cada fase introduz um novo tipo de inimigo que permanece nas fases seguintes, assim como na Marvel.

### Tabela Completa de Inimigos

| ID | Nome | HP | Speed | Gold | Tipo | Mecânica | Introduzido |
|----|------|----|-------|------|------|----------|-------------|
| `soldado_apokolips` | Soldado Apokolips | 2.000 | 85 | 70 | normal | — | Fase 1 |
| `paradem_comum` | Parademônio | 2.500 | 155 | 190 | powerful1 + speed | — | Fase 2 |
| `paradem_elite` | Parademônio Elite | 27.000 | 50 | 1.600 | powerful2 + fortified | shieldHp: 12.000 | Fase 3 |
| `unidade_omega` | Unidade Omega | 32.000 | 40 | 1.900 | powerful2 + regenerator | regenRate: 280 | Fase 4 |
| `destruidor` | Destruidor | 1.800 | 120 | 100 | powerful1 + bomber | bomberRadius: 140, bomberStun: 2.0, **stun_immune** | Fase 5 |

> `destruidor` é o único inimigo comum com `stun_immune` no mundo — ativa a mecânica de dano alternativo do Flash Reverso (5× base ao invés de paralisia).

### Definições para `enemies.js`

```js
// ── Soldado Apokolips (Fase 1+) ─────────────────────────────────────────
soldado_apokolips: {
  name: 'Soldado Apokolips', hp: 2000, speed: 85, gold: 70,
  ptype: 'normal', size: 22, col: '#374151',
  image: 'assets/inimigos/world5/Soldado Apokolips.png'
},

// ── Parademônio (Fase 2+) ───────────────────────────────────────────────
paradem_comum: {
  name: 'Parademônio', hp: 2500, speed: 155, gold: 190,
  ptype: ['powerful1', 'speed'], size: 17, col: '#4b5563',
  image: 'assets/inimigos/world5/Paradem Common.png'
},

// ── Parademônio Elite (Fase 3+) ─────────────────────────────────────────
paradem_elite: {
  name: 'Parademônio Elite', hp: 27000, speed: 50, gold: 1600,
  ptype: ['powerful2', 'fortified'], shieldHp: 12000,
  size: 38, col: '#1f2937',
  image: 'assets/inimigos/world5/Paradem Elite.png'
},

// ── Unidade Omega (Fase 4+) ─────────────────────────────────────────────
unidade_omega: {
  name: 'Unidade Omega', hp: 32000, speed: 40, gold: 1900,
  ptype: ['powerful2', 'regenerator'], regenRate: 280,
  size: 38, col: '#1e3a5f',
  image: 'assets/inimigos/world5/Unidade Omega.png'
},

// ── Destruidor (Fase 5+) ────────────────────────────────────────────────
destruidor: {
  name: 'Destruidor', hp: 1800, speed: 120, gold: 100,
  ptype: ['powerful1', 'bomber', 'stun_immune'],
  bomberRadius: 140, bomberStun: 2.0,
  size: 20, col: '#b45309',
  image: 'assets/inimigos/world5/Destruidor.png'
},
```

---

## 2. Mini-Bosses (W10 das Fases 1–5)

Escalonamento de HP segue a mesma curva da Marvel (cada mini-boss ~35% mais forte que o anterior).

| # | Nome | HP | Speed | Gold | Mecânica Especial |
|---|------|----|-------|------|-------------------|
| F1 | Granny Goodness | 27.000 | 95 | 1.200 | Invoca Furies (2× `soldado_apokolips`) a cada 15s |
| F2 | Kalibak | 40.000 | 65 | 2.000 | Berserk: ao atingir 50% HP, speed ×1.8 + dano base aumentado |
| F3 | Steppenwolf | 55.000 | 50 | 3.000 | Escudo de Axe-Blade: shieldHp 25.000 | ao morrer invoca 4× `paradem_comum` |
| F4 | Mantis | 70.000 | 55 | 4.200 | Controle Mental: a cada 20s, paralisa a torre mais próxima por 4s |
| F5 | DeSaad | 90.000 | 48 | 5.500 | Tortura: a cada 18s, reduz dano de todas as torres em alcance de 12 em 35% por 5s |

### Especials para `enemies.js`

```js
// ── Granny Goodness — Fase 1 ────────────────────────────────────────────
granny_goodness_special: {
  onInterval(enemy, ctx) {           // invoca Female Furies
    if (enemy.furiesTimer <= 0) {
      for (let i = 0; i < 2; i++)
        ctx.spawnEnemy('soldado_apokolips', enemy, { dist: Math.max(0, enemy.dist - i * 30) });
      enemy.furiesTimer = 15;
    }
  }
},
granny_goodness: {
  name: 'Granny Goodness', hp: 27000, speed: 95, gold: 1200,
  ptype: 'powerful2', size: 40, col: '#78350f',
  is_miniboss: true, special: 'granny_goodness_special',
  furiesTimer: 15,
  image: 'assets/inimigos/world5/Granny Goodness.png'
},

// ── Kalibak — Fase 2 ────────────────────────────────────────────────────
kalibak_special: {
  onHpThreshold(enemy, ctx, pct) {
    if (pct <= 0.5 && !enemy.berserk) {
      enemy.berserk = true;
      enemy.speed *= 1.8;
      ctx.addEffect({ type: 'shockwave', x: enemy.x, y: enemy.y, maxR: 60, color: '#b91c1c', timer: 0.5, maxTimer: 0.5 });
    }
  }
},
kalibak: {
  name: 'Kalibak', hp: 40000, speed: 65, gold: 2000,
  ptype: ['powerful2', 'fortified'], shieldHp: 18000,
  size: 44, col: '#1c1917', is_miniboss: true,
  special: 'kalibak_special',
  image: 'assets/inimigos/world5/Kalibak.png'
},

// ── Steppenwolf — Fase 3 ────────────────────────────────────────────────
steppenwolf: {
  name: 'Steppenwolf', hp: 55000, speed: 50, gold: 3000,
  ptype: ['powerful2', 'fortified'], shieldHp: 25000,
  size: 46, col: '#1e1b4b', is_miniboss: true,
  special: 'steppenwolf_special',
  on_death: { type: 'paradem_comum', count: 4 },
  image: 'assets/inimigos/world5/Steppenwolf.png'
},

// ── Mantis — Fase 4 ─────────────────────────────────────────────────────
mantis_special: {
  onInterval(enemy, ctx) {
    if (enemy.mindTimer <= 0) {
      const t = ctx.getNearestTower(enemy.x, enemy.y);
      if (t) { t.stunned = true; t.stunTimer = 4.0; }
      enemy.mindTimer = 20;
    }
  }
},
mantis: {
  name: 'Mantis', hp: 70000, speed: 55, gold: 4200,
  ptype: ['powerful3', 'regenerator'], regenRate: 350,
  size: 46, col: '#1e3a5f', is_miniboss: true,
  special: 'mantis_special',
  mindTimer: 20,
  image: 'assets/inimigos/world5/Mantis.png'
},

// ── DeSaad — Fase 5 ─────────────────────────────────────────────────────
desaad_special: {
  onInterval(enemy, ctx) {
    if (enemy.tortureTimer <= 0) {
      ctx.getTowersInRadius(enemy.x, enemy.y, 12).forEach(t => {
        t.damageMult = (t.damageMult || 1) * 0.65;
        t.tortureEndTimer = 5.0;
      });
      enemy.tortureTimer = 18;
    }
  }
},
desaad: {
  name: 'DeSaad', hp: 90000, speed: 48, gold: 5500,
  ptype: 'powerful3', size: 46, col: '#4a044e', is_miniboss: true,
  special: 'desaad_special',
  tortureTimer: 18,
  image: 'assets/inimigos/world5/DeSaad.png'
},
```

---

## 3. Boss Final — Darkseid

Duas fases, assim como o Thanos. Fase 1 vira Fase 2 ao morrer via `on_death`.

```js
// ── Darkseid — Fase 1: Armadura Omega ───────────────────────────────────
darkseid_omega_special: {
  onInterval(enemy, ctx) {
    // Omega Beams: percorre um caminho inteiro atordoando torres
    if (enemy.beamTimer <= 0) {
      ctx.fireDarkseidBeam();   // novo método em game.js — varre path A ou B
      enemy.beamTimer = 15;
    }
    // Base drain
    if (enemy.drainTimer <= 0) {
      ctx.drainBase(2);
      enemy.drainTimer = 3;
    }
  }
},
darkseid_fase1: {
  name: 'Darkseid — Armadura Omega', hp: 220000, speed: 20, gold: 12000,
  ptype: ['powerful3', 'fortified'], shieldHp: 0,
  damageMult: 0.80,    // Armadura Omega: 20% redução passiva de dano
  size: 60, col: '#1e1b4b', is_boss: true,
  special: 'darkseid_omega_special',
  on_death: { type: 'darkseid_equacao', count: 1 },
  beamTimer: 15, drainTimer: 3,
  image: 'assets/inimigos/world5/Darkseid.png'
},

// ── Darkseid — Fase 2: Equação Anti-Vida ────────────────────────────────
//
// MECÂNICA CENTRAL — Equação Anti-Vida:
//   A cada segundo vivo, todas as torres perdem 1.5% de dano e ataque.
//   Cap: −50% (atingido em ~33s). Quando uma torre chega ao cap,
//   Darkseid passa a curar: cappedTowers × 6.67% do maxHp a cada 5s.
//   Ao morrer, remove todos os debuffs instantaneamente.
//
darkseid_equacao_special: {
  onTick(enemy, ctx, dt) {
    // ── Equação Anti-Vida: debuff acumulado por segundo ───────────────
    enemy.debuffAccum = (enemy.debuffAccum || 0) + dt;
    if (enemy.debuffAccum >= 1) {
      enemy.debuffAccum -= 1;

      ctx.getAllTowers().forEach(tower => {
        if (tower.equacaoDebuff === undefined) tower.equacaoDebuff = 0;
        if (tower.equacaoDebuff < 0.50) {
          tower.equacaoDebuff = Math.min(0.50, tower.equacaoDebuff + 0.015);
          tower.damageMult      = 1 - tower.equacaoDebuff;
          tower.attackSpeedMult = 1 - tower.equacaoDebuff;
        }
      });

      // ── Cura baseada em torres no cap ─────────────────────────────
      const cappedTowers = ctx.getAllTowers()
        .filter(t => (t.equacaoDebuff || 0) >= 0.50).length;

      if (cappedTowers > 0) {
        enemy.healAccum = (enemy.healAccum || 0) + 1;
        if (enemy.healAccum >= 5) {
          enemy.healAccum -= 5;
          const healPct = cappedTowers * 0.0667;  // ~6.67% por torre no cap
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * healPct);
        }
      }
    }

    // ── Gravidade Omega a cada 20s ────────────────────────────────────
    enemy.gravTimer = (enemy.gravTimer ?? 20) - dt;
    if (enemy.gravTimer <= 0) {
      ctx.createGravityZone(enemy.x, enemy.y, 8, 4.0);
      enemy.gravTimer = 20;
    }
  },

  onHpThreshold(enemy, ctx, pct) {
    if (pct <= 0.20 && !enemy.finalWaveSpawned) {
      enemy.finalWaveSpawned = true;
      for (let i = 0; i < 3; i++)
        ctx.spawnEnemy('unidade_omega', enemy, { dist: Math.max(0, enemy.dist - i * 40) });
    }
  },

  onDeath(enemy, ctx) {
    // Remove todos os debuffs ao Darkseid morrer
    ctx.getAllTowers().forEach(tower => {
      tower.equacaoDebuff   = 0;
      tower.damageMult      = 1;
      tower.attackSpeedMult = 1;
    });
  }
},
darkseid_equacao: {
  name: 'Darkseid — Equação Anti-Vida', hp: 160000, speed: 45, gold: 8000,
  ptype: 'powerful3',
  size: 60, col: '#3b0764', is_boss: true,
  special: 'darkseid_equacao_special',
  image: 'assets/inimigos/world5/Darkseid Full Power.png'
},
```

> **HP Total de Darkseid:** 220.000 + 160.000 = **380.000 HP** (Normal)  
> **Lendário:** multiplique ambas as fases por 3.0 → **1.140.000 HP total**

---

## 4. Wave Templates — 6 Fases

Segue a estrutura da Marvel: cada fase introduz um novo tipo de inimigo que permanece nas seguintes.

---

### DC Fase 1 — Invasão de Metrópolis
*Apenas `soldado_apokolips`. Mini-Boss W10: Granny Goodness.*

```js
{
  id: 'dc_fase1', name: 'Invasão de Metrópolis', world: 'dc',
  drops: [
    { id: 'dc_material_1', chance: 70 },
    { id: 'dc_material_2', chance: 20 },
    { id: 'dc_material_3', chance: 10 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:6,gap:1.6}]),
    buildWave([{type:'soldado_apokolips',count:7,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:8,gap:1.4}]),
    buildWave([{type:'soldado_apokolips',count:9,gap:1.3}]),
    buildWave([{type:'soldado_apokolips',count:10,gap:1.3}]),
    buildWave([{type:'soldado_apokolips',count:10,gap:1.2}]),
    buildWave([{type:'soldado_apokolips',count:11,gap:1.1}]),
    buildWave([{type:'soldado_apokolips',count:13,gap:1.0}]),
    buildWave([{type:'soldado_apokolips',count:15,gap:0.9}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.3},{type:'granny_goodness',count:1,gap:0}])
  ]
},
```

---

### DC Fase 2 — As Ruas em Chamas
*Introduz `paradem_comum` (speed). Mini-Boss W10: Kalibak.*

```js
{
  id: 'dc_fase2', name: 'As Ruas em Chamas', world: 'dc',
  drops: [
    { id: 'dc_material_1', chance: 50 },
    { id: 'dc_material_2', chance: 30 },
    { id: 'dc_material_3', chance: 15 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:7,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:8,gap:1.4}]),
    buildWave([{type:'soldado_apokolips',count:9,gap:1.3}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.3},{type:'paradem_comum',count:2,gap:0.8}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.2},{type:'paradem_comum',count:3,gap:0.7}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:4,gap:0.7}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.1},{type:'paradem_comum',count:5,gap:0.6}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:5,gap:0.6}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.0},{type:'paradem_comum',count:6,gap:0.5}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.2},{type:'paradem_comum',count:2,gap:0.7},{type:'kalibak',count:1,gap:0}])
  ]
},
```

---

### DC Fase 3 — O Escudo Caiu
*Introduz `paradem_elite` (fortified). Mini-Boss W10: Steppenwolf.*

```js
{
  id: 'dc_fase3', name: 'O Escudo Caiu', world: 'dc',
  drops: [
    { id: 'dc_material_2', chance: 50 },
    { id: 'dc_material_3', chance: 40 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:8,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:9,gap:1.4}]),
    buildWave([{type:'soldado_apokolips',count:10,gap:1.3}]),
    buildWave([{type:'soldado_apokolips',count:7,gap:1.3},{type:'paradem_comum',count:3,gap:0.8}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.2},{type:'paradem_comum',count:4,gap:0.7}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.1},{type:'paradem_comum',count:4,gap:0.7}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:4,gap:0.7},{type:'paradem_elite',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.0},{type:'paradem_comum',count:4,gap:0.6},{type:'paradem_elite',count:2,gap:11.0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:4,gap:0.6},{type:'paradem_elite',count:3,gap:10.0}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.2},{type:'paradem_comum',count:2,gap:0.7},{type:'paradem_elite',count:1,gap:0},{type:'steppenwolf',count:1,gap:0}])
  ]
},
```

---

### DC Fase 4 — Equação Anti-Vida
*Introduz `unidade_omega` (regen). Mini-Boss W10: Mantis.*

```js
{
  id: 'dc_fase4', name: 'Equação Anti-Vida', world: 'dc',
  drops: [
    { id: 'dc_material_2', chance: 20 },
    { id: 'dc_material_3', chance: 70 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:8,gap:1.4},{type:'paradem_comum',count:2,gap:0.9}]),
    buildWave([{type:'soldado_apokolips',count:8,gap:1.3},{type:'paradem_comum',count:3,gap:0.8}]),
    buildWave([{type:'soldado_apokolips',count:7,gap:1.2},{type:'paradem_comum',count:3,gap:0.8},{type:'paradem_elite',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.2},{type:'paradem_comum',count:3,gap:0.7},{type:'paradem_elite',count:2,gap:11.0}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.1},{type:'paradem_comum',count:3,gap:0.7},{type:'paradem_elite',count:2,gap:10.0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:4,gap:0.7},{type:'paradem_elite',count:2,gap:10.0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.0},{type:'paradem_comum',count:3,gap:0.7},{type:'paradem_elite',count:2,gap:9.0},{type:'unidade_omega',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'paradem_elite',count:2,gap:9.0},{type:'unidade_omega',count:2,gap:14.0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'paradem_elite',count:2,gap:8.0},{type:'unidade_omega',count:3,gap:13.0}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.2},{type:'paradem_comum',count:2,gap:0.7},{type:'unidade_omega',count:1,gap:0},{type:'mantis',count:1,gap:0}])
  ]
},
```

---

### DC Fase 5 — Linha de Frente
*Introduz `destruidor` (stun_immune + bomber). Mini-Boss W10: DeSaad.*

```js
{
  id: 'dc_fase5', name: 'Linha de Frente', world: 'dc',
  drops: [
    { id: 'dc_material_3', chance: 90 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:7,gap:1.3},{type:'paradem_comum',count:2,gap:0.8},{type:'unidade_omega',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.2},{type:'paradem_comum',count:3,gap:0.8},{type:'unidade_omega',count:2,gap:14.0}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.2},{type:'paradem_comum',count:3,gap:0.7},{type:'unidade_omega',count:2,gap:13.0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:3,gap:0.7},{type:'unidade_omega',count:2,gap:13.0},{type:'paradem_elite',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:3,gap:0.6},{type:'unidade_omega',count:2,gap:12.0},{type:'paradem_elite',count:2,gap:11.0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'unidade_omega',count:2,gap:11.0},{type:'paradem_elite',count:2,gap:10.0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'unidade_omega',count:2,gap:10.0},{type:'paradem_elite',count:2,gap:10.0},{type:'destruidor',count:2,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'unidade_omega',count:2,gap:10.0},{type:'paradem_elite',count:2,gap:9.0},{type:'destruidor',count:3,gap:1.2}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.0},{type:'paradem_comum',count:3,gap:0.5},{type:'unidade_omega',count:2,gap:9.0},{type:'paradem_elite',count:2,gap:9.0},{type:'destruidor',count:4,gap:1.0}]),
    buildWave([{type:'soldado_apokolips',count:2,gap:1.3},{type:'paradem_comum',count:2,gap:0.7},{type:'unidade_omega',count:1,gap:0},{type:'paradem_elite',count:1,gap:0},{type:'desaad',count:1,gap:0}])
  ]
},
```

---

### DC Fase 6 — Convergência Final *(Boss)*
*Gauntlet completo com todos os tipos. Boss W10: Darkseid (2 fases).*

```js
{
  id: 'dc_fase6', name: 'Convergência Final', world: 'dc', isBoss: true,
  drops: [
    { id: 'dc_material_3',  chance: 40 },
    { id: 'flash_barry',    chance: 0.1, pity: 200 }
  ],
  waves: [
    buildWave([{type:'soldado_apokolips',count:8,gap:1.4},{type:'paradem_comum',count:2,gap:0.9}]),
    buildWave([{type:'soldado_apokolips',count:7,gap:1.3},{type:'paradem_comum',count:3,gap:0.8}]),
    buildWave([{type:'soldado_apokolips',count:7,gap:1.2},{type:'paradem_comum',count:4,gap:0.7},{type:'destruidor',count:2,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:6,gap:1.2},{type:'paradem_comum',count:3,gap:0.8},{type:'paradem_elite',count:2,gap:11.0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:3,gap:0.7},{type:'paradem_elite',count:2,gap:10.0},{type:'unidade_omega',count:1,gap:0}]),
    buildWave([{type:'soldado_apokolips',count:5,gap:1.1},{type:'paradem_comum',count:3,gap:0.7},{type:'paradem_elite',count:2,gap:9.0},{type:'unidade_omega',count:2,gap:13.0}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'paradem_elite',count:2,gap:9.0},{type:'unidade_omega',count:2,gap:12.0},{type:'destruidor',count:2,gap:1.5}]),
    buildWave([{type:'soldado_apokolips',count:4,gap:1.0},{type:'paradem_comum',count:3,gap:0.6},{type:'paradem_elite',count:2,gap:8.0},{type:'unidade_omega',count:2,gap:11.0},{type:'destruidor',count:3,gap:1.2}]),
    buildWave([{type:'soldado_apokolips',count:3,gap:1.0},{type:'paradem_comum',count:3,gap:0.5},{type:'paradem_elite',count:3,gap:8.0},{type:'unidade_omega',count:2,gap:10.0},{type:'destruidor',count:4,gap:1.0}]),
    buildWave([{type:'soldado_apokolips',count:2,gap:1.5},{type:'paradem_comum',count:2,gap:0.8},{type:'unidade_omega',count:1,gap:0},{type:'destruidor',count:2,gap:2.0},{type:'darkseid_fase1',count:1,gap:0}])
  ]
},
```

---

## 5. Tabela de Dificuldades (Multiplicadores de HP)

O HP acima é para **Normal**. O engine aplica multiplicadores automáticos:

| Dificuldade | Multiplicador HP | Multiplicador Speed |
|-------------|-----------------|---------------------|
| Normal | 1.0× | 1.0× |
| Difícil | 2.2× | 1.15× |
| Lendário | 3.5× | 1.25× |

> Darkseid Lendário: (220.000 + 160.000) × 3.5 = **1.330.000 HP total**

---

## 6. Assets de Inimigos Necessários

Criar pasta `assets/inimigos/world5/` com:

```
Soldado Apokolips.png
Paradem Common.png
Paradem Elite.png
Unidade Omega.png
Destruidor.png
Granny Goodness.png
Kalibak.png
Steppenwolf.png
Mantis.png
DeSaad.png
Darkseid.png
Darkseid Full Power.png
```
