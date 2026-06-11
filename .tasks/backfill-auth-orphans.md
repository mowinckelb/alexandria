# Task — backfill: drop orphan `auth:*` KV entries

**Status:** one-shot, post-2026-05-26 audit fix. Delete this file (or move to `.tasks/done/`) once executed.

## Why

Prior to the 2026-05-26 audit fix, every install-nudge regenerated the Author's API key but kept the previous `auth:<hash>` index entry forever (cron.ts comment: *"Old hash stays in auth_index since there's no delete path"*). OAuth callbacks for not-yet-installed accounts had the same gap.

Net: production KV holds `auth:*` rows that resolve to accounts whose current `api_key_hash` is something different — those rows grant permanent parallel access via keys still sitting in old nudge emails.

The fix (`setAuthIndex(hash, key, previousHash?)`) prevents new orphans. This task removes the historical ones.

## Approach

The `auth:` value is plaintext (just the github_key string). The `account:` blob is AES-256-GCM-encrypted under `ENCRYPTION_KEY`. Strategy:

1. Enumerate every `account:*` key, decrypt, collect each account's current `api_key_hash` into a Set.
2. Enumerate every `auth:*` key — if its hash isn't in the Set, it's an orphan. Delete.
3. Dry-run mode reports counts + sample orphan hashes without deleting.

## Script

Save as `scripts/backfill-auth-orphans.mjs` while running, delete after. Or paste-and-go via `node --input-type=module -e "$(cat << 'EOF' ... EOF)"`.

```js
#!/usr/bin/env node
// One-shot: drop auth:* KV rows whose hash isn't the current api_key_hash of any account.
// Usage:
//   ENCRYPTION_KEY=<64-hex> node backfill-auth-orphans.mjs           # dry-run
//   ENCRYPTION_KEY=<64-hex> node backfill-auth-orphans.mjs --commit  # actually delete
//
// Get ENCRYPTION_KEY from the Worker's bound secrets — it must match the value
// the Worker uses or every decrypt fails and the script aborts before deletion.
import { execSync } from 'node:child_process';
import { createDecipheriv } from 'node:crypto';

const COMMIT = process.argv.includes('--commit');
const BINDING = 'DATA';
const KEY_HEX = process.env.ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  console.error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes).');
  process.exit(2);
}
const ENC_KEY = Buffer.from(KEY_HEX, 'hex');

function wrangler(args) {
  return execSync(`npx wrangler ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function listKeys(prefix) {
  const out = [];
  let cursor = '';
  // wrangler kv key list paginates; loop with --cursor (1.x+ supports it).
  while (true) {
    const flag = cursor ? ` --cursor=${cursor}` : '';
    const raw = wrangler(`kv key list --binding=${BINDING} --remote --prefix=${prefix}${flag}`);
    const page = JSON.parse(raw);
    for (const k of page) out.push(k.name);
    // wrangler emits an array; pagination handled in one call for prefixes
    // under the per-call list cap (1000). If you have >1000 of a prefix and
    // see truncation, bump this to use --limit + cursor.
    break;
  }
  return out;
}

function getKey(name) {
  const raw = wrangler(`kv key get "${name}" --binding=${BINDING} --remote`);
  return raw.trim();
}

function decryptAccount(token) {
  const buf = Buffer.from(token, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

console.log('Step 1/3 — enumerating account:* keys ...');
const accountKeys = listKeys('account:');
console.log(`  ${accountKeys.length} accounts`);

console.log('Step 2/3 — collecting current api_key_hash values ...');
const liveHashes = new Set();
let decryptFailures = 0;
for (const k of accountKeys) {
  try {
    const enc = getKey(k);
    const account = JSON.parse(decryptAccount(enc));
    if (typeof account.api_key_hash === 'string') liveHashes.add(account.api_key_hash);
  } catch (e) {
    decryptFailures++;
    console.error(`  decrypt failed for ${k}: ${e.message}`);
  }
}
if (decryptFailures > 0) {
  console.error(`ABORT — ${decryptFailures} decrypt failures. Wrong ENCRYPTION_KEY or KV corruption.`);
  process.exit(3);
}
console.log(`  ${liveHashes.size} live hashes`);

console.log('Step 3/3 — sweeping auth:* keys ...');
const authKeys = listKeys('auth:');
console.log(`  ${authKeys.length} auth: entries total`);

const orphans = [];
for (const k of authKeys) {
  const hash = k.slice('auth:'.length);
  if (!liveHashes.has(hash)) orphans.push(k);
}

console.log(`\n=== Orphans: ${orphans.length} of ${authKeys.length} ===`);
for (const o of orphans.slice(0, 20)) console.log(`  ${o}`);
if (orphans.length > 20) console.log(`  ... and ${orphans.length - 20} more`);

if (!COMMIT) {
  console.log('\nDry run — no deletions. Re-run with --commit to remove orphans.');
  process.exit(0);
}

console.log('\nDeleting ...');
let deleted = 0;
for (const k of orphans) {
  wrangler(`kv key delete "${k}" --binding=${BINDING} --remote`);
  deleted++;
  if (deleted % 10 === 0) console.log(`  ${deleted}/${orphans.length}`);
}
console.log(`Done. Deleted ${deleted}.`);
```

## Run

```bash
cd ~/alexandria-inc/public/code/server
# Get the live encryption key. Wrangler doesn't print secrets; pull from your secrets manager.
export ENCRYPTION_KEY=...

# Dry-run first.
node ../.tasks/backfill-auth-orphans.mjs

# If the orphan count looks right, commit.
node ../.tasks/backfill-auth-orphans.mjs --commit
```

## Verification after run

- Re-run dry mode. Orphan count should now be 0.
- `curl https://api.alexandria-library.com/health` — should still be `ok`.
- Smoke-test: `curl -H "Authorization: Bearer alex_<your-key>" https://api.alexandria-library.com/alexandria` — should return `connected: true`.

## After running

Delete this file (or move to `.tasks/done/`). The structural fix (`kv.ts:setAuthIndex` rotation) prevents new orphans.

## State as of 2026-06-11 (surge S4 close — analysis done, deletion deliberately deferred)

Full live analysis (CF REST bulk-get, read-only): **11 `auth:` rows / 7 accounts.**

- `github_233047998` (mowinckelb): 2 rows — `060a6f25…` is the founder's additive local admin key (`~/.config/alexandria/admin_key`, documented in private/CLAUDE.md), `0601cb69…` the primary. **Both legitimate — the script's orphan-set logic would delete the admin key. Add an allowlist for it before running, or re-mint the local admin key after.**
- `github_6433760` (merivercap): **4 rows** (`153b1916…`, `bad839c4…`, `8dcff386…`, `0ac0d785…`) — signup + 3 pre-fix nudge regenerations. 3 are orphans; which one is current is indistinguishable without decrypting the account blob (needs `ENCRYPTION_KEY`).
- All other accounts: exactly 1 row. Clean.

Why deletion was deferred, not executed: merivercap has never used any key (60-day event log: one `prosumer_signup`, zero installs/calls), their account status blocks write endpoints anyway, and blind deletion (3 of 4 at random) carries a 75% chance of killing the key in their most recent nudge email — breaking a prospective user's return moment for negligible security gain. The structural rotation fix already stops new orphans.

To finish (≈2 min, when ENCRYPTION_KEY is in hand): run the script above in dry-run, confirm it reports exactly 3 orphans all on github_6433760 and does NOT list 060a6f25… (admin key), then `--commit`. Then move this file to .tasks/done/.
