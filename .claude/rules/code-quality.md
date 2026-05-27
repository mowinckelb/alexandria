---
paths: ["server/**/*.ts"]
---

# Code Quality — Server

Before committing any server code change:

1. **Correctness:** Trace the full execution path, not just the changed function. Check all callers of anything modified.
2. **Build:** Run `npm run build` in server/. Must pass.
3. **Test:** Run `npm test` if tests exist. Check the e2e test (`server/test/e2e.ts`).
4. **No regressions:** Review recent commits for anything the change might break.
5. **Bitter lesson compliance:** No structured parameters, fixed schemas, or hand-crafted rules. Unstructured text/JSONL. Soft defaults that thin as models improve.
6. **Statelessness:** Server stores nothing user-specific in plaintext. Account blobs are AES-256-GCM encrypted in KV; the API key is never stored, only its SHA-256 hash, indexed for O(1) auth. There is no refresh token — rotation requires a fresh OAuth round-trip.
7. **Deployment:** After deploying (`cd server && npx wrangler deploy`), check health: `curl https://api.alexandria-library.com/health`.
