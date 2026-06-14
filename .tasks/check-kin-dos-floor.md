# /check-kin — close the unauthenticated full-scan amplifier

*Status: **armed, not deployed.** Code fix is on branch `elon/check-kin-dos-floor` (one file, `server/src/routes.ts`). Build passes; live product probed healthy. Founder triggers merge + deploy. Architecture: see `AGENTS.md` (server = Hono on Cloudflare Workers; KV per-account storage).*

## what changes and who benefits

`GET /check-kin?code=<login>` is the public, unauthenticated endpoint the `/signup` page calls (before OAuth) to tell a new user whether the kin code they were given is a real Author. The fix makes that lookup **O(1)** (a single KV index read) instead of, on a cache-missing code, a **full load-and-decrypt of every account in the system.** Benefit: the endpoint can no longer be turned into a resource-exhaustion lever against the live API, and the per-call cost stops growing with the user base. Every real user benefits indirectly (API stays responsive + cheap as we scale toward 100 lovers and beyond).

## why now

It surfaced in the B4 security re-floor after the signup/billing surface moved (billing back on at signup, "free with 5 kin" — `2026-06-11`). It is a **threshold-game gap**: the floor (public, auth-adjacent endpoints must not trigger unbounded O(N) work) was not met for `/check-kin`. The cost is invisible today (few accounts) and grows silently with every signup — exactly the kind of compounding cost the awareness principle says to close the first time it's seen.

## completed proof (the done-check)

- **Root cause, source-verified:**
  - `routes.ts:269` `/check-kin` → `getAccountByLogin(code)` (was).
  - `accounts.ts:35-39` `getAccountByLogin` falls back to `loadAccounts()` on a login-index miss.
  - `kv.ts:128-147` `loadAccounts()` → `listAllAccounts()` paginates **all** `account:*` keys and `loadAccount`s each → **O(N) KV gets + O(N) AES-256-GCM decrypts.**
  - `Cache-Control: public, max-age=60` is URL-keyed, so varying `code` per request bypasses it; each novel non-existent code misses the index → one full decrypt-sweep per probe.
  - `worker.ts:329` `enforcePublicRateLimit` is typed `scope: 'waitlist' | 'follow'` — **`/check-kin` is not rate-limited.**
- **Maps to** agent.md § Security Checklist → Insider/External "Can a user DoS other users? (resource exhaustion, rate limiting on shared surfaces)".
- **Fix:** `/check-kin` now calls `getLoginIndex(code)` directly (O(1), no decrypt, no scan). 11 insertions, 2 deletions, one file.
- **Build:** `npm run build` (wrangler dry-run) → exit 0, full worker type-checks.
- **Seam test (public input → response contract preserved):** live probe of the *current* prod (old code) returns `{"valid":true}` for `code=mowinckelb` and `{"valid":false}` for a nonexistent code. The fix reproduces both: an indexed login → non-null → `valid:true`; an unknown login → null → `valid:false`. Same observable `{valid:boolean}` contract.
- **Live product:** `/health` → all components ok (kv/d1/r2/env), Stripe live mode.

## tradeoff + residual risk

One behavioural divergence: a **legacy account that exists but is missing from the login index** (created before the index, never touched since) would now read `valid:false` in the pre-check, where the old full-scan would have found it. Assessment: near-zero population — `saveAccount` writes the index on every sign-in, and a referrer sharing a kin link is by definition active. And it degrades gracefully: the pre-check is advisory UX only; the **actual referral credit** at the OAuth callback (`routes.ts:487`) still uses the full `getAccountByLogin`, so a real referral is never lost — only the cosmetic pre-check would briefly say "invalid." Acceptable for the amplification it removes.

Not done (deliberately, threshold reached): no rate-limit scope added for `/check-kin`. The O(1) fix takes it from O(N)-amplification to a single KV read — ordinary request load, covered by Cloudflare's platform DDoS protection. Adding a rate-limit scope is past the optimum for this fix; revisit only if abuse data shows O(1) spam mattering.

## recommendation

**Merge + deploy.** Capped downside (one-file change, contract-preserving, reversible by reverting the branch), real upside (removes an unauthenticated cost-amplifier that worsens as we grow). The only "cost" is the near-zero legacy-pre-check edge above.

## fire checklist (≤5 min, founder-only)

1. `cd ~/alexandria-inc/public/code && git checkout elon/check-kin-dos-floor && git diff main -- server/src/routes.ts` — eyeball the 11-line change.
2. Merge: `git checkout main && git merge elon/check-kin-dos-floor`.
3. Ship the server: `cd server && npx wrangler deploy`.
4. Verify: `curl "https://api.alexandria-library.com/check-kin?code=mowinckelb"` → `{"valid":true}`; `curl "https://api.alexandria-library.com/check-kin?code=zzznope"` → `{"valid":false}`; `curl https://api.alexandria-library.com/health` → ok.
5. Move this file to `.tasks/done/` (or delete).
