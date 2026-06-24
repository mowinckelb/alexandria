import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import MechanicsCopy from '../components/MechanicsCopy';
import StartCTA from './StartCTA';

export const dynamic = 'force-dynamic';

// The keyless front door: free, local, one copy-paste. No account, no payment.
// Signing in to join the Library is opt-in and later (the /signup covenant).
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
        <article className="primer">
          <p className="primer-salutation">to the new alexandrian.</p>

          <h1 className="primer-h1">
            one line, pasted into your ai, and you&rsquo;re in &mdash; free, local, yours.
          </h1>

          <section className="primer-section">
            <p className="primer-label">what it is.</p>
            <p>
              alexandria is a folder on your own machine &mdash; plain
              markdown, your files, your shape. every ai you use reads it
              and thinks <em>with</em> you, not for you. and as you use it,
              it develops your mind &mdash; the one thing ai cannot do for
              you.
            </p>
          </section>

          <section className="primer-section primer-section--action">
            <p className="primer-label">how to begin.</p>
            <p>
              copy the line below and paste it into your ai. it installs to{' '}
              <code>~/alexandria/</code> and drafts a first version of who you
              are from what&rsquo;s already on your machine. no account, no
              payment, nothing to sign. that&rsquo;s it.
            </p>
          </section>

          <StartCTA />

          <section className="primer-section">
            <p className="primer-label">the sovereignty.</p>
            <p>
              free and local &mdash; nothing is sent anywhere. your worldline
              lives in a git repo on your machine. if alexandria disappears
              tomorrow, you keep everything. we never see what you do not
              publish.
            </p>
          </section>

          <section className="primer-section">
            <p className="primer-label">the security.</p>
            <p>
              what gets installed is one folder of text files on your own
              computer, plus a few small entries so your ai knows it exists.
              nothing else is touched. it gives your ai reading material, not
              new powers &mdash; it can do exactly what it could yesterday, and
              it still asks before it acts.
            </p>
            <p>
              and if you ever want out: delete the folder and it is as if it
              never happened. the exact commands are in{' '}
              <MechanicsCopy content={mechanicsContent} />, along with
              everything else the install does.
            </p>
          </section>

          <section className="primer-section">
            <p className="primer-label">later, if you want it.</p>
            <p>
              when you want to be seen &mdash; to join the library of minds and
              connect with other alexandrians &mdash; you can sign in. that is
              opt-in and comes later, never required. the gym is yours, free,
              for as long as you like.
            </p>
          </section>
        </article>

        <p className="primer-coda"><em>welcome to alexandria.</em></p>
      </main>

      <style>{`
        .primer-page {
          background: var(--bg-primary);
          color: var(--text-primary);
          min-height: 100vh;
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
        .primer-main { max-width: 580px; margin: 0 auto; padding: 5rem 24px 6rem; }
        .primer-salutation {
          margin: 0 0 28px; font-style: italic; font-size: 12px; font-weight: 400;
          letter-spacing: 0.22em; color: var(--text-muted, rgba(26, 19, 24, 0.55));
          text-transform: lowercase;
        }
        .primer-h1 {
          margin: 0 0 64px; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-style: italic; font-weight: 400; font-size: 27px; line-height: 1.42;
          letter-spacing: -0.005em; color: var(--text-primary); text-wrap: pretty;
          font-feature-settings: "kern" 1, "liga" 1, "dlig" 1;
        }
        .primer-section { margin: 0 0 48px; }
        .primer-section--action { margin-bottom: 28px; }
        .primer-label {
          margin: 0 0 14px; font-style: italic; font-size: 12px; font-weight: 400;
          letter-spacing: 0.22em; text-transform: lowercase;
          color: var(--text-muted, rgba(26, 19, 24, 0.55));
        }
        .primer p:not(.primer-label):not(.primer-salutation):not(.primer-coda):not(.install-hint) {
          margin: 0 0 16px; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 17px; line-height: 1.7; color: var(--text-secondary, rgba(26, 19, 24, 0.85));
          letter-spacing: 0.005em; font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
          text-wrap: pretty;
        }
        .primer p:last-child { margin-bottom: 0; }
        .primer em { font-style: italic; color: var(--text-primary); }
        .primer code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.88em; padding: 0.08em 0.4em; border-radius: 3px;
          background: var(--bg-secondary); color: var(--text-primary);
        }
        .primer button.mechanics-copy {
          display: inline-flex; align-items: baseline; gap: 0.3em; background: transparent;
          border: none; padding: 0; margin: 0; font: inherit; font-family: inherit;
          font-size: inherit; color: var(--text-primary); cursor: pointer;
          text-decoration: underline; text-decoration-color: var(--text-muted, rgba(26, 19, 24, 0.45));
          text-underline-offset: 3px; text-decoration-thickness: 1px;
          transition: opacity 200ms, text-decoration-color 200ms;
        }
        .primer button.mechanics-copy:hover { text-decoration-color: var(--text-primary); opacity: 0.85; }
        .primer .mechanics-copy-icon { display: inline-flex; align-items: center; opacity: 0.55; }

        /* CTA — the install copy-block, the hero action. A bordered card with the
           monospace command + a copy affordance; the literary register frames it. */
        .cta-section {
          display: flex; flex-direction: column; align-items: center;
          gap: 0; padding: 8px 0 8px; margin: 0 0 48px;
        }
        .install-block {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          width: 100%; max-width: 470px; background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary, rgba(26, 19, 24, 0.14)); border-radius: 8px;
          padding: 15px 18px; cursor: pointer; font: inherit; text-align: left;
          transition: border-color 200ms, opacity 200ms;
        }
        .install-block:hover { border-color: var(--text-muted, rgba(26, 19, 24, 0.4)); }
        .install-cmd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 14px; color: var(--text-primary); white-space: nowrap;
          overflow-x: auto; scrollbar-width: none;
        }
        .install-cmd::-webkit-scrollbar { display: none; }
        .install-copy {
          display: inline-flex; align-items: center; flex-shrink: 0;
          color: var(--text-muted, rgba(26, 19, 24, 0.5));
        }
        .install-block:hover .install-copy { color: var(--text-primary); }
        .install-hint {
          font-family: var(--font-serif), ui-serif, Georgia, serif; font-style: italic;
          font-size: 13px; letter-spacing: 0.04em; color: var(--text-muted, rgba(26, 19, 24, 0.55));
          margin: 14px 0 0; text-align: center;
        }
        .install-deeplink {
          display: inline-flex; align-items: center; gap: 0.4em;
          font-family: var(--font-serif), ui-serif, Georgia, serif; font-style: italic;
          font-size: 15px; color: var(--text-primary); text-decoration: underline;
          text-decoration-color: var(--text-muted, rgba(26, 19, 24, 0.4));
          text-underline-offset: 4px; text-decoration-thickness: 1px; margin-top: 20px;
          transition: text-decoration-color 200ms, opacity 200ms;
        }
        .install-deeplink:hover { text-decoration-color: var(--text-primary); opacity: 0.9; }

        .primer-coda {
          margin: 64px 0 0; text-align: center; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 21px; font-style: italic; color: var(--text-primary);
          letter-spacing: 0.005em; opacity: 0.78;
        }

        @media (max-width: 640px) {
          .primer-main { padding: 3rem 20px 4rem; }
          .primer-h1 { font-size: 22px; line-height: 1.42; margin-bottom: 48px; }
          .primer p:not(.primer-label):not(.primer-salutation):not(.primer-coda):not(.install-hint) {
            font-size: 16px; line-height: 1.7;
          }
          .primer-section { margin-bottom: 40px; }
          .install-cmd { font-size: 12.5px; }
          .primer-coda { font-size: 19px; margin-top: 56px; }
        }
      `}</style>
    </div>
  );
}
