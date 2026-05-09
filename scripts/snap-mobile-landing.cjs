const { webkit } = require('playwright');
(async () => {
  const b = await webkit.launch();
  // iPhone 14 Pro viewport
  const ctx = await b.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);

  // FRONT
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/mobile-front.png' });

  // BACK (peel past)
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(900);
  await p.screenshot({ path: '/tmp/mobile-back.png' });

  // Full-page snap of everything (one long image)
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/mobile-fullpage.png', fullPage: true });

  // Snap the back slide bottom area (footer cols + huge wordmark + dict)
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight - 852));
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/mobile-back-bottom.png' });

  await b.close();
})();
