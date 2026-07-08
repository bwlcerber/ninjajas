const fs = require('fs');

const replacement = `
  function getCalls() {
    let serverCalls = [];
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'data.php?type=calls&t=' + Date.now(), false);
      xhr.send();
      if (xhr.status === 200) {
        const parsed = JSON.parse(xhr.responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          serverCalls = parsed;
        }
      }
    } catch (e) {}

    let localCalls = [];
    try {
      const raw = localStorage.getItem('np_call_library');
      if (raw) localCalls = JSON.parse(raw);
    } catch (e) {}

    if (serverCalls.length > 0) {
      if (serverCalls.length > localCalls.length) {
          localStorage.setItem('np_call_library', JSON.stringify(serverCalls));
      }
      return serverCalls;
    }

    if (localCalls.length > 0) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'data.php?type=calls', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(localCalls));
      } catch (e) {}
      return localCalls;
    }

    const seed = [
      {
        id: 'call-001',
        category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-fintech-480h',
        followup_link: 'https://fathom.video/share/won-fintech-followup',
        prospect_link: 'https://fathom.video/share/won-fintech-presales',
        deal_size: '480 hours',
        industries: ['Fintech', 'SaaS'],
        salesperson: 'Julia',
        created_at: '2026-05-12'
      },
      {
        id: 'call-002',
        category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-igaming-commission',
        followup_link: '',
        prospect_link: 'https://fathom.video/share/won-igaming-presales',
        deal_size: 'commission',
        industries: ['iGaming', 'Sports Betting'],
        salesperson: 'Max',
        created_at: '2026-06-01'
      },
      {
        id: 'call-003',
        category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-price-demo',
        deal_size: '120 hours',
        industries: ['SaaS'],
        salesperson: 'Alex',
        objection_type: 'Budget / Price',
        created_at: '2026-06-15'
      },
      {
        id: 'call-004',
        category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-trust-cold',
        deal_size: 'commission',
        industries: ['Web3'],
        salesperson: 'Damon',
        objection_type: 'Trust and Authority',
        created_at: '2026-06-20'
      }
    ];
    localStorage.setItem('np_call_library', JSON.stringify(seed));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php?type=calls', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(seed));
    } catch (e) {}
    return seed;
  }

  function saveCall(call) {
    const calls = getCalls();
    calls.push(call);
    localStorage.setItem('np_call_library', JSON.stringify(calls));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php?type=calls', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(calls));
    } catch (e) {}
  }`;

const files = [
  'js/pages/calllibrary.js',
  'js/pages/calllibrary1.js',
  'js/pages/calllibrary2.js',
  'js/pages/calllibrary3.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\s*function getCalls\(\) \{[\s\S]*?function saveCall\(call\) \{[\s\S]*?localStorage\.setItem\('np_call_library', JSON\.stringify\(calls\)\);\n  \}/m, replacement);
  fs.writeFileSync(f, content);
});
console.log('Replaced successfully');
