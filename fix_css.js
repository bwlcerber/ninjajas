const fs = require('fs');
let buf = fs.readFileSync('css/components.css');
const nullIdx = buf.indexOf(0);
if (nullIdx !== -1) {
  let endIdx = nullIdx;
  while (endIdx > 0 && (buf[endIdx] === 0 || buf[endIdx] === 10 || buf[endIdx] === 13 || buf[endIdx] === 32)) {
    endIdx--;
  }
  buf = buf.subarray(0, endIdx + 1);
}

let code = buf.toString('utf8');

// Remove the bad block
code = code.replace(/@media \(max-width: 1100px\) \{[\s\S]*?@media \(max-width: 768px\) \{[\s\S]*?\}\s*\}/, '');
// Remove the original block we added via echo
code = code.replace(/@media \(max-width: 1100px\) \{\s*\.material-row \{\s*flex-wrap: wrap;\s*\}\s*\.material-row-info \{\s*min-width: 250px;\s*\}\s*\.material-row-tags \{\s*flex-wrap: wrap;\s*\}\s*\}/g, '');

code += '\n\n@media (max-width: 1100px) {\n' +
  '  .material-row {\n' +
  '    display: grid;\n' +
  '    grid-template-columns: auto auto 1fr;\n' +
  '    grid-template-areas: \n' +
  '      "checkbox icon info"\n' +
  '      "tags tags tags"\n' +
  '      "actions actions actions";\n' +
  '    gap: 12px;\n' +
  '  }\n' +
  '  .material-row > div:nth-child(1) { grid-area: checkbox; }\n' +
  '  .material-row > div:nth-child(2) { grid-area: icon; }\n' +
  '  .material-row > div:nth-child(3) { grid-area: info; }\n' +
  '  .material-row > div:nth-child(4) { grid-area: tags; margin-top: 4px; }\n' +
  '  .material-row > div:nth-child(5) { \n' +
  '    grid-area: actions; \n' +
  '    justify-content: flex-end; \n' +
  '    border-top: 1px dashed var(--border-subtle);\n' +
  '    padding-top: 10px;\n' +
  '    margin-top: 4px;\n' +
  '    width: 100%;\n' +
  '  }\n' +
  '  .tabs {\n' +
  '    flex-wrap: wrap;\n' +
  '  }\n' +
  '  .filter-row {\n' +
  '    flex-wrap: wrap !important;\n' +
  '  }\n' +
  '}\n';

fs.writeFileSync('css/components.css', code);
console.log('Fixed components.css');
