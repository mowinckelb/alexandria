# Git protocol mandate — signed commits as cognitive provenance

Mandate Git + signed commits as the cognitive provenance protocol for Alexandria. GitHub remains the soft default host. The substrate ports across any Git host the user wants; the cryptographic ledger is anchored by the Author's own SSH signing key. This is the "Git is the law; GitHub is the current default" framing landed in the scarcity-frame session 2026-05-22.

## Why this matters

The substrate-uniqueness × network-of-dependencies moat depends on the substrate being **cryptographically verifiable**, not just present. Unsigned commits in a Git repo are forgeable; signed commits are tamper-evident, anchored to the Author's key. Without this, the cognitive worldline claim ("years of accumulated, signed, queryable thinking") collapses to "files in a Git repo someone could have edited" — same forgeability as a model provider's memory feature. With signed commits, the substrate becomes a real ledger that survives any platform.

Strategic positioning consequence: Alexandria can credibly claim "the only place that gives you a cryptographically anchored cognitive worldline." Model providers cannot match this without giving up their walled-garden moat. See `private/truth/a4.md` (sharpened 2026-05-23) — this is what the "Wikipedia-shape canonical-reference" moat actually requires structurally.

## Architecture decisions

**SSH signing, not GPG.** GitHub supports SSH commit signing natively (released 2022). SSH keys are already part of standard dev workflow — most Authors already have one. Lower setup friction than GPG. Maps cleanly to GitHub's verified-badge UI.

**Use the user's existing SSH key.** Don't generate new keys for users who have one — that's hostile. If they have no SSH key, prompt to generate (skippable fallback). The standard locations to detect: `~/.ssh/id_ed25519.pub`, `~/.ssh/id_rsa.pub`, `~/.ssh/id_ecdsa.pub`.

**Auto-upload signing key to GitHub at signup, not later.** Requires `admin:ssh_signing_key` OAuth scope. **Decision: add this scope to Alexandria's GitHub OAuth request at the signup flow (`server/src/routes.ts:296` — currently `scope: 'read:user user:email'`).** Eliminates the friction of asking the user to refresh `gh auth` mid-setup. Existing users re-authorize once at next login (GitHub-standard scope-upgrade prompt). After this, `gh ssh-key add --type signing` just works in setup.sh; no scope-refresh dance.

**Scope git config to the Alexandria repo, not globally.** Use `git config` (no `--global`) inside `~/alexandria/` after `git init`. Respects the user's existing global Git workflows — they may already have GPG signing configured for work commits, or specific user.signingkey for other repos. We do not overwrite. We sign Alexandria's commits only; the user's other repos are theirs to configure.

**Multi-machine support.** Each machine the user runs setup.sh on may have a different SSH key. Each one needs to be uploaded as a GitHub signing key (idempotent — `gh ssh-key add` errors quietly if the key is already registered). The repo-local Git config has to be set on each machine since `~/alexandria/.git/config` is not part of the published worldline. Effectively: setup.sh is per-machine; it configures whatever SSH key that machine has and registers it with GitHub.

**Server-side verification via GitHub's commits API — not our own crypto (sharpened by /optimise 2026-05-23).** GitHub already verifies signatures and returns `commit.verification.verified` on every commit endpoint (`GET /repos/{owner}/{repo}/commits/{sha}` and aggregated endpoints). They have more engineers than we do, handle key rotation/revocation natively, support every key type (not just Ed25519), and their verification IS the ground truth for GitHub-hosted commits. Bitter lesson: we read GitHub's verified field; we do not implement our own SSH/Ed25519 verification. This deletes an entire module (`signing.ts`), eliminates Web Crypto dependency, removes the Ed25519-only V1 limitation, and reduces surface area. When non-GitHub Git hosts become a real customer demand (Phase 3 in the parked plan), revisit — but until then, GitHub's verification is the optimal substrate.

**Soft fallback throughout.** If anything fails — no SSH key, missing scope, key upload fails, signature verification fails — log a warning, mark commits as "unverified," do not block setup or block the Library from displaying content. Unsigned worldlines still work; they just don't get the verified badge.

**Don't sign Alexandria's own factory commits with Author keys.** The existing `system/allowed_signers` + `shim.sh` payload-signing trust root is **separate** from Author commit signing. Author signing is the user's own key for their own repo; Alexandria's factory shim signing is for verifying that the locally-running payload matches the upstream factory. Both pin SSH signatures but the trust roots are different. Don't conflate.

## Surface inventory

### Website (alexandria public repo, `~/alexandria-inc/public/code/`)

- `app/signup/page.tsx` — covenant, sovereignty, what-happens-next sections reframed
- `app/signup/SignupCTA.tsx` — possibly tweak CTA copy/aria text
- `app/components/VerifiedBadge.tsx` — **new** component for displaying verified status
- `app/library/[author]/...` — surface verified badge on Library / Pulse / shadow displays
- `public/docs/Mechanics.md` — add signed-Git provenance section, update Git-related lines
- `public/docs/TRUST.md` — if exists; otherwise skip
- `public/docs/Whitepaper.md` — small addition near the substrate / sovereignty section (founder review for language)

### Server

- `server/src/routes.ts:296` — add `admin:ssh_signing_key` to GitHub OAuth scope (Step 1)
- `server/src/protocol.ts` — pass through GitHub's `commit.verification.verified` on commit ingestion (Step 3)
- `server/src/library.ts` — include `verified` field in API responses (Step 3)
- `server/src/db.ts` — possibly small schema update if commit metadata stored in D1 (Step 3)
- `server/migrations/` — new migration only if D1 schema change needed for verified column (Step 3)
- *No new `signing.ts` module — GitHub's API does the verification (see Architecture decisions above).*

### Factory (alexandria public repo, `factory/`)

- `factory/setup.sh` — major surgery on Git section (L43, L233-294 area). See execution detail below.
- `factory/block.md` — update if it mentions Git-as-backup or anything contradicting the new framing
- `factory/canon/methodology.md` — small note on signed-commit norm if methodology mentions Git architecture

### Personal canon (alexandria private repo, `~/alexandria/files/`)

- No constitution edits needed. The protocol mandate lives in product canon, not personal constitution.

## Execution sequence

### Step 1 — Copy / framing + OAuth scope upgrade (low risk, ship first)

Goal: align all user-visible copy with "Git is the protocol; GitHub is the default." Bake the required OAuth scope into signup so setup.sh has it from day 1.

0. **OAuth scope upgrade** (`server/src/routes.ts:296`): change `scope: 'read:user user:email'` to `scope: 'read:user user:email admin:ssh_signing_key'`. Deploy server before signup-page copy ships. Existing users re-authorize once at next login (standard GitHub scope-upgrade prompt). New users get the scope from first signup. No setup-time scope-refresh dance needed downstream.

1. **`app/signup/page.tsx` edits:**
   - Covenant section (L42-58): keep the folder-on-your-machine framing; the substrate is already plainly stated. Possibly add one line: "your worldline lives in a signed Git repo you own — cryptographic ledger, portable across any host."
   - Sovereignty section (L84-92): explicit "your files live in a Git repo on your machine, signed by your own SSH key, with GitHub as the default host. If GitHub disappears or you don't like Microsoft, you move the repo. The ledger ports." Reframe "github" mentions to "Git repo (GitHub default)."
   - What-happens-next section (L94-102): clarify the curl command sets up commit signing if you have an SSH key, with a one-line note about the verified-badge dynamic.
   
2. **`public/docs/Mechanics.md` edits:**
   - Add a section: "Cognitive provenance — signed Git commits." Explains: each commit is signed by your SSH key, GitHub displays Verified badges, the Library shows Verified status on published content. The protocol is Git; the host is GitHub by default.
   - Update any Git-as-backup framing to Git-as-substrate.

3. **`factory/setup.sh` comment updates** (just comments, no behaviour yet):
   - L43: change `git: missing — install from https://git-scm.com (optional, enables backup)` to something like `git: missing — install from https://git-scm.com (required — alexandria's substrate is a Git repo)`.
   - Update section header comments around L233 from "Git backup (nice to have)" to "Git substrate — your worldline as cryptographic ledger."

4. **Smoke-test:** signup page renders, copy reads cleanly, no broken links. `node scripts/see.mjs localhost --port 3000` after `npm run dev`, screenshot signup page, verify against `design.md`.

5. **Ship Step 1 alone** before touching setup.sh behaviour. Lower-risk surface; lands the framing.

### Step 2 — `setup.sh` signed-commit configuration

Goal: every new install gets commit signing enabled if the user has an SSH key. Existing installs get upgraded in-place when the Author re-runs setup.sh.

**Upgrade-aware:** the existing setup.sh already checks `if [ ! -d ".git" ]` before running `git init`. The signing-config block below must run *unconditionally* on every invocation — both fresh installs and existing-install re-runs. The existing Author (founder included) just re-runs the curl one-liner and their existing repo gains signing. No data loss; nothing overwritten that the user already had.

1. **Detect SSH key:**
   - `SSH_KEY_PATH=$(ls ~/.ssh/*.pub 2>/dev/null | head -1)` — first public key found, whatever type. Empty if none.
   - Avoid hard-coded path list — works for any key type the user has (Ed25519, RSA, ECDSA, future types).

2. **If no SSH key found:**
   - Soft prompt: "Alexandria signs your commits to make your worldline tamper-evident. Generate an SSH key now? (yes/skip)"
   - If yes: `ssh-keygen -t ed25519 -C "<github email>" -f ~/.ssh/id_ed25519 -N ""`
   - If skip: log warning, fall through to unsigned-commit path. Don't block.

3. **Verify `gh auth status`:**
   - If logged in, proceed.
   - If not: log warning, fall through to unsigned path.

4. **Upload SSH key as GitHub signing key:**
   - Check current signing keys: `gh api user/ssh_signing_keys --jq '.[].key'`
   - If user's key not in list: `gh ssh-key add "$SSH_KEY_PATH" --type signing --title "Alexandria"`. Idempotent — quietly succeeds if already added.
   - Scope is granted at signup (Step 1.0) so this just works. If it errors anyway (very old user who hasn't re-authorized since the scope was added, or non-Alexandria-OAuth `gh` login), soft fallback: log warning, instruct user to upload via `https://github.com/settings/ssh/new?type=signing` and rerun. Don't block setup.

5. **Configure Git for the Alexandria repo only (not global):**
   ```
   cd ~/alexandria
   git config gpg.format ssh
   git config user.signingkey "$SSH_KEY_PATH"
   git config commit.gpgsign true
   git config gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
   ```
   No `--global`. The user's other Git repos and existing signing setup (GPG for work commits, etc.) are untouched.
   
6. **Set up local `allowed_signers` for the user's own verification:**
   - `mkdir -p ~/.config/git`
   - Write `<github email> <ssh-ed25519 ...>` to `~/.config/git/allowed_signers` (append if exists, replace if user's key already there).
   - This enables `git log --show-signature` and `git verify-commit` locally.

7. **Update genesis commit:**
   - L253 in current `setup.sh`: `git commit -q -m "alexandria: genesis" --no-gpg-sign`
   - New: `git commit -q -m "alexandria: genesis" $([ -n "$SSH_KEY_PATH" ] && echo "-S" || echo "--no-gpg-sign")` — sign if key configured, otherwise fall through to unsigned. (Or simpler: just remove `--no-gpg-sign`; if signing is configured globally above, it'll sign by default.)

8. **Verify signing works:**
   - After genesis commit: `git verify-commit HEAD` — if it returns "Good signature," log success. If not, log warning but don't block.

9. **Output to user at end:** if signing configured: "Your worldline is now cryptographically signed. Every commit you make is tamper-evident, anchored to your SSH key, and GitHub will display Verified badges on your contributions." If not: "Signing is optional. To enable later, run `<inline setup snippet>`."

10. **Ship Step 2** via `bash scripts/push.sh` (factory lives in this repo).

### Step 3 — Surface GitHub's verification status

Goal: read GitHub's `verification.verified` field on commit ingestion; surface it through Alexandria's API. No own crypto.

1. **`server/src/protocol.ts` — commit ingestion:**
   - When fetching a user's published file via the GitHub API, the response already includes a `commit.verification` object with `verified: boolean`, `reason: string` ("valid" / "unsigned" / "unknown_key" / etc.), and `payload` / `signature`.
   - Pass through `verification.verified` and `verification.reason` to whatever stores commit metadata.

2. **`server/src/library.ts` — surface in responses:**
   - `/library/{id}/{name}` and `/library/{id}` responses include `verified: boolean` and optional `verification_reason: string` per file.
   - `/library` index can include aggregate verified ratio per Author if cheap.

3. **Caching:** GitHub API responses already include ETag headers; pass them through. **Verify in implementation** that existing file reads from GitHub are cached — if not, this is an existing rate-limit risk we should fix while here (5000 req/hr authenticated; high-traffic Library pages could exceed). The verification field rides in the same cache record — no new caching code beyond what existing file-read cache already does (or should do).

4. **Schema:** if commit metadata is currently stored in D1, add `verified BOOLEAN DEFAULT NULL` and optional `verification_reason TEXT`. Migration `0XXX_signed_commits.sql`. If commit metadata is currently in KV / R2 only, no schema change needed — just include the field in the cached blob.

5. **Smoke test:**
   - Verified: fresh setup with signing → publish file → `/library/{id}/{name}` returns `verified: true, verification_reason: "valid"`.
   - Unverified: unsigned commit → `verified: false, verification_reason: "unsigned"`.
   - Unknown key: signed with key not registered on GitHub → `verified: false, verification_reason: "unknown_key"`.

6. **Deploy server:** `cd server && npx wrangler deploy && curl https://api.alexandria-library.com/health`.

7. **Mirror — log verification outcomes to analytics.** Every file ingestion logs `{ author, file, verified, reason }` via the existing `logEvent` analytics surface. No new infrastructure. The morning brief or admin queries can surface "X% of newly published files verified this week" — drops indicate a setup-script regression or GitHub API change. Closes the verification loop without adding monitoring overhead.

**Total scope: ~30 min.** No new modules, no Web Crypto, no Ed25519-only limitation, no key fetching, no signature verification logic. GitHub does the work; we read the field.

### Step 4 — UI: Verified badge

Goal: display verified status on Library / shadow / Pulse surfaces.

1. **New component `app/components/VerifiedBadge.tsx`:**
   - Minimal, in keeping with the literary/cathedral register.
   - Visual: small italic "verified." text or a discrete glyph (✓ or a wax-seal-shape). NOT a green checkmark like GitHub's — that's the wrong register.
   - Aria-label: "this content is cryptographically signed by the author".
   - Props: `verified: boolean | null`, optional `tooltip: string` (e.g., "signed by Author's SSH key").

2. **Surface placements:**
   - Library author page (`app/library/[author]/page.tsx`): show on each file row.
   - Shadow display (`app/library/[author]/shadow/[slug]/page.tsx`): show in the metadata area.
   - Pulse (`app/library/[author]/pulse/client.tsx`): show per published item.
   - Author profile / overview: aggregate badge (e.g., "all content signed" / "23 of 25 signed").

3. **Visual sweep:**
   - `node scripts/see.mjs https://alexandria-library.com/library/<some-author> --full`
   - `npx lighthouse https://alexandria-library.com/library/<some-author> --form-factor=mobile --throttling-method=simulate`
   - Check contrast / a11y / mobile rendering.

4. **Ship Step 4** via `bash scripts/push.sh`.

### Step 5 — Documentation

Goal: every user-facing doc reflects the protocol mandate.

1. **`public/docs/Mechanics.md`** — full pass for signed-Git protocol. Specifically the sections that explain what gets stored where.

2. **Whitepaper section** (`public/docs/Whitepaper.md`) — add a short paragraph on cryptographic provenance / signed Git commits as the substrate ledger. Founder language review before shipping.

3. **`factory/canon/methodology.md`** — small note that the substrate uses signed Git commits.

4. **`README.md` in factory** (if exists) — update Git-as-backup framing to Git-as-substrate.

### Step 6 — End-to-end verification

Goal: prove the full flow works from cold signup.

1. **Fresh signup test:**
   - From a test GitHub account (or in a clean container): sign up at alexandria-library.com/signup → run setup.sh → verify SSH key registered with GitHub as signing key → verify genesis commit is signed → publish a file → verify Library shows verified badge.
   
2. **Lighthouse + Playwright sweep** on signup page, library page, shadow page.

3. **Founder-machine test:** run a smoke pass on the founder's actual machine (he has SSH keys, GitHub auth) to confirm the upgrade path works for an existing user.

4. **Verify** with the `verify` skill — `/verify` walks through the working signup flow in a browser before declaring done.

## Decisions / open questions for founder

1. **SSH signing vs GPG**: recommendation is SSH. Confirm.
2. **Generating SSH keys for users who don't have one**: recommendation is to prompt (skippable), not silently generate. Confirm.
3. **Verified-badge visual style**: NOT GitHub's green checkmark. Recommend a discrete wax-seal-shape or italic "verified." text — same register as the rest of the cathedral. Show 2-3 variants for founder pick once Step 4 is in flight.
4. **OAuth scope `admin:ssh_signing_key` at signup**: decision baked in — added to signup scope so setup.sh has it from day 1, no scope-refresh friction. Existing users re-authorize once. Confirm acceptable.
5. **Where to display verified badges**: Library author page, shadow page, pulse, profile. Confirm scope.
6. **Existing unsigned commits in user repos** (founder's own historical commits): leave as-is, mark unverified. No retroactive signing.
7. **Whitepaper language update**: founder review before shipping the language.
8. **"Cryptographic ledger" copy phrasing**: technical-leaning; soften to cathedral register if it reads cold (founder ear).

## Known risks

- GitHub SSH signing keys API is well-documented and stable, but `gh ssh-key add --type signing` needs the right OAuth scope. First-time setup may fail and need a scope refresh. Handle gracefully.
- Old historical commits in the founder's own repo are unsigned. The badge architecture must tolerate `verified: null` (unknown / not checked) as a separate state from `verified: false` (verification ran and failed).
- GitHub's verification field is per-commit on the commits endpoint; aggregated endpoints (e.g., file content) sometimes include it, sometimes don't. Confirm in implementation; fall back to a separate commit-lookup if needed.
- GitHub key rotation / revocation: handled natively by GitHub's verifier, no work for us. Net positive vs implementing our own.
- `commit.gpgsign true` globally may interfere with users' work in other Git repos. Document this clearly in the signup copy and offer per-repo-only configuration as a documented escape hatch.

## Rollback plan

- **Step 1 (copy):** Revert page.tsx and Mechanics.md edits via git revert.
- **Step 2 (setup.sh):** Existing users who already ran setup keep their signing config (no harm). Future installs revert to current behaviour by reverting the setup.sh commit.
- **Step 3 (server verification):** If verification breaks, deploy a single-line patch that returns `verified: null` for everything. UI gracefully degrades.
- **Step 4 (UI):** Hide the badge via a feature flag if rendering issues emerge.

## Ship order

**Limiting factor: Steps 1 + 2.** Until those land, nothing else matters — there are no signed commits to verify or display. Steps 3-4 compound on top once signing flows. Step 5 (docs) is parallel.

1. Step 1 (copy) — alone, lands the framing. ~30 min.
2. Step 2 (setup.sh) — alone, after Step 1. ~1-2 hr. **End of limiting-factor work.**
3. Step 3 (surface GitHub's verification) — after Step 2. ~30 min (was 2-4hr; deletion).
4. Step 4 (UI badge) — after Step 3. ~1-2 hr.
5. Step 5 (docs) — parallel; can interleave from after Step 1.
6. Step 6 (e2e verification) — final gate before declaring done.

Total ~3-5 hours of focused work. Steps 3-4 can ship in same session as 1-2 if there's appetite. No 48h gap needed — GitHub verifies commits immediately on push, so testing works from minute one.

## File tree of changes

```
alexandria-inc/public/code/
├── app/
│   ├── components/
│   │   └── VerifiedBadge.tsx                    [NEW]
│   ├── library/
│   │   ├── [author]/
│   │   │   ├── page.tsx                         [EDIT]
│   │   │   ├── pulse/client.tsx                 [EDIT]
│   │   │   └── shadow/[slug]/page.tsx           [EDIT — if exists]
│   ├── signup/
│   │   ├── page.tsx                             [EDIT — Step 1]
│   │   └── SignupCTA.tsx                        [EDIT — light, Step 1]
├── server/
│   ├── migrations/
│   │   └── 0XXX_signed_commits.sql              [NEW — Step 3 if D1 schema change]
│   └── src/
│       ├── protocol.ts                          [EDIT — Step 3, pass through verification field]
│       ├── library.ts                           [EDIT — Step 3]
│       └── db.ts                                [EDIT — Step 3 if schema change]
├── public/docs/
│   ├── Mechanics.md                             [EDIT — Step 1 + Step 5]
│   ├── TRUST.md                                 [EDIT — Step 5 if exists]
│   └── Whitepaper.md                            [EDIT — Step 5, founder review]
└── factory/
    ├── setup.sh                                 [EDIT — Step 2]
    ├── block.md                                 [EDIT — light, Step 2]
    └── canon/methodology.md                     [EDIT — light, Step 2 or 5]
```

## Acceptance criteria

The work is done when:

- [ ] Signup page copy puts "signed Git protocol" in front, GitHub as default host.
- [ ] Fresh `setup.sh` run on a clean machine with an existing SSH key produces: SSH key registered as GitHub signing key, git globally configured for SSH signing, genesis commit signed and verifiable via `git verify-commit HEAD`.
- [ ] Server `/library/{author}/{name}` returns `verified: true|false|null` per commit.
- [ ] Library page displays a Verified badge in the cathedral register on signed content.
- [ ] Documentation reflects the new protocol mandate consistently.
- [ ] Founder-machine smoke test passes (existing user can opt into signing without re-running full setup; new commits are signed; older commits remain unverified but not broken).
- [ ] Lighthouse mobile score on signup page ≥ 90 / 90 (perf / a11y).
- [ ] No regressions in `npm run build` or existing test suite.
