const urls = [
'https://www.behance.net/gallery/146949557/TopFund-Crypto-Brand-Identity',
'https://www.behance.net/gallery/155350439/Beat-For-Your-Branding',
'https://www.behance.net/gallery/158030509/DRINKSCH-Visual-Identity',
'https://www.behance.net/gallery/158032325/Farsight-Branding',
'https://www.behance.net/gallery/161683577/FAVEN-Website-Design',
'https://www.behance.net/gallery/156259675/THE-GOOD-TRIP-Corporate-identity',
'https://www.behance.net/gallery/160849065/Words-Market-Brand-Identity',
'https://www.behance.net/gallery/167683961/Lumara-Branding',
'https://www.behance.net/gallery/167624929/Functional-Analytics-Branding',
'https://www.behance.net/gallery/167857283/DEBT-Brand-Identity',
'https://www.behance.net/gallery/170322333/ICare-Medicine-Delivery-App',
'https://www.behance.net/gallery/173765565/HULO-App-UI-Design',
'https://www.behance.net/gallery/173766565/Hempnotic-Packaging-Design',
'https://www.behance.net/gallery/184258203/Dorksuk-Website-Design',
'https://www.behance.net/gallery/184162781/Southern-Surgery-Visual-Identity-Concept',
'https://www.behance.net/gallery/180265817/5Minutos-Marketing-Solutions',
'https://www.behance.net/gallery/181700149/DxSale-Branding',
'https://www.behance.net/gallery/186146911/DRAM-Branding',
'https://www.behance.net/gallery/186146009/Ball-Time-Branding',
'https://www.behance.net/gallery/186145063/NAORIS-Brand-Guidelines',
'https://www.behance.net/gallery/186152281/Photonic-App-UIUX-Visual-Identity',
'https://www.behance.net/gallery/186153509/Transporter-Branding',
'https://www.behance.net/gallery/188682663/Branding-ARCHICAD-MASTER'
];

let items = '';
urls.forEach((u, i) => {
  let title = u.split('/').pop().replace(/-/g, ' ');
  items += `  {
    id: 'mat-b${(i+10).toString().padStart(3, '0')}',
    title: '${title}',
    client_name: '${title.split(' ')[0]}',
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
require('fs').writeFileSync('new-cases.txt', items);
