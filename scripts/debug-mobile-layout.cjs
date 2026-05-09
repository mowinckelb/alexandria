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
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const layout = await p.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, missing: true };
      const r = el.getBoundingClientRect();
      return { sel, x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      docHeight: document.documentElement.scrollHeight,
      vh: window.innerHeight,
      els: [
        get('.top-slide'),
        get('.bottom-slide'),
        get('.runway'),
        get('.stage-top'),
        get('.stage-bottom'),
        get('.bottom-inner'),
        get('.alpha-mark'),
        get('.nav-toggle'),
        get('.nav-links'),
      ]
    };
  });
  console.log(JSON.stringify(layout, null, 2));
  await b.close();
})();
