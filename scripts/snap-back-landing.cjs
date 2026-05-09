const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width:1440,height:900}, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/', {waitUntil: "domcontentloaded"});
  await p.waitForTimeout(3000);
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/desktop-back-landing.png' });
  await b.close();
})();
