# One-click onboarding + decouple capture from the active agent

**Status:** in progress (branch `onboarding-one-click`). Architecture ref: `../CLAUDE.md`.
**Owner:** founder-fired on deploy. All build is armed-not-fired until Benjamin says ship.

## The ask (founder, 2026-06-23)

Two moves, ranked:

1. **Now — radical onboarding simplification.** For someone who *already* has a local agent (Claude Code, Cursor, Codex, Factory/droid) **and** a subscription: make getting Alexandria as close to "one click and you're off" as physics allows. Today it's OAuth → copy a `curl|bash` command → paste into the agent → *then* a second copy-from-browser "begin" step. Too many steps.
2. **Later (parked add-on) — use any AI, not just the agent you live in.** A prosumer who has an agent but sometimes uses chat (Claude/ChatGPT web or desktop) should still have their thinking captured. This is the "decouple capture from the active agent" idea. Spec'd below, **not built now.**

The locked frame this rides (a3 TWO DELIVERY MODELS): the dividing line was never *coding*, it was *a local process reaching local files*. Everything here stays inside that — sovereign, local, both compounding loops intact. Nothing routes private cognition through the server.

## Ground truth — how onboarding works today (verified in code)

- Entry: `/signup` → "sign in with GitHub" (OAuth). Callback renders `server/src/templates.ts:callbackPageHtml`.
- The callback page shows **three** numbered actions:
  1. **install** — copies `curl -fsSL .../factory/setup.sh | bash -s -- <API_KEY>` (key embedded). "paste it into your coding agent and hit enter."
  2. **begin** — copies `block.md` from the browser. "paste it into a fresh chat" → drafts the constitution (up to an hour).
  3. **shortcut** — iOS/Mac share-sheet shortcut.
  Plus kin code / invite link / Mechanics.md.
- `factory/setup.sh <KEY>` does everything locally: creates `~/alexandria/`, installs the immutable `shim.sh` + signed `payload.sh`, registers SessionStart/SessionEnd/Subagent hooks, installs the `/a` skill, seeds canon, git-inits the worldline, wires iCloud input. **It already auto-detects and configures all four agents present on the machine: Claude Code, Cursor, Codex, Factory (droid).** It also caches `block.md` locally at `~/alexandria/system/.block`.
- setup.sh's final message tells the user to **go back to the browser tab, click "begin," paste into a fresh chat** — a browser round-trip that is unnecessary, because `/a` is now installed and `.block` is cached locally.

**So the real friction is not the install — it's the choreography:** three numbered browser actions and a browser round-trip for a step the agent can already do locally.

## The core test (founder reframe, 2026-06-23): can the surface read/write local files? — not "does it fire my hooks."

Hooks are the *automation* layer of the current implementation, not the essence. The essence is local file I/O. Sorted by that test (all verified 2026-06-23):
- **Coding agents (CC/Cursor/Codex/Factory):** native file I/O + hooks wired → **fully automatic**. The company.
- **Cowork:** **can** read/write local files today (attach a workspace folder in the UI; per-action approval). So it **can run Alexandria** — point it at `~/alexandria/`. Missing only the hook layer → capture/context-load is *manual*, not automatic. Usable, not automatic.
- **Claude Desktop:** same via the filesystem MCP server (one config edit). Usable, not automatic.
- **Web/phone chat:** no local file access at all → the real Bucket-2 line.
- The deferred **local stdio MCP server** raises Cowork/Desktop from manual→automatic; it's an efficiency upgrade, not what makes them possible. (a3 corrected to this framing — it had earlier swung from "works fully" to "can't run"; truth is the middle.)

## (superseded) Earlier Cowork note — kept for the record

Canon (a3) asserts Cowork is Bucket 1 and "works fully," and lists "Claude Desktop + a double-click `.mcpb`" as a working surface. **Both over-claim.**

- **Cowork:** does **not** fire SessionStart/SessionEnd hooks, does **not** load local-filesystem skills, and plugin hooks don't fire there (three open Anthropic GitHub issues: #47993, #40558, #27398). The entire product rides those hooks, so the hook-based integration cannot run in Cowork.
- **Claude Desktop + `.mcpb`:** also unbuilt — there is **no** `.mcpb` / Claude-Desktop MCP server anywhere in the repo, and `setup.sh` configures only CC / Cursor / Codex / Factory (hooks + skills). So "double-click extension works" describes a thing that doesn't exist yet. (Caught on the awareness pass — I almost corrected only Cowork.)
- **The one route that could serve BOTH:** a **local MCP server** (Claude Desktop / Cowork load local MCP from `claude_desktop_config.json`; MCP tools read/write the filesystem). A different integration shape from the hook loop — parked under Phase C, not built now. It is also the *durable* capture primitive (see C1).
- **Confidence:** high from issue tracker + repo absence, not a hands-on test. The 30-second probe (below) confirms Cowork definitively.
- **Action (A2):** correct a3 to stop claiming either works today; point both at the deferred local-MCP route.

## Plan

### Phase A — EXECUTE NOW (small, high-leverage, closes the loop)

**A1b. One-click deep link (built 2026-06-23) — kills the copy-paste itself.** Verified Claude Code registers a `claude-cli://open?q=<prompt>` deep link (v2.1.91+): clicking it opens Claude Code with the install command pre-filled (user presses enter — never auto-run). The callback "start" action is now this deep link, so the human does *one click* instead of copy → switch app → paste. Copy-the-command stays as the fallback line for Cursor/Codex/Factory + older CC. The OS routes `claude-cli://` locally; the key never leaves the machine. **Needs a real-machine click test** (OS routing can't be unit-verified); the copy fallback is the guaranteed floor.

**The honest floor for "one action":** click `start` (deep link) → press enter → GitHub authorize. The authorize click is irreducible (account/key/billing). To remove the website + sign-in-first entirely → Phase B1 (loopback OAuth folded into the install, deep link distributable from anywhere like a `design.md`).

**A1. Collapse three steps into one paste, kill the browser round-trip, and auto-continue into `begin`.**
- `server/src/templates.ts` (callback page): make a single hero action that copies the one install command and says "paste into your agent." Demote shortcut + kin + Mechanics below it (keep them, de-emphasise). Remove the separate browser-copy **"begin"** step entirely. (Exact hero word — "start" / "install" / "begin" — is a brand-voice taste pass against a4, not hard-coded here; keep it lowercase + on-voice.)
- `factory/setup.sh` (final message): replace "go back to your browser tab, click begin…" with an **agent instruction to proceed automatically**: on successful install, tell the agent to announce it's drafting the constitution now from local files (`.block` is cached locally, `/a` is installed) and start — *interruptible*, with "just say `begin` later" as the fallback if the agent doesn't auto-continue. This is a **soft default** (bitter lesson: a more capable agent follows the continue-instruction more reliably; the floor is the user typing `begin`). Over-delete by 10%: don't make the user say a word the agent can act on itself.
- Net flow: **OAuth (click) → copy (click) → paste into agent (one action) → installed → agent starts drafting your mind automatically → off.** That is the honest floor for a *local* install — something must authorise writing files + hooks on the machine; the minimum is one paste into the agent the user already has. No magic single button exists for local installs (verified: no plugin deep-link URL).
- **Not throwaway polish:** the `setup.sh` close is reused verbatim by B1 (agent-as-entry still runs setup.sh), and the website signup path survives as a fallback entry under B1. A is the floor B builds on, not a disposable detour.
- *Open consideration (B-tier, not forced into A):* the draft is a ~1h foreground task. A truer "you're off" runs it async via the existing scheduled-agent / autoloop infra (user leaves, comes back). Noted, not built in A — keep A a pure delete.

**A2. Correct the Cowork claim in canon.** Edit `~/alexandria-inc/private/truth/a3.md` TWO DELIVERY MODELS: Cowork is not a working hook surface today; the only route is a local MCP server, deferred. Keep Claude Desktop + `.mcpb` claim only where it's the *desktop extension* (local MCP), not the hook loop.

**A3. Ship gate (founder-fired).** Build + type-check locally. Do **not** deploy. Leave a ≤5-min fire checklist. Deploy (`cd server && npx wrangler deploy`) + push are Benjamin's triggers.

### Verification — close the loop against ground truth (not a one-shot smoke test)

*The product is the ground truth; a manual "I ran signup once" is a proxy. The signal already exists — point at it.*

- **Ground-truth signal (already emitted):** `setup.sh` POSTs a per-subsystem setup report to `/feedback` (`context:"setup"`) on every install — success/fail for files, canon, hooks, key, and each agent. `library-signal.ts` already produces the daily signup→engagement funnel the founder reads. So the closed loop is: after ship, watch (a) the **setup-report success rate** (did installs still complete cleanly after the copy change?) and (b) the **signup → install → first-`begin` funnel** (did collapsing the steps raise completion?). No new instrumentation — the loop is already there; this plan just declares it the success test.
- **The mirror (every feature gets a mirror):** the test isn't "does it still work," it's "did simplification *raise* the signup→begin completion rate vs the 3-step flow?" If the rate doesn't move or drops, the simplification was cosmetic or broke something — surface it in the morning brief and iterate. Capture the pre-ship baseline from `library-signal.ts` before deploy so there's something to compare against.
- **Honesty floor:** "it builds / type-checks" is the floor, not done. Done = the live funnel moves the right way for real users.

### Phase B — SPEC NOW, BUILD NEXT (the bigger "one click")

**B1-revised — device-code flow, and the security finding that changes the recommendation (2026-06-23).** Goal: kill the website/priming page entirely so the one-liner (or `claude-cli://` deep link) works from *anywhere* and folds auth into the install. Chosen mechanism: **device-code flow** (not loopback OAuth — that needs a GitHub OAuth-app change; device-code reuses the existing web OAuth). Design: `setup.sh` with no key → `POST /auth/device/start` (server mints a high-entropy `device_code`, KV `device:<code>` pending, TTL 10m) → opens browser to `/auth/github?device=<code>` → after OAuth the callback stores the fresh key (encrypted via existing `encrypt()`) against the code → script polls `/auth/device/poll?code=<code>`, gets the key once (then deleted), installs, auto-begins. Server pieces scoped: routes for start/poll, thread `device` into OAuth `state`, store-key-after-callback, a device-success page, a short `/go` redirect. setup.sh gains a no-key device branch.

**The finding (why I stopped before building):** a bare device flow is **phishable** — an attacker starts their own device session, gets a victim to click `/auth/github?device=<attacker_code>` and sign in, then polls the victim's fresh key → **account takeover.** The RFC-8628 fix is a **user-code confirmation** (terminal shows a short code; the browser page makes the user confirm it matches before authorizing) — which kills the phish but adds a glance-and-confirm step. So:
- **Device flow done *securely* ≈ same friction as Phase A** (you confirm a code instead of clicking a pre-filled deep link). The "no page" dream costs a confirmation step.
- **Device flow done *insecurely* = phishable.** Not acceptable for auth (security checklist: impersonation/token-reuse).
- **Phase A (web OAuth → key embedded in the deep link / command) is NOT phishable** — the key is delivered to the *user's own authenticated browser session*, never pollable by a third party. And it's already built.

**Revised recommendation:** Phase A is likely the sweet spot. The device flow only wins if "distribute the one-liner from anywhere, zero website" is worth (a) a user-code confirmation step that erases most of its UX edge, and (b) building + securing a new auth surface. Decision is the founder's (security posture vs the no-page dream). Default if unsure: ship Phase A, skip the device flow.

**B1 (original note — loopback OAuth).** Today the website is the entry and the key rides in the command. The more magical version: the user pastes **one line into their agent** ("set up alexandria"), the agent runs an install command that opens GitHub OAuth in the browser, and the key returns to the agent automatically via a **localhost loopback** (setup spins a one-shot listener on `127.0.0.1:<port>` that the OAuth callback redirects to) — no key copy-paste, no website-first. This is "one sentence to your agent and you're off." Bigger build (loopback listener + a redirect mode on `/auth/github/callback`), so it's the fast-follow after A ships and proves the funnel.

**B2. Claude Code plugin (durable, auto-updating) — the permanent fix to a recurring cost.** The shim-drift notices `payload.sh` surfaces ("your local files differ from current factory, re-run setup") are a *recurring* maintenance tax paid by every Author forever — exactly the failure class *recurring problems demand permanent solutions* names. The permanent fix is platform-native auto-update: ship Alexandria as a CC plugin bundling the hooks + `/a` skill (+ optional MCP). Install: `/plugin marketplace add mowinckelb/alexandria` → `/plugin install alexandria`; it auto-updates, so drift stops existing rather than being re-patched each session. Two slash commands instead of a curl. Still needs OAuth/key — compose with B1's loopback. CC-only; the curl path stays the universal fallback for Cursor/Codex/Factory. (So B2 is not cosmetic — it retires a standing maintenance loop. Weigh against B1 when sequencing.)

### Phase C — PARKED (the "use any AI" add-on, Benjamin's "later")

**C1. Decouple capture from the active agent.** A standing local capture layer so AI thinking done *outside* the agent (Claude/ChatGPT web + desktop) still lands in `~/alexandria/vault/`. All routes are Bucket-1 (local process, sovereign). Ranked by **durability**, not just cheapness — reading undocumented local app log/DB formats is a brittle proxy that breaks every time an app ships an update (hard-code / dependency alarm), so it is a last resort, not the default:
  1. **Local MCP server (preferred):** durable, sanctioned, and it *also* unlocks Cowork + Claude Desktop (the two A2 over-claims) in one build — highest leverage.
  2. **Browser extension:** for web chat; a clean, store-sanctioned local surface.
  3. **Reading local desktop-app logs:** only if 1–2 don't cover a surface, and treat the format as a moving target.
  **Mobile ambient capture is a hard wall** (iOS sandbox) — phone stays share-sheet/keyboard. Build the OFF switch first; "it reads all your AI chats" is a heavy trust ask even when 100% local.

**C2. Cloud-file substrate for chat surfaces (PARKED — founder testing himself, 2026-06-23).** The reframe that landed this session: Alexandria's core is read/write to a *single sovereign source* (a2 ATOMIC DEFINITION), and that source can be remote as long as the connector is **first-party** (Alexandria never the bridge — the sovereignty carve-out already in a3 reason #1). Verified (cited research, 2026-06): chat-AI **write-back** to an external store exists today only via **Notion** (read+write both clients, but Notion-blocks + Notion-sees-data = trust downgrade) and **GitHub** (raw `.md`, first-party-trusted, but write needs ChatGPT dev mode + GitHub's MCP; Claude.ai web GitHub is read-only). Google Drive / Dropbox / OneDrive = read-only in the consumer connectors. **The unlock:** the Alexandria substrate is *already a GitHub repo* and GitHub is in the trust list — so the same repo a local agent drives via git, a chat AI can drive via the GitHub connector = one sovereign source, many surfaces, with a live local↔cloud sync keeping it unified. **Founder is testing the GitHub-connector path himself** before we build. Caveats to weigh when he reports back: it reopens Bucket 2 only on the sovereignty axis (reason #1); reason #2 (no hooks → manual, no auto-compounding — deferred efficiency) and reason #3 (commoditisation/moat) still stand. Do not build until founder's test + go.

## Cowork probe (30s, Benjamin runs in Cowork to confirm A2)

In a Cowork session, ask it to run: `date >> ~/alexandria/system/.cowork_probe`. Then check whether a SessionStart hook fired by inspecting whether `~/alexandria/system/.cc_session_open` updated. If hooks don't fire / it can't write locally, Cowork is confirmed unsupported via hooks.

## Principles check (post-/optimise)

- **Build as little as possible / delete before add:** Phase A adds zero infrastructure — it *deletes* a step + a browser round-trip and rewrites copy. Over-deleted by 10%: also removed the user having to type `begin` (agent auto-continues). ✓
- **Product is ground truth / every feature gets a mirror:** fixed the original gap — verification now points at the existing setup-report success rate + signup→begin funnel, with a baseline + a mirror asking "did completion actually rise," not a one-shot manual smoke test. ✓
- **Awareness upstream / false-negative rate:** the awareness pass caught a *second* canon over-claim (the `.mcpb` surface) I'd nearly missed — both corrected in A2. ✓
- **Recurring problems demand permanent solutions:** reframed B2 as the permanent fix to the standing shim-drift maintenance tax, not a nicety. ✓
- **Hard-code / dependency alarm:** reranked C to prefer the durable local-MCP primitive over brittle app-log scraping. ✓
- **Close the loop first:** A is the closed loop; B/C are downstream, not shipped until A proves out on the funnel. ✓
- **Bitter lesson / ride the exponential:** the auto-continue is a soft default (better agent → better follow); B1 loopback + B2 plugin ride sanctioned platform primitives; no hand-rolled harness, no schema. ✓
- **Armed not fired:** all build local; deploy + push are founder triggers. ✓
- **Socratic honesty:** stated plainly that no literal one-click exists for a local install; "one paste" is the real floor. ✓
- **Sovereignty:** nothing here routes cognition through the server; C explicitly stays local-process. ✓
- **Opportunity cost:** named the next-best alternative to A-first (build B1 directly) and why A-first wins (cheap closed loop, reused by B, not throwaway). ✓

## Fire checklist (when Benjamin says ship)
0. Capture the pre-ship signup→begin funnel baseline from `library-signal.ts` (so the mirror has a comparison).
1. `cd server && npm run build` (must pass) — already run during execute.
2. Visual-check the callback page: `node scripts/see.mjs <callback-preview-url>` (or review the HTML diff).
3. `cd server && npx wrangler deploy` → `curl https://api.alexandria-library.com/health`.
4. `bash scripts/push.sh` (setup.sh is not signature-gated; normal push, not ship.sh).
5. Smoke once (proxy): real signup → click `start in claude code` (deep link) → confirm CC opens with the command pre-filled → enter → install → auto-`begin`. If the deep link doesn't open CC (older version / not registered), confirm the copy fallback works.
6. **Loop (ground truth):** over the next days, watch setup-report success rate + whether signup→begin completion rose vs step-0 baseline. Surface in the morning brief; iterate if it didn't move.
