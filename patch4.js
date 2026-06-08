const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

// We want to remove border-bottom-width from :hover selectors only, as it causes layout trashing
const hoverRegex = /:hover[^{]*{[^}]*border-bottom-width[^}]*}/g;

css = css.replace(hoverRegex, (match) => {
    // replace border-bottom-width: xxx; with nothing
    return match.replace(/border-bottom-width\s*:\s*[^;]+;?/g, '');
});

fs.writeFileSync('style.css', css);
console.log('Optimized button hover animations.');
