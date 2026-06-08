const fs = require('fs');
const path = require('path');

function loadDataFile(filename) {
    const code = fs.readFileSync(`./data/${filename}`, 'utf8');
    const sandbox = {};
    const script = `
        ${code}
        if (typeof CHARACTERS !== 'undefined') sandbox.CHARACTERS = CHARACTERS;
        if (typeof ENEMY_DEFS !== 'undefined') sandbox.ENEMY_DEFS = ENEMY_DEFS;
        if (typeof EVENTS_DATA !== 'undefined') sandbox.EVENTS_DATA = EVENTS_DATA;
    `;
    try { eval(script); } catch (e) {}
    return sandbox;
}

const db = {
    CHARACTERS: loadDataFile('characters.js').CHARACTERS || {},
    ENEMY_DEFS: loadDataFile('enemies.js').ENEMY_DEFS || {},
    EVENTS_DATA: loadDataFile('events_data.js').EVENTS_DATA || [],
};

let missingImages = [];

Object.values(db.CHARACTERS).forEach(c => {
    if (c.image) {
        const p = path.join(__dirname, c.image);
        if (!fs.existsSync(p)) missingImages.push('Missing Character Image: ' + c.image);
    }
});

Object.values(db.ENEMY_DEFS).forEach(e => {
    if (e.image) {
        const p = path.join(__dirname, e.image);
        if (!fs.existsSync(p)) missingImages.push('Missing Enemy Image: ' + e.image);
    }
});

db.EVENTS_DATA.forEach(evt => {
    if (evt.flyer) {
        const p = path.join(__dirname, evt.flyer);
        if (!fs.existsSync(p)) missingImages.push('Missing Event Flyer: ' + evt.flyer);
    }
});

if (missingImages.length === 0) {
    console.log('All image paths exist!');
} else {
    missingImages.forEach(m => console.log(m));
}
