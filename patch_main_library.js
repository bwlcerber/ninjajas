const fs = require('fs');
let code = fs.readFileSync('js/pages/calllibrary.js', 'utf8');

// 1. Inject CSS for glowing headers & buttons into the container
const styleInjection = `
      <style>
        .cl-section-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
        }
        .cl-section-title {
          text-transform: uppercase; font-size: 20px; font-weight: 700; margin: 0; font-family: var(--font-ui); color: var(--text-primary);
        }
        .cl-section-count {
          font-family: var(--font-mono); text-transform: uppercase; color: var(--text-secondary); font-size: 10px;
        }
        @keyframes cl-glow-pulse {
          0% { opacity: 1; transform: scaleX(1); }
          50% { opacity: 0.1; transform: scaleX(0.7); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .cl-section-rule {
          height: 1px; flex: 1; transform-origin: left;
          animation: cl-glow-pulse 3s ease-in-out infinite;
        }
        .cl-rule-purple { background: linear-gradient(to right, color-mix(in srgb, #7c3aed 50%, transparent), transparent); }
        .cl-rule-pink { background: linear-gradient(to right, color-mix(in srgb, #db2777 50%, transparent), transparent); }
        
        .btn-purple {
          background-color: #7c3aed !important; color: #fff !important; border: none !important; transition: opacity 150ms ease;
        }
        .btn-purple:hover { opacity: 0.9 !important; }
        .btn-pink {
          background-color: #db2777 !important; color: #fff !important; border: none !important; transition: opacity 150ms ease;
        }
        .btn-pink:hover { opacity: 0.9 !important; }
      </style>
`;
if (!code.includes('cl-section-header')) {
  code = code.replace(/<div class="call-library-container"/, styleInjection.trim() + '\n      <div class="call-library-container"');
}

// 2. Replace Closed Won header
const wonHeaderOld = '<div style="font-family:var(--font-mono); font-size:11px; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em;">CLOSED WON DEALS</div>';
const wonHeaderNew = `
          <div class="cl-section-header">
            <h2 class="cl-section-title">Closed Won Deals</h2>
            <span class="cl-section-count">\${filteredClosedWon.length} records</span>
            <div class="cl-section-rule cl-rule-purple"></div>
          </div>
`;
code = code.replace(wonHeaderOld, wonHeaderNew.trim());

// 3. Replace Objection Handling header
const objHeaderOld = '<div style="font-family:var(--font-mono); font-size:11px; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em;">OBJECTION HANDLING</div>';
const objHeaderNew = `
          <div class="cl-section-header">
            <h2 class="cl-section-title">Objection Handling</h2>
            <span class="cl-section-count">\${filteredObjections.length} records</span>
            <div class="cl-section-rule cl-rule-pink"></div>
          </div>
`;
code = code.replace(objHeaderOld, objHeaderNew.trim());

// 4. Update font-family for cards to var(--font-ui)
// In renderCallCard:
code = code.replace(/<div class="card call-record-card" style="/g, '<div class="card call-record-card" style="font-family: var(--font-ui); ');

// 5. Update buttons inside renderCallCard to use the purple/pink classes but keep original rounded corners (var(--r-md))
// Original button: <button class="btn btn-sm btn-secondary" onclick="PAGE_CALLLIBRARY.openMoreAssets('${c.id}')" style="width:100%; justify-content:center; border: 1px solid var(--accent); color: var(--accent); font-weight: 600;">
// Let's replace the whole footer
const footerRegex = /<!-- Footer -->\s*<div style="padding:12px 16px; background:var\(--bg-3\); border-top:1px solid var\(--border-top\); display:flex; justify-content:flex-end;">\s*<button class="btn btn-sm btn-secondary" onclick="PAGE_CALLLIBRARY\.openMoreAssets\('\$\{c\.id\}'\)" style="width:100%; justify-content:center; border: 1px solid var\(--accent\); color: var\(--accent\); font-weight: 600;">\s*Related Calls\s*<\/button>\s*<\/div>/;

const newFooter = `
        <!-- Footer -->
        <div style="padding:12px 16px; background:var(--bg-3); border-top:1px solid var(--border-top); display:flex; flex-direction:column; gap:8px;">
          <button class="btn btn-sm \${c.category === 'Objection Handling' ? 'btn-pink' : 'btn-purple'}" onclick="window.open('\${c.main_link}', '_blank')" style="width:100%; justify-content:center; border-radius:var(--r-md); font-weight: 600;">
            Watch on Fathom
          </button>
          \${c.category === 'Closed Won Deals' ? \`
            <button class="btn btn-sm btn-secondary" onclick="PAGE_CALLLIBRARY.openMoreAssets('\${c.id}')" style="width:100%; justify-content:center; border-radius:var(--r-md); border: 1px solid var(--border-default); color: var(--text-primary); font-weight: 600;">
              Related Calls
            </button>
          \` : ''}
        </div>
`;

code = code.replace(footerRegex, newFooter.trim());

// Also update the anchor tag inside the body to be less prominent if they now have a button, but I'll leave the anchor there for now just in case.

fs.writeFileSync('js/pages/calllibrary.js', code);
console.log('Main page calllibrary.js updated.');
