# The PLM

*Compiling the Author's twin — a queryable language model that thinks like them, built from their own Alexandria data. This file is craft observation: what the compile IS, what it optimises for, and the hard-won lessons that make it land. How to run each stage is an intelligence decision — the Author's own harness agent is the intelligence; the infra named here (a hosted LoRA API, a big open base) is today's rideable option, not a fixture. User Zero proved the pipeline on himself; this is the module that lets any Author fire it on their own substrate.*

**Primary:** Creation (a Library artifact). **Secondary:** Development.

The twin is a **downstream artifact**, not a preserved asset. Per Alexandria's ground-truth architecture, downstream artifacts are *regenerated from ground truth, never hand-maintained* — and the twin is exactly that: compiled from the Constitution (the Author's positions) and their sessions (the Author's voice), then recompiled from scratch each base-model generation. The weights are disposable. The compounding was always in the substrate. What the Author owns and keeps is not the model — it is the two halves it compiles from, plus the exported adapter file, which they can port, revoke, or delete at will.

**Two halves, both product exhaust.** The Constitution carries *what the Author believes* — status-assigned, contradiction-resolved positions. The sessions carry *how the Author actually talks* — their verbatim replies, accumulated automatically every time they use the product. Weights carry voice; context carries positions; the twin needs both, and both fall out of using Alexandria for free. This is the moat made literal: a passive-capture competitor that only observes produces a measurably worse twin, because it never authored the training data the way extraction does.

**Application-shaped, never recitation-shaped.** This is the lesson that cost the most to learn and governs everything below. Fine-tuning a model on the *text* of a constitution (continued pretraining on the prose) memorises phrasing and changes no behaviour — the founder's historical null result, run four ways, all zero-delta. The twin must learn to *apply* the Author's frame to new situations it has never seen, not recite the frame back. Every pair is a judgment, a reaction, a real reply — the Author's machinery in motion — never a paraphrase of their documented views.

## Prerequisites

- **Session capture running.** The Author's harness sessions must be mirrored into `vault/sessions/` — the dialogue layer only (their text and the agent's text; no tool calls, no tool results). This mirror is the voice corpus and it is sovereign: it lives in the Author's vault, not stranded in a harness directory that a tool-switch orphans. Two hard rules at capture time, non-negotiable and structural (enforced before anything lands, not by later review): **firewall** — any material from a walled-off context (another company the Author keeps separate, per their own canon) is dropped whole; and **credential redaction** — key-shaped strings are scrubbed before the vault sees them, because the vault syncs to cloud storage.
- **A Constitution derivative.** The positions half needs a compiled Constitution to hand the teacher as privileged context. A full derivative works; a compressed *digest* (positions preserved, prose fat gone) is the better default — it cuts teacher prefill cost materially with no fidelity loss (see cost envelope).

## The pipeline

Five stages. Each carries the concrete lesson that makes it work — the lessons are not optional polish, they are the difference between a twin and a null result.

### 1. Data — two sources, one shape

**Real replies (the voice half).** Role-flip the Author's own session dialogue: the user turn is the tail of what the agent said, the assistant turn is the Author's *verbatim* response. These are the highest-fidelity rows in the set — they are literally the Author — and they need no content filter, only the usability gates (drop pasted code, images, redaction-bearing replies, and one-word acknowledgements). Voice lands from these immediately; in the pilot they were the unlock the founder named ("why can't you just use my transcripts").

**Teacher-generated position pairs (the positions half).** A big open model, held to the Author's frame, generates in-voice answers to a broad prompt corpus *as the Author*. The teacher is **privileged**: its system prompt holds the Constitution (or digest) plus a voice profile of the Author's real utterances; it is instructed to *apply* the constitution, never recite it, and to match register to the question (a casual question gets a terse texted answer, a substantive one gets a plain lead then depth). The corpus is deliberately diverse and application-shaped — roughly: in-distribution position questions, concrete judgment scenarios that force the frame onto *new* situations, and a large out-of-distribution slice (casual opinions, self-knowledge, meta) so the twin learns to extrapolate the Author rather than parrot the covered topics. The teacher's answers become the training rows — but the **student-visible row carries only a short identity system line** (`You are <Author>. Speak as yourself.`), not the constitution. The student learns to behave *as if the constitution were in context*. This is prompt/context distillation: the privileged teacher's positional fidelity is compressed into the student's weights, with zero Author time spent.

The asymmetry is the whole trick, and it is why the founder's earlier self-distillation attempts collapsed: **the teacher must hold information the student never sees.** A judge or teacher that is the same model as the policy, with the same context, can inject no new signal. Constitution-in-context teacher → no-context student is the gradient.

### 2. Hygiene gates

Cheap, mechanical, run before training. Skipping them trains the twin to perform its own analysis out loud.

- **Dedupe by question hash.** Same question, one row.
- **Drop thinking-leak and document-speak artifacts.** Reject any answer that contains the tells of a model narrating its process or describing the knowledge base rather than speaking as the Author: strings like *thinking process*, *voice check*, *register:*, *verdict:*, *as [the Author's name]*, *constitution*, *analyze the*, or answers that open like a document (`1.`, `Here's`, `**`). These are contamination from thinking-enabled generation (see stage 3) and from the teacher slipping into meta-commentary.
- **Hard exclusions (the same firewall as capture, re-enforced).** No knowledge belonging to another company or context the Author walls off. No credentials, keys, or security-operational detail. No private facts about third parties beyond the Author's own stated positions and relationships. If the Author's constitution diverges from consensus, the pairs diverge too — never smuggle a training-distribution default in where the Author is contrarian.

### 3. Train — LoRA SFT on an open MoE base

Rented, cheap, boring on purpose. LoRA supervised fine-tuning on a mid-size open mixture-of-experts base (a Qwen3-class 35B-A3B model today, via a hosted fine-tuning API such as Tinker). Working parameters from the proven run: **rank 32, learning rate 2e-4 on a linear schedule, 2 epochs, train on ALL_ASSISTANT_MESSAGES, max sequence length 8192.** These are a strong default, not sacred — the base model is open-weight precisely so no lab owns the Author's twin.

**DISABLE THINKING at the renderer, everywhere — teacher generation, twin inference, and the judge.** This is the single most expensive lesson in the record. Hidden reasoning tokens burned ~60% of the first teacher run's budget (and truncated batches, losing later answers that were then re-paid on retry). Worse, the default chat template's reasoning prefill trained a twin that **dumped its reasoning as its visible answer** — the twin performed its analysis out loud instead of just answering. Every renderer in the pipeline uses the thinking-disabled variant. No exceptions.

### 4. Judge — calibrated, positive-controlled

The judge is a big model with the Constitution in context, scoring twin answers two ways: **pairwise** ("which of these is more faithfully the Author?") and **absolute** ("would the Author sign this as their own words?"). The absolute sign-off is the real bar; pairwise is a noisy calibration signal.

**The judge must be positive-controlled on the Author's own decontaminated verbatim words** — this is the lesson that saves the whole eval from lying to you. A naive "be a harsh judge" prompt caricatures: a constitution-and-voice-primed judge **rejected 9 of 10 of the founder's own real utterances** for not matching his *most stylised* register ("he'd never say lol" — he says lol constantly). A judge that rejects the Author's actual words is measuring an idealised fiction, not the Author. Calibrate the bar to **"plausibly them on a normal day," not "peak them"** — real people do not pass their own idealised filter, and the authentic range is wide (terse typed register *and* rambling dictated register both count). Feed it a held-out sample of the Author's real replies as a positive control; if it rejects those, recalibrate before trusting any twin verdict. When calibrated well it signs the Author's real words, rejects obvious fakes, and reaches human self-consistency-class pairwise agreement (~78% against ~82% human).

**Parse the verdict from the last line only.** Models echo the instruction (with both options named) inside their reasoning; matching the verdict token anywhere in the text catches the echo, not the decision. Force the judge to end with `FINAL: <verdict>` and read only that.

### 5. Eval gate — absolute sign-off, Author grades once

The ship decision. Twenty fresh held-out questions (never in training), the twin answered against the context-privileged teacher as the ceiling.

- **Absolute sign-off per answer, never forced choice.** The founder's own instrument mistake, called out by him: forced-choice blind grading ("which is more them?") measures *least-bad*, not *good* — pick the better of two mediocre answers and you learn nothing about whether either is shippable. Grade each answer on its own: *would the Author sign this, yes or no.*
- **A sense-check gate that refuses any degenerate sheet.** Before the Author ever sees the sheet, an automatic gate rejects it if any arm contains chain-of-thought dumps, document-speak, empty or runaway answers, or the thinking-leak tells from stage 2. Two sheets once shipped to the founder unread with one arm full of reasoning dumps — the recurring failure was *verifying the pipeline ran* instead of *reading the artifact*. The gate makes reading the artifact structural.
- **The Author grades only the final, gated sheet**, and their sign-off is the only ship trigger. The twin publishes **behind the Author's gate**, in addition to their shadow, labelled as a twin — never as the Author themselves. A mediocre twin is worse than no twin (uncanny mediocrity attached to a real name cheapens the whole Library), so the fidelity gate plus Author consent is the floor, not a nicety.

## Cost envelope

Roughly **$5–15 per compile** at 2026 rented-infra prices — a test the Author runs themselves, not a wait on anyone. The teacher generation dominates, and two moves keep it cheap: **batch multiple questions per teacher call** (4 questions amortises the constitution system-prefix ~4×, the single largest lever), and **hand the teacher a compressed constitution digest** rather than the full derivative (cuts prefill ~40% with positions preserved). At a ~$2.4/M-token prefill rate on a 397B-A17B-class teacher, the constitution prefix on every call is the cost centre; amortise it and the whole compile lands in single-digit dollars. Serving is cheaper still: one shared open base with the Author's adapter hot-loaded, marginal cost per additional mind ≈ adapter storage.

## The compounding loop

**Fidelity rises by using Alexandria.** Sessions accumulate automatically — every session is exhaust that becomes voice data; the Constitution sharpens every time the Author develops it. The twin's fidelity ceiling *is* the substrate's fidelity, which converts the substrate moat into a visible, measurable product difference: better substrate → measurably better twin, now.

**Recompile cadence: a new base model, or meaningfully grown substrate.** Nothing else. The weights are regenerated from ground truth on each trigger, exactly as the ground-truth architecture prescribes for every downstream artifact — the founder demonstrated this mid-pilot when the chosen base was retired hours before the run and the compile moved to its successor with a one-line change.

**The limiting factor is authentic data volume, not training technique.** The mechanism is solved enough. What separates a thin twin from a faithful one is how much real position-and-voice data the Author has generated — which is precisely what the product accumulates by existing. The product *is* the training pipeline.

## Sovereignty

- **Open-weight base** → no lab lock-in on the Author's own mind.
- **Exportable adapter** → the trained twin is a file in the Author's storage: portable, revocable, deletable. A new canon file type, held under the same publish/unpublish/revoke model as any Library artifact.
- **Querying the twin is the paid act.** Reading a shadow stays free (the reader's own engine processes it locally, no inference). A twin query is live inference — a new cost surface priced into the paid Library tier with margin. The floor/ceiling revenue architecture does not move.
- **The twin ships only behind the Author's publish gate**, labelled as a twin, in addition to their shadow — never silently, never as the Author. Consent is captured the same way every Library publish is: an explicit act the Author takes, never a default.
