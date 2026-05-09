const { webkit } = require('playwright');
(async () => {
  const b = await webkit.launch();
  const ctx = await b.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/signup-mobile.png', fullPage: true });
  await b.close();
})();
