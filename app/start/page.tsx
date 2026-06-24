import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import MechanicsCopy from '../components/MechanicsCopy';
import StartCTA from './StartCTA';

export const dynamic = 'force-dynamic';

// The front door, stripped to the incompressible core: one true line of what it
// is, the line to paste, three words of trust, a close. Nothing else earns space.
export default async function StartPage() {
  const mechanicsContent = await readFile(
    path.join(process.cwd(), 'public', 'docs', 'Mechanics.md'),
    'utf8',
  );

  return (
    <div className="primer-page">
      <ThemeToggle />

      <header className="primer-header">
        <Link href="/" className="primer-brand">
          alexandria<span className="primer-brand-dot">.</span>
        </Link>
      </header>

      <main className="primer-main">
        <h1 className="primer-h1">
          your mind, in words &mdash; so every ai thinks <em>with</em> you, not
          for you.
        </h1>

        <StartCTA />

        <p className="primer-trust">
          free, local, yours &mdash; the full{' '}
          <MechanicsCopy content={mechanicsContent} /> if you want it.
        </p>

        <p className="primer-coda"><em>keep thinking.</em></p>
      </main>

      <style>{`
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

        /* The whole page is centred in the viewport — the command floating in
           space, framed by one line above and a few words below. */
        .primer-main {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          max-width: 540px; margin: 0 auto; padding: 3rem 24px 6rem; width: 100%;
        }

        .primer-h1 {
          margin: 0 0 56px; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-style: italic; font-weight: 400; font-size: 31px; line-height: 1.4;
          letter-spacing: -0.005em; color: var(--text-primary); text-wrap: balance;
          text-align: center; font-feature-settings: "kern" 1, "liga" 1, "dlig" 1;
        }
        .primer-h1 em { font-style: italic; }

        .primer-trust {
          margin: 40px 0 0; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 14px; line-height: 1.6; letter-spacing: 0.01em;
          color: var(--text-muted, rgba(26, 19, 24, 0.55)); text-align: center;
          font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
        }
        .primer-trust button.mechanics-copy {
          display: inline-flex; align-items: baseline; gap: 0.3em; background: transparent;
          border: none; padding: 0; margin: 0; font: inherit; font-family: inherit;
          font-size: inherit; color: var(--text-secondary, rgba(26, 19, 24, 0.8)); cursor: pointer;
          text-decoration: underline; text-decoration-color: var(--text-muted, rgba(26, 19, 24, 0.4));
          text-underline-offset: 3px; text-decoration-thickness: 1px;
          transition: opacity 200ms, text-decoration-color 200ms;
        }
        .primer-trust button.mechanics-copy:hover { text-decoration-color: var(--text-primary); color: var(--text-primary); }
        .primer-trust .mechanics-copy-icon { display: inline-flex; align-items: center; opacity: 0.5; }

        /* CTA — the install copy-block, the one action on the page. */
        .cta-section { display: flex; flex-direction: column; align-items: center; gap: 0; margin: 0; }
        .install-block {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          width: 100%; max-width: 440px; background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary, rgba(26, 19, 24, 0.14)); border-radius: 9px;
          padding: 16px 18px; cursor: pointer; font: inherit; text-align: left;
          transition: border-color 200ms, transform 120ms;
        }
        .install-block:hover { border-color: var(--text-muted, rgba(26, 19, 24, 0.42)); }
        .install-block:active { transform: scale(0.992); }
        .install-cmd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 14px; color: var(--text-primary); white-space: nowrap;
          overflow-x: auto; scrollbar-width: none;
        }
        .install-cmd::-webkit-scrollbar { display: none; }
        .install-copy {
          display: inline-flex; align-items: center; flex-shrink: 0;
          color: var(--text-muted, rgba(26, 19, 24, 0.5)); transition: color 200ms;
        }
        .install-block:hover .install-copy { color: var(--text-primary); }
        .install-hint {
          font-family: var(--font-serif), ui-serif, Georgia, serif; font-style: italic;
          font-size: 13px; letter-spacing: 0.04em; color: var(--text-muted, rgba(26, 19, 24, 0.55));
          margin: 16px 0 0; text-align: center;
        }

        .primer-coda {
          margin: 60px 0 0; text-align: center; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 20px; font-style: italic; color: var(--text-primary);
          letter-spacing: 0.005em; opacity: 0.72;
        }

        @media (max-width: 640px) {
          .primer-main { padding: 2rem 20px 4rem; }
          .primer-h1 { font-size: 25px; line-height: 1.4; margin-bottom: 48px; }
          .install-cmd { font-size: 12.5px; }
          .primer-coda { font-size: 18px; margin-top: 52px; }
        }
      `}</style>
    </div>
  );
}
