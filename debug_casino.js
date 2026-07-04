const fs = require('fs');
let code = fs.readFileSync('js/data.js', 'utf8');
const match = code.match(/client_name:\s*['"](.*?)['"]/g);
const found = match.filter(m => m.toLowerCase().includes('casino'));
console.log(found);
