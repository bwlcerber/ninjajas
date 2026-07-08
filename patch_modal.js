const fs = require('fs');
let code = fs.readFileSync('js/pages/calllibrary1.js', 'utf8');

// Replace openRelatedModal function
const modalJs = `
  function closeRelatedModal() {
    const m = document.getElementById('cl1-related-modal');
    if (m) m.remove();
  }

  function openRelatedModal(id) {
    const calls = getCalls();
    const call = calls.find(c => c.id === id);
    if (!call) return;

    // Build related items
    const relatedHtml = \`
      <div class="cl1-related-item">
        <div class="cl1-pill-internal" style="margin:0; padding:2px 8px;">DISCOVERY</div>
        <div class="cl1-related-details">
          <div class="cl1-related-title">Same prospect — discovery call</div>
          <div class="cl1-meta-text">\${call.salesperson} • 2024-06-29</div>
        </div>
        <a href="#" class="cl1-btn-watch" onclick="event.preventDefault()">Watch ↗</a>
      </div>
      <div class="cl1-related-item">
        <div class="cl1-pill-internal" style="margin:0; padding:2px 8px; color:var(--v0-brand-secondary); border-color:color-mix(in srgb, var(--v0-brand-secondary) 30%, transparent); background:color-mix(in srgb, var(--v0-brand-secondary) 15%, transparent);">PROPOSAL</div>
        <div class="cl1-related-details">
          <div class="cl1-related-title">Same prospect — proposal review</div>
          <div class="cl1-meta-text">\${call.salesperson} • 2024-07-05</div>
        </div>
        <a href="#" class="cl1-btn-watch" onclick="event.preventDefault()">Watch ↗</a>
      </div>
    \`;

    const subtitle = call.category === 'Closed Won Deals' ? 
      \`Assets connected to \${call.salesperson}'s won deal\` : 
      \`Assets connected to this call\`;

    const html = \`
      <div id="cl1-related-modal" class="cl1-modal-backdrop" onclick="if(event.target === this) PAGE_CALLLIBRARY1.closeRelatedModal()">
        <div class="cl1-modal-content">
          <button class="cl1-modal-close" onclick="PAGE_CALLLIBRARY1.closeRelatedModal()">✕</button>
          <h2 class="cl1-modal-title">Related Calls</h2>
          <p class="cl1-modal-subtitle">\${subtitle}</p>
          <div class="cl1-related-list">
            \${relatedHtml}
          </div>
        </div>
      </div>
    \`;

    document.body.insertAdjacentHTML('beforeend', html);
  }
`;

code = code.replace(/function openRelatedModal\(id\) \{[\s\S]*?\}/, modalJs.trim());
code = code.replace(/return \{/, 'return {\n    closeRelatedModal,');

// Add modal CSS
const modalCss = `
        /* Modal */
        .cl1-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .cl1-modal-content {
          background-color: var(--v0-card);
          border: 1px solid var(--v0-border);
          border-radius: var(--r-lg);
          width: 100%; max-width: 600px;
          padding: 32px; position: relative;
          color: var(--v0-foreground);
        }
        .cl1-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 50%;
          background: transparent; border: 1px solid var(--v0-border);
          color: var(--v0-muted-foreground); cursor: pointer;
          display: grid; place-items: center; font-size: 14px;
        }
        .cl1-modal-close:hover { color: var(--v0-foreground); background: var(--v0-muted); }
        .cl1-modal-title { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; }
        .cl1-modal-subtitle { font-size: 14px; color: var(--v0-muted-foreground); margin: 0 0 24px 0; }
        
        .cl1-related-list { display: flex; flex-direction: column; gap: 12px; }
        .cl1-related-item {
          display: flex; align-items: center; gap: 16px;
          background-color: color-mix(in srgb, var(--v0-muted) 30%, transparent);
          border-radius: var(--r-md); padding: 16px;
        }
        .cl1-related-details { flex: 1; }
        .cl1-related-title { font-size: 14px; font-weight: 700; color: var(--v0-foreground); margin-bottom: 4px; }
        .cl1-btn-watch {
          background-color: var(--v0-muted); border: none; border-radius: var(--r-md);
          color: var(--v0-foreground); padding: 8px 16px; font-size: 12px; font-weight: 700;
          text-decoration: none; transition: background 150ms;
        }
        .cl1-btn-watch:hover { background-color: color-mix(in srgb, var(--v0-muted) 70%, transparent); }
`;
code = code.replace(/<\/style>/, modalCss.trim() + '\n      </style>');

fs.writeFileSync('js/pages/calllibrary1.js', code);
console.log('Patched modal successfully');
