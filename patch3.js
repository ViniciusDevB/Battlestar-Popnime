const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');
let count = 0;
css = css.replace(/backdrop-filter\s*:\s*blur\([^)]+\);?/g, () => {
    count++;
    return '/* backdrop-filter removed for performance */';
});
fs.writeFileSync('style.css', css);
console.log('Removed ' + count + ' backdrop-filters');
