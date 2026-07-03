const fs = require('fs');
let content = fs.readFileSync('js/data.js', 'utf8');
let before = content.length;
content = content.replace(/website_url:\s*'https?:\/\/(www\.)?ninjapromo\.io\/?'/g, "website_url: ''");
fs.writeFileSync('js/data.js', content, 'utf8');
console.log('Done replacing. Size difference: ' + (before - content.length));
