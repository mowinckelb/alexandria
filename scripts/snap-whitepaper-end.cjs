const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/whitepaper', { waitUntil: 'domcontentloaded' });
  // Wait until the article has rendered actual paragraphs (not just the loader)
  await p.waitForFunction(() => {
    const ps = document.querySelectorAll('article p');
    return ps.length > 5;
  }, { timeout: 15000 });
  await p.waitForTimeout(800);
  // Find the byline/mentes — the last paragraph in the article
  const stats = await p.evaluate(() => {
    const ps = document.querySelectorAll('article p');
    const last = ps[ps.length - 1];
    const r = last.getBoundingClientRect();
    // Scroll so the last element is ~200px from bottom of viewport
    window.scrollTo(0, window.scrollY + r.top - (window.innerHeight - 250));
    return {
      count: ps.length,
      lastText: last.textContent.trim(),
      lastY: r.top,
      docHeight: document.documentElement.scrollHeight,
      winHeight: window.innerHeight,
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await p.waitForTimeout(500);
  // The article element itself may be the scroll container, not document.
  // Force-scroll it specifically.
  await p.evaluate(() => {
    const last = document.querySelectorAll('article p');
    last[last.length - 1].scrollIntoView({ behavior: 'instant', block: 'end' });
  });
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => {
    const ps = document.querySelectorAll('article p');
    const last = ps[ps.length - 1];
    const r = last.getBoundingClientRect();
    return { lastY: r.top, lastBottom: r.bottom, scrollY: window.scrollY, color: getComputedStyle(last).color, opacity: getComputedStyle(last).opacity };
  });
  console.log('after scroll:', JSON.stringify(after));
  await p.screenshot({ path: '/tmp/whitepaper-end.png' });
  await b.close();
})();
