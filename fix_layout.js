const fs = require('fs');

let code = fs.readFileSync('js/pages/clientrefs.js', 'utf8');

// Replace tag-service with tag-info
code = code.replace(/tag-service/g, 'tag-info');

// Refactor layout structure to pin tags and buttons perfectly to the bottom
const oldStructure = `<div class="ref-services" style="margin-top: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
            <div class="vertical-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
              \${verticalTag}
            </div>
            <div class="services-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
              \${serviceTags}
            </div>
          </div>
          
          <div class="ref-actions" onclick="event.stopPropagation()">`;

const newStructure = `<div style="margin-top: auto; display: flex; flex-direction: column; gap: 16px;">
            <div class="ref-services" style="margin-bottom: 0; display: flex; flex-direction: column; gap: 6px;">
              <div class="vertical-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
                \${verticalTag}
              </div>
              <div class="services-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
                \${serviceTags}
              </div>
            </div>
            
            <div class="ref-actions" onclick="event.stopPropagation()" style="margin-top: 0 !important;">`;

code = code.replace(oldStructure, newStructure);

// Find the end of ref-actions to close the wrapper div
const oldActionsEnd = `          </div>
        </div>
      </div>\`;`;

const newActionsEnd = `          </div>
          </div>
        </div>
      </div>\`;`;

code = code.replace(oldActionsEnd, newActionsEnd);

fs.writeFileSync('js/pages/clientrefs.js', code);
console.log('Fixed layout and restored tags');
