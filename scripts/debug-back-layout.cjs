const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width:1440,height:900}, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/', {waitUntil: "domcontentloaded"});
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(900);
  const positions = await p.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return [
      get('.stage-bottom'),
      get('.bottom-inner'),
      get('.bottom-band'),
      get('.bottom-band .cta-pair'),
      get('.imprint-marginalia'),
      get('.left-col'),
      get('.right-col'),
      get('.statement-welcome'),
      get('.wordmark-block'),
      get('.ornament-wrap'),
      get('.right-lower'),
      get('.big-word'),
      get('.footer-cols'),
    ].filter(Boolean);
  });
  console.log(JSON.stringify(positions, null, 2));
  await b.close();
})();
