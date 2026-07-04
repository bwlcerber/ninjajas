const fs = require('fs');
let code = fs.readFileSync('js/store.js', 'utf8');

code = code.replace(/([a-zA-Z0-9_]+)\.client_name\.toLowerCase\(\)/g, '($1.client_name || \'N/A\').toLowerCase()');

fs.writeFileSync('js/store.js', code);
console.log('Fixed store.js safely');
