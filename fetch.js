const https = require('https');
const urls = [
  'https://www.behance.net/gallery/206549349/Wafee-Banking-App',
  'https://www.behance.net/gallery/186151377/UIUX-Booking-platform-Driver-Schools',
  'https://www.behance.net/gallery/195365869/VOTO-Branding-UXUI'
];
urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const imgMatch = data.match(/property="og:image" content="([^"]+)"/);
      const titleMatch = data.match(/<title>([^<]+)<\/title>/);
      console.log('---');
      console.log('URL:', url);
      console.log('Title:', titleMatch ? titleMatch[1] : 'Not Found');
      console.log('Image:', imgMatch ? imgMatch[1] : 'Not Found');
    });
  }).on('error', (err) => console.log(err));
});
