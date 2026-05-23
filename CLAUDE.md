# Alexandria

Greek philosophy infrastructure. Rides the user's existing ai. Does not run its own models or store user data.

Founder: Benjamin Mowinckel. Solo founder + ai agents. Relocating to SF April 2026.

**Canonical surfaces:** `https://alexandria-library.com` (website, Vercel) and `https://api.alexandria-library.com` (API, Cloudflare Worker — protocol, OAuth, billing, Library, cron). `mowinckel.ai` + `www.mowinckel.ai` 308-redirect to the canonical apex. `api.mowinckel.ai` stays bound to the same Worker so legacy CLI/skill installs that cached the old URL keep working; treat it as deprecated. `mcp.mowinckel.ai` is the older alias on the same retire path. Override only via `SERVER_URL` / `NEXT_PUBLIC_SERVER_URL` when intentional.

## Architecture — Four Layers

Everything in Alexandria maps to one of four layers:

1. **Protocol** (`server/src/protocol.ts` + `auth.ts` + `kv.ts` + `crypto.ts` + `db.ts`) — The incompressible core. ~455 lines, 7 endpoints. Three obligations: account (payment), file (publish monthly), call (communicate). This is what makes Alexandria a protocol, not a product.

2. **Factory** (`factory/`) — The founder's system, public on GitHub, forkable. 19 files: canon (methodology), hooks (shim + payload), setup script, skills (claudecode, cursor, codex, scheduled), templates (agent, machine, notepad, feedback, constitution/, marginalia/, vault/, library/), onboarding block. Any Author can fork and modify. The marketplace evolves canon defaults from cross-Author signal.

3. **Machine** (`~/alexandria/`) — Each Author's personal system. Constitution, vault, marginalia, machine.md, notepad, feedback. Lives locally, never on the server. The product IS this folder. Alexandria stores what Authors publish, never what they think.

4. **Company** (`server/src/` everything else + `app/`) — Operational overhead. OAuth, billing, email, analytics, cron, Library CRUD, admin endpoints. This layer should shrink over time.

## Code

- **Website:** `app/` (Next.js, Vercel). Landing page: `app/components/LandingPage.tsx`.
- **Server:** `server/src/` (Hono, Cloudflare Workers). One file per concern:
  - `worker.ts` (entry + middleware), `protocol.ts` (the protocol — file, call, library, marketplace), `routes.ts` (company HTTP handlers), `auth.ts` (accounts + API keys), `accounts.ts` (account management + admin), `email.ts` (Resend + all templates), `cron.ts` (health digest + followup + engagement), `analytics.ts` (event log + dashboard), `billing.ts` (Stripe), `library.ts` (Library CRUD), `kv.ts` (KV persistence), `templates.ts` (HTML), `cors.ts` (CORS), `crypto.ts` (encryption), `db.ts` (D1/R2 accessor).
  - Stateless server. No private user data stored. KV for accounts/events, D1 for Library metadata + protocol data, R2 for published content.
- **Factory:** `factory/` — public, forkable. Canon methodology, hooks, skills, templates, setup, onboarding block.
- **Static assets:** `public/` (includes `public/docs/` for public artifacts).
- **In-flight task plans:** `.tasks/<task-name>.md`. Each plan is self-contained (any agent in any tool reads it cold and can execute), references this `AGENTS.md` for architecture, and is deleted (or moved to `.tasks/done/`) when the task ships. Use this for cross-session task hand-off instead of memory entries — memory is for stable patterns, plans are for the next thing to do.
- **Investor docs:** kept out of this public repo. Live in `~/alexandria-inc/private/partners/` (private GitHub `alexandria-inc`). Shared directly with partners (email/DM) when needed — no public URL, no `/partners/` route.
- **Pre-commit hook:** `scripts/pre-commit` gates server type check + app build (mirrors CI). Activate on fresh clone: `git config core.hooksPath scripts`.
- **Build:** `cd server && npx wrangler deploy --dry-run --outdir=dist` (server). **Deploy:** `cd server && npx wrangler deploy` then check health. **Push:** `bash scripts/push.sh` (pushes + waits for CI + reports results). Always use `push.sh` instead of raw `git push`.
- **Pull before deploy.** Wrangler ships whatever is on disk. Before `npx wrangler deploy`, run `git fetch && git log origin/main ^HEAD` (or equivalent) to verify local isn't behind origin. If origin is ahead, rebase + redeploy — deploying off stale local clobbers production back to that base. Don't trust "main" by name; verify divergence.
- **"ship" keyword.** When the founder says **"ship"** / "ship it" / "ship this", run the full publish chain without asking again: stage relevant files → commit → `bash scripts/push.sh` (waits for CI) → confirm Vercel/Worker deploy as applicable to the repo. For server-side changes in this repo: also `cd server && npx wrangler deploy` and confirm `curl https://api.alexandria-library.com/health`. Before staging, still classify any dirty diffs by feature and ship only the orthogonal pieces in this commit.
- **Smoke-test conversion CTAs end-to-end before declaring shipped.** Visual screenshots don't catch broken auth flows, stale OAuth redirect URIs, or dead links. For any page with conversion-critical CTAs (join, signup, checkout, OAuth init), list every CTA on the page and confirm each flow lands on its expected user-visible success state. `curl -I` the auth init endpoint to confirm the redirect target; complete the consent flow yourself in a browser session or hand the founder a checklist with the exact CTA URLs to click. "I screenshotted the page" ≠ verification when the page's job is to send users somewhere.
- **Stripe `metadata.kind` discriminator.** Every Stripe checkout session and subscription Alexandria creates carries `metadata.kind` set to one of `author` (Examined Life subscription), `patron` (Door 2 follow-along), `library` (one-time file purchase, currently still keyed on legacy `library_purchase: 'true'` — unify when library WIP lands). Webhook switch in `billing.ts` checks `kind` first; legacy `github_login` / `api_key` lookups remain as fallback. Any new Stripe-creating path must set `metadata.kind` (and `subscription_data.metadata.kind` for subscriptions). Default-fallthrough should be paired with a `logEvent` for surfacing drift.
- **Frontend robustness needs Lighthouse, not just Playwright.** Playwright (`npm run audit`, `scripts/see.mjs`) catches tap targets, horizontal overflow, autoplay, console errors, broken CTAs — behavior. Lighthouse catches LCP, page weight, color contrast at WCAG scale, landmark structure, image-optimization regressions — performance + a11y. Different domains, both essential. Before declaring a robustness or quality sweep done, run `npx lighthouse <url> --form-factor=mobile --throttling-method=simulate` alongside the Playwright matrix. If either is below threshold, the sweep isn't done.
- **Server health:** `curl https://api.alexandria-library.com/health`
- **Stack:** Vercel (website), Cloudflare (DNS + server + KV + D1 + R2), Resend (email), GitHub (code + OAuth), Stripe (billing), Mercury (banking, API), Claude (intelligence). All hybrid (CLI or API-controllable). Zero external dependencies.
- **Storage architecture:** Stateless server, sovereign local files (`~/alexandria/` — local + private GitHub; `iCloud/alexandria/` is Apple-native input only), thin persistence for collective Library (D1 for metadata/discovery, R2 for published content, KV for accounts/events).

### Protocol Endpoints

Seven endpoints. The protocol core:

| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/file/{name}` | Publish a file (the file obligation) |
| GET | `/library` | Browse all published files |
| GET | `/library/{id}` | List one Author's files |
| GET | `/library/{id}/{name}` | Read a specific file |
| POST | `/call` | Report module usage (the call obligation) |
| GET | `/marketplace` | Browse module usage |
| GET | `/marketplace/{module}` | Read usage for one module |

### Company Endpoints

Operational overhead — OAuth, billing, email, admin:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/alexandria` | Protocol handshake (unauthenticated: spec; authenticated: status) |
| GET | `/auth/github` | OAuth initiation |
| GET | `/auth/github/callback` | OAuth callback |
| GET | `/account` | Billing portal redirect |
| DELETE | `/account` | Account deletion (GDPR-ready) |
| POST | `/brief` | Morning brief (autoloop trigger) |
| POST | `/feedback` | Author-explicit feedback (typed into `~/alexandria/system/.session_feedback`, posted at session end, stored in private `mowinckelb/alexandria-feedback` GitHub repo) |
| GET/GET | `/email/less`, `/email/stop` | Email preferences |
| GET/GET | `/brief/less`, `/brief/stop` | Brief preferences |
| POST | `/admin/nudge` | Nudge uninstalled users (admin) |
| POST | `/admin/email` | Send email (admin) |

### Factory Structure

```
factory/
  block.md                  # Onboarding block instructions
  setup.sh                  # Setup script (curl → install)
  canon/
    methodology.md          # The canon — how to develop human cognition
  hooks/
    shim.sh                 # Immutable local shim
    payload.sh              # GitHub-delivered hook logic
  skills/
    claudecode.md           # Claude Code skill definition
    codex.md                # Codex skill definition
    cursor.mdc              # Cursor rules
    scheduled.md            # Scheduled agent skill
  templates/
    agent.md                # Agent instructions template
    machine.md              # Machine.md template
    notepad.md              # Notepad template
    feedback.md             # Feedback template
    constitution/README.md  # Constitution directory scaffold
    marginalia/README.md    # Marginalia directory scaffold
    vault/README.md         # Vault directory scaffold
    library/README.md       # Library directory scaffold
```

## Visual Workflow

**See before shipping.** For any frontend work, use `scripts/see.mjs` (Playwright) to screenshot and visually verify. Read the PNGs with the Read tool — you are multimodal.

- **Screenshot any URL:** `node scripts/see.mjs <url> [--full] [--dark] [--only desktop|tablet|mobile]`
- **Local dev:** `node scripts/see.mjs localhost --port 3000`
- **Design reference:** `~/alexandria/files/core/design.md` — craft substrate (900 lines of concrete CSS physics, anti-patterns, thresholds). Read before any frontend work. Not taste — that's `~/alexandria/files/constitution/Taste.md`.
- Screenshots save to `.see/` at repo root (gitignored), auto-cleaned to last 30.
- **Loop:** build → screenshot → evaluate against design.md → fix → screenshot → ship.

## Style

- "ai" is always lowercase unless at the start of a sentence or in a proper noun (e.g. "Apple Intelligence"). This is a brand and taste decision.

## Design Constraints

- **Pure marginal value add.** Alexandria must never override, compete with, or degrade the user's existing workflows, memory, or tools. Passive mode is read-only context + optional marginalia writes. Active mode (/a) is opt-in. The user's existing system is the floor — Alexandria only adds.
- **All .md files maximise total net signal for the model.** This is THE governing principle for every file an agent reads. Everything downstream is capped at file fidelity. Self-contained (0 to 100 with zero prior context). Max signal, not min length. But net, not gross (overwhelm the model and total received signal drops). Never compress signal. Only delete noise or true redundancy.
- **Data and intent, not intelligence.** Alexandria ships data (the Author's files) and intent (axioms, philosophy, developmental objective). Never intelligence. The host LLM IS the intelligence. Every structure must be optimizable by the model — unstructured markdown, no schemas, no prescribed formats. When models improve, the same data yields more. Zero workflow changes.
- **Bitter lesson:** general methods leveraging computation beat hand-engineered solutions. No structured parameters, fixed schemas, or hand-crafted rules. Unstructured text/JSONL. Let the model figure it out.
- **Philosophy IS the objective:** no numerical loss function or optimization target. Metrics are verification, not goals.
- **Build as little as possible.** Ride existing infrastructure. Server is intent layer, not intelligence layer.
- **Live the philosophy.** Every artifact — factory canon, investor docs, code, brand — must visibly carry the human edge Alexandria claims is the tiebreaker. The test: could a competing team write the same thing from first principles? If yes, it has failed. Generic = interchangeable = dead.

## Session Close

Two triggers, two protocols. Clean separation.

### "a." — Alexandria session close (product behavior)

Triggered by: "a." at the end of an /a session or any session where constitutional signal surfaced.

This is the product. Act as a normal Machine would for any Author — this IS the product test:

- **Constitution.** Write any crystallised signal about the founder as a person to `~/alexandria/files/constitution/`. Opinions, stories, patterns, contradictions revealed this session.
- **Machine.md.** Rewrite `~/alexandria/files/core/machine.md` — how to work with this Author, what worked, what didn't, cognitive style observations.
- **Notepad.** Update `~/alexandria/files/core/notepad.md` — parked questions, accretion candidates, what to carry forward.
- **Feedback.** Append to `~/alexandria/files/core/feedback.md` — what worked, what didn't, methodology observations. (This stays local — the Engine never auto-sends. If the Author wants to push feedback to the marketplace, they type it into `~/alexandria/system/.session_feedback` themselves.)

Do this silently. No report. This is the product working. If Phase 1 feels wrong, the product is wrong.

### "close" / "end" — Work session close (founder/company)

Triggered by: "close", "end", or any sign-off that is NOT "a." — used for coding sessions, company work, non-/a sessions.

No Machine loop. No constitution writes. This is company work, not product:

- **Delta.** What changed about Alexandria the company. Not what you did — what's different now. Hazy fragments only.
- **Open threads.** What's unresolved. What the next session should pick up. Ordered by priority.
- **Meta loop.** Product learnings → factory canon (`factory/canon/methodology.md`).
- **Founder loop.** Save agent memories for communication patterns, preferences, anti-patterns.

**Principles (both protocols):**
- Hazy fragments scale. Weeds do not. Keep it compressed.
- Signal, not summary. Don't restate what the founder already saw — extract what compounds.
- If nothing happened in a loop, skip it. No empty sections.
- The whole output should take <60 seconds to read.

## Code Quality — Server

Before committing any server code change:

1. **Correctness:** Trace the full execution path, not just the changed function. Check all callers of anything modified.
2. **Build:** Run `npm run build` in server/. Must pass.
3. **Test:** Run `npm test` if tests exist. Check the e2e test (`server/test/e2e.ts`).
4. **No regressions:** Review recent commits for anything the change might break.
5. **Bitter lesson compliance:** No structured parameters, fixed schemas, or hand-crafted rules. Unstructured text/JSONL. Soft defaults that thin as models improve.
6. **Statelessness:** Server stores nothing user-specific. Encrypted refresh token IS the access token.
7. **Deployment:** After deploying (`cd server && npx wrangler deploy`), check health: `curl https://api.alexandria-library.com/health`.

## Framework Quirks and Footguns

Reference when symptoms match. Add new quirks here, not as separate files.

### React / Next

- **`new window.Image()` bypasses Next/Image WebP optimizer.** Eager preload via the Image constructor loads raw PNG, not WebP. Caused 15MB of page weight on the landing 2026-05-10.
- **React `muted` doesn't reflect as attribute → Safari blocks autoplay.** Set `v.muted` / `defaultMuted` via ref + call `.play()` in `useEffect`.
- **CSS animations with `forwards` fill override static transforms.** If a static transform has no visible effect, grep for `animation:` and check the keyframes — they win.
- **styled-jsx in Next 16 client components is fragile.** SSR HTML has zero `<style>` tags; depends on JS hydration. If JS stalls, page renders fully unstyled. Prefer plain `<style>` for critical render paths.
- **`useSearchParams` in `'use client'` page bails entire SSR.** Top-level `'use client'` + `useSearchParams` + Suspense ships only the fallback as SSR HTML. Carve out a Client island instead. Verify with `curl -L | grep "known content"`.
- **WebKit driver, not Chromium emulation, for iOS work.** Use Playwright WebKit (`webkit.launch()`, same engine as iOS Safari) — not Chromium with `isMobile: true` (different rendering pipeline; misses real Safari issues). Mobile sweep harness at `scripts/snap-mobile.cjs` is already WebKit-wired. Use it (or its pattern) by default for any iOS-bound layout work.
- **A/B variant compares via URL toggle on single build.** Don't try parallel server orchestration (Turbopack symlink rejections, node_modules duplication, macOS firewall blocking the second port). Add `useState(false)` + `useEffect` reading `URLSearchParams` for the toggle; render `data-{name}={state ? '1' : undefined}` on the root container; override styles via `.draft-root[data-{name}="1"] .target { ... }`. Once the founder picks a direction, strip the toggle infrastructure cleanly.

### Stripe

- **`constructEvent` fails on Cloudflare Workers.** Webhook sig verification must use `constructEventAsync`; sync throws SubtleCryptoProvider error.
- **AMP is Intent-only, not Checkout Session.** `automatic_payment_methods` rejected by SDK v21 on Checkout Session create. Use `payment_method_configuration` or omit `payment_method_types` instead. Checkout in subscription / USD typically resolves to `['card']` with wallets on top — don't "fix" that.
- **CLI webhook update — `--enabled-events` flag required.** `-d "enabled_events[]=X"` silently sets wildcard `["*"]`. Always retrieve after a write to verify. Stripe CLI updates emit empty stdout on success.
- **Restricted-key permission elevation is dashboard-only.** No API/CLI path to edit a `rk_live_...` key's scope. Stripe deliberately blocks this (otherwise "restricted" would be meaningless). To elevate: dashboard.stripe.com/apikeys → click the key → Edit permissions. `stripe login` issues different defaults per mode (live is stricter). Key expires 90 days from creation, stored at `~/.config/stripe/config.toml` (0600 perms).

### Cloudflare Workers / Wrangler / R2 / Email

- **CF Workers `process.env` empty at module load.** `const X = process.env.X || 'fallback'` at top-level uses the fallback, not `[vars]`. `initEnv` populates per-request only.
- **`wrangler r2 object` defaults to local emulator.** `wrangler r2 object get/put/delete` returns "key does not exist" silently against the empty local bucket unless `--remote` is passed.
- **`wrangler d1 migrations apply` 7403 fallback.** When `migrations apply` rejects with auth error despite valid OAuth, use `d1 execute --file` instead.
- **Cloudflare Email Routing — two gotchas.** Wizard overwrites apex SPF with Cloudflare-only entry; preserve existing SPF when enabling. Gmail dedupes self-forwards in tests — use a different inbox to verify.
- **Verify plan tier before recommending a vendor switch.** Check Account → Billing → Subscriptions (or equivalent) before any "switch to product X" recommendation on Cloudflare / AWS / Vercel. The Cloudflare free tier expands over time — "if they're using D1, they must be paid" is unreliable. When pricing pages say "Available only on the Paid plan," treat as a hard gate.
- **Verify vendor toggle before deleting a parallel code path.** "Vendor X handles this natively" ≠ "vendor X's toggle is configured to handle this." Stripe customer-emails (Dashboard → Settings → Business → Customer emails → `Successful payments`, etc.) are toggle-based and OFF by default. Resend deliverability requires domain verification + DKIM/SPF/DMARC alignment. GitHub webhook delivery requires URL set + secret matches + events subscribed. Cloudflare route binding requires custom domain bound to the right Worker.

### claude.ai runtime

- **`RemoteTrigger.update` events is broken.** v1→v2 translator bug; updates to trigger prompts go through the dashboard or via the bootstrap-from-github pattern.
- **claude.ai runtime 403s master pushes.** Strands are routine. GitHub Action FFs `claude/*` to master via `merge-autoloop.yml`; `brief.py` detects if the Action fails. Runtime policy change 2026-05-09.

## Working With the Founder

See `~/alexandria/files/core/agent.md` for principles, communication style, Three-Phase Execution, and Reflect Gate (loaded globally in every session).

Three-way split — keep them separate:

- **This repo** (`~/alexandria-inc/public/code/` → public GitHub `alexandria`) — product source code. Intentionally open. No secrets (use env vars).
- **User vault** (`~/alexandria/` → private GitHub `alexandria-private`) — founder-as-user-0 content: agora, marginalia, constitution, notepad, personal writing, session captures. Every future user will have a `~/alexandria/`; this is the founder's instance.
- **Company business** (`~/alexandria-inc/private/` → private GitHub `alexandria-inc`) — founder-as-CEO materials: investor docs, pitch, brand, early drafts, fundraise tracker. Not part of the product. Not in the public repo.

**Founder's Constitution** lives at `~/alexandria/files/constitution/` — Core.md, Love.md, Power.md, Mind.md, Taste.md. READ Core.md first for any task. READ Taste.md first for any creative task. `~/alexandria/files/core/design.md` for craft substrate.
