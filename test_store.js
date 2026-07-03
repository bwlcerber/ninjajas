const fs = require('fs');
let c=fs.readFileSync('js/store.js','utf8');
c = c.replace(/window\.PORTAL_DATA/g, 'require("./data_temp.js")');
fs.writeFileSync('js/store_temp.js', c);
