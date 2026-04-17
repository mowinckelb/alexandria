# Canon Overrides

*Your consent layer for the upstream canon. Anything here wins over `factory/canon/methodology.md`. Upstream canon auto-pulls on every session-start; overrides stay local and authoritative.*

*The Engine adds entries here when upstream canon changes conflict with your practice. You can add entries directly. Each entry should name what is being overridden and why.*

## How this file works

- Upstream canon (fetched from GitHub on session-start) is the default practice.
- Entries below supersede the default when they conflict.
- The Engine reads this file on every session alongside the upstream canon.
- When upstream canon changes, the Engine surfaces a diff at `.canon_update_notice` and considers whether new overrides are warranted for you.
- Clear entries that no longer apply.

## Example entry format

```
## Override: <section or line from upstream canon>

Upstream says: <quoted line or summary>
For this Author: <what to do instead>
Why: <reason — a personal practice, a taste call, an incompatible framing>
Added: <date> by <engine|author>
```

---

*(no overrides yet — upstream canon applies in full)*
