const fs = require('fs');
let content = fs.readFileSync('js/data.js', 'utf8');
content = content.replace(/'Design'/g, "'Web / Landing Pages'");
fs.writeFileSync('js/data.js', content, 'utf8');
console.log('Replaced all occurrences of Design');
