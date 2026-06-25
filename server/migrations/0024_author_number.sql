-- Founding-member numbers (alexandrian #N) — sequential, permanent, visible.
-- Assigned the first time an Author reaches the founding-member page (post-join).
-- Persisted on the account (KV, source of truth for display) and mirrored here
-- to the Library profile so /library/{author} can show the number.

ALTER TABLE authors ADD COLUMN number INTEGER;

-- SQLite keeps NULLs distinct in a UNIQUE index, so unnumbered profiles don't
-- collide — only real assigned numbers are forced unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_number ON authors(number);

-- Atomic sequential source for #N. D1 (SQLite) serialises writes, so
-- `INSERT … ON CONFLICT … RETURNING value` is race-free where a KV
-- read-modify-write would race two concurrent joins onto the same number
-- (same reasoning as the 0021 rate-limit D1-atomic counter fix). The server
-- also ensures this table lazily in code (ensureCounterSchema) so the counter
-- works even before this migration is applied; this file is the durable record.
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
