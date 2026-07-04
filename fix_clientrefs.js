const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

code = code.replace(/clientName\.toLowerCase\(\)/g, "(clientName || 'N/A').toLowerCase()");
code = code.replace(/decodedName\.toLowerCase\(\)/g, "(decodedName || 'N/A').toLowerCase()");
code = code.replace(/oldClientName\.toLowerCase\(\)/g, "(oldClientName || 'N/A').toLowerCase()");
code = code.replace(/client\.toLowerCase\(\)/g, "(client || 'N/A').toLowerCase()");

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed clientrefs.js safely');
