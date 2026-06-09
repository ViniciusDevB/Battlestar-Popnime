// game-passives.js
// Definições de todas as passivas de personagens.
// Depende de _passiveCtx (populado por game.js) para acessar estado e funções do jogo.
// Globals usados diretamente: RARITY_COLORS, applyStatus, UI, PATH_LENGTH, getPosOnPath.

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
  // Evento 2
  tsunade:    '#f9a8d4',
  killer_bee: '#7c3aed',
  // Evento — Nemesis
  nemesis:            '#4ade80',
  // Marvel
  spider_man:         '#dc2626',
  black_widow:        '#1c1917',
  hawkeye:            '#7c3aed',
  black_panther:      '#6d28d9',
  thor:               '#fbbf24',
  hulk_base:          '#16a34a',
  iron_man_mark50:    '#dc2626',
  world_breaker_hulk: '#15803d',
};

// Todos os handlers de passiva. Acessa estado do jogo via _passiveCtx.
// _passiveCtx é populado em game.js após a inicialização do módulo Game.
const PASSIVE_ENTRIES = {

  // Nemesis — invoca horda de zumbis na base periodicamente.
  // Zumbis caminham do fim do caminho em direção ao início (igual ao tsunami),
  // danificam inimigos no contato e aplicam o status infectado.
  zombie_spawn: {
    update(tower, p, dt) {
      if (tower.disabled) return;
      tower._zombieTimer = (tower._zombieTimer || 0) + dt;
      const interval = _passiveCtx.getPassiveValue(tower, 'interval', p.interval || 18);
      if (tower._zombieTimer >= interval) {
        tower._zombieTimer = 0;
        let zombieHp = _passiveCtx.getPassiveValue(tower, 'zombie_hp', p.zombie_hp || 4000);
        for (let i = 0; i < tower.upgradeLevel; i++) {
          const upg = tower.charData.upgrades[i];
          if (upg?.zombie_hp_mult) zombieHp = Math.round(zombieHp * upg.zombie_hp_mult);
        }
        const speed = p.zombie_speed || 52;
        const dps   = _passiveCtx.getPassiveValue(tower, 'zombie_dps', p.zombie_dps || 100);
        const paths = window.currentPaths || [PATH_POINTS];
        paths.forEach(pathArr => {
          const pathLen = getPathLength(pathArr);
          _passiveCtx.zombies.push({
            hp: zombieHp, maxHp: zombieHp,
            dist: pathLen, speed, dps,
            color: '#4ade80',
            hitIds: new Set(), pathArr,
            fromInfection: false
          });
        });
        UI.toast(I18N.t('passive_zombie_spawn'), 2000);
      }
    }
  },

  // Template: passiva baseada em timer periódico que invoca aliado/projétil.
  tsunami: {
    update(tower, p, dt) {
      if (tower.disabled) return;
      tower.tsunamiTimer = (tower.tsunamiTimer || 0) + dt;
      const interval = _passiveCtx.getPassiveValue(tower, 'interval', p.interval);
      if (tower.tsunamiTimer >= interval) {
        tower.tsunamiTimer = 0;
        const hp    = _passiveCtx.getPassiveValue(tower, 'hp', p.hp);
        const paths = window.currentPaths || [PATH_POINTS];
        paths.forEach(pathArr => {
          const pathLen = getPathLength(pathArr);
          _passiveCtx.tsunamis.push({ hp, maxHp: hp, dist: pathLen, speed: 100, color: '#3498db', hitIds: new Set(), pathArr });
        });
        UI.toast(I18N.t('passive_tsunami'), 2000);
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
      const maxS   = _passiveCtx.getPassiveValue(tower, 'max_stacks', p.max_stacks || 999);
      const decayT = _passiveCtx.getPassiveValue(tower, 'decay_time', p.decay_time);
      tower.killStreak = Math.min((tower.killStreak || 0) + 1, maxS);
      tower.killDecayTimer = decayT;
    }
  },

  // Nami: carrega energia atmosférica a cada ataque; ao atingir o limite
  // desencadeia tempestade global que desacelera TODOS os inimigos em tela.
  tempo_acumulado: {
    renderBadge(tower, p) {
      const charges = tower.tempCharges || 0;
      const max = _passiveCtx.getPassiveValue(tower, 'max_charges', p.max_charges || 8);
      if (charges === 0) return null;
      return { text: `⚡${charges}/${max}`, color: charges >= max - 1 ? '#fbbf24' : '#93c5fd' };
    },
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (tower.disabled || hitEnemies.length === 0) return;
      const max      = _passiveCtx.getPassiveValue(tower, 'max_charges', p.max_charges || 8);
      const slowPct  = p.slow_pct  || 0.40;
      const slowDur  = p.slow_duration || 2.5;
      tower.tempCharges = (tower.tempCharges || 0) + 1;
      if (tower.tempCharges >= max) {
        tower.tempCharges = 0;
        _passiveCtx.enemies.forEach(e => {
          if (e.dead || e.reached_end) return;
          applyStatus(e, 'freeze', { slow_pct: slowPct, duration: slowDur });
        });
        _passiveCtx.addEffect({ type: 'ring', x: tower.x, y: tower.y, maxR: 80, color: '#60a5fa', timer: 0.6, maxTimer: 0.6, r: 0 });
        UI.toast(I18N.t('passive_global_storm', { pct: (slowPct * 100).toFixed(0) }), 2200);
      }
    }
  },

  // Template: aura de área que aplica debuff passivamente a cada frame.
  slow_aura: {
    update(tower, p, dt) {
      if (tower.disabled) return;
      const stats   = _passiveCtx.getTowerStats(tower);
      const slowPct = _passiveCtx.getPassiveValue(tower, 'slow_pct', p.slow_pct);
      _passiveCtx.enemies.forEach(e => {
        if (e.dead || e.reached_end) return;
        if (_passiveCtx.distSq(tower.x, tower.y, e.x, e.y) <= stats.range * stats.range)
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
      const mult = _passiveCtx.getPassiveValue(tower, 'mult', p.mult || 3);
      const color = cnt >= 3 ? '#ffc846' : cnt === 2 ? 'rgba(255,200,70,0.7)' : 'rgba(255,255,255,0.35)';
      return { text: `${cnt}/3 [${mult}×]`, color };
    },
    beforeAttack(tower, p, stats) {
      if (tower.isClone) return stats;
      tower.comboCounter = (tower.comboCounter || 0) + 1;
      if (tower.comboCounter >= 3) {
        const mult = _passiveCtx.getPassiveValue(tower, 'mult', p.mult || 3);
        tower.comboCounter = 0;
        _passiveCtx.addEffect({ type:'crit', x:tower.x, y:tower.y, color:CHAR_COLORS[tower.charId]||RARITY_COLORS[tower.rarity], timer:0.45, maxTimer:0.45, charId:tower.charId });
        return { ...stats, damage: stats.damage * mult };
      }
      return stats;
    }
  },

  // Template: chance de ataque extra no mesmo ciclo (apenas single_target).
  double_hit: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (tower.isClone || attackType !== 'single_target' || hitEnemies.length === 0) return;
      const chance = _passiveCtx.getPassiveValue(tower, 'chance', p.chance);
      if (Math.random() < chance) _passiveCtx.spawnProjectile(tower, hitEnemies[0], stats.damage, 'single');
    }
  },

  // Template: invocação de aliado temporário baseada em chance por ataque.
  clone_on_attack: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (tower.isClone) return;
      const chance = _passiveCtx.getPassiveValue(tower, 'chance', p.chance);
      if (Math.random() < chance) _passiveCtx.spawnClone(tower);
    }
  },

  // Template: aura de boost de dano para aliados no alcance da torre.
  damage_aura: {
    isAura: true,
    auraEffect(auraTower, p, attackingTower, dmg) {
      if (_passiveCtx.distSq(auraTower.x, auraTower.y, attackingTower.x, attackingTower.y) <= _passiveCtx.getTowerStats(auraTower).range ** 2)
        return dmg * (1 + _passiveCtx.getPassiveValue(auraTower, 'bonus', p.bonus));
      return dmg;
    }
  },

  // Template: redução de cooldown de ataque ao confirmar kill.
  kill_cooldown: {
    onKill(tower, p, enemy) {
      const period    = 1 / _passiveCtx.getTowerStats(tower).attack_speed;
      const reduction = _passiveCtx.getPassiveValue(tower, 'reduction', p.reduction);
      tower.attackTimer = Math.min(tower.attackTimer, period * reduction);
    }
  },

  // Template: aplica status em TODO acerto (dps/duration escalam com upgrades).
  status_on_hit: {
    onHit(tower, p, enemy, dmg) {
      const dps = _passiveCtx.getPassiveValue(tower, 'dps', p.dps);
      const dur = _passiveCtx.getPassiveValue(tower, 'duration', p.duration);
      applyStatus(enemy, p.status, { ...p, dps, duration: dur });
      return dmg;
    }
  },

  // Bansho Ten'in: Puxa inimigos para trás a cada N ataques
  bansho_tenin: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      tower.banshoCount = (tower.banshoCount || 0) + 1;
      const req = _passiveCtx.getPassiveValue(tower, 'attacks_required', p.attacks_required || 4);
      if (tower.banshoCount >= req) {
        tower.banshoCount = 0;
        const pushDist = _passiveCtx.getPassiveValue(tower, 'push_dist', p.push_dist || 30);
        hitEnemies.forEach(e => {
          e.dist = Math.max(0, e.dist - pushDist);
          const pos = getPosOnPath(e.dist, e.pathArr);
          e.x = pos.x; e.y = pos.y;
          _passiveCtx.addEffect({ type:'silenced', x: e.x, y: e.y, color:'#9b59b6', text:'Puxado!', timer:0.8, maxTimer:0.8 });
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
      const chance = _passiveCtx.getPassiveValue(tower, 'chance', p.chance);
      const mult   = _passiveCtx.getPassiveValue(tower, 'mult',   p.mult);
      if (Math.random() < chance) {
        _passiveCtx.addEffect({ type:'crit', x:enemy.x, y:enemy.y, color:RARITY_COLORS[tower.rarity], timer:0.35, maxTimer:0.35 });
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
        _passiveCtx.gold += 1;
        _passiveCtx.addEffect({ type:'coin', x:enemy.x, y:enemy.y - 15, color:'#f1c40f', timer:0.5, maxTimer:0.5 });
      }
      return dmg;
    }
  },

  // Template único: anula ptype/special do inimigo no primeiro acerto (permanente).
  silence_buffs: {
    onHit(tower, p, enemy, dmg) {
      if (!enemy.silenceChecked) {
        enemy.silenceChecked = true;
        if ((enemy.ptype !== 'normal' || enemy.special) && Math.random() < p.chance) {
          enemy.ptype  = 'normal';
          enemy.special = null;
          _passiveCtx.addEffect({ type:'shockwave', x:enemy.x, y:enemy.y, maxR:40, color:'#9b59b6', timer:0.4, maxTimer:0.4 });
        }
      }
      return dmg;
    }
  },

  // Template único: aplica MÚLTIPLOS status simultâneos em cada acerto.
  dual_affliction: {
    onHit(tower, p, enemy, dmg) {
      const bDps  = _passiveCtx.getPassiveValue(tower, 'burn_dps',  p.burn_dps);
      const blDps = _passiveCtx.getPassiveValue(tower, 'bleed_dps', p.bleed_dps);
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
      const prestigeMult = 1 + (tower.prestige || 0) * (p.prestigeMultPerLevel || 0);
      wg = Math.round(wg * prestigeMult);
      if (wg > 0) { _passiveCtx.gold += wg; _passiveCtx.updateHUD(); UI.toast(I18N.t('passive_l_gold', { gold: wg }), 2500); }
    },
    onAnyKill(tower, p, deadEnemy) {
      if (tower.isClone) return;
      let killGold = 0;
      for (let i = 0; i < tower.upgradeLevel; i++) killGold = tower.charData.upgrades[i]?.kill_gold || killGold;
      if (killGold > 0 && _passiveCtx.distSq(tower.x, tower.y, deadEnemy.x, deadEnemy.y) <= _passiveCtx.getTowerStats(tower).range ** 2) {
        _passiveCtx.gold += killGold; _passiveCtx.updateHUD();
      }
    }
  },

  // Farm aura: ao fim de cada wave, gera 20% do output de farms aliadas no alcance
  farm_aura: {
    onWaveEnd(tower, p) {
      if (tower.disabled) return;
      const range = _passiveCtx.getTowerStats(tower).range;
      let bonus = 0;
      _passiveCtx.towers.forEach(t => {
        if (t === tower || !t.charData?.is_farm_unit) return;
        if (_passiveCtx.distSq(tower.x, tower.y, t.x, t.y) > range * range) return;
        const tp = t.charData?.passive;
        if (!tp || tp.type !== 'wave_gold') return;
        let wg = tp.base + (t.level - 1) * (tp.perLevel || 0);
        for (let i = 0; i < t.upgradeLevel; i++) wg += t.charData.upgrades[i]?.gold_bonus || 0;
        const tMult = 1 + (t.prestige || 0) * (tp.prestigeMultPerLevel || 0);
        bonus += Math.round(wg * tMult * (p.bonus_pct || 0.20));
      });
      if (bonus > 0) { _passiveCtx.gold += bonus; _passiveCtx.updateHUD(); UI.toast(I18N.t('passive_farm_aura', { bonus }), 2000); }
    }
  },

  // ── Bleach: Passivas Novas ──────────────────────────────────────────────

  // Rukia / Toshiro — chance de congelar o alvo a cada acerto
  freeze_on_hit: {
    onHit(tower, p, enemy, dmg) {
      const chance = _passiveCtx.getPassiveValue(tower, 'chance', p.chance || 0.25);
      const dur    = _passiveCtx.getPassiveValue(tower, 'duration', p.duration || 2);
      if (Math.random() < chance) {
        applyStatus(enemy, 'freeze', { duration: dur, slow_pct: 0.6 });
        _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:22, color:'#7dd3fc', timer:0.3, maxTimer:0.3, r:0 });
      }
      return dmg;
    }
  },

  // Renji — stacks de veneno, estoura a cada N acertos no mesmo inimigo
  snake_venom: {
    onHit(tower, p, enemy, dmg) {
      enemy._venomStacks = (enemy._venomStacks || 0) + 1;
      const thresh = _passiveCtx.getPassiveValue(tower, 'stacks', p.stacks || 5);
      if (enemy._venomStacks >= thresh) {
        enemy._venomStacks = 0;
        const burst = _passiveCtx.getTowerStats(tower).damage * (p.burstMult || 4.5);
        _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:28, color:'#7c3aed', timer:0.35, maxTimer:0.35, r:0 });
        return dmg + burst;
      }
      return dmg;
    }
  },

  // Chad — dano multiplicado contra bosses e minibosses
  boss_slayer: {
    onHit(tower, p, enemy, dmg) {
      if (enemy.is_boss || enemy.is_miniboss) return dmg * (p.mult || 2.2);
      return dmg;
    }
  },

  // Orihime — aura que mantém stunCooldown alto em torres vizinhas (imunidade passiva)
  santen_kesshun: {
    isAura: false,
    update(tower, p, dt) {
      if (tower.disabled) return;
      const radius = p.radius || 145;
      _passiveCtx.towers.forEach(t => {
        if (t === tower) return;
        if (_passiveCtx.distSq(t.x, t.y, tower.x, tower.y) <= radius * radius && (t.miniStunTimer || 0) <= 0) {
          t.stunCooldown = Math.max(t.stunCooldown || 0, 8);
        }
      });
    }
  },

  // Byakuya — ao matar, pétalas causam dano em área ao redor do inimigo morto
  petal_mark: {
    onKill(tower, p, enemy) {
      const r    = p.splashRadius || 95;
      const dmg  = _passiveCtx.getTowerStats(tower).damage * (p.splashMult || 1.3);
      _passiveCtx.enemies.forEach(e => {
        if (!e.dead && !e.reached_end && e !== enemy && _passiveCtx.distSq(e.x, e.y, enemy.x, enemy.y) <= r * r) {
          _passiveCtx.dealDamage(tower, e, dmg);
        }
      });
      _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:r, color:'#f48fb1', timer:0.4, maxTimer:0.4, r:0 });
    }
  },

  // Kenpachi — cada kill adiciona stack permanente de dano (até maxStacks)
  berserker: {
    onHit(tower, p, enemy, dmg) {
      const stacks = tower.berserkerStacks || 0;
      return stacks > 0 ? dmg * (1 + stacks * (p.dmgPerStack || 0.06)) : dmg;
    },
    onKill(tower, p, enemy) {
      const max = p.maxStacks || 40;
      tower.berserkerStacks = Math.min((tower.berserkerStacks || 0) + 1, max);
    },
    renderBadge(tower, p) {
      const stacks = tower.berserkerStacks || 0;
      if (stacks === 0) return null;
      const max = p.maxStacks || 40;
      return { text: `${stacks}/${max}`, color: `rgba(239,68,68,${0.55 + (stacks/max)*0.45})` };
    }
  },

  // Ichigo Bankai — aura que amplifica dano de todas as torres em inimigos no seu alcance
  bankai_pressure: {
    isAura: true,
    auraEffect(auraTower, p, attackingTower, dmg, enemy) {
      if (!enemy || auraTower.disabled) return dmg;
      const range = _passiveCtx.getTowerStats(auraTower).range;
      if (_passiveCtx.distSq(enemy.x, enemy.y, auraTower.x, auraTower.y) <= range * range) {
        return dmg * (p.mult || 1.55);
      }
      return dmg;
    }
  },

  // Ichigo Vizard — cada 3º ataque vira AOE; imunidade total a stun
  hollow_sync: {
    update(tower, p, dt) {
      tower.stunCooldown = Math.max(tower.stunCooldown || 0, 5);
      if ((tower.miniStunTimer || 0) > 0) {
        tower.miniStunTimer = 0;
        if (!_passiveCtx.shinraTenseiActive) tower.disabled = false;
      }
    },
    beforeAttack(tower, p, stats) {
      tower._hollowSyncCount = ((tower._hollowSyncCount || 0) + 1);
      if (tower._hollowSyncCount >= 3) {
        tower._hollowSyncCount = 0;
        _passiveCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range * 0.6, color:'#fb923c', timer:0.25, maxTimer:0.25, r:0 });
        return { ...stats, type: 'aoe' };
      }
      return stats;
    }
  },

  // ── Ichigo Vizard 6★ ───────────────────────────────────────────────────

  // Passiva 1: Cero Oscuras — cada 3º ataque vira cone + aplica Medo
  cero_oscuras: {
    beforeAttack(tower, p, stats) {
      tower._ceroCount = (tower._ceroCount || 0) + 1;
      if (tower._ceroCount >= (p.every || 3)) {
        tower._ceroCount = 0;
        tower._ceroActive = true;
        return { ...stats, type: 'cone' };
      }
      return stats;
    },
    afterAttack(tower, p, hitEnemies) {
      if (!tower._ceroActive) return;
      tower._ceroActive = false;
      hitEnemies.forEach(e => applyStatus(e, 'medo', { duration: p.fear_duration || 4 }));
      _passiveCtx.addEffect({ type:'hollow_burst', x:tower.x, y:tower.y, maxR:120, timer:0.6, maxTimer:0.6, r:0 });
      _passiveCtx.screenShakeAmount = 12;
    },
    renderBadge(tower, p) {
      const n = tower._ceroCount || 0;
      if (n === 0) return null;
      return { text:`Cero ${n}/${p.every||3}`, color:'#f97316' };
    }
  },

  // Passiva 2: Rei dos Dois Mundos — sinergia Bleach + bônus próprio por aliados
  rei_dois_mundos: {
    isAura: true,
    auraEffect(auraTower, p, attackingTower, dmg) {
      if (auraTower.disabled || attackingTower === auraTower) return dmg;
      if (attackingTower.charData?.series === 'bleach')
        return dmg * (1 + (p.ally_bonus || 0.20));
      return dmg;
    },
    onHit(tower, p, enemy, dmg) {
      const bleachAllies = _passiveCtx.towers.filter(t => t !== tower && !t.disabled && t.charData?.series === 'bleach').length;
      if (bleachAllies > 0)
        return dmg * (1 + Math.min(bleachAllies, 5) * (p.self_bonus || 0.10));
      return dmg;
    }
  },

  // Passiva 3: Máscara Eterna — acumula 66 acertos → Modo Vizard Total (20s)
  mascara_eterna: {
    update(tower, p, dt) {
      if ((tower._vizardTimer || 0) > 0) {
        tower._vizardTimer -= dt;
        if (tower._vizardTimer <= 0) {
          tower._vizardTimer = 0;
          tower._vizardActive = false;
        }
      }
    },
    beforeAttack(tower, p, stats) {
      if (!tower._vizardActive) {
        tower._vizardStacks = (tower._vizardStacks || 0) + 1;
        if (tower._vizardStacks >= (p.max_stacks || 66)) {
          tower._vizardStacks = 0;
          tower._vizardActive = true;
          tower._vizardTimer = p.duration || 20.0;
          _passiveCtx.addEffect({ type:'vizard_mode_flash', x:tower.x, y:tower.y, timer:0.8, maxTimer:0.8 });
          UI.toast(I18N.t('passive_vizard'), 2000);
          _passiveCtx.screenShakeAmount = 25;
          _passiveCtx.vizardOverlayAlpha = 1.0;
        }
      }
      if (tower._vizardActive)
        return { ...stats, type: 'aoe_vizard_total', damage: stats.damage * (p.mode_dmg_mult || 2.0) };
      return stats;
    },
    renderBadge(tower, p) {
      if (tower._vizardActive)
        return { text:`VIZARD ${Math.ceil(tower._vizardTimer||0)}s`, color:'#ffffff' };
      const s = tower._vizardStacks || 0;
      if (s > 0) return { text:`Másк ${s}/${p.max_stacks||66}`, color:'#ffffff' };
      return null;
    }
  },

  // ── Passivas de Prestígio ───────────────────────────────────────────────

  // Ataque encadeia para 1-2 inimigos próximos (relâmpago, serpente, etc.)
  arc_chain: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0) return;
      const r   = p.chain_r   || 75;
      const dmg = stats.damage * (p.chain_mult || 0.5);
      const max = p.chains    || 1;
      const hit = new Set(hitEnemies.map(e => e.uid));
      let last = hitEnemies[0];
      for (let i = 0; i < max; i++) {
        const next = _passiveCtx.enemies.find(e => !e.dead && !e.reached_end && !hit.has(e.uid)
          && _passiveCtx.distSq(e.x, e.y, last.x, last.y) <= r * r && _passiveCtx.effectiveCanDamage(tower, e));
        if (!next) break;
        hit.add(next.uid);
        _passiveCtx.dealDamage(tower, next, dmg);
        _passiveCtx.addEffect({ type:'line', x:last.x, y:last.y, tx:next.x, ty:next.y,
          color:RARITY_COLORS[tower.rarity], timer:0.18, maxTimer:0.18 });
        last = next;
      }
    }
  },

  // Chance de crítico explosivo — acerto dá dano extra + splash em área
  crit_splash: {
    onHit(tower, p, enemy, dmg) {
      if (Math.random() < (p.crit_chance || 0.20)) {
        const r = p.splash_r || 60;
        _passiveCtx.enemies.forEach(e => {
          if (e !== enemy && !e.dead && !e.reached_end
              && _passiveCtx.distSq(e.x, e.y, enemy.x, enemy.y) <= r * r && _passiveCtx.effectiveCanDamage(tower, e)) {
            _passiveCtx.dealDamage(tower, e, dmg * (p.splash_mult || 0.45));
          }
        });
        _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:r,
          color:RARITY_COLORS[tower.rarity], timer:0.3, maxTimer:0.3, r:0 });
        return dmg * (p.crit_mult || 2.0);
      }
      return dmg;
    }
  },

  // Acumula ataques; no Nº ataque dispara super-golpe multiplicado
  spirit_surge: {
    beforeAttack(tower, p, stats) {
      tower._surgeCount = (tower._surgeCount || 0) + 1;
      if (tower._surgeCount >= (p.trigger_at || 5)) {
        tower._surgeCount = 0;
        _passiveCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:stats.range * 0.55,
          color:RARITY_COLORS[tower.rarity], timer:0.28, maxTimer:0.28, r:0 });
        return { ...stats, damage: stats.damage * (p.mult || 3.5) };
      }
      return stats;
    },
    renderBadge(tower, p) {
      const c = tower._surgeCount || 0;
      const t = p.trigger_at || 5;
      if (c === 0) return null;
      return { text: `${c}/${t}▲`, color: `rgba(251,191,36,${0.4 + c/t * 0.6})` };
    }
  },

  // Nº ataque acerta TODOS os inimigos no alcance (ataque fantasma)
  phantom_strike: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      tower._phantomCount = (tower._phantomCount || 0) + 1;
      if (tower._phantomCount >= (p.trigger_at || 7)) {
        tower._phantomCount = 0;
        const range = _passiveCtx.getTowerStats(tower).range;
        const pdmg  = stats.damage * (p.phantom_mult || 1.5);
        _passiveCtx.enemies.forEach(e => {
          if (!e.dead && !e.reached_end && _passiveCtx.distSq(e.x, e.y, tower.x, tower.y) <= range * range
              && _passiveCtx.effectiveCanDamage(tower, e)) {
            _passiveCtx.dealDamage(tower, e, pdmg);
          }
        });
        _passiveCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:range,
          color:'rgba(200,180,255,0.85)', timer:0.38, maxTimer:0.38, r:0 });
      }
    },
    renderBadge(tower, p) {
      const c = tower._phantomCount || 0;
      const t = p.trigger_at || 7;
      if (c === 0) return null;
      return { text: `${c}/${t}◆`, color: 'rgba(167,139,250,0.85)' };
    }
  },

  // Kill → triplica velocidade de ataque por alguns segundos
  kill_frenzy: {
    onKill(tower, p, enemy) {
      tower._frenzyTimer = p.duration  || 3;
      tower._frenzyMult  = p.speed_mult || 2.5;
      tower.attackTimer  = Math.min(tower.attackTimer || 9999, 0.12);
    },
    update(tower, p, dt) {
      if ((tower._frenzyTimer || 0) > 0)
        tower._frenzyTimer = Math.max(0, tower._frenzyTimer - dt);
    },
    renderBadge(tower, p) {
      if ((tower._frenzyTimer || 0) <= 0) return null;
      return { text: `${tower._frenzyMult||2.5}× SPD`, color: 'rgba(239,68,68,0.88)' };
    }
  },

  // Dano escala com a quantidade de inimigos vivos no campo
  battle_rage: {
    beforeAttack(tower, p, stats) {
      const n    = _passiveCtx.enemies.filter(e => !e.dead && !e.reached_end).length;
      const mult = 1 + Math.min(n * (p.per_enemy || 0.025), p.max_bonus || 0.5);
      return { ...stats, damage: stats.damage * mult };
    },
    renderBadge(tower, p) {
      const n = _passiveCtx.enemies.filter(e => !e.dead && !e.reached_end).length;
      if (n === 0) return null;
      const pct = Math.round(Math.min(n * (p.per_enemy||0.025), p.max_bonus||0.5) * 100);
      return { text: `+${pct}% RAGE`, color: 'rgba(251,113,133,0.85)' };
    }
  },

  // Qualquer kill de aliado no alcance dá ouro bônus (suporte)
  gold_detector: {
    onAnyKill(tower, p, deadEnemy) {
      if (tower.isClone || tower.disabled) return;
      if (_passiveCtx.distSq(tower.x, tower.y, deadEnemy.x, deadEnemy.y) <= _passiveCtx.getTowerStats(tower).range ** 2) {
        _passiveCtx.gold += p.bonus || 8;
        _passiveCtx.updateHUD();
      }
    }
  },

  // Aura global: todas as torres causam X% mais dano
  field_commander: {
    isAura: true,
    auraEffect(auraTower, p, attackingTower, dmg, enemy) {
      if (auraTower.disabled) return dmg;
      return dmg * (1 + (p.bonus || 0.12));
    }
  },

  // Chance de acertar o mesmo alvo uma segunda vez (menor dano)
  echo_strike: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0 || Math.random() >= (p.chance || 0.12)) return;
      const target = hitEnemies[0];
      if (!target.dead && !target.reached_end && _passiveCtx.effectiveCanDamage(tower, target)) {
        _passiveCtx.dealDamage(tower, target, stats.damage * (p.dmg_mult || 0.5));
        _passiveCtx.addEffect({ type:'ring', x:target.x, y:target.y, maxR:14, color:RARITY_COLORS[tower.rarity], timer:0.18, maxTimer:0.18, r:0 });
      }
    }
  },

  // Dano multiplicado contra inimigos com HP abaixo do limiar
  execute: {
    onHit(tower, p, enemy, dmg) {
      if (enemy.hp / enemy.maxHp <= (p.threshold || 0.25)) {
        _passiveCtx.addEffect({ type:'crit', x:enemy.x, y:enemy.y, color:'#ef4444', timer:0.3, maxTimer:0.3 });
        return dmg * (p.mult || 1.7);
      }
      return dmg;
    }
  },

  // Pulso periódico de dano em área ao redor da torre
  damage_pulse: {
    update(tower, p, dt) {
      if (tower.disabled) return;
      tower._pulseTimer = (tower._pulseTimer || 0) + dt;
      if (tower._pulseTimer >= (p.interval || 5)) {
        tower._pulseTimer = 0;
        const stats = _passiveCtx.getTowerStats(tower);
        const dmg   = stats.damage * (p.dmg_mult || 0.35);
        const range = stats.range   * 0.85;
        _passiveCtx.enemies.forEach(e => {
          if (!e.dead && !e.reached_end && _passiveCtx.distSq(e.x, e.y, tower.x, tower.y) <= range * range) {
            _passiveCtx.dealDamage(tower, e, dmg);
          }
        });
        _passiveCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:range, color:RARITY_COLORS[tower.rarity], timer:0.32, maxTimer:0.32, r:0 });
      }
    }
  },

  // Ouro fixo por wave (exclusivo de unidades farm no prestígio)
  prestige_gold: {
    onWaveEnd(tower, p) {
      if (tower.isClone) return;
      const bonus = p.bonus || 0;
      if (bonus > 0) { _passiveCtx.gold += bonus; _passiveCtx.updateHUD(); }
    }
  },

  // Uryu — escala quantos inimigos o ataque pierce acerta (base 3, upgrade aumenta)
  quincy_pierce: {
    beforeAttack(tower, p, stats) {
      const count = _passiveCtx.getPassiveValue(tower, 'count', p.count || 3);
      return { ...stats, pierce_count: count };
    }
  },

  // Orochimaru — passiva informativa; lógica de venda 100% já tratada em sellTower()
  edo_tensei_economy: {},

  // ═══════════════════════════════════════════════════════
  //  MARVEL — Passivas exclusivas do Mundo 4
  // ═══════════════════════════════════════════════════════

  // Spider-Man — teia no solo que paralisa inimigos que passam por ela
  web_zone: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0) return;
      const target = hitEnemies[0];
      const webR   = _passiveCtx.getPassiveValue(tower, 'web_radius', p.web_radius || 55);
      const dur    = _passiveCtx.getPassiveValue(tower, 'duration',   p.duration   || 2.5);
      // Aplica slow (freeze) no alvo e em inimigos próximos ao ponto de impacto
      _passiveCtx.enemies.forEach(e => {
        if (!e.dead && !e.reached_end && _passiveCtx.distSq(e.x, e.y, target.x, target.y) <= webR * webR)
          applyStatus(e, 'freeze', { slow_pct: 0.6, duration: dur });
      });
      _passiveCtx.addEffect({ type:'ring', x:target.x, y:target.y, maxR:webR, color:'#cbd5e1', timer:0.4, maxTimer:0.4, r:0 });
    }
  },

  // Black Widow — mata marcam inimigos próximos recebendo +25% dano de todas as fontes
  cross_mark: {
    onKill(tower, p, enemy) {
      const range  = _passiveCtx.getTowerStats(tower).range * 1.2;
      const dur    = _passiveCtx.getPassiveValue(tower, 'duration', p.duration || 6);
      const bonus  = _passiveCtx.getPassiveValue(tower, 'bonus',    p.bonus    || 0.25);
      let marked = 0;
      _passiveCtx.enemies.forEach(e => {
        if (!e.dead && !e.reached_end && _passiveCtx.distSq(e.x, e.y, enemy.x, enemy.y) <= range * range) {
          applyStatus(e, 'cross_mark', { duration: dur, bonus });
          marked++;
        }
      });
      if (marked > 0) {
        _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:range, color:'#f87171', timer:0.45, maxTimer:0.45, r:0 });
      }
    }
  },

  // Hawkeye — cicla entre 4 tipos de flecha (normal ×1.8, explosiva AOE, gelo, perfurante)
  arrow_rotation: {
    renderBadge(tower, p) {
      const idx   = (tower.arrowIndex || 0) % 4;
      const names = ['🟡','💥','❄️','➡️'];
      return { text: names[idx], color:'#fbbf24' };
    },
    beforeAttack(tower, p, stats) {
      tower.arrowIndex = (tower.arrowIndex || 0);
      const idx = tower.arrowIndex % 4;
      tower.arrowIndex++;
      switch(idx) {
        case 0: return { ...stats, damage: stats.damage * 1.8 };            // Normal poderosa
        case 1: return { ...stats, type:'aoe', damage: stats.damage * 0.9 };// Explosiva
        case 2: tower._nextShotFreeze = true; return stats;                  // Gelo (flag para onHit)
        case 3: return { ...stats, type:'pierce', pierce_count:3 };          // Perfurante
      }
      return stats;
    },
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (tower._nextShotFreeze && hitEnemies.length > 0) {
        const dur = _passiveCtx.getPassiveValue(tower, 'freeze_dur', p.freeze_dur || 3);
        hitEnemies.forEach(e => applyStatus(e, 'freeze', { slow_pct:1.0, duration:dur }));
        tower._nextShotFreeze = false;
      }
    }
  },

  // Black Panther — ataques ricocheteiam para N inimigos próximos ao alvo
  ricochet_aura: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0 || tower.isClone) return;
      const bounces = _passiveCtx.getPassiveValue(tower, 'bounces', p.bounces || 2);
      const radius  = _passiveCtx.getPassiveValue(tower, 'radius',  p.radius  || 80);
      const mult    = _passiveCtx.getPassiveValue(tower, 'mult',    p.mult    || 0.55);
      const primary = hitEnemies[0];
      const already = new Set([primary]);
      const nearby = _passiveCtx.enemies
        .filter(e => !e.dead && !e.reached_end && !already.has(e) &&
                     _passiveCtx.distSq(e.x, e.y, primary.x, primary.y) <= radius * radius)
        .sort((a,b) => _passiveCtx.distSq(a.x,a.y,primary.x,primary.y) - _passiveCtx.distSq(b.x,b.y,primary.x,primary.y))
        .slice(0, bounces);
      nearby.forEach(e => {
        _passiveCtx.dealDamage(tower, e, stats.damage * mult);
        _passiveCtx.addEffect({ type:'line', x:primary.x, y:primary.y, tx:e.x, ty:e.y, color:'#7c3aed', timer:0.18, maxTimer:0.18 });
      });
    }
  },

  // Thor — cada ataque encadeia raios para N inimigos próximos ao alvo
  chain_lightning: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0 || tower.isClone) return;
      const chains = _passiveCtx.getPassiveValue(tower, 'chains', p.chains || 3);
      const radius = _passiveCtx.getPassiveValue(tower, 'radius', p.radius || 90);
      const mult   = _passiveCtx.getPassiveValue(tower, 'mult',   p.mult   || 0.40);
      const primary = hitEnemies.reduce((b,e) => e.dist > b.dist ? e : b, hitEnemies[0]);
      const chained = [primary];
      let current = primary;
      for (let i = 0; i < chains; i++) {
        const next = _passiveCtx.enemies
          .filter(e => !e.dead && !e.reached_end && !chained.includes(e) &&
                       _passiveCtx.distSq(e.x,e.y,current.x,current.y) <= radius * radius)
          .sort((a,b) => _passiveCtx.distSq(a.x,a.y,current.x,current.y) - _passiveCtx.distSq(b.x,b.y,current.x,current.y))[0];
        if (!next) break;
        _passiveCtx.dealDamage(tower, next, stats.damage * mult);
        _passiveCtx.addEffect({ type:'line', x:current.x, y:current.y, tx:next.x, ty:next.y, color:'#fbbf24', timer:0.22, maxTimer:0.22 });
        chained.push(next);
        current = next;
      }
    }
  },

  // Hulk — fúria por inimigos no alcance (+5% dano por inimigo, máx configurável)
  rage_stack: {
    renderBadge(tower, p) {
      const stacks = tower.rageStacks || 0;
      if (stacks === 0) return null;
      return { text:`+${stacks * (p.per_enemy||5)}%`, color:'#10b981' };
    },
    update(tower, p, dt) {
      if (tower.isClone) return;
      const stats    = _passiveCtx.getTowerStats(tower);
      const inRange  = _passiveCtx.enemies.filter(e => !e.dead && !e.reached_end &&
                       _passiveCtx.distSq(tower.x,tower.y,e.x,e.y) <= stats.range * stats.range);
      tower.rageStacks = inRange.length;
      if (inRange.length === 0) {
        tower._rageFadeTimer = (tower._rageFadeTimer || 0) - dt;
        if (tower._rageFadeTimer <= 0) tower.rageStacks = 0;
      } else {
        tower._rageFadeTimer = _passiveCtx.getPassiveValue(tower, 'fade_time', p.fade_time || 3);
      }
    },
    onHit(tower, p, enemy, dmg) {
      const stacks  = tower.rageStacks || 0;
      if (stacks === 0) return dmg;
      const perEnemy = _passiveCtx.getPassiveValue(tower, 'per_enemy', p.per_enemy || 0.05);
      const maxBonus = _passiveCtx.getPassiveValue(tower, 'max_bonus', p.max_bonus || 0.50);
      return dmg * (1 + Math.min(stacks * perEnemy, maxBonus));
    }
  },

  // Iron Man — a cada N ataques, dispara um Unibeam (linha, dano massivo)
  unibeam: {
    renderBadge(tower, p) {
      const cnt  = (tower.unibeamCounter || 0);
      const need = _passiveCtx.getPassiveValue(tower, 'attacks_required', p.attacks_required || 8);
      return { text:`UB ${cnt}/${need}`, color: cnt >= need - 1 ? '#f59e0b' : '#94a3b8' };
    },
    beforeAttack(tower, p, stats) {
      tower.unibeamCounter = (tower.unibeamCounter || 0) + 1;
      const need = _passiveCtx.getPassiveValue(tower, 'attacks_required', p.attacks_required || 8);
      const mult = _passiveCtx.getPassiveValue(tower, 'mult', p.mult || 8);
      if (tower.unibeamCounter >= need) {
        tower.unibeamCounter = 0;
        _passiveCtx.addEffect({ type:'shockwave', x:tower.x, y:tower.y, maxR:50, color:'#fbbf24', timer:0.3, maxTimer:0.3, r:0 });
        return { ...stats, type:'linha', damage: stats.damage * mult };
      }
      return stats;
    }
  },

  // World Breaker Hulk — ao matar, explosão AOE com dano crescente por kills consecutivas
  gamma_burst: {
    renderBadge(tower, p) {
      const streak = tower.gammaStreak || 0;
      if (streak === 0) return null;
      return { text:`🔥×${streak}`, color:'#10b981' };
    },
    update(tower, p, dt) {
      if ((tower.gammaStreak || 0) === 0) return;
      tower._gammaStreakTimer = (tower._gammaStreakTimer || 0) - dt;
      if (tower._gammaStreakTimer <= 0) tower.gammaStreak = 0;
    },
    onKill(tower, p, enemy) {
      const radius   = _passiveCtx.getPassiveValue(tower, 'radius',   p.radius   || 120);
      const baseMult = _passiveCtx.getPassiveValue(tower, 'burst_mult',p.burst_mult|| 3.0);
      const streakM  = _passiveCtx.getPassiveValue(tower, 'streak_bonus',p.streak_bonus||0.20);
      const streakDur= _passiveCtx.getPassiveValue(tower, 'streak_dur', p.streak_dur || 3);
      tower.gammaStreak = (tower.gammaStreak || 0) + 1;
      tower._gammaStreakTimer = streakDur;
      const mult = baseMult + (tower.gammaStreak - 1) * streakM;
      const stats = _passiveCtx.getTowerStats(tower);
      let hits = 0;
      _passiveCtx.enemies.forEach(e => {
        if (!e.dead && !e.reached_end && _passiveCtx.distSq(e.x,e.y,enemy.x,enemy.y) <= radius * radius) {
          _passiveCtx.dealDamage(tower, e, stats.damage * mult);
          hits++;
        }
      });
      if (hits > 0)
        _passiveCtx.addEffect({ type:'ring', x:enemy.x, y:enemy.y, maxR:radius, color:'#10b981', timer:0.5, maxTimer:0.5, r:0 });
    }
  },

  // ── Tsunade — Byakugou (restaura vida após X segundos de wave ativa) ──────
  byakugou: {
    renderBadge(tower, p) {
      const timer = tower._byakugouTimer || 0;
      const trigger = _passiveCtx.getPassiveValue(tower, 'trigger_at', p.trigger_at || 40);
      const remaining = Math.max(0, trigger - timer);
      return remaining <= 10 ? { text:`✨ ${Math.ceil(remaining)}s`, color:'#f9a8d4' }
                              : { text:`BY ${Math.ceil(remaining)}s`, color:'#d1d5db' };
    },
    update(tower, p, dt) {
      if (tower.isClone) return;
      tower._byakugouTimer  = (tower._byakugouTimer  || 0) + dt;
      tower._byakugouUsed   = tower._byakugouUsed   || false;
      const trigger = _passiveCtx.getPassiveValue(tower, 'trigger_at', p.trigger_at || 40);
      if (!tower._byakugouUsed && tower._byakugouTimer >= trigger) {
        tower._byakugouUsed = true;
        const restore = _passiveCtx.getPassiveValue(tower, 'restore', p.restore || 1);
        _passiveCtx.restoreLife(restore);
        _passiveCtx.addEffect({ type:'ring', x:tower.x, y:tower.y, maxR:80, color:'#f9a8d4', timer:1.0, maxTimer:1.0, r:0 });
        const pp = _passiveCtx.PASSIVE_SYSTEM._getPassives(tower).find(x => x.type === 'byakugou_shield');
        if (pp) { _passiveCtx.towers.forEach(t => { t.stunCooldown = Math.max(t.stunCooldown || 0, pp.stun_immune_duration || 2); }); _passiveCtx.toast(I18N.t('passive_hokage_stun', { s: pp.stun_immune_duration }), 2000); }
        UI.toast(I18N.t('passive_byakugou', { hp: restore }), 3500);

        // Imunidade a stun para todas as torres (prestígio 5)
        const pp5 = (tower.charData?.prestige_passives || {})[5];
        if ((tower.prestige || 0) >= 5 && pp5?.stun_immune_duration) {
          _passiveCtx.towers.forEach(t => {
            t._stunImmune = true;
            t._stunImmuneTimer = pp5.stun_immune_duration;
          });
          UI.toast(I18N.t('passive_hokage_aura', { s: pp5.stun_immune_duration }), 3000);
        }
      }
    },
    onWaveEnd(tower, p) {
      tower._byakugouTimer = 0;
      tower._byakugouUsed  = false;
    }
  },

  // Tsunade — Cem Sobrancelhas (passiva de campo — lógica real em base_drain handler)
  cem_sobrancelhas: {
    renderBadge(tower, p) {
      return { text:'100⬤', color:'#86efac' };
    }
  },

  // ── Killer Bee — Tinta do Gyuki ───────────────────────────────────────────
  // Quando um scatter acerta N+ inimigos diferentes ao mesmo tempo, todos ficam
  // marcados com tinta: recebem +bonus% de dano de TODAS as fontes por X segundos.
  gyuki_ink: {
    renderBadge(tower, p) {
      const inked = _passiveCtx.enemies.filter(e => !e.dead && !e.reached_end && e.status?.gyuki_ink?.active).length;
      if (inked === 0) return null;
      return { text: `🐙×${inked}`, color: '#7c3aed' };
    },
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0) return;
      const minHits = _passiveCtx.getPassiveValue(tower, 'min_hits', p.min_hits || 3);
      if (hitEnemies.length < minHits) return;
      const dur   = _passiveCtx.getPassiveValue(tower, 'ink_duration', p.duration || 5);
      const bonus = _passiveCtx.getPassiveValue(tower, 'bonus', p.bonus || 0.55);
      hitEnemies.forEach(e => {
        applyStatus(e, 'gyuki_ink', { duration: dur, bonus });
        _passiveCtx.addEffect({ type: 'ring', x: e.x, y: e.y, maxR: 22, color: '#7c3aed', timer: 0.4, maxTimer: 0.4, r: 0 });
      });
    }
  },

  // ── Killer Bee — Modo Bijuu Gyuki ────────────────────────────────────────
  modo_bijuu_gyuki: {
    renderBadge(tower, p) {
      const cd   = tower._bijuuTimer || 0;
      const need = _passiveCtx.getPassiveValue(tower, 'cooldown', p.cooldown || 20);
      const rem  = Math.max(0, need - cd);
      return rem <= 3 ? { text:`🐙 PRONTO`, color:'#a78bfa' }
                      : { text:`BJ ${Math.ceil(rem)}s`, color:'#7c3aed' };
    },
    update(tower, p, dt) {
      if (tower.isClone) return;
      tower._bijuuTimer = (tower._bijuuTimer || 0) + dt;

      const bFast = _passiveCtx.PASSIVE_SYSTEM._getPassives(tower).find(x => x.type === 'bijuu_fast');
      const baseCd = bFast ? (bFast.cooldown_override || 10) : _passiveCtx.getPassiveValue(tower, 'cooldown', p.cooldown || 15);
      const cd = Math.max(8, baseCd);

      if (tower._bijuuTimer >= cd) {
        tower._bijuuTimer = 0;
        const bBoost = _passiveCtx.PASSIVE_SYSTEM._getPassives(tower).find(x => x.type === 'bijuu_boost');
        const dur     = _passiveCtx.getPassiveValue(tower, 'duration', p.duration || 4) + (bBoost ? bBoost.duration_bonus || 2 : 0);
        const dmgMult = _passiveCtx.getPassiveValue(tower, 'damage_mult', p.damage_mult || 4.0) + (bBoost ? bBoost.damage_bonus || 0.5 : 0);
        const stats   = _passiveCtx.getTowerStats(tower);

        // Busca passiva gyuki_ink para extrair bonus e duração da tinta
        const inkP   = _passiveCtx.PASSIVE_SYSTEM._getPassives(tower).find(x => x.type === 'gyuki_ink');
        const inkDur = inkP ? _passiveCtx.getPassiveValue(tower, 'ink_duration', inkP.duration || 5) : 5;
        const inkBonus = inkP ? _passiveCtx.getPassiveValue(tower, 'bonus', inkP.bonus || 0.55) : 0.55;

        // Paralisa todos os inimigos por 1.5s E marca com Tinta do Gyuki
        _passiveCtx.enemies.forEach(e => {
          if (!e.dead && !e.reached_end) {
            applyStatus(e, 'paralisia',  { duration: 1.5 });
            applyStatus(e, 'gyuki_ink',  { duration: inkDur, bonus: inkBonus });
          }
        });

        // Dano massivo em toda a tela
        _passiveCtx.enemies.forEach(e => {
          if (!e.dead && !e.reached_end) {
            _passiveCtx.dealDamage(tower, e, stats.damage * dmgMult);
          }
        });

        // Burn se o upgrade estiver ativo
        const burnDps = _passiveCtx.getPassiveValue(tower, 'bijuu_burn_dps', 0);
        if (burnDps > 0) {
          const burnDur = _passiveCtx.getPassiveValue(tower, 'bijuu_burn_dur', 3);
          _passiveCtx.enemies.forEach(e => {
            if (!e.dead && !e.reached_end) applyStatus(e, 'burn', { dps: burnDps, duration: burnDur });
          });
        }

        _passiveCtx.addEffect({ type:'shockwave', x:tower.x, y:tower.y, maxR:600, color:'#7c3aed', timer:0.9, maxTimer:0.9, r:0 });
        _passiveCtx.screenShakeAmount = 18;
        UI.toast(I18N.t('passive_bijuu', { s: dur }), 3500);
      }
    }
  },

  
  ally_damage_aura: {
    isAura: true,
    auraEffect(auraTower, p, attackingTower, dmg, enemy) {
      if (auraTower.disabled) return dmg;
      return dmg * (1 + (p.bonus || 0.06));
    }
  },
  byakugou_shield: {},
  last_stand: {},
  mark_on_nth_hit: {
    afterAttack(tower, p, hitEnemies, attackType, stats) {
      if (hitEnemies.length === 0) return;
      tower._markCount = (tower._markCount || 0) + 1;
      if (tower._markCount >= (p.n || 5)) {
        tower._markCount = 0;
        const target = hitEnemies[0];
        if (!target.dead && !target.reached_end) {
          applyStatus(target, 'cross_mark', { duration: p.duration || 3, bonus: p.bonus || 0.30 });
          _passiveCtx.addEffect({ type:'ring', x:target.x, y:target.y, maxR:40, color:'#fbbf24', timer:0.5, maxTimer:0.5, r:0 });
        }
      }
    }
  },
  bijuu_boost: {},
  bijuu_fast: {},
  none: {}
};
