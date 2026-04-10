---
name: Self-healing not reporting
description: Health digest self-heals first, emails founder only sprint/stroll subject line. Email is CTO→CEO channel, use freely.
type: feedback
---

Health monitoring must self-heal before escalating. If you can detect it, try to fix it first.

Email the founder ONLY when genuinely stuck or when something is worth his attention (feedback, news, anything a CTO would tell the CEO). The email channel is open — use it like a CTO would.

**Why:** The founder can't solve anything without the CLI. Email content beyond urgency doesn't change his behavior. Sprint = run to the computer. Stroll = when you get a chance.

**How to apply:** Subject line is the entire message: `alexandria. — sprint` or `alexandria. — stroll`. Empty body. The function `sendEmail` is available for any server-side founder communication — not health-only. Use judgment on when to reach out.
