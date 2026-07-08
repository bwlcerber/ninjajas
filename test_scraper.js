const fs = require('fs');
const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const cases = [
    'paypolitan',
    'bullperks',
    'polkadot',
    'fantompowa'
  ];

  for (const c of cases) {
    try {
      const text = await fetchPage('https://ninjapromo.io/our-cases/' + c);
      const matches = [...text.matchAll(/class="casewh-top__category-item"[^>]*>([^<]+)<\/div>/g)].map(m => m[1]);
      console.log(c, 'tags:', matches);
    } catch (e) {
      console.log(c, 'error', e.message);
    }
  }
}

run();
