const puppeteer = require('puppeteer');

async function searchGoogle(query) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  
  const results = [];
  
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=co`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Extract search results
    const items = await page.evaluate(() => {
      const results = [];
      const searchItems = document.querySelectorAll('div.g, div[data-hveid]');
      searchItems.forEach(item => {
        const titleEl = item.querySelector('h3');
        const linkEl = item.querySelector('a');
        const snippetEl = item.querySelector('div[data-sncf], span.aCOpRe, div.VwiC3b');
        
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.innerText.trim(),
            url: linkEl.href || '',
            snippet: snippetEl ? snippetEl.innerText.trim() : ''
          });
        }
      });
      return results.slice(0, 15);
    });
    
    results.push(...items);
    console.log(`\n=== Resultados para: "${query}" ===`);
    console.log(`Total: ${items.length} resultados`);
    items.forEach((r, i) => {
      console.log(`\n${i+1}. ${r.title}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   ${r.snippet.substring(0, 200)}`);
    });
    
  } catch (err) {
    console.error(`Error searching "${query}":`, err.message);
  }
  
  await browser.close();
  return results;
}

async function main() {
  const queries = [
    "clubes de pádel Bogotá canchas",
    "padel clubs Bogota Colombia",
    "mejores clubes pádel Bogotá",
    "canchas de pádel Bogotá norte sur",
    "software gestión clubes pádel tenis",
    "Playtomic Colombia precios",
    "Matchi software clubes pádel",
    "Club Manager software pádel tenis",
    "software para clubes deportivos Colombia",
    "crecimiento pádel Colombia 2024 2025",
    "cuánto cuesta alquilar cancha pádel Bogotá",
    "sistema reservas canchas pádel Colombia"
  ];
  
  const allResults = {};
  for (const q of queries) {
    allResults[q] = await searchGoogle(q);
  }
  
  // Output as JSON for processing
  console.log('\n\n===== JSON OUTPUT =====');
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
