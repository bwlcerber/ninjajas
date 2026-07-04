const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

const regex = /<div class="input-group span-2">\s*<span class="input-label">Thumbnail URL<\/span>\s*<input class="input" type="text" id="edit-cli-thumb" value="\$\{thumbVal\}">\s*<\/div>/g;

const newHTML = `<div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Thumbnail URL</span>
            <input class="input" type="text" id="edit-cli-thumb-input" value="\${thumbVal}" placeholder="https://..." style="margin-bottom:8px;">
            <div id="edit-cli-dropzone" 
                 style="border:2px dashed var(--border-default); border-radius:var(--r-lg); padding:32px; text-align:center; cursor:pointer; font-size:12px; color:var(--text-secondary);"
                 onclick="document.getElementById('edit-cli-file-input').click()"
                 ondragover="event.preventDefault(); this.style.background='var(--bg-3)';"
                 ondragleave="this.style.background='';"
                 ondrop="event.preventDefault(); this.style.background=''; PAGE_CLIENTREFS.handleThumbDropEdit(event);">
              <div>📁 Drag & Drop image file here, paste from clipboard, or click to browse</div>
              <input type="file" id="edit-cli-file-input" accept="image/*" style="display:none" onchange="PAGE_CLIENTREFS.handleThumbSelectEdit(event)">
            </div>
            <div id="edit-cli-thumb-preview-wrap" style="margin-top:12px; height: 160px; border-radius: var(--r-md); overflow: hidden; display: \${thumbVal ? 'block' : 'none'}">
              \${thumbVal ? \`<img src="\${thumbVal}" style="width:100%; height:100%; object-fit:cover">\` : ''}
            </div>
          </div>`;

if (regex.test(code)) {
  code = code.replace(regex, newHTML);
  
  // also add onpaste to the body div
  const bodyRegex = /<div style="display:flex; flex-direction:column; gap:14px;">/g;
  code = code.replace(bodyRegex, `<div style="display:flex; flex-direction:column; gap:14px;" onpaste="PAGE_CLIENTREFS.handleThumbPasteEdit(event)">`);

  fs.writeFileSync('js/pages/clientrefs.js', code);
  console.log('Successfully patched HTML');
} else {
  console.log('Regex did not match HTML');
}
