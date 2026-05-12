CREATE TABLE IF NOT EXISTS request_rate_limits (
  scope TEXT NOT NULL,
  ip TEXT NOT NULL,
  window_bucket INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope, ip, window_bucket)
);

CREATE INDEX IF NOT EXISTS idx_request_rate_limits_window
ON request_rate_limits(scope, window_bucket);
