/**
 * Unit test — secret fingerprint must NOT leak any substring of the secret.
 *
 * Regression guard for the Stripe webhook signature-mismatch log path.
 * Prior implementation logged `${secret.slice(0,8)}…${secret.slice(-4)}`
 * which leaked 12 chars of real key material on every signature failure.
 *
 * Run: npx tsx test/secret-fingerprint.ts
 */

import { secretFingerprint } from '../src/billing.js';

// Web Crypto is available globally in Node 20+ (Workers runtime parity).

const SECRET = 'whsec_abcdef0123456789ABCDEF0123456789zZ';
const RUN_ID = `run-${Date.now()}`;

interface Case {
  name: string;
  check: () => Promise<{ pass: boolean; details: string }>;
}

const cases: Case[] = [
  {
    name: 'fingerprint does not contain any 4+ char substring of the secret',
    check: async () => {
      const fp = await secretFingerprint(SECRET);
      // Body of the secret after the `whsec_` prefix — the actual entropy.
      const body = SECRET.slice('whsec_'.length);
      const leaks: string[] = [];
      // Any 4+ char window of the secret body appearing in the fingerprint is a leak.
      for (let len = 4; len <= body.length; len++) {
        for (let i = 0; i + len <= body.length; i++) {
          const window = body.slice(i, i + len);
          if (fp.includes(window)) leaks.push(window);
        }
      }
      return {
        pass: leaks.length === 0,
        details: leaks.length === 0
          ? `fp=${fp} contains no secret-body substring`
          : `LEAK — fp=${fp} contained substrings: ${leaks.slice(0, 5).join(', ')}${leaks.length > 5 ? '…' : ''}`,
      };
    },
  },
  {
    name: 'fingerprint is stable for the same secret',
    check: async () => {
      const a = await secretFingerprint(SECRET);
      const b = await secretFingerprint(SECRET);
      return {
        pass: a === b,
        details: a === b ? `stable: ${a}` : `unstable: ${a} vs ${b}`,
      };
    },
  },
  {
    name: 'fingerprint changes when the secret changes',
    check: async () => {
      const a = await secretFingerprint(SECRET);
      const b = await secretFingerprint(SECRET + 'x');
      return {
        pass: a !== b,
        details: a !== b ? `differs: ${a} vs ${b}` : `COLLISION: ${a}`,
      };
    },
  },
  {
    name: 'fingerprint is hex-prefixed and length-bounded',
    check: async () => {
      const fp = await secretFingerprint(SECRET);
      const ok = /^sha256:[0-9a-f]{8} \(len=\d+\)$/.test(fp);
      return {
        pass: ok,
        details: ok ? `well-formed: ${fp}` : `malformed: ${fp}`,
      };
    },
  },
  {
    name: 'capturing console.error output during fingerprint shows no secret leak',
    check: async () => {
      // Simulate the webhook-mismatch log path: build the exact log line that
      // the handler now emits, then assert the secret is absent.
      const captured: string[] = [];
      const orig = console.error;
      console.error = (...args: unknown[]) => { captured.push(args.map(String).join(' ')); };
      try {
        const fp = await secretFingerprint(SECRET);
        console.error(`[webhook] signature mismatch — bound=${fp}`);
      } finally {
        console.error = orig;
      }
      const log = captured.join('\n');
      const body = SECRET.slice('whsec_'.length);
      const leaked = log.includes(body) || log.includes(body.slice(0, 8)) || log.includes(body.slice(-4));
      return {
        pass: !leaked && log.includes('sha256:'),
        details: leaked ? `LOG LEAKED SECRET: ${log}` : `clean: ${log}`,
      };
    },
  },
];

async function main() {
  console.log(`=== secret-fingerprint test (${RUN_ID}) ===`);
  let failed = 0;
  for (const c of cases) {
    process.stdout.write(`${c.name}... `);
    try {
      const r = await c.check();
      console.log(r.pass ? 'PASS' : 'FAIL');
      console.log(`  ${r.details}`);
      if (!r.pass) failed++;
    } catch (e) {
      console.log('FAIL');
      console.log(`  threw: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} passed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
