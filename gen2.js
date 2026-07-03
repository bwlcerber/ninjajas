const fs = require('fs');
const urls = [
'https://www.behance.net/gallery/188685875/Calpal-Branding',
'https://www.behance.net/gallery/215780749/Lush-Stonez-UXUI-Design',
'https://www.behance.net/gallery/222344063/AI-powered-Branding-Platform-UXUI-Design',
'https://www.behance.net/gallery/217984953/Express-Assignments-UXUI-Design',
'https://www.behance.net/gallery/226748911/Zupa-Branding-Website-Design',
'https://www.behance.net/gallery/238727761/Falco-UXUI-Branding',
'https://www.behance.net/gallery/240887375/DentiAI-UXUI-Branding',
'https://www.behance.net/gallery/194914601/Dark-Fusion-Website-Design',
'https://www.behance.net/gallery/216817595/Multi-Ai-Platform',
'https://www.behance.net/gallery/220096575/Swipetask-Web-Design',
'https://www.behance.net/gallery/196992887/Amazon-Business-Website',
'https://www.behance.net/gallery/243807315/Swidg-Carpool-Platform-UXUI-Design',
'https://www.behance.net/gallery/248194161/CLOSENSE-Branding-UXUI',
'https://www.behance.net/gallery/248520417/XBNK-Branding-UXUI-Design'
];

let data = fs.readFileSync('js/data.js', 'utf8');
let items = '';
// Start ID from mat-b033 since we stopped at mat-b032 last time
urls.forEach((u, i) => {
  let title = u.split('/').pop().replace(/-/g, ' ');
  let cname = title.split(' ')[0];
  items += `  {
    id: 'mat-b${(i+33).toString().padStart(3, '0')}',
    title: '${title}',
    client_name: '${cname}',
    geo: 'Global',
    vertical: 'Technology',
    verticals: ['Technology'],
    services_provided: ['Branding', 'Design'],
    asset_type: 'branding',
    visibility_status: 'public',
    description: '${title}',
    file_type: 'doc-link',
    file_url: '${u}',
    thumbnail_url: '',
    tags: ['branding', 'design'],
    related_assets: [],
    created_at: '2025-10-01'
  },
`;
});

// We want to insert these items right before "  // ── REPORTS ──"
const regex = /(  \/\/ ── REPORTS ──)/;
data = data.replace(regex, items + '$1');
fs.writeFileSync('js/data.js', data);
