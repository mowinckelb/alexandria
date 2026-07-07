import { NextRequest } from 'next/server';
import { SERVER_URL, ASK_AUTHOR } from '../../lib/config';

/**
 * Same-origin proxy for the homepage "ask Alexandria" box.
 *
 * SECURITY (plm.md § SETTLED structural security model): this does NOT run
 * inference — it forwards the question to the EXISTING device-sidecar twin
 * endpoint (/library/{author}/ask), where the Worker only relays question-in /
 * answer-out and the model runs on the author's own device. Worker-side
 * inference was proposed and retracted ("the mind stays on the device, period").
 * So the homepage box reuses the one live, audited relay — no new Worker
 * endpoint, no company Anthropic key on our infra, no new trust surface.
 *
 * Anonymous by construction: no auth is forwarded, so the twin resolves to the
 * PUBLIC tier (public shadow only — never substrate). Rate-limit, per-author
 * daily cap, visibility gate, and the credits ledger all live in the shared
 * runTwinQuery core the endpoint already uses.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const bodyText = await req.text();

  const upstream = await fetch(
    `${SERVER_URL}/library/${encodeURIComponent(ASK_AUTHOR)}/ask`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyText },
  );

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
