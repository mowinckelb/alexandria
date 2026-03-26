'use client';

import { useTheme } from '../components/ThemeProvider';

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

export default function ShortcutPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />

      <section className="flex flex-col items-center justify-center px-8 min-h-screen">
        <div className="max-w-[420px] flex flex-col items-center">

          <a href="/" className="no-underline">
            <p className="text-[1.3rem] sm:text-[1.5rem] font-normal leading-none tracking-tight text-center" style={{ color: 'var(--text-primary)' }}>
              alexandria.
            </p>
          </a>

          <div className="mt-14 sm:mt-16 space-y-10 text-center">

            <div className="space-y-4">
              <p className="text-[0.6rem] tracking-widest uppercase" style={{ color: 'var(--text-ghost)', letterSpacing: '0.2em' }}>
                vault shortcut
              </p>
              <p className="text-[0.85rem] sm:text-[0.9rem] tracking-wide leading-[1.9]" style={{ color: 'var(--text-secondary)' }}>
                capture from your phone. share anything &mdash; voice memos, journal entries, articles, youtube videos, podcasts &mdash; and it lands in your vault. /a processes the rest.
              </p>
            </div>

            <a
              href="https://www.icloud.com/shortcuts/PLACEHOLDER"
              className="inline-block text-[1.05rem] sm:text-[1.15rem] tracking-wide font-medium no-underline transition-opacity hover:opacity-60"
              style={{ color: 'var(--text-primary)' }}
            >
              get shortcut
            </a>

            <div className="space-y-5 text-[0.78rem] sm:text-[0.82rem] tracking-wide leading-[1.9]" style={{ color: 'var(--text-muted)' }}>
              <p>uses the share sheet. tap share on anything, tap the shortcut.</p>
              <p>voice memos get transcribed on device. urls get saved as-is &mdash; the model fetches the content when you run /a</p>
              <p>everything syncs to <code style={{ fontSize: '0.9em', color: 'var(--text-primary)' }}>~/.alexandria/vault/</code> via iCloud.</p>
            </div>

            <div className="pt-4">
              <p className="text-[0.65rem] tracking-wide" style={{ color: 'var(--text-ghost)' }}>
                requires iCloud Drive &middot; iOS 17+ or macOS
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
