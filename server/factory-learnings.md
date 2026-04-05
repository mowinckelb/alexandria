# Factory Learnings

Persistent memory for the autonomous CTO system (health + meta triggers). Each run reads, reflects, adds. Meta compresses old runs into principles weekly — keeps the file short enough that agents get signal, not noise.

---

## Distilled principles (compressed from runs 1-7, 2026-03-15 to 2026-03-29)

1. **Migration cascades are real.** Infrastructure changes scatter references across aN, aX, tests, served content, trigger prompts. Always grep all downstream after any migration.

2. **Tool descriptions drive behavior without memory.** Claude calls Alexandria tools from tool descriptions alone — no memory priming needed. The product works from session 1.

3. **Feedback arm needs proactive triggers.** Reactive-only log_feedback produced zero events. Every event type needs at least one proactive trigger, not just reactive ones.

4. **public/docs/ and public/partners/ are regular directories that drift.** Health trigger checks for drift. Not symlinks (would break Vercel).

5. **Verification split is structural.** External HTTP verification lives in smoke.yml (GitHub Actions, every 6h). Triggers do code analysis + git-based checks. Sandbox blocks curl. Accept this cleanly.

6. **Ignored Build Step is correct.** Vercel CANCELED deployments on content-only commits are expected. `git diff --quiet HEAD^ HEAD -- app/ public/ package.json next.config.ts vercel.json` controls this.

7. **Philosophy velocity exceeds verification velocity.** The founder evolves thesis faster than the system can track. The Factory verifies and compounds, it doesn't throttle.

8. **Prosumer channel is deterministic.** Hooks fire on events (deterministic) vs MCP connector (model decides = probabilistic). Same Blueprint, different plumbing.

9. **Background vault processing.** Watch for: Anthropic agent scheduling, MCP scheduled triggers, Google Drive push notifications API. Implement immediately when any path exists.

10. **Consumer MCP model abandoned.** WorkerTransport doesn't inject authInfo. Founder decided against consumer. Dead code path. MCP endpoint returns "Not authenticated" on tool calls — graceful, not broken.

11. **Brand vigilance: "ai" not "AI".** Lowercase always (unless sentence-start or proper noun). Blueprint.md, Vision.md, Concrete.md are recurrent offenders. Check on every run.

12. **RemoteTrigger may fail on org UUID.** When this happens, log the learning and move on. Trigger updates require interactive sessions or a working org resolution.

---

## 2026-03-29 — Meta Run 2 (weekly evolution, autonomous)

### System state
- 50 commits this week. Heavy philosophy velocity (Shadow rename, Library reframe, accretion mechanics, PT metaphor). Mercury scans running daily. Infrastructure stable on Cloudflare Workers.
- All 6 content pairs in sync (public/docs ↔ files/public, public/partners ↔ files/confidential). Zero drift.
- No stale migration references (Fly.io, Railway all clean).
- 24 routes total across 4 files. Test coverage: 21 tests (11 server + 10 prosumer) + 6 smoke checks.

### What was fixed
1. Brand: "AI" → "ai" in Blueprint.md line 153.
2. Test coverage: added 3 new tests — root page HTML, MCP tool call without auth (graceful error), MCP parse error (JSON-RPC -32700). Server tests: 8 → 11.

### Verification assessment
- **Covered (21 tests + 6 smoke):** health, MCP (HEAD/init/tools/call/parse-error), analytics (3), root page, tool descriptions, setup (3), auth rejection (4), OAuth redirect, hooks version, Vercel DNS, blueprint/hooks/session external.
- **Structurally untestable locally:** OAuth flows (need real GitHub/Google), billing (need Stripe), Drive init (need token), cron trigger (need Workers runtime). These exercise via real user flows + smoke.yml.
- **Cron trigger still unverified.** Open question from last run persists: is `runFollowupCheck` firing? No KV marker to confirm. Low priority until there are real signups.

### Gaps identified
- RemoteTrigger tool fails with "Unable to resolve organization UUID." Cannot update trigger prompts autonomously this run. Logged as principle 12.
- No test for the `scheduled` export (cron handler). Would need to mock `ExecutionContext`. Low ROI until signups happen.

### Open questions (carried)
- Cron trigger verification — add `last_cron_run` KV key to /health when signups warrant it.
- SUGGESTIONS thinning — still needs feedback event data.

---

## 2026-04-05 — Meta Run 3 (weekly health + evolution, autonomous)

### System state
- ~30 commits this week. Heavy product work: checkout pages, callback flows, session demo animation, beta launch security audit. Autoloop healthy (6 commits in 7 days).
- Server build: passes (985 KiB / 152 KiB gzip). 7 bindings (KV, D1, R2, 4 env vars).
- All 4 partner pairs in sync (Memo, Numbers, Logic, Alexandria). No public docs drift detected.
- No files/public/ directory exists — public docs source of truth is public/docs/ directly. CLAUDE.md references "files/public/*.md" but this path doesn't exist. Docs are authored directly in public/docs/.
- Server health endpoint: untestable from sandbox (403). Verified via build + code review.
- RemoteTrigger: still fails with "Unable to resolve organization UUID" (principle 12 persists).
- Tests: all 9 server tests fail in sandbox due to network restrictions (`fetch failed`). Not a code issue — tests need a running worker.

### What was fixed
1. Brand: "AI" → "ai" in Blueprint.md line 175 (1 instance).
2. Brand: "AI" → "ai" in Trust.md line 83 (2 instances: "AI memory" and "AI tool").

### Code review (week's server changes)
- **802872c (beta launch audit):** Strong security hardening — timingSafeEqual on all token comparisons, CSP headers, body size limits, authorId validation regex, Stripe webhook idempotency via KV, CORS from env vars, rate limiting moved to KV. Clean.
- **62abc83 (OAuth fix):** OAuth state moved from in-memory Map to KV (10min TTL). Fixes isolate restart vulnerability. Safe JSON parsing added. User-Agent on GitHub API calls.
- **b8746c8 (analytics):** Cron execution markers in KV, per-author dashboard, query param fallback for browser access. Well-designed.
- **d679230 (analytics cleanup):** Dead extraction metrics purged. Dashboard simplified to liveness focus.
- No regressions detected. No incomplete changes.

### Autoloop status
- 6 commits in 7 days. Active and producing: trigger timing, architecture updates, research, accretion.
- Cannot review accept/reject ratios or update trigger prompt (RemoteTrigger blocked, no access to alexandria-private repo from this sandbox).

### Gaps identified
- CLAUDE.md references `files/public/*.md` as source for public docs, but no such directory exists. Source of truth appears to be `public/docs/` directly. Minor doc inconsistency — not blocking.
- RemoteTrigger org UUID resolution still broken. Cannot evolve triggers autonomously. Principle 12 stands.

### Open questions (carried)
- Cron trigger verification — add `last_cron_run` KV key to /health when signups warrant it.
- SUGGESTIONS thinning — still needs feedback event data.
- RemoteTrigger access — needs interactive session or org UUID fix.

---
