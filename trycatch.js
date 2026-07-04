const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

// Replace syncClients body with try/catch
code = code.replace(/function syncClients\(\) {/, "function syncClients() {\n    try {");
code = code.replace(/  function render\(container, focusClientName = null\) {/, "    } catch (e) {\n      console.error('syncClients CRASH:', e);\n    }\n  }\n\n  function render(container, focusClientName = null) {");

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Wrapped syncClients in try/catch');
