/**
 * HTML templates — shared across modules.
 * Extracted to break circular dependency between prosumer.ts and billing.ts.
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://mowinckel.ai';

// ---------------------------------------------------------------------------
// Callback page — the first brand moment after signup
// ---------------------------------------------------------------------------

export function callbackPageHtml(login: string, apiKey: string): string {
  const curlCmd = `curl -s ${SERVER_URL}/setup | bash -s ${apiKey}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>alexandria.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
    background: #f5f0e8;
    color: #3d3630;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }
  .container { max-width: 420px; text-align: center; }
  .section { margin-bottom: 2.5rem; }
  .label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.15em; color: #bbb4aa; margin-bottom: 0.8rem; }
  .line { font-size: 1.1rem; font-weight: 400; line-height: 1.9; color: #3d3630; }
  .link {
    color: #3d3630;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: #bbb4aa;
    cursor: pointer;
    transition: text-decoration-color 0.15s;
  }
  .link:hover { text-decoration-color: #3d3630; }
  a.link { color: #3d3630; }
  .closing { font-size: 1.15rem; color: #3d3630; margin-top: 2.5rem; }
  .help { font-size: 0.78rem; color: #bbb4aa; margin-top: 2rem; }
  .help a { color: #8a8078; text-decoration: underline; text-underline-offset: 2px; text-decoration-color: #bbb4aa; }
</style>
</head>
<body>
<div class="container">
  <div class="section">
    <p class="label">now</p>
    <p class="line"><a class="link" onclick="copy()" id="copyLink">copy command</a>, then paste into your terminal</p>
    <p class="line"><a class="link" href="${WEBSITE_URL}/shortcut" target="_blank">add shortcut</a>, then share to your vault</p>
  </div>
  <div class="section">
    <p class="label">then</p>
    <p class="line">/a &mdash; develop your thinking</p>
    <p class="line">a. &mdash; absorb the abundance</p>
  </div>
  <p class="closing">welcome to alexandria.</p>
  <p class="help"><a href="${WEBSITE_URL}/docs/setup.md">setup guide</a></p>
</div>
<script>
function copy() {
  navigator.clipboard.writeText(${JSON.stringify(curlCmd)}).then(() => {
    var el = document.getElementById('copyLink');
    el.textContent = 'copied';
    setTimeout(() => { el.textContent = 'copy command'; }, 2000);
  });
}
</script>
</body>
</html>`;
}
