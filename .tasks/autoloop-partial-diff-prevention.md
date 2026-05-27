# Autoloop: prevent partial-diff commits that ship broken type-passes

## What happened

2026-05-26 / 27 session. While auditing the payment flow I edited three files: `server/src/email.ts`, `server/src/billing.ts`, `server/src/routes.ts`. Between edits, the autoloop ran and committed `3da7458 follow: rework patron welcome copy line` — that commit bundled its own one-line patron-welcome rework with the **email.ts diff I'd made** (the new 3-arg `sendWelcomeEmail(email, githubLogin, emailToken)` signature) but **without** my matching `routes.ts` call-site update.

The autoloop then pushed. CI deploy ran. CI passed type-check because the routes.ts call was `sendWelcomeEmail(email, emailToken)` — emailToken is a `string`, satisfies the `githubLogin: string` slot. The third argument fell off; emailToken defaulted to `undefined`. Type-correct, semantically broken.

Result: every welcome email shipped between 3da7458 (2026-05-26 22:00 PT) and the fix commit `499862f` rendered the kin link as `alexandria-library.com/signup?ref=<email_token_hex>` instead of `?ref=<github_login>`. Broken referrals for every signup in that window.

## Why CI didn't catch it

TypeScript's positional argument matching considers any `string` valid for a `string` parameter. The check that would have caught this — "does the value at this call site semantically belong in this parameter slot" — is something only humans or named/typed-distinct domain types (`type GitHubLogin = string & { __brand: 'github_login' }`) can do. The autoloop has no signal here.

The autoloop trusts the type system, but the type system can't see signature drift between bundled and unbundled files in the same diff.

## Structural fixes (pick one)

### Option A — autoloop bundles all working-tree changes (preferred)

When the autoloop is about to commit, it currently runs its own scoped edits and commits those. It should instead:

1. Stage **all** modified files in the working tree at start of run (or at commit time).
2. Or refuse to run if the working tree has non-autoloop modifications.

The preferred path is (2) — refuse to run on a dirty tree. The autoloop's contract should be: "I run when the tree is clean; if you have WIP, finish it or stash it." This keeps loops sovereign (autoloop never accidentally adopts a human's WIP) and prevents the bundling failure.

### Option B — autoloop runs a callers check before commit

Before committing, if any exported signature changed, grep the rest of the repo for callers and fail if any call site has fewer (or wrong) args than the new signature requires. This is hand-engineering — the type system already does most of this, and it can't catch the string-into-string-slot case. Skip.

### Option C — brand identifying types

Type `github_login` as a branded `string` so passing an `email_token` (different brand) into the `githubLogin` slot is a type error. This catches the specific bug but doesn't generalise — and brand types are friction every time you cross the boundary from raw input. Skip unless there's a second incident.

## Recommendation

Option A. Autoloop refuses to run on a dirty working tree.

Code lives at `~/alexandria-inc/private/loops/`. The check is one `git status --porcelain` call before the autoloop's first edit; non-empty output → exit 0 with a stroll alarm "autoloop deferred — working tree dirty".

## Verification when shipped

After the autoloop change lands:
1. Create a dummy uncommitted change in `~/alexandria-inc/public/code/`.
2. Manually trigger the autoloop.
3. Confirm it does not run, and emits the stroll alarm.
4. Clean the working tree, trigger again, confirm it runs.

## Related principle

`Every feature gets a mirror.` The autoloop is a feature; its mirror should be "did I just ship something that doesn't work?" The CI type-pass is a proxy for that, not the thing itself. The structural fix above prevents the proxy from drifting from the truth in this specific failure class. Other classes (semantic regressions that pass type check, runtime errors that smoke tests don't cover) remain — a future mirror should run the lifecycle test post-deploy and roll back on failure.
