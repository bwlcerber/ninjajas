const fs = require('fs');
const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let newUrl = res.headers.location;
        if (!newUrl.startsWith('http')) {
          newUrl = new URL(newUrl, url).href;
        }
        return fetchPage(newUrl).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ text: data, status: res.statusCode }));
    }).on('error', reject);
  });
}

async function run() {
  let js = fs.readFileSync('js/data.js', 'utf8');
  let jsonStr = js.replace('window.PORTAL_DATA = ', '').trim();
  if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
  const data = JSON.parse(jsonStr);
  
  const vMap = {};
  data.VERTICALS.forEach(v => vMap[v.toLowerCase()] = v);
  const sMap = {};
  data.SERVICES.forEach(s => sMap[s.toLowerCase()] = s);
  
  // Also map common variations
  sMap['digital design'] = 'Web & LP Design';
  sMap['strategic public relations'] = 'PR';
  sMap['paid advertising'] = 'PPC';
  sMap['content marketing'] = 'Content';
  sMap['strategy & consulting'] = 'Branding';
  sMap['data & analytics'] = 'Analytics';
  sMap['community management'] = 'Social Media';
  sMap['b2b lead generation'] = 'SEO';
  sMap['search engine optimization'] = 'SEO';
  sMap['email marketing & automation'] = 'Email Marketing';
  sMap['conversion rate optimization'] = 'Analytics'; // CRO is close to Analytics
  sMap['development'] = 'Web & LP Design'; // Close enough
  sMap['video production'] = 'Content'; // Close enough
  
  vMap['crypto'] = 'Web3';
  vMap['defi'] = 'Web3';
  vMap['nft'] = 'Web3';
  vMap['forex'] = 'Trading';
  vMap['it & software'] = 'SaaS'; // closest
  vMap['ecommerce'] = 'eCommerce';
  
  let updatedCount = 0;

  for (let i = 0; i < data.materials.length; i++) {
    const m = data.materials[i];
    if (m.asset_type === 'case' && m.file_url && m.file_url.includes('ninjapromo.io/our-cases/')) {
      try {
        const { text, status } = await fetchPage(m.file_url);
        if (status !== 200) {
          continue;
        }
        
        // Find tags
        const matches = [...text.matchAll(/class="casewh-top__category-item"[^>]*>([^<]+)<\/div>/g)].map(x => x[1].trim());
        if (matches.length > 0) {
          
          let newVerticals = new Set(m.verticals || (m.vertical ? [m.vertical] : []));
          let newServices = new Set(m.services_provided || []);
          
          for (let tag of matches) {
            tag = tag.replace(/&amp;/g, '&');
            const lowerTag = tag.toLowerCase();
            
            if (vMap[lowerTag]) {
              newVerticals.add(vMap[lowerTag]);
            } else if (sMap[lowerTag]) {
              newServices.add(sMap[lowerTag]);
            }
          }
          
          const vArr = Array.from(newVerticals);
          const sArr = Array.from(newServices);
          
          if (vArr.length > 0) m.verticals = vArr;
          if (m.vertical && vArr.length > 0 && !vArr.includes(m.vertical)) {
              m.vertical = vArr[0];
          } else if (!m.vertical && vArr.length > 0) {
              m.vertical = vArr[0];
          }
          if (sArr.length > 0) m.services_provided = sArr;
          
          updatedCount++;
        }
      } catch (e) {
      }
    }
  }
  
  console.log(`\nUpdated ${updatedCount} cases with comprehensive mapping.`);
  
  const outStr = 'window.PORTAL_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  fs.writeFileSync('js/data.js', outStr);
  console.log('Saved js/data.js');
}

run();
