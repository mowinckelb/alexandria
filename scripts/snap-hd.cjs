const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width:1280,height:720}, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/draft', {waitUntil: "networkidle"});
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.scrollTo(0, 1400));
  await p.waitForTimeout(700);
  await p.screenshot({ path: '/tmp/hd-back.png' });
  await b.close();
})();
