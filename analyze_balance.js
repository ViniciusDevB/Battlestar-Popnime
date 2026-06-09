'use strict';
const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────────────────────────────────────────────
function loadFile(path, varNames) {
  let data = fs.readFileSync(path, 'utf-8');
  varNames.forEach(v => {
    data = data.replace(new RegExp(`(?:const|let|var)\\s+${v}\\s*=`, 'g'), `var ${v} =`);
  });
  data += `\nreturn { ${varNames.join(', ')} };`;
  return new Function(data)();
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// How many enemies each attack type typically hits in an average wave.
// Used for "effective DPS" (combat efficiency metric).
// For boss fights use raw maxDps instead — boss is a single target.
const TYPE_MULT = {
  single_target: 1.0, single: 1.0,
  linha: 2.5, pierce: 2.5,
  cone: 2.0, aoe: 4.0, aoe_full: 7.0, scatter: 5.0, none: 0,
};

const GOLD_PER_KILL = 50;
const GOLD_PER_WAVE = 100;
const STARTING_GOLD = 300;

// Prestige damage multiplier: game.js → stats.damage *= 1 + prestige * 0.20
const PRESTIGE_MULT = { 0: 1.0, 1: 1.2, 5: 2.0, 10: 3.0 };

// Minimum team-DPS / boss-required-DPS ratio to consider a world "clearable"
const SAFE_MARGIN = 1.5;   // comfortable
const MIN_MARGIN  = 1.0;   // bare minimum

// Expected player rarity cap when reaching each world boss
const WORLD_RARITY_CAP = { naruto: 4, onepiece: 4, bleach: 5, marvel: 6 };

// Design targets for new unit costs per rarity (deploy / total)
const DEPLOY_TARGETS = { 3: '120–300', 4: '300–600', 5: '500–900', 6: '1000–1800' };
const TOTAL_TARGETS  = { 3: '600–3000', 4: '1500–6000', 5: '3000–10000', 6: '5000–16000' };

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
    len += Math.sqrt(dx*dx + dy*dy);
  }
  return Math.round(len);
}

function classifyPassive(passive) {
  if (!passive) return 'Puro Dano';
  const list = Array.isArray(passive) ? passive : [passive];
  const tags = new Set();
  list.forEach(p => {
    const t = p.type || '';
    if (['slow_aura','freeze_on_hit','paralisia','web_zone'].includes(t))             tags.add('CC');
    if (['wave_gold','edo_tensei_economy'].includes(t))                               tags.add('Farm');
    if (['status_on_hit','dual_affliction'].includes(t))                              tags.add('DoT');
    if (['damage_aura','bankai_pressure','field_commander','cross_mark'].includes(t)) tags.add('Aura');
    if (['clone_on_attack','tsunami'].includes(t))                                    tags.add('Invocação');
    if (['modo_bijuu_gyuki','bijuu_pull','gyuki_ink'].includes(t))                    tags.add('Bijuu');
    if (['boss_slayer'].includes(t))                                                  tags.add('Anti-Boss');
    if (['critical','crit_splash'].includes(t))                                       tags.add('Crítico');
    if (['kill_streak','berserker','kill_frenzy'].includes(t))                        tags.add('Frenezi');
    if (['santen_kesshun','byakugou','cem_sobrancelhas'].includes(t))                 tags.add('Defesa');
  });
  return tags.size > 0 ? [...tags].join('+') : 'Puro Dano';
}

// DPS = damage × attack_speed (attacks/s) — confirmed by game.js:
//   t.attackTimer = 1 / (stats.attack_speed * frenzyMult)  → attack_speed IS attacks/second
function computeUnitStats(c) {
  if (!c.playable) return null;
  const baseSpd = c.base_stats.attack_speed;
  if (c.is_farm_unit || baseSpd === 0) return null;

  const baseDps = c.base_stats.damage * baseSpd;

  let totalCost = c.deploy_cost;
  let maxDmg    = c.base_stats.damage;
  let maxSpd    = baseSpd;
  let maxType   = c.base_stats.type;

  (c.upgrades || []).forEach(u => {
    totalCost += u.cost;
    if (u.damage_mult) maxDmg *= u.damage_mult;
    if (u.speed_mult)  maxSpd *= u.speed_mult;
    if (u.type)        maxType = u.type;
  });

  const maxDps     = maxDmg * maxSpd;
  const typeMult   = TYPE_MULT[maxType] ?? 1.0;
  const effDps     = maxDps * typeMult;
  const bossDps    = maxDps;              // boss = single target, no type mult
  const goldPerEff = totalCost / effDps;

  return {
    id: c.id, name: c.name, rarity: c.rarity, series: c.series || '?',
    isEvo: !!c.evolution, isEvent: !!c.event_exclusive,
    deploy: c.deploy_cost, totalCost,
    baseDps: Math.round(baseDps), maxDps: Math.round(maxDps), bossDps: Math.round(bossDps),
    maxType, typeMult, effDps: Math.round(effDps), goldPerEff,
    numUpgrades: (c.upgrades || []).length, hasPrestige: !!c.prestige_passives,
    profile: classifyPassive(c.passive),
    p1Dps:  Math.round(maxDps * PRESTIGE_MULT[1]),
    p5Dps:  Math.round(maxDps * PRESTIGE_MULT[5]),
    p10Dps: Math.round(maxDps * PRESTIGE_MULT[10]),
  };
}

function computeFarmStats(c) {
  if (!c.playable) return null;
  if (!(c.is_farm_unit || c.base_stats.attack_speed === 0)) return null;
  const passArr = Array.isArray(c.passive) ? c.passive : (c.passive ? [c.passive] : []);
  const wavePas = passArr.find(p => p.type === 'wave_gold');
  const baseGold = wavePas?.base ?? 0;
  let maxGold = baseGold, killGold = 0, totalCost = c.deploy_cost;
  (c.upgrades || []).forEach(u => {
    totalCost += u.cost;
    if (u.gold_bonus) maxGold += u.gold_bonus;
    if (u.kill_gold)  killGold = Math.max(killGold, u.kill_gold);
  });
  return { name: c.name, rarity: c.rarity, deploy: c.deploy_cost, totalCost, baseGold, maxGold, killGold, profile: classifyPassive(c.passive) };
}

function numFmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(Math.round(n)); }

function marginEmoji(m) {
  if (m >= 2.0) return '🟢';
  if (m >= 1.5) return '🟡';
  if (m >= 1.0) return '🟠';
  return '🔴';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
try {
  const chars   = loadFile('./data/characters.js', ['CHARACTERS']);
  const enemies = loadFile('./data/enemies.js', ['STATUS_TYPES', 'ENEMY_SPECIAL_HANDLERS', 'PTYPE_BEHAVIORS', 'ENEMY_DEFS']);
  const stages  = loadFile('./data/stages.js', ['STAGES']);
  const worlds  = loadFile('./data/world.js', [
    'WORLDS', 'CANVAS_W', 'CANVAS_H',
    'PATH_POINTS_W1', 'PATH_POINTS_W2', 'PATH_POINTS_W3', 'PATH_POINTS_W4', 'PATH_POINTS_INF'
  ]);

  const CHARACTERS = chars.CHARACTERS;
  const ENEMY_DEFS = enemies.ENEMY_DEFS;
  const STAGES     = stages.STAGES;
  const WORLDS     = worlds.WORLDS;
  const WORLD_PATHS = {
    naruto:   worlds.PATH_POINTS_W1,
    onepiece: worlds.PATH_POINTS_W2,
    bleach:   worlds.PATH_POINTS_W3,
    marvel:   worlds.PATH_POINTS_W4,
    infinito: worlds.PATH_POINTS_INF,
  };

  let EVENTS_DATA = {};
  try { EVENTS_DATA = loadFile('./data/events_data.js', ['EVENTS_DATA']).EVENTS_DATA; } catch(_) {}

  // ── Unit stats ──────────────────────────────────────────────────────────────
  const combatUnits = Object.values(CHARACTERS).map(computeUnitStats).filter(Boolean);
  const farmUnits   = Object.values(CHARACTERS).map(computeFarmStats).filter(Boolean);
  combatUnits.sort((a, b) => a.goldPerEff - b.goldPerEff);

  const byRarity = {};
  combatUnits.forEach(u => { (byRarity[u.rarity] = byRarity[u.rarity] || []).push(u); });

  // ── World Boss Clearability ─────────────────────────────────────────────────
  const BOSS_STAGE_IDS = { naruto: 'fase6', onepiece: 'op_fase6', bleach: 'bl_fase6', marvel: 'mv_fase6' };
  // STAGES is array-indexed; look up by .id property
  const stageById = {};
  Object.values(STAGES).forEach(s => { if (s.id) stageById[s.id] = s; });

  const clearability = [];

  for (const [worldId, stageId] of Object.entries(BOSS_STAGE_IDS)) {
    const stage = stageById[stageId];
    if (!stage) continue;
    const pts = WORLD_PATHS[worldId];
    if (!pts) continue;

    const pLen = pathLength(pts);

    // Find highest-HP enemy across all waves (= boss)
    let bossEntry = null, bossHp = 0;
    for (const entry of (stage.waves || []).flat()) {
      const def = ENEMY_DEFS[entry.type];
      if (def && def.hp > bossHp) { bossHp = def.hp; bossEntry = { entry, def }; }
    }
    if (!bossEntry) continue;

    const boss = bossEntry.def;
    const timeOnPath = pLen / boss.speed;
    const reqDps = Math.ceil(boss.hp / timeOnPath);
    const raryCap = WORLD_RARITY_CAP[worldId];

    const eligible = combatUnits
      .filter(u => u.rarity <= raryCap)
      .sort((a, b) => b.bossDps - a.bossDps);

    const top4 = eligible.slice(0, 4);
    const top6 = eligible.slice(0, 6);
    const dps4 = top4.reduce((s, u) => s + u.bossDps, 0);
    const dps6 = top6.reduce((s, u) => s + u.bossDps, 0);
    const dps4p1 = top4.reduce((s, u) => s + u.p1Dps, 0);
    const dps4p5 = top4.reduce((s, u) => s + u.p5Dps, 0);
    const margin4 = dps4 / reqDps;
    const margin6 = dps6 / reqDps;

    clearability.push({
      worldId, stageId, stageName: stage.name || stageId,
      bossName: boss.name || stageId,
      bossHp: boss.hp, bossSpd: boss.speed,
      pLen, timeOnPath: Math.round(timeOnPath * 10) / 10,
      reqDps, raryCap,
      top4Names: top4.map(u => u.name),
      dps4: Math.round(dps4), dps6: Math.round(dps6),
      dps4p1: Math.round(dps4p1), dps4p5: Math.round(dps4p5),
      margin4, margin6,
    });
  }

  // ── Rarity Envelopes ────────────────────────────────────────────────────────
  const envelopes = {};
  for (let r = 3; r <= 6; r++) {
    const group = byRarity[r] || [];
    if (!group.length) continue;
    const effs = group.map(u => u.goldPerEff).sort((a, b) => a - b);
    const dpss = group.map(u => u.maxDps).sort((a, b) => a - b);
    const avg  = effs.reduce((s, v) => s + v, 0) / effs.length;
    envelopes[r] = {
      count: group.length,
      minEff: effs[0], maxEff: effs[effs.length-1], avgEff: avg,
      minDps: dpss[0], maxDps: dpss[dpss.length-1],
      avgDps: dpss.reduce((s, v) => s + v, 0) / dpss.length,
    };
  }

  // ── Problem Detection ───────────────────────────────────────────────────────
  const problems = [];

  // Outliers (too efficient vs same-rarity peers)
  for (const [r, group] of Object.entries(byRarity)) {
    const avg = group.reduce((s, u) => s + u.goldPerEff, 0) / group.length;
    group.filter(u => u.goldPerEff < avg * 0.5).forEach(u =>
      problems.push(`⚠️ **${u.name}** (${u.rarity}⭐) — eficiência ${u.goldPerEff.toFixed(2)} está menos da metade da média ${avg.toFixed(2)} da raridade. Considere reduzir dano ou aumentar custo.`)
    );
  }

  // Rarity inversions (lower rarity more efficient than a rarity 2+ above)
  for (const a of combatUnits) {
    for (const b of combatUnits) {
      if (b.rarity >= a.rarity + 2 && b.goldPerEff > a.goldPerEff * 1.8) {
        problems.push(`⚠️ **Inversão:** ${a.name} (${a.rarity}⭐, ${a.goldPerEff.toFixed(1)}) mais eficiente que ${b.name} (${b.rarity}⭐, ${b.goldPerEff.toFixed(1)}).`);
      }
    }
  }

  // Few upgrades
  combatUnits.filter(u => u.numUpgrades < 3).forEach(u =>
    problems.push(`ℹ️ **${u.name}** (${u.rarity}⭐) — apenas ${u.numUpgrades} upgrade(s). Progressão limitada.`)
  );

  // Clearability failures
  clearability.forEach(c => {
    if (c.margin4 < MIN_MARGIN)
      problems.push(`🔴 **${c.stageName}** (${c.worldId}): DPS disponível ${c.dps4} < DPS necessário ${c.reqDps}. Boss intransponível sem prestige.`);
    else if (c.margin4 < SAFE_MARGIN)
      problems.push(`🟠 **${c.stageName}** (${c.worldId}): Margem ${c.margin4.toFixed(2)}× — apertada. Jogadores abaixo da média do tier podem travar.`);
  });

  const uniqueProblems = [...new Set(problems)];

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE balance_guide.md
  // ═══════════════════════════════════════════════════════════════════════════
  const now = new Date().toISOString().split('T')[0];
  let md = '';

  // ── HEADER ─────────────────────────────────────────────────────────────────
  md += `# Guia de Balanceamento — Battlestar Popnime\n\n`;
  md += `> Gerado em ${now} a partir de \`data/characters.js\`, \`data/enemies.js\`, \`data/stages.js\`, \`data/world.js\`.\n`;
  md += `> Documento vivo: atualize após cada update que adicione unidades, inimigos ou mundos.\n\n`;
  md += `---\n\n`;

  // ── 1. DESIGN PRINCIPLES ───────────────────────────────────────────────────
  md += `## 1. Princípios de Design (Regras Não Negociáveis)\n\n`;

  md += `### 1.1 Acessibilidade de Conteúdo\n\n`;
  md += `- **Nenhum estágio exige uma unidade específica.** Qualquer fase deve ser clearável com uma equipe razoável da raridade esperada para o mundo, sem prestige e sem composição metaforçada (ex: "Ichigo 6⭐ P10 obrigatório").\n`;
  md += `- **Margem de segurança mínima (P0, equipe de 4):** DPS disponível ≥ ${MIN_MARGIN.toFixed(1)}× DPS exigido pelo boss. Alvo confortável: ≥ ${SAFE_MARGIN.toFixed(1)}×.\n`;
  md += `- **Prestige é bônus, não requisito.** Jogadores que nunca prestigiaram devem conseguir clear do último mundo disponível.\n\n`;

  md += `### 1.2 Progressão de Raridade\n\n`;
  md += `- **Unidades de raridade maior sempre superam** o DPS bruto de raridades menores. Um 6⭐ deve ser visivelmente mais forte que um 4⭐.\n`;
  md += `- **Novas unidades são marginalmente mais fortes** que as existentes da mesma raridade — dentro do envelope de design (seção 4), não fora dele.\n`;
  md += `- **Evolução tem custo oculto** (materiais de gacha). O DPS pós-evolução deve justificar isso vs simplesmente gachar um tier acima diretamente.\n\n`;

  md += `### 1.3 Economia\n\n`;
  md += `- **Farm não é requisito.** O jogador deve conseguir clear sem L/farm se construir a equipe de combate corretamente. Farm é acelerador.\n`;
  md += `- **Novos mundos calibram ouro ao custo de deploy** das unidades necessárias. Se o deploy médio subiu 3×, o ouro por wave ou kill deve escalar proporcionalmente.\n`;
  md += `- **Bosses entregam o mesmo ouro que capangas** (${GOLD_PER_KILL} fixo). Em updates futuros, considerar bônus proporcional ao HP do boss.\n\n`;

  md += `### 1.4 Red Flags (Nunca Faça)\n\n`;
  md += `- ❌ Boss com HP/speed que resulta em margem < 1.0× com equipe P0 da raridade esperada\n`;
  md += `- ❌ Unidade de raridade menor mais eficiente (ouro/DPS) que todas as de raridade 2+ acima\n`;
  md += `- ❌ Unidade 6⭐ com ouro/DPS pior que a média dos 5⭐\n`;
  md += `- ❌ Unit event-exclusive com deploy > 2× a média da raridade sem DPS proporcional\n`;
  md += `- ❌ Balancear conteúdo assumindo que o jogador terá P5+ em múltiplas unidades\n\n`;

  // ── 2. COMBAT UNIT TABLE ───────────────────────────────────────────────────
  md += `## 2. Unidades de Combate — Estado Atual\n\n`;
  md += `> **DPS = damage × attack\\_speed** (attack\\_speed = ataques/s; confirmado em game.js: \`attackTimer = 1/attack_speed\`).\n`;
  md += `> **DPS Ef.** = DPS Máx × mult. tipo (hits médios/ataque em wave típica) — use para comparar eficiência geral.\n`;
  md += `> **DPS Boss** = DPS Máx sem mult. tipo (boss é alvo único) — use para análise de clearabilidade.\n`;
  md += `> **Ouro/DPS Ef.** = custo total ÷ DPS Ef. Menor = mais eficiente. Ordenado crescente.\n\n`;

  md += `| Personagem | ⭐ | Série | Deploy | Total | DPS Base | DPS Máx | DPS Boss | Tipo | ×Tipo | DPS Ef. | Ouro/DPS | P1/P10 DPS | Perfil |\n`;
  md += `|---|:---:|---|---:|---:|---:|---:|---:|---|:---:|---:|---:|---|---|\n`;
  combatUnits.forEach(u => {
    const tag = (u.isEvo ? '🔁' : '') + (u.isEvent ? '🎪' : '');
    const pTag = u.hasPrestige ? `${numFmt(u.p1Dps)} / ${numFmt(u.p10Dps)}` : '—';
    md += `| ${tag}${u.name} | ${u.rarity}⭐ | ${u.series} | ${u.deploy} | ${u.totalCost} | ${u.baseDps} | ${u.maxDps} | ${u.bossDps} | ${u.maxType} | ×${u.typeMult.toFixed(1)} | **${u.effDps}** | ${u.goldPerEff.toFixed(2)} | ${pTag} | ${u.profile} |\n`;
  });
  md += `\n🔁 = evolução (custo gacha não incluso) | 🎪 = exclusivo de evento\n\n`;

  const top3 = combatUnits.slice(0, 3);
  const bot3 = combatUnits.slice(-3);
  md += `**Top 3 eficientes:** ${top3.map(u => `${u.name} (${u.goldPerEff.toFixed(2)})`).join(' → ')}\n\n`;
  md += `**3 menos eficientes:** ${bot3.map(u => `${u.name} (${u.goldPerEff.toFixed(2)})`).join(' → ')}\n\n`;

  // ── 3. FARM UNITS ──────────────────────────────────────────────────────────
  md += `## 3. Unidades de Farm e Suporte Puro\n\n`;
  md += `| Personagem | ⭐ | Deploy | Total | Ouro/Wave Base | Ouro/Wave Máx | Kill Gold | Perfil |\n`;
  md += `|---|:---:|---:|---:|---:|---:|---|---|\n`;
  farmUnits.sort((a, b) => a.rarity - b.rarity || b.maxGold - a.maxGold);
  farmUnits.forEach(f => {
    md += `| ${f.name} | ${f.rarity}⭐ | ${f.deploy} | ${f.totalCost} | ${f.baseGold} | **${f.maxGold}** | ${f.killGold > 0 ? '+'+f.killGold+'/kill' : '—'} | ${f.profile} |\n`;
  });
  md += `\n> Ouro fixo por wave = ${GOLD_PER_WAVE}. Uma farm maxada pode dobrar/triplicar a renda passiva. Mas farm só vale se a equipe de combate sobrevive sem ela — não projete fases que exijam farm para passar.\n\n`;

  // ── 4. RARITY ENVELOPES ────────────────────────────────────────────────────
  md += `## 4. Envelopes de Design por Raridade\n\n`;
  md += `Use esta seção ao criar novas unidades. O objetivo: novas unidades são **marginalmente melhores** que a média, sem sair do envelope.\n\n`;
  md += `| Raridade | Qtd | Ouro/DPS mín | Ouro/DPS méd | Ouro/DPS máx | DPS Boss méd | DPS Boss máx | Alvo novas (ouro/DPS) |\n`;
  md += `|---|:---:|---:|---:|---:|---:|---:|---|\n`;
  for (let r = 3; r <= 6; r++) {
    const e = envelopes[r];
    if (!e) continue;
    // Target: slightly below avg (= slightly better than average, still above minimum)
    const tMin = Math.max(e.minEff * 0.95, e.minEff).toFixed(2);
    const tMax = (e.avgEff * 0.88).toFixed(2);
    md += `| ${r}⭐ | ${e.count} | ${e.minEff.toFixed(2)} | ${e.avgEff.toFixed(2)} | ${e.maxEff.toFixed(2)} | ${Math.round(e.avgDps)} | ${Math.round(e.maxDps)} | ${tMin}–${tMax} |\n`;
  }

  md += `\n### Custo de Referência por Raridade\n\n`;
  md += `| Raridade | Deploy alvo | Custo total alvo | Upgrades mínimos |\n`;
  md += `|---|---|---|:---:|\n`;
  for (let r = 3; r <= 6; r++) md += `| ${r}⭐ | ${DEPLOY_TARGETS[r]} | ${TOTAL_TARGETS[r]} | 3+ |\n`;

  md += `\n> **Regra prática:** passivas de Aura (ex: Gojo +25% equipe) ou CC permitem DPS individual menor — a passiva multiplica o output do time inteiro. Documente o multiplicador real ao adicionar Auras novas.\n\n`;

  // ── 5. WORLD CLEARABILITY ──────────────────────────────────────────────────
  md += `## 5. Clearabilidade por Mundo — Boss Final\n\n`;
  md += `**Método:** DPS Necessário = HP ÷ (Comprimento Caminho ÷ Velocidade Boss). DPS Disponível = soma dos 4 melhores DPS Boss (sem prestige, rarity ≤ cap do mundo).\n\n`;
  md += `| Mundo | Fase | Boss | HP | Vel | Caminho | Tempo | DPS Nec. | Equipe referência | DPS Disp. | Margem |\n`;
  md += `|---|---|---|---:|---:|---:|---:|---:|---|---:|:---:|\n`;
  clearability.forEach(c => {
    const em = marginEmoji(c.margin4);
    md += `| ${c.worldId} | ${c.stageName} | ${c.bossName} | ${c.bossHp.toLocaleString()} | ${c.bossSpd} | ${c.pLen}px | ${c.timeOnPath}s | **${c.reqDps}** | ${c.top4Names.join(', ')} | ${c.dps4} | ${em} **${c.margin4.toFixed(2)}×** |\n`;
  });
  md += `\n🟢 ≥2.0× confortável | 🟡 1.5–2.0× seguro | 🟠 1.0–1.5× apertado | 🔴 <1.0× impossível sem prestige\n\n`;

  md += `### 5.1 Impacto do Prestígio na Clearabilidade\n\n`;
  md += `| Mundo | Boss | DPS Nec. | P0 (base) | P1 (+20%) | P5 (+100%) | Margem P0 | Margem P1 | Margem P5 |\n`;
  md += `|---|---|---:|---:|---:|---:|:---:|:---:|:---:|\n`;
  clearability.forEach(c => {
    const m0 = c.margin4, m1 = c.dps4p1/c.reqDps, m5 = c.dps4p5/c.reqDps;
    md += `| ${c.worldId} | ${c.bossName} | ${c.reqDps} | ${c.dps4} | ${c.dps4p1} | ${c.dps4p5} | ${marginEmoji(m0)}${m0.toFixed(2)}× | ${marginEmoji(m1)}${m1.toFixed(2)}× | ${marginEmoji(m5)}${m5.toFixed(2)}× |\n`;
  });
  md += `\n> Se P0 já é ≥1.5×, prestige é bônus. Se P0 < 1.0×, o boss foi mal calibrado — corrija antes de lançar.\n\n`;

  // ── 6. PRESTIGE SYSTEM ─────────────────────────────────────────────────────
  md += `## 6. Sistema de Prestígio — Referência\n\n`;
  md += `Implementação em game.js: \`stats.damage *= 1 + tower.prestige * 0.20\` (linear por nível de prestige).\n\n`;
  md += `| Prestígio | Mult. Dano | Bônus Range | DPS resultante |\n`;
  md += `|:---:|---:|---:|---|\n`;
  md += `| P0  | ×1.00 | +0%  | Base |\n`;
  md += `| P1  | ×1.20 | +6%  | +20% DPS + passiva única P1 |\n`;
  md += `| P5  | ×2.00 | +30% | DPS dobrado + passiva única P5 |\n`;
  md += `| P10 | ×3.00 | +60% | DPS triplicado + passiva única P10 |\n`;
  md += `\n> **Cuidado:** uma 4⭐ P10 tem 3× o DPS de P0, aproximando-se de uma 6⭐ sem prestige. Nunca calibre um estágio assumindo P5+ em múltiplas unidades.\n\n`;
  const prestUnits = combatUnits.filter(u => u.hasPrestige);
  if (prestUnits.length > 0) md += `Unidades com passivas de prestígio (${prestUnits.length}): ${prestUnits.map(u => u.name).join(', ')}\n\n`;

  // ── 7. ECONOMY ─────────────────────────────────────────────────────────────
  md += `## 7. Economia do Jogo\n\n`;
  md += `| Fonte | Ouro | Observação |\n`;
  md += `|---|---:|---|\n`;
  md += `| Inicial | ${STARTING_GOLD} | Fixo |\n`;
  md += `| Por wave completa | ${GOLD_PER_WAVE} | Fixo |\n`;
  md += `| Por kill | ${GOLD_PER_KILL} | Fixo — boss = mesmo que capanga |\n`;
  md += `| Skip de wave | 100 × mult | Mult sobe 1 por skip (começa em 2) |\n`;
  const maxFarmGold = farmUnits.length > 0 ? Math.max(...farmUnits.map(f => f.maxGold)) : 0;
  if (maxFarmGold > 0) md += `| Farm maxada | +${maxFarmGold}/wave | Ver seção 3 |\n`;
  md += `\n### Orçamento Estimado — Stage de 6 Waves\n\n`;
  const waveIncome = 6 * GOLD_PER_WAVE + 6 * 10 * GOLD_PER_KILL;
  const skipBonus  = 100 * 2 + 100 * 3;
  md += `- **Sem farm/skip:** ~${STARTING_GOLD + waveIncome} ouro (inicial + waves + ~10 kills/wave)\n`;
  md += `- **Com farm maxada:** ~${STARTING_GOLD + waveIncome + maxFarmGold * 6} ouro\n`;
  md += `- **Com farm + 2 skips:** ~${STARTING_GOLD + waveIncome + maxFarmGold * 6 + skipBonus} ouro\n\n`;
  md += `> Novos mundos devem ser calibrados para que o jogador consiga fazer 2–3 upgrades da equipe dentro do orçamento sem farm. Se o deploy médio do tier subir muito, aumentar ouro por wave ou kill dos estágios.\n\n`;

  // ── 8. ENEMIES ─────────────────────────────────────────────────────────────
  md += `## 8. Inimigos — Escalonamento de HP\n\n`;
  md += `| Inimigo | HP | Vel | Tipos | Especial | Ouro/Kill | Classe |\n`;
  md += `|---|---:|---:|---|---|---:|---|\n`;
  const enemyList = Object.values(ENEMY_DEFS).sort((a, b) => b.hp - a.hp);
  enemyList.forEach(e => {
    const ptypes = Array.isArray(e.ptype) ? e.ptype.join('+') : (e.ptype || 'normal');
    const hpPerGold = e.hp / GOLD_PER_KILL;
    let classe = '🟢 Normal';
    if (hpPerGold > 500) classe = '🔴 Boss';
    else if (hpPerGold > 100) classe = '🟠 Miniboss';
    else if (hpPerGold > 30)  classe = '🟡 Elite';
    md += `| ${e.name || '?'} | ${e.hp.toLocaleString()} | ${e.speed} | ${ptypes} | ${e.special || '—'} | ${GOLD_PER_KILL} | ${classe} |\n`;
  });
  md += `\n> Bosses entregam os mesmos ${GOLD_PER_KILL} ouro que capangas com 500 HP. Em updates futuros: considerar \`boss_gold_bonus = Math.floor(hp / 1000)\` com teto de 500.\n\n`;

  // ── 9. PROBLEMS DETECTED ───────────────────────────────────────────────────
  md += `## 9. Problemas Detectados (Análise Automática)\n\n`;
  if (uniqueProblems.length === 0) {
    md += `✅ Nenhum problema crítico detectado.\n\n`;
  } else {
    uniqueProblems.forEach(p => { md += `- ${p}\n`; });
    md += `\n`;
  }

  // ── 10. GUIDELINES FOR FUTURE CONTENT ─────────────────────────────────────
  md += `## 10. Diretrizes para Futuras Atualizações\n\n`;

  md += `### 10.1 Checklist — Nova Unidade de Combate\n\n`;
  md += `- [ ] **Raridade coerente:** DPS Máx ≥ DPS Boss médio da raridade imediatamente abaixo\n`;
  md += `- [ ] **Envelope de eficiência:** ouro/DPS Ef. dentro do alvo da raridade (seção 4)\n`;
  md += `- [ ] **Deploy coerente:** dentro do alvo da raridade (seção 4)\n`;
  md += `- [ ] **Progressão de upgrades:** ≥ 3 upgrades; primeiro upgrade ≤ 30% do custo de deploy\n`;
  md += `- [ ] **Passiva justificada:** Aura/CC pode reduzir DPS individual — documente o multiplicador de equipe\n`;
  md += `- [ ] **Sem inversão:** verificar que nenhuma unidade de raridade ≥2 acima é menos eficiente\n`;
  md += `- [ ] **Prestige não quebra:** P10 desta unidade não deve tornar estágios triviais (margem > 5×)\n`;
  md += `- [ ] **Event-exclusive:** deploy ≤ 2× média da raridade; justificado por passiva diferenciada\n\n`;

  md += `### 10.2 Checklist — Novo Mundo / Nova Fase\n\n`;
  md += `Fórmula de calibragem do boss: \`HP_Boss = DPS_disponível × 0.65 × (pathLength / speed)\` para margem confortável.\n\n`;
  md += `- [ ] **Margem de segurança calculada:** top 4 unidades do tier, P0, margem ≥ ${MIN_MARGIN.toFixed(1)}× (alvo: ${SAFE_MARGIN.toFixed(1)}×)\n`;
  md += `- [ ] **Dificuldade Normal/Lendário:** mods ×1.5 e ×2.2 de HP não tornam o boss intransponível (P0)\n`;
  md += `- [ ] **Ouro por wave calibrado:** cobre 2–3 upgrades ao longo do stage (ver orçamento seção 7)\n`;
  md += `- [ ] **Stage modifiers:** dualFront / sandShield / blockZones — máximo 2 combinados no mesmo stage\n`;
  md += `- [ ] **Wave design:** waves anteriores ao boss não devem gastar tanto recurso que impeça o kill do boss\n`;
  md += `- [ ] **Path length:** caminhos muito curtos (< 1000px) aumentam drasticamente o DPS necessário\n\n`;

  md += `### 10.3 Referência de HP de Boss por Mundo\n\n`;
  md += `Valores atuais e alvos para calibrar progressão:\n\n`;
  md += `| Mundo | Cap Raridade | DPS Disp. (P0) | HP Confortável | HP Apertado | HP Atual | Status |\n`;
  md += `|---|:---:|---:|---:|---:|---:|---|\n`;
  clearability.forEach(c => {
    const comfHP = Math.round(c.dps4 * 0.65 * c.timeOnPath);
    const tightHP = Math.round(c.dps4 * 0.90 * c.timeOnPath);
    const status = c.margin4 >= SAFE_MARGIN ? '✅ OK'
      : c.margin4 >= MIN_MARGIN ? '⚠️ Apertado' : '🔴 Problema';
    md += `| ${c.worldId} | ≤${c.raryCap}⭐ | ${c.dps4} | ${comfHP.toLocaleString()} | ${tightHP.toLocaleString()} | ${c.bossHp.toLocaleString()} | ${status} |\n`;
  });

  // Hypothetical World 5
  if (clearability.length > 0) {
    const last = clearability[clearability.length - 1];
    const hyDps  = Math.round(last.dps4 * 1.5);
    const hyTime = 42;
    md += `| **Mundo 5 (hipotético)** | ≤6⭐ | ~${hyDps} (projeção) | ~${Math.round(hyDps*0.65*hyTime).toLocaleString()} | ~${Math.round(hyDps*0.90*hyTime).toLocaleString()} | — | 📋 Planejar |\n`;
  }

  md += `\n### 10.4 Recomendações Prioritárias\n\n`;
  md += `1. **Boss economy:** bosses entregam mesmo ouro que capangas — desequilíbrio histórico. Próximo update: adicionar \`boss_gold_bonus\` proporcional ao HP.\n`;
  md += `2. **Diversidade de farm:** \`edo_tensei_economy\` (reembolso total) existe em apenas 1 unidade. Adicionar variações (kill_gold farm, gold_per_wave-diferenciado) reduz dependência.\n`;
  md += `3. **Auras invisíveis no DPS:** Gojo (+25% equipe), Bankai (×1.55 dano recebido), Killer Bee (+55% tinta) multiplicam o output de toda a equipe — o DPS individual subestima muito seu valor. Documentar o multiplicador efetivo de cada aura ao calibrar novos estágios.\n`;
  md += `4. **Regra 6⭐:** apenas 1 cópia no campo preserva equilíbrio. Novas 6⭐ devem ser fortes o suficiente para justificar o slot, mas não ao ponto de tornar outras 6⭐ irrelevantes.\n`;
  md += `5. **Teto de prestige:** ao lançar novo conteúdo, testar clearabilidade com time full-P10 para garantir que o jogo ainda existe — o boss ainda deve levar dano não-trivial mesmo no scenario mais overpower.\n\n`;

  md += `---\n\n`;
  md += `*Próximo update: após adicionar novas unidades ou mundos, execute \`node analyze_balance.js\` para regenerar este guia.*\n`;

  fs.writeFileSync('./balance_guide.md', md);
  console.log(`✅ balance_guide.md gerado (${md.length} chars)`);
  console.log(`   ${combatUnits.length} unidades combate | ${farmUnits.length} farms | ${clearability.length} mundos analisados`);
  if (uniqueProblems.length > 0)
    console.log(`   ⚠️  ${uniqueProblems.length} problema(s) detectado(s) — ver seção 9`);
  else
    console.log(`   ✅ Nenhum problema detectado`);

} catch(e) {
  console.error('Erro ao gerar balance_guide.md:', e.message);
  console.error(e.stack);
}
