const Game = (() => {
  let canvas, ctx;
  let running = false, paused = false, gameSpeed = 1;
  let lastTime = 0;

  // Render transform — uniform scale to preserve aspect ratio
  let renderScale = 1, renderOffX = 0, renderOffY = 0;

  // Game state
  let lives, gold, wave, totalWaves;
  let enemies, towers, projectiles, effects, tsunamis;
  let waveActive, spawnQueue, betweenWaves, betweenTimer, waveElapsed;
  let activeWavesCount = 1;
  let endDialogPlayed = false;
  let selectedTowerIdx, deployingCharId;
  let shinraTenseiActive, shinraTenseiTimer, stageModifierTimer;
  let stage, team;
  let difficulty;

  // Stats tracking per session
  let sessionDmg = 0, sessionKills = 0, sessionTowersPlaced = 0;
  let sessionMinibosses = 0, sessionBossKilled = false;

  const CHAR_COLORS = {
    ichigo_base:      '#ff6b00',
    goku_base:        '#4fc3f7',
    l_deathnote:      '#bdbdbd',
    demolidor:        '#e53935',
    sasuke_uchiha:    '#7986cb',
    killua_zoldyck:   '#e8eaf6',
    tanjiro_kamado:   '#ef5350',
    zoro_3:           '#66bb6a',
    naruto_shippuden: '#ff8c00',
    luffy_3:          '#ff7043',
    levi_ackerman:    '#b0bec5',
    meliodas_base:    '#ab47bc',
    naruto_sage:      '#ffb300',
    gojo_satoru:      '#e3f2fd',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PASSIVE_SYSTEM — tabela central de todas as passivas de personagens.
  //
  // Cada chave corresponde ao campo `type` em charData.passive.
  // Hooks disponíveis por entrada:
  //   update(tower, p, dt)                          → tick por frame
  //   beforeAttack(tower, p, stats) → stats | null  → null = pula ataque
  //   onHit(tower, p, enemy, dmg) → dmg             → pode modificar dano
  //   afterAttack(tower, p, hitEnemies, attackType, stats) → efeitos pós-acerto
  //   onKill(tower, p, enemy)                       → ao confirmar kill
  //   onAnyKill(tower, p, deadEnemy)                → qualquer kill no campo
  //   onWaveEnd(tower, p)                           → ao fim de cada wave
  //   isAura: true + auraEffect(auraTower, p, attackingTower, dmg) → dmg
  //   canDamageOverride(tower, p, enemy) → bool     → bypass de req check
  //
  // Para adicionar nova passiva: crie uma entrada aqui. Não precisa tocar
  // em nenhuma outra função — os dispatchers abaixo chamam automaticamente.
  // Entradas únicas servem de template para futuras passivas similares.
  // ─────────────────────────────────────────────────────────────────────────
  const PASSIVE_SYSTEM = {

    // ── Dispatchers ────────────────────────────────────────────────────────
    _getPassives(tower) {
      const p = tower.charData?.passive;
      if (!p) return [];
      if (Array.isArray(p)) return p;
      return [p];
    },
    onUpdate(tower, dt) {
      this._getPassives(tower).forEach(p => this[p.type]?.update?.(tower, p, dt));
    },
    onBeforeAttack(tower, stats) {
      let s = stats;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.beforeAttack) s = h.beforeAttack(tower, p, s) ?? s;
      });
      return s;
    },
    onHit(tower, enemy, dmg) {
      let d = dmg;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.onHit) d = h.onHit(tower, p, enemy, d) ?? d;
      });
      return d;
    },
    onAfterAttack(tower, hitEnemies, attackType, stats) {
      this._getPassives(tower).forEach(p => this[p.type]?.afterAttack?.(tower, p, hitEnemies, attackType, stats));
    },
    onKill(tower, enemy) {
      this._getPassives(tower).forEach(p => this[p.type]?.onKill?.(tower, p, enemy));
    },
    onAnyKill(tower, deadEnemy) {
      this._getPassives(tower).forEach(p => this[p.type]?.onAnyKill?.(tower, p, deadEnemy));
    },
    onWaveEnd(tower) {
      this._getPassives(tower).forEach(p => this[p.type]?.onWaveEnd?.(tower, p));
    },
    // Retorna { text, color } para exibir badge acima da torre, ou null.
    renderBadge(tower) {
      let badge = null;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.renderBadge) badge = h.renderBadge(tower, p) || badge;
      });
      return badge;
    },
    applyAuras(attackingTower, enemy, dmg) {
      let d = dmg;
      towers.forEach(t => {
        if (t === attackingTower || t.disabled) return;
        this._getPassives(t).forEach(p => {
          const h = this[p.type];
          if (h?.isAura && h.auraEffect) d = h.auraEffect(t, p, attackingTower, d);
        });
      });
      return d;
    },
    canDamageOverride(tower, enemy) {
      let override = false;
      this._getPassives(tower).forEach(p => {
        const h = this[p.type];
        if (h?.canDamageOverride && h.canDamageOverride(tower, p, enemy)) override = true;
      });
      return override ? true : null;
    },

    // ── Passivas ────────────────────────────────────────────────────────────

    // Template: passiva baseada em timer periódico que invoca aliado/projétil.
    tsunami: {
      update(tower, p, dt) {
        if (tower.disabled) return;
        tower.tsunamiTimer = (tower.tsunamiTimer || 0) + dt;
        const interval = getPassiveValue(tower, 'interval', p.interval);
        if (tower.tsunamiTimer >= interval) {
          tower.tsunamiTimer = 0;
          const hp = getPassiveValue(tower, 'hp', p.hp);
          tsunamis.push({ hp, maxHp: hp, dist: PATH_LENGTH, speed: 100, color: '#3498db', hitIds: new Set() });
          UI.toast('🌊 Tsunami Reversivo Invocado!', 2000);
        }
      }
    },

    // Template: stacker de kills com multiplicador de dano e decaimento por tempo.
    kill_streak: {
      renderBadge(tower, p) {
        if (!(tower.killStreak > 0)) return null;
        return { text: `×${tower.killStreak}`, color: '#f56565' };
      },
      update(tower, p, dt) {
        if (tower.isClone || !(tower.killStreak > 0)) return;
        tower.killDecayTimer = (tower.killDecayTimer || 0) - dt;
        if (tower.killDecayTimer <= 0) { tower.killStreak = 0; tower.killDecayTimer = 0; }
      },
      onHit(tower, p, enemy, dmg) {
        if (tower.killStreak > 0) return dmg * (1 + tower.killStreak * p.stack_bonus);
        return dmg;
      },
      onKill(tower, p, enemy) {
        const maxS   = getPassiveValue(tower, 'max_stacks', p.max_stacks || 999);
        const decayT = getPassiveValue(tower, 'decay_time', p.decay_time);
        tower.killStreak = Math.min((tower.killStreak || 0) + 1, maxS);
        tower.killDecayTimer = decayT;
      }
    },

    // Template: aura de área que aplica debuff passivamente a cada frame.
    slow_aura: {
      update(tower, p, dt) {
        if (tower.disabled) return;
        const stats   = getTowerStats(tower);
        const slowPct = getPassiveValue(tower, 'slow_pct', p.slow_pct);
        enemies.forEach(e => {
          if (e.dead || e.reached_end) return;
          if (dist2d(tower.x, tower.y, e.x, e.y) <= stats.range)
            applyStatus(e, 'freeze', { slow_pct: slowPct, duration: 0.2 });
        });
      }
    },

    // Template: bypass de requisito de upgrade (pierce / ignore armor).
    sharingan: {
      canDamageOverride(tower, p, enemy) { return true; }
    },

    // Template: padrão de ataque rítmico — ataca N vezes, descansa N vezes.
    zoro_burst: {
      beforeAttack(tower, p, stats) {
        tower.burstCount = (tower.burstCount || 0) + 1;
        if (tower.burstCount > 3) {
          if (tower.burstCount >= 6) tower.burstCount = 0;
          return null;
        }
        return stats;
      }
    },

    // Template: N-ésimo ataque aplica multiplicador de dano (combo counter).
    three_swords: {
      renderBadge(tower, p) {
        const cnt  = (tower.comboCounter || 0) + 1;
        const mult = getPassiveValue(tower, 'mult', p.mult || 3);
        const color = cnt >= 3 ? '#ffc846' : cnt === 2 ? 'rgba(255,200,70,0.7)' : 'rgba(255,255,255,0.35)';
        return { text: `${cnt}/3 [${mult}×]`, color };
      },
      beforeAttack(tower, p, stats) {
        if (tower.isClone) return stats;
        tower.comboCounter = (tower.comboCounter || 0) + 1;
        if (tower.comboCounter >= 3) {
          const mult = getPassiveValue(tower, 'mult', p.mult || 3);
          tower.comboCounter = 0;
          addEffect({ type:'crit', x:tower.x, y:tower.y, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.45, maxTimer:0.45, charId:tower.charId });
          return { ...stats, damage: stats.damage * mult };
        }
        return stats;
      }
    },

    // Template: chance de ataque extra no mesmo ciclo (apenas single_target).
    double_hit: {
      afterAttack(tower, p, hitEnemies, attackType, stats) {
        if (tower.isClone || attackType !== 'single_target' || hitEnemies.length === 0) return;
        const chance = getPassiveValue(tower, 'chance', p.chance);
        if (Math.random() < chance) spawnProjectile(tower, hitEnemies[0], stats.damage, 'single');
      }
    },

    // Template: invocação de aliado temporário baseada em chance por ataque.
    clone_on_attack: {
      afterAttack(tower, p, hitEnemies, attackType, stats) {
        if (tower.isClone) return;
        const chance = getPassiveValue(tower, 'chance', p.chance);
        if (Math.random() < chance) spawnClone(tower);
      }
    },

    // Template: aura de boost de dano para aliados no alcance da torre.
    damage_aura: {
      isAura: true,
      auraEffect(auraTower, p, attackingTower, dmg) {
        if (dist2d(auraTower.x, auraTower.y, attackingTower.x, attackingTower.y) <= getTowerStats(auraTower).range)
          return dmg * (1 + getPassiveValue(auraTower, 'bonus', p.bonus));
        return dmg;
      }
    },

    // Template: redução de cooldown de ataque ao confirmar kill.
    kill_cooldown: {
      onKill(tower, p, enemy) {
        const period    = 1 / getTowerStats(tower).attack_speed;
        const reduction = getPassiveValue(tower, 'reduction', p.reduction);
        tower.attackTimer = Math.min(tower.attackTimer, period * reduction);
      }
    },

    // Template: aplica status em TODO acerto (dps/duration escalam com upgrades).
    status_on_hit: {
      onHit(tower, p, enemy, dmg) {
        const dps = getPassiveValue(tower, 'dps', p.dps);
        const dur = getPassiveValue(tower, 'duration', p.duration);
        applyStatus(enemy, p.status, { ...p, dps, duration: dur });
        return dmg;
      }
    },

    // Bansho Ten'in: Puxa inimigos para trás a cada N ataques
    bansho_tenin: {
      afterAttack(tower, p, hitEnemies, attackType, stats) {
        tower.banshoCount = (tower.banshoCount || 0) + 1;
        const req = getPassiveValue(tower, 'attacks_required', p.attacks_required || 4);
        if (tower.banshoCount >= req) {
          tower.banshoCount = 0;
          const pushDist = getPassiveValue(tower, 'push_dist', p.push_dist || 30);
          hitEnemies.forEach(e => {
            e.dist = Math.max(0, e.dist - pushDist);
            const pos = getPosOnPath(e.dist, e.pathArr);
            e.x = pos.x; e.y = pos.y;
            addEffect({ type:'silenced', x: e.x, y: e.y, color:'#9b59b6', text:'Puxado!', timer:0.8, maxTimer:0.8 });
          });
        }
      }
    },

    // Template: aplica status com CHANCE por acerto.
    status_on_hit_chance: {
      onHit(tower, p, enemy, dmg) {
        if (Math.random() < p.chance) applyStatus(enemy, p.status, { duration: p.duration });
        return dmg;
      }
    },

    // Template: chance de dano crítico com multiplicador escalável.
    critical: {
      onHit(tower, p, enemy, dmg) {
        const chance = getPassiveValue(tower, 'chance', p.chance);
        const mult   = getPassiveValue(tower, 'mult',   p.mult);
        if (Math.random() < chance) {
          addEffect({ type:'crit', x:enemy.x, y:enemy.y, color:RARITY_COLORS[tower.rarity], timer:0.35, maxTimer:0.35 });
          return dmg * mult;
        }
        return dmg;
      }
    },

    // Template: dano multiplicado contra inimigos com status específico ativo.
    bonus_vs_burned: {
      onHit(tower, p, enemy, dmg) {
        if (enemy.status.burn?.active) return dmg * p.mult;
        return dmg;
      }
    },

    // Template: chance de gerar recurso (ouro) por acerto.
    ladra: {
      onHit(tower, p, enemy, dmg) {
        if (Math.random() < p.chance) {
          gold += 1;
          addEffect({ type:'coin', x:enemy.x, y:enemy.y - 15, color:'#f1c40f', timer:0.5, maxTimer:0.5 });
        }
        return dmg;
      }
    },

    // Template único: anula ptype/special do inimigo no primeiro acerto (permanente).
    // Para versão reversível com timer, veja STATUS_TYPES.silenciado em enemies.js.
    silence_buffs: {
      onHit(tower, p, enemy, dmg) {
        if (!enemy.silenceChecked) {
          enemy.silenceChecked = true;
          if ((enemy.ptype !== 'normal' || enemy.special) && Math.random() < p.chance) {
            enemy.ptype  = 'normal';
            enemy.special = null;
            addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:40, color:'#9b59b6', timer:0.4, maxTimer:0.4 });
          }
        }
        return dmg;
      }
    },

    // Template único: aplica MÚLTIPLOS status simultâneos em cada acerto.
    dual_affliction: {
      onHit(tower, p, enemy, dmg) {
        const bDps  = getPassiveValue(tower, 'burn_dps',  p.burn_dps);
        const blDps = getPassiveValue(tower, 'bleed_dps', p.bleed_dps);
        applyStatus(enemy, 'burn',        { dps: bDps,  duration: p.burn_duration });
        applyStatus(enemy, 'sangramento', { dps: blDps, duration: p.bleed_duration });
        return dmg;
      }
    },

    // Template: geração de ouro ao fim de cada wave + bônus por kill na área.
    wave_gold: {
      onWaveEnd(tower, p) {
        if (tower.isClone) return;
        let wg = p.base + (tower.level - 1) * (p.perLevel || 0);
        for (let i = 0; i < tower.upgradeLevel; i++) wg += tower.charData.upgrades[i]?.gold_bonus || 0;
        if (wg > 0) { gold += wg; updateHUD(); UI.toast(`💰 L gerou +${wg} ouro!`, 2500); }
      },
      onAnyKill(tower, p, deadEnemy) {
        if (tower.isClone) return;
        let killGold = 0;
        for (let i = 0; i < tower.upgradeLevel; i++) killGold = tower.charData.upgrades[i]?.kill_gold || killGold;
        if (killGold > 0 && dist2d(tower.x, tower.y, deadEnemy.x, deadEnemy.y) <= getTowerStats(tower).range) {
          gold += killGold; updateHUD();
        }
      }
    },

    none: {}
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ENEMY_SPECIAL_HANDLERS (jogo) — versão interna que fecha sobre o estado
  // do jogo. Delega para as definições de enemies.js passando ctx.
  //
  // ctx expõe o estado necessário: towers, enemies, addEffect, toast,
  // activateShinraTensei, drainLife, dist2d, CANVAS_W, CANVAS_H.
  // ─────────────────────────────────────────────────────────────────────────
  function _enemyCtx() {
    return {
      towers, enemies,
      addEffect,
      toast: (msg, d) => UI.toast(msg, d),
      activateShinraTensei,
      drainLife() { lives = Math.max(0, lives - 1); updateHUD(); if (lives <= 0) endGame(false); },
      dist2d,
      CANVAS_W, CANVAS_H
    };
  }

  function dispatchSpecialSpawn(enemy)    { if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onSpawn?.(enemy, _enemyCtx()); }
  function dispatchSpecialUpdate(enemy, dt){ if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onUpdate?.(enemy, dt, _enemyCtx()); }
  function dispatchSpecialDeath(enemy)    { if (enemy.special) ENEMY_SPECIAL_HANDLERS[enemy.special]?.onDeath?.(enemy, _enemyCtx()); }

  // ─────────────────────────────────────────────────────────────────────────
  // ATTACK_TYPE_HANDLERS — define como cada tipo de ataque executa e produz
  // efeito visual. Para criar um novo tipo: adicione uma entrada aqui.
  //
  // execute(tower, stats, inRange) → array de inimigos atingidos
  // effect(tower, stats, hitEnemies) → efeito visual (sem retorno)
  // ─────────────────────────────────────────────────────────────────────────
  const ATTACK_TYPE_HANDLERS = {

    // Template: ataque que dispara projétil contra o inimigo mais avançado.
    single_target: {
      execute(tower, stats, inRange) {
        const target = inRange.reduce((best, e) => e.dist > best.dist ? e : best, inRange[0]);
        if (!effectiveCanDamage(tower, target)) return [];
        spawnProjectile(tower, target, stats.damage, 'single');
        return [target];
      },
      effect(tower, stats, hitEnemies) {}
    },

    // Template: ataque em arco de 90° centrado no inimigo mais avançado.
    cone: {
      execute(tower, stats, inRange) {
        const target = inRange.reduce((best, e) => e.dist > best.dist ? e : best, inRange[0]);
        const dx = target.x - tower.x, dy = target.y - tower.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) return [];
        const nx = dx/len, ny = dy/len;
        const CONE_HALF = Math.PI / 4;
        const hits = [];
        inRange.forEach(e => {
          const ex = e.x - tower.x, ey = e.y - tower.y;
          const elen = Math.sqrt(ex*ex + ey*ey);
          if (elen === 0) return;
          const dot = (ex/elen)*nx + (ey/elen)*ny;
          if (dot >= Math.cos(CONE_HALF) && effectiveCanDamage(tower, e)) {
            dealDamage(tower, e, stats.damage);
            hits.push(e);
          }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        const target = hitEnemies.reduce((best, e) => e.dist > best.dist ? e : best, hitEnemies[0]);
        addEffect({ type:'cone_flash', x:tower.x, y:tower.y, tx:target.x, ty:target.y, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.25, maxTimer:0.25, charId:tower.charId });
      }
    },

    // Template: ataque linear que acerta todos no corredor à frente.
    linha: {
      execute(tower, stats, inRange) {
        const target = inRange.reduce((best, e) => e.dist > best.dist ? e : best, inRange[0]);
        const dx = target.x - tower.x, dy = target.y - tower.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) return [];
        const nx = dx/len, ny = dy/len;
        tower._lineEndX = tower.x + nx * stats.range;
        tower._lineEndY = tower.y + ny * stats.range;
        const hits = [];
        inRange.forEach(e => {
          const ex = e.x - tower.x, ey = e.y - tower.y;
          const dot = ex*nx + ey*ny;
          if (dot >= 0 && dot <= stats.range && Math.abs(ex*ny - ey*nx) < 30 && effectiveCanDamage(tower, e)) {
            dealDamage(tower, e, stats.damage);
            hits.push(e);
          }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'line', x:tower.x, y:tower.y, tx:tower._lineEndX, ty:tower._lineEndY, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.2, maxTimer:0.2, charId:tower.charId });
      }
    },

    // Template: ataque em área circular — acerta todos no raio.
    aoe: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.3, maxTimer:0.3, r:0, charId:tower.charId });
      }
    },

    // Template: AOE sem restrição de req (versão premium do aoe).
    aoe_full: {
      execute(tower, stats, inRange) {
        const hits = [];
        inRange.forEach(e => {
          if (effectiveCanDamage(tower, e)) { dealDamage(tower, e, stats.damage); hits.push(e); }
        });
        return hits;
      },
      effect(tower, stats, hitEnemies) {
        if (hitEnemies.length === 0) return;
        addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.35, maxTimer:0.35, r:0, charId:tower.charId });
      }
    }
  };

  // Hover position
  let hoverX = 0, hoverY = 0;

  function getDifficultyMults() {
    if (difficulty === 'dificil')  return { hp: 1.5, gold: 1.2 };
    if (difficulty === 'lendario') return { hp: 2.2, gold: 1.4 };
    return { hp: 1.0, gold: 1.0 };
  }

  // Retorna o valor mais recente de um campo de passive_override nos upgrades comprados
  function getPassiveValue(tower, key, defaultVal) {
    let val = defaultVal;
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const u = tower.charData.upgrades[i];
      if (u.passive_override && u.passive_override[key] !== undefined) val = u.passive_override[key];
    }
    return val;
  }

  // Retorna o valor de active_override nos upgrades comprados
  function getActiveValue(tower, key, defaultVal) {
    let val = defaultVal;
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const u = tower.charData.upgrades[i];
      if (u.active_override && u.active_override[key] !== undefined) val = u.active_override[key];
    }
    return val;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    if (canvas.width === cw && canvas.height === ch) return;
    canvas.width = cw;
    canvas.height = ch;
    renderScale = Math.min(cw / CANVAS_W, ch / CANVAS_H);
    renderOffX = Math.floor((cw - CANVAS_W * renderScale) / 2);
    renderOffY = Math.floor((ch - CANVAS_H * renderScale) / 2);
  }

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
    resizeCanvas();
  }

  function startGame() {
    resizeCanvas(); // Ensure canvas matches container before game starts
    const stageId = UI.getSelectedStage();
    const teamIds = UI.getSelectedTeam();
    difficulty = UI.getSelectedDifficulty();
    if (!stageId || teamIds.length === 0) {
      UI.toast('Selecione ao menos uma unidade!');
      return;
    }

    stage = getStage(stageId);
    team = teamIds;
    if (!stage) return;

    const wdef = WORLDS.find(w => w.id === stage.world);
    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.className = ''; // Clear previous themes
      if (wdef) canvasEl.classList.add(`theme-${wdef.id}`);
    }
    
    if (stage.paths && stage.paths.length > 0) {
      window.currentPaths = stage.paths;
      updatePath(stage.paths[0]);
    } else if (wdef && wdef.path) {
      window.currentPaths = [wdef.path];
      updatePath(wdef.path);
    } else {
      window.currentPaths = [PATH_POINTS];
    }

    // Reset state
    lives = stage.base_hp || 20;
    gold = 300;
    wave = 0;
    totalWaves = stage.waves.length;
    activeWavesCount = 1;
    enemies = [];
    towers = [];
    projectiles = [];
    effects = [];
    tsunamis = [];
    waveActive = false;
    spawnQueue = [];

    betweenWaves = true;
    betweenTimer = 3;
    selectedTowerIdx = -1;
    deployingCharId = null;
    shinraTenseiActive = false;
    shinraTenseiTimer = 0;
    stageModifierTimer = 0;
    waveElapsed = 0;
    sessionDmg = 0; sessionKills = 0; sessionTowersPlaced = 0;
    sessionMinibosses = 0; sessionBossKilled = false;

    // Free placement (no slots)

    UI.showGame();
    renderTeamPanel();
    updateHUD();
    closeUpgradePanel();

    running = true;
    paused = false;
    gameSpeed = 1;
    lastTime = 0;
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.textContent = '⏸';
    const speedEl = document.getElementById('speed-indicator');
    if (speedEl) speedEl.textContent = '1×';
    requestAnimationFrame(loop);

    endDialogPlayed = false;
    if (stage.dialogues && stage.dialogues.start) {
      setTimeout(() => {
        if (typeof Dialog !== 'undefined') Dialog.play(stage.dialogues.start);
      }, 500);
    }
  }

  function loop(ts) {
    if (!running) return;
    if (lastTime === 0) lastTime = ts;
    const rawDt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;
    const dt = (paused || dialogPaused) ? 0 : rawDt * gameSpeed;

    update(dt, rawDt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt, rawDt) {
    if (dt === 0) return;

    // Between waves countdown
    if (betweenWaves) {
      betweenTimer -= dt;
      if (betweenTimer <= 0) {
        betweenWaves = false;
        startWave();
      }
      return;
    }

    // Spawn queue
    updateSpawn(dt);
    updateEnemiesLoop(dt);
    updateTowersLoop(dt);
    updateProjectiles(dt);
    
    if (stage && stage.modifiers && stage.modifiers.meteors_and_shinra) {
      stageModifierTimer += dt;
      if (stageModifierTimer >= 20) {
        stageModifierTimer = 0;
        triggerMeteorAndShinra();
      }
    }

    // Tsunami loop
    tsunamis.forEach(tsu => {
      tsu.dist -= tsu.speed * dt;
      const pos = getPosOnPath(tsu.dist);
      tsu.x = pos.x; tsu.y = pos.y;

      enemies.forEach(e => {
        if (e.dead || e.reached_end) return;
        if (!tsu.hitIds.has(e.uid) && dist2d(tsu.x, tsu.y, e.x, e.y) < 60) {
          tsu.hitIds.add(e.uid);
          const dmg = Math.min(e.hp, tsu.hp);
          tsu.hp -= dmg;
          dealDamage({ charData: {}, rarity: 5 }, e, dmg); // dummy tower to deal damage
        }
      });
      // Add bubble effect trail
      if (Math.random() < 0.3) {
        addEffect({ type:'ring', x:tsu.x + (Math.random()*40-20), y:tsu.y + (Math.random()*40-20), maxR:20, color:'#e0f7fa', timer:0.3, maxTimer:0.3 });
      }
    });
    tsunamis = tsunamis.filter(t => t.hp > 0 && t.dist > 0);

    // End wave conditions(dt);
    updateEffects(dt);
    updateShinraTensei(dt);
    checkWaveEnd();
  }

  function triggerMeteorAndShinra() {
    UI.toast('⚠️ O PAIN USOU SHINRA TENSEI E QUEDA DE METEOROS! ⚠️', 4000);
    
    // 1. Escolhe alvos para os meteoros (foca torres)
    const targets = [];
    if (towers.length > 0) {
      const numMeteors = Math.min(3, Math.ceil(towers.length / 3));
      for(let i = 0; i < numMeteors; i++) {
        const t = towers[Math.floor(Math.random() * towers.length)];
        targets.push({x: t.x, y: t.y});
      }
    } else {
      targets.push({x: CANVAS_W/2, y: CANVAS_H/2});
    }

    // Aplica os meteoros e stuns pesados
    targets.forEach(pt => {
      addEffect({ type: 'meteor_strike', x: pt.x, y: pt.y, maxR: 90, color: '#f56565', timer: 1.0, maxTimer: 1.0, r: 0 });
      towers.forEach(t => {
        if (dist2d(t.x, t.y, pt.x, pt.y) <= 90) {
          t.miniStunTimer = Math.max((t.miniStunTimer || 0), 8); // 8s de stun pesado
          t.disabled = true;
        }
      });
    });

    // 2. Onda de Choque Shinra Tensei e empurrão
    shinraTenseiActive = true;
    shinraTenseiTimer = 2.5;
    addEffect({ type:'shockwave', x: CANVAS_W/2, y: CANVAS_H/2, maxR: 800, color: '#e74c3c', timer: 0.8, maxTimer: 0.8, r: 0 });
    
    enemies.forEach(e => {
      if (e.dead || e.reached_end) return;
      e.dist += 40; // Empurra os inimigos 40px para frente
      const pos = getPosOnPath(e.dist, e.pathArr);
      e.x = pos.x; e.y = pos.y;
    });

    // Mini-stun em torres que não foram pegas pelo meteoro
    towers.forEach(t => {
      if ((t.miniStunTimer || 0) < 2.5) {
        t.miniStunTimer = 2.5;
        t.disabled = true;
      }
    });
  }

  function startWave() {
    wave++;
    activeWavesCount = 1;
    spawnQueue = [...stage.waves[wave - 1]];
    waveElapsed = 0;
    waveActive = true;
    updateHUD();
  }

  function skipWave() {
    if (betweenWaves) {
      betweenTimer = 0;
      return;
    }
    if (!waveActive || wave >= totalWaves) return;
    if (activeWavesCount >= 3) {
      UI.toast('⚠️ Limite de 2 waves extras atingido!');
      return;
    }

    const bonus = wave * 11;
    gold += bonus;
    towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

    wave++;
    activeWavesCount++;

    const newEnemies = stage.waves[wave - 1];
    const currentElapsed = waveElapsed;
    const adjusted = newEnemies.map(e => ({...e, delay: e.delay + currentElapsed}));
    spawnQueue.push(...adjusted);
    spawnQueue.sort((a, b) => a.delay - b.delay);

    updateHUD();
    UI.toast(`⏭️ Wave ${wave} chamada! +${bonus}💰`);
  }

  function updateSpawn(dt) {
    if (!waveActive) return;
    waveElapsed += dt;
    while (spawnQueue.length > 0 && waveElapsed >= spawnQueue[0].delay) {
      const next = spawnQueue.shift();
      const e = createEnemy(next.type, 0);
      if (!e) continue;
      const _dm = getDifficultyMults();
      if (_dm.hp !== 1.0)   { e.maxHp = Math.round(e.maxHp * _dm.hp); e.hp = e.maxHp; }
      if (_dm.gold !== 1.0) { e.gold  = Math.round(e.gold  * _dm.gold); }
      e.dist = 0;
      if (window.currentPaths && window.currentPaths.length > 0) {
        e.pathArr = window.currentPaths[Math.floor(Math.random() * window.currentPaths.length)];
      } else {
        e.pathArr = PATH_POINTS;
      }
      e.pathLen = getPathLength(e.pathArr);
      enemies.push(e);
      dispatchSpecialSpawn(e);
    }
  }

  function updateEnemiesLoop(dt) {
    const toRemove = [];
    enemies.forEach(e => {
      if (e.dead || e.reached_end) { toRemove.push(e); return; }

      // Status DoT
      const dot = updateEnemyStatus(e, dt);
      if (dot > 0) {
        e.hp -= dot;
        if (e.hp <= 0) { killEnemy(e); toRemove.push(e); return; }
      }

      // Special periódico do inimigo (shinra_tensei, base_drain, etc.)
      dispatchSpecialUpdate(e, dt);

      // Movement
      const spd = getEffectiveSpeed(e) * dt;
      e.dist += spd;
      const pos = getPosOnPath(e.dist, e.pathArr);
      e.x = pos.x;
      e.y = pos.y;

      if (e.dist >= (e.pathLen || PATH_LENGTH)) {
        e.reached_end = true;
        lives = Math.max(0, lives - 1);
        updateHUD();
        toRemove.push(e);
        if (lives <= 0) endGame(false);
      }
    });
    toRemove.forEach(e => { enemies = enemies.filter(x => x !== e); });
  }

  function updateTowersLoop(dt) {
    const expired = [];
    towers.forEach(t => {
      if (t.isClone) {
        t.cloneTimer -= dt;
        if (t.cloneTimer <= 0) { expired.push(t); return; }
      }
      
      // Tick de passiva (tsunami timer, kill_streak decay, slow_aura, etc.)
      PASSIVE_SYSTEM.onUpdate(t, dt);

      // Ability cooldown tick
      if ((t.abilityTimer || 0) > 0) t.abilityTimer = Math.max(0, t.abilityTimer - dt);

      // Mini stun timer — genjutsu, mini_shinra_tensei
      if ((t.miniStunTimer || 0) > 0 && !t.isClone) {
        t.miniStunTimer -= dt;
        if (t.miniStunTimer <= 0) {
          t.miniStunTimer = 0;
          if (!shinraTenseiActive) t.disabled = false;
        } else {
          t.disabled = true;
        }
      }
      if (t.disabled) return;
      t.attackTimer -= dt;
      if (t.attackTimer <= 0) {
        const stats = getTowerStats(t);
        if (stats.type === 'none' || stats.attack_speed <= 0) { t.attackTimer = 9999; return; }
        t.attackTimer = 1 / stats.attack_speed;
        tryAttack(t, stats);
      }
    });
    if (expired.length) towers = towers.filter(t => !expired.includes(t));
  }

  function effectiveCanDamage(tower, enemy) {
    const override = PASSIVE_SYSTEM.canDamageOverride(tower, enemy);
    if (override !== null) return override;
    return canTowerDamage(tower.upgradeLevel, enemy.req);
  }

  function tryAttack(tower, stats) {
    // Passiva pré-ataque: pode modificar stats ou retornar null para pular
    const modStats = PASSIVE_SYSTEM.onBeforeAttack(tower, stats);
    if (modStats === null) return;
    stats = modStats;

    const inRange = enemies.filter(e => !e.dead && !e.reached_end && dist2d(tower.x, tower.y, e.x, e.y) <= stats.range);
    if (inRange.length === 0) return;

    const handler = ATTACK_TYPE_HANDLERS[stats.type];
    if (!handler) return;

    const hitEnemies = handler.execute(tower, stats, inRange);

    // Status do upgrade aplicado imediatamente ao acertar
    if (tower.statusEffect && hitEnemies.length > 0) {
      hitEnemies.forEach(e => applyStatus(e, tower.statusEffect.type, tower.statusEffect));
    }

    // Passiva pós-ataque: double hit, clone spawning, etc.
    PASSIVE_SYSTEM.onAfterAttack(tower, hitEnemies, stats.type, stats);

    // Efeito visual do tipo de ataque
    handler.effect(tower, stats, hitEnemies);
  }

  function spawnClone(origin) {
    const p = origin.charData.passive;
    const maxClones = getPassiveValue(origin, 'maxClones', p.maxClones);
    const cloneDuration = getPassiveValue(origin, 'duration', p.duration);
    const existing = towers.filter(t => t.isClone && t.charId === origin.charId).length;
    if (existing >= maxClones) return;

    const angle = Math.random() * Math.PI * 2;
    const r = 36 + Math.random() * 28;
    const cx = Math.max(24, Math.min(CANVAS_W - 24, origin.x + Math.cos(angle) * r));
    const cy = Math.max(24, Math.min(CANVAS_H - 36, origin.y + Math.sin(angle) * r));

    towers.push({
      slotId: null, charId: origin.charId,
      x: cx, y: cy,
      rarity: origin.rarity, initials: origin.initials,
      charData: origin.charData,
      level: origin.level, upgradeLevel: origin.upgradeLevel,
      disabled: false,
      attackTimer: Math.random() * (1 / getTowerStats(origin).attack_speed),
      statusEffect: origin.statusEffect, currentType: origin.currentType,
      isClone: true, cloneTimer: cloneDuration
    });
    UI.toast(`🌀 Clone de Naruto invocado! (${cloneDuration}s)`, 2000);
  }

  function spawnProjectile(tower, target, damage, type) {
    const dx = target.x - tower.x, dy = target.y - tower.y;
    projectiles.push({
      x: tower.x, y: tower.y,
      target, damage, tower,
      speed: 300,
      color: RARITY_COLORS[tower.rarity],
      charId: tower.charId,
      angle: Math.atan2(dy, dx),
      dead: false
    });
  }

  function dealDamage(tower, enemy, damage) {
    if (enemy.dead || enemy.reached_end) return;

    // Passiva do atacante (multiplicadores, status, efeitos colaterais)
    let dmg = PASSIVE_SYSTEM.onHit(tower, enemy, damage);

    // Auras de torres aliadas próximas
    dmg = PASSIVE_SYSTEM.applyAuras(tower, enemy, dmg);

    enemy.hp -= dmg;
    enemy.hitFlash = 0.1;
    sessionDmg += dmg;

    if (enemy.hp <= 0) killEnemy(enemy, tower);
  }

  function killEnemy(enemy, killingTower = null) {
    if (enemy.dead) return;
    enemy.dead = true;
    gold += enemy.gold;
    sessionKills++;
    if (enemy.is_miniboss) sessionMinibosses++;
    if (enemy.is_boss) sessionBossKilled = true;
    addEffect({ type:'death', x:enemy.x, y:enemy.y, color:enemy.col, timer:0.4 });
    updateHUD();

    // Passiva da torre que deu o kill
    if (killingTower) PASSIVE_SYSTEM.onKill(killingTower, enemy);

    // Passivas observadoras em todas as torres (L kill_gold, etc.)
    towers.forEach(t => PASSIVE_SYSTEM.onAnyKill(t, enemy));

    // Special de morte do inimigo (explosion, etc.)
    dispatchSpecialDeath(enemy);

    // Spawn ao morrer
    if (enemy.on_death) {
      const _dm = getDifficultyMults();
      for (let i = 0; i < enemy.on_death.count; i++) {
        const spawned = createEnemy(enemy.on_death.type, 0);
        if (spawned) {
          if (_dm.hp !== 1.0)   { spawned.maxHp = Math.round(spawned.maxHp * _dm.hp); spawned.hp = spawned.maxHp; }
          if (_dm.gold !== 1.0) { spawned.gold  = Math.round(spawned.gold  * _dm.gold); }
          spawned.dist = Math.max(0, enemy.dist - (i * 20));
          spawned.pathArr = enemy.pathArr;
          spawned.pathLen = enemy.pathLen;
          const pos = getPosOnPath(spawned.dist, spawned.pathArr);
          spawned.x = pos.x; spawned.y = pos.y;
          enemies.push(spawned);
        }
      }
    }
  }

  function updateProjectiles(dt) {
    projectiles = projectiles.filter(p => {
      if (p.dead) return false;
      if (p.target.dead || p.target.reached_end) { p.dead = true; return false; }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 10) {
        if (effectiveCanDamage(p.tower, p.target)) dealDamage(p.tower, p.target, p.damage);
        if (p.tower.statusEffect) applyStatus(p.target, p.tower.statusEffect.type, { duration: p.tower.statusEffect.duration });
        p.dead = true;
        return false;
      }
      p.angle = Math.atan2(dy, dx);
      const spd = p.speed * dt;
      p.x += (dx/d)*spd;
      p.y += (dy/d)*spd;
      return true;
    });
  }

  function updateEffects(dt) {
    effects = effects.filter(e => {
      e.timer -= dt;
      // Clamp radius to >= 0 to prevent ctx.arc errors with negative values
      if (e.type === 'ring')      e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 0.35)));
      if (e.type === 'shockwave') e.r = Math.max(0, e.maxR * (1 - Math.max(0, e.timer) / (e.maxTimer || 1.0)));
      return e.timer > 0;
    });
  }

  function activateShinraTensei() {
    shinraTenseiActive = true;
    shinraTenseiTimer = 5;
    towers.forEach(t => { t.disabled = true; });
    addEffect({ type:'shockwave', x:400, y:240, maxR:600, color:'#e74c3c', timer:1.0, r:0 });
    UI.toast('⚡ SHINRA TENSEI! Torres desativadas por 5s!', 5000);
  }

  function updateShinraTensei(dt) {
    if (!shinraTenseiActive) return;
    shinraTenseiTimer -= dt;
    if (shinraTenseiTimer <= 0) {
      shinraTenseiActive = false;
      // Só reativa torres que não estão sob mini-stun
      towers.forEach(t => { if ((t.miniStunTimer || 0) <= 0) t.disabled = false; });
    }
  }

  function checkWaveEnd() {
    if (!waveActive) return;
    if (spawnQueue.length === 0 && enemies.length === 0) {
      waveActive = false;
      // Wave bonus
      const bonus = wave * 11;
      gold += bonus;
      updateHUD();
      if (bonus > 0) UI.toast(`Wave ${wave} completa! +${bonus} 💰`);

      // Passiva onWaveEnd de cada torre (wave_gold, etc.)
      towers.forEach(t => PASSIVE_SYSTEM.onWaveEnd(t));

      if (wave >= totalWaves) {
        if (stage.dialogues && stage.dialogues.end && !endDialogPlayed) {
          endDialogPlayed = true;
          if (typeof Dialog !== 'undefined') Dialog.play(stage.dialogues.end, () => endGame(true));
        } else {
          endGame(true);
        }
      } else {
        if (stage.dialogues && stage.dialogues.mid_boss && wave === Math.floor(totalWaves / 2)) {
          if (typeof Dialog !== 'undefined') Dialog.play(stage.dialogues.mid_boss);
        }
        betweenWaves = true;
        betweenTimer = 3;
      }
    }
  }

  function endGame(victory) {
    running = false;
    // Update stats
    Save.incStat('dano_total_causado', Math.round(sessionDmg));
    Save.incStat('inimigos_derrotados', sessionKills);
    Save.incStat('torres_colocadas', sessionTowersPlaced);
    if (sessionMinibosses > 0) Save.incStat('minibosses_derrotados', sessionMinibosses);
    if (sessionBossKilled) { Save.setStat('boss_pain_derrotado', 1); }

    if (!victory) {
      Missions.check();
      UI.showPostBattle({ victory: false });
      return;
    }

    // Victory rewards
    const gemMap = { normal:50, dificil:80, lendario:120 };
    let gems = gemMap[difficulty] || 50;
    const stageId = stage.id;
    const firstTime = !Save.isStageComplete(stageId, difficulty);
    if (firstTime) gems += 50;
    const isBossFase = stage?.isBoss || false;
    if (isBossFase && sessionBossKilled) gems += 30;

    // Material drop
    const dropsAcheived = [];

    if (stage.drops) {
      const currentPity = Save.get().stats['pity_' + stageId] || 0;
      let pityTriggered = false;
      let hasPityRule = false;
      
      for (const drop of stage.drops) {
        if (drop.pity) hasPityRule = true;
        
        // Check pity
        if (drop.pity && currentPity + 1 >= drop.pity && !pityTriggered) {
          dropsAcheived.push(drop.id);
          pityTriggered = true;
          continue;
        }
        
        // Independent Roll
        const roll = Math.random() * 100;
        if (roll <= drop.chance) {
          dropsAcheived.push(drop.id);
          if (drop.pity) pityTriggered = true;
        }
      }
      
      if (hasPityRule) {
        if (pityTriggered) {
          Save.setStat('pity_' + stageId, 0);
        } else {
          Save.setStat('pity_' + stageId, currentPity + 1);
        }
      }
    } else {
      // Fallback para fases sem lista de drops explícita
      dropsAcheived.push('ninja_generico_1');
    }

    dropsAcheived.forEach(matId => {
      const charDrop = typeof getCharById !== 'undefined' ? getCharById(matId) : null;
      if (charDrop && charDrop.playable) {
        Save.addUnit(matId);
      } else {
        Save.addMaterial(matId);
      }
    });

    Save.addGems(gems);
    Save.markStageComplete(stageId, difficulty);
    Save.setStat('fases_completas', Object.keys(Save.get().fases_completas).length);

    // Completude de mundo — data-driven via WORLDS[].completionStat
    WORLDS.forEach(w => {
      if (!w.completionStat) return;
      const worldStages = getStagesByWorld(w.id);
      if (worldStages.every(s => Save.isStageComplete(s.id, 'normal')))
        Save.setStat(w.completionStat, worldStages.length);
    });

    let bonusGems = 0;
    if (isBossFase && firstTime) {
      bonusGems = 100;
      Save.addGems(bonusGems);
      Save.addMaterial('ninja_generico_3');
    }

    Missions.check();
    UI.showPostBattle({ victory: true, gems, materials: dropsAcheived, bonusGems: firstTime ? Math.max(50, bonusGems) : 0 });
  }

  // Tower management
  function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left - renderOffX) / renderScale;
    const cy = (e.clientY - rect.top  - renderOffY) / renderScale;

    if (deployingCharId) {
      if (isValidPlacement(cx, cy)) {
        deployTower(cx, cy, deployingCharId);
        deployingCharId = null;
        renderTeamPanel();
      } else {
        UI.toast('Local inválido!');
      }
      return;
    }

    // Check if clicking existing tower
    for (let i = 0; i < towers.length; i++) {
      const t = towers[i];
      if (dist2d(cx, cy, t.x, t.y) < 30) {
        selectTower(i);
        return;
      }
    }
    selectedTowerIdx = -1;
    deployingCharId = null;
    renderTeamPanel();
    closeUpgradePanel();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    hoverX = (e.clientX - rect.left - renderOffX) / renderScale;
    hoverY = (e.clientY - rect.top  - renderOffY) / renderScale;
  }

  function deployTower(x, y, charId) {
    const char = getCharById(charId);
    const unitData = Save.getBestUnitData(charId);
    if (!char || !unitData) return;
    if (gold < char.deploy_cost) { UI.toast('Ouro insuficiente!'); return; }

    gold -= char.deploy_cost;
    sessionTowersPlaced++;
    const stats = getCurrentStats(char, unitData.nivel);

    const newTower = {
      slotId: null, charId, x, y,
      rarity: char.rarity, initials: char.initials,
      charData: char, level: unitData.nivel,
      upgradeLevel: 0, disabled: shinraTenseiActive,
      attackTimer: 0, statusEffect: null, currentType: stats.type
    };
    towers.push(newTower);
    updateHUD();
    Save.incStat('torres_colocadas');
    Missions.check();
  }

  function selectTower(idx) {
    selectedTowerIdx = idx;
    if (idx < 0 || !towers[idx]) {
      closeUpgradePanel();
      return;
    }
    openUpgradePanel(towers[idx], idx);
  }

  function openUpgradePanel(tower, slotIdx) {
    const panel = document.getElementById('upgrade-panel');
    const nameEl = document.getElementById('upgrade-unit-name');
    const optsEl = document.getElementById('upgrade-options');
    if (!panel) return;

    const char = getCharById(tower.charId);
    const stats = getTowerStats(tower);
    const passiveHtml = char?.passive
      ? `<div class="upg-passive">⚡ ${char.passive.label}</div>`
      : '';
    nameEl.innerHTML = `<span style="background:${RARITY_COLORS[tower.rarity]}" class="tower-badge">${tower.initials}</span> ${char?.name} | Lv${tower.level}`;
    const existingPassive = panel.querySelector('.upg-passive');
    if (existingPassive) existingPassive.remove();
    if (passiveHtml) nameEl.insertAdjacentHTML('afterend', passiveHtml);

    optsEl.innerHTML = '';

    // Active ability button (Gojo)
    if (char?.active_ability) {
      const aa = char.active_ability;
      const cd = Math.ceil(Math.max(0, tower.abilityTimer || 0));
      const ready = cd <= 0;
      const abilWrap = document.createElement('div');
      abilWrap.className = 'upg-ability-wrap';
      const abilBtn = document.createElement('button');
      abilBtn.className = `btn btn-active-ability${ready ? '' : ' btn-ability-cd'}`;
      abilBtn.disabled = !ready;
      abilBtn.innerHTML = ready
        ? `⚡ ${aa.label} <span class="ability-badge ability-badge--ready">PRONTO</span>`
        : `⚡ ${aa.label} <span class="ability-badge ability-badge--cd">${cd}s</span>`;
      const capturedIdx = slotIdx;
      abilBtn.addEventListener('click', () => Game.useAbility(capturedIdx));
      abilWrap.appendChild(abilBtn);
      optsEl.appendChild(abilWrap);
    }

    (char?.upgrades || []).forEach((upg, i) => {
      const purchased = i < tower.upgradeLevel;
      const isNext = i === tower.upgradeLevel;
      const canAfford = gold >= upg.cost;
      const div = document.createElement('div');
      div.className = `upg-item${purchased ? ' upg-done' : isNext ? ' upg-next' : ' upg-locked'}`;
      div.innerHTML = `
        <div class="upg-name">${upg.name} ${purchased ? '✓' : ''}</div>
        <div class="upg-desc">${upg.desc}</div>
        <div class="upg-cost">${purchased ? 'Comprado' : `${upg.cost} 💰 ${isNext ? '<span style="font-size:9px;color:#aaa;margin-left:5px;">(U)</span>' : ''}`}</div>`;
      if (isNext && canAfford) {
        div.addEventListener('click', () => buyUpgrade(slotIdx, i));
        div.style.cursor = 'pointer';
      }
      optsEl.appendChild(div);
    });

    // Sell button value
    const hasEconomy = char?.passive?.some(p => p.type === 'edo_tensei_economy');
    let totalInvested = char?.deploy_cost || 0;
    for(let i=0; i<tower.upgradeLevel; i++){
      if(char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
    }
    const sellVal = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
    const sellBtn = panel.querySelector('.btn-sell');
    if (sellBtn) sellBtn.textContent = `Vender (+${sellVal} 💰) [Del]`;

    panel.style.display = 'flex';
  }

  function buyUpgrade(towerIdx, upgradeIdx) {
    const tower = towers[towerIdx];
    if (!tower) return;
    const char = getCharById(tower.charId);
    const upg = char?.upgrades[upgradeIdx];
    if (!upg || tower.upgradeLevel !== upgradeIdx) return;
    if (gold < upg.cost) { UI.toast('Ouro insuficiente!'); return; }

    gold -= upg.cost;
    tower.upgradeLevel++;
    if (upg.status_effect) tower.statusEffect = upg.status_effect;
    if (upg.type) tower.currentType = upg.type;
    updateHUD();
    openUpgradePanel(tower, towerIdx);
    UI.toast(`✅ ${upg.name} ativado!`);
  }

  function sellTower() {
    if (selectedTowerIdx < 0) return;
    const tower = towers[selectedTowerIdx];
    if (!tower) return;
    const char = getCharById(tower.charId);
    
    const hasEconomy = char?.passive?.some(p => p.type === 'edo_tensei_economy');
    let totalInvested = char?.deploy_cost || 0;
    for(let i=0; i<tower.upgradeLevel; i++){
      if(char?.upgrades[i]) totalInvested += char.upgrades[i].cost;
    }
    const val = hasEconomy ? totalInvested : Math.floor(totalInvested * 0.5);
    
    gold += val;
    towers.splice(selectedTowerIdx, 1);
    selectedTowerIdx = -1;
    closeUpgradePanel();
    updateHUD();
  }

  function buyNextUpgrade() {
    if (selectedTowerIdx < 0) return;
    const tower = towers[selectedTowerIdx];
    if (tower) buyUpgrade(selectedTowerIdx, tower.upgradeLevel);
  }

  function deselectTower() { 
    selectedTowerIdx = -1; 
    deployingCharId = null;
    closeUpgradePanel(); 
    renderTeamPanel();
  }
  function closeUpgradePanel() {
    const p = document.getElementById('upgrade-panel');
    if (p) p.style.display = 'none';
  }

  function getTowerStats(tower) {
    const stats = getCurrentStats(tower.charData, tower.level);
    for (let i = 0; i < tower.upgradeLevel; i++) {
      const upg = tower.charData.upgrades[i];
      if (upg.damage_mult) stats.damage *= upg.damage_mult;
      if (upg.range_mult) stats.range *= upg.range_mult;
      if (upg.speed_mult) stats.attack_speed *= upg.speed_mult;
      if (upg.type) stats.type = upg.type;
    }
    return stats;
  }

  function togglePause() {
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? '▶' : '⏸';
  }

  function toggleSpeed() {
    gameSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1;
    document.getElementById('speed-indicator').textContent = gameSpeed + '×';
  }

  function retryStage() { startGame(); }

  function updateHUD() {
    const el = id => document.getElementById(id);
    if (el('hud-lives')) el('hud-lives').textContent = lives;
    if (el('hud-gold')) el('hud-gold').textContent = gold;
    if (el('hud-wave')) el('hud-wave').textContent = wave;
    if (el('hud-total-waves')) el('hud-total-waves').textContent = totalWaves || 10;
    if (el('hud-wave-fill')) el('hud-wave-fill').style.width = `${Math.min(100, Math.round((wave / (totalWaves || 10)) * 100))}%`;
    if (el('hud-phase-name')) el('hud-phase-name').textContent = stage?.name || '';
    
    const panel = el('team-panel');
    if (panel) {
      Array.from(panel.children).forEach(u => {
        const charId = u.dataset.charId;
        if (charId) {
          const char = getCharById(charId);
          if (char) {
            if (gold >= char.deploy_cost) u.classList.remove('cant-afford');
            else u.classList.add('cant-afford');
          }
        }
      });
    }

    UI.updateCurrencyDisplay();
  }

  function renderTeamPanel() {
    const panel = document.getElementById('team-panel');
    if (!panel) return;
    panel.innerHTML = '';
    team.forEach(charId => {
      const char = getCharById(charId);
      const unitData = Save.getBestUnitData(charId);
      if (!char) return;
      const cost = char.deploy_cost;
      const div = document.createElement('div');
      div.className = `tp-unit${deployingCharId === charId ? ' deploying' : ''}${gold < cost ? ' cant-afford' : ''}`;
      div.dataset.charId = charId;
      div.innerHTML = `
        <div class="tp-icon" style="background:${RARITY_COLORS[char.rarity]}">${charIconInner(char)}</div>
        <div class="tp-name">${char.name}</div>
        <div class="tp-cost">${cost}💰 Lv${unitData?.nivel||1}</div>`;
      div.addEventListener('click', () => {
        if (gold < cost) { UI.toast('Ouro insuficiente!'); return; }
        deployingCharId = deployingCharId === charId ? null : charId;
        renderTeamPanel();
        selectedTowerIdx = -1;
        closeUpgradePanel();
        UI.toast(deployingCharId ? `Clique em um slot para colocar ${char.name}` : 'Seleção cancelada');
      });
      panel.appendChild(div);
    });
  }

  // RENDER
  function render() {
    // Clear full canvas (covers letterbox bars when aspect ratio differs)
    ctx.fillStyle = '#04040c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply uniform scale + centering so game renders in correct proportions
    ctx.save();
    ctx.translate(renderOffX, renderOffY);
    ctx.scale(renderScale, renderScale);

    drawBackground();
    drawPath();
    drawEffects();
    drawTowerRangePreview();
    drawPlacementPreview();
    drawTowers();
    drawEnemies();
    drawProjectiles();

    // Draw Tsunamis
    tsunamis.forEach(tsu => {
      ctx.save();
      ctx.shadowBlur = 15; ctx.shadowColor = '#5b9cf6';
      ctx.fillStyle = 'rgba(91, 156, 246, 0.7)';
      ctx.beginPath();
      ctx.arc(tsu.x, tsu.y, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // HP Bar for Tsunami
      const hpPct = Math.max(0, tsu.hp / tsu.maxHp);
      ctx.fillStyle = '#111';
      ctx.fillRect(tsu.x - 30, tsu.y - 60, 60, 6);
      ctx.fillStyle = '#5b9cf6';
      ctx.fillRect(tsu.x - 30, tsu.y - 60, 60 * hpPct, 6);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(tsu.x - 30, tsu.y - 60, 60, 6);
      ctx.restore();
    });

    drawEffects();
    
    // Dark Mode (Fog of War) logic
    if (stage && stage.modifiers && stage.modifiers.dark_mode) {
      if (!window.darkCanvas) {
        window.darkCanvas = document.createElement('canvas');
        window.darkCanvas.width = CANVAS_W;
        window.darkCanvas.height = CANVAS_H;
        window.darkCtx = window.darkCanvas.getContext('2d');
      }
      const dCtx = window.darkCtx;
      dCtx.globalCompositeOperation = 'source-over';
      dCtx.fillStyle = 'rgba(0,0,0,0.98)';
      dCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      dCtx.globalCompositeOperation = 'destination-out';
      
      // Illuminate ao redor das torres
      towers.forEach(t => {
        const rad = getTowerStats(t).range || 150;
        const grad = dCtx.createRadialGradient(t.x, t.y, 0, t.x, t.y, rad);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.arc(t.x, t.y, rad, 0, Math.PI * 2);
        dCtx.fill();
      });

      // Keep the path end (base) slightly visible
      const pathsToDraw = window.currentPaths || [PATH_POINTS];
      if (pathsToDraw && pathsToDraw[0] && pathsToDraw[0].length > 0) {
        const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
        const grad = dCtx.createRadialGradient(endP.x, endP.y, 0, endP.x, endP.y, 100);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.arc(endP.x, endP.y, 100, 0, Math.PI * 2);
        dCtx.fill();
      }
      
      ctx.drawImage(window.darkCanvas, 0, 0);
    }

    drawOverlay();

    ctx.restore();
  }

  function drawBackground() {
    const isOP = stage?.world === 'onepiece';
    const isNaruto = stage?.world === 'naruto';
    
    if (isOP) {
      const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
      grad.addColorStop(0, '#102a40'); grad.addColorStop(1, '#05121c');
      ctx.fillStyle = grad;
    } else if (isNaruto) {
      const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_W);
      grad.addColorStop(0, '#2b3a20'); grad.addColorStop(1, '#11180c');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#080e08';
    }
    
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Subtle grid
    ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.015)' : isNaruto ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke();
    }
    // Scattered dots (trees/bushes or sea rocks/foam)
    const dots = [[60,60],[140,380],[220,200],[380,50],[420,430],[500,90],[570,300],[650,430],[760,80],[850,250],[950,420],[900,100]];
    dots.forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2);
      ctx.fillStyle = isOP ? 'rgba(15, 60, 80, 0.6)' : isNaruto ? 'rgba(46, 204, 113, 0.15)' : 'rgba(30,60,30,0.6)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+8, y-4, 9, 0, Math.PI*2);
      ctx.fillStyle = isOP ? 'rgba(20, 80, 100, 0.5)' : isNaruto ? 'rgba(39, 174, 96, 0.2)' : 'rgba(24,50,24,0.5)'; ctx.fill();
    });
  }

  function drawPath() {
    const isOP = stage?.world === 'onepiece';
    const isNaruto = stage?.world === 'naruto';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    
    const pathsToDraw = window.currentPaths || [PATH_POINTS];
    
    pathsToDraw.forEach(pArr => {
      if (!pArr || pArr.length === 0) return;
      // Outer glow
      ctx.strokeStyle = isOP ? 'rgba(52, 152, 219, 0.15)' : isNaruto ? 'rgba(230, 126, 34, 0.12)' : 'rgba(180,140,60,0.12)';
      ctx.lineWidth = 46;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Dark shadow / Base path
      ctx.strokeStyle = isOP ? 'rgba(26, 82, 118, 0.6)' : isNaruto ? 'rgba(110, 44, 0, 0.6)' : 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Inner track
      ctx.strokeStyle = isOP ? '#2980b9' : isNaruto ? '#ba4a00' : '#3e2723';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Center line
      ctx.strokeStyle = isOP ? '#3498db' : isNaruto ? '#d35400' : '#4e342e';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Center dashes
      ctx.strokeStyle = isOP ? 'rgba(255,255,255,0.2)' : isNaruto ? 'rgba(255,200,70,0.2)' : 'rgba(255,200,70,0.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 16]);
      ctx.beginPath();
      ctx.moveTo(pArr[0].x, pArr[0].y);
      pArr.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
      // Spawn label
      ctx.fillStyle = 'rgba(245,101,101,0.7)';
      ctx.font = '600 10px Inter,sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('SPAWN', pArr[0].x + 4, pArr[0].y + 4);
    });

    if (pathsToDraw && pathsToDraw.length > 0 && pathsToDraw[0].length > 0) {
      // Base indicator
      const endP = pathsToDraw[0][pathsToDraw[0].length - 1];
      ctx.fillStyle = 'rgba(62,207,142,0.85)';
      ctx.beginPath();
      ctx.roundRect(endP.x - 18, endP.y - 12, 36, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Inter,sans-serif';
      ctx.fillText('BASE', endP.x - 12, endP.y + 20);
    }
  }

  function drawPlacementPreview() {
    if (!deployingCharId) return;
    const char = getCharById(deployingCharId);
    if (!char) return;
    
    const valid = isValidPlacement(hoverX, hoverY);
    const color = valid ? '62,207,142' : '245,101,101'; // green or red
    const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
    
    ctx.beginPath();
    ctx.arc(hoverX, hoverY, 24, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${color}, ${0.2 + pulse * 0.1})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color}, 0.8)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const baseStats = getCurrentStats(char, Save.getBestUnitData(deployingCharId)?.nivel || 1);
    ctx.beginPath();
    ctx.arc(hoverX, hoverY, baseStats.range, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${color}, 0.05)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color}, 0.3)`;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawTowerRangePreview() {
    if (selectedTowerIdx < 0 || !towers[selectedTowerIdx]) return;
    const tower = towers[selectedTowerIdx];
    const stats = getTowerStats(tower);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,200,70,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,70,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const RARITY_GLOW = {3:'rgba(159,122,234,',4:'rgba(251,146,60,',5:'rgba(255,200,70,'};

  // Preloaded tower portrait cache
  const _imgCache = {};
  function getTowerImg(charId) {
    const char = getCharById(charId);
    if (!char?.image) return null;
    if (!_imgCache[charId]) {
      const img = new Image();
      img.src = char.image;
      _imgCache[charId] = img;
    }
    return _imgCache[charId];
  }

  function drawTowers() {
    // Pré-computar torres buffadas pela aura do Gojo
    const gojoBuffed = new Set();
    towers.forEach(gt => {
      const gp = gt.charData?.passive;
      if (gp?.type !== 'damage_aura' || gt.disabled) return;
      const gr = getTowerStats(gt).range;
      towers.forEach(t => { if (t !== gt && dist2d(gt.x, gt.y, t.x, t.y) <= gr) gojoBuffed.add(t); });
    });

    towers.forEach(t => {
      const disabled = t.disabled || shinraTenseiActive;
      ctx.globalAlpha = disabled ? 0.35 : (t.isClone ? 0.72 : 1);
      const col = RARITY_COLORS[t.rarity];
      const selected = selectedTowerIdx >= 0 && towers[selectedTowerIdx] === t;
      // Clone: anel tracejado + timer
      if (t.isClone) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(159,122,234,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(200,180,255,0.85)';
        ctx.font = '600 8px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${Math.ceil(t.cloneTimer)}s`, t.x, t.y + 33);
      }
      // Glow
      if (!disabled && t.rarity >= 3) {
        const g = RARITY_GLOW[t.rarity] || 'rgba(255,255,255,';
        ctx.beginPath();
        ctx.arc(t.x, t.y, selected ? 30 : 26, 0, Math.PI*2);
        ctx.fillStyle = g + (selected ? '0.22)' : '0.10)');
        ctx.fill();
      }
      // Outer ring for selected
      if (selected) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 25, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Main circle
      ctx.beginPath();
      ctx.arc(t.x, t.y, 20, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = disabled ? '#222' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Portrait or initials
      const portrait = getTowerImg(t.charId);
      if (portrait && portrait.complete && portrait.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, 19, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(portrait, t.x - 19, t.y - 19, 38, 38);
        ctx.restore();
      } else {
        ctx.fillStyle = disabled ? 'rgba(255,255,255,0.4)' : '#fff';
        ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.initials, t.x, t.y);
      }
      // Upgrade pips — centrados, tamanho adaptativo para até 10 upgrades
      if (t.upgradeLevel > 0) {
        const spacing = t.upgradeLevel > 6 ? 6 : 7;
        const pipR    = t.upgradeLevel > 6 ? 2.5 : 3;
        const startX  = t.x - ((t.upgradeLevel - 1) * spacing) / 2;
        for (let i = 0; i < t.upgradeLevel; i++) {
          ctx.beginPath();
          ctx.arc(startX + i * spacing, t.y + 25, pipR, 0, Math.PI*2);
          ctx.fillStyle = '#ffc846';
          ctx.fill();
        }
      }
      // Gojo aura buff — anel dourado nas torres dentro do alcance
      if (gojoBuffed.has(t)) {
        const gPulse = (Math.sin(Date.now() / 700) + 1) / 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(255,200,70,${0.35 + gPulse * 0.25})`;
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = `rgba(255,200,70,${0.12 + gPulse * 0.08})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, 23, 0, Math.PI*2); ctx.fill();
      }
      // Mini-stun — anel vermelho tracejado + timer
      if ((t.miniStunTimer || 0) > 0) {
        const sPulse = (Math.sin(Date.now() / 150) + 1) / 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 26, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(229,57,53,${0.55 + sPulse * 0.4})`;
        ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f56565'; ctx.font = 'bold 8px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${Math.ceil(t.miniStunTimer)}s`, t.x, t.y - 30);
      }

      // Badge de passiva (kill streak, combo counter, etc.) — data-driven via PASSIVE_SYSTEM.renderBadge
      if (!t.isClone) {
        const badge = PASSIVE_SYSTEM.renderBadge(t);
        if (badge) {
          ctx.fillStyle = badge.color;
          ctx.font = 'bold 9px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(badge.text, t.x, t.y - 25);
        }
      }
      // Active ability indicator (Gojo) — bolinha verde (pronto) ou azul (cooldown)
      if (!t.isClone && t.charData?.active_ability) {
        const ready = (t.abilityTimer || 0) <= 0;
        ctx.beginPath();
        ctx.arc(t.x + 18, t.y - 18, 6, 0, Math.PI*2);
        ctx.fillStyle = ready ? '#3ecf8e' : 'rgba(91,156,246,0.85)';
        ctx.fill();
        if (!ready) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 6px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(Math.ceil(t.abilityTimer), t.x + 18, t.y - 18);
        }
      }

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    });
  }

  // Tabela de tags visuais por ptype e special
  const TAG_DEFS = {
    ptype: {
      speed:     { t:'SPD',  bg:'#d4ac0d', fg:'#000' },
      powerful1: { t:'P1',   bg:'#9b59b6', fg:'#fff' },
      powerful2: { t:'P2',   bg:'#6c3483', fg:'#fff' },
      powerful3: { t:'P3',   bg:'#4a235a', fg:'#fff' },
      cloner:    { t:'CLN',  bg:'#1e8449', fg:'#fff' }
    },
    special: {
      explosion:     { t:'BOOM', bg:'#e74c3c', fg:'#fff' },
      base_drain:    { t:'DRN',  bg:'#1f618d', fg:'#fff' },
      genjutsu:      { t:'GNJ',  bg:'#1c2833', fg:'#fff' },
      shinra_tensei: { t:'ST',   bg:'#922b21', fg:'#fff' }
    }
  };

  const _enemyImgCache = {};
  function getEnemyImg(enemyType) {
    const d = typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS[enemyType] : null;
    if (!d || !d.image) return null;
    if (!_enemyImgCache[enemyType]) {
      const img = new Image();
      img.src = d.image;
      _enemyImgCache[enemyType] = img;
    }
    return _enemyImgCache[enemyType];
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.dead || e.reached_end) return;
      ctx.save();

      const s       = e.size;
      const hasBurn  = e.status.burn.active;
      const hasFreeze = e.status.freeze.active;
      const hasPara  = e.status.paralisia.active;
      const bleedN   = e.status.sangramento.length;

      // Glow por status — prioridade: paralisia > freeze > burn
      if      (hasPara)   { ctx.shadowBlur = 16; ctx.shadowColor = '#fbbf24'; }
      else if (hasFreeze) { ctx.shadowBlur = 14; ctx.shadowColor = '#5b9cf6'; }
      else if (hasBurn)   { ctx.shadowBlur = 12; ctx.shadowColor = '#f97316'; }

      if (e.hitFlash > 0) ctx.globalAlpha = 0.55;

      // Borda pulsante de bleed
      if (bleedN > 0) {
        const bp = (Math.sin(Date.now() / 160) + 1) / 2;
        ctx.strokeStyle = `rgba(229,57,53,${0.5 + bp * 0.4})`;
        ctx.lineWidth = 1.5 + Math.min(bleedN, 4) * 0.4;
        const r2 = Math.min(5, s * 0.18) + 1;
        ctx.beginPath(); ctx.roundRect(e.x-s/2-2, e.y-s/2-2, s+4, s+4, r2); ctx.stroke();
      }

      // Corpo do inimigo
      const img = getEnemyImg(e.type);
      if (img && img.complete && img.naturalWidth > 0) {
        if (e.is_boss) {
          ctx.shadowBlur = 16; ctx.shadowColor = '#f56565';
        } else if (e.is_miniboss) {
          ctx.shadowBlur = 10; ctx.shadowColor = '#ffc846';
        }

        ctx.drawImage(img, e.x - s/2, e.y - s/2, s, s);
        ctx.shadowBlur = 0;

        if (hasBurn || hasFreeze || hasPara) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          if (hasBurn) ctx.fillStyle = '#f97316';
          else if (hasFreeze) ctx.fillStyle = '#5b9cf6';
          else if (hasPara) ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, Math.min(5, s * 0.18)); ctx.fill();
          ctx.restore();
        }

        if (e.is_boss) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else if (e.is_miniboss) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        }
      } else {
        const col = hasBurn ? '#f97316' : e.col;
        const r   = Math.min(5, s * 0.18);
        ctx.fillStyle = col;

        if (e.is_boss) {
          const pulse = 2 + Math.sin(Date.now() / 180) * 1.5;
          ctx.shadowBlur = 16; ctx.shadowColor = '#f56565';
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
          ctx.strokeStyle = '#f56565'; ctx.lineWidth = pulse;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else if (e.is_miniboss) {
          const pulse = 1.5 + Math.sin(Date.now() / 260) * 1;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
          ctx.strokeStyle = '#ffc846'; ctx.lineWidth = pulse;
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 7px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(e.name, e.x, e.y - s/2 - 5);
        } else {
          ctx.beginPath(); ctx.roundRect(e.x-s/2, e.y-s/2, s, s, r); ctx.fill();
        }
      }

      // Barra de HP
      const hpPct = e.hp / e.maxHp;
      const bw = s + 10, bh = 3, bx = e.x - bw/2, by = e.y - s/2 - 7;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill();
      ctx.fillStyle = hpPct > 0.55 ? '#3ecf8e' : hpPct > 0.28 ? '#fbbf24' : '#f56565';
      ctx.beginPath(); ctx.roundRect(bx, by, bw * hpPct, bh, 2); ctx.fill();

      // ── TAGS (tipo + special) — acima da barra de HP ──────────────────
      const tags = [];
      const ptDef = TAG_DEFS.ptype[e.ptype];
      if (ptDef) tags.push(ptDef);
      const spDef = e.special ? TAG_DEFS.special[e.special] : null;
      if (spDef) tags.push(spDef);
      // on_death sem special = CLN
      if (e.on_death && !spDef) tags.push({ t:'CLN', bg:'#1e8449', fg:'#fff' });

      if (tags.length > 0) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 7px Inter,sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const tagH = 9, tagGap = 2;
        const tagY  = by - tagH - tagGap;
        let tx = bx;
        tags.forEach(tag => {
          const tw = ctx.measureText(tag.t).width + 5;
          ctx.fillStyle = tag.bg;
          ctx.beginPath(); ctx.roundRect(tx, tagY, tw, tagH, 2); ctx.fill();
          ctx.fillStyle = tag.fg;
          ctx.fillText(tag.t, tx + 2.5, tagY + tagH - 1.5);
          tx += tw + tagGap;
        });
      }

      // ── STATUS DOTS — abaixo do inimigo ───────────────────────────────
      const dots = [];
      if (hasBurn)   dots.push({ col:'#f97316', l:'B' });   // Burn
      if (hasFreeze) dots.push({ col:'#5b9cf6', l:'S' });   // Slow
      if (hasPara)   dots.push({ col:'#fbbf24', l:'P' });   // Paralisia
      if (bleedN > 0) {
        const show = Math.min(bleedN, 4);
        for (let i = 0; i < show; i++) dots.push({ col:'#e53935', l:'•' });
        if (bleedN > 4) dots.push({ col:'#c0392b', l:`+${bleedN-4}` });
      }

      if (dots.length > 0) {
        ctx.shadowBlur = 0;
        const dR = 4.5, dSp = dR * 2 + 2;
        const startX = e.x - (dots.length * dSp) / 2 + dR;
        const dY = e.y + s/2 + dR + 3;
        ctx.font = '600 6px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        dots.forEach((d, i) => {
          const dx = startX + i * dSp;
          ctx.beginPath(); ctx.arc(dx, dY, dR, 0, Math.PI*2);
          ctx.fillStyle = d.col; ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText(d.l, dx, dY + 0.5);
        });
      }

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
    ctx.textAlign = 'left';
  }

  function drawProjectile(p) {
    const id = p.charId || '';
    const now = Date.now();
    ctx.save();
    ctx.translate(p.x, p.y);

    switch (id) {
      case 'ichigo_base': {
        // Orange crescent blade
        ctx.rotate(p.angle + Math.PI * 0.5);
        ctx.shadowBlur = 10; ctx.shadowColor = '#ff6b00';
        ctx.beginPath();
        ctx.arc(0, 0, 7, -Math.PI * 0.65, Math.PI * 0.65);
        ctx.arc(-2, 0, 5, Math.PI * 0.65, -Math.PI * 0.65, true);
        ctx.closePath();
        ctx.fillStyle = '#ff6b00'; ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.arc(-1, 0, 2, Math.PI * 0.4, -Math.PI * 0.4, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,220,100,0.75)'; ctx.fill();
        break;
      }
      case 'goku_base': {
        // Blue ki orb with orbiting ring
        ctx.shadowBlur = 14; ctx.shadowColor = '#4fc3f7';
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#4fc3f7'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.5, now * 0.005, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(129,212,250,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'l_deathnote': {
        // White rotating diamond — analytical precision
        ctx.rotate(Math.PI / 4 + now * 0.003);
        ctx.shadowBlur = 6; ctx.shadowColor = '#e0e0e0';
        ctx.beginPath(); ctx.rect(-4.5, -4.5, 9, 9);
        ctx.fillStyle = '#757575'; ctx.fill();
        ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.rect(-1.5, -1.5, 3, 3);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'demolidor': {
        // Red billy club
        ctx.rotate(p.angle);
        ctx.shadowBlur = 8; ctx.shadowColor = '#e53935';
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#c62828'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ef9a9a'; ctx.fill();
        break;
      }
      case 'sasuke_uchiha': {
        // Purple lightning bolt
        ctx.rotate(p.angle);
        ctx.shadowBlur = 12; ctx.shadowColor = '#5c6bc0';
        ctx.beginPath();
        ctx.moveTo(-6, 2); ctx.lineTo(-1, -4); ctx.lineTo(1, -1);
        ctx.lineTo(6, -4); ctx.lineTo(2, 5); ctx.lineTo(0, 1); ctx.closePath();
        ctx.fillStyle = '#7986cb'; ctx.fill();
        break;
      }
      case 'killua_zoldyck': {
        // White electric ball with sparks
        ctx.shadowBlur = 16; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#e8eaf6'; ctx.fill();
        const t = now * 0.012;
        for (let i = 0; i < 4; i++) {
          const a = t + i * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
          ctx.lineTo(Math.cos(a + 0.45) * 10, Math.sin(a + 0.45) * 10);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'tanjiro_kamado': {
        // Red-gold flame teardrop
        ctx.rotate(p.angle + Math.PI / 2);
        ctx.shadowBlur = 10; ctx.shadowColor = '#ef5350';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.bezierCurveTo(5, -3, 5, 3, 0, 6);
        ctx.bezierCurveTo(-5, 3, -5, -3, 0, -8);
        ctx.fillStyle = '#ef5350'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(2.5, -1, 2.5, 2, 0, 3.5);
        ctx.bezierCurveTo(-2.5, 2, -2.5, -1, 0, -5);
        ctx.fillStyle = '#ffd740'; ctx.fill();
        break;
      }
      case 'zoro_3': {
        // Green X sword slash
        ctx.rotate(p.angle + Math.PI / 4);
        ctx.shadowBlur = 8; ctx.shadowColor = '#43a047';
        ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke();
        break;
      }
      case 'naruto_shippuden': {
        // Orange spinning Rasengan
        ctx.shadowBlur = 14; ctx.shadowColor = '#ff8c00';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8c00'; ctx.fill();
        const spin = now * 0.009;
        for (let i = 0; i < 3; i++) {
          const a = spin + i * Math.PI * 2 / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,214,0,0.85)'; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'luffy_3': {
        // Red elongated rubber fist
        ctx.rotate(p.angle);
        ctx.shadowBlur = 8; ctx.shadowColor = '#ef5350';
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ef5350'; ctx.fill();
        ctx.beginPath(); ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8a65'; ctx.fill();
        ctx.beginPath(); ctx.arc(6, 0, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'levi_ackerman': {
        // Steel ODM blade
        ctx.rotate(p.angle);
        ctx.shadowBlur = 6; ctx.shadowColor = '#eceff1';
        ctx.beginPath();
        ctx.moveTo(9, 0); ctx.lineTo(-6, -2.5); ctx.lineTo(-7, 0); ctx.lineTo(-6, 2.5);
        ctx.closePath();
        ctx.fillStyle = '#cfd8dc'; ctx.fill();
        ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(2, -1);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        break;
      }
      case 'meliodas_base': {
        // Spinning dark purple demon star
        ctx.rotate(now * 0.004);
        ctx.shadowBlur = 14; ctx.shadowColor = '#7b1fa2';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 7.5 : 3.5;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = '#6a0dad'; ctx.fill();
        ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 1; ctx.stroke();
        break;
      }
      case 'naruto_sage': {
        // Large nature-energy sage orb with orbit ring
        ctx.shadowBlur = 20; ctx.shadowColor = '#ff9800';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
        const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
        gr.addColorStop(0, '#fff3e0'); gr.addColorStop(1, '#ff9800');
        ctx.fillStyle = gr; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 3.5, now * 0.005, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(139,195,74,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'gojo_satoru': {
        // Hollow white Limitless circle
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(121,134,203,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
        break;
      }
      default: {
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawProjectiles() {
    projectiles.forEach(p => drawProjectile(p));
  }

  function drawEffects() {
    effects.forEach(ef => {
      const maxTimer = ef.maxTimer || (ef.type === 'ring' ? 0.35 : ef.type === 'shockwave' ? 1.0 : 0.4);
      const alpha = Math.max(0, Math.min(1, ef.timer / maxTimer));
      ctx.save();
      ctx.globalAlpha = alpha;
      if (ef.type === 'ring' || ef.type === 'shockwave') {
        ctx.shadowBlur = 14; ctx.shadowColor = ef.color;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.r || 10, 0, Math.PI * 2);
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = ef.type === 'shockwave' ? 4 : 3;
        ctx.stroke();
      } else if (ef.type === 'line') {
        ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
        const dx = ef.tx - ef.x, dy = ef.ty - ef.y;
        const len = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const nx = dx/len, ny = dy/len;
        const w = 30; // Half-width of the line attack
        ctx.beginPath();
        ctx.moveTo(ef.x - ny*w, ef.y + nx*w);
        ctx.lineTo(ef.tx - ny*w, ef.ty + nx*w);
        ctx.lineTo(ef.tx + ny*w, ef.ty - nx*w);
        ctx.lineTo(ef.x + ny*w, ef.y - nx*w);
        ctx.closePath();
        ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = ef.color; ctx.fill();
        ctx.globalAlpha = alpha;
      } else if (ef.type === 'cone_flash') {
        const cdx = ef.tx - ef.x, cdy = ef.ty - ef.y;
        const cangle = Math.atan2(cdy, cdx);
        const crange = Math.min(Math.sqrt(cdx*cdx + cdy*cdy) + 18, 220);
        ctx.shadowBlur = 10; ctx.shadowColor = ef.color;
        ctx.beginPath();
        ctx.moveTo(ef.x, ef.y);
        ctx.arc(ef.x, ef.y, crange, cangle - Math.PI / 4, cangle + Math.PI / 4);
        ctx.closePath();
        ctx.strokeStyle = ef.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = alpha * 0.18;
        ctx.fillStyle = ef.color; ctx.fill();
        ctx.globalAlpha = alpha;
      } else if (ef.type === 'death') {
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 15 * (1 - alpha), 0, Math.PI * 2);
        ctx.fillStyle = ef.color;
        ctx.fill();
      } else if (ef.type === 'coin') {
        const prog = 1 - alpha;
        ctx.shadowBlur = 5; ctx.shadowColor = '#f1c40f';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y - prog * 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', ef.x, ef.y - prog * 20);
      } else if (ef.type === 'silenced') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = ef.color || '#9b59b6';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ef.text || 'Silenced!', ef.x, ef.y - (1-alpha)*20);
      } else if (ef.type === 'crit') {
        const prog = 1 - alpha;
        ctx.shadowBlur = 12; ctx.shadowColor = ef.color || '#ffc846';
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 20 * prog, 0, Math.PI * 2);
        ctx.fillStyle = ef.color || '#ffc846';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 9 * prog, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawOverlay() {
    if (betweenWaves && betweenTimer > 0 && wave < totalWaves) {
      ctx.fillStyle = 'rgba(6,6,14,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Card
      const cx = CANVAS_W/2, cy = CANVAS_H/2;
      ctx.fillStyle = 'rgba(10,10,26,0.9)';
      ctx.beginPath(); ctx.roundRect(cx-130, cy-38, 260, 76, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,70,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(cx-130, cy-38, 260, 76, 14); ctx.stroke();
      ctx.fillStyle = 'rgba(238,240,255,0.45)';
      ctx.font = '500 12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PRÓXIMA WAVE', cx, cy - 15);
      ctx.fillStyle = '#ffc846';
      ctx.font = 'bold 28px Inter,sans-serif';
      ctx.fillText(`Wave ${wave + 1}  —  ${Math.ceil(betweenTimer)}s`, cx, cy + 14);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    if (shinraTenseiActive) {
      ctx.fillStyle = 'rgba(245,101,101,0.08)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = 'rgba(245,101,101,0.85)';
      ctx.font = 'bold 13px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ SHINRA TENSEI  ${Math.ceil(shinraTenseiTimer)}s`, CANVAS_W/2, 28);
      ctx.textAlign = 'left';
    }
  }

  function useAbility(slotIdx) {
    if (slotIdx < 0 || !slots[slotIdx]?.tower) return;
    const tower = slots[slotIdx].tower;
    const aa = tower.charData?.active_ability;
    if (!aa) return;
    if ((tower.abilityTimer || 0) > 0) {
      UI.toast(`Habilidade em cooldown! (${Math.ceil(tower.abilityTimer)}s)`, 2000);
      return;
    }
    if (aa.type === 'domain_expansion') {
      const stunDur = getActiveValue(tower, 'stun_duration', aa.stun_duration);
      enemies.forEach(e => {
        if (!e.dead && !e.reached_end) applyStatus(e, 'paralisia', { duration: stunDur });
      });
      addEffect({ type:'shockwave', x:CANVAS_W/2, y:CANVAS_H/2, maxR:820, color:'#5b9cf6', timer:1.0, maxTimer:1.0, r:0 });
      UI.toast(`❄️ Domínio Expandido! Todos os inimigos paralisados por ${stunDur}s!`, 3000);
      tower.abilityTimer = aa.cooldown;
    }
  }

  function addEffect(ef) { effects.push(ef); }
  function dist2d(x1,y1,x2,y2) { return Math.sqrt((x2-x1)**2+(y2-y1)**2); }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2-x1)**2 + (y2-y1)**2;
    if (l2 === 0) return dist2d(px, py, x1, y1);
    let t = ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2d(px, py, x1 + t*(x2 - x1), y1 + t*(y2 - y1));
  }

  function isValidPlacement(x, y) {
    if (x < 20 || x > CANVAS_W - 20 || y < 20 || y > CANVAS_H - 20) return false;
    const pathsToCheck = window.currentPaths || [PATH_POINTS];
    for (const pArr of pathsToCheck) {
      if (!pArr) continue;
      for (let i = 1; i < pArr.length; i++) {
        const p1 = pArr[i-1], p2 = pArr[i];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 35) return false;
      }
    }
    for (const t of towers) {
      if (dist2d(x, y, t.x, t.y) < 30) return false;
    }
    return true;
  }

  function getTowers() {
    return towers;
  }

  let dialogPaused = false;
  function setDialogPause(p) {
    dialogPaused = p;
  }

  return {
    init, startGame, togglePause, toggleSpeed, sellTower, buyNextUpgrade,
    retryStage, handleClick, getTowers, deployTower, selectTower,
    useAbility, deselectTower, skipWave, setDialogPause
  };
})();
