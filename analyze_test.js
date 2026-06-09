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
  const chars = loadFile('./data/characters.js', ['CHARACTERS']);
  const enemies = loadFile('./data/enemies.js', ['STATUS_TYPES', 'ENEMY_SPECIAL_HANDLERS', 'PTYPE_BEHAVIORS', 'ENEMY_DEFS']);
  const stages = loadFile('./data/stages.js', ['STAGES']);
  const worlds = loadFile('./data/world.js', ['WORLDS']);
  const events = loadFile('./data/events_data.js', ['EVENTS_DATA']);

  console.log("Characters loaded:", Object.keys(chars.CHARACTERS).length);
  console.log("Enemies loaded:", Object.keys(enemies.ENEMY_DEFS).length);
  console.log("Stages loaded:", Object.keys(stages.STAGES).length);
  console.log("Events loaded:", Object.keys(events.EVENTS_DATA).length);
} catch(e) {
  console.error(e);
}
