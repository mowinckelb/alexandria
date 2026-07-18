'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Update, UpdateMeta } from '../../lib/updates';
import { ThemeToggle } from '../../components/ThemeToggle';
import { CopyIcon, TickIcon } from '../../join/DoorIcons';

const SITE = 'https://alexandria-library.com';

// The single-update reader — rebuilt onto the shared primer skeleton (founder
// 2026-07-17, funnel-consistency sweep): CSS-var theme (dark mode now works),
// flush-left spine, brand header, ThemeToggle. Was on the old hardcoded palette
// (styled-jsx, light-only) with the "a." watermark chrome. Content structure —
// meta, title, optional YouTube embed, markdown body, prev/next nav — unchanged.
export default function UpdatePage({
  update,
  chronological,
}: {
  update: Update;
  chronological: UpdateMeta[];
}) {
  // Copied state for the share door — the icon swaps copy→tick in place
  // (same 15px box, so nothing jitters).
  const [copied, setCopied] = useState(false);
  const copySite = async () => {
    try {
      await navigator.clipboard.writeText(SITE);
    } catch { /* clipboard unavailable — the visible link still works */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="primer-page">
      <ThemeToggle />

      <header className="primer-header">
        <Link href="/" className="primer-brand">
          alexandria<span className="primer-brand-dot">.</span>
        </Link>
      </header>

      <main className="primer-main">
        <article className="update">
          <header className="update-head">
            <p className="update-meta">
              <Link href="/updates" className="update-meta-link">updates</Link>
              <span className="update-meta-sep"> &middot; </span>
              <span className="update-slug">{update.slug}</span>
              {update.date ? (
                <>
                  <span className="update-meta-sep"> &middot; </span>
                  <span className="update-date">{update.date}</span>
                </>
              ) : null}
            </p>
            <h1 className="update-title">{update.subject}</h1>
          </header>

          {update.youtube ? (
            <div className="update-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${update.youtube}`}
                title={update.subject}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}

          <div className="update-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{update.body}</ReactMarkdown>
          </div>

          {/* Standing share door — the same question/answer idiom as the
              other pages' fine print, so every update carries the ask without
              each letter having to write it (founder 2026-07-17). One visible
              link, one copy icon that ticks in place. */}
          <div className="update-share">
            <p className="update-share-q">know someone who&rsquo;d want these?</p>
            <p className="update-share-line">
              send them to{' '}
              <a href={SITE}>alexandria-library.com</a>{' '}
              <button
                type="button"
                className={`update-share-copy${copied ? ' is-done' : ''}`}
                onClick={copySite}
                aria-label={copied ? 'copied' : 'copy the link'}
              >
                {copied ? <TickIcon /> : <CopyIcon />}
              </button>{' '}
              &mdash; they can follow along from there.
            </p>
          </div>

          {chronological.length > 1 ? (
            <nav className="update-nav" aria-label="other updates">
              {chronological.map((u, i) => (
                <span key={u.slug} className="update-nav-item">
                  {u.slug === update.slug ? (
                    <strong>{u.slug}</strong>
                  ) : (
                    <Link href={`/updates/${u.slug}`}>{u.slug}</Link>
                  )}
                  {i < chronological.length - 1 ? <span className="update-nav-sep"> &middot; </span> : null}
                </span>
              ))}
            </nav>
          ) : null}
        </article>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .primer-page {
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: var(--font-serif), ui-serif, Georgia, serif;
    background-image:
      radial-gradient(ellipse 120% 80% at 30% 20%, rgba(91, 31, 71, 0.025) 0%, transparent 60%),
      radial-gradient(ellipse 100% 70% at 70% 80%, rgba(74, 50, 30, 0.020) 0%, transparent 60%);
    animation: primerFadeIn 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  @keyframes primerFadeIn {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .primer-header { padding: 28px 32px 0; }
  .primer-brand {
    font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-style: italic; font-weight: 400; font-size: 21px;
    color: var(--text-primary); text-decoration: none;
    letter-spacing: 0.005em; transition: opacity 220ms ease;
    display: inline-block; padding: 10px 8px; margin: -10px -8px;
  }
  .primer-brand:hover { opacity: 0.6; }
  .primer-brand-dot { font-style: normal; }

  .primer-main {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: flex-start; justify-content: flex-start;
    max-width: 680px; margin: 0 auto; padding: clamp(3rem, 9vh, 6rem) 40px 6rem; width: 100%;
  }
  .update { width: 100%; max-width: 620px; }

  .update-head { margin-bottom: 36px; }
  .update-meta {
    margin: 0 0 14px; font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-size: 12.5px; color: var(--text-muted); letter-spacing: 0.03em; font-style: italic;
    font-variant-caps: all-small-caps; text-transform: lowercase;
  }
  .update-meta-link {
    color: var(--text-muted); text-decoration: none;
    border-bottom: 1px solid var(--bg-tertiary, rgba(61, 54, 48, 0.2)); padding-bottom: 1px;
    transition: color 200ms;
  }
  .update-meta-link:hover { color: var(--text-primary); }
  .update-meta-sep { color: var(--text-muted); font-style: normal; opacity: 0.6; }
  .update-slug, .update-date { font-variant-numeric: tabular-nums; }

  .update-title {
    margin: 0; font-family: var(--font-eb-garamond), ui-serif, Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: clamp(28px, 1.6rem + 1.4vw, 34px); line-height: 1.2;
    letter-spacing: -0.015em; color: var(--text-primary); text-wrap: balance;
  }

  .update-video {
    position: relative; padding-bottom: 56.25%; height: 0; margin: 32px 0 8px;
    background: var(--bg-secondary); border-radius: 4px; overflow: hidden;
  }
  .update-video iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }

  .update-body {
    margin-top: 32px; font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-size: 18px; line-height: 1.72; color: var(--text-secondary);
    font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
  }
  .update-body p { margin: 0 0 1.4em; text-wrap: pretty; }
  .update-body em { font-style: italic; color: var(--text-primary); }
  .update-body strong { font-weight: 600; color: var(--text-primary); }
  .update-body a {
    color: var(--text-primary); text-decoration: underline;
    text-decoration-color: var(--text-muted, rgba(61, 54, 48, 0.4));
    text-underline-offset: 3px; text-decoration-thickness: 1px; transition: text-decoration-color 200ms;
  }
  .update-body a:hover { text-decoration-color: var(--text-primary); }
  .update-body h2, .update-body h3 {
    font-weight: 500; color: var(--text-primary); letter-spacing: -0.01em;
    margin: 1.6em 0 0.5em; line-height: 1.3;
  }
  .update-body h2 { font-size: 22px; }
  .update-body h3 { font-size: 19px; }
  .update-body hr { border: none; border-top: 1px solid var(--bg-tertiary, rgba(61, 54, 48, 0.14)); margin: 2.2em 0; }
  .update-body blockquote {
    margin: 1.4em 0; padding-left: 18px;
    border-left: 2px solid var(--bg-tertiary, rgba(61, 54, 48, 0.18));
    color: var(--text-muted); font-style: italic;
  }
  .update-body ul, .update-body ol { margin: 0 0 1.4em; padding-left: 1.4em; }
  .update-body li { margin: 0 0 0.5em; }

  /* Share door — the question/answer fine-print idiom. */
  .update-share {
    margin-top: 48px; padding-top: 26px;
    border-top: 1px solid var(--bg-tertiary, rgba(61, 54, 48, 0.14));
  }
  .update-share-q {
    margin: 0 0 10px; font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-weight: 500; font-size: 12px; letter-spacing: 0.12em;
    text-transform: lowercase; font-variant-caps: all-small-caps;
    font-feature-settings: "smcp" 1, "kern" 1;
    color: var(--text-muted); line-height: 1;
  }
  .update-share-line {
    margin: 0; font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-size: 15px; line-height: 1.6; color: var(--text-secondary);
  }
  .update-share-line a {
    color: var(--text-primary); text-decoration: underline;
    text-decoration-color: var(--text-muted, rgba(61, 54, 48, 0.4));
    text-underline-offset: 3px; text-decoration-thickness: 1px;
    transition: text-decoration-color 200ms;
  }
  .update-share-line a:hover { text-decoration-color: var(--text-primary); }
  /* Fixed 15px glyph box — copy→tick swaps in place, nothing moves. */
  .update-share-copy {
    display: inline-flex; align-items: center; vertical-align: -2px;
    padding: 0; background: none; border: none; cursor: pointer;
    color: var(--text-muted); transition: color 200ms;
  }
  .update-share-copy:hover { color: var(--text-primary); }
  .update-share-copy.is-done { color: var(--text-primary); cursor: default; }
  .update-share-copy .door-glyph { display: block; }

  .update-nav {
    margin-top: 52px; padding-top: 24px;
    border-top: 1px solid var(--bg-tertiary, rgba(61, 54, 48, 0.14));
    font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-size: 14px; color: var(--text-muted); letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }
  .update-nav a { color: var(--text-muted); text-decoration: none; transition: color 200ms ease; }
  .update-nav a:hover { color: var(--text-primary); }
  .update-nav strong { color: var(--text-primary); font-weight: 500; }
  .update-nav-sep { color: var(--text-muted); opacity: 0.6; }

  @media (max-width: 640px) {
    .primer-main { padding: 2.5rem 24px 4rem; }
    .update-title { font-size: 25px; }
    .update-body { font-size: 17px; }
  }
`;
