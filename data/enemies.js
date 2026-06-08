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
      ENEMY_SPECIAL_HANDLERS.shinra_tensei.init(enemy, def);
      enemy.shieldHp       = 0;
      enemy.maxShieldHp    = 0;
      enemy.shieldCooldown = 10 + Math.random() * 10;
    },
    onUpdate(enemy, dt, ctx) {
      ENEMY_SPECIAL_HANDLERS.shinra_tensei.onUpdate(enemy, dt, ctx);
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
      // Tsunade — Cem Sobrancelhas: drena 50% mais devagar quando Tsunade está em campo
      const tsunadeInField = ctx.towers.some(t => !t.dead && t.charData?.id === 'tsunade');
      const effectiveInterval = tsunadeInField ? enemy.drainInterval * 1.5 : enemy.drainInterval;
      enemy.drainTimer -= dt;
      if (enemy.drainTimer <= 0) {
        enemy.drainTimer = effectiveInterval;
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
  },

  // ── Grand Fisher ──────────────────────────────────────────────────────────
  // Stuna torres ao surgir + spawna Hollows periodicamente a partir de si
  grand_fisher_special: {
    init(enemy, def) {
      enemy.gfStunDone   = false;
      enemy.gfStunDur    = def.stunDuration  || 2.5;
      enemy.gfSpawnTimer = def.spawnInterval || 14;
      enemy.gfSpawnInt   = def.spawnInterval || 14;
      enemy.gfSpawnType  = def.spawnType     || 'hollow_pequeno';
      enemy.gfSpawnCount = def.spawnCount    || 2;
    },
    onSpawn(enemy, ctx) {
      if (enemy.gfStunDone) return;
      enemy.gfStunDone = true;
      ctx.towers.forEach(t => {
        if (!t.isClone) {
          t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.gfStunDur);
          t.disabled = true;
        }
      });
      ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:420, color:'#607d8b', timer:0.7, maxTimer:0.7, r:0 });
      ctx.toast(`👁️ Grand Fisher surgiu! Torres paralisadas por ${enemy.gfStunDur}s!`, 3000);
    },
    onUpdate(enemy, dt, ctx) {
      enemy.gfSpawnTimer -= dt;
      if (enemy.gfSpawnTimer <= 0) {
        enemy.gfSpawnTimer = enemy.gfSpawnInt;
        for (let i = 0; i < enemy.gfSpawnCount; i++) {
          ctx.spawnEnemy(enemy.gfSpawnType, enemy, { dist: Math.max(0, enemy.dist - i * 15) });
        }
        ctx.toast(`👁️ Grand Fisher invoca Hollows!`, 2000);
      }
    }
  },

  // ── Grimmjow ──────────────────────────────────────────────────────────────
  // Spawna Arrancars explosivos periodicamente enquanto vivo
  grimmjow_special: {
    init(enemy, def) {
      enemy.gjSpawnTimer = def.spawnInterval || 10;
      enemy.gjSpawnInt   = def.spawnInterval || 10;
      enemy.gjSpawnCount = def.spawnCount    || 2;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.gjSpawnTimer -= dt;
      if (enemy.gjSpawnTimer <= 0) {
        enemy.gjSpawnTimer = enemy.gjSpawnInt;
        for (let i = 0; i < enemy.gjSpawnCount; i++) {
          ctx.spawnEnemy('arrancar_explosivo', enemy, { dist: Math.max(0, enemy.dist - i * 10) });
        }
        ctx.toast(`💢 Grimmjow lança Arrancars explosivos!`, 2000);
      }
    }
  },

  // ── Nnoitra (Hierro regenerativo) ─────────────────────────────────────────
  // Escudo Fortified com cooldown de regeneração após ser destruído
  nnoitra_special: {
    init(enemy, def) {
      enemy.nnoiShieldCD  = def.shieldRegenCooldown || 40;
      enemy.nnoiShieldMax = def.shieldRegenCooldown || 40;
      if (!enemy.maxShieldHp) {
        const shHp = def.shieldHp || Math.round(enemy.maxHp * 0.5);
        enemy.shieldHp = shHp; enemy.maxShieldHp = shHp;
      }
    },
    onUpdate(enemy, dt, ctx) {
      if ((enemy.shieldHp || 0) > 0) {
        enemy.nnoiShieldCD = enemy.nnoiShieldMax;
        return;
      }
      enemy.nnoiShieldCD -= dt;
      if (enemy.nnoiShieldCD <= 0) {
        enemy.nnoiShieldCD = enemy.nnoiShieldMax;
        enemy.shieldHp     = enemy.maxShieldHp;
        ctx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:80, color:'#f59e0b', timer:0.6, maxTimer:0.6, r:0 });
        ctx.toast(`🛡 Hierro de Nnoitra restaurado!`, 3000);
      }
    }
  },

  // ── Aizen Fase 1 — Estrategista ────────────────────────────────────────────
  // Kyoka Suigetsu: trava todas as torres periodicamente
  // Escudo Hogyoku: regenera após ser destruído
  aizen_hogyoku_phase1: {
    init(enemy, def) {
      enemy.kyokaTimer    = def.kyokaInterval || 18;
      enemy.kyokaInterval = def.kyokaInterval || 18;
      enemy.kyokaDur      = def.kyokaDuration || 3;
      enemy.hogyokuCD     = def.shieldRegenCD || 35;
      enemy.hogyokuMax    = def.shieldRegenCD || 35;
      if (!enemy.maxShieldHp) {
        const shHp = def.shieldHp || Math.round(enemy.maxHp * 0.5);
        enemy.shieldHp = shHp; enemy.maxShieldHp = shHp;
      }
    },
    onUpdate(enemy, dt, ctx) {
      // Kyoka Suigetsu — ilude todas as torres periodicamente
      enemy.kyokaTimer -= dt;
      if (enemy.kyokaTimer <= 0) {
        enemy.kyokaTimer = enemy.kyokaInterval;
        ctx.towers.forEach(t => {
          if (!t.isClone) {
            t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.kyokaDur);
            t.disabled = true;
          }
        });
        ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:520, color:'#1a1a2e', timer:0.9, maxTimer:0.9, r:0 });
        ctx.toast(`🌀 Kyoka Suigetsu! Todas as torres foram iludidas por ${enemy.kyokaDur}s!`, 3500);
      }
      // Escudo Hogyoku — regenera após destruído
      if ((enemy.shieldHp || 0) > 0) {
        enemy.hogyokuCD = enemy.hogyokuMax;
      } else {
        enemy.hogyokuCD -= dt;
        if (enemy.hogyokuCD <= 0) {
          enemy.hogyokuCD = enemy.hogyokuMax;
          enemy.shieldHp  = enemy.maxShieldHp;
          ctx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:100, color:'#7c3aed', timer:0.8, maxTimer:0.8, r:0 });
          ctx.toast(`🔮 Hogyoku regenerou o escudo de Aizen!`, 3000);
        }
      }
    },
    onDeath(enemy, ctx) {
      ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:460, color:'#7c3aed', timer:1.2, maxTimer:1.2, r:0 });
      ctx.toast(`💀 HOGYOKU DESPERTO! Aizen ressurgiu sem ilusões — rápido e imparável!`, 5000);
    }
  },

  // ── Aizen Fase 2 — Hogyoku Desperto ──────────────────────────────────────
  // Rápido, imune a lentidão, drena base e recupera 100 HP por drenagem
  aizen_hogyoku_phase2: {
    init(enemy, def) {
      enemy.drainTimer    = def.drainInterval || 2;
      enemy.drainInterval = def.drainInterval || 2;
    },
    onUpdate(enemy, dt, ctx) {
      // Imunidade a lentidão: limpa slow/paralisia a cada frame
      if (enemy.status.freeze.active)    enemy.status.freeze    = STATUS_TYPES.freeze.init();
      if (enemy.status.paralisia.active) enemy.status.paralisia = STATUS_TYPES.paralisia.init();
      // Drena base e cura 100 HP por drenagem
      enemy.drainTimer -= dt;
      if (enemy.drainTimer <= 0) {
        enemy.drainTimer = enemy.drainInterval;
        ctx.drainLife();
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + 100);
        ctx.toast(`⚫ Hogyoku drena a base! Aizen recupera vida!`, 2000);
      }
    }
  },

  // ── Batroc — Golpe de Savate ──────────────────────────────────────────────
  batroc_special: {
    init(enemy, def) {
      enemy.dashTimer    = def.dashInterval || 12;
      enemy.dashInterval = def.dashInterval || 12;
      enemy.dashDist     = def.dashDist     || 280;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.dashTimer -= dt;
      if (enemy.dashTimer <= 0) {
        enemy.dashTimer = enemy.dashInterval;
        enemy.dist += enemy.dashDist;
        ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:60, color:'#b91c1c', timer:0.4, maxTimer:0.4, r:0 });
        ctx.toast(`💨 Golpe de Savate! Batroc avançou no caminho!`, 2000);
      }
    }
  },

  // ── Crossbones — Colete Suicida ───────────────────────────────────────────
  crossbones_special: {
    init(enemy, def) {
      enemy.vestActivated   = false;
      enemy.vestCountdownCD = def.vestCountdown || 6;
      enemy.vestMaxCD       = def.vestCountdown || 6;
      enemy.berserkActive   = false;
      enemy.berserkMult     = def.berserkSpeedMult || 1.65;
      enemy.vestWarned      = false;
    },
    onUpdate(enemy, dt, ctx) {
      if (enemy.hp < enemy.maxHp * 0.25 && !enemy.vestActivated && !enemy.berserkActive && !enemy.vestWarned) {
        enemy.vestActivated   = true;
        enemy.vestWarned      = true;
        enemy.vestCountdownCD = enemy.vestMaxCD;
        ctx.toast(`💣 Colete Suicida ativado! Mate Crossbones em ${enemy.vestMaxCD}s ou entre em BERSERK!`, 3500);
      }
      if (enemy.vestActivated) {
        enemy.vestCountdownCD -= dt;
        enemy.countdownDisplay = Math.ceil(Math.max(0, enemy.vestCountdownCD));
        if (enemy.vestCountdownCD <= 0) {
          enemy.vestActivated = false;
          enemy.berserkActive = true;
          enemy.speed *= enemy.berserkMult;
          ctx.toast(`💀 Crossbones sobreviveu ao countdown! BERSERK ATIVADO!`, 3000);
        }
      }
    },
    onDeath(enemy, ctx) {
      if (enemy.vestActivated) {
        const stunR = 280, stunT = 3;
        let stunCount = 0;
        ctx.towers.forEach(t => {
          if (!t.isClone && ctx.dist2d(t.x, t.y, enemy.x, enemy.y) <= stunR) {
            t.miniStunTimer = Math.max(t.miniStunTimer || 0, stunT);
            t.disabled = true;
            stunCount++;
          }
        });
        ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:stunR, color:'#ef4444', timer:0.8, maxTimer:0.8, r:0 });
        ctx.toast(`💥 EXPLOSÃO DO COLETE! ${stunCount} torre(s) bloqueada(s) por ${stunT}s!`, 3500);
      }
    }
  },

  // ── Ronan — O Veredito do Acusador ───────────────────────────────────────
  ronan_special: {
    init(enemy, def) {
      enemy.verdictTimer    = def.verdictInterval || 22;
      enemy.verdictInterval = def.verdictInterval || 22;
      enemy.verdictDuration = def.verdictDuration || 7;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.verdictTimer -= dt;
      if (enemy.verdictTimer <= 0) {
        enemy.verdictTimer = enemy.verdictInterval;
        const best = ctx.towers
          .filter(t => !t.isClone && !t.verdictActive)
          .sort((a, b) => (b.realtimeDPS || 0) - (a.realtimeDPS || 0))[0];
        if (best) {
          best.verdictActive = true;
          best.verdictTimer  = enemy.verdictDuration;
          ctx.addEffect({ type:'shockwave', x:best.x, y:best.y, maxR:50, color:'#1e1b4b', timer:0.6, maxTimer:0.6, r:0 });
          ctx.toast(`⚖️ Ronan sentenciou ${best.charData?.name || 'a torre'}! Bloqueada por ${enemy.verdictDuration}s!`, 3500);
        }
      }
    }
  },

  // ── Corvus Glaive — Glaive Imortal ───────────────────────────────────────
  corvus_glaive_special: {
    init(enemy, def) {
      enemy.glaiveImmortalWarned = false;
      enemy.shieldRegenThreshold = def.shieldRegenThreshold || 5;
      if (!enemy.maxShieldHp) {
        const shHp = def.shieldHp || Math.round(enemy.maxHp * 0.5);
        enemy.shieldHp = shHp; enemy.maxShieldHp = shHp;
      }
    },
    onUpdate(enemy, dt, ctx) {
      if ((enemy.shieldHp || 0) > 0 && enemy.hp <= 1) {
        enemy.hp = 1;
        if (!enemy.glaiveImmortalWarned) {
          enemy.glaiveImmortalWarned = true;
          ctx.toast(`⚔️ Glaive Imortal! Corvus não pode morrer com o escudo ativo!`, 3000);
        }
      }
      if ((enemy.shieldHp || 0) === 0) {
        const aliveCount = ctx.enemies.filter(e => !e.dead && !e.reached_end && e !== enemy).length;
        if (aliveCount >= enemy.shieldRegenThreshold) {
          enemy.shieldHp             = enemy.maxShieldHp;
          enemy.glaiveImmortalWarned = false;
          ctx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:90, color:'#0f172a', timer:0.7, maxTimer:0.7, r:0 });
          ctx.toast(`⚔️ Glaive regenerado! Há inimigos suficientes em campo!`, 3000);
        }
      }
    }
  },

  // ── Ebony Maw — Telecinese Dupla ─────────────────────────────────────────
  ebony_maw_special: {
    init(enemy, def) {
      enemy.pushTimer      = def.pushInterval  || 18;
      enemy.pushInterval   = def.pushInterval  || 18;
      enemy.pushDist       = def.pushDist      || 200;
      enemy.invertTimer    = def.invertInterval || 28;
      enemy.invertInterval = def.invertInterval || 28;
      enemy.invertDuration = def.invertDuration || 6;
      enemy.invertCount    = def.invertCount    || 3;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.pushTimer -= dt;
      if (enemy.pushTimer <= 0) {
        enemy.pushTimer = enemy.pushInterval;
        ctx.enemies.forEach(e => { if (!e.dead && !e.reached_end) e.dist += enemy.pushDist; });
        ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:600, color:'#1e3a5f', timer:0.7, maxTimer:0.7, r:0 });
        ctx.toast(`🌀 Ebony Maw levanta os inimigos! Todos avançam no caminho!`, 2500);
      }
      enemy.invertTimer -= dt;
      if (enemy.invertTimer <= 0) {
        enemy.invertTimer = enemy.invertInterval;
        const eligible = ctx.towers.filter(t => !t.isClone && !t.invertedTargeting);
        const targets  = eligible.sort(() => Math.random() - 0.5).slice(0, enemy.invertCount);
        targets.forEach(t => { t.invertedTargeting = true; t.invertedTimer = enemy.invertDuration; });
        if (targets.length > 0) ctx.toast(`🌀 Ebony Maw inverteu o alvo de ${targets.length} torre(s)!`, 2500);
      }
    }
  },

  // ── Thanos Fase 1 — O Eterno ─────────────────────────────────────────────
  thanos_fase1_special: {
    init(enemy, def) {
      enemy.snapTimer     = def.snapInterval  || 25;
      enemy.snapInterval  = def.snapInterval  || 25;
      enemy.snapDuration  = def.snapDuration  || 4;
      enemy.drainTimer    = def.drainInterval || 3;
      enemy.drainInterval = def.drainInterval || 3;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.snapTimer -= dt;
      if (enemy.snapTimer <= 0) {
        enemy.snapTimer = enemy.snapInterval;
        ctx.towers.forEach(t => {
          if (!t.isClone) { t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.snapDuration); t.disabled = true; }
        });
        ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:550, color:'#581c87', timer:1.0, maxTimer:1.0, r:0 });
        ctx.toast(`💥 O Snap de Thanos! Torres bloqueadas por ${enemy.snapDuration}s!`, 3500);
      }
      enemy.drainTimer -= dt;
      if (enemy.drainTimer <= 0) {
        enemy.drainTimer = enemy.drainInterval;
        ctx.drainLife();
        ctx.toast(`💀 Thanos drena a base! −1 vida`, 2000);
      }
    },
    onDeath(enemy, ctx) {
      ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:500, color:'#7c3aed', timer:1.2, maxTimer:1.2, r:0 });
      ctx.toast(`🔮 MANOPLA COMPLETA! Thanos está IMPARÁVEL!`, 5000);
    }
  },

  // ── Thanos Fase 2 — Manopla Completa ─────────────────────────────────────
  thanos_manopla_special: {
    init(enemy, def) {
      enemy.snapTimer    = def.snapInterval || 10;
      enemy.snapInterval = def.snapInterval || 10;
      enemy.snapDuration = def.snapDuration || 3;
      enemy.gemTimer     = def.gemInterval  || 20;
      enemy.gemInterval  = def.gemInterval  || 20;
      enemy.gemIndex     = 0;
    },
    onUpdate(enemy, dt, ctx) {
      if (enemy.status.freeze.active)    enemy.status.freeze    = STATUS_TYPES.freeze.init();
      if (enemy.status.paralisia.active) enemy.status.paralisia = STATUS_TYPES.paralisia.init();
      // Snap — independente das gemas, a cada 10s
      enemy.snapTimer -= dt;
      if (enemy.snapTimer <= 0) {
        enemy.snapTimer = enemy.snapInterval;
        ctx.towers.forEach(t => {
          if (!t.isClone) { t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.snapDuration); t.disabled = true; }
        });
        ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:550, color:'#581c87', timer:0.8, maxTimer:0.8, r:0 });
        ctx.toast(`💥 Snap da Manopla! Torres bloqueadas por ${enemy.snapDuration}s!`, 2500);
      }
      // Gemas — rotação a cada 20s
      enemy.gemTimer -= dt;
      if (enemy.gemTimer <= 0) {
        enemy.gemTimer = enemy.gemInterval;
        const GEM_COLORS = ['#2563eb','#facc15','#dc2626','#9333ea','#16a34a','#f97316'];
        const GEM_NAMES  = ['Espaço','Mente','Realidade','Poder','Tempo','Alma'];
        const gi = enemy.gemIndex;
        switch(gi) {
          case 0: // Espaço
            for (let i = 0; i < 4; i++) ctx.spawnEnemy('invasor', enemy, { dist: Math.max(0, enemy.dist - i*20) });
            ctx.toast(`🔵 Gema do Espaço! Invasores invocados!`, 2500); break;
          case 1: // Mente
            ctx.towers.forEach(t => { if (!t.isClone) { t.miniStunTimer = Math.max(t.miniStunTimer||0, 5); t.disabled = true; } });
            ctx.toast(`🟡 Gema da Mente! Torres silenciadas por 5s!`, 2500); break;
          case 2: // Realidade
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.20);
            ctx.toast(`🔴 Gema da Realidade! Thanos restaurou 20% de vida!`, 2500); break;
          case 3: // Poder
            ctx.drainLife(); ctx.drainLife();
            ctx.toast(`🟣 Gema do Poder! −2 vidas da base!`, 2500); break;
          case 4: // Tempo
            ctx.enemies.forEach(e => { if (!e.dead && !e.reached_end) e.dist += 150; });
            ctx.toast(`🟢 Gema do Tempo! Todos os inimigos avançaram no caminho!`, 2500); break;
          case 5: // Alma — sem restrição de "uma vez"
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 50000);
            ctx.toast(`🟠 Gema da Alma! Thanos curou 50.000 HP!`, 2500); break;
        }
        ctx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:80, color:GEM_COLORS[gi], timer:0.8, maxTimer:0.8, r:0 });
        enemy.gemIndex = (enemy.gemIndex + 1) % 6;
      }
    }
  },

  // ── Replicante do Mizukage — Genjutsu Cegante ────────────────────────────
  mizukage_special: {
    init(enemy, def) {
      enemy.genjutsuTimer    = def.genjutsuInterval || 20;
      enemy.genjutsuInterval = def.genjutsuInterval || 20;
      enemy.genjutsuDuration = def.genjutsuDuration || 5;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.genjutsuTimer -= dt;
      if (enemy.genjutsuTimer <= 0) {
        enemy.genjutsuTimer = enemy.genjutsuInterval;
        ctx.towers.forEach(t => {
          if (!t.isClone) {
            t.miniStunTimer = Math.max(t.miniStunTimer || 0, enemy.genjutsuDuration);
            t.disabled = true;
          }
        });
        ctx.addEffect({ type:'shockwave', x:ctx.CANVAS_W/2, y:ctx.CANVAS_H/2, maxR:500, color:'#1e3a5f', timer:0.9, maxTimer:0.9, r:0 });
        ctx.toast(`🌫️ Genjutsu do Mizukage! Torres paralisadas por ${enemy.genjutsuDuration}s!`, 3000);
      }
    }
  },

  // ── Replicante do Tsuchikage — Partícula Invocante ────────────────────────
  tsuchikage_special: {
    init(enemy, def) {
      enemy.spawnSpecTimer    = def.spawnInterval || 15;
      enemy.spawnSpecInterval = def.spawnInterval || 15;
      enemy.spawnSpecCount    = def.spawnCount || 2;
    },
    onUpdate(enemy, dt, ctx) {
      enemy.spawnSpecTimer -= dt;
      if (enemy.spawnSpecTimer <= 0) {
        enemy.spawnSpecTimer = enemy.spawnSpecInterval;
        for (let i = 0; i < enemy.spawnSpecCount; i++) {
          ctx.spawnEnemy('guerreiro_pedra', enemy, { dist: Math.max(0, enemy.dist - i * 30) });
        }
        ctx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:70, color:'#57534e', timer:0.7, maxTimer:0.7, r:0 });
        ctx.toast(`🪨 Tsuchikage invoca reforços de pedra!`, 2500);
      }
    }
  },

  // ── Replicante de Killer Bee — Imunidade Rotativa ────────────────────────
  killerbee_replica_special: {
    init(enemy, def) {
      enemy.immuneTimer    = def.immuneCycleInterval || 30;
      enemy.immuneInterval = def.immuneCycleInterval || 30;
      const order = ['single','aoe','pierce','scatter','ricochet'];
      enemy.immuneOrder = order;
      enemy.immuneIdx   = 0;
      enemy.jinchuurikiImmuneType = order[0];
    },
    onUpdate(enemy, dt, ctx) {
      enemy.immuneTimer -= dt;
      if (enemy.immuneTimer <= 0) {
        enemy.immuneTimer = enemy.immuneInterval;
        enemy.immuneIdx = (enemy.immuneIdx + 1) % enemy.immuneOrder.length;
        enemy.jinchuurikiImmuneType = enemy.immuneOrder[enemy.immuneIdx];
        ctx.toast(`⚡ Imunidade Rotativa! Killer Bee agora é imune a: ${enemy.jinchuurikiImmuneType.toUpperCase()}`, 4000);
      }
    }
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// PTYPE_BEHAVIORS — comportamentos ativados automaticamente pelo ptype.
//
// Para adicionar um comportamento a qualquer inimigo, basta declarar o ptype
// correspondente na definição do inimigo (sem nenhum campo extra):
//   ptype: 'bomber'
//   ptype: ['powerful1', 'bomber', 'regenerator']
//
// Cada entrada pode ter:
//   defaults            → valores padrão usados pelo init quando a def omite o campo
//   init(enemy, def)    → inicializa campos extras no inimigo ao criar
//   onUpdate(enemy, dt, ctx) → tick por frame enquanto vivo
//   onDeath(enemy, ctx) → dispara ao morrer
//
// Para criar um novo behavior: copie qualquer entrada como template e ajuste.
// ─────────────────────────────────────────────────────────────────────────────
const PTYPE_BEHAVIORS = {

  // ── Clooner ───────────────────────────────────────────────────────────────
  // Ao morrer spawna cópias de si mesmo com HP cheio, sem o ptype clooner.
  clooner: {
    defaults: { cloneCount: 2 },
    init(enemy, def) {
      enemy.cloneCount = def.cloneCount || 2;
    },
    onDeath(enemy, ctx) {
      const count = enemy.cloneCount;
      const clonePtypes = enemy.ptypes.filter(pt => pt !== 'clooner');
      for (let i = 0; i < count; i++) {
        ctx.spawnEnemy(enemy.type, enemy, {
          ptypes: clonePtypes,
          ptype: clonePtypes[0] || 'normal',
          maxHp: enemy.maxHp,
          hp: enemy.maxHp,
          dist: Math.max(0, enemy.dist - i * 15)
        });
      }
      ctx.toast(`🔀 ${enemy.name} se clonou em ${count} cópias!`, 2500);
    }
  },

  // ── Regenerator ───────────────────────────────────────────────────────────
  // Regenera HP por segundo enquanto vivo.
  regenerator: {
    defaults: { regenRate: 50 },
    init(enemy, def) {
      enemy.regenRate = def.regenRate || 50;
    },
    onUpdate(enemy, dt) {
      if (enemy.hp < enemy.maxHp)
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regenRate * dt);
    }
  },

  // ── Bomber ────────────────────────────────────────────────────────────────
  // Ao morrer stuna torres ao redor por explosão.
  bomber: {
    defaults: { bomberRadius: 130, bomberStun: 1.5 },
    init(enemy, def) {
      enemy.bomberRadius = def.bomberRadius || 130;
      enemy.bomberStun   = def.bomberStun   || 1.5;
    },
    onDeath(enemy, ctx) {
      const stunR = enemy.bomberRadius;
      const stunT = enemy.bomberStun;
      let stunCount = 0;
      ctx.towers.forEach(t => {
        if (!t.isClone && ctx.dist2d(t.x, t.y, enemy.x, enemy.y) <= stunR) {
          t.miniStunTimer = Math.max(t.miniStunTimer || 0, stunT);
          t.disabled = true;
          stunCount++;
        }
      });
      ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:stunR, color:'#e74c3c', timer:0.55, maxTimer:0.55, r:0 });
      if (stunCount > 0) ctx.toast(`💣 Bomber! ${stunCount} torre(s) bloqueada(s) por ${stunT}s!`, 2000);
    }
  },

  // ── Fortified ─────────────────────────────────────────────────────────────
  // Escudo que precisa ser destruído antes da vida. Imune a status com escudo ativo.
  fortified: {
    defaults: {},
    init(enemy, def) {
      const shHp = def.shieldHp || Math.round(enemy.maxHp * 0.5);
      enemy.shieldHp    = shHp;
      enemy.maxShieldHp = shHp;
    }
  },

  // ── Kamikaze ──────────────────────────────────────────────────────────────
  // Ao morrer aumenta HP de todos os inimigos vivos em campo.
  kamikaze: {
    defaults: { kamikazeBuff: 0.15 },
    init(enemy, def) {
      enemy.kamikazeBuff = def.kamikazeBuff || 0.15;
    },
    onDeath(enemy, ctx) {
      const pct = enemy.kamikazeBuff;
      let count = 0;
      ctx.enemies.forEach(e => {
        if (!e.dead && !e.reached_end && e !== enemy) {
          const bonus = Math.round(e.maxHp * pct);
          e.maxHp += bonus;
          e.hp = Math.min(e.hp + bonus, e.maxHp);
          count++;
        }
      });
      ctx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:200, color:'#f39c12', timer:0.7, maxTimer:0.7, r:0 });
      if (count > 0) ctx.toast(`☠️ Kamikaze! ${count} inimigo(s) com +${Math.round(pct * 100)}% de vida!`, 3000);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY_DEFS
// ─────────────────────────────────────────────────────────────────────────────

const ENEMY_DEFS = {

  // ═══════════════════════════════════════════════
  //  MUNDO 1 — NARUTO
  // ═══════════════════════════════════════════════

  // Fase 1
  ninja_comum: {
    name:'Ninja Comum', hp:200, speed:75, gold:13,
    ptype:'normal', size:18, col:'#c0392b', image:'assets/inimigos/world1/Ninja Comum.png'
  },

  // Fase 2
  ninja_ambu: {
    name:'Ninja Ambu', hp:400, speed:75, gold:23,
    ptype:'normal', size:18, col:'#7f8c8d', image:'assets/inimigos/world1/Ninja Ambu.png'
  },
  agente_ambu: {
    name:'Agente Ambu', hp:700, speed:72, gold:44,
    ptype:'powerful1', size:22, col:'#2c3e50', image:'assets/inimigos/world1/Ninja Ambu.png'
  },

  // Fase 3
  serpente: {
    name:'Serpente', hp:750, speed:78, gold:37,
    ptype:'normal', size:20, col:'#27ae60', image:'assets/inimigos/world1/Cobra.png'
  },
  boa_constritora: {
    name:'Boa Constritora', hp:1300, speed:68, gold:71,
    ptype:'powerful1', size:24, col:'#1e8449', image:'assets/inimigos/world1/Cobra Constritora.png'
  },

  // Fase 4
  caminho_animal: {
    name:'Caminho Animal', hp:1200, speed:70, gold:55,
    ptype:'normal', size:20, col:'#884ea0', image:'assets/inimigos/world1/Pain Caminho Animal.png'
  },
  caminho_humano: {
    name:'Caminho Humano', hp:2000, speed:64, gold:95,
    ptype:'powerful1', size:24, col:'#6c3483', image:'assets/inimigos/world1/Pain Caminho Humano.png'
  },
  caminho_asura: {
    name:'Caminho Asura', hp:2800, speed:60, gold:110,
    ptype:'powerful1', size:24, col:'#4a235a', image:'assets/inimigos/world1/Pain Caminho Ashura.png'
  },

  // Fase 5
  invocacao_slug: {
    name:'Lesma Invocada', hp:1800, speed:64, gold:76,
    ptype:'normal', size:22, col:'#5dade2', image:'assets/inimigos/world1/Invocação Slug.png'
  },
  invocacao_caranguejo: {
    name:'Caranguejo Invocado', hp:3000, speed:56, gold:131,
    ptype:'powerful1', size:26, col:'#1a5276', image:'assets/inimigos/world1/Invocação Carangueijo.png'
  },

  // Fase 6
  ninja_chuva: {
    name:'Ninja da Chuva', hp:2500, speed:72, gold:89,
    ptype:'normal', size:20, col:'#5d6d7e', image:'assets/inimigos/world1/Ninja Chuva.png'
  },
  akatsuki_chuva: {
    name:'Akatsuki da Chuva', hp:4000, speed:65, gold:163,
    ptype:'powerful1', size:24, col:'#4a235a', image:'assets/inimigos/world1/Ninja Akatsuki.png'
  },
  mini_shinra_tensei: {
    name:'Mini Shinra Tensei', hp:800, speed:76, gold:53,
    ptype:'bomber', size:18, col:'#e74c3c', image:'assets/inimigos/world1/Shinra Tensei.png'
  },
  ninja_chuva_veloz: {
    name:'Ninja da Chuva Veloz', hp:1500, speed:152, gold:105,
    ptype:'speed', size:16, col:'#85929e', image:'assets/inimigos/world1/Ninja Akatsuki.png'
  },

  // Mini-bosses W1
  deidara: {
    name:'Deidara', hp:3500, speed:58, gold:210,
    ptype:'normal', size:32, col:'#f39c12', image:'assets/inimigos/world1/Deidara.png',
    is_miniboss:true, on_death:{ type:'ninja_comum', count:5 }
  },
  itachi_uchiha: {
    name:'Itachi Uchiha', hp:6000, speed:54, gold:315,
    ptype:'powerful1', size:32, col:'#1c2833', image:'assets/inimigos/world1/Itachi.png',
    is_miniboss:true, special:'genjutsu', stunDuration:2.5
  },
  sasuke_taka: {
    name:'Sasuke (Equipe Taka)', hp:5000, speed:56, gold:294,
    ptype:'powerful1', size:32, col:'#1f618d', image:'assets/inimigos/world1/Sasuke Taka (1).png',
    is_miniboss:true, special:'base_drain', drainInterval:4
  },
  konan: {
    name:'Konan', hp:8000, speed:50, gold:420,
    ptype:'powerful1', size:34, col:'#9b59b6', image:'assets/inimigos/world1/Konan.png',
    is_miniboss:true, on_death:{ type:'mini_shinra_tensei', count:3 }
  },
  caminho_deus_animal: {
    name:'Caminho Deus Animal', hp:12000, speed:46, gold:630,
    ptype:'powerful1', size:36, col:'#7d6608', image:'assets/inimigos/world1/Pain Caminho Animal.png',
    is_miniboss:true, on_death:{ type:'invocacao_slug', count:3 }
  },

  // Boss Final W1
  pain: {
    name:'Pain (Nagato)', hp:20000, speed:38, gold:1260,
    ptype:'powerful3', size:44, col:'#922b21', image:'assets/inimigos/world1/Pain.png',
    is_boss:true, special:'pain_boss', specialInterval:30,
    on_death:{ type:'caminho_animal', count:3 }
  },

  // ═══════════════════════════════════════════════
  //  MUNDO 2 — ONE PIECE
  // ═══════════════════════════════════════════════

  // Fase 1
  op_bandido: {
    name:'Bandido', hp:400, speed:72, gold:15,
    ptype:'normal', size:18, col:'#f39c12', image:'assets/inimigos/world2/Bandido.png'
  },
  op_bandido_veterano: {
    name:'Bandido Chefe', hp:800, speed:65, gold:35,
    ptype:'powerful1', size:20, col:'#d35400', image:'assets/inimigos/world2/Bandido Veterano.png'
  },
  capitao_morgan: {
    name:'Capitão Morgan', hp:3000, speed:55, gold:150,
    ptype:'powerful1', size:32, col:'#e67e22', is_miniboss:true, image:'assets/inimigos/world2/Capitão Morgan.png'
  },

  // Fase 2
  op_pirata_comum: {
    name:'Pirata Comum', hp:700, speed:68, gold:25,
    ptype:'normal', size:20, col:'#d35400', image:'assets/inimigos/world2/Pirata Comum.png'
  },
  op_pirata_veterano: {
    name:'Pirata Veterano', hp:1200, speed:65, gold:45,
    ptype:'powerful1', size:22, col:'#c0392b', image:'assets/inimigos/world2/Pirata Veterano.png'
  },
  don_krieg: {
    name:'Don Krieg', hp:5000, speed:52, gold:250,
    ptype:'powerful1', size:34, col:'#7f8c8d', is_miniboss:true, image:'assets/inimigos/world2/Don Krieg (1).png'
  },

  // Fase 3
  op_homem_peixe: {
    name:'Homem-Peixe', hp:1100, speed:65, gold:45,
    ptype:'normal', size:20, col:'#2980b9', image:'assets/inimigos/world2/Homem Peixe.png'
  },
  op_hp_guerreiro: {
    name:'Homem-Peixe Guerreiro', hp:2200, speed:60, gold:80,
    ptype:'powerful1', size:24, col:'#2471a3', image:'assets/inimigos/world2/Homem Peixe Guerreiro.png'
  },
  arlong: {
    name:'Arlong', hp:8000, speed:50, gold:400,
    ptype:'powerful1', size:36, col:'#154360', is_miniboss:true, image:'assets/inimigos/world2/Arlong.png'
  },

  // Fase 4
  op_agente_bw: {
    name:'Agente Baroque Works', hp:1800, speed:70, gold:60,
    ptype:'normal', size:20, col:'#8e44ad', image:'assets/inimigos/world2/Agente Baroque Works.png'
  },
  op_bw_speed: {
    name:'Millions Rápido', hp:1000, speed:140, gold:80,
    ptype:'speed', size:16, col:'#9b59b6', image:'assets/inimigos/world2/Agente Baroque Works Speed (1).png'
  },
  op_bw_oficial: {
    name:'Oficial Baroque Works', hp:3200, speed:65, gold:100,
    ptype:'powerful1', size:22, col:'#732d91', image:'assets/inimigos/world2/Agente Baroque Works Oficial (1).png'
  },
  op_bw_elite: {
    name:'Elite Baroque Works', hp:5500, speed:62, gold:160,
    ptype:'powerful2', size:24, col:'#5b2c6f', image:'assets/inimigos/world2/Agente Baroque Works Elite (1).png'
  },
  mr_1: {
    name:'Mr. 1', hp:14000, speed:46, gold:600,
    ptype:'powerful2', size:34, col:'#34495e', is_miniboss:true, image:'assets/inimigos/world2/Mr 1.png'
  },

  // Fase 5
  op_agente_cp9: {
    name:'Agente CP9', hp:2500, speed:85, gold:80,
    ptype:'normal', size:20, col:'#2c3e50', image:'assets/inimigos/world2/Agente CP9.png'
  },
  op_cp9_speed: {
    name:'Agente Soru', hp:1500, speed:160, gold:110,
    ptype:'speed', size:16, col:'#34495e', image:'assets/inimigos/world2/Agente CP9 Speed.png'
  },
  op_cp9_oficial: {
    name:'Mestre Rokushiki', hp:4500, speed:80, gold:130,
    ptype:'powerful1', size:22, col:'#212f3d', image:'assets/inimigos/world2/Agente CP9 Oficial.png'
  },
  op_cp9_elite: {
    name:'Assassino CP9', hp:8000, speed:75, gold:200,
    ptype:'powerful2', size:24, col:'#17202a', image:'assets/inimigos/world2/Agente CP9 Elite.png'
  },
  rob_lucci: {
    name:'Rob Lucci', hp:22000, speed:55, gold:900,
    ptype:'powerful2', size:36, col:'#b03a2e', is_miniboss:true, image:'assets/inimigos/world2/Rob Lucci.png'
  },

  // Fase 6
  op_marinheiro: {
    name:'Marinheiro', hp:3500, speed:75, gold:100,
    ptype:'normal', size:20, col:'#bdc3c7', image:'assets/inimigos/world2/Marinheiro.png'
  },
  op_marinha_capitao: {
    name:'Capitão da Marinha', hp:6000, speed:70, gold:160,
    ptype:'powerful1', size:22, col:'#7f8c8d', image:'assets/inimigos/world2/Capitão Marinha.png'
  },
  op_marinha_elite: {
    name:'Vice-Almirante', hp:10000, speed:65, gold:250,
    ptype:'powerful2', size:24, col:'#34495e', image:'assets/inimigos/world2/Marinheiro Elite.png'
  },
  akainu: {
    name:'Akainu', hp:35000, speed:40, gold:2500,
    ptype:['powerful3','bomber'], bomberRadius:150, bomberStun:2,
    size:48, col:'#c0392b', is_boss:true, image:'assets/inimigos/world2/Akainu.png'
  },

  // ═══════════════════════════════════════════════
  //  MUNDO 3 — BLEACH
  // ═══════════════════════════════════════════════

  // Fase 1
  hollow_pequeno: {
    name:'Hollow', hp:900, speed:95, gold:38,
    ptype:'normal', size:18, col:'#78909c', image:'assets/inimigos/world3/Hollow.png'
  },
  hollow_grande: {
    name:'Hollow Powerful', hp:1800, speed:70, gold:80,
    ptype:'normal', size:26, col:'#546e7a', image:'assets/inimigos/world3/Hollow Powerfull.png'
  },

  // Fase 2
  hollow_mascara: {
    name:'Hollow Shield', hp:3200, speed:58, gold:140,
    ptype:'powerful1', size:30, col:'#37474f', image:'assets/inimigos/world3/Hollow Shield.png'
  },
  arrancar: {
    name:'Arrancar', hp:2800, speed:82, gold:120,
    ptype:'powerful1', size:24, col:'#b0bec5', image:'assets/inimigos/world3/Hollow Shield.png'
  },

  // Fase 3

  // Fase 4
  vasto_lorde: {
    name:'Vasto Lorde', hp:12000, speed:92, gold:620,
    ptype:'powerful2', size:28, col:'#7c3aed', image:'assets/inimigos/world3/Vasto Lorde.png'
  },

  // Fase 5


  // ─── Novos inimigos — Bleach Refatorado ─────────────────────────────────

  // Inimigo Speed (usa imagem Hollow Powerful por ser variante rápida)
  arrancar_sonido: {
    name:'Hollow Speed', hp:1800, speed:150, gold:130,
    ptype:['powerful1','speed'], size:16, col:'#c0c8d0',
    image:'assets/inimigos/world3/Hollow Powerfull.png'
  },

  // Inimigo Fortified
  espada_hierro: {
    name:'Hollow Fortified', hp:18000, speed:50, gold:1200,
    ptype:['powerful2','fortified'], size:38, col:'#4a5568',
    image:'assets/inimigos/world3/Hollow Forfied.png',
    shieldHp: 9000
  },

  // Inimigo Regenerator
  espada_regen: {
    name:'Hollow Regen', hp:22000, speed:44, gold:1400,
    ptype:['powerful2','regenerator'], size:38, col:'#5b4fcf',
    image:'assets/inimigos/world3/Hollow Regen.png',
    regenRate: 200
  },

  // Inimigo Bomber (spawnable por Grimmjow)
  arrancar_explosivo: {
    name:'Hollow Explosion', hp:1200, speed:120, gold:70,
    ptype:['powerful1','bomber'], size:20, col:'#ef4444',
    image:'assets/inimigos/world3/Hollow Explosion.png',
    bomberRadius:120, bomberStun:1.5
  },

  // ── Miniboss 1: Grand Fisher (Fase 1) ────────────────────────────────────
  grand_fisher: {
    name:'Grand Fisher', hp:14000, speed:50, gold:800,
    ptype:'powerful2', size:42, col:'#607d8b',
    image:'assets/inimigos/world3/Grand Fisher.png',
    is_miniboss:true, special:'grand_fisher_special',
    stunDuration:2.5, spawnInterval:14, spawnType:'hollow_pequeno', spawnCount:2
  },

  // ── Miniboss 2: Gin Ichimaru (Fase 2) ────────────────────────────────────
  gin_ichimaru: {
    name:'Gin Ichimaru', hp:20000, speed:72, gold:1100,
    ptype:'powerful2', size:40, col:'#78909c',
    image:'assets/inimigos/world3/Gin Ichimaru.png',
    is_miniboss:true, special:'base_drain', drainInterval:3
  },

  // ── Miniboss 3: Grimmjow (Fase 3) ────────────────────────────────────────
  grimmjow: {
    name:'Grimmjow Jaegerjaquez', hp:32000, speed:98, gold:1600,
    ptype:'powerful2', size:44, col:'#1e88e5',
    image:'assets/inimigos/world3/Grinmmjow.png',
    is_miniboss:true, special:'grimmjow_special',
    spawnInterval:10, spawnCount:2
  },

  // ── Miniboss 4: Nnoitra (Fase 4) ─────────────────────────────────────────
  nnoitra: {
    name:'Nnoitra Gilga', hp:40000, speed:42, gold:3200,
    ptype:['powerful3','fortified'], size:48, col:'#1c2833',
    image:'assets/inimigos/world3/Nnoitra.png',
    is_miniboss:true, special:'nnoitra_special',
    shieldHp:45000, shieldRegenCooldown:40
  },

  // ── Miniboss 5: Ulquiorra (Fase 5) ───────────────────────────────────────
  ulquiorra: {
    name:'Ulquiorra Cifer', hp:50000, speed:55, gold:4200,
    ptype:['powerful3','regenerator'], size:46, col:'#1a252f',
    image:'assets/inimigos/world3/Ulquiorra.png',
    is_miniboss:true, special:'base_drain',
    regenRate:350, drainInterval:2
  },

  // ── Boss Fase 1: Aizen — Estrategista ─────────────────────────────────────
  // Lento e durão. Kyoka Suigetsu trava torres + escudo Hogyoku regenerativo.
  // Ao morrer spawna a Fase 2.
  aizen_fase1: {
    name:'Aizen — Estrategista', hp:75000, speed:22, gold:7000,
    ptype:['powerful3','fortified'], size:54, col:'#1a1a2e',
    image:'assets/inimigos/world3/Aizen Hogyoku.png',
    is_boss:true, special:'aizen_hogyoku_phase1',
    shieldHp:80000, kyokaInterval:18, kyokaDuration:3, shieldRegenCD:35,
    on_death:{ type:'aizen_fase2', count:1 }
  },

  // ── Boss Fase 2: Aizen — Hogyoku Desperto ────────────────────────────────
  // Rápido, sem escudo, imune a lentidão, drena base e recupera 100 HP por drenagem.
  aizen_fase2: {
    name:'Aizen — Hogyoku Desperto', hp:85000, speed:90, gold:5000,
    ptype:'powerful3', size:54, col:'#4c1d95',
    image:'assets/inimigos/world3/Aizen Hogyoku.png',
    is_boss:true, special:'aizen_hogyoku_phase2',
    drainInterval:2
  },

  // ═══════════════════════════════════════════════
  //  MUNDO 4 — MARVEL
  // ═══════════════════════════════════════════════

  // ── Backbone (normal — base de todas as fases) ────────────────────────────────
  invasor: {
    name:'Invasor', hp:1500, speed:85, gold:55,
    ptype:'normal', size:20, col:'#374151',
    image:'assets/inimigos/world4/Invasor Comum.png'
  },

  // ── Invasor Speed (Fase 2+) ───────────────────────────────────────────────────
  invasor_veloz: {
    name:'Invasor Speed', hp:1800, speed:155, gold:140,
    ptype:['powerful1','speed'], size:16, col:'#6b7280',
    image:'assets/inimigos/world4/Invasor Speed.png'
  },

  // ── Invasor Fortified (Fase 3+) ──────────────────────────────────────────────
  invasor_blindado: {
    name:'Invasor Fortified', hp:20000, speed:50, gold:1200,
    ptype:['powerful2','fortified'], shieldHp:10000,
    size:36, col:'#1f2937',
    image:'assets/inimigos/world4/Invasor Fortified.png'
  },

  // ── Invasor Regen (Fase 4+) ──────────────────────────────────────────────────
  invasor_regen: {
    name:'Invasor Regen', hp:24000, speed:44, gold:1400,
    ptype:['powerful2','regenerator'], regenRate:210,
    size:36, col:'#1e3a5f',
    image:'assets/inimigos/world4/Invasor Regen.png'
  },

  // ── Invasor Bomb (Fase 5+) ───────────────────────────────────────────────────
  invasor_explosivo: {
    name:'Invasor Bomb', hp:1300, speed:125, gold:75,
    ptype:['powerful1','bomber'], bomberRadius:125, bomberStun:1.8,
    size:18, col:'#f59e0b',
    image:'assets/inimigos/world4/Invasor Bomb.png'
  },

  // ── Miniboss 1: Batroc — Fase 1 ──────────────────────────────────────────────
  batroc: {
    name:'Batroc', hp:20000, speed:110, gold:950,
    ptype:'powerful2', size:38, col:'#b91c1c',
    is_miniboss:true, special:'batroc_special',
    dashInterval:12, dashDist:280,
    image:'assets/inimigos/world4/Batroc.png'
  },

  // ── Miniboss 2: Crossbones — Fase 2 ──────────────────────────────────────────
  crossbones: {
    name:'Crossbones', hp:30000, speed:60, gold:1500,
    ptype:['powerful2','fortified'], shieldHp:15000,
    size:42, col:'#1c1917', is_miniboss:true,
    special:'crossbones_special',
    vestCountdown:6, berserkSpeedMult:1.65,
    image:'assets/inimigos/world4/Crossbones.png'
  },

  // ── Miniboss 3: Ronan — Fase 3 ───────────────────────────────────────────────
  ronan: {
    name:'Ronan, o Acusador', hp:45000, speed:45, gold:2200,
    ptype:'powerful2', size:44, col:'#1e1b4b',
    is_miniboss:true, special:'ronan_special',
    verdictInterval:22, verdictDuration:7,
    on_death:{ type:'invasor', count:6 },
    image:'assets/inimigos/world4/Ronan.png'
  },

  // ── Miniboss 4: Corvus Glaive — Fase 4 ───────────────────────────────────────
  corvus_glaive: {
    name:'Corvus Glaive', hp:55000, speed:55, gold:3200,
    ptype:['powerful3','fortified'], shieldHp:38000,
    size:46, col:'#0f172a', is_miniboss:true,
    special:'corvus_glaive_special',
    shieldRegenThreshold:5,
    image:'assets/inimigos/world4/Corvus Glaive.png'
  },

  // ── Miniboss 5: Ebony Maw — Fase 5 ───────────────────────────────────────────
  ebony_maw: {
    name:'Ebony Maw', hp:65000, speed:48, gold:4200,
    ptype:['powerful3','regenerator'], regenRate:300,
    size:46, col:'#1e3a5f', is_miniboss:true,
    special:'ebony_maw_special',
    pushInterval:18, pushDist:200,
    invertInterval:28, invertDuration:6, invertCount:3,
    image:'assets/inimigos/world4/Ebony Maw.png'
  },

  // ── Boss Fase 1: Thanos — O Eterno ───────────────────────────────────────────
  thanos_fase1: {
    name:'Thanos — O Eterno', hp:100000, speed:20, gold:9000,
    ptype:['powerful3','fortified'], shieldHp:100000,
    size:58, col:'#581c87', is_boss:true,
    special:'thanos_fase1_special',
    on_death:{ type:'thanos_manopla', count:1 },
    snapInterval:25, snapDuration:4, drainInterval:3,
    image:'assets/inimigos/world4/Thanos.png'
  },

  // ── Boss Fase 2: Thanos — Manopla Completa ────────────────────────────────────
  thanos_manopla: {
    name:'Thanos — Manopla Completa', hp:120000, speed:55, gold:6000,
    ptype:'powerful3', size:58, col:'#7c3aed', is_boss:true,
    special:'thanos_manopla_special',
    snapInterval:10, snapDuration:3,
    gemInterval:20,
    image:'assets/inimigos/world4/Thanos Full Power.png'
  },

  // ═══════════════════════════════════════════════
  //  EVENTO 2 — OPERAÇÃO: RESSURREIÇÃO
  // ═══════════════════════════════════════════════

  // ── Capítulo 1: A Queda da Areia ─────────────────────────────────────────────
  areia_soldado: {
    name:'Soldado da Areia', hp:3500, speed:70, gold:80,
    ptype:'normal', size:22, col:'#d97706',
    image:'assets/inimigos/eventos/op_ressureicao/Areia Soldado.png'
  },
  areia_marionete: {
    name:'Marionete da Areia', hp:9000, speed:95, gold:280,
    ptype:['powerful1','speed'], size:18, col:'#b45309',
    image:'assets/inimigos/eventos/op_ressureicao/Areia Marionete.png'
  },
  areia_golem: {
    name:'Golem de Areia', hp:30000, speed:38, gold:1800,
    ptype:['powerful2','fortified'], shieldHp:20000,
    size:40, col:'#78350f',
    image:'assets/inimigos/eventos/op_ressureicao/Areia Golem.png'
  },
  replicante_kazekage: {
    name:'Replicante do Kazekage', hp:50000, speed:48, gold:5000,
    ptype:['powerful3','fortified'], shieldHp:60000,
    size:52, col:'#92400e', is_boss:true,
    special:'base_drain',
    on_death:{ type:'areia_soldado', count:4 },
    drainInterval:5,
    image:'assets/inimigos/eventos/op_ressureicao/Replicante Kazekage.png'
  },

  // ── Capítulo 2: Névoa Sangrenta ───────────────────────────────────────────────
  nebulino: {
    name:'???', hp:4000, speed:65, gold:90,
    ptype:'normal', size:22, col:'#6b7280',
    image:'assets/inimigos/eventos/op_ressureicao/Nebulino.png'
  },
  espada_nebulosa: {
    name:'???', hp:10000, speed:110, gold:320,
    ptype:['powerful1','speed'], size:18, col:'#4b5563',
    image:'assets/inimigos/eventos/op_ressureicao/Espada Nebulosa.png'
  },
  zumbi_kaguya: {
    name:'???', hp:40000, speed:50, gold:1600,
    ptype:['powerful2','regenerator'], regenRate:180,
    size:38, col:'#374151',
    image:'assets/inimigos/eventos/op_ressureicao/Zumbi Kaguya.png'
  },
  replicante_mizukage: {
    name:'Replicante do Mizukage', hp:65000, speed:70, gold:6000,
    ptype:'powerful3', size:54, col:'#1e3a5f', is_boss:true,
    special:'mizukage_special',
    genjutsuInterval:20, genjutsuDuration:5,
    image:'assets/inimigos/eventos/op_ressureicao/Replicante Mizukage.png'
  },

  // ── Capítulo 3: O Coração de Pedra ────────────────────────────────────────────
  guerreiro_pedra: {
    name:'Guerreiro de Pedra', hp:5000, speed:60, gold:100,
    ptype:'normal', size:24, col:'#57534e',
    image:'assets/inimigos/eventos/op_ressureicao/Guerreiro Pedra.png'
  },
  explosao_terra: {
    name:'Explosão de Terra', hp:2500, speed:100, gold:200,
    ptype:['powerful1','bomber'], bomberRadius:100, bomberStun:1.5,
    size:20, col:'#a16207',
    image:'assets/inimigos/eventos/op_ressureicao/Explosao Terra.png'
  },
  golem_terra: {
    name:'Golem de Terra', hp:40000, speed:35, gold:2200,
    ptype:['powerful2','fortified'], shieldHp:35000,
    size:44, col:'#292524',
    image:'assets/inimigos/eventos/op_ressureicao/Golem Terra.png'
  },
  replicante_tsuchikage: {
    name:'Replicante do Tsuchikage', hp:80000, speed:42, gold:7000,
    ptype:'powerful3', size:52, col:'#1c1917', is_boss:true,
    special:'tsuchikage_special',
    spawnInterval:15, spawnCount:2,
    image:'assets/inimigos/eventos/op_ressureicao/Replicante Tsuchikage.png'
  },

  // ── Capítulo 4: Tempestade de Trovões ─────────────────────────────────────────
  kumo_ninja: {
    name:'Ninja das Nuvens', hp:4500, speed:80, gold:90,
    ptype:'normal', size:22, col:'#7c3aed',
    image:'assets/inimigos/eventos/op_ressureicao/Kumo Ninja.png'
  },
  kumo_rapido: {
    name:'Ninja das Nuvens Speed', hp:7000, speed:140, gold:250,
    ptype:['powerful1','speed'], size:18, col:'#6d28d9',
    image:'assets/inimigos/eventos/op_ressureicao/Kumo Rapido.png'
  },
  jinchuuriki_corrompido: {
    name:'Jinchuuriki Corrompido', hp:70000, speed:55, gold:2500,
    ptype:['powerful2','fortified'], shieldHp:30000,
    size:42, col:'#4c1d95',
    image:'assets/inimigos/eventos/op_ressureicao/Jinchuuriki Corrompido.png'
  },
  replicante_killerbee: {
    name:'Replicante de Killer Bee', hp:100000, speed:60, gold:8000,
    ptype:'powerful3', size:56, col:'#581c87', is_boss:true,
    special:'killerbee_replica_special',
    jinchuurikiImmuneType: 'single',
    immuneCycleInterval: 30,
    image:'assets/inimigos/eventos/op_ressureicao/Replicante Killer Bee.png'
  },
};

let _enemyCounter = 0;

// Deriva o nível mínimo de upgrade necessário a partir dos ptypes.
// Elimina a necessidade do campo `req` nas definições de inimigos.
function deriveReq(ptypes) {
  if (ptypes.includes('powerful3')) return 3;
  if (ptypes.includes('powerful2')) return 2;
  if (ptypes.includes('powerful1')) return 1;
  return 0;
}

function createEnemy(typeId, distanceOffset = 0) {
  const d = ENEMY_DEFS[typeId];
  if (!d) return null;

  // Normaliza ptype para array — suporta string ou array
  const ptypes = Array.isArray(d.ptype) ? d.ptype : [d.ptype];

  const enemy = {
    uid: ++_enemyCounter,
    type: typeId,
    name: d.name,
    maxHp: d.hp,
    hp: d.hp,
    speed: d.speed,
    gold: d.gold,
    ptype: d.ptype,   // mantém original para compatibilidade
    ptypes,
    req: d.req ?? deriveReq(ptypes),
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

  // Inicializa special legado (explosion, genjutsu, pain_boss, etc.)
  if (d.special && ENEMY_SPECIAL_HANDLERS[d.special]?.init) {
    ENEMY_SPECIAL_HANDLERS[d.special].init(enemy, d);
  }

  // Inicializa behaviors por ptype (clooner, bomber, fortified, etc.)
  ptypes.forEach(pt => PTYPE_BEHAVIORS[pt]?.init?.(enemy, d));

  return enemy;
}

function applyStatus(enemy, type, params) {
  // Fortified: imune a status enquanto o escudo estiver ativo
  if ((enemy.ptypes || []).includes('fortified') && (enemy.shieldHp || 0) > 0) return;
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
