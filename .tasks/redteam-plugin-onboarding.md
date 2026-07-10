# Red-team sweep: plugin + onboarding (2026-07-09)

**Status:** first wave SHIPPED + DEPLOYED + verified live (ship `b9d2d9c`, Worker `81c6d6d5`, Stranger green 3 OSes, plugin chain live-probed on user zero). /optimise second pass added two commits, `2f0e6f7` (plugin-shim defer fix, SIGNED SET) + `34ec04f` (setup registry-truth) — **awaiting one more founder `bash factory/ship.sh` fire** (never push.sh: 2f0e6f7 touches a signed file; CI signing gate red until re-signed). Architecture ref: `../CLAUDE.md`.

## What was swept

Full red team of the plugin delivery chain (`factory/plugin/`, marketplace manifest, setup.sh migration), every onboarding persona (Claude Code current/old, Cowork, Claude Desktop, Cursor/Codex/Factory, no-agent, existing-Author re-sync, privacy reader), server security on onboarding surfaces, platform ground truth (Anthropic docs + issue tracker), live surfaces, and a user-zero pass on the founder's machine.

## Verified SOLID (evidence in session 2026-07-09)

- Signature chain: all 22 manifest entries hash-match at HEAD; sig valid; runtime gate fail-closed; a poisoned GitHub file cannot be written without the offline key.
- OAuth CSRF (state + double-submit cookie), key never in a URL, timing-safe auth, webhook HMAC, account-deletion completeness, admin auth, CORS fail-closed, callback-page XSS escaping.
- `/a` → 307 → raw setup.sh, https end-to-end; `/signup` → `/join`; API healthy; `claude-cli://` deep link registered where CC is installed.
- **Plugin delivery works end-to-end in Claude Code** — live-tested on the founder's machine: legacy hooks removed, fresh headless session got the full AUTHOR CONTEXT via plugin → shim → signed payload. Founder's machine is now on plugin delivery (settings backup: `~/.claude/settings.json.backup-redteam-20260709`).
- setup.sh re-run is idempotent: key reuse, seed-if-missing, hook de-dupe, plugin migration.
- `SubagentStart` is a valid hook event (docs-verified). Skills work on all Claude surfaces.

## Fixed this sweep (committed, awaiting founder fire)

1. `6989231` server: install magic-link now single-use (was replayable 14d with live API key); per-account rate limits on `POST /feedback` + `POST /account/feedback`.
2. `1e22f35` setup.sh: plugin install verified against `installed_plugins.json` before legacy hooks are removed (failed install can no longer strand a user hookless); status matrix re-probes; existing-Author re-run prints "synced" instead of re-onboarding; **Codex now writes `~/.codex/AGENTS.md`** (current convention — `instructions.md` was dead); ship.sh gains shim-twin cmp guard.
3. `6fe6cd3` payload + plugin (SIGNATURE-GATED): permanent false "/a skill" drift killed (confirmed live on user zero — setup's name-rename now applied to the reference before hashing); drift-notice remediation fixed (`/signup` was a dead pointer → the curl one-liner); `ALEX_DIR` threaded into agent-facing strings (Cowork mounts); plugin-shim no-folder message no longer advises `curl|bash` inside the ephemeral Cowork VM; README drops the nonexistent "Settings → Plugins" UI and the "same as Claude Code" capture over-claim.
4. `4e4bb22` copy + CI: /start Cowork/Desktop line truthful; mobile names the coding-agent requirement; install-nudge email rewritten off the retired 3-step flow; cursor.mdc `ontology/`→`marginalia/`; Mechanics 11 modules + tokenized install fetch; TRUST.md example marked excerpt; **plugin.yml signing job** (sig verify + manifest re-hash + SIGNED_FILES coverage — intentionally RED until re-sign).
5. `f3acd68` payload (SIGNATURE-GATED): empty-constitution session points the agent at the cached `.block` (terminal-install persona now gets real onboarding).

## Fire checklist (founder, ~5 min)

1. `cd ~/alexandria-inc/public/code && bash factory/ship.sh "red-team sweep: plugin + onboarding fixes"` — re-signs manifest (now covering the 4 plugin files added to SIGNED_FILES 2026-07-08 but never signed; TRUST.md's coverage claim is currently false until this runs), pushes all commits → Vercel picks up website, Authors pick up payload/plugin fixes next session.
2. `cd server && npx wrangler deploy` → `curl https://api.alexandria-library.com/health`.
3. Check Actions: the new `signing` job in plugin.yml must go green after the ship.
4. Optional 30s probe: in a Cowork session, attach `~/alexandria`, type `/a` — confirms the documented manual-start path.

## /optimise second pass (same day) — found + fixed

- `2f0e6f7`: plugin legacy-defer grepped ALL of settings.json for the shim path — a permissions rule mentioning it (old always-allow) would silently disable the plugin forever (worst class: capture dead, no banner). Now anchored to hook `"command"` entries; project-scope settings.json also checked (double-fire guard). Fixture-proven both directions.
- `34ec04f`: plugin verification now consults the registry regardless of install exit code (registry = ground truth); re-runs also `claude plugin update` so pinned installs advance (third-party marketplaces don't auto-update — verified `update` subcommand exists).
- Re-verified live: /start copy deployed, fake install tokens → 302 /signup, `/alexandria` 200, ALEX_DISPLAY ordering in payload.sh correct (ALEX_DIR is `$2` line 7), install-token delete placement correct, nudge email links well-formed, `claude plugin marketplace update` exists.
- Prod-coherence audit of the split-deploy: worker.ts was committed (CI green) before the Worker deploy → prod == HEAD. Only ambiguity: FOUNDER_EMAIL var mid-migration in a parallel session's uncommitted wrangler.toml (both values are the founder's own gmails; ships with that session's next deploy).
- Flag for founder: `/health` shows "2 setup reports with non-ok status in 24h (fetch_errors=2)" — check the analytics dashboard for who/what those were (admin-gated; likely the unsigned-window CI runs or a real user with a flaky network).

## Max-verification pass (2026-07-09 evening) — executed tests

- **Fresh-machine matrix, 6/6 PASS** (isolated fake HOMEs, real claude CLI): keyless fresh install; fresh+CC plugin path (no third-state stranded user); legacy→plugin migration with permissions rule preserved + tightened defer grep proven on real fixture; no-node degradation; triple re-run idempotency (sha-identical trees); codex AGENTS.md+instructions.md dual-write with marker replacement. Degraded-network stop behavior validated by accident (all fetches down → core ✗ → "do NOT read the block" close). Zero writes escaped the fake HOMEs.
- **Local Worker integration, 10/10 PASS** (wrangler dev --local, seeded KV incl. AES-GCM account blob): install-token single-use proven at HTTP + KV level (302 handoff → 302 /signup, key deleted); /feedback rate limit exact (5 pass, 6th+7th 429, counter stops at 5, check fires before the GitHub write so relay failures don't mask it); auth 401s; check-kin. No bugs.
- **User zero**: plugin updated 9747d47 → cc88b0f via `marketplace update` + `plugin update` (the exact re-run path setup now automates); updated plugin fires (AUTHOR CONTEXT via tightened shim); warm hook chain measured **7.5s** against the 15s budget (slow-network concern is real, parked design item stands).
- **Committed this pass:** `077ac25` — fresh-Mac repo-local git identity fallback (genesis + worldline commits silently failed with no git identity), chmod guard, README Desktop code-tab precision (code tab = automatic, chat tab = no file access, Cowork = manual /a).
- **Cowork hands-on probe: RUN BY FOUNDER 2026-07-09 (screenshots) — VERDICT: Cowork does NOT load Claude Code plugins.** The `/` picker in Cowork mode shows only Cowork's own skills registry (add-files, setup-cowork, skill-creator, design) — no `/a`. Desktop **code tab** fully works: `/a` + `/alexandria` listed, session read the folder, ran bash, wrote the probe file (into the founder's `.cowork-test` copy). All surfaces (README, /start, Mechanics, marketplace.json, TRUST.md) + company canon (a3 TWO DELIVERY MODELS — its third overclaim/underclaim swing, now reset to "claim only what user-zero has executed") corrected same-day: Claude Code + Desktop code tab = automatic; Cowork = not yet, plugin already handles it whenever Anthropic wires plugins in. Open 10s follow-up if the founder ever cares: Cowork's + menu has an "Add plugins…" item — if adding `mowinckelb/alexandria` there surfaces `/a`, Cowork gets upgraded to a documented two-step path.

## LIVE STATE WARNING (as of this pass)

- **CI signing gate RED on origin/main tip `cc88b0f`**: `plugin-shim.sh` (tightened, 2f0e6f7) reached main via the parallel session's push.sh WITHOUT a manifest re-sign — second occurrence of the exact failure class today; runtime unaffected (plugin-shim is TOFU, payload/canon all verify OK) but tamper-detection for that file is void until re-signed.
- **Local main has DIVERGED from origin** (local: 2 landing commits + `077ac25`; origin: `cc88b0f`). Converge then ship, one move: `git pull --rebase origin main && bash factory/ship.sh "re-sign plugin-shim + polish"`.

## Known items, deliberately parked

- Hook cold-start fetch budget (payload's canon loop + drift checks, foreground, worst case ≫ 15s hook timeout on slow networks) — advisory notices may truncate; wants its own design pass (background the advisory fetches), not a hot patch to a signed file.
- Plugin auto-update is OFF by default for third-party marketplaces — acceptable because the plugin shell is dumb; behavior lives in the payload fetched fresh each session. Revisit only if plugin-shim logic changes often.
- `GET /check-kin` is an unauthenticated membership oracle (low; needs an IP-keyed limiter that doesn't exist in routes.ts scope without a circular import).
- No branch protection on `main` (a Build failure landed on main 2026-07-09 and blocked nothing); smoke.yml runs even when Deploy failed.
- Cowork hooks: Anthropic issue #47993/#40495 (SessionStart doesn't fire in Cowork) — all copy now claims manual-start only there. If Anthropic fixes it, the plugin is already in place; upgrade the copy then.
- Codex `AGENTS.md` fix is docs-verified but not machine-verified (no Codex on user zero). First real Codex install report will confirm.
