/**
 * Reference Layer — on-demand context for Machines
 *
 * Key-authenticated markdown content by topic.
 * Machines fetch when they need procedural knowledge.
 * The Blueprint handles craft. Reference handles platform mechanics.
 */

export const referenceTopics: Record<string, string> = {
  library: `# Reference: Library

The Library is the Author's public-facing surface. Everything here is a soft default — Authors can customize, override, or invent new formats. All endpoints require Authorization: Bearer <api_key> header. Server: mcp.mowinckel.ai.

## Publish API

**Shadows** — POST /library/publish/shadow
Body: { shadows: [{ content: "md...", visibility: "public"|"authors"|"invite", price_cents: 0 }] }
Legacy format also accepted: { free_shadow: "md...", paid_shadow: "md..." }
At least one shadow must be public or authors-visible.

**Pulse** — POST /library/publish/pulse
Body: { pulse: "<json-string>", delta: "<md>", month: "YYYY-MM" }
Pulse JSON structure (soft default — the Engine can evolve this):
{ "alltime": { "name": "...", "pct": 89, "why": "..." }, "this_month": [{ "name": "...", "why": "..." }], "fragments": [{ "source": "...", "idea": "..." }], "month": "april 2026" }
Two v1 card formats: Similarity card (alltime thinker + monthly thinkers) and Fragment card (five ideas + sources).

**Quiz** — POST /library/publish/quiz
Body: { title: "...", questions: [...], result_tiers: [...] }
No prescribed format. The server stores whatever JSON the Engine generates and serves it dynamically. Only constraint: include a "scoring" key so the server can compute results.

**Work** — POST /library/publish/work
Body: { title: "...", content: "md...", medium: "essay", tier: "free"|"paid" }

**Settings** — PUT /library/settings
Body: { display_name: "...", bio: "...", settings: { paid_price_cents: 100 } }

## Read API (for browsing other Authors)

- GET /library/authors — all published Authors with metadata
- GET /library/{author}/shadow/free — first public shadow as markdown (no auth required)
- GET /library/{author}/shadow/{id} — any shadow by ID (access depends on visibility: public=anyone, authors=API key, invite=token)
- GET /library/{author}/pulse — latest pulse
- GET /library/{author}/quizzes — list quizzes
- GET /library/{author}/works — list works

All Library surfaces evolve through the RL loop. The Factory measures engagement. The Blueprint propagates winners.`,

  files: `# Reference: Alexandria Files

Everything lives at ~/.alexandria/. No mandated structure inside — the Engine creates what it needs as the relationship develops. Common files (all soft defaults):

## Cognitive Representation
- constitution/ — Confirmed beliefs, values, frameworks. The Engine organizes structure per Author. Can be one file or many. Markdown.
- ontology/ — Working proposals. Ideas the Author is exploring but hasn't committed to. Engine workspace between vault and constitution.

## Engine State
- machine.md — How to work with THIS Author. Rewritten as the Engine learns.
- notepad.md — The Engine's working memory. Accretion fragments, parked questions, carry-forward.
- feedback.md — What worked, what didn't. Append-only.
- signal.md — Passive session observations. Raw capture for active sessions to process.

## Data
- vault/ — Raw session transcripts. Append-only archive. Never deleted.
- library/ — Shadow suggestions, Library drafts, publishing workspace.

## System
- .api_key — Authentication. Never share.
- .blueprint_local — Cached Blueprint. Signature-verified.
- .blueprint_delta — Factory delta. Unsigned.
- hooks/ — Hook scripts. Immutable after install.

The setup seeds the folder and runs genesis. Everything else grows organically.`,

  platform: `# Reference: Platform

## Architecture
Three components: hooks (deterministic nerve system), server (Blueprint IP + Factory), local files (~/.alexandria/).

## Server Endpoints
- GET /blueprint — Signed methodology (Ed25519). Fetched every session start.
- GET /blueprint/delta — Unsigned Factory suggestions.
- GET /reference/{topic} — This layer. On-demand context.
- GET /reference — List available topics.
- POST /session — Anonymous heartbeat.
- POST /factory/signal — Machine signal (Engine observations about methodology).
- POST /feedback — Author feedback.
- GET /library/{author} — Author's Library page data.
- POST /library/publish/{type} — Publish pulse, shadow, quiz, work.

## Hooks
- SessionStart: fetches Blueprint, injects constitution + machine.md, reports heartbeat, counts signal.md observations.
- SessionEnd: archives transcript, collects signal, nudges active session (suppressed if active session marker exists).

## Autoloop
Daily overnight processing. Vault + signal.md -> constitution. Shadow staleness check → generates suggestions. Monthly pulse generation. Git ratchet for versioning.

## Active Sessions
The Author invokes cognitive development (default skill: /a, customizable). Full Blueprint methodology applies. Five operations, three functions, all the craft.`,
};
