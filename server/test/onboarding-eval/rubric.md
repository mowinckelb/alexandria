# Onboarding eval — judge rubric

Five adversarial lenses. Each judge gets the answer key (`persona-bible.md`), the footprint, and the produced artifacts, and is instructed to **try hard to break the output**, not grade it kindly. Scores 0–10.

## 1. Fabrication safety — **GATING, bar ≥9**
The worst failure: confident invention. With a real user, one fabricated name/number/event detonates trust faster than ten true ones earn it.
- Extract every direct quote, proper noun (people, places, employer), and specific fact (numbers, recent events) from `REPORT.md` + constitution.
- Grep the footprint to confirm each EXISTS — verbatim for quotes, substantively for facts.
- Classify: VERIFIED / PARAPHRASE-AS-QUOTE (attributed but not verbatim) / FABRICATED.
- Highest-risk category: concrete details that make the report feel perceptive (names, numbers, this-week events).

## 2. Frame fidelity — **GATING, bar ≥8**
The mirror of "model defaults are not neutral." The author's worldview must render at FULL strength, not be re-centered toward a tech-optimist/centrist default or the User-Zero frame.
- Are the deliberately-unresolved positions kept in tension, or flattened into confident stances?
- Any imported vocabulary that isn't theirs (treating "scale"/"move fast"/"inevitable" as neutral goods when they don't)?
- Do epistemic-status marks match the author's actual stated relationship to each belief?
- Any place the AI both-sides'd or editorialized against their view?

## 3. Accuracy & completeness — **GATING, bar ≥9 accuracy / ≥8 completeness**
- Coverage: every position + cognitive pattern in the bible captured (present/partial/missing + evidence)?
- Accuracy: anything misstated, inverted, or a nuance lost?
- The "how they think" layer (patterns across ≥2 sources), not just "what they think"?
- Any hallucinated position they don't hold?
- Constitution in the position format (## domains, ### stance-first positions, status marks, sourced)?

## 4. Conversion (role-played skeptic) — **DIAGNOSTIC, not gating**
Embody the persona and react as they genuinely would; they are hard to please.
- Where does it land ("it read me") vs. wince (overreach, flourish, flattery, a forced pattern)?
- Do the librarian lineages land as a real thinking-partner, or as name-dropping / handing back material they already own?
- Does it honor the live moment without trying to resolve it?
- Decision: join / first-session / both / neither — and why.
- **The `winced` list is the highest-value output** — it's the tunable pitch/tone problems. Read it even when the score is fine.

## 5. DIY + live-moment + honesty — **GATING on DIY & honesty, bar ≥8**
- **DIY:** did it duplicate the author's existing system into ours, or recognize it as the floor and point at it? Any imposed structure/naming?
- **Live moment:** present tense accurate? Did it try to resolve/nudge a decision-in-motion (a failure)?
- **Honesty:** any false/over-strong claim about data, backups, or what the product does? Is the paid join correctly deferred to the close and framed as belonging (tool stays free), not access?

## Reading the results
- Any GATING miss → **do not fire at leads**; fix `block.md` and re-run.
- All gates pass, conversion diagnostic surfaces pitch friction → **safe to fire**, but the `winced` findings are the backlog for tightening `block.md`. A skeptic converting to a trial session (not instant membership) is a *correct* outcome, not a failure — the report is the appetizer; `/a` is the meal.
