const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('file:///C:/Users/Max/Desktop/ninjajas/app.html#clientrefs', { waitUntil: 'domcontentloaded' });
  
  // Wait 3 seconds to let JS run
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
  console.log('Test completed.');
})();
