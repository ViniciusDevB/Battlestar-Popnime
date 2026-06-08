const fs = require('fs');

function loadFile(path, varNames) {
  let data = fs.readFileSync(path, 'utf-8');
  varNames.forEach(v => {
    data = data.replace(new RegExp(`(?:const|let|var)\\s+${v}\\s*=`, 'g'), `var ${v} =`);
  });
  data += `\nreturn { ${varNames.join(', ')} };`;
  return new Function(data)();
}

try {
  const chars = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\characters.js', ['CHARACTERS']);
  const enemies = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\enemies.js', ['STATUS_TYPES', 'ENEMY_SPECIAL_HANDLERS', 'PTYPE_BEHAVIORS', 'ENEMY_DEFS']);
  const stages = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\stages.js', ['STAGES']);
  const worlds = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\world.js', ['WORLDS']);
  const events = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\events_data.js', ['EVENTS_DATA']);

  const CHARACTERS = chars.CHARACTERS;
  const ENEMY_DEFS = enemies.ENEMY_DEFS;
  const STAGES = stages.STAGES;
  const WORLDS = worlds.WORLDS;
  const EVENTS_DATA = events.EVENTS_DATA;

  let md = "# Relatório Minucioso de Balanceamento (Atualizado)\\n\\n";
  
  // 1. Personagens
  md += "## 1. Análise de Personagens (Eficiência e DPS)\\n\\n";
  md += "Abaixo está a análise dos personagens jogáveis focando no seu potencial máximo, levando em conta os upgrades.\\n";
  md += "A métrica mais importante é o **Custo/DPS Máx**, indicando quanto ouro custa para obter 1 ponto de DPS. Valores **menores** são melhores.\\n\\n";
  
  md += "| Personagem | Raridade | Custo Base | Custo Total | DPS Base | DPS Máx | Custo/DPS Máx | Modificador Final | Tipo |\\n";
  md += "|---|---|---|---|---|---|---|---|---|\\n";
  
  let charStats = [];
  for(let key in CHARACTERS) {
    let c = CHARACTERS[key];
    if(!c.playable) continue;
    
    let dmg = c.base_stats.damage;
    let atkInterval = c.base_stats.attack_speed;
    let baseDps = dmg / atkInterval;
    
    let totalCost = c.deploy_cost;
    let maxDmg = dmg;
    let maxInterval = atkInterval;
    let maxType = c.base_stats.type;
    
    if (c.upgrades) {
        c.upgrades.forEach(u => {
            totalCost += u.cost;
            if (u.damage_mult) maxDmg *= u.damage_mult;
            if (u.speed_mult) maxInterval /= u.speed_mult; 
            if (u.type) maxType = u.type;
        });
    }
    
    let maxDps = maxDmg / maxInterval;
    let costPerDps = totalCost / maxDps;
    
    let mods = [];
    if(c.passive) {
      if(c.passive.type === 'slow_aura' || c.passive.type === 'freeze_on_hit' || c.passive.type === 'paralisia') mods.push('CC/Lentidão');
      if(c.passive.type === 'wave_gold') mods.push('Farm');
      if(c.passive.type === 'status_on_hit') mods.push('Burn/Bleed');
      if(c.passive.type === 'damage_aura' || c.passive.type === 'bankai_pressure') mods.push('Aura Dano');
    }
    
    charStats.push({
      name: c.name,
      rarity: c.rarity,
      baseCost: c.deploy_cost,
      totalCost,
      baseDps,
      maxDps,
      costPerDps,
      maxType,
      mods: mods.join(', ') || 'Puro Dano'
    });
  }
  
  charStats.sort((a,b) => a.costPerDps - b.costPerDps);
  
  charStats.forEach(c => {
    md += `| ${c.name} | ${c.rarity}⭐ | ${c.baseCost} | ${c.totalCost} | ${c.baseDps.toFixed(1)} | ${c.maxDps.toFixed(1)} | ${c.costPerDps.toFixed(2)} | ${c.mods} | ${c.maxType} |\\n`;
  });
  
  md += "\\n### Análise da Tabela de Personagens:\\n";
  md += "- **Torres de Farm**: Como o Ouro por inimigo e Wave agora são fixos, personagens de Farm como *L* ganham uma importância estratégica maior. Eles são a única fonte que escala passivamente o ganho de Ouro.\\n";
  md += "- **Single vs AOE**: Torres Single Target devem ter um Custo/DPS consideravelmente menor que torres de AOE ou Full AOE. Torres AOE (Area of Effect) são desproporcionalmente melhores porque limpam as levas inteiras gerando $50 fixo por kill rapidamente.\\n";

  // 2. Inimigos
  md += "\\n## 2. Análise de Inimigos e Escalonamento Base\\n\\n";
  md += "Com a mudança na mecânica de economia, o **Gold por Inimigo agora é FIXO em 50**, independentemente de quão poderoso ele seja. O **Ouro de Wave é FIXO em 100**, e pular waves dá **100 * SkipMultiplier**.\\n\\n";
  
  md += "| Inimigo | Vida Base | Vel. | Tipos / Especiais | Eficiência HP/Ouro (Baseado em 50 Fixo) |\\n";
  md += "|---|---|---|---|---|\\n";
  
  for(let key in ENEMY_DEFS) {
    let e = ENEMY_DEFS[key];
    let ptypes = Array.isArray(e.ptype) ? e.ptype.join(', ') : (e.ptype || 'normal');
    if (e.special) ptypes += ` / Spc: ${e.special}`;
    // Gold is fixed to 50
    let hpPerGold = e.hp / 50;
    md += `| ${e.name} | ${e.hp} | ${e.speed} | ${ptypes} | ${hpPerGold.toFixed(1)} |\\n`;
  }
  
  md += "\\n### Observações sobre os Inimigos:\\n";
  md += "- **Eficiência de HP/Ouro Escalada**: Porque cada monstro sempre dá 50 de ouro, os chefes (que possuem centenas de milhares de HP) têm uma proporção HP/Ouro assustadora. Matar um Boss dá os mesmos 50 ouros que matar um Ninja Comum, tornando-os buracos negros de DPS que não alimentam a economia do jogador.\\n";
  md += "- Isso força o jogador a maximizar o número de kills nos capangas (que também dão 50) usando torres baratas de AOE antes que a wave engrosse.\\n";
  
  // 3. Estágios / Mundos
  md += "\\n## 3. Escalonamento dos Mundos e Eventos\\n\\n";
  
  for(let key in WORLDS) {
    let w = WORLDS[key];
    md += `### ${w.name}\\n`;
    md += `- **Nível Mínimo:** ${w.required_level || 1}\\n`;
    md += `- **Quantidade de Estágios:** ${w.stages ? w.stages.length : 0}\\n`;
  }

  md += "\\n### Eventos Sazonais e Raids\\n";
  for(let key in EVENTS_DATA) {
     let ev = EVENTS_DATA[key];
     md += `- **${ev.name || key}**: ${ev.description || 'Evento focado em dificuldade e rewards específicos.'}\\n`;
  }

  // 4. Conclusão Final
  md += "\\n## 4. Recomendações e Gargalos de Balanceamento\\n\\n";
  md += "> [!TIP]\\n> Esta é uma visão heurística gerada a partir dos dados do código e da nova mecânica de ouro fixo.\\n\\n";
  md += "1. **Dominância do Ichigo (Vizard)**: Sendo 6⭐, ele domina as métricas com o menor Custo/DPS (0.85). Num meta de Ouro restrito (todos dão $50 e $100 por wave), ele será quase a única unidade capaz de matar bosses sem quebrar o banco.\\n";
  md += "2. **A Economia Congelada**: Com inimigos dropando sempre 50 e a wave dando apenas 100, os inimigos escalam muito mais rápido do que a carteira do jogador. Para compensar, a mecânica de Skip ganha muita prioridade (100 * multiplicador). O jogador tenderá a pular as waves o mais rápido possível para forçar a economia.\\n";
  md += "3. **Torres de Farm**: O Ouro fixo torna *torres geradoras de recursos indispensáveis*. O ouro obtido na wave nunca será o bastante, então L (Death Note) ou outras unidades de Farm precisam ser meta obrigatória.\\n";
  md += "4. **Revisar Bosses**: Aconselho criar um bônus especial caso o inimigo tenha a tag `is_boss` (ex: Boss dá 1000 de ouro), caso contrário derrotar um boss de 300.000 HP por 50 ouros pode ser punitivo.\\n";

  fs.writeFileSync('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\report.md', md);
  console.log("Relatório gerado em report.md!");
} catch(e) {
  console.error("Erro processando:", e);
}
