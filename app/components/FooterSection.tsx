'use client';

import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="pb-8 pt-16 px-8 text-center">
      <div className="flex justify-center gap-4 text-[0.55rem]" style={{ color: 'var(--text-ghost)' }}>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </div>
      <div className="mt-8">
        <p className="text-[0.6rem]" style={{ color: 'var(--text-ghost)' }}>
          a.
        </p>
      </div>
    </footer>
  );
}
