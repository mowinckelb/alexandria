'use client';

import { useTheme } from '../components/ThemeProvider';
import FooterSection from '../components/FooterSection';
import PhilosophyFiveWays from '../components/PhilosophyFiveWays';


function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-[200] bg-transparent border-none cursor-pointer opacity-30 hover:opacity-50 transition-opacity p-0"
      style={{ color: 'var(--text-primary)' }}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}

export default function JoinPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />

      <section className="flex flex-col items-center justify-center px-8 min-h-screen" style={{ paddingTop: '6vh' }}>
        <div className="max-w-[420px]">

          <a href="/" className="no-underline">
            <p className="text-[1.3rem] sm:text-[1.5rem] font-normal leading-none tracking-tight text-center" style={{ color: 'var(--text-primary)' }}>
              alexandria.
            </p>
          </a>

          <div className="mt-14 sm:mt-16 space-y-10 text-[0.85rem] sm:text-[0.9rem] tracking-wide">

            <div className="space-y-4 leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
              <p>Your AI has memory. It&rsquo;s a mess &mdash; fragments on their servers, one model at a time, no structure, no push. Switch tools and you start over. It never makes you sharper.</p>
              <p>Alexandria builds one file about who you are &mdash; how you think, what you value, where you&rsquo;re blind. Markdown on your machine. Every AI reads it. Every conversation compounds.</p>
              <p>One command. Local files. You own everything.</p>
            </div>

            {/* Action */}
            <div className="py-2">
              <a
                href="/signup"
                className="text-[1.05rem] sm:text-[1.15rem] tracking-wide font-medium no-underline transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-primary)' }}
              >
                try now
              </a>
              <p className="mt-2 text-[0.65rem] tracking-wide" style={{ color: 'var(--text-ghost)' }}>
                free in beta
              </p>
            </div>

            {/* The philosophy, five ways */}
            <div className="pt-6">
              <PhilosophyFiveWays current="pitch" />
            </div>

          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
