const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

const regex = /<div class="input-group span-2">[\s\S]*?<input class="input" type="url" id="add-asset-thumb"[\s\S]*?<\/div>/g;
code = code.replace(regex, '');

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Removed thumbnail field HTML');
