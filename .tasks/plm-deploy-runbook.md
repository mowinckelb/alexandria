# PLM — press-go deploy runbook (2026-07-05)

Everything is built, tested, and committed locally. This is the exact sequence to take the twins live. Founder-fired (deploy + keys + sidecar are your triggers). Red-team decisions baked in: **launch the deep twin (invite, 16/20) first; leave the public weights box dark until it clears the bar.**

## State
- **Weights twin (public floor):** v7, `tinker://c639a409-...:train:0/sampler_weights/final`, sign-off 8/20. BELOW the "mediocre-twin-worse-than-none" bar → keep it OFF/invite for now.
- **Context/deep twin (invite ceiling):** frontier + your constitution+voice in context, 16/20. Ships first. Tools: works=on (living page), web=off (flip on with a search key).
- All code committed (public repo: twin.ts, library.ts, AskThisMind, /v1 API; sidecar: `~/alexandria-inc/private/plm/twin_server.py`). Nothing deployed.

## Steps

**1. Start the inference sidecar** (holds all keys; the Worker never does). On your always-on machine:
```
cd ~/alexandria-inc/private/plm
TINKER_API_KEY=$(cat ~/alexandria/system/.tinker_key) \
ANTHROPIC_API_KEY=<your anthropic key> \
TWIN_INFERENCE_SECRET=<pick a strong secret> \
TWIN_FRONTIER_MODEL=claude-sonnet-4-6 \
.venv/bin/python twin_server.py --port 8899
# (optional web search later:  TWIN_SEARCH_KEY=<brave key>  and set context tools.web=true)
```

**2. Expose it** (public URL for the Worker to reach):
```
cloudflared tunnel --url http://127.0.0.1:8899     # or any tunnel; note the https URL
```

**3. Point the Worker at it + set the secret:**
```
cd ~/alexandria-inc/public/code/server
# in wrangler.toml:  TWIN_INFERENCE_URL = "https://<tunnel>/infer"   (agent path derived automatically)
npx wrangler secret put TWIN_INFERENCE_SECRET     # paste the SAME secret as step 1
```

**4. Deploy the Worker + website:**
```
cd ~/alexandria-inc/public/code/server && npx wrangler deploy && curl https://api.alexandria-library.com/health
cd ~/alexandria-inc/public/code && bash scripts/push.sh      # website (waits for CI)
```

**5. Enable YOUR twins** (owner-only endpoint; weights kept dark, deep=invite):
```
# deep twin — invite-only, living page on:
curl -X POST https://api.alexandria-library.com/library/mowinckelb/twin \
  -H "Authorization: Bearer $(cat ~/.config/alexandria/admin_key)" -H 'Content-Type: application/json' \
  -d '{"context":{"enabled":true,"visibility":"invite","tools":{"works":true,"web":false}},"weights":{"enabled":false}}'
# make invite codes for people you want to let in (existing access_codes mechanism).
```

**6. Test live:** open `https://alexandria-library.com/library/mowinckelb`, use an invite, ask the deep twin about one of your published works (it should call search_my_works and discuss it in your voice), and ask a curveball. Confirm it never dumps the constitution when you try to injection it.

**7. Ship the module to other Alexandrians** (separate, your call): `cd ~/alexandria-inc/public/code && bash factory/ship.sh "ship PLM module"` — re-signs the manifest so `plm.md` + `twin.md` land in every Author's payload.

**8. Later — public weights twin:** once v7 clears your sign-off bar (or a better base/OPD lands), flip `weights.enabled=true, visibility=public` via the same endpoint. Not before.

## Costs (per plm.md § payment)
- Weights query ≈ $0.001 (public, Alexandria absorbs, rate-limited).
- Deep query ≈ $0.10–0.15 (constitution+voice context + tool rounds) — the paid act; querier pays, you earn a share; ledger records `twin_query` per author/variant; pricing amount is your call (not built).

## The one non-blocking known-small item
Deep-twin context is ~40k tokens/query (full constitution+voice). To halve cost, swap `voice_exemplars.md` → `voice_lite.md` in `twin_server.py _deep_system` (minor quality/cost trade). Left at full for max fidelity.
