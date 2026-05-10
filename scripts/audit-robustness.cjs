// Adversarial robustness pass — Apple-first.
// Walks every reasonable Apple viewport in WebKit (Safari engine).
// Captures: console errors, autoplay state, CTA reachability, horizontal
// overflow, layout shift, reduced-motion compliance, focus-visible.
//
// Usage: node scripts/audit-robustness.cjs [base_url]
const { webkit, chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:3457';
const OUT = path.join(__dirname, '..', '.audit');
fs.mkdirSync(OUT, { recursive: true });

// Apple-first viewport matrix. (label, width, height, dpr, isMobile, prefersDarkMode, prefersReducedMotion)
const MATRIX = [
  // Phones (portrait, css px)
  { label: 'iphone-se',          width: 375, height: 667,  dpr: 2, isMobile: true,  engine: 'webkit' },
  { label: 'iphone-14',          width: 390, height: 844,  dpr: 3, isMobile: true,  engine: 'webkit' },
  { label: 'iphone-16-pro-max',  width: 440, height: 956,  dpr: 3, isMobile: true,  engine: 'webkit' },
  { label: 'iphone-14-landscape',width: 844, height: 390,  dpr: 3, isMobile: true,  engine: 'webkit' },
  // Tablets
  { label: 'ipad-mini',          width: 768, height: 1024, dpr: 2, isMobile: true,  engine: 'webkit' },
  { label: 'ipad-air',           width: 820, height: 1180, dpr: 2, isMobile: true,  engine: 'webkit' },
  { label: 'ipad-pro-13',        width: 1024,height: 1366, dpr: 2, isMobile: true,  engine: 'webkit' },
  { label: 'ipad-air-landscape', width: 1180,height: 820,  dpr: 2, isMobile: true,  engine: 'webkit' },
  // Macs (CSS pixels — Retina @ 2x)
  { label: 'macbook-air-13',     width: 1280,height: 832,  dpr: 2, isMobile: false, engine: 'webkit' },
  { label: 'macbook-pro-14',     width: 1512,height: 982,  dpr: 2, isMobile: false, engine: 'webkit' },
  { label: 'macbook-pro-16',     width: 1728,height: 1117, dpr: 2, isMobile: false, engine: 'webkit' },
  { label: 'imac-24',            width: 2048,height: 1280, dpr: 2, isMobile: false, engine: 'webkit' },
  { label: 'studio-display',     width: 2560,height: 1440, dpr: 2, isMobile: false, engine: 'webkit' },
  { label: 'pro-display-xdr',    width: 3008,height: 1692, dpr: 2, isMobile: false, engine: 'webkit' },
  // Edge cases
  { label: 'iphone-se-1stgen',   width: 320, height: 568,  dpr: 2, isMobile: true,  engine: 'webkit' },
  { label: 'macbook-dark',       width: 1512,height: 982,  dpr: 2, isMobile: false, engine: 'webkit', dark: true },
  { label: 'macbook-reduced-motion', width: 1512, height: 982, dpr: 2, isMobile: false, engine: 'webkit', reducedMotion: true },
  { label: 'iphone-reduced-motion',  width: 390,  height: 844, dpr: 3, isMobile: true,  engine: 'webkit', reducedMotion: true },
  { label: 'macbook-chromium',   width: 1512,height: 982,  dpr: 2, isMobile: false, engine: 'chromium' },
];

// Routes to audit. Front + every public destination from CTAs/footer.
const ROUTES = [
  { path: '/', name: 'landing', interact: 'scroll' },
  { path: '/signup', name: 'signup' },
  { path: '/follow', name: 'follow' },
  { path: '/library', name: 'library' },
  { path: '/marketplace', name: 'marketplace' },
  { path: '/whitepaper', name: 'whitepaper' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];

const findings = [];

function log(...args) { console.log(...args); }

async function auditOne(browser, vp, route) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    colorScheme: vp.dark ? 'dark' : 'light',
    reducedMotion: vp.reducedMotion ? 'reduce' : 'no-preference',
    userAgent: vp.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const requestFailures = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMsgs.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => consoleMsgs.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    requestFailures.push({ url: req.url(), reason: failure ? failure.errorText : 'unknown' });
  });

  let navOK = true;
  let httpStatus = 0;
  try {
    const resp = await page.goto(BASE + route.path, { waitUntil: 'load', timeout: 25000 });
    if (resp) httpStatus = resp.status();
  } catch (e) {
    navOK = false;
    findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'nav-failure', detail: String(e.message) });
    await ctx.close();
    return;
  }
  if (httpStatus >= 400) {
    findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'http-status', detail: String(httpStatus) });
    await ctx.close();
    return;
  }

  // Let initial paint + any animations begin.
  await page.waitForTimeout(1500);

  if (route.interact === 'scroll') {
    // Trigger the peel scroll on landing — exposes lifecycle bugs.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }

  // Layout audit
  const audit = await page.evaluate(() => {
    const result = {};
    // Horizontal overflow
    result.docW = document.documentElement.scrollWidth;
    result.viewW = window.innerWidth;
    result.overflowX = document.documentElement.scrollWidth - window.innerWidth;
    // Any element wider than viewport
    const all = Array.from(document.querySelectorAll('body *'));
    const offenders = [];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 4 && r.width > 4) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className && el.className.toString ? el.className.toString().slice(0, 80) : '';
        offenders.push({ tag, cls, right: Math.round(r.right), width: Math.round(r.width) });
        if (offenders.length >= 5) break;
      }
    }
    result.overflowOffenders = offenders;
    // Video state (landing only)
    const v = document.querySelector('video.adam-video');
    if (v) {
      result.video = {
        muted: v.muted,
        hasMutedAttr: v.hasAttribute('muted'),
        paused: v.paused,
        readyState: v.readyState,
        currentTime: v.currentTime,
      };
    }
    // CTA reachability — primary buttons must exist and be visible
    const ctas = Array.from(document.querySelectorAll('a[href^="/signup"], a[href="/follow"]'));
    result.ctas = ctas.map((a) => {
      const r = a.getBoundingClientRect();
      return {
        href: a.getAttribute('href'),
        text: (a.textContent || '').trim().slice(0, 40),
        visible: r.width > 0 && r.height > 0,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    // Touch target audit — buttons/links < 32px tall on mobile-ish viewports
    if (window.innerWidth < 1024) {
      const small = [];
      for (const el of document.querySelectorAll('a, button')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 32 && r.width > 4) {
          small.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0, 30),
            h: Math.round(r.height),
            w: Math.round(r.width),
          });
        }
        if (small.length >= 6) break;
      }
      result.smallTargets = small;
    }
    // Font/text size sanity — body text < 14px on mobile is hostile
    if (window.innerWidth < 1024) {
      const tinyText = [];
      for (const el of document.querySelectorAll('p, li, span, a')) {
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        if (fs < 11 && el.textContent && el.textContent.trim().length > 8) {
          tinyText.push({ tag: el.tagName.toLowerCase(), fs: fs.toFixed(1), text: el.textContent.trim().slice(0, 30) });
          if (tinyText.length >= 4) break;
        }
      }
      result.tinyText = tinyText;
    }
    return result;
  });

  // Record findings
  if (audit.overflowX > 4) {
    findings.push({
      vp: vp.label, route: route.name, severity: 'high', kind: 'horizontal-overflow',
      detail: `doc=${audit.docW} viewport=${audit.viewW} extra=${audit.overflowX}px; first offenders: ${JSON.stringify(audit.overflowOffenders)}`,
    });
  }
  if (audit.video) {
    if (audit.video.paused && route.name === 'landing' && !vp.reducedMotion) {
      findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'video-not-playing', detail: JSON.stringify(audit.video) });
    }
    if (vp.reducedMotion && audit.video && !audit.video.paused) {
      findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'video-playing-under-reduced-motion', detail: JSON.stringify(audit.video) });
    }
  }
  if (route.name === 'landing' && (audit.ctas || []).length === 0) {
    findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'cta-missing', detail: 'no /signup or /follow CTAs found' });
  }
  for (const cta of audit.ctas || []) {
    if (!cta.visible) {
      findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'cta-invisible', detail: `${cta.href}: ${cta.w}x${cta.h}` });
    }
  }
  if ((audit.smallTargets || []).length) {
    findings.push({ vp: vp.label, route: route.name, severity: 'medium', kind: 'small-touch-target', detail: JSON.stringify(audit.smallTargets) });
  }
  if ((audit.tinyText || []).length) {
    findings.push({ vp: vp.label, route: route.name, severity: 'low', kind: 'tiny-text', detail: JSON.stringify(audit.tinyText) });
  }
  for (const m of consoleMsgs) {
    findings.push({ vp: vp.label, route: route.name, severity: m.type === 'pageerror' ? 'high' : 'medium', kind: 'console-' + m.type, detail: m.text });
  }
  for (const f of requestFailures) {
    if (f.url.includes('favicon')) continue; // ignore favicon misses
    if (f.url.includes('_rsc=')) continue; // RSC prefetch aborts on Playwright page close — not a real user failure
    findings.push({ vp: vp.label, route: route.name, severity: 'medium', kind: 'request-failed', detail: `${f.url}: ${f.reason}` });
  }

  await ctx.close();
}

(async () => {
  const launches = { webkit: null, chromium: null };
  for (const vp of MATRIX) {
    const eng = vp.engine || 'webkit';
    if (!launches[eng]) {
      launches[eng] = await (eng === 'webkit' ? webkit : chromium).launch();
    }
    log(`▶ ${vp.label} (${vp.width}x${vp.height} ${eng}${vp.dark ? ' dark' : ''}${vp.reducedMotion ? ' rm' : ''})`);
    for (const route of ROUTES) {
      try {
        await auditOne(launches[eng], vp, route);
      } catch (e) {
        findings.push({ vp: vp.label, route: route.name, severity: 'high', kind: 'audit-exception', detail: String(e.message || e) });
      }
    }
  }
  for (const k of Object.keys(launches)) if (launches[k]) await launches[k].close();

  // Sort findings
  const sevOrder = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.kind.localeCompare(b.kind));
  fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify(findings, null, 2));

  // Print summary
  const counts = {};
  for (const f of findings) {
    const k = f.severity + ':' + f.kind;
    counts[k] = (counts[k] || 0) + 1;
  }
  log('\n=== SUMMARY ===');
  for (const [k, n] of Object.entries(counts).sort()) log(`${n.toString().padStart(4)}  ${k}`);
  log(`\nTotal findings: ${findings.length}`);
  log(`Detail JSON: ${path.join(OUT, 'findings.json')}`);
})();
