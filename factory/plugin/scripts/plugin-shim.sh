#!/usr/bin/env bash
# Alexandria plugin shim — the plugin's dumb shell around the real shim.
# Identical product, different delivery: this file only (1) prevents
# double-fire with a legacy settings.json install, (2) finds the alexandria
# folder (host or Cowork VM mount), (3) hands off to the same
# signature-verified shim.sh -> payload.sh chain every other surface runs.
# No behavior lives here. Behavior lives in the signed payload.
#
# Audit: https://github.com/mowinckelb/alexandria/blob/main/TRUST.md

MODE="$1"
PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── 1. Legacy-defer: if setup.sh's settings.json hooks are installed on this
# machine, they own the session lifecycle — exit so nothing fires twice.
# setup.sh removes those hooks when it migrates an install to the plugin.
if grep -q 'alexandria/system/hooks/shim\.sh' "$HOME/.claude/settings.json" 2>/dev/null; then
  exit 0
fi

# ── 2. Locate the alexandria folder. Host default first; then the Cowork VM
# case — the folder the Author attached, visible from the session cwd.
# Marker = files/ + system/ both present (the folder setup.sh creates).
is_alex_dir() { [ -d "$1/files" ] && [ -d "$1/system" ]; }

ALEX_DIR=""
if is_alex_dir "$HOME/alexandria"; then
  ALEX_DIR="$HOME/alexandria"
else
  for c in "$PWD" "$PWD/alexandria" "${CLAUDE_PROJECT_DIR:-}" "${CLAUDE_PROJECT_DIR:-}/alexandria"; do
    [ -n "$c" ] && is_alex_dir "$c" && { ALEX_DIR="$c"; break; }
  done
  # Cowork mounts attached folders under <session>/mnt/<name>; sweep one level.
  if [ -z "$ALEX_DIR" ]; then
    for c in "$PWD"/*/ "$PWD"/mnt/*/ ; do
      is_alex_dir "${c%/}" && { ALEX_DIR="${c%/}"; break; }
    done
  fi
fi

if [ -z "$ALEX_DIR" ]; then
  # Graceful, never silent: one line, session-start only.
  if [ "$MODE" = "session-start" ]; then
    echo "alexandria: no canon folder found. In Cowork, attach your alexandria folder to this session. New? https://alexandria-library.com"
  fi
  exit 0
fi
export ALEXANDRIA_DIR="$ALEX_DIR"

# ── 3. iOS capture resolver (parity with setup.sh's second SessionStart hook;
# a separate settings.json entry there, folded in here). Non-fatal, host-shape
# installs only — skips silently where the script or python3 is absent.
if [ "$MODE" = "session-start" ] && [ -f "$ALEX_DIR/system/scripts/capture_resolver.py" ]; then
  python3 "$ALEX_DIR/system/scripts/capture_resolver.py" 2>/dev/null || true
fi

# ── 4. Hand off to the real shim. Prefer the Author's installed shim (its
# auto-update keeps it current); fall back to the copy shipped in this plugin
# (fresh from the marketplace) for folders that predate it.
if [ -f "$ALEX_DIR/system/hooks/shim.sh" ]; then
  exec bash "$ALEX_DIR/system/hooks/shim.sh" "$MODE"
fi
exec bash "$PLUGIN_ROOT/scripts/shim.sh" "$MODE"
