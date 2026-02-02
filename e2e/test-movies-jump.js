const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const base = process.env.BASE_URL || 'http://localhost:5173';
  console.log('Opening', base+'/#/movies');
  await page.goto(base+'/#/movies', { waitUntil: 'domcontentloaded' });

  // Wait for controls to appear
  await page.waitForSelector('#sort-by');

  // Click "Show all"
  const showBtn = await page.$('#reset-filters');
  if (!showBtn) { console.error('Show all button not found'); await browser.close(); process.exit(2); }
  await showBtn.click();
  console.log('Clicked Show all');

  // Wait for items grid
  await page.waitForSelector('#items-grid .card img', { timeout: 15000 });

  // Check that 100 items loaded (exactly PER_PAGE)
  const items = await page.$$eval('#items-grid .card', els => els.length);
  console.log('Items on page:', items);
  if (items !== 100) { console.error(`Expected 100 items on page but got ${items}`); await browser.close(); process.exit(4); }

  // Jump to page 2
  const total = await page.$eval('#total-pages', el => parseInt(el.textContent||'1',10));
  console.log('Total pages reported:', total);
  if (total < 2) { console.warn('Only one page available, cannot jump to page 2'); await browser.close(); process.exit(0); }
  await page.fill('#page-input', '2');
  await page.click('#page-go');
  console.log('Requested jump to page 2');

  // Wait for the grid to update (simple heuristic: wait for first card to have different src or wait a bit)
  await page.waitForTimeout(2000);
  const pageVal = await page.$eval('#page-input', el => el.value);
  console.log('Page input now:', pageVal);

  // Verify page input is 2
  if (pageVal !== '2') { console.error('Failed to jump to page 2'); await browser.close(); process.exit(3); }

  // Count items again
  const items2 = await page.$$eval('#items-grid .card', els => els.length);
  console.log('Items on page 2:', items2);
  if (items2 !== 100) { console.error(`Expected 100 items on page 2 but got ${items2}`); await browser.close(); process.exit(5); }
  await browser.close();
  console.log('E2E test completed successfully');
})();