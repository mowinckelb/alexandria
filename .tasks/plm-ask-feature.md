# PLM "ask this mind" — Library twin section (STAGED, NOT DEPLOYED)

Built 2026-07-03 (single weights twin). Extended 2026-07-05 into a proper PLM
section: **two twin variants, per-variant visibility, and a programmatic API.**
This is the a2 "ship the surface first" path and the plm.md § both-twin
architecture — **both + router, always a floor**:

- **weights twin** — the PRIVACY FLOOR. A LoRA compiled from the Author's
  substrate; the constitution is baked into the weights, so nothing at query
  time exposes it and no prompt-injection can exfiltrate a system prompt that
  was never there. Cheap, always-safe → the stranger-facing default.
  **Default visibility: PUBLIC.** Never uses tools (small fine-tuned model, no
  native tool-use).
- **context twin** — the FIDELITY CEILING. A frontier model reading the
  Author's substrate in context. Higher fidelity (≈human self-consistency in
  the pilot) but it EXPOSES the substrate at query time — so it is gated.
  **Default visibility: AUTHORS** (authenticated Alexandria members, where
  seeing the substrate is acceptable). Runs on a frontier model that can
  natively use tools → carries a `tools` capability flag + the tool-use seam.

**Everything is built + tested (builds + screenshots). Nothing is deployed.
The founder ships it.** No `wrangler deploy`, no `push.sh`, no `ship.sh` was run.

---

## What was built (this extension)

### Backend (Worker — TypeScript)

- **`server/src/twin.ts`** — REWRITTEN for two variants. `resolveTwinVariants`
  returns `{ weights, context }`; both fall back to env defaults; a **flat
  legacy `settings.twin` blob is read as the weights variant** (back-compat,
  zero migration). New: `authorizeTwinAccess` (delegates to
  `file-access.authorizeFileRead` — the single visibility brain, no parallel
  system), variant-aware `twinDisclaimer`, per-variant `twinPublicSummary`
  (viewer-relative `accessible` flag), and `runTwinInference` extended to carry
  the variant + the **tool-use seam** (see below). `resolveTwinConfig` kept as a
  weights-only shim.
- **`server/src/library.ts`** — MODIFIED inside `registerLibraryRoutes`:
  - `GET /library/:author` now resolves the (optional) viewer and returns
    `twin: { enabled, label, variants: [{variant, visibility, label, tools,
    accessible}] }` — only ENABLED variants, each with a viewer-relative
    `accessible` flag from the gate. Never leaks a checkpoint/model handle or
    system line. `enabled`/`label` retained for the old single-box client.
  - `POST /library/:author/ask` — accepts `{ question, variant?, invite? }`.
    Anonymous allowed (public floor). Picks the variant (explicit → must be
    enabled; else weights floor → context ceiling), applies the gate, relays to
    inference, writes the `twin_query` ledger row. Rate-limited 8/min per
    IP+author.
  - `POST /v1/twin/:author/query` — **NEW programmatic API** (see contract).
  - `POST /library/:author/twin` — owner-only config, now **per-variant**
    (nested `{ weights, context }`; legacy flat fields still accepted → weights).
    Validates visibility ∈ {public,authors,paid,invite} and `checkpoint`
    tinker:// shape. Returns the resolved per-variant state.
  - Shared `runTwinQuery` core + `validateTwinInvite` + `resolveTwinAccessor`
    helpers back both `/ask` and `/v1/...` — one gate + inference + ledger path.
- **`server/wrangler.toml`** — added `DEFAULT_TWIN_CONTEXT_MODEL = ""` (the
  frontier model the context twin reads substrate in context by). Existing
  `TWIN_INFERENCE_URL`, `DEFAULT_TWIN_BASE`, `DEFAULT_TWIN_CHECKPOINT` unchanged.

### Frontend (Next.js — website)

- **`app/library/[author]/AskThisMind.tsx`** — REWRITTEN. Renders only the
  variants the server says the viewer can reach. Two accessible → a labelled
  **quick / deep toggle** (accent underline on active; a small accent `tools`
  badge when the context variant has tools enabled). One accessible → that box,
  no toggle. Zero → not rendered. Variant-aware disclaimer (weights vs context),
  answered-variant indicator. Matches the site aesthetic exactly (EB Garamond,
  warm cream, single tyrian-purple accent per design.md).
- **`app/library/[author]/client.tsx`** — passes `variants` (was `label`);
  `AuthorData.twin` type updated to carry `variants`.
- **`app/api/library/[author]/ask/route.ts`** — unchanged (already forwards the
  JSON body + cookie/auth; the `variant` field rides through).

### Inference sidecar (the ONE integration point — unchanged, private repo)

`~/alexandria-inc/private/plm/twin_server.py`. The Worker relays to it and holds
only its URL + a bearer secret. For **weights** it receives `{variant:'weights',
checkpoint, base, system, question, max_tokens}` — never any Author private data.
For **context** it receives `{variant:'context', model, system, question,
max_tokens, tools}` and loads the Author's substrate ITSELF (Author-side, never
through the Worker) — which is why the context variant is gated up-front.

---

## Config shape (schemaless — `authors.settings.twin`, no migration)

```jsonc
{
  "twin": {
    "weights": {
      "enabled": true,
      "visibility": "public",              // default public
      "checkpoint": "tinker://…",          // Author-owned weights handle (not a secret)
      "base": "Qwen/Qwen3.6-35B-A3B",
      "label": "trained on my constitution, sessions, voice memos.",
      "system": "You are …"                // optional identity line
    },
    "context": {
      "enabled": false,
      "visibility": "authors",             // default authors (exposes substrate)
      "model": "claude-…",                 // frontier model id (not a secret)
      "label": null,
      "system": null,
      "tools": false                       // tools capability flag (seam; see below)
    }
  }
}
```

Back-compat: a flat `{ "twin": { "enabled": true, "checkpoint": "…", … } }` (the
old single-twin shape) is read as the **weights** variant and upgrades to the
nested shape on the next owner write. Env defaults
(`DEFAULT_TWIN_CHECKPOINT`/`_BASE`/`_CONTEXT_MODEL`) fill unset handles — the
User-Zero path (`{ "enabled": true }` is enough to go live off the deploy-time
default).

## Visibility mapping (REUSES file-access.ts — no parallel access system)

`authorizeTwinAccess` delegates the whole decision to
`file-access.authorizeFileRead`, mapping the twin context onto the file gate:

| twin visibility | who can query | how it maps to `authorizeFileRead` |
|---|---|---|
| `public`  | anyone (incl. anonymous) | public branch |
| `authors` | any authenticated Alexandria member | authors branch (needs auth) |
| `invite`  | holder of a valid invite code (`?invite=` / body `invite`) | `context.inviteValid` (same `access_codes` table as files) |
| `paid`    | holder of an active Alexandria subscription | `context.purchaseValid` ← subscriber (twins are metered-per-query, not one-time-bought — plm.md § payment) |
| (owner)   | the Author, always, any visibility | owner bypass |

Denials return the file-gate's status (401/402/403) with the offending
`variant`. A viewer who can reach both variants sees the toggle; one → that box;
none → no section.

## Tools capability seam (design only — NOT executed)

- **Flag:** `settings.twin.context.tools` (boolean). Surfaced publicly so the UI
  can badge it. Weights variant is hard-forced `tools: false` in
  `resolveTwinVariants` — a small fine-tuned open model has no native tool-use.
- **Seam:** in `runTwinInference`, `toolsRequested = req.variant==='context' &&
  req.tools===true` marks where tool definitions + the tool-execution loop would
  attach before/around the sidecar call. It is threaded to the sidecar in the
  body; **no local tool loop is built** (tool execution is a separate epic). The
  comment marks the exact attach point.

## API contract — `POST /v1/twin/:author/query`

Plug an Author's twin into your own app.

- **Auth:** API key — `Authorization: Bearer alex_…` (reuses `auth.ts`
  `findByApiKey`). No anonymous, no cookie. 401 if missing/invalid.
- **Rate limit:** 30/min per API-key owner (KV, self-expiring). 429 on excess.
- **Gate:** same visibility gate — the KEY OWNER's access level decides which
  variants they can hit (owner of the twin always; else public/authors/paid/
  invite as above).
- **Request body:** `{ "question": string (≤2000), "variant"?: "weights" |
  "context", "invite"?: string }`. `variant` omitted → weights floor, else
  context. `invite` (or `?invite=`) unlocks an invite-gated variant.
- **Success `200`:** `{ "answer": string, "variant": "weights"|"context",
  "disclaimer": string }`.
- **Errors:** `400` bad/missing question or author id · `401` no/invalid key ·
  `402` subscription required (paid variant) · `403`/`401` invite/authors gate ·
  `404` author or requested variant not available · `429` rate limited ·
  `502/503/504` inference offline/upstream/timeout (503 = `TWIN_INFERENCE_URL`
  empty ⇒ "twin offline", zero-regret).
- **Ledger:** every answered query writes one `twin_query` row to `access_log`
  (`tier` = variant; `meta` = `{q_len,a_len,variant,surface}`) — the
  internal-credits primitive, queryable per author + per variant.

Example:
```bash
curl -X POST https://api.alexandria-library.com/v1/twin/mowinckelb/query \
  -H "Authorization: Bearer $ALEX_KEY" -H "Content-Type: application/json" \
  -d '{"question":"how do you think about the bitter lesson?","variant":"weights"}'
```

## Owner config — `POST /library/:author/twin`

Owner-auth (API key or library session). Body (any subset):
```jsonc
{
  "weights": { "enabled": true, "visibility": "public", "checkpoint": "tinker://…", "base": "…", "label": "…", "system": "…" },
  "context": { "enabled": true, "visibility": "authors", "model": "…", "label": "…", "system": "…", "tools": true }
}
// legacy flat { "enabled", "checkpoint", "base", "label", "system" } → applies to weights
```
Returns `{ ok, enabled, label, variants, weights:{enabled,visibility,has_checkpoint,base}, context:{enabled,visibility,has_model,tools} }`.

---

## Tested

- `cd server && npm run build` (wrangler dry-run) → **PASS** (all twin vars bound,
  incl. `DEFAULT_TWIN_CONTEXT_MODEL`). `npx tsc --noEmit` → **clean**.
- `npx tsx test/file-access.ts` → 44 passed · `test/gate-matrix.ts` → 12 passed
  (the reused visibility brain — twins ride it, unchanged).
- `npm run build` (Next / app build) → **PASS** (ask route + author page
  compiled; the only failures were sandbox Google-Fonts fetch, not code).
- Visual: temp preview route (`app/twinpreview`, since removed — zero residue) +
  `scripts/see.mjs` at desktop 1440 + mobile 390, both-variants (quick/deep
  toggle + tools badge) and single-variant (no toggle) states. Read the PNGs,
  evaluated vs design.md — on-brand, one strategic accent, clean hierarchy,
  16px inputs (no iOS zoom). Screenshots: `.see/localhost_{desktop,mobile}_2026-07-05T19-20-09.png`.

---

## Deploy steps (founder-only — armed, not fired). EXACT step:

1. Start the sidecar (holds Tinker/model keys + does context substrate loading):
   ```
   cd ~/alexandria-inc/private/plm
   TINKER_API_KEY=$(cat ~/alexandria/system/.tinker_key) \
   TWIN_INFERENCE_SECRET=<pick-a-secret> \
   .venv/bin/python twin_server.py --port 8899
   cloudflared tunnel --url http://localhost:8899   # expose it
   ```
2. Point the Worker at it — in `server/wrangler.toml` set
   `TWIN_INFERENCE_URL = "https://<tunnel>/infer"`, then
   `cd server && wrangler secret put TWIN_INFERENCE_SECRET` (same secret).
   Set the User-Zero defaults: `DEFAULT_TWIN_CHECKPOINT` (weights; current v7 =
   `tinker://c639a409-c90b-596c-bb3c-84290d2638db:train:0/sampler_weights/final`,
   8/20 sign-off — below the "mediocre-twin-worse-than-none" bar, decide before
   shipping the floor public) and `DEFAULT_TWIN_CONTEXT_MODEL` (frontier, 16/20).
3. Enable the founder's twins per-variant (owner-auth):
   ```
   curl -X POST https://api.alexandria-library.com/library/mowinckelb/twin \
     -H "Authorization: Bearer $ALEX_KEY" -H "Content-Type: application/json" \
     -d '{"weights":{"enabled":true,"visibility":"public","label":"trained on my constitution, sessions, and voice memos."},
          "context":{"enabled":true,"visibility":"authors","tools":false}}'
   ```
4. **Deploy — the exact step (founder-only):**
   ```
   cd server && npx wrangler deploy && curl https://api.alexandria-library.com/health
   # website: bash scripts/push.sh   (or Vercel deploy)
   ```
   Neither the server (`factory` canon/hooks untouched) nor this change is
   signature-gated, so `push.sh` is correct for the website — **not** `ship.sh`.

## Open decisions (founder)

- **Ship the weights floor public on v7 (8/20)?** — the bad-twin brand risk
  (plm.md risk #1). The context ceiling (16/20, authors-gated) is the safe
  default to ship first; push the weights floor further (Playbook Lever 2, OPD)
  before making it the public stranger-facing box, or gate it to `authors` too
  until it clears the bar.
- **Credits pricing + settlement** — `twin_query` rows are recorded per
  author+variant; the debit amount + `billing_tab` settlement path is
  deliberately NOT built (don't ship half a money rail). plm.md § payment:
  context rides the querier's own AI sub (stateless), weights is metered on the
  internal credits ledger.
- **Tool execution** — flag + seam only; the execution loop is a separate epic.
- **Streaming** — MVP is awaited; can slot behind the same box/API.
