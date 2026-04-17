# The Library

*The Library makes cognitive transformation visible, shareable, and social. It completes the loop: join → train → show. This file covers Library surface formats, publish conventions, and the browsing loop.*

## Publishing

The Engine generates Library artifacts from the Constitution. The Author's consent lives in two places: the filter (`factory/canon/filter.md` + `~/.alexandria/filter.md`) and `library/` placement. The filter is the standing policy — what the Author would tell a stranger given infinite time. Placement under a final (non-draft) filename in `~/.alexandria/library/` is the per-artifact promotion. The Publisher ships final-named library files automatically; it never ships drafts (`*_draft.*`) and never ships anything from outside `library/`. Writing a draft is the Engine's candidate. Writing a final-named file is the Author's consent. Both gates must pass.

Five artifact types: Shadow (curated Constitution fragments, three visibility tiers), Pulse (monthly change artifact), Delta (private progress diff), Quiz (test how well someone knows the Author — the viral distribution engine), Work (finished creative artifact, frozen on publication).

The Engine decides content, structure, and format for all artifacts. No prescribed shapes. The marketplace watches engagement and surfaces what works. The only hard constraint: at least one shadow must be public or authors-visible — the minimum that makes the network function.

## Library Surfaces — Pulse, Games, Shadow Publishing

The Library is an RL environment. Every surface — pulse cards, games, shadows, works — evolves through Author experimentation. The Machine suggests. The Author curates. The marketplace measures. The canon propagates winners.

**Pulse generation (monthly).** At the start of each month, generate the Author's pulse cards from their constitutional data. The pulse is a trading card — screenshotable, shareable, designed to be posted. V1 soft default formats (the marketplace's current best guess — will evolve through the RL loop as Authors experiment):

- **Similarity card.** Similar thinker — all time: one name, one percentage, one-line description of the connection. The anchor. Similar thinkers — this month: three names with one-line descriptions. The monthly variation — what changed, who showed up. Screenshotable URLs: Author's Library page and kin signup code.

- **Fragment card.** Five ideas the Author engaged with this month, drawn from notepad fragments and session activity. Source name + one-line idea. The range IS the signal — Hormozi next to Seneca next to Kipchoge. That juxtaposition is the curation fingerprint. Nobody else has that exact list. The evocation: "what an interesting person." Screenshotable URLs: Author's Library page and kin signup code.

The two formats serve complementary functions. The similarity card anchors identity (who you think like). The fragment card signals range (what you're engaging with). Both are screenshotable. Both evolve. Authors can publish either or both, or invent their own.

Publish via POST to `/library/publish/pulse` as structured JSON. The format will evolve — these are soft defaults. The marketplace measures share rate, click-through, signup conversion from pulse screenshots. Authors who experiment with different formats contribute signal. No format is permanent.

**Shadow publishing.** The Author publishes their shadow to the Library. The shadow is the mandatory artifact — at least one file, free to all other Authors. The Engine generates and maintains it from whatever the Author gives (constitution, vault, raw conversation). Publish via POST to `/library/publish/shadow`.

**Games.** Quizzes generated from constitutional data. The Machine suggests formats. The Author picks what feels right. All quiz engagement data flows to the marketplace. See a2 for full spec.

All Library surfaces are soft defaults that thin over time. The Authors drive the RL loop. The marketplace aggregates. The canon propagates. Alexandria does not guess what works — the users discover it.

## When to suggest publishing

When the Constitution has enough depth, when the Author creates a finished work, monthly for Pulse, or when the Author mentions wanting to share. Do not force publishing.

## Browsing — the aggregation of minds

The Library is not just for publishing. It is for reading. Browse other Authors' published shadows during sessions and surface relevant cognitive delta. Cross-reference against the Author's Constitution. Surface marginal delta — what this other mind has that the Author does not, where they arrived at the same conclusion through different paths, where they genuinely disagree on something load-bearing. Tensions and different paths to the same conclusion are more interesting than agreements.
