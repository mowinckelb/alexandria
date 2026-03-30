-- Add 'private' tier to shadows and works
-- D1 doesn't support ALTER TABLE ... ALTER CONSTRAINT, so we recreate

-- Works: drop old constraint, recreate table with new constraint
CREATE TABLE works_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  medium TEXT,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'paid', 'private')),
  r2_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  published_at TEXT NOT NULL
);
INSERT INTO works_new SELECT * FROM works;
DROP TABLE works;
ALTER TABLE works_new RENAME TO works;
CREATE INDEX idx_works_author ON works(author_id);

-- Shadows: same pattern
CREATE TABLE shadows_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'paid', 'private')),
  r2_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO shadows_new SELECT * FROM shadows;
DROP TABLE shadows;
ALTER TABLE shadows_new RENAME TO shadows;
CREATE INDEX idx_shadows_author ON shadows(author_id);

-- Access codes for private tier
CREATE TABLE access_codes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE UNIQUE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_author ON access_codes(author_id);
