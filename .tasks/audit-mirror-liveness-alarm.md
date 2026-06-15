# Audit-mirror liveness alarm — decision-ready

**Branch:** `elon/audit-mirror-liveness-alarm` (pushed to origin, NOT merged/deployed)
**Decision:** merge + deploy (recommended) vs discard
**Author:** elon beat 7 · 2026-06-15 · claude-opus-4-8

## What changes and who benefits

The tamper-evident access audit (`mowinckelb/alexandria-audit`, hash-chained) is
a load-bearing trust claim — "the substrate is cryptographically verifiable"
(a2). It advances via a `*/10` cron (`mirrorPendingAuditBatch`). **Nothing
alarmed the founder if that chain silently stopped advancing.** `/audit/head`
*exposes* `last_run_at`/`last_commit_at`, but exposure is not detection — it
needs someone to poll and notice. This adds the closed loop: the health digest
now escalates when the chain is stale.

Beneficiary: the founder (and the trust claim itself) — a frozen audit chain
now produces a `sprint` alarm email instead of degrading unnoticed.

## Why now

Awareness is upstream of everything; the top constitution principle says a
"green" nobody checks is suspicious — optimise for false-negative rate. The
audit chain was exactly that: green-looking (`/audit/head` always returns a
valid-looking head) with no alarm behind it. Beats 3–6 hardened DoS/billing;
this closes the one remaining un-watched core trust surface I found in a full
sweep of the server (file-access, auth, accounts, crypto, marketplace,
library-signal, worker, kv, audit — all otherwise clean).

## Completed proof (done-check evidence)

- `auditMirrorStaleness()` — pure verdict fn extracted into `cron.ts` (same
  convention as `scanEventsForAlarms`/`probeD1`), wired into `runHealthDigest`.
- Why `last_run_at` is the right signal: the `*/10` cron updates it on **every**
  run — even with nothing to commit — and skips the update **only** when a
  commit throws (worker.ts `scheduled()` re-throws before `saveState`). So one
  staleness check catches BOTH a dead cron AND silently-failing commits — the
  two ways the chain freezes unnoticed. Verified against source (worker.ts
  692–706, audit.ts 239–268).
- Tests: `server/test/audit-liveness.ts` — 7/7 (healthy, at-limit, dead-cron,
  genesis-never-ran, unparseable, boundary +1ms, custom-limit).
- Regression: cron-scanner 18/18, audit chain 11/11, secret-fingerprint 5/5,
  timing-safe 8/8. `tsc --noEmit` exit 0. `wrangler deploy --dry-run` OK.
- Seam-traced: `getAuditHead()` → `auditMirrorStaleness()` → `escalate('sprint')`.
- Live probe (read-only): `/audit/head` shows `last_run_at` 4 min fresh, cron
  healthy — the alarm would correctly stay silent today.

## Threshold + tradeoffs

- Threshold = **30 min** (3 missed `*/10` runs). Low false-positive: GitHub/CF
  cron can run a little late, but 3 consecutive misses means it's actually dead.
- `sprint` (not `stroll`): a frozen tamper-evidence chain is a trust-integrity
  failure, same tier as "R2 not bound."
- Unparseable `last_run_at` → also escalates (state suspect), never silent.
- Residual risk: none to runtime behavior — the digest only adds one read of an
  existing KV key (`audit:state`) and one possible escalate line. No new deps,
  no schema, no customer-visible surface.

## Recommendation

**Merge + deploy.** Pure-additive observability on a core trust surface, fully
tested, zero blast radius. Batches cleanly with the 4 existing armed B4 branches
(`check-kin-dos-floor`, `library-directory-dos-floor`, `decrypt-all-budget-gate`,
`billing-customer-cast-fix`) — all merge-or-discard.

## Fire checklist (≤5 min)

1. `cd server && npm ci && npx tsx test/audit-liveness.ts` → expect `7 passed`.
2. Review diff: `git diff main...elon/audit-mirror-liveness-alarm` (2 files, +107).
3. Merge to `main` (deploy.yml auto-deploys on main).
4. After deploy, confirm health still `ok`: `curl https://api.alexandria-library.com/health`.
5. (Optional) verify the alarm path: temporarily lower the threshold or inspect
   `/audit/head` — `last_run_at` should stay <10 min in normal operation.
