'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SERVER_URL } from '../lib/config';

// The invitation, personalised. The ref (the inviter's GitHub login) is only
// shown once /check-kin confirms it's a real member — a fake/typo ref renders
// the generic "a friend sent you" version, same as everywhere else on the
// site. The validated ref rides the try-it link to /start, which carries it
// through install → eventual join for kin attribution.
export default function InviteClient({ refCode }: { refCode?: string }) {
  const [validRef, setValidRef] = useState<string | null>(null);

  useEffect(() => {
    if (!refCode) { setValidRef(null); return; }
    let live = true;
    (async () => {
      try {
        const resp = await fetch(`${SERVER_URL}/check-kin?code=${encodeURIComponent(refCode)}`);
        const data = await resp.json().catch(() => ({ valid: false }));
        if (live) setValidRef(resp.ok && data.valid ? refCode : null);
      } catch {
        if (live) setValidRef(null);
      }
    })();
    return () => { live = false; };
  }, [refCode]);

  const startHref = validRef ? `/start?ref=${validRef}` : '/start';

  return (
    <>
      <header className="primer-header">
        <Link href="/" className="primer-brand">
          alexandria<span className="primer-brand-dot">.</span>
        </Link>
      </header>

      <main className="primer-main">
        <p className="primer-eyebrow">an invitation</p>
        <h1 className="invite-hero">
          {validRef ? (
            <>@{validRef} sent you alexandria.</>
          ) : (
            <>a friend sent you alexandria.</>
          )}
        </h1>
        <p className="invite-lede">
          It&rsquo;s a free tool that makes your ai think <em>with</em> you,
          not for you &mdash; and a community of people using it. Five
          minutes, on your own computer, nothing to buy.
        </p>

        <Link className="invite-btn" href={startHref}>
          try it free
        </Link>
        <p className="invite-hint">one line to paste &mdash; it walks you through the rest.</p>

        <p className="invite-more">
          want to see what it&rsquo;s about first?{' '}
          <Link href="/">alexandria-library.com</Link>
        </p>

        <p className="primer-coda"><em>keep thinking.</em></p>
      </main>
    </>
  );
}
