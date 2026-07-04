const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

// Fix 1: Array parsing
code = code.replace(/return raw \? JSON\.parse\(raw\) : \[\];/g, "const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : [];");

// Fix 2: ai_summary includes crash
code = code.replace(/existingRef\.ai_summary\.includes/g, "(existingRef.ai_summary || '').includes");
code = code.replace(/existingRef\.ai_summary\.length/g, "(existingRef.ai_summary || '').length");

// Fix 3: services_provided includes crash
code = code.replace(/\$\{_fetchedData\.services_provided\.includes\(s\) \? 'checked' : ''\}/g, "${(_fetchedData.services_provided || []).includes(s) ? 'checked' : ''}");

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed clientrefs cleanly');
