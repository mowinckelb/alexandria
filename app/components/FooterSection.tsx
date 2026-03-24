'use client';

export default function FooterSection() {
  return (
    <footer className="pb-8 pt-16 px-8 text-center space-y-3">
      <p className="text-[0.6rem] italic" style={{ color: 'var(--text-ghost)' }}>
        mentes aeternae
      </p>
      <div className="flex justify-center gap-4 text-[0.55rem]" style={{ color: 'var(--text-ghost)' }}>
        <a href="/privacy" className="hover:underline">Privacy</a>
        <a href="/terms" className="hover:underline">Terms</a>
      </div>
      <p className="text-[0.6rem]" style={{ color: 'var(--text-ghost)' }}>
        a.
      </p>
    </footer>
  );
}
