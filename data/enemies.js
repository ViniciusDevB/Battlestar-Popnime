// ─────────────────────────────────────────────────────────────────────────────
// STATUS_TYPES — tabela central de todos os status do jogo.
//
// Cada entrada define como o status é inicializado, aplicado, atualizado e
// como afeta a velocidade do inimigo. Inclui status únicos como templates.
//
// Campos obrigatórios:
//   init()              → estado inicial limpo
//   apply(status, params, enemy)  → aplica ao objeto de status
//   update(status, dt, enemy)     → tick; retorna dano causado no dt
//
// Campos opcionais:
//   stacking: true      → múltiplas instâncias acumulam (array)
//   slows: true         → afeta velocidade do inimigo
//   getSpeedMult(status) → multiplier de velocidade (0 = paralisado)
//
// Para criar um novo status: copie qualquer entrada como template e ajuste.
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_TYPES = {

  // ── Burn ─────────────────────────────────────────────────────────────────
  // Template: dano por tempo não-cumulativo. Renovável.
  burn: {
    init: () => ({ active: false, dps: 0, timer: 0 }),
    apply(status, params) {
      status.burn = { active: true, dps: params.dps || 10, timer: params.duration || 3 };
    },
    update(status, dt) {
      if (!status.burn.active) return 0;
      const dmg = status.burn.dps * dt;
      status.burn.timer -= dt;
      if (status.burn.timer <= 0) status.burn = STATUS_TYPES.burn.init();
      return dmg;
    }
  },

  // ── Freeze ────────────────────────────────────────────────────────────────
  // Template: redução de velocidade não-cumulativa. Renovável.
  freeze: {
    slows: true,
    init: () => ({ active: false, slow_pct: 0, timer: 0 }),
    apply(status, params) {
      status.freeze = { active: true, slow_pct: params.slow_pct || 0.5, timer: params.duration || 2 };
    },
    update(status, dt) {
      if (!status.freeze.active) return 0;
      status.freeze.timer -= dt;
      if (status.freeze.timer <= 0) status.freeze = STATUS_TYPES.freeze.init();
      return 0;
    },
    getSpeedMult(status) { return status.freeze.active ? (1 - status.freeze.slow_pct) : 1; }
  },

  // ── Paralisia ─────────────────────────────────────────────────────────────
  // Template: parada total de movimento. Duração máxima prevalece.
  paralisia: {
    slows: true,
    init: () => ({ active: false, timer: 0 }),
    apply(status, params) {
      if (!status.paralisia.active || params.duration > status.paralisia.timer)
        status.paralisia = { active: true, timer: params.duration || 1 };
    },
    update(status, dt) {
      if (!status.paralisia.active) return 0;
      status.paralisia.timer -= dt;
      if (status.paralisia.timer <= 0) status.paralisia = STATUS_TYPES.paralisia.init();
      return 0;
    },
    getSpeedMult(status) { return status.paralisia.active ? 0 : 1; }
  },

  // ── Sangramento ───────────────────────────────────────────────────────────
  // Template: dano por tempo CUMULATIVO. Cada aplicação empilha.
  sangramento: {
    stacking: true,
    init: () => ([]),
    apply(status, params) {
      status.sangramento.push({ dps: params.dps || 15, timer: params.duration || 4 });
    },
    update(status, dt) {
      let dmg = 0;
      status.sangramento = status.sangramento.filter(stack => {
        dmg += stack.dps * dt;
        stack.timer -= dt;
        return stack.timer > 0;
      });
      return dmg;
    }
  },

  // ── Medo ─────────────────────────────────────────────────────────────────
  // Debuff do Cero Oscuras: inimigo recebe +25% dano de toda fonte por duração.
  medo: {
    init: () => ({ active: false, timer: 0 }),
    apply(status, params) {
      status.medo = { active: true, timer: params.duration || 4 };
    },
    update(status, dt) {
      if (!status.medo.active) return 0;
      status.medo.timer -= dt;
      if (status.medo.timer <= 0) status.medo = STATUS_TYPES.medo.init();
      return 0;
    }
  },

  // ── Silenciado ────────────────────────────────────────────────────────────
  // Template único: anula ptype e special do inimigo por duração, depois restaura.
  // Use como base para qualquer debuff que modifica propriedades do inimigo
  // temporariamente e precisa ser revertido ao expirar.
  silenciado: {
    init: () => ({ active: false, timer: 0, savedPtype: null, savedSpecial: null }),
    apply(status, params, enemy) {
      if (status.silenciado.active) return;
      status.silenciado = {
        active: true,
        timer: params.duration || 3,
        savedPtype: enemy.ptype,
        savedSpecial: enemy.special
      };
      enemy.ptype = 'normal';
      enemy.special = null;
    },
    update(status, dt, enemy) {
      if (!status.silenciado.active) return 0;
      status.silenciado.timer -= dt;
      if (status.silenciado.timer <= 0) {
        enemy.ptype   = status.silenciado.savedPtype;
        enemy.special = status.silenciado.savedSpecial;
        status.silenciado = STATUS_TYPES.silenciado.init();
      }
      return 0;
    }
  }
};

// Inicializa o objeto status de um inimigo a partir da tabela STATUS_TYPES.
function initEnemyStatus() {
  const status = {};
  Object.entries(STATUS_TYPES).forEach(([type, def]) => {
    status[type] = def.init();
  });
  return status;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY_SPECIAL_HANDLERS — tabela de habilidades especiais de inimigos.
//
// Cada entrada pode ter:
//   init(enemy, def)        → inicializa campos extras no enemy ao criar
//   onSpawn(enemy, ctx)     → dispara quando o inimigo entra no mapa
//   onUpdate(enemy, dt, ctx)→ tick por frame enquanto vivo
//   onDeath(enemy, ctx)     → dispara ao morrer
//
// ctx é passado de game.js e expõe: towers, enemies, addEffect, toast,
//   activateShinraTensei, drainLife, dist2d, CANVAS_W, CANVAS_H
//
// Para criar um novo special: copie qualquer entrada como template.
// ─────────────────────────────────────────────────────────────────────────────
const ENEMY_SPECIAL_HANDLERS = {

  // ── Genjutsu ──────────────────────────────────────────────────────────────
  // Template: efeito de spawn que afeta TODAS as torres (stun em área global).
  genjutsu: {
    init(enemy, def) {
      enemy.genjutsuDone  = false;
      enemy.stunDuration  = def.stunDuration || 2.5;
    },
    onSpawn(enemy, ctx) {
      if (enemy.genjutsuDone) return;
      enemy.genjutsuDone = true;
      ctx.towers.forEach(t => {
        if (!t.isClone) {
          t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.stunDuration);
          t.disabled = true;
        }
      });
      ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:500, color:'#1c2833', timer:0.8, maxTimer:0.8, r:0 });
      ctx.toast(`👁️ Genjutsu de ${enemy.name}! Torres bloqueadas por ${enemy.stunDuration}s!`, 3000);
    }
  },

  // ── Shinra Tensei ─────────────────────────────────────────────────────────
  shinra_tensei: {
    init(enemy, def) {
      enemy.specialTimer    = def.specialInterval || 30;
      enemy.specialInterval = def.specialInterval || 30;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.specialTimer -= dt;
      if (enemy.specialTimer <= 0) {
        enemy.specialTimer = enemy.specialInterval;
        ctx.activateShinraTensei();
      }
    }
  },

  // ── Pain Boss (Shinra Tensei + Escudo de Rinnegan) ────────────────────────
  pain_boss: {
    init(enemy, def) {
      enemy.specialTimer    = def.specialInterval || 30;
      enemy.specialInterval = def.specialInterval || 30;
      enemy.shieldHp        = 0;
      enemy.maxShieldHp     = 0;
      enemy.shieldCooldown  = 10 + Math.random() * 10;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.specialTimer -= dt;
      if (enemy.specialTimer <= 0) {
        enemy.specialTimer = enemy.specialInterval;
        ctx.activateShinraTensei();
      }
      if (enemy.shieldHp <= 0) {
        enemy.shieldCooldown -= dt;
        if (enemy.shieldCooldown <= 0) {
          enemy.maxShieldHp    = 4000 + Math.floor(Math.random() * 2000);
          enemy.shieldHp       = enemy.maxShieldHp;
          enemy.shieldCooldown = 15 + Math.random() * 15;
          ctx.toast('🛡 Pain invocou um escudo de Rinnegan!', 3000);
        }
      }
    }
  },

  // ── Base Drain ────────────────────────────────────────────────────────────
  // Template: inimigo que drena recurso da base periodicamente enquanto vivo.
  base_drain: {
    init(enemy, def) {
      enemy.drainInterval = def.drainInterval || 4;
      enemy.drainTimer    = def.drainInterval || 4;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.drainTimer -= dt;
      if (enemy.drainTimer <= 0) {
        enemy.drainTimer = enemy.drainInterval;
        ctx.drainLife();
        ctx.toast(`⚠️ ${enemy.name} drena a base! −1 vida`, 2000);
      }
    }
  },

  // ── Explosion ─────────────────────────────────────────────────────────────
  // Template: explosão ao morrer que aplica stun em área nas torres próximas.
  explosion: {
    init(enemy, def) {
      enemy.explosionRadius = def.explosionRadius || 130;
      enemy.explosionStun   = def.explosionStun   || 1.5;
    },
    onDeath(enemy, ctx) {
      const stunR = enemy.explosionRadius;
      const stunT = enemy.explosionStun;
      let stunCount = 0;
      ctx.towers.forEach(t => {
        if (!t.isClone && ctx.dist2d(t.x, t.y, enemy.x, enemy.y) <= stunR) {
          t.miniStunTimer = Math.max(t.miniStunTimer || 0, stunT);
          t.disabled = true;
          stunCount++;
        }
      });
      ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:stunR, color:'#e74c3c', timer:0.55, maxTimer:0.55, r:0 });
      if (stunCount > 0) ctx.toast(`💥 Explosion! ${stunCount} torre(s) bloqueada(s) por ${stunT}s!`, 2000);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY_DEFS
// ─────────────────────────────────────────────────────────────────────────────

const ENEMY_DEFS = {

  // ═══════════════════════════════════════════════
  //  FASE 1 — Ninjas Comuns
  // ═══════════════════════════════════════════════
  ninja_comum: {
    id:'ninja_comum', name:'Ninja Comum',
    hp:200, speed:75, gold:13,
    ptype:'normal', req:0, size:18, col:'#c0392b', image: 'assets/inimigos/world1/Ninja Comum.png'
  },

  // ═══════════════════════════════════════════════
  //  FASE 2 — Ninjas Ambu
  // ═══════════════════════════════════════════════
  ninja_ambu: {
    id:'ninja_ambu', name:'Ninja Ambu',
    hp:400, speed:75, gold:23,
    ptype:'normal', req:0, size:18, col:'#7f8c8d', image: 'assets/inimigos/world1/Ninja Ambu.png'
  },
  agente_ambu: {
    id:'agente_ambu', name:'Agente Ambu',
    hp:700, speed:72, gold:44,
    ptype:'powerful1', req:1, size:22, col:'#2c3e50', image: 'assets/inimigos/world1/Ninja Ambu.png'
  },

  // ═══════════════════════════════════════════════
  //  FASE 3 — Animais (Serpentes, etc.)
  // ═══════════════════════════════════════════════
  serpente: {
    id:'serpente', name:'Serpente',
    hp:750, speed:78, gold:37,
    ptype:'normal', req:0, size:20, col:'#27ae60', image: 'assets/inimigos/world1/Cobra.png'
  },
  boa_constritora: {
    id:'boa_constritora', name:'Boa Constritora',
    hp:1300, speed:68, gold:71,
    ptype:'powerful1', req:1, size:24, col:'#1e8449', image: 'assets/inimigos/world1/Cobra Constritora.png'
  },

  // ═══════════════════════════════════════════════
  //  FASE 4 — Caminhos de Pain
  // ═══════════════════════════════════════════════
  caminho_animal: {
    id:'caminho_animal', name:'Caminho Animal',
    hp:1200, speed:70, gold:55,
    ptype:'normal', req:0, size:20, col:'#884ea0', image: 'assets/inimigos/world1/Pain Caminho Animal.png'
  },
  caminho_humano: {
    id:'caminho_humano', name:'Caminho Humano',
    hp:2000, speed:64, gold:95,
    ptype:'powerful1', req:1, size:24, col:'#6c3483', image: 'assets/inimigos/world1/Pain Caminho Humano.png'
  },

  // ═══════════════════════════════════════════════
  //  FASE 5 — Invocações de Pain
  // ═══════════════════════════════════════════════
  invocacao_slug: {
    id:'invocacao_slug', name:'Lesma Invocada',
    hp:1800, speed:64, gold:76,
    ptype:'normal', req:0, size:22, col:'#5dade2', image: 'assets/inimigos/world1/Invocação Slug.png'
  },
  invocacao_caranguejo: {
    id:'invocacao_caranguejo', name:'Caranguejo Invocado',
    hp:3000, speed:56, gold:131,
    ptype:'powerful1', req:1, size:26, col:'#1a5276', image: 'assets/inimigos/world1/Invocação Carangueijo.png'
  },

  // ═══════════════════════════════════════════════
  //  FASE 6 — Ninjas da Chuva + especiais
  // ═══════════════════════════════════════════════
  ninja_chuva: {
    id:'ninja_chuva', name:'Ninja da Chuva',
    hp:2500, speed:72, gold:89,
    ptype:'normal', req:0, size:20, col:'#5d6d7e', image: 'assets/inimigos/world1/Ninja Chuva.png'
  },
  akatsuki_chuva: {
    id:'akatsuki_chuva', name:'Akatsuki da Chuva',
    hp:4000, speed:65, gold:163,
    ptype:'powerful1', req:1, size:24, col:'#4a235a', image: 'assets/inimigos/world1/Ninja Akatsuki.png'
  },
  mini_shinra_tensei: {
    id:'mini_shinra_tensei', name:'Mini Shinra Tensei',
    hp:800, speed:76, gold:53,
    ptype:'normal', req:0, size:18, col:'#e74c3c', image: 'assets/inimigos/world1/Shinra Tensei.png',
    special:'explosion', explosionRadius:130, explosionStun:1.5
  },
  ninja_chuva_veloz: {
    id:'ninja_chuva_veloz', name:'Ninja da Chuva Veloz',
    hp:1500, speed:152, gold:105,
    ptype:'speed', req:0, size:16, col:'#85929e', image: 'assets/inimigos/world1/Ninja Akatsuki.png'
  },

  // ═══════════════════════════════════════════════
  //  MINI-BOSSES
  // ═══════════════════════════════════════════════
  deidara: {
    id:'deidara', name:'Deidara',
    hp:3500, speed:58, gold:210,
    ptype:'normal', req:0, size:32, col:'#f39c12', image: 'assets/inimigos/world1/Deidara.png',
    is_miniboss:true,
    on_death:{ type:'ninja_comum', count:5 }
  },
  itachi_uchiha: {
    id:'itachi_uchiha', name:'Itachi Uchiha',
    hp:6000, speed:54, gold:315,
    ptype:'powerful1', req:1, size:32, col:'#1c2833', image: 'assets/inimigos/world1/Itachi.png',
    is_miniboss:true,
    special:'genjutsu', stunDuration:2.5
  },
  sasuke_taka: {
    id:'sasuke_taka', name:'Sasuke (Equipe Taka)',
    hp:5000, speed:56, gold:294,
    ptype:'powerful1', req:1, size:32, col:'#1f618d', image: 'assets/inimigos/world1/Sasuke Taka (1).png',
    is_miniboss:true,
    special:'base_drain', drainInterval:4
  },
  konan: {
    id:'konan', name:'Konan',
    hp:8000, speed:50, gold:420,
    ptype:'powerful1', req:1, size:34, col:'#9b59b6', image: 'assets/inimigos/world1/Konan.png',
    is_miniboss:true,
    on_death:{ type:'mini_shinra_tensei', count:3 }
  },
  caminho_deus_animal: {
    id:'caminho_deus_animal', name:'Caminho Deus Animal',
    hp:12000, speed:46, gold:630,
    ptype:'powerful1', req:1, size:36, col:'#7d6608', image: 'assets/inimigos/world1/Pain Caminho Animal.png',
    is_miniboss:true,
    on_death:{ type:'invocacao_slug', count:3 }
  },

  // ═══════════════════════════════════════════════
  //  BOSS FINAL — Pain (Nagato)
  // ═══════════════════════════════════════════════
  pain: {
    id:'pain', name:'Pain (Nagato)',
    hp:20000, speed:38, gold:1260,
    ptype:'powerful3', req:3, size:44, col:'#922b21', image: 'assets/inimigos/world1/Pain.png',
    is_boss:true,
    special:'pain_boss', specialInterval:30,
    on_death:{ type:'caminho_animal', count:3 }
  },

  // ═══════════════════════════════════════════════
  //  MUNDO 2 — ONE PIECE
  // ═══════════════════════════════════════════════
  // Fase 1
  op_bandido: {
    id:'op_bandido', name:'Bandido', hp:400, speed:72, gold:15, ptype:'normal', req:0, size:18, col:'#f39c12', image:'assets/inimigos/world2/Bandido.png'
  },
  op_bandido_veterano: {
    id:'op_bandido_veterano', name:'Bandido Chefe', hp:800, speed:65, gold:35, ptype:'powerful1', req:1, size:20, col:'#d35400', image:'assets/inimigos/world2/Bandido Veterano.png'
  },
  capitao_morgan: {
    id:'capitao_morgan', name:'Capitão Morgan', hp:3000, speed:55, gold:150, ptype:'powerful1', req:1, size:32, col:'#e67e22', is_miniboss:true, image:'assets/inimigos/world2/Capitão Morgan.png'
  },

  // Fase 2
  op_pirata_comum: {
    id:'op_pirata_comum', name:'Pirata Comum', hp:700, speed:68, gold:25, ptype:'normal', req:0, size:20, col:'#d35400', image:'assets/inimigos/world2/Pirata Comum.png'
  },
  op_pirata_veterano: {
    id:'op_pirata_veterano', name:'Pirata Veterano', hp:1200, speed:65, gold:45, ptype:'powerful1', req:1, size:22, col:'#c0392b', image:'assets/inimigos/world2/Pirata Veterano.png'
  },
  don_krieg: {
    id:'don_krieg', name:'Don Krieg', hp:5000, speed:52, gold:250, ptype:'powerful1', req:1, size:34, col:'#7f8c8d', is_miniboss:true, image:'assets/inimigos/world2/Don Krieg (1).png'
  },

  // Fase 3
  op_homem_peixe: {
    id:'op_homem_peixe', name:'Homem-Peixe', hp:1100, speed:65, gold:45, ptype:'normal', req:0, size:20, col:'#2980b9', image:'assets/inimigos/world2/Homem Peixe.png'
  },
  op_hp_guerreiro: {
    id:'op_hp_guerreiro', name:'Homem-Peixe Guerreiro', hp:2200, speed:60, gold:80, ptype:'powerful1', req:1, size:24, col:'#2471a3', image:'assets/inimigos/world2/Homem Peixe Guerreiro.png'
  },
  arlong: {
    id:'arlong', name:'Arlong', hp:8000, speed:50, gold:400, ptype:'powerful1', req:1, size:36, col:'#154360', is_miniboss:true, image:'assets/inimigos/world2/Arlong.png'
  },

  // Fase 4
  op_agente_bw: {
    id:'op_agente_bw', name:'Agente Baroque Works', hp:1800, speed:70, gold:60, ptype:'normal', req:0, size:20, col:'#8e44ad', image:'assets/inimigos/world2/Agente Baroque Works.png'
  },
  op_bw_speed: {
    id:'op_bw_speed', name:'Millions Rápido', hp:1000, speed:140, gold:80, ptype:'speed', req:0, size:16, col:'#9b59b6', image:'assets/inimigos/world2/Agente Baroque Works Speed (1).png'
  },
  op_bw_oficial: {
    id:'op_bw_oficial', name:'Oficial Baroque Works', hp:3200, speed:65, gold:100, ptype:'powerful1', req:1, size:22, col:'#732d91', image:'assets/inimigos/world2/Agente Baroque Works Oficial (1).png'
  },
  op_bw_elite: {
    id:'op_bw_elite', name:'Elite Baroque Works', hp:5500, speed:62, gold:160, ptype:'powerful2', req:2, size:24, col:'#5b2c6f', image:'assets/inimigos/world2/Agente Baroque Works Elite (1).png'
  },
  mr_1: {
    id:'mr_1', name:'Mr. 1', hp:14000, speed:46, gold:600, ptype:'powerful2', req:2, size:34, col:'#34495e', is_miniboss:true, image:'assets/inimigos/world2/Mr 1.png'
  },

  // Fase 5
  op_agente_cp9: {
    id:'op_agente_cp9', name:'Agente CP9', hp:2500, speed:85, gold:80, ptype:'normal', req:0, size:20, col:'#2c3e50', image:'assets/inimigos/world2/Agente CP9.png'
  },
  op_cp9_speed: {
    id:'op_cp9_speed', name:'Agente Soru', hp:1500, speed:160, gold:110, ptype:'speed', req:0, size:16, col:'#34495e', image:'assets/inimigos/world2/Agente CP9 Speed.png'
  },
  op_cp9_oficial: {
    id:'op_cp9_oficial', name:'Mestre Rokushiki', hp:4500, speed:80, gold:130, ptype:'powerful1', req:1, size:22, col:'#212f3d', image:'assets/inimigos/world2/Agente CP9 Oficial.png'
  },
  op_cp9_elite: {
    id:'op_cp9_elite', name:'Assassino CP9', hp:8000, speed:75, gold:200, ptype:'powerful2', req:2, size:24, col:'#17202a', image:'assets/inimigos/world2/Agente CP9 Elite.png'
  },
  rob_lucci: {
    id:'rob_lucci', name:'Rob Lucci', hp:22000, speed:55, gold:900, ptype:'powerful2', req:2, size:36, col:'#b03a2e', is_miniboss:true, image:'assets/inimigos/world2/Rob Lucci.png'
  },

  // Fase 6
  op_marinheiro: {
    id:'op_marinheiro', name:'Marinheiro', hp:3500, speed:75, gold:100, ptype:'normal', req:0, size:20, col:'#bdc3c7', image:'assets/inimigos/world2/Marinheiro.png'
  },
  op_marinha_capitao: {
    id:'op_marinha_capitao', name:'Capitão da Marinha', hp:6000, speed:70, gold:160, ptype:'powerful1', req:1, size:22, col:'#7f8c8d', image:'assets/inimigos/world2/Capitão Marinha.png'
  },
  op_marinha_elite: {
    id:'op_marinha_elite', name:'Vice-Almirante', hp:10000, speed:65, gold:250, ptype:'powerful2', req:2, size:24, col:'#34495e', image:'assets/inimigos/world2/Marinheiro Elite.png'
  },
  akainu: {
    id:'akainu', name:'Akainu', hp:50000, speed:40, gold:2500, ptype:'powerful3', req:3, size:48, col:'#c0392b', is_boss:true, special:'explosion', explosionRadius:150, explosionStun:2, image:'assets/inimigos/world2/Akainu.png'
  },

  // ═══════════════════════════════════════════════
  //  MUNDO 3 — BLEACH
  // ═══════════════════════════════════════════════
  hollow_pequeno: {
    id:'hollow_pequeno', name:'Hollow Pequeno',
    hp:900, speed:95, gold:38,
    ptype:'normal', req:0, size:18, col:'#78909c', image:'assets/inimigos/world3/Hollow Pequeno.png'
  },
  hollow_grande: {
    id:'hollow_grande', name:'Hollow Grande',
    hp:1800, speed:70, gold:80,
    ptype:'normal', req:0, size:26, col:'#546e7a', image:'assets/inimigos/world3/Hollow Grande.png'
  },
  hollow_mascara: {
    id:'hollow_mascara', name:'Hollow Mascarado',
    hp:3200, speed:58, gold:140,
    ptype:'powerful1', req:1, size:30, col:'#37474f', image:'assets/inimigos/world3/Hollow Mascarado.png'
  },
  arrancar: {
    id:'arrancar', name:'Arrancar',
    hp:2800, speed:82, gold:120,
    ptype:'powerful1', req:1, size:24, col:'#b0bec5', image:'assets/inimigos/world3/Arrancar.png'
  },
  espada_decima: {
    id:'espada_decima', name:'Espada Décima',
    hp:10000, speed:45, gold:520,
    ptype:'powerful2', req:2, size:36, col:'#607d8b', image:'assets/inimigos/world3/Espada.png',
    is_miniboss:true,
    on_death:{ type:'hollow_pequeno', count:4 }
  },
  menos_grande: {
    id:'menos_grande', name:'Menos Grande',
    hp:28000, speed:32, gold:1600,
    ptype:'powerful3', req:3, size:50, col:'#1c2833', image:'assets/inimigos/world3/Menos Grande.png',
    is_boss:true,
    special:'explosion', explosionRadius:180, explosionStun:3
  },

  // ── Bleach Fases 5–6 ──────────────────────────────────────────────────────
  espada_numero: {
    id:'espada_numero', name:'Espada Numerada',
    hp:22000, speed:58, gold:1100,
    ptype:'powerful2', req:2, size:34, col:'#4a5568', image:'assets/inimigos/world3/Espada Numero.png',
    is_miniboss:true,
    on_death:{ type:'arrancar', count:3 }
  },
  vasto_lorde: {
    id:'vasto_lorde', name:'Vasto Lorde',
    hp:12000, speed:92, gold:620,
    ptype:'powerful2', req:2, size:28, col:'#7c3aed', image:'assets/inimigos/world3/Vasto Lorde.png'
  },
  espada_primera: {
    id:'espada_primera', name:'Espada Primera',
    hp:50000, speed:36, gold:3000,
    ptype:'powerful3', req:3, size:44, col:'#1e3a5f', image:'assets/inimigos/world3/Espada Primera.png',
    is_miniboss:true,
    on_death:{ type:'arrancar', count:6 }
  },
  aizen_sousuke: {
    id:'aizen_sousuke', name:'Aizen Sousuke',
    hp:110000, speed:20, gold:6000,
    ptype:'powerful3', req:3, size:52, col:'#1a1a2e', image:'assets/inimigos/world3/Aizen.png',
    is_boss:true,
    special:'explosion', explosionRadius:230, explosionStun:4
  },
};

let _enemyCounter = 0;

function createEnemy(typeId, distanceOffset = 0) {
  const d = ENEMY_DEFS[typeId];
  if (!d) return null;

  const enemy = {
    uid: ++_enemyCounter,
    type: typeId,
    name: d.name,
    maxHp: d.hp,
    hp: d.hp,
    speed: d.speed,
    gold: d.gold,
    ptype: d.ptype,
    req: d.req || 0,
    is_miniboss: d.is_miniboss || false,
    is_boss: d.is_boss || false,
    on_death: d.on_death || null,
    special: d.special || null,
    col: d.col,
    size: d.size,
    dist: distanceOffset,
    x: 0, y: 0,
    dead: false,
    reached_end: false,
    hitFlash: 0,
    status: initEnemyStatus()
  };

  // Deixa cada handler inicializar os campos que precisar
  if (d.special && ENEMY_SPECIAL_HANDLERS[d.special]?.init) {
    ENEMY_SPECIAL_HANDLERS[d.special].init(enemy, d);
  }

  return enemy;
}

function applyStatus(enemy, type, params) {
  const def = STATUS_TYPES[type];
  if (!def) return;
  def.apply(enemy.status, params, enemy);
}

function getEffectiveSpeed(enemy) {
  let spd = enemy.speed;
  Object.values(STATUS_TYPES).forEach(def => {
    if (def.slows && def.getSpeedMult) spd *= def.getSpeedMult(enemy.status);
  });
  return spd;
}

function updateEnemyStatus(enemy, dt) {
  let totalDmg = 0;
  Object.values(STATUS_TYPES).forEach(def => {
    if (def.update) totalDmg += def.update(enemy.status, dt, enemy) || 0;
  });
  if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
  return totalDmg;
}

function canTowerDamage(towerUpgradeLevel, enemyReq) {
  return towerUpgradeLevel >= enemyReq;
}
