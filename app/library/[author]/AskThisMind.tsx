'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

/**
 * "ask this mind" — the PLM section on an Author's Library page.
 *
 * An Author projects up to TWO queryable twins (plm.md § both-twin architecture):
 *
 *   • weights twin (quick) — the privacy FLOOR. Weights compiled from the
 *     Author's substrate; the visitor never sees, and cannot extract, the raw
 *     substrate. Public by default → the stranger-facing option.
 *   • context twin (deep) — the fidelity CEILING. A frontier model reading the
 *     Author's substrate in context. Higher fidelity, but it EXPOSES the
 *     substrate at query time, so it is gated (authors by default).
 *
 * The server sends only the variants THIS viewer may reach (per-variant gate).
 * If the viewer can reach both, we show a labelled toggle; if one, we show it;
 * if none, this component isn't rendered. The honest twin disclaimer is always
 * present, and adapts to the active variant.
 *
 * State machine: idle → thinking → answered (or error). Awaited, not streamed.
 */

type TwinVariant = 'weights' | 'context';

export type TwinVariantSummary = {
  variant: TwinVariant;
  enabled: boolean;
  visibility: string;
  label: string | null;
  tools: boolean;
  accessible: boolean;
};

type AskResponse = {
  ok?: boolean;
  answer?: string;
  variant?: TwinVariant;
  author_name?: string;
  label?: string | null;
  disclaimer?: string;
  error?: string;
};

// Human labels for the toggle + the resting hint per variant.
const VARIANT_META: Record<TwinVariant, { toggle: string; hint: string }> = {
  weights: { toggle: 'quick', hint: 'privacy-safe' },
  context: { toggle: 'deep', hint: 'full substrate' },
};

const sectionLabelStyle: CSSProperties = {
  color: 'var(--text-ghost)',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  margin: '0 0 0.7rem',
};

function restingDisclaimerFor(name: string, variant: TwinVariant): string {
  if (variant === 'context') {
    return `you're talking to ${name}'s twin reading their published substrate on a frontier model — not ${name}. it can be wrong, and may not reflect their real views.`;
  }
  return `you're talking to ${name}'s trained twin — a model compiled from their published writing, not ${name}. it can be wrong, and may not reflect their real views.`;
}

export default function AskThisMind({
  authorId,
  authorName,
  variants,
}: {
  authorId: string;
  authorName: string;
  variants: TwinVariantSummary[];
}) {
  const name = authorName || authorId;

  // Only variants the server says this viewer can reach. Weights (floor) first.
  const usable = useMemo(
    () => (variants || []).filter((v) => v.enabled && v.accessible),
    [variants],
  );

  const [active, setActive] = useState<TwinVariant>(usable[0]?.variant ?? 'weights');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asked, setAsked] = useState('');
  const [answeredVariant, setAnsweredVariant] = useState<TwinVariant>('weights');
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (usable.length === 0) return null;

  const activeSummary = usable.find((v) => v.variant === active) ?? usable[0];
  const showToggle = usable.length > 1;

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
        body: JSON.stringify({ question: q, variant: activeSummary.variant }),
      });
      const body = (await res.json().catch(() => ({}))) as AskResponse;
      if (!res.ok || !body.answer) {
        setError(body.error || 'the twin could not answer just now.');
        return;
      }
      const v = body.variant || activeSummary.variant;
      setAsked(q);
      setAnswer(body.answer);
      setAnsweredVariant(v);
      setDisclaimer(body.disclaimer || restingDisclaimerFor(name, v));
    } catch {
      setError('could not reach the twin.');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // ⌘/Ctrl+Enter submits — the textarea keeps plain Enter for newlines.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void ask();
    }
  };

  const reset = () => {
    setAnswer('');
    setAsked('');
    setError('');
    setQuestion('');
  };

  const restingDisclaimer = restingDisclaimerFor(name, activeSummary.variant);

  return (
    <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.6rem', paddingTop: '1.1rem' }}>
      <p style={sectionLabelStyle}>
        ask this mind
        <span style={{ color: 'var(--accent)', marginLeft: '0.5rem', letterSpacing: '0.02em' }}>twin</span>
      </p>

      {!answer && (
        <>
          {showToggle && (
            <div
              role="group"
              aria-label="twin depth"
              style={{ display: 'flex', gap: '1.1rem', alignItems: 'baseline', margin: '0 0 1rem' }}
            >
              {usable.map((v) => {
                const isActive = v.variant === active;
                return (
                  <button
                    key={v.variant}
                    type="button"
                    onClick={() => setActive(v.variant)}
                    className="hover:opacity-100"
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '0 0 0.2rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      letterSpacing: '0.02em',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-ghost)',
                      borderBottom: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                      opacity: isActive ? 1 : 0.75,
                      transition: 'color 0.15s, opacity 0.15s',
                    }}
                    aria-pressed={isActive}
                  >
                    {VARIANT_META[v.variant].toggle}
                    {v.tools && (
                      <span style={{ color: 'var(--accent)', fontSize: '0.72rem', marginLeft: '0.35rem', letterSpacing: '0.04em' }}>
                        tools
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeSummary.label ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 0.9rem' }}>
              {activeSummary.label}
            </p>
          ) : (
            <p style={{ color: 'var(--text-ghost)', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 0.9rem' }}>
              {VARIANT_META[activeSummary.variant].hint}
            </p>
          )}

          <label htmlFor="twin-q" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            ask {name} a question
          </label>
          <textarea
            id="twin-q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            rows={2}
            placeholder={`ask ${name} anything…`}
            style={{
              width: '100%',
              resize: 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-light)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-eb-garamond)',
              fontSize: '1rem',
              lineHeight: 1.55,
              outline: 'none',
              padding: '0 0 0.55rem',
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '0.9rem 0 0' }}>
            <button
              type="button"
              onClick={() => void ask()}
              disabled={loading || !question.trim()}
              className="hover:opacity-60"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                cursor: loading || !question.trim() ? 'default' : 'pointer',
                opacity: loading || !question.trim() ? 0.45 : 1,
                transition: 'opacity 0.15s',
                border: 'none',
                background: 'none',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'thinking…' : 'ask'}
            </button>
            <span style={{ color: 'var(--text-whisper)', fontSize: '0.78rem' }}>⌘↵</span>
          </div>
        </>
      )}

      {answer && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 0.8rem', fontStyle: 'italic' }}>
            {asked}
          </p>
          <div
            style={{
              borderLeft: '2px solid var(--accent)',
              paddingLeft: '1rem',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)',
              fontSize: '0.98rem',
              lineHeight: 1.65,
            }}
          >
            {answer}
          </div>
          {showToggle && (
            <p style={{ color: 'var(--text-ghost)', fontSize: '0.74rem', letterSpacing: '0.04em', margin: '0.7rem 0 0' }}>
              {VARIANT_META[answeredVariant].toggle} · {answeredVariant === 'weights' ? 'weights twin' : 'context twin'}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="hover:opacity-60"
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              border: 'none',
              background: 'none',
              padding: 0,
              margin: '1.2rem 0 0',
              fontFamily: 'inherit',
            }}
          >
            ask another
          </button>
        </>
      )}

      {error && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-whisper)', margin: '0.8rem 0 0' }}>{error}</p>
      )}

      <p style={{ fontSize: '0.76rem', color: 'var(--text-ghost)', lineHeight: 1.5, margin: '1.4rem 0 0' }}>
        {answer ? disclaimer : restingDisclaimer}
      </p>
    </div>
  );
}
