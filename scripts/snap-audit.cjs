// Visual smoke — snap key viewports after the robustness pass so we
// can eyeball the result. Apple-first set.
const { webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', '.audit');
fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { label: 'iphone-se-landing',      url: '/',           w: 375,  h: 667,  dpr: 2, mobile: true },
  { label: 'iphone-16-pro-max-landing', url: '/',        w: 440,  h: 956,  dpr: 3, mobile: true },
  { label: 'ipad-air-landing',       url: '/',           w: 820,  h: 1180, dpr: 2, mobile: true },
  { label: 'macbook-pro-14-landing', url: '/',           w: 1512, h: 982,  dpr: 2, mobile: false },
  { label: 'pro-display-xdr-landing', url: '/',          w: 3008, h: 1692, dpr: 2, mobile: false },
  { label: 'iphone-14-signup',       url: '/signup',     w: 390,  h: 844,  dpr: 3, mobile: true },
  { label: 'iphone-14-library',      url: '/library',    w: 390,  h: 844,  dpr: 3, mobile: true },
  { label: 'iphone-14-follow',       url: '/follow',     w: 390,  h: 844,  dpr: 3, mobile: true },
  { label: 'macbook-landing-darkmode', url: '/',         w: 1512, h: 982,  dpr: 2, mobile: false, dark: true },
  { label: 'macbook-landing-reduced-motion', url: '/',   w: 1512, h: 982,  dpr: 2, mobile: false, reducedMotion: true },
  // Front slide after a peel-down
  { label: 'macbook-landing-scrolled', url: '/',         w: 1512, h: 982,  dpr: 2, mobile: false, scrollToEnd: true },
];

(async () => {
  const b = await webkit.launch();
  for (const s of SHOTS) {
    const ctx = await b.newContext({
      viewport: { width: s.w, height: s.h },
      deviceScaleFactor: s.dpr,
      isMobile: s.mobile,
      hasTouch: s.mobile,
      colorScheme: s.dark ? 'dark' : 'light',
      reducedMotion: s.reducedMotion ? 'reduce' : 'no-preference',
    });
    const p = await ctx.newPage();
    await p.goto('http://localhost:3457' + s.url, { waitUntil: 'load' });
    await p.waitForTimeout(1800);
    if (s.scrollToEnd) {
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(700);
    }
    const out = path.join(OUT, s.label + '.png');
    await p.screenshot({ path: out, fullPage: false });
    console.log('  ' + out);
    await ctx.close();
  }
  await b.close();
})();
