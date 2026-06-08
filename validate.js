const fs = require('fs');

function loadDataFile(filename) {
    const code = fs.readFileSync(`./data/${filename}`, 'utf8');
    const sandbox = {};
    const script = `
        ${code}
        if (typeof CHARACTERS !== 'undefined') sandbox.CHARACTERS = CHARACTERS;
        if (typeof ENEMY_DEFS !== 'undefined') sandbox.ENEMY_DEFS = ENEMY_DEFS;
        if (typeof STAGES !== 'undefined') sandbox.STAGES = STAGES;
        if (typeof EVENTS_DATA !== 'undefined') sandbox.EVENTS_DATA = EVENTS_DATA;
        if (typeof WORLDS !== 'undefined') sandbox.WORLDS = WORLDS;
        if (typeof MISSIONS_LIST !== 'undefined') sandbox.MISSIONS_LIST = MISSIONS_LIST;
    `;
    try {
        eval(script);
    } catch (e) {
        // Some functions like evtWave and buildWave might need to be stubbed if they are called inside the file but defined elsewhere.
        // Wait, evtWave is in events_data.js and buildWave is in stages.js so they are fine.
        console.error("Error evaluating " + filename + ": " + e);
    }
    return sandbox;
}

const db = {
    CHARACTERS: loadDataFile('characters.js').CHARACTERS || {},
    ENEMY_DEFS: loadDataFile('enemies.js').ENEMY_DEFS || {},
    STAGES: loadDataFile('stages.js').STAGES || [],
    EVENTS_DATA: loadDataFile('events_data.js').EVENTS_DATA || [],
    WORLDS: loadDataFile('world.js').WORLDS || [],
    MISSIONS_LIST: loadDataFile('missions_data.js').MISSIONS_LIST || [],
};

let errors = [];

// 1. Check if all character IDs are unique
const charIds = new Set();
Object.values(db.CHARACTERS).forEach(c => {
    if (charIds.has(c.id)) errors.push(`Duplicate Character ID: ${c.id}`);
    charIds.add(c.id);
});

// 2. Check evolutions and ingredients
Object.values(db.CHARACTERS).forEach(c => {
    if (c.evolution) {
        if (!charIds.has(c.evolution.source)) {
            errors.push(`Character ${c.id} evolution source unknown: ${c.evolution.source}`);
        }
        if (c.evolution.requires) {
            c.evolution.requires.forEach(ing => {
                if (!charIds.has(ing.id)) {
                    errors.push(`Character ${c.id} evolution ingredient unknown: ${ing.id}`);
                }
            });
        }
    }
});

// 3. Check enemies
const enemyIds = new Set(Object.keys(db.ENEMY_DEFS));

// 4. Check stages and events
const worldIds = new Set(db.WORLDS.map(w => w.id));

function checkStage(stage) {
    if (stage.world && !worldIds.has(stage.world)) {
        errors.push(`Stage ${stage.id} references unknown world: ${stage.world}`);
    }
    if (stage.waves) {
        stage.waves.forEach((wave, i) => {
            wave.forEach((spawn, j) => {
                if (!enemyIds.has(spawn.type)) {
                    errors.push(`Stage ${stage.id} wave ${i} spawn ${j} references unknown enemy: ${spawn.type}`);
                }
            });
        });
    }
    if (stage.drops) {
        stage.drops.forEach((drop, i) => {
            if (!charIds.has(drop.id)) {
                errors.push(`Stage ${stage.id} drop ${i} references unknown character: ${drop.id}`);
            }
        });
    }
}

db.STAGES.forEach(stage => checkStage(stage));

db.EVENTS_DATA.forEach(evt => {
    evt.stages.forEach(stage => checkStage(stage));
});

// Check Missions
db.MISSIONS_LIST.forEach(m => {
    if (m.reward && m.reward.materials) {
        m.reward.materials.forEach(mat => {
            if (!charIds.has(mat.id)) {
                errors.push(`Mission ${m.id} gives unknown character: ${mat.id}`);
            }
        });
    }
});

console.log('--- VALIDATION RESULTS ---');
if (errors.length === 0) {
    console.log('No inconsistencies found.');
} else {
    errors.forEach(e => console.log(e));
}
