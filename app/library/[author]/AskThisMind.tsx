'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import PromptBox from '../../components/PromptBox';

/**
 * "personal language model" — the PLM section on an Author's Library page.
 * Stripped to essentials: a section header and one line to ask (Enter submits,
 * Shift+Enter newline, native voice via the shared PromptBox). No intro, no
 * disclaimer, no chips. The Author may project a weights twin (trained) and/or a
 * context twin (reads their writing live); this asks the first the viewer reaches.
 */

type TwinVariant = 'weights' | 'context';

export type TwinVariantSummary = {
  variant: TwinVariant;
  enabled: boolean;
  visibility: string;
  label: string | null;
  tools: boolean;
  accessible: boolean;
  needsInvite?: boolean;
};

type AskResponse = { answer?: string; variant?: TwinVariant; error?: string };

const sectionLabelStyle: CSSProperties = {
  color: 'var(--text-ghost)',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  margin: '0 0 0.9rem',
};

export default function AskThisMind({
  authorId,
  authorName,
  variants,
  online = true,
}: {
  authorId: string;
  authorName: string;
  variants: TwinVariantSummary[];
  online?: boolean;
  signedIn?: boolean;
}) {
  const name = authorName || authorId;

  // Variants the viewer can reach or unlock. Weights (floor) first.
  const usable = useMemo(
    () => (variants || []).filter((v) => v.enabled && (v.accessible || v.needsInvite)),
    [variants],
  );
  const activeVariant = usable[0]?.variant ?? 'weights';

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asked, setAsked] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invite] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try { return new URLSearchParams(window.location.search).get('invite')?.trim() || ''; } catch { return ''; }
  });

  if (usable.length === 0) return null;

  if (!online) {
    return (
      <div>
        <p style={sectionLabelStyle}>personal language model</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
          {name}’s PLM is offline right now — check back soon.
        </p>
      </div>
    );
  }

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await fetch(`/api/library/${encodeURIComponent(authorId)}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: q, variant: activeVariant, ...(invite ? { invite } : {}) }),
      });
      const body = (await res.json().catch(() => ({}))) as AskResponse;
      if (!res.ok || !body.answer) {
        setError(body.error || 'the PLM could not answer just now.');
        return;
      }
      setAsked(q);
      setAnswer(body.answer);
    } catch {
      setError('could not reach the PLM.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setAnswer(''); setAsked(''); setError(''); setQuestion(''); };

  return (
    <div>
      <p style={sectionLabelStyle}>personal language model</p>

      {!answer && (
        <>
          <PromptBox
            value={question}
            onChange={setQuestion}
            onSubmit={() => void ask()}
            loading={loading}
            placeholder={`ask ${name} anything…`}
          />
          {error && <p style={{ fontSize: '0.82rem', color: 'var(--text-whisper)', margin: '0.8rem 0 0' }}>{error}</p>}
        </>
      )}

      {answer && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 0.8rem', fontStyle: 'italic' }}>{asked}</p>
          <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '1rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65 }}>
            {answer}
          </div>
          <button
            type="button"
            onClick={reset}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            style={{ fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'opacity 0.15s', border: 'none', background: 'none', padding: 0, margin: '1.2rem 0 0', fontFamily: 'inherit' }}
          >
            ask another
          </button>
        </>
      )}
    </div>
  );
}
