const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/signup-current.png', fullPage: true });
  await b.close();
})();
