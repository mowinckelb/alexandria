'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SERVER_URL } from '../lib/config';
import JoinInterest from './JoinInterest';

// The interactive join cluster — eyebrow through decline path. Owns the one
// piece of client state the page turns on: the VALIDATED referral code. A ref
// only counts once /check-kin confirms it's a real member login; until then the
// eyebrow stays generic and the code never rides the OAuth URL.
//
// Two ways a ref arrives: (1) the invite link /join?ref=LOGIN (urlRef, passed
// down sanitised from the server), or (2) typed into the "have a referral code?"
// field by someone who was told a code but has no link. Both flow through the
// same validation and, once valid, credit the inviter as kin through OAuth.
//
// This lifts the eyebrow + button into a client component so the invalid-ref
// display bug can't recur: the eyebrow reads the SAME validated state the button
// does, so a fake/typo ref shows neither the invite eyebrow nor a tagged URL.
function githubUrl(ref: string, refSource: string): string {
  const q = new URLSearchParams();
  if (ref) q.set('ref', ref);
  q.set('ref_source', refSource);
  return `${SERVER_URL}/auth/github?${q.toString()}`;
}

export default function JoinCTA({
  urlRef,
  refSource,
}: {
  urlRef?: string;
  refSource: string;
}) {
  // The code from the invite link, once validated (null = none/invalid).
  const [validUrlRef, setValidUrlRef] = useState<string | null>(null);
  // The code typed into the field, once validated.
  const [typedRef, setTypedRef] = useState('');
  const [typedValid, setTypedValid] = useState<string | null>(null);
  const [typedState, setTypedState] = useState<'idle' | 'checking' | 'invalid'>('idle');

  // Validate the URL ref once on mount (and if it changes).
  useEffect(() => {
    if (!urlRef) { setValidUrlRef(null); return; }
    let live = true;
    (async () => {
      const ok = await checkKin(urlRef);
      if (live) setValidUrlRef(ok ? urlRef : null);
    })();
    return () => { live = false; };
  }, [urlRef]);

  // Live-validate the typed code (debounced). A typed code only overrides the
  // link ref once it validates; whitespace/case is normalised to a login shape.
  useEffect(() => {
    const clean = typedRef.replace(/[^A-Za-z0-9-]/g, '').slice(0, 39);
    if (!clean) { setTypedValid(null); setTypedState('idle'); return; }
    let live = true;
    setTypedState('checking');
    const t = setTimeout(async () => {
      const ok = await checkKin(clean);
      if (!live) return;
      setTypedValid(ok ? clean : null);
      setTypedState(ok ? 'idle' : 'invalid');
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [typedRef]);

  // The typed code wins if valid (someone actively entered it); else the link ref.
  const effectiveRef = typedValid || validUrlRef || '';
  const joinUrl = githubUrl(effectiveRef, refSource);

  return (
    <>
      {validUrlRef ? (
        <p className="join-invite">@{validUrlRef} invited you in.</p>
      ) : (
        <p className="primer-eyebrow">the community</p>
      )}

      <h1 className="primer-h1">become a founding member.</h1>

      {/* FOUNDER-WRITTEN COPY (2026-07-17, fifth pass — he dictated the whole
          page; transcript cleaned, nothing invented). Above the button: the
          sample→meal frame, first-month-free, and the three-friends deal.
          Under the button: the $10 paragraph in his voice (worked up / penny
          pincher! / a dollar there is a dollar here / supporting our project)
          and the no-friends-no-dollars waive ending on "keep thinking,
          together". His one open slot was "the full product (or dish, or
          something idk)" — rendered as "the full meal" to complete the
          supermarket-sample frame. */}
      <p className="primer-lede">
        The tool was the free sample &mdash; the community is the full meal.
      </p>

      <div className="join-terms">
        <p className="join-line">
          The first month is free, so just try it &mdash; cancel anytime.
        </p>
        <p className="join-line">
          If you like it, get three friends to join, and it becomes free
          indefinitely.
        </p>
      </div>

      <a className="join-btn" href={joinUrl}>
        join with github
      </a>

      <p className="join-explain">
        After the month, if you haven&rsquo;t found three friends, it&rsquo;s
        $10 a month. Now, before you get yourself worked up &mdash;
        that&rsquo;s the same as two coffees a month, one Uber ride, or even
        a package delivery charge. So don&rsquo;t be a penny pincher! A
        dollar there is the same as a dollar here, but at least here
        you&rsquo;re supporting our project and trying to help people out.
      </p>
      <p className="join-waive">
        And if you don&rsquo;t have any friends and don&rsquo;t have ten
        dollars,{' '}
        <a href="mailto:benmowinckel@gmail.com?subject=waive%20it">message me</a>{' '}
        and I&rsquo;ll waive it for you &mdash; I just want people to keep
        thinking, together.
      </p>

      {/* The fine print — his three questions under one hairline, each an
          exit for a different reader: the invitee (code field, live-validated;
          when valid the code rides the join URL above), the not-joining
          (JoinInterest email capture), and the no-tool-yet (/start). */}
      <div className="join-details">
        <div className="join-code">
          <label className="join-code-label" htmlFor="join-code-input">
            been referred by a friend?
          </label>
          <div className="join-code-row">
            <input
              id="join-code-input"
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="referral code"
              aria-label="referral code (their github username)"
              value={typedRef}
              onChange={(e) => setTypedRef(e.target.value)}
            />
            {typedRef.trim() && (
              <span className="join-code-status" aria-live="polite">
                {typedState === 'checking'
                  ? 'checking…'
                  : typedValid
                    ? 'applied ✓'
                    : typedState === 'invalid'
                      ? 'not found'
                      : ''}
              </span>
            )}
          </div>
          <p className="join-code-hint">you&rsquo;ll get your own after joining.</p>
        </div>

        <JoinInterest refCode={effectiveRef || undefined} />

        <p className="join-secondary">
          Don&rsquo;t have the free tool yet?{' '}
          {/* Forward the validated ref so an invited visitor who takes the
              free door still credits their inviter as kin on install. */}
          <Link href={effectiveRef ? `/start?ref=${effectiveRef}` : '/start'}>Install it</Link>{' '}
          &mdash; it&rsquo;ll take you back here after.
        </p>
      </div>
    </>
  );
}

// One-shot kin-code check against the public /check-kin endpoint (GET
// ?code=LOGIN → { valid: boolean }, cached 60s server-side). Any failure =
// not valid, so a network blip never credits an unverified inviter.
async function checkKin(code: string): Promise<boolean> {
  try {
    const resp = await fetch(`${SERVER_URL}/check-kin?code=${encodeURIComponent(code)}`);
    if (!resp.ok) return false;
    const data = await resp.json().catch(() => ({ valid: false }));
    return data.valid === true;
  } catch {
    return false;
  }
}
