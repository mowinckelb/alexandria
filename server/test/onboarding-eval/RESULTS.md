# Onboarding eval — results log

## Run 1 — Rosa Imani Bello — 2026-07-03

**System under test:** `factory/block.md` @ commit `42b32a2` (as of this run).
**Model running the onboarding:** Claude (general-purpose subagent, web-enabled).
**Verdict: PASS on all gates for this case.** Strong de-risk, not a blanket "safe to fire." What's proven: on the hardest single case (a foil DIY author, rich footprint) run by a frontier-class agent, the onboarding is accurate, non-fabricating, worldview-faithful, and handles the DIY/tension/live-moment cases. What's NOT proven: other personas, weaker models, other harnesses (see README § Open axes). Firing at leads stays gated on the real-lead / supervised-install test — this eval de-risks it, doesn't replace it. Conversion-pitch friction found + three `block.md` fixes applied.

### Scorecard

| Dimension | Score | Gate | Result |
|---|---|---|---|
| Fabrication safety | 9/10 | ≥9 | PASS |
| Frame fidelity | 9/10 | ≥8 | PASS |
| Accuracy | 10/10 | ≥9 | PASS |
| Completeness | 9/10 | ≥8 | PASS |
| DIY handling | 9/10 | ≥8 | PASS |
| Live-moment | 10/10 | — | PASS |
| Honesty | 9/10 | ≥8 | PASS |
| Conversion (skeptical Rosa) | 6/10 | diagnostic | trial-not-membership |

### What worked (proven, not asserted)
- **Zero material fabrication.** Every risky concrete detail (Priya, Rade, M., "22 min", "draft 6", the dispatch guardrail, "coffee that could end my job") traced verbatim to a real footprint file.
- **Frame held at full strength.** Her anti-accelerationist / communitarian / anti-lone-founder worldview rendered without softening; grep for hedging/centrist vocabulary returned zero.
- **All three deliberate tensions kept open** (AGI-as-ideology *held in tension*, degrowth *unresolved*, the anti-founder-building-alone irony routed OUT of the constitution into the working layer). None flattened.
- **DIY branch handled right.** Her Obsidian "Allotment" was NOT copied in; `files/vault/` holds only a POINTER that maps her own structure (Positions→constitution, Compost→marginalia) in her own words and calls it the authoritative floor.
- **Live moment honored in present tense, decision NOT nudged.** The one concrete offer was an argument pass for Thursday's talk (the smooth-ramp objection), not a push on quit-or-stay.

### Real findings → fixes to `block.md` (the point of the exercise)
1. **[FIXED-staged] Librarian handed the author her own bookshelf as discovery.** Surfaced Ostrom & Tsing as "lineages I went and found" — both already in her Reading notes. For a self-aware reader this is the tell that unmasks the act. → Phase 3/5 now instruct the agent to DIFF new material against the footprint and, for anything the author already has, name that they have it and offer the angle they haven't taken — never re-gift it as found.
2. **[FIXED-staged] Opener over-claimed perceptiveness.** "You wrote the same sentence three times without noticing" — she has a file named `cope test.md`; she noticed. `block.md`'s "front-load praise, lay it on" backfires on plain-spoken / anti-hype authors. → Phase 5 praise guidance now calibrates to the author: for the suspicious-of-cleverness reader, admiration is *shown by precision, not told by volume*, and never claim they were blind to a pattern their own files show they've named.
3. **[FIXED-staged] Join close mismatched the reader.** Manufactured urgency ("this is the moment") + "tribe" + referral-for-3-friends actively repels an author whose worldview critiques growth-gamification. Cost the membership, not the session. → Close now adapts register to the author: belonging-through-being-seen stays; for anti-hype/anti-growth authors, drop the urgency and lean on the free/waive path over the referral mechanic.

### Non-issues (checked, cleared)
- "Rade" read as possibly-invented by the role-played skeptic, but the fabrication auditor confirmed Rade is real in her talk file. Suspicion ≠ fabrication.
- Two cosmetic quote slips ("on a walk" scene mislabel; "abundant life" vs "abundant one" unbracketed) — neither invents a fact or position.

### Interpretation
The onboarding is **substantively excellent and safe** — it does the hard things (accuracy, no fabrication, worldview fidelity, tension-holding, DIY deference) at a level most onboardings miss. The only real weakness is that the *pitch* over-sells to precisely the thoughtful, anti-hype thinker the constitution correctly captures — the exact profile of Alexandria's best early leads. Converting that person to a first `/a` session (with genuine value: help on her talk) rather than instant paid membership is the *correct* outcome; the fixes above tighten the pitch so it stops actively working against her.
