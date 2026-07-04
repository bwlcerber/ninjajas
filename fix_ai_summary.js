const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

code = code.replace(/existingRef\.ai_summary\.includes/g, "(existingRef.ai_summary || '').includes");
code = code.replace(/existingRef\.ai_summary\.length/g, "(existingRef.ai_summary || '').length");

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed clientrefs.js ai_summary safely');
