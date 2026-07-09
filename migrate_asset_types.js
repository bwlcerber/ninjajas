const fs = require('fs');
let code = fs.readFileSync('js/data.js', 'utf8');

const startIndex = code.indexOf('window.MOCK_REPORTS');
const endIndex = code.indexOf('window.MOCK_CASES');

if (startIndex > -1 && endIndex > -1) {
  let reportsBlock = code.substring(startIndex, endIndex);

  // Mappings
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"report"/g, '"asset_type": "performance-marketing"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"media-plan"/g, '"asset_type": "ppc-media-plans"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"gtm"/g, '"asset_type": "gtms"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"deck"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"contract"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"template"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"process-doc"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"pdf"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"doc-link"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"spreadsheet-link"/g, '"asset_type": "other-files"');
  reportsBlock = reportsBlock.replace(/"asset_type":\s*"offer-prep"/g, '"asset_type": "other-files"');

  code = code.substring(0, startIndex) + reportsBlock + code.substring(endIndex);
  fs.writeFileSync('js/data.js', code);
  console.log('MOCK_REPORTS data updated in js/data.js');
} else {
  console.log('Could not find MOCK_REPORTS bounds.');
}
