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
  const js = fs.readFileSync('js/data.js', 'utf8');
  const casesMatch = [...js.matchAll(/\"file_url\":\s*\"(https:\/\/ninjapromo\.io\/our-cases\/[^\"]+)\"/g)];
  const urls = casesMatch.map(m => m[1]);
  console.log('Total case URLs:', urls.length);
  
  const sample = urls.slice(0, 5);
  for (const url of sample) {
    try {
      const text = await fetchPage(url);
      const matches = [...text.matchAll(/class="casewh-top__category-item"[^>]*>([^<]+)<\/div>/g)].map(m => m[1]);
      console.log(url, 'tags:', matches);
      
      const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
      console.log('  title:', titleMatch ? titleMatch[1] : 'no title');
    } catch (e) {
      console.log(url, 'error', e.message);
    }
  }
}
run();
