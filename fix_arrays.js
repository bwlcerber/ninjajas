const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

code = code.replace(/return raw \? JSON\.parse\(raw\) : \[\];/g, "const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : [];");

// Also let's fix line 247 just in case _fetchedData.geos is null:
// `(_fetchedData.geos || []).includes(g)` -> already safe.

// Let's fix line 265 just in case `_fetchedData.services_provided` is null/undefined:
// `${_fetchedData.services_provided.includes(s) ? 'checked' : ''}`
code = code.replace(/\$\{_fetchedData\.services_provided\.includes\(s\) \? 'checked' : ''\}/g, "${(_fetchedData.services_provided || []).includes(s) ? 'checked' : ''}");

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed clientrefs arrays safely');
