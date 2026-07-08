const fs = require('fs');
let code = fs.readFileSync('js/pages/calllibrary1.js', 'utf8');

// 1. Border radius update
code = code.replace(/border-radius: 16px;/g, 'border-radius: var(--r-md);');

// 2. Add rule animation
const ruleAnimation = `
        @keyframes cl1-glow-pulse {
          0% { opacity: 1; transform: scaleX(1); }
          50% { opacity: 0.1; transform: scaleX(0.7); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .cl1-section-rule {
          height: 1px;
          flex: 1;
          transform-origin: left;
          animation: cl1-glow-pulse 3s ease-in-out infinite;
        }
`;
code = code.replace(/\.cl1-section-rule\s*\{[\s\S]*?\}/, ruleAnimation.trim());

// 3. Update Objections Grid class
code = code.replace(/<div class="cl1-grid">([\s\S]*?filteredObjections\.map)/, '<div class="cl1-grid cl1-grid-objections">$1');

const gridCss = `
        /* Grid */
        .cl1-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .cl1-grid { grid-template-columns: repeat(2, 1fr); }
          .cl1-grid.cl1-grid-objections { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .cl1-grid { grid-template-columns: repeat(3, 1fr); }
          .cl1-grid.cl1-grid-objections { grid-template-columns: repeat(6, 1fr); }
        }
`;
code = code.replace(/\/\*\s*Grid\s*\*\/[\s\S]*?@media\s*\(min-width:\s*1024px\)\s*\{[\s\S]*?\}/, gridCss.trim());

// 4. Update Closed Won Card HTML
const wonHtml = `
              <div class="cl1-card">
                <div class="cl1-thumb" style="background: \${c.thumbnail || 'linear-gradient(135deg, #333, #111)'}">
                  <div class="cl1-thumb-overlay">
                    <div class="cl1-thumb-top" style="justify-content: flex-end;">
                      <span class="cl1-pill-success">WON</span>
                    </div>
                    <div class="cl1-play-btn">▶</div>
                  </div>
                </div>
                <div class="cl1-card-body">
                  <div class="cl1-card-meta">
                    <span class="cl1-meta-text"><strong>\${c.salesperson}</strong><br/>\${c.created_at}</span>
                  </div>
                  <div class="cl1-tags">
                    \${c.industries ? c.industries.map(i => \`<span class="cl1-tag">\${i}</span>\`).join('') : ''}
                    \${c.deal_size ? \`<span class="cl1-tag">\${c.deal_size}</span>\` : ''}
                  </div>
                  <div class="cl1-actions">
                    <a href="\${c.main_link}" target="_blank" rel="noreferrer" class="cl1-btn-fathom">Watch on Fathom</a>
                    <button class="cl1-btn-related" onclick="PAGE_CALLLIBRARY1.openRelatedModal('\${c.id}')">Related</button>
                  </div>
                </div>
              </div>
`;
code = code.replace(/<div class="cl1-card">[\s\S]*?<\/div>\s*`\)\.join\(''\)/, wonHtml.trim() + '\n            `).join(\'\')');

// 5. Update Objection Handling Card HTML
const objHtml = `
              <div class="cl1-card objection">
                <div class="cl1-card-body">
                  <div class="cl1-obj-top">
                    <span class="cl1-pill-obj">\${c.objection_type}</span>
                    <span class="cl1-pill-time">⏱ \${c.timing || '00:00'}</span>
                  </div>
                  <h3 class="cl1-card-title" style="font-size: 14px; margin-bottom: 8px;">\${c.title || c.summary || c.objection_type}</h3>
                  <div class="cl1-card-meta" style="margin-top:auto; padding-top:8px;">
                    <span class="cl1-meta-text"><strong>\${c.salesperson}</strong><br/>\${c.created_at}</span>
                  </div>
                  <div style="margin-top:16px;">
                    <a href="\${c.main_link}" target="_blank" rel="noreferrer" class="cl1-btn-obj-fathom">Watch on Fathom</a>
                  </div>
                </div>
              </div>
`;
code = code.replace(/<div class="cl1-card objection">[\s\S]*?<\/div>\s*`\)\.join\(''\)/, objHtml.trim() + '\n            `).join(\'\')');

fs.writeFileSync('js/pages/calllibrary1.js', code);
console.log('Patched calllibrary1.js successfully');
