/**
 * Account-based access grants — the invite system that needs near-zero input.
 *
 * A GRANT means "this account may reach this author's invite-visibility content"
 * (twins + protocol files, which share `authorizeFileRead`). It replaces the old
 * "invite code = infinitely-shareable secret re-typed every time" model:
 *
 *   • An author can grant an account directly (by github handle) — no code.
 *   • Or a code, on first use by a LOGGED-IN visitor, BINDS to their account
 *     (creates a grant) — so they never enter it again; every later visit just
 *     works from their session.
 *
 * Grants are keyed on the immutable numeric github_id (not the renamable handle,
 * matching `protocol_files.account_id` and the gate), author-scoped, and soft-
 * revocable (row kept for audit). The schema is created lazily so the code works
 * before any migration is applied (same pattern as ensureCounterSchema).
 */
import { getDB, generateId } from './db.js';

let ensured = false;
async function ensureGrantSchema(): Promise<void> {
  if (ensured) return;
  await getDB().prepare(
    `CREATE TABLE IF NOT EXISTS access_grants (
       id TEXT PRIMARY KEY,
       author_id TEXT NOT NULL,
       account_github_id TEXT NOT NULL,
       code_id TEXT,
       label TEXT,
       created_at TEXT NOT NULL,
       revoked_at TEXT,
       UNIQUE(author_id, account_github_id)
     )`,
  ).run().catch(() => {});
  await getDB().prepare(
    `CREATE INDEX IF NOT EXISTS idx_grants_lookup ON access_grants(author_id, account_github_id, revoked_at)`,
  ).run().catch(() => {});
  ensured = true;
}

/** Does this account hold a live grant for this author's invite content? */
export async function hasGrant(authorId: string, accountGithubId: string | number | null): Promise<boolean> {
  if (accountGithubId == null) return false;
  await ensureGrantSchema();
  const row = await getDB().prepare(
    `SELECT id FROM access_grants WHERE author_id = ? AND account_github_id = ? AND revoked_at IS NULL LIMIT 1`,
  ).bind(authorId, String(accountGithubId)).first<{ id: string }>().catch(() => null);
  return !!row?.id;
}

export type GrantState = 'live' | 'revoked' | 'none';

/** The grant status for an account on an author, three-valued so callers can
 *  distinguish a `revoked` grant from `none`. This is what makes revocation
 *  STRUCTURAL: an owner-revoked account returns `revoked`, and the invite
 *  resolvers refuse to let a still-valid code resurrect it — code-reuse can no
 *  longer undo a revoke (audit B2). Only an explicit owner re-grant clears it. */
export async function grantState(authorId: string, accountGithubId: string | number | null): Promise<GrantState> {
  if (accountGithubId == null) return 'none';
  await ensureGrantSchema();
  const row = await getDB().prepare(
    `SELECT revoked_at FROM access_grants WHERE author_id = ? AND account_github_id = ? LIMIT 1`,
  ).bind(authorId, String(accountGithubId)).first<{ revoked_at: string | null }>().catch(() => null);
  if (!row) return 'none';
  return row.revoked_at ? 'revoked' : 'live';
}

/** Grant an account access. Idempotent. Provenance via `codeId`/`label`.
 *  `reactivate` decides what happens to a REVOKED grant on conflict:
 *    • absent/false (code-binding path): DO NOTHING — a revoked grant stays
 *      revoked, so re-entering a still-valid code can't resurrect it (audit B2).
 *      A fresh (state=`none`) bind still inserts normally.
 *    • true (owner path only): un-revoke — the owner is deliberately re-granting. */
export async function grantAccess(
  authorId: string,
  accountGithubId: string | number,
  opts?: { codeId?: string; label?: string; reactivate?: boolean },
): Promise<void> {
  await ensureGrantSchema();
  const now = new Date().toISOString();
  const onConflict = opts?.reactivate
    ? `DO UPDATE SET revoked_at = NULL,
                     code_id = COALESCE(excluded.code_id, access_grants.code_id),
                     label   = COALESCE(excluded.label, access_grants.label)`
    : `DO NOTHING`;
  await getDB().prepare(
    `INSERT INTO access_grants (id, author_id, account_github_id, code_id, label, created_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(author_id, account_github_id) ${onConflict}`,
  ).bind(generateId(), authorId, String(accountGithubId), opts?.codeId ?? null, opts?.label ?? null, now)
    .run().catch(() => {});
}

export interface GrantRow {
  account_github_id: string;
  label: string | null;
  created_at: string;
  revoked_at: string | null;
}

export async function listGrants(authorId: string): Promise<GrantRow[]> {
  await ensureGrantSchema();
  const res = await getDB().prepare(
    `SELECT account_github_id, label, created_at, revoked_at
       FROM access_grants WHERE author_id = ? ORDER BY created_at DESC LIMIT 500`,
  ).bind(authorId).all<GrantRow>().catch(() => ({ results: [] as GrantRow[] }));
  return res.results || [];
}

export async function revokeGrant(authorId: string, accountGithubId: string): Promise<void> {
  await ensureGrantSchema();
  await getDB().prepare(
    `UPDATE access_grants SET revoked_at = ? WHERE author_id = ? AND account_github_id = ? AND revoked_at IS NULL`,
  ).bind(new Date().toISOString(), authorId, String(accountGithubId)).run().catch(() => {});
}
