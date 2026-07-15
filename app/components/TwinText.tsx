import type { ReactNode } from 'react';
import { safeUrl } from '../lib/url';

/**
 * TwinText — render a twin/guide answer as readable text instead of raw markup.
 * The models behind every ask surface naturally emit light markdown; the chat
 * panes rendered it verbatim, so visitors saw literal `**` and `[text](url)` at
 * the exact moment the mind was selling and redirecting them. This renders just
 * that light set — [text](url) links, bare URLs, **bold** — as React nodes
 * (never innerHTML; every href passes safeUrl, so an answer poisoned via a
 * reader-passed `focus` can't smuggle a javascript: link). Everything else stays
 * plain text; the container's pre-wrap keeps the line breaks.
 */

// One pass, one regex: markdown link | bare URL | bold span.
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)\]]+)|\*\*([^*\n]+)\*\*/g;

const linkStyle = { color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '2px' } as const;

function anchor(href: string, label: string, key: number): ReactNode {
  const url = safeUrl(href);
  const external = /^https?:\/\//i.test(url);
  return (
    <a key={key} href={url} style={linkStyle} className="hover:opacity-60"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {label}
    </a>
  );
}

export default function TwinText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    if (m[1] !== undefined && m[2] !== undefined) {
      nodes.push(anchor(m[2], m[1], key++));
    } else if (m[3] !== undefined) {
      // Trailing sentence punctuation stays text, not part of the link.
      const bare = m[3].replace(/[.,;:!?]+$/, '');
      nodes.push(anchor(bare, bare.replace(/^https?:\/\//i, ''), key++));
      if (bare.length < m[3].length) nodes.push(m[3].slice(bare.length));
    } else if (m[4] !== undefined) {
      nodes.push(<strong key={key++} style={{ fontWeight: 600 }}>{m[4]}</strong>);
    }
    last = i + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
