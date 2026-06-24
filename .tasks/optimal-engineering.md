# Optimal product engineering — re-derived from the 2026-06-23 model

**Trigger:** founder asked for a first-principles derivation of optimal engineering given the new ground truth (three-layer product/protocol/library; vehicle = angel + movement + dogfood, NOT venture-scale; browse-free/pay-for-depth; neo-biography as the object). ax/investor docs handled in a parallel tab — this is product engineering only.

## The objective-function shift

Old (implicit): venture-scale product → robust infra for growth, convert at scale.
New: the **thinnest** thing that (a) Benjamin **dogfoods** daily, (b) a **movement of his circles** can use, (c) concentrates net-new build on the **Library hub** (the one piece that doesn't exist, where the moat lives), (d) **rides** git/GitHub/agent/model for everything else, (e) **idiot-index→1** — near-zero opex, structural unkillability, solo founder + AI.

## The limiting factor (Elon move: name it first) — and it shifts

Stated precisely (the fused version, post-optimise): the current limiting factor is **"Benjamin has a neo-biography page so good he wants to share it."** That single thing is the dogfood proof, the distribution prerequisite (you can't distribute a page that isn't worth sharing), and the moat surface — all at once. It does not exist in the right form yet, so **right now the limiting factor IS an engineering build** (the one in Move 1).

**Then it shifts.** Once that page exists and is genuinely share-worthy, the limiting factor moves to **distribution** (getting his circles to it) — which is mostly NOT engineering. At that point the right instinct flips: stop building, and the founder's attention goes to distribution, not maintenance. So the sequence is: one focused build to clear the current constraint → then engineering recedes and stays receded. "Best part is no part" governs everything *after* this one page. (This resolves the apparent contradiction of "do less engineering" while "Move 1 is an engineering focus": engineering is on the limiting factor *now*, and recedes the moment it's cleared.)

## Grounded state (verified in code 2026-06-23)

- **Product (factory/) + Protocol (server/src/protocol.ts, file-access.ts): already thin.** Rides git/GitHub for backup/sync/signing/history — no duplication. Unstructured markdown, soft defaults, bitter-lesson-clean. **Verdict: leave alone. Done.**
- **Library/hub neo-biography page: exists functionally but fragmented.** `/library/{author}` renders only protocol `.md` files. The data for the real object — Shadow (the quizzable twin = the moat), Works (any medium), Quizzes, Pulse — exists server-side but is hidden in separate API routes / a `/checkout/` flow. Browse-free target already met (public, no auth to view). **Gap: surface it as the unified, entity-centric, medium-agnostic, quizzable-shadow-forward neo-biography page.**
- **~3500 lines of venture-scale machinery** in server/src: billing.ts (1475), cron.ts (476), analytics.ts (397), email.ts+templates (497), marketplace*.ts (334), audit.ts (319), plus company-scale routes.

## The optimal engineering — three moves

### MOVE 1 (build, the focus) — the neo-biography hub page
The single limiting-factor-serving build, because this one page is **three things at once**: the moat surface (the shadow/twin), the browse-free acquisition funnel (public, shareable, the distribution artifact), and the **dogfood proof** (Benjamin's own page, finally worth sharing). And it's mostly *surfacing data that already exists*, not net-new infra.

- **Static-first — build even less (post-optimise, the biggest fix).** The "quizzable twin" is NOT a hosted chatbot. Per canon, *the reader's own Engine processes the shadow MD against their own Constitution locally — no live inference on the author's side, zero tokens spent per query.* So the page serves a **pullable `shadow.md`** + pre-generated **Quizzes/Pulse** (already static artifacts) — the "quizzing" happens in the *visitor's* AI. This kills any inference infra, opex, and per-query cost (idiot-index→1, sovereign, canon-aligned). Agent-less visitors get the Works as social proof; deep interaction needs their own agent (acceptable — target is prosumers + circles). A hosted-inference shadow is a *deferred maybe*, only if the funnel measurably needs it — not built now.
- **Beautiful frontend is justified, not bloat.** The backend is thin/static, but the *page itself must be beautiful* — form is content; art is evocation; the neo-biography's job is to *change the visitor* who encounters a mind. That's why it's a custom page, not a raw GitHub-repo render. Spend the craft here (design.md / Taste.md); keep the serving thin.
- Repurpose `app/library/[author]/page.tsx` + `client.tsx` into the unified entity page: Shadow (pullable + "open in your agent") front-and-center, Works (medium-agnostic list), Quizzes, latest Pulse. De-emphasise raw `.md` files (metadata, not the headline). One server call returns all artifacts (extend the `/library/{author}` response in `library.ts`). Browse-free stays; pay-for-depth gates the deep tiers. ~400–600 lines of mostly-frontend, a repurposing not a rewrite.
- **Co-requisite — the page is only worth building if the gym produces share-worthy artifacts.** The page is a *view*; the ground truth is a visitor being *changed* by encountering Benjamin's mind. If his Works/Shadow are thin, the gap is product/Publisher quality + his own usage, NOT the page — building it then is polishing an empty room. So verify his artifacts are share-worthy as the page is built; they are co-requisite.
- **Verification (close the loop):** done ≠ "the page renders." Done = a real person visits Benjamin's page, is moved enough to engage/share, and the existing browse-free funnel signal (library-signal.ts) moves. The product is the ground truth, not the build.

### MOVE 1b (build, small) — frictionless onboarding (the other distribution surface)
From the earlier thread, now correctly reframed by the three-layer model: the frictionless paste installs the **free product + protocol** (the gym + the sovereign `mind.md`); the account/sign-in is the **opt-in Library hub** step, genuinely later. This is the "free to start, hub later" shape — which the new model makes *correct*, not a compromise. The deep-link `start` button (already built this session) + keyless-install path serve this. Don't over-engineer auth (the device-flow/payment-funnel anxiety was venture-shaped — drop it).

### MOVE 2 (delete, parallel) — idiot-index→1 is STRATEGIC here
Every maintained module is opex + founder-attention stolen from the limiting factor. So deletion isn't hygiene — it directly frees the constraint. Judge by **maintenance/attention-burden, not line-count** (line-count is a proxy; a 1500-line module that never breaks costs less than a 300-line one that pages you). **And the scan over-rotated on "delete everything" — apply judgment:**
- **SAFETY GATE FIRST (awareness / false-negative):** before deleting any module, verify it is NOT touched by the **autoloop** or anything Benjamin **dogfoods** (e.g. cron may be load-bearing for overnight constitution processing or the morning brief — grep the call paths before cutting). A silent deletion that breaks the dogfood loop is the most expensive miss. Verify, then cut.
- **KEEP, simplified — billing.ts:** the transitional **floor**; canon has it live at the door. *De-gold-plate* (trial → $10/free-with-kin → cancel; strip patron/invoice/edge machinery). **Founder call to flag:** at circle-scale + angel-funded, is *automated* billing even needed yet, or defer it until the movement asks to pay? Lean keep-simplified (it's built; rebuild is wasteful), but the "when does revenue matter" timing is genuinely yours.
- **KEEP — the founder-facing signal** (morning brief / library-signal.ts): dogfooded. **Thin** analytics to just the funnel signal he reads.
- **DELETE (after the safety gate) — user-facing venture-retention machinery:** automated re-engagement nudges + followup sequences, drip email templates, analytics dashboards, the premature cross-author marketplace ranking, the hash-chained audit mirror. Rebuild any *when a real user demands it*, not before.
- The "Company layer shrinks" goal in CLAUDE.md, executed.

### LEAVE ALONE — product + protocol
Already thin and git-riding. Touching them is motion without progress.

## The gate over everything — dogfood
Benjamin is user-zero. The test for every build/delete: **does he use it himself?** Move 1 makes *his* page worth sharing (the proof). Move 2 deletes what he doesn't touch. If a feature isn't something he uses, it doesn't survive.

## Sequencing
1. **Now:** Move 1 (neo-biography page) — the limiting-factor surface, mostly surfacing existing data.
2. **Parallel/after:** Move 2 (delete bloat) — frees the founder, lowers opex.
3. **Fold in:** Move 1b (onboarding) — already partly built.
4. **Never:** rebuild deleted machinery speculatively; touch the thin product/protocol.
