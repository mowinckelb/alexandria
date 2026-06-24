import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import MechanicsCopy from '../components/MechanicsCopy';
import StartCTA from './StartCTA';

export const dynamic = 'force-dynamic';

// The front door. Free, local, one copy-paste — no account. The hub (joining
// the Library, being seen) is opt-in and comes later, so it isn't here.
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
            one line, pasted into your ai, and you&rsquo;re in.
          </h1>

          <StartCTA />

          <p className="primer-body">
            it installs a folder on your own machine &mdash; plain markdown,
            your files. every ai you use reads it and thinks <em>with</em> you,
            not for you. and as you use it, it develops your mind &mdash; the one
            thing ai can&rsquo;t do for you.
          </p>

          <p className="primer-body">
            free, local, nothing sent anywhere. it gives your ai reading
            material, not new powers. and if you ever want out: delete the folder
            and it&rsquo;s as if it never happened &mdash; the exact commands are
            in <MechanicsCopy content={mechanicsContent} />.
          </p>

          <p className="primer-coda"><em>welcome to alexandria.</em></p>
        </article>
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

        /* Centred column, generous breathing room — the page is mostly the one
           action and two quiet beats around it. Earned restraint. */
        .primer-main { max-width: 560px; margin: 0 auto; padding: 7rem 24px 6rem; }

        .primer-salutation {
          margin: 0 0 30px; font-style: italic; font-size: 12px; font-weight: 400;
          letter-spacing: 0.22em; color: var(--text-muted, rgba(26, 19, 24, 0.55));
          text-transform: lowercase; text-align: center;
        }
        .primer-h1 {
          margin: 0 0 52px; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-style: italic; font-weight: 400; font-size: 30px; line-height: 1.4;
          letter-spacing: -0.005em; color: var(--text-primary); text-wrap: pretty;
          text-align: center; font-feature-settings: "kern" 1, "liga" 1, "dlig" 1;
        }

        /* The two supporting beats — short, plain, room to breathe after the
           action. White space is absorption time. */
        .primer-body {
          margin: 44px 0 0; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 17px; line-height: 1.72; color: var(--text-secondary, rgba(26, 19, 24, 0.85));
          letter-spacing: 0.005em; font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
          text-wrap: pretty; text-align: center;
        }
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

        /* CTA — the install copy-block, the hero. A bordered card with the
           monospace command + a copy affordance; the literary register frames it. */
        .cta-section {
          display: flex; flex-direction: column; align-items: center;
          gap: 0; margin: 0;
        }
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
        .install-deeplink {
          display: inline-flex; align-items: center; gap: 0.4em;
          font-family: var(--font-serif), ui-serif, Georgia, serif; font-style: italic;
          font-size: 14px; color: var(--text-muted, rgba(26, 19, 24, 0.6)); text-decoration: none;
          margin-top: 14px; transition: color 200ms;
        }
        .install-deeplink:hover { color: var(--text-primary); }

        .primer-coda {
          margin: 64px 0 0; text-align: center; font-family: var(--font-serif), ui-serif, Georgia, serif;
          font-size: 21px; font-style: italic; color: var(--text-primary);
          letter-spacing: 0.005em; opacity: 0.78;
        }

        @media (max-width: 640px) {
          .primer-main { padding: 4.5rem 20px 4rem; }
          .primer-h1 { font-size: 24px; line-height: 1.4; margin-bottom: 44px; }
          .primer-body { font-size: 16px; margin-top: 36px; }
          .install-cmd { font-size: 12.5px; }
          .primer-coda { font-size: 19px; margin-top: 56px; }
        }
      `}</style>
    </div>
  );
}
