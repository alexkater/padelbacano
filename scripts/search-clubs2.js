const puppeteer = require('puppeteer');

async function debugSearch(query) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=co`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Dump the page title and URL
    console.log('Title:', await page.title());
    console.log('URL:', page.url());
    
    // Dump all text content to understand structure
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 3000);
    });
    console.log('\n=== BODY TEXT (first 3000 chars) ===');
    console.log(bodyText);
    
    // Try to find result containers
    const resultSelectors = await page.evaluate(() => {
      const selectors = [];
      // Try various common selectors
      ['div.g', 'div[data-hveid]', 'div.kb0PBd', 'div.yuRUbf', 'div.MjjYud', 'div.Gx5Zad', 'div.isv-r', 'div[jscontroller]'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          selectors.push({selector: sel, count: document.querySelectorAll(sel).length, sample: el.innerText.substring(0, 100)});
        }
      });
      return selectors;
    });
    
    console.log('\n=== RESULT CONTAINERS ===');
    console.log(JSON.stringify(resultSelectors, null, 2));
    
    // Try extracting links from the page
    const allLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(a => {
        const h3 = a.querySelector('h3');
        if (h3) {
          links.push({
            text: h3.innerText.trim(),
            href: a.href
          });
        }
      });
      return links;
    });
    
    console.log('\n=== LINKS WITH H3 ===');
    allLinks.forEach((l, i) => console.log(`${i+1}. ${l.text}\n   ${l.href}`));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
}

debugSearch('clubes de pádel Bogotá').catch(console.error);
