# billing: normalize Stripe expanded-object casts (`customer` / `subscription`)

**Status:** armed on branch `elon/billing-customer-cast-fix` (pushed to origin, NOT merged, NOT deployed — deploy.yml watches main only). elon beat 6, 2026-06-14.

**Decision:** merge + deploy (recommended) vs discard.

---

## What changes and who benefits (plain language)

The Stripe webhook + checkout-success handlers in `server/src/billing.ts` read `event.object.customer` and `.subscription` and cast them straight to `string` (`as string`). Stripe types those fields as `string | <expanded object> | null` — when expanded, the value is an object `{ id, ... }`, not the bare ID. Eight sites assumed string; the rest of the file (9 sites) already guards with `typeof x === 'string' ? x : x?.id`. This makes the handling **uniform** with the convention the file already uses everywhere else.

Beneficiary: billing correctness on the signup/retention path. The load-bearing site is `customer.subscription.created/updated` (line ~1121): its `customerId` is **written to the persistent account record** as `stripe_customer_id` (line ~1142) and passed to `upsertPatronSubscription`. If Stripe ever delivers an expanded customer object there, the account's `stripe_customer_id` is corrupted with `[object Object]`, which then fails to match future `customer.*` events and the billing-portal lookup — a silent billing break.

## Why now

Found by a beat-6 correctness sweep of the server (Awareness is upstream of everything — what isn't being checked). It's a one-file, behavior-preserving fix that closes a latent billing-corruption path while the surface is small. Zero source-conflict with the 3 pending B4 branches (different file).

## Completed proof (done-check evidence)

- **Conservation:** 6 `.customer as string` + 2 `.subscription as string` unsafe casts → **0** (grep-verified). Plus 1 dead-ternary typo fixed (line ~921: `typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent` — both branches identical; corrected to `.id`).
- **tsc:** `npx tsc --noEmit` exit 0 — Stripe's own types confirm `.id` access is valid on the object branches.
- **Build:** `npx wrangler deploy --dry-run` exit 0.
- **Offline test floor:** `secret-fingerprint` 5/5, `timing-safe-credential-compare` 8/8 green (= main baseline).
- **Behavior:** identical output for the string case (the universal real-world webhook case — Stripe does not expand by default); strictly more correct for the expanded-object case. Diff is 10 insertions / 10 deletions, all in `billing.ts`, each matching an existing sibling idiom (lines 395, 657, 765, 1008, 1160, 1313 …).
- **Live product:** baseline `/health` all-ok, `/alexandria` handshake ok (read-only; this branch is not deployed).

## Tradeoffs and residual risk

- Very low risk: pure input normalization, no control-flow change. The common path (string) is byte-identical.
- Not live-tested against a real expanded-object webhook (cannot trigger Stripe webhooks read-only headless). The type system + the 9 existing sibling sites are the proof. If you want belt-and-suspenders, deploy to a test Stripe mode first — but the change cannot regress the string case.

## Recommendation

**Merge + deploy.** It's a clean correctness fix matching the file's own dominant convention; leaving the inconsistency is interest paid on a silent billing-corruption path.

## Permanent fix (follow-up, founder-gated)

The structural fix that prevents the class from recurring: a CI grep-gate banning `\.(customer|subscription|payment_intent|invoice) as string` in `server/src/`, same idiom as beat 5's `decrypt-all-budget` gate. **Batch this with the pending `decrypt-all-budget-gate` branch** — both need `ELON_REPO_PAT` granted `workflow` scope to wire the `build.yml` step (documented gotcha). Not built this beat to avoid shipping an unmergeable artifact.

## Fire checklist (≤5 min)

1. `git checkout main && git merge elon/billing-customer-cast-fix` (fast-forward, one file).
2. `cd server && npx wrangler deploy` (or let `deploy.yml` fire on main push).
3. `curl https://api.alexandria-library.com/health` → expect all components `ok`.
4. (Optional) grep-gate follow-up: grant PAT `workflow` scope, batch with `decrypt-all-budget-gate`.
