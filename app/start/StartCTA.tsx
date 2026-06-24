'use client';

import { useState } from 'react';

// The keyless install one-liner. `/a` redirects (Vercel, next.config.ts) to the
// raw setup.sh; `curl -fsSL` follows it. No key = the free local product (the gym).
const INSTALL_CMD = 'curl -fsSL alexandria-library.com/a | bash';

// One-click deep link for Claude Code (v2.1.91+): opens CC with the command
// pre-filled in the prompt box (the user presses enter — never auto-run). The OS
// routes claude-cli:// locally; nothing leaves the machine. Falls back to the
// copy-block for other agents / older versions.
const DEEP_LINK = `claude-cli://open?q=${encodeURIComponent(
  `Set up Alexandria — run this, then follow its final instruction:\n${INSTALL_CMD}`,
)}`;

const ICON_COPY = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ICON_CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_EXTERNAL = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function StartCTA() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {
      // Fallback for browsers without async clipboard.
      const ta = document.createElement('textarea');
      ta.value = INSTALL_CMD;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="cta-section">
      <button type="button" className="install-block" onClick={copy} aria-label="copy the install command">
        <code className="install-cmd">{INSTALL_CMD}</code>
        <span className="install-copy">{copied ? ICON_CHECK : ICON_COPY}</span>
      </button>
      <p className="install-hint">
        {copied ? 'copied — now paste it into your ai.' : 'copy, then paste into your ai (claude code, cursor, codex, factory).'}
      </p>
      <a href={DEEP_LINK} className="install-deeplink">
        or open it in claude code {ICON_EXTERNAL}
      </a>
    </section>
  );
}
