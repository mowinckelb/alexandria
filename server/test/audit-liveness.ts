/**
 * Unit tests for auditMirrorStaleness — pure function, no KV/D1/R2 deps.
 * Run: npx tsx server/test/audit-liveness.ts
 * No test framework needed; uses node:assert.
 *
 * Guards the closed loop that turns /audit/head exposure into actual
 * detection: the health digest must escalate when the tamper-evidence chain
 * stops advancing (dead 10-minute cron OR silently-failing commits).
 */

import assert from 'node:assert';
import { auditMirrorStaleness, AUDIT_MIRROR_STALE_LIMIT_MS } from '../src/cron.js';

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  console.log(`  ✓ ${name}`);
  passed++;
};

test('healthy: a run within the last 10 minutes is not stale', () => {
  assert.strictEqual(auditMirrorStaleness(iso(9 * 60 * 1000), now, 1412), null);
});

test('healthy: a run exactly at the limit is not stale (strictly greater)', () => {
  assert.strictEqual(auditMirrorStaleness(iso(AUDIT_MIRROR_STALE_LIMIT_MS), now, 1412), null);
});

test('stale: dead cron — last run 45m ago escalates with minutes + head index', () => {
  const v = auditMirrorStaleness(iso(45 * 60 * 1000), now, 1412);
  assert.ok(v, 'expected a verdict');
  assert.match(v!.reason, /stale/);
  assert.match(v!.reason, /45m ago/);
  assert.match(v!.reason, /n=1412/);
  assert.match(v!.reason, /frozen/);
});

test('stale: genesis sentinel (never ran) is caught', () => {
  const v = auditMirrorStaleness('1970-01-01T00:00:00.000Z', now, 0);
  assert.ok(v, 'expected a verdict for a never-run chain');
});

test('suspect: unparseable timestamp is surfaced, not silently passed', () => {
  const v = auditMirrorStaleness('not-a-date', now, 1412);
  assert.ok(v, 'expected a verdict');
  assert.match(v!.reason, /unparseable/);
});

test('boundary: 1ms over the limit escalates', () => {
  const v = auditMirrorStaleness(iso(AUDIT_MIRROR_STALE_LIMIT_MS + 1), now, 7);
  assert.ok(v, 'expected a verdict just past the limit');
});

test('custom limit is honored', () => {
  // 5 min ago, limit 1 min → stale.
  assert.ok(auditMirrorStaleness(iso(5 * 60 * 1000), now, 1, 60 * 1000));
  // 5 min ago, limit 10 min → healthy.
  assert.strictEqual(auditMirrorStaleness(iso(5 * 60 * 1000), now, 1, 10 * 60 * 1000), null);
});

console.log(`\naudit-liveness: ${passed} passed`);
