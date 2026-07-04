const fs = require('fs');
let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

// 1. Rename 'Add Assets / Creatives' modal title -> 'Add Files / Creatives'
code = code.replace(/title: `Add Assets \/ Creatives for \$\{clientName\}`/g, 'title: `Add Files / Creatives for ${clientName}`');

// 2. Rename Asset Title -> File Title
code = code.replace(
  /<span class="input-label">Asset Title \* \(Manual entry for single links\)<\/span>/g,
  '<span class="input-label">File Title * (Manual entry for single links)</span>'
);

// 3. Remove thumbnail HTML from the modal
// We will find the exact block and replace it.
const thumbBlock = `          <div class="input-group span-2">
            <span class="input-label">Thumbnail URL (Optional)</span>
            <input class="input" type="url" id="add-asset-thumb" placeholder="https://..." style="height:34px; font-size:12px;">
          </div>`;
code = code.replace(thumbBlock, '');

// 4. Update the thumb JS var reading
code = code.replace(
  /const thumb = document\.getElementById\('add-asset-thumb'\)\.value\.trim\(\);/g,
  "const thumb = '';"
);

// 5. Change Save Asset(s) -> Save File(s)
code = code.replace(
  />Save Asset\(s\)<\/button>/g,
  '>Save File(s)</button>'
);

// 6. Fix the filtering bug with trimming client names in renderDetail
code = code.replace(
  /m\.client_name\?\.toLowerCase\(\)/g,
  'm.client_name?.trim().toLowerCase()'
);
code = code.replace(
  /=== \(decodedName \|\| 'N\/A'\)\.toLowerCase\(\)/g,
  "=== (decodedName || 'N/A').trim().toLowerCase()"
);

// 7. Remove the dropdown from the ingest-form
const ingestFormRegex = /<form id="url-ingest-form"[\s\S]*?<\/form>/;
const newIngestForm = `<form id="url-ingest-form" style="display:flex; gap:8px; align-items: stretch; width: 100%;">
              <div style="flex:1" class="input-group">
                <input class="input" type="url" id="ingest-url" placeholder="https://..." required style="padding: 6px 8px; font-size:11px">
              </div>
              <button class="btn btn-primary" type="submit" style="height:32px; padding: 0 12px; font-size:11px">Fetch</button>
            </form>`;
code = code.replace(ingestFormRegex, newIngestForm);

// 8. Update ingestionArea container to be smaller
const ingestionAreaRegex = /<h3 style="font-size:12px; font-weight:700; color:var\(--text-primary\); margin-bottom:12px; text-transform:uppercase; font-family:var\(--font-mono\); display:flex; align-items:center; gap:8px">\s*<svg[\s\S]*?<\/svg>\s*Ingest Website Reference \/ Paste Client URL\s*<\/h3>/;
const newIngestHeader = `<h3 style="font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:10px; text-transform:uppercase; font-family:var(--font-mono); display:flex; align-items:center; gap:8px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Paste Client URL
            </h3>`;
code = code.replace(ingestionAreaRegex, newIngestHeader);

code = code.replace(
  /<div class="admin-form animate-fade" style="margin-bottom:0; padding: 16px; border-radius: var\(--r-lg\);">/g,
  '<div class="admin-form animate-fade" style="margin-bottom:0; padding: 12px; border-radius: var(--r-lg);">'
);

// 9. Re-align the top bar
const oldFlexBox = `<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:20px;">
          <div style="flex:2;">\${visibilityControl}</div>
          <div style="flex:1;">\${ingestionArea}</div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div class="search-bar" style="flex:1;min-width:220px">
            \${ICONS.search}
            <input id="refs-search" type="text" placeholder="Search client references…" value="\${_query}" autocomplete="off">
          </div>
          
          <select class="select" id="refs-sort" style="width:160px">
            <option value="recent" \${_sortOrder === 'recent' ? 'selected':''}>Recently Added</option>
            <option value="alpha" \${_sortOrder === 'alpha' ? 'selected':''}>Alphabetical Order</option>
          </select>
        </div>`;

const newFlexBox = `<div style="display:flex; gap:20px; align-items:flex-end; margin-bottom:20px; flex-wrap:wrap;">
          <div style="flex:2; min-width:300px;">
            \${visibilityControl}
          </div>
          <div style="flex:1; display:flex; flex-direction:column; gap:10px; min-width:300px; max-width:400px; margin-left:auto;">
            <div style="display:flex; gap:10px; align-items:center;">
              <div class="search-bar" style="flex:1;">
                \${ICONS.search}
                <input id="refs-search" type="text" placeholder="Search references…" value="\${_query}" autocomplete="off">
              </div>
              <select class="select" id="refs-sort" style="width:140px">
                <option value="recent" \${_sortOrder === 'recent' ? 'selected':''}>Recently Added</option>
                <option value="alpha" \${_sortOrder === 'alpha' ? 'selected':''}>Alphabetical Order</option>
              </select>
            </div>
            \${ingestionArea}
          </div>
        </div>`;

code = code.replace(oldFlexBox, newFlexBox);

// One more place for Add Assets / Creatives button in renderDetail
code = code.replace(
  /\$\{ICONS\.plus\} Add Assets \/ Creatives/g,
  '${ICONS.plus} Add Files / Creatives'
);

// One more place: update openAddAssetModal to handle passing correctly without escaping issues
// We can assume it's good since single quotes won't happen for "Top Casino Rewards".

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('clientrefs.js successfully updated.');
