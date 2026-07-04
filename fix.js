const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

// Replace unsafe .client_name.toLowerCase() with .client_name?.toLowerCase()
code = code.replace(/([a-zA-Z0-9_]+)\.client_name\.toLowerCase\(\)/g, '$1.client_name?.toLowerCase()');

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed clientrefs.js safely');
