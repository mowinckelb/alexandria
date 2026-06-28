# Marketplace creator payouts + 10% add-on fee (Stripe Connect)

**Status:** staged, not started. Deferred-ceiling feature (pay-for-depth). Build when the first Author wants to charge for gated content, or as a deliberate scoped sprint — NOT before (off the current limiting factor: the 100-deep founding cohort, per a3 § RAISE GATE).

## Decision (founder, 2026-06-26 — canon: `~/alexandria-inc/private/truth/a3.md` § Library/marketplace)

Marketplace take-rate = **10%, as an add-on fee on top of the Author's price.** The Author sets price P and receives P in full; the buyer pays P × 1.10; Alexandria keeps the 10%. Example: $5 paywall → buyer pays **$5.50**, Author nets **$5**, Alexandria **$0.50**. Creator-friendly by design — the Author never sees a haircut (prioritises creator supply over buyer-side conversion; the surcharge is visible, Ticketmaster-shaped — accepted tradeoff).

## Current state (the gap)

`server/src/library.ts` checkout handlers — `/library/:author/checkout/file/:name` (L305), `/checkout/work` (L676), `/checkout/shadow` — create a Stripe Checkout session charging `settings.paid_price_cents` to the **platform** Stripe account. There is **no Stripe Connect, no `application_fee`, no `transfer_data`, no creator payout** anywhere in `server/src/`. So today: platform collects 100%, Author gets nothing in code. The 10%-add-on model cannot exist without creator payouts — that is the actual build.

## Build

1. **Author Connect onboarding** — Stripe Connect **Express** accounts (Stripe hosts KYC/onboarding). New flow: Author connects a payout account; store the connected `acct_` id on the account blob (AES-256-GCM in KV, per the statelessness rule in CLAUDE.md). **Gate "set a paid price" on having an active connected account** — you can't charge if you can't be paid out.
2. **Destination charge on checkout** — in each `/checkout/*` session creation (`library.ts:345`, `:706`, shadow): set `unit_amount = Math.round(paid_price_cents * 1.10)` and `payment_intent_data: { transfer_data: { destination: <author acct_> }, application_fee_amount: Math.round(paid_price_cents * 0.10) }`. Confirm the Author nets exactly P after Stripe's own processing fee — **decide:** surcharge Stripe's ~2.9%+30¢ to the buyer too, or absorb from the 10% (on a $5 item the 10% is $0.50 and Stripe takes ~$0.45 → absorbing leaves ~$0.05; likely surcharge it to the buyer or set a minimum price floor).
3. **Webhooks** (`server/src/billing.ts` existing handler) — `account.updated` (Connect status → unlock/lock paid pricing), `payment_intent.succeeded` (transfer confirmation), payout events.
4. **Edges** — refunds (reverse transfer + fee), disputes, the Stripe-fee floor on tiny prices (minimum price, or flat + percentage).

## Verify (Stripe test mode)

Create a connected test account → set a $5 paid file → buy it as another user → confirm buyer charged **$5.50**, Author's connected account receives **$5**, platform receives **$0.50** (minus Stripe's fee per the step-2 decision). Run `server/test/e2e.ts`. Health: `curl https://api.alexandria-library.com/health`.

## References

- `public/code/CLAUDE.md` — architecture, server layout, statelessness/encryption rules.
- `server/src/library.ts` — checkout handlers (the change site).
- `server/src/billing.ts` — Stripe client + webhook handler.
- a3.md § REVENUE — the canon decision + the add-on-tax mechanic.
