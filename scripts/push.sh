#!/usr/bin/env bash
# Push and verify CI. Use this instead of raw `git push`.
# Waits for all triggered GitHub Actions to complete and reports results.
set -euo pipefail

echo "pushing..."
git push "$@"

echo "waiting for CI to start..."
sleep 15

# Find runs triggered by the latest commit
HEAD_SHA=$(git rev-parse HEAD)
MAX_WAIT=300  # 5 minutes max
WAITED=0
INTERVAL=15

while true; do
  # Get all runs for this commit + any manual triggers in the last 2 minutes
  RUNS=$(gh run list --limit 10 --json databaseId,status,conclusion,name,createdAt 2>/dev/null)

  # Count in-progress runs
  IN_PROGRESS=$(echo "$RUNS" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const runs=JSON.parse(d);
      const recent=runs.filter(r=>r.status!=='completed');
      console.log(recent.length);
    })
  " 2>/dev/null || echo "0")

  if [ "$IN_PROGRESS" = "0" ] && [ "$WAITED" -gt 10 ]; then
    break
  fi

  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "timeout waiting for CI (${MAX_WAIT}s). check manually: gh run list"
    exit 1
  fi

  sleep "$INTERVAL"
  WAITED=$((WAITED + INTERVAL))
done

# Report results
echo ""
echo "=== CI Results ==="
gh run list --limit 6 | head -8

# Check for failures
FAILURES=$(gh run list --limit 6 --json conclusion,name 2>/dev/null | node -e "
  let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
    const runs=JSON.parse(d);
    const fails=runs.filter(r=>r.conclusion==='failure');
    if(fails.length>0){
      console.log(fails.map(r=>r.name).join(', '));
      process.exit(1);
    }
    console.log('all passing');
  })
" 2>/dev/null)

EXIT=$?
echo "$FAILURES"

if [ "$EXIT" -ne 0 ]; then
  echo ""
  echo "CI FAILED. Do not claim done."
  exit 1
fi

echo ""
echo "CI verified. Safe to proceed."
