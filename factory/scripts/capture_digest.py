#!/usr/bin/env python3
"""Alexandria capture digest — the proactive re-engagement pipe.

The ONE surface that reaches OUT (design + canon: alexandria-inc
`private/truth/a2.md` § The Proactive Medium, 2026-07-20). Fires once per day
(5pm local, via launchd) an iMessage that pulls the Author back into a session —
because the real value is the loop (capture -> accrete -> develop); this message
is bait to get them there, never the product itself.

Ruthlessly optimised toward exactly TWO actions, nothing else:
  1. start an active session (run /a)  2. use the shortcut (capture / feed it)

Two states:
  - captures waiting: the top unprocessed capture shown ANALYSED (title + link,
    what it is, their note, 3 action items) — a live demo of what a session does
    to one item, the reason they want the other N done — then the backlog count.
    CTAs bookend the message (top + bottom) so the ask lands even on a skim.
  - empty inbox (dormancy): never nag an empty inbox; deliver an accretion
    fragment from the library (it is FALSE that the engine only works with what
    you feed it) + a push to download/use the shortcut. This also catches the
    dormant user that a pure signal-driven design would starve into silent churn.

Channel: iMessage primary (imsg_send.sh), email fallback (brief SMTP creds) —
"no one likes email." Composition uses a bounded, READ-ONLY `claude -p` call
(no canon writes, no git, no keys but Messages + SMTP); a template fallback keeps
the pipe sending even if the model call fails, so a send never blocks on it.
Sibling of nudge.py / brief.py: the dumb push pipe, model only to *compose*.

OFF: launchctl unload ~/Library/LaunchAgents/com.alexandria.capture-digest.plist
Log: system/.digest_log   Mirror: system/.digest_sent (send events for the
conversion loop — did a session/capture follow within the window).
"""
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HOME = Path.home()
SYS = HOME / "alexandria" / "system"
INPUT_DIR = HOME / "alexandria" / "files" / "vault" / "_input"   # resolved, awaiting extraction
RAW_DIR = HOME / "alexandria" / "files" / "vault" / "input"      # raw, pre-resolve (audio/img/txt)
SAVED_DIR = HOME / "alexandria" / "files" / "vault" / "saved"    # extracted analyses
# Same stem shape the resolver counts, so the digest's "N waiting" == the
# session-start nudge (ground-truth proximity — never a proxy count).
CAPTURE_STEM = re.compile(r"^\d{8}-\d{6}-(?:.+-\d{15,}|link)$")
SEND = SYS / "scripts" / "imsg_send.sh"
FRAGMENTS = SYS / ".digest_fragments.md"
CREDS = SYS / ".brief_email"
SENT_MARKER = SYS / ".digest_sent"      # once-per-day guard: holds today's local date
LOG = SYS / ".digest_log"
SHORTCUT_URL = "alexandria-library.com/capture"


def claude_bin() -> str:
    """Author-generic: prefer ~/.local/bin/claude, else whatever is on PATH."""
    local = HOME / ".local" / "bin" / "claude"
    if local.exists():
        return str(local)
    found = shutil.which("claude")
    return found or ""


def log(m: str) -> None:
    with LOG.open("a") as f:
        f.write(f"{datetime.now().isoformat(timespec='seconds')} {m}\n")


def today_local() -> str:
    return datetime.now().astimezone().strftime("%Y-%m-%d")


def sent_today() -> bool:
    try:
        return SENT_MARKER.read_text().strip() == today_local()
    except OSError:
        return False


def mark_sent() -> None:
    SENT_MARKER.write_text(today_local() + "\n")


def resolved_pending() -> list:
    """Resolved captures awaiting extraction — the SAME set the session-start
    nudge counts: _input/*.md whose stem is a capture and which has no
    saved/<stem>.analysis.md yet (extracted items are moved out, but filter
    defensively to match the resolver exactly). Newest first = 'today's top'."""
    if not INPUT_DIR.is_dir():
        return []
    mds = [
        p for p in INPUT_DIR.glob("*.md")
        if CAPTURE_STEM.match(p.stem)
        and not (SAVED_DIR / f"{p.stem}.analysis.md").exists()
    ]
    return sorted(mds, key=lambda p: p.stat().st_mtime, reverse=True)


def raw_waiting() -> int:
    """Raw, not-yet-resolved captures (audio/video/other) in vault/input/ — the
    nudge counts these too. No card can be shown, but they are 'still raw'."""
    if not RAW_DIR.is_dir():
        return 0
    return sum(1 for p in RAW_DIR.iterdir() if p.is_file() and not p.name.startswith("."))


def first_url(text: str) -> str:
    m = re.search(r"https?://\S+", text)
    return m.group(0).rstrip(").,") if m else ""


def title_of(text: str) -> str:
    for line in text.splitlines():
        s = line.strip().lstrip("# ").strip()
        if s and not s.startswith("http"):
            return s
    return "your capture"


def run_claude(prompt: str, timeout: int = 90) -> str:
    """Bounded read-only compose. Everything the model needs is inline in the
    prompt, so it need touch no files; empty output -> caller falls back."""
    cb = claude_bin()
    if not cb:
        return ""
    try:
        r = subprocess.run(
            [cb, "-p", prompt],
            capture_output=True, text=True, timeout=timeout,
            env={**os.environ, "HOME": str(HOME)},
        )
        return (r.stdout or "").strip()
    except Exception as e:
        log(f"claude compose failed: {e}")
        return ""


def compose_captures(pending: list, n: int) -> str:
    if not pending:
        # Raw-only (audio/img/txt not yet resolved) — no card to show, just the
        # count + the two CTAs. Rare, but never undercount or go silent.
        return (
            "alexandria.\n\n"
            f"→ {n} capture{'s' if n > 1 else ''} waiting (still raw). at your "
            "computer? run /a to process them.\n\n"
            "away from your desk? keep feeding me with the shortcut."
        )
    top_text = pending[0].read_text(errors="replace")[:2000]
    prompt = f"""Compose a short iMessage for Alexandria's daily capture digest —
the "captures waiting" state. PLAIN TEXT only (iMessage renders no markdown, no
bold). Lowercase, terse, sniper-brief — this exact house voice and shape:

alexandria.

→ {n} waiting. at your computer? run /a to clear them.

today's top:
<title> — <source if known, else drop the dash>
what it is · <one plain sentence, <=18 words>
your note · "<their own note if the capture clearly contains one, else DROP this whole line>"
to do · <action> · <action> · <action>

+ {n - 1} more, still raw.

→ run /a to process. away from your desk? keep feeding me with the shortcut.

Rules: keep it lean, every line earns its place, the two CTAs (run /a, the
shortcut) are mandatory top and bottom. If n is 1, write "→ 1 waiting…" and drop
the "+ N more" line. Return ONLY the message text, nothing before or after.

The top capture to summarise:
---
{top_text}
---"""
    msg = run_claude(prompt)
    if msg and "alexandria" in msg.lower():
        return msg
    # Fallback: no model — title + link + count, CTAs intact. Still a real digest.
    log("compose_captures: model empty, using template fallback")
    title = title_of(top_text)
    url = first_url(top_text)
    lines = [
        "alexandria.",
        "",
        f"→ {n} waiting. at your computer? run /a to clear them.",
        "",
        "today's top:",
        title,
    ]
    if url:
        lines.append(url)
    if n > 1:
        lines += ["", f"+ {n - 1} more, still raw."]
    lines += [
        "",
        "→ run /a to process. away from your desk? keep feeding me with the shortcut.",
    ]
    return "\n".join(lines)


def load_fragments() -> list:
    if not FRAGMENTS.exists():
        return []
    return [b.strip() for b in re.split(r"(?m)^\s*---\s*$", FRAGMENTS.read_text()) if b.strip()]


def compose_empty() -> str:
    frags = load_fragments()
    if frags:
        # deterministic rotation by day-of-year (no RNG needed; stable across a day)
        frag = frags[datetime.now().timetuple().tm_yday % len(frags)]
        return (
            "alexandria.\n\n"
            "quiet inbox today — one from the library to chew on:\n\n"
            f"{frag}\n\n"
            "→ run /a to think it through, or catch your next thought with the shortcut.\n\n"
            f"no shortcut yet? add it in 20 seconds → {SHORTCUT_URL}"
        )
    # No fragment pool -> the bare feed-me poke (still drives both actions).
    return (
        "alexandria.\n\n"
        "quiet inbox today.\n\n"
        "send me something — a link, a thought, a screenshot — and run /a "
        "when you're at your computer.\n\n"
        f"no shortcut yet? add it in 20 seconds → {SHORTCUT_URL}"
    )


def send_imessage(msg: str) -> bool:
    if not SEND.exists():
        return False
    try:
        r = subprocess.run(["/bin/bash", str(SEND), msg], capture_output=True, text=True, timeout=60)
        return r.returncode == 0
    except Exception as e:
        log(f"imessage send error: {e}")
        return False


def send_email(msg: str) -> bool:
    """Fallback only — no one likes email. Reuses the brief SMTP creds."""
    try:
        import smtplib
        from email.message import EmailMessage
        d = json.loads(CREDS.read_text())
        em = EmailMessage()
        em["Subject"] = "alexandria."
        em["From"] = d["from"]
        em["To"] = d["to"]
        em.set_content(msg)
        with smtplib.SMTP(d["host"], int(d["port"]), timeout=30) as s:
            s.starttls()
            s.login(d["user"], d["password"])
            s.send_message(em)
        return True
    except Exception as e:
        log(f"email fallback error: {e}")
        return False


def main() -> None:
    if sent_today() and "--force" not in sys.argv:
        log("skip: already sent today")
        return
    pending = resolved_pending()
    n = len(pending) + raw_waiting()   # total unprocessed = resolved + raw (matches the nudge)
    state = "captures" if n else "empty"
    msg = compose_captures(pending, n) if n else compose_empty()

    via = "imessage" if send_imessage(msg) else ("email" if send_email(msg) else None)
    if not via:
        log(f"SEND FAILED (state={state}, n={n})")
        sys.exit(1)
    mark_sent()
    # Mirror: record the send so the conversion loop can later ask whether a
    # session-start or a capture followed within the window.
    log(f"SENT via={via} state={state} n={n} :: {msg[:80].replace(chr(10), ' ')}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERROR: {e}")
        sys.exit(1)
