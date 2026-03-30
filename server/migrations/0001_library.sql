-- Library v1 schema — Turn 3 infrastructure

CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  settings TEXT DEFAULT '{}',
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE shadows (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'paid')),
  r2_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_shadows_author ON shadows(author_id);

CREATE TABLE pulses (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  month TEXT NOT NULL,
  r2_key_pulse TEXT NOT NULL,
  r2_key_delta TEXT,
  published_at TEXT NOT NULL
);
CREATE INDEX idx_pulses_author ON pulses(author_id);
CREATE UNIQUE INDEX idx_pulses_month ON pulses(author_id, month);

CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  published_at TEXT NOT NULL,
  active INTEGER DEFAULT 1
);
CREATE INDEX idx_quizzes_author ON quizzes(author_id);

CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  taker_id TEXT,
  score_pct INTEGER,
  result_slug TEXT,
  taken_at TEXT NOT NULL
);
CREATE INDEX idx_results_quiz ON quiz_results(quiz_id);
CREATE INDEX idx_results_slug ON quiz_results(result_slug);

CREATE TABLE works (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  medium TEXT,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'paid')),
  r2_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  published_at TEXT NOT NULL
);
CREATE INDEX idx_works_author ON works(author_id);

CREATE TABLE access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  author_id TEXT NOT NULL,
  accessor_id TEXT,
  artifact_id TEXT,
  tier TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_access_author ON access_log(author_id, created_at);

CREATE TABLE billing_tab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accessor_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  alexandria_cut_cents INTEGER NOT NULL,
  author_cut_cents INTEGER NOT NULL,
  month TEXT NOT NULL,
  settled INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_tab_accessor ON billing_tab(accessor_id, month, settled);
CREATE INDEX idx_tab_author ON billing_tab(author_id, month);

CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  referred_github_login TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_referrals_author ON referrals(author_id);
