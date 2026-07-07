import { NextRequest } from 'next/server';
import { SERVER_URL } from '../../lib/config';

/**
 * Same-origin proxy for the homepage "ask Alexandria" box.
 *
 * SECURITY (plm.md § SETTLED structural security model): this does NOT run
 * inference. It forwards the question to the Worker's `/ask` route, which is
 * itself a pure RELAY to the sidecar's isolated `/guide` endpoint — the model
 * runs on the founder's device, reading ONLY public product knowledge (no
 * substrate, no shadow). Worker-side inference was proposed and retracted ("the
 * mind stays on the device"). So the whole path is relay-only, holds no key, and
 * — because nothing secret is in its reach — leaks nothing even if fully hacked.
 *
 * Anonymous by construction: no auth forwarded. Rate-limit, daily cap, and the
 * demand-signal log all live in the Worker `/ask` handler.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const bodyText = await req.text();

  const upstream = await fetch(`${SERVER_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyText,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
