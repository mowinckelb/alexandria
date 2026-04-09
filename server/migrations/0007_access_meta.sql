-- Library RL signal: open-ended structural metadata on every access event.
-- Bitter lesson compliant — no fixed schema, just a JSON text column.
-- The Factory reads structural patterns from this, never content.

ALTER TABLE access_log ADD COLUMN meta TEXT;
