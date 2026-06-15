# Follow-up — foundation.md invariant re-ship (awaiting founder passphrase)

The foundation/founder canon split + sovereignty hardening shipped + verified live (commits `2bf8805`,
`4903692`). The ax-sync derivative pass is **done** (commit below): a closer read found only
`public/docs/Mechanics.md` was materially stale (module count + pre-notify-pull update model) — fixed.
Memo/Whitepaper "two layers" hits were false positives (outputs-vs-bodies, mind.md-vs-mind.py);
investor.md/fundraise.md canon mentions are still valid under the new model; Brief.md has none.

## The one remaining item

`factory/canon/foundation.md` has a one-line invariant correction in the working tree (the shipped
version overclaimed — said "nothing is auto-applied / a leaked key can't push," but the payload
auto-updates under signature; `shim.sh:98-100`). Corrected to: cognition is pull-only; the verified
mechanism (payload) auto-updates under signature as the deliberate fast-security channel; a leaked key
could push mechanism code, never silently rewrite cognition.

**Deploy with the founder's passphrase:**
```
bash factory/ship.sh "fix: foundation invariant — cognition is pull-only, mechanism auto-updates under signature"
```
Re-signs manifest + foundation.md. **Do NOT commit foundation.md via plain git** — it desyncs the
signed manifest and breaks the integrity gate for every Author. Low urgency (inaccurate claim, not
exploitable). Delete this file once shipped.
