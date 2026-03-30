#!/usr/bin/env bash
# Post-deploy smoke test for mcp.mowinckel.ai
# Pure bash, no dependencies beyond curl.

export MSYS_NO_PATHCONV=1

BASE="https://mcp.mowinckel.ai"
API_KEY_FILE="$HOME/.alexandria/.api_key"
PASSED=0
FAILED=0
TOTAL=4

check() {
  local name="$1" status="$2"
  local pad=$((20 - ${#name}))
  local dots=""
  for ((i=0; i<pad; i++)); do dots="${dots}."; done
  if [ "$status" -ge 200 ] 2>/dev/null && [ "$status" -lt 300 ] 2>/dev/null; then
    echo "[smoke] $name $dots OK"
    PASSED=$((PASSED + 1))
  else
    echo "[smoke] $name $dots FAIL ($status)"
    FAILED=$((FAILED + 1))
  fi
}

# Read API key
if [ ! -f "$API_KEY_FILE" ]; then
  echo "[smoke] ABORT — no API key at $API_KEY_FILE"
  exit 1
fi
API_KEY=$(tr -d '[:space:]' < "$API_KEY_FILE")

# 1. Health
health_out=$(curl -sS -w "\n%{http_code}" "$BASE/health" 2>&1) || true
health_status=$(echo "$health_out" | tail -1)
health_body=$(echo "$health_out" | sed '$d')
if [ "$health_status" = "200" ] && echo "$health_body" | grep -q '"status":"ok"'; then
  check "health" 200
else
  check "health" "${health_status:-0}"
fi

# 2. Blueprint
bp_out=$(curl -sS -w "\n%{http_code}" -H "Authorization: Bearer $API_KEY" "$BASE/blueprint" 2>&1) || true
bp_status=$(echo "$bp_out" | tail -1)
bp_body=$(echo "$bp_out" | sed '$d')
if [ "$bp_status" = "200" ] && echo "$bp_body" | grep -qi "BLUEPRINT"; then
  check "blueprint" 200
else
  check "blueprint" "${bp_status:-0}"
fi

# 3. Hooks
hooks_out=$(curl -sS -w "\n%{http_code}" -H "Authorization: Bearer $API_KEY" "$BASE/hooks" 2>&1) || true
hooks_status=$(echo "$hooks_out" | tail -1)
check "hooks" "${hooks_status:-0}"

# 4. Session (POST)
session_out=$(curl -sS -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"smoke_test"}' \
  "$BASE/session" 2>&1) || true
session_status=$(echo "$session_out" | tail -1)
check "session" "${session_status:-0}"

# Summary
echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "[smoke] All $TOTAL/$TOTAL passed"
else
  echo "[smoke] $FAILED/$TOTAL failed — server is degraded"
  exit 1
fi
