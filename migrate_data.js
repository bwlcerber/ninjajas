const fs = require('fs');

// We will read the file and evaluate it to get the object
const dataContent = fs.readFileSync('js/data.js', 'utf8');

// Mock window to capture PORTAL_DATA
const window = {};
eval(dataContent);

const materials = window.PORTAL_DATA.materials;

// This is the current categorization logic from reports.js
function getNewAssetType(m) {
  // Only process files that were previously in Client Files (not case, branding, creative, video, image)
  // Wait, the user said "trade app bingo video" showed up. It shouldn't be in Client Files at all! 
  // Let's only migrate those that are meant to be in reports, but wait, the video might have been there because of a bug.
  // Actually, let's just map everything to its best category.
  
  if (['case', 'branding', 'creative', 'video', 'image'].includes(m.asset_type)) {
    return m.asset_type; // Leave them alone, they belong to other pages
  }

  const services = m.services_provided || [];
  const tags = m.tags || [];

  if (services.includes('Influencer Marketing') || tags.includes('influencer')) {
    // If it's a contract or profile, the user complained it shouldn't be here. 
    // Wait, the user said: "Inside the influencer marketing tab... I have SMM profiles. I have a contract, and I have a trade app bingo video here. This isn't right."
    // So if it's a contract, it belongs to "other-files". If it's SMM profiles, it belongs to "smm-profiles".
    if (m.asset_type === 'smm-profiles' || m.asset_type === 'social-media-link' || m.asset_type === 'social-media-profile') return 'smm-profiles';
    if (m.asset_type === 'contract') return 'other-files';
    return 'influencer-marketing';
  }
  
  if (services.includes('SEO')) return 'seo-geo';
  
  if (m.asset_type === 'smm-profiles' || m.asset_type === 'social-media-link' || m.asset_type === 'social-media-profile') return 'smm-profiles';
  
  if (m.asset_type === 'gtm' || tags.includes('gtm')) return 'gtms';
  
  if (services.includes('PR') || tags.includes('pr')) return 'pr-demos';
  
  if (m.asset_type === 'report') return 'performance-marketing';
  if (m.asset_type === 'media-plan') return 'ppc-media-plans';
  
  return 'other-files';
}

let updatedCount = 0;
for (const m of materials) {
  if (!['case', 'branding', 'creative', 'video', 'image'].includes(m.asset_type)) {
    const old = m.asset_type;
    const newType = getNewAssetType(m);
    if (old !== newType) {
      m.asset_type = newType;
      updatedCount++;
    }
  }
}

// Now we need to convert window.PORTAL_DATA back to the JS string format.
const newDataStr = `window.PORTAL_DATA = ${JSON.stringify(window.PORTAL_DATA, null, 2)};`;
fs.writeFileSync('js/data.js', newDataStr);

console.log(`Migrated ${updatedCount} items to new asset types.`);
