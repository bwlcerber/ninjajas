const fs = require('fs');

// 1. Update data.js
let dataJs = fs.readFileSync('js/data.js', 'utf8');
const oldAssetTypesRegex = /"ASSET_TYPES":\s*\[[\s\S]*?\],/;
const newAssetTypes = `"ASSET_TYPES": [
    "case-study",
    "creatives",
    "performance-marketing",
    "influencer-marketing",
    "seo-geo",
    "ppc-media-plans",
    "smm-profiles",
    "gtms",
    "pr-demos",
    "others"
  ],`;
dataJs = dataJs.replace(oldAssetTypesRegex, newAssetTypes);
fs.writeFileSync('js/data.js', dataJs);
console.log('Updated ASSET_TYPES in data.js');

// 2. Update utils.js (assetTypeLabel)
let utilsJs = fs.readFileSync('js/utils.js', 'utf8');
const oldLabelRegex = /function assetTypeLabel\(type\) {[\s\S]*?return map\[type\] \|\| type;\n}/;
const newLabelFunc = `function assetTypeLabel(type) {
  const map = {
    'case-study': 'Case Study',
    'creatives': 'Creatives',
    'performance-marketing': 'Performance Marketing',
    'influencer-marketing': 'Influencer Marketing',
    'seo-geo': 'SEO/GEO',
    'ppc-media-plans': 'PPC Media Plans',
    'smm-profiles': 'SMM Profiles',
    'gtms': 'GTMs',
    'pr-demos': 'PR Demos',
    'others': 'Others'
  };
  return map[type] || type;
}`;
utilsJs = utilsJs.replace(oldLabelRegex, newLabelFunc);
fs.writeFileSync('js/utils.js', utilsJs);
console.log('Updated assetTypeLabel in utils.js');

// 3. Update store.js (migration mapping)
let storeJs = fs.readFileSync('js/store.js', 'utf8');
const oldMigrationLogicRegex = /\/\/ 3\. Migrate old Asset Types to new clean ones[\s\S]*?\}\s*\}\s*\}\s*\n/;
const newMigrationLogic = `// 3. Migrate old Asset Types to new clean ones
          if (item.asset_type && typeof item.asset_type === 'string') {
            const oldType = item.asset_type.toLowerCase();
            const typeMap = {
              'report': 'performance-marketing',
              'performance-report': 'performance-marketing',
              'analytics': 'performance-marketing',
              'case': 'case-study',
              'case-study': 'case-study',
              'creative': 'creatives',
              'creative-asset': 'creatives',
              'image': 'creatives',
              'video': 'creatives',
              'branding': 'creatives',
              'design-branding': 'creatives',
              'deck': 'creatives',
              'media-plan': 'ppc-media-plans',
              'media-plan-strategy': 'ppc-media-plans',
              'contract': 'others',
              'process-doc': 'others',
              'training': 'others',
              'offer-prep': 'others',
              'template': 'others',
              'internal-process': 'others',
              'legal-admin': 'others',
              'social-media-link': 'smm-profiles',
              'social-media-profile': 'smm-profiles',
              'smm': 'smm-profiles',
              'pdf': 'others',
              'spreadsheet-link': 'others',
              'doc-link': 'others'
            };
            if (typeMap[oldType]) {
              item.asset_type = typeMap[oldType];
              modified = true;
            } else if (!Object.values(typeMap).includes(oldType) && oldType !== 'others' && oldType !== 'seo-geo' && oldType !== 'influencer-marketing' && oldType !== 'gtms' && oldType !== 'pr-demos') {
              item.asset_type = 'others';
              modified = true;
            }
          }
        }
      });
`;
storeJs = storeJs.replace(oldMigrationLogicRegex, newMigrationLogic);
fs.writeFileSync('js/store.js', storeJs);
console.log('Updated store.js migration mapping');
