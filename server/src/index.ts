/**
 * Alexandria MCP Server
 *
 * A stateless MCP server that implements the Blueprint — Alexandria's
 * layer of intent. Connects to the Author's Google Drive via OAuth.
 * Stores nothing. Retains nothing. Pure pass-through.
 *
 * The tool descriptions are the product. Everything else is plumbing.
 */

import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { registerTools } from './tools.js';
import { AlexandriaOAuthProvider, registerGoogleCallbackRoute } from './auth.js';
import { initializeFolderStructure } from './drive.js';
import { createProsumerRouter, updateAccountBilling, getBillingSummary } from './prosumer.js';
import { createBillingRouter } from './billing.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Fly.io)

// Stripe webhook needs raw body for signature verification — skip JSON parsing
app.use((req, res, next) => {
  if (req.path === '/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ---------------------------------------------------------------------------
// OAuth — MCP-standard auth endpoints + Google callback
// ---------------------------------------------------------------------------

const authProvider = new AlexandriaOAuthProvider();

app.use(mcpAuthRouter({
  provider: authProvider,
  issuerUrl: new URL(SERVER_URL),
  scopesSupported: ['mcp:tools'],
}));

registerGoogleCallbackRoute(app);

// ---------------------------------------------------------------------------
// General compounding — persistent event log
// ---------------------------------------------------------------------------
// Append-only JSONL log of anonymous tool events. No user data, no content.
// This is the raw material for general compounding: a model reads the log,
// sees patterns, suggests Blueprint improvements. As models improve, they
// extract more from the same log. Bitter lesson.

import { getAnalytics, getEventLog, getDashboard } from './analytics.js';

// ---------------------------------------------------------------------------
// Prosumer API — hooks + local files + Blueprint
// ---------------------------------------------------------------------------

app.use(createProsumerRouter());

// ---------------------------------------------------------------------------
// Billing — Stripe subscription management
// ---------------------------------------------------------------------------

if (process.env.STRIPE_SECRET_KEY) {
  app.use(createBillingRouter(updateAccountBilling));
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = {};

  // Check data volume is writable
  const dataDir = process.env.DATA_DIR || './data';
  try {
    const { writeFile, unlink } = await import('fs/promises');
    const probe = `${dataDir}/.health-probe`;
    await writeFile(probe, 'ok');
    await unlink(probe);
    checks.volume = 'ok';
  } catch {
    checks.volume = 'error — data directory not writable';
  }

  // Check event log is readable
  try {
    const { stat } = await import('fs/promises');
    const logFile = `${dataDir}/events.jsonl`;
    const s = await stat(logFile);
    checks.event_log = `ok — ${s.size} bytes`;
  } catch {
    checks.event_log = 'empty or missing — no events yet';
  }

  // Check encryption key is available
  checks.encryption_key = process.env.ENCRYPTION_KEY ? 'ok' : 'missing';

  // Check Stripe
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'ok' : 'not configured';

  const healthy = checks.volume === 'ok' && checks.encryption_key === 'ok';

  // Always 200 (server is alive). Checks are informational for CTO/monitoring.
  // Unhealthy state is visible via checks + dashboard errors, not HTTP status.
  res.json({
    status: healthy ? 'ok' : 'degraded',
    server: 'alexandria-mcp',
    version: '0.1.0',
    checks,
  });
});

// Root page — serves HTML with favicon link so Google indexes the icon
app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Alexandria</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon.png">
</head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff">
<div style="text-align:center">
<img src="/favicon.png" width="64" height="64" alt="Alexandria">
<h1 style="margin:1rem 0 0.5rem;font-weight:300">Alexandria</h1>
<p style="color:#888;font-size:0.9rem">Sovereign cognitive identity layer</p>
<p style="color:#555;font-size:0.8rem;margin-top:2rem"><a href="/health" style="color:#555">health</a></p>
</div>
</body>
</html>`);
});

// Serve favicon so Claude picks up the a. logo
import { readFileSync, existsSync, accessSync, constants as fsConstants } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { SHARED_CONTEXT } from './modes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const faviconPng = readFileSync(join(__dirname, '..', 'favicon.png'));

app.get('/favicon.ico', (_req, res) => {
  res.type('image/png').send(faviconPng);
});

app.get('/favicon.png', (_req, res) => {
  res.type('image/png').send(faviconPng);
});

// ---------------------------------------------------------------------------
// MCP endpoint — Streamable HTTP transport
// ---------------------------------------------------------------------------

// Fresh server per request — McpServer.connect() can only be called once per instance
function createMcpServer() {
  const server = new McpServer({
    name: 'Alexandria',
    version: '0.1.0',
    icons: [{
      src: `${SERVER_URL}/favicon.png`,
      mimeType: 'image/png',
    }],
  });
  registerTools(server);
  return server;
}

// MCP endpoint — no middleware auth. Each tool handler checks its own auth.
// The MCP protocol needs initialize, notifications/initialized, and tools/list
// to work without auth during connector setup. Tool calls (tools/call) check
// for Bearer token inside each handler via authInfo.
app.all('/mcp', async (req, res) => {
  // HEAD probe — Claude checks if MCP server exists
  if (req.method === 'HEAD') {
    res.setHeader('MCP-Protocol-Version', '2025-03-26');
    res.status(200).end();
    return;
  }

  // Pass auth info through if present (tools use it for Drive access)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const authInfo = await authProvider.verifyAccessToken(token);
      (req as unknown as Record<string, unknown>).auth = authInfo;
    } catch {
      // Invalid token — don't block, let the MCP handler deal with it.
      // Tool calls will fail naturally with "Not authenticated."
    }
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ---------------------------------------------------------------------------
// Initialization endpoint — creates folder structure on first connect
// ---------------------------------------------------------------------------

app.post('/initialize', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  try {
    await initializeFolderStructure(token);
    res.json({ ok: true, message: 'Alexandria folder created in Google Drive' });
  } catch (err) {
    console.error('Init error:', err);
    res.status(500).json({ error: 'Failed to initialize folder structure' });
  }
});

// ---------------------------------------------------------------------------
// Analytics endpoints — general compounding data
// ---------------------------------------------------------------------------

// Summary counts (fast, in-memory)
app.get('/analytics', (_req, res) => {
  res.json(getAnalytics());
});

// Full event log (JSONL — feed to a model for Blueprint review)
app.get('/analytics/log', async (_req, res) => {
  const log = await getEventLog();
  res.type('text/plain').send(log || 'No events logged yet.');
});

// Monitoring dashboard (founder-facing health proxies — not optimisation targets)
app.get('/analytics/dashboard', async (_req, res) => {
  const dashboard = await getDashboard();
  res.json({ ...dashboard, billing: getBillingSummary() });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Alexandria MCP server running on port ${PORT}`);
  console.log(`  OAuth:  ${SERVER_URL}/authorize`);
  console.log(`  MCP:    ${SERVER_URL}/mcp`);
  console.log(`  Health: ${SERVER_URL}/health`);
  console.log(`  Analytics: ${SERVER_URL}/analytics`);
  runSelfTest();
  // Smoke check: hit live endpoints 30s after startup, then every 6 hours
  setTimeout(runSmokeCheck, 30 * 1000);
  setInterval(runSmokeCheck, 6 * 60 * 60 * 1000);
});

// ---------------------------------------------------------------------------
// Smoke check — periodically hit live endpoints to verify they work
// ---------------------------------------------------------------------------

async function runSmokeCheck(): Promise<void> {
  const base = `http://localhost:${PORT}`;
  const results: string[] = [];
  let failures = 0;

  // 1. Health
  try {
    const r = await fetch(`${base}/health`);
    const body = await r.json() as { status?: string };
    if (r.ok && body.status === 'ok') {
      results.push('[smoke] health OK');
    } else {
      results.push(`[smoke] CRITICAL: health returned ${r.status}, status=${body.status}`);
      failures++;
    }
  } catch (err) {
    results.push(`[smoke] CRITICAL: health unreachable — ${err}`);
    failures++;
  }

  // 2. Find an API key from accounts
  let apiKey: string | null = null;
  try {
    const accountsFile = join(resolve(process.env.DATA_DIR || '/data'), 'accounts.json');
    if (existsSync(accountsFile)) {
      const accounts = JSON.parse(readFileSync(accountsFile, 'utf-8'));
      const first = Object.values(accounts)[0] as { api_key?: string } | undefined;
      apiKey = first?.api_key || null;
    }
  } catch { /* no accounts */ }

  if (!apiKey) {
    results.push('[smoke] no accounts — skipping authenticated checks');
  } else {
    // 3. Blueprint
    try {
      const r = await fetch(`${base}/blueprint`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.ok) {
        results.push('[smoke] blueprint OK');
      } else {
        results.push(`[smoke] CRITICAL: blueprint returned ${r.status}`);
        failures++;
      }
    } catch (err) {
      results.push(`[smoke] CRITICAL: blueprint unreachable — ${err}`);
      failures++;
    }

    // 4. Session
    try {
      const r = await fetch(`${base}/session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: 'smoke_check' }),
      });
      if (r.ok) {
        results.push('[smoke] session OK');
      } else {
        results.push(`[smoke] CRITICAL: session returned ${r.status}`);
        failures++;
      }
    } catch (err) {
      results.push(`[smoke] CRITICAL: session unreachable — ${err}`);
      failures++;
    }
  }

  // Log all results
  for (const line of results) console.log(line);
  if (failures === 0) {
    console.log('[smoke] all checks passed');
  } else {
    console.log(`[smoke] ${failures} check(s) FAILED`);
  }
}

// ---------------------------------------------------------------------------
// Startup self-test — catch obvious deployment issues
// ---------------------------------------------------------------------------

function runSelfTest(): void {
  let failures = 0;

  // 1. DATA_DIR — exists and writable
  const dataDir = resolve(process.env.DATA_DIR || '/data');
  if (!existsSync(dataDir)) {
    console.log(`[self-test] CRITICAL: DATA_DIR does not exist: ${dataDir}`);
    failures++;
  } else {
    try {
      accessSync(dataDir, fsConstants.W_OK);
      console.log(`[self-test] DATA_DIR ok: ${dataDir}`);
    } catch {
      console.log(`[self-test] CRITICAL: DATA_DIR not writable: ${dataDir}`);
      failures++;
    }
  }

  // 2. accounts.json — parseable if present
  const accountsFile = join(dataDir, 'accounts.json');
  if (!existsSync(accountsFile)) {
    console.log(`[self-test] accounts.json not found (ok for fresh deploy)`);
  } else {
    try {
      const accounts = JSON.parse(readFileSync(accountsFile, 'utf-8'));
      const count = Object.keys(accounts).length;
      console.log(`[self-test] accounts.json ok: ${count} account(s)`);
    } catch (err) {
      console.log(`[self-test] CRITICAL: accounts.json exists but failed to parse: ${err}`);
      failures++;
    }
  }

  // 3. Required env vars — present and not MSYS-mangled
  for (const name of ['SERVER_URL', 'ENCRYPTION_KEY'] as const) {
    const val = process.env[name];
    if (!val) {
      console.log(`[self-test] CRITICAL: ${name} is not set`);
      failures++;
    } else if (val.includes('C:') || val.includes('Program Files')) {
      console.log(`[self-test] CRITICAL: ${name} looks like a mangled Windows path: ${val}`);
      failures++;
    } else {
      // Truncate sensitive values
      const display = name === 'ENCRYPTION_KEY' ? `${val.slice(0, 4)}...` : val;
      console.log(`[self-test] ${name} ok: ${display}`);
    }
  }

  // 4. Blueprint assembly — SHARED_CONTEXT is non-empty
  if (!SHARED_CONTEXT || SHARED_CONTEXT.trim().length === 0) {
    console.log(`[self-test] CRITICAL: SHARED_CONTEXT (Blueprint) is empty`);
    failures++;
  } else {
    console.log(`[self-test] Blueprint ok: ${SHARED_CONTEXT.length} chars`);
  }

  // Summary
  if (failures === 0) {
    console.log(`[self-test] All checks passed`);
  } else {
    console.log(`[self-test] ${failures} check(s) failed — server running degraded`);
  }
}
