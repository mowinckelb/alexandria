'use client';

import { useState } from 'react';
import { SERVER_URL } from '../lib/config';

// The decline path (founder verdict 2026-07-09): a "no" at the join step
// should still leave a contactable address — the reach the community gets
// recruited from. POSTs /onboard with source:'join' (waitlist row only — no
// install email, no nudge thread; see server/src/worker.ts). `refCode`
// preserves kin attribution on the lead, so the inviter's code stays with
// the email even when the join is deferred.
export default function JoinInterest({ refCode }: { refCode?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || state === 'sending') return;
    setState('sending');
    try {
      const resp = await fetch(`${SERVER_URL}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'join',
          ...(refCode ? { ref: refCode } : {}),
        }),
      });
      setState(resp.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <p className="join-interest-done">
        Noted &mdash; the tool stays free. We&rsquo;ll be in touch.
      </p>
    );
  }

  return (
    <div className="join-interest">
      <p className="join-interest-lede">
        Not now? Leave your email and carry on free &mdash; you&rsquo;ll hear
        from us as the community grows.
      </p>
      <form className="join-interest-row" onSubmit={send}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="email"
          aria-label="your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === 'error') setState('idle');
          }}
          required
        />
        <button type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'sending…' : 'keep in touch'}
        </button>
      </form>
      {state === 'error' && (
        <p className="join-interest-hint">couldn&rsquo;t send &mdash; try again.</p>
      )}
    </div>
  );
}
