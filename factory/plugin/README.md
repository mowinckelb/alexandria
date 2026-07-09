# alexandria plugin

The Alexandria delivery shell for the Claude family — Claude Code, Claude Desktop, and Cowork. Auto-loads your constitution at session start, captures signal at session end, ships `/a`.

This is packaging, not product. The product is your files (`~/alexandria/`) and the signed payload every surface runs — see [TRUST.md](../../TRUST.md). Cursor, Codex, and Factory get the identical behavior via `setup.sh`; every surface reads and writes the same sovereign folder, so you can move between tools freely.

## Claude Code

Nothing to do — `setup.sh` installs this plugin automatically (falls back to settings hooks on older CLIs). Manual install:

```
claude plugin marketplace add mowinckelb/alexandria
claude plugin install alexandria@alexandria
```

## Claude Desktop / Cowork

1. Install the plugin via Claude Code on the same machine (the `claude plugin` commands above) — plugins are installed through the CLI, not a Desktop settings screen.
2. In Cowork, attach your `alexandria` folder to the session (Cowork runs in a VM — it can only see folders you attach), then type `/a`.

Desktop and Cowork sessions are manual-start: `/a` with the folder attached. Automatic session capture is Claude Code-only for now.
