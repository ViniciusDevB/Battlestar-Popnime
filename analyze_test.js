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
  const enemies = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\enemies.js', ['STATUS_TYPES', 'ENEMY_SPECIAL_HANDLERS', 'PTYPE_BEHAVIORS', 'ENEMIES']);
  const stages = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\stages.js', ['STAGES']);
  const worlds = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\world.js', ['WORLDS']);
  const events = loadFile('c:\\\\Users\\\\User2\\\\Documents\\\\ASTD\\\\data\\\\events_data.js', ['EVENTS_DATA']);

  console.log("Characters loaded:", Object.keys(chars.CHARACTERS).length);
  console.log("Enemies loaded:", Object.keys(enemies.ENEMIES).length);
  console.log("Stages loaded:", Object.keys(stages.STAGES).length);
  console.log("Events loaded:", Object.keys(events.EVENTS_DATA).length);
} catch(e) {
  console.error(e);
}
