# Email vendor check (Resend vs Cloudflare) — and a deferred Vercel question

**Founder decisions 2026-06-24:**
- **Vercel → KEEP (decided, not migrating).** Vercel hosts only the public website (no secrets — those are in Cloudflare Workers), it's the best Next.js host, and it's CLI-controllable (hybrid, allowed). Migrating trades real Next-16-adapter/ISR risk for one fewer logo. Not worth it. Part A below kept for reference only — **do NOT execute unless the founder reopens it.**
- **Resend → TEST Cloudflare, keep Resend unless CF clearly wins.** Resend is reputable (not sketchy) and works. Only switch if Cloudflare's transactional sending matches Resend's inbox deliverability. The bar is deliverability, nothing else.

## Part B (THE ACTIVE TASK) — test Cloudflare email sending vs Resend. Feasibility: VERIFY deliverability.
Send path is clean: one `sendEmail()` (`src/email.ts:52`) POSTs `https://api.resend.com/emails` with `RESEND_API_KEY`; from `a@alexandria-library.com` (domain already on Cloudflare DNS → DKIM/SPF/DMARC easy). ~6–8 transactional types + `sendEmailsBatched` broadcasts; consumed by email.ts/cron.ts/billing.ts/routes.ts. **Swapping the backend = changing ONE function's fetch.** Mechanically trivial.
**Cloudflare DOES now have a native Email Sending product** (use the `cloudflare-email-service` skill for current setup — my earlier MailChannels-era pessimism is likely outdated). So existence is probably fine; **the real test is deliverability:** set up CF Email Sending on a test subdomain (or the real domain's DKIM), send each transactional type to a few inbox providers (Gmail/Outlook/iCloud), confirm inbox-not-spam, check the batched-broadcast path. **If CF lands in inboxes as well as Resend → migrate (swap the fetch, move the key to a CF binding, delete Resend). If any deliverability regression → KEEP Resend, close this task.** Don't migrate email just to migrate; users hitting spam is worse than one extra vendor.

---
## Part A — Vercel → Cloudflare (website) — REFERENCE ONLY (founder decided to KEEP Vercel). Feasibility was: MODERATE-HIGH, with known gotchas.
App = **Next.js 16.2.6** (`app/`). Adapter path: `@opennextjs/cloudflare` (Workers) — NOT the older `next-on-pages`.
Features in use + how each lands on Cloudflare:
- `redirects()` + `headers()` (`next.config.ts`) — supported. ✅
- `next/og` `ImageResponse`, `runtime = "edge"` (`app/opengraph-image.tsx`) — Workers support edge OG. ✅ (verify Satori/font loading).
- **ISR** — `next: { revalidate: 300/3600 }` in pulse/quiz pages — needs the adapter's incremental cache (R2/KV-backed). **VERIFY @opennextjs/cloudflare ISR support on Next 16** (biggest risk — Next 16 is very new, adapter may lag).
- **`@vercel/analytics/next`** (`app/layout.tsx`) — Vercel-only. **Remove or swap to Cloudflare Web Analytics.** Trivial.
**Plan skeleton:** branch → add `@opennextjs/cloudflare` + `wrangler` Pages/Workers config → drop `@vercel/analytics` → `npm run build` via adapter → deploy to a `*.workers.dev` preview → smoke every route (redirects, OG image, ISR pages, library) → move DNS (`alexandria-library.com`) from Vercel to the Cloudflare site → verify → decommission Vercel project.

## Part B — Resend → Cloudflare (email). Feasibility: UNCERTAIN — verify FIRST, may not be a clean win.
Send path is clean: one `sendEmail()` (`src/email.ts:52`) POSTs `https://api.resend.com/emails` with `RESEND_API_KEY`; from `a@alexandria-library.com` (domain already on Cloudflare DNS, so DKIM/SPF/DMARC setup is easy). ~6–8 transactional types + `sendEmailsBatched` broadcasts; consumed by email.ts/cron.ts/billing.ts/routes.ts. **Swapping the backend = changing ONE function's fetch.** Mechanically trivial.
**The real open question — does Cloudflare even have a native transactional SENDING product that replaces Resend?** Cloudflare **Email Routing = inbound/forwarding only.** Outbound transactional historically leaned on MailChannels, whose free Cloudflare tie-in **ended 2024**. So Cloudflare may NOT natively send transactional mail at good deliverability. **VERIFY before committing** (use the `cloudflare-email-service` skill + current CF docs). If Cloudflare can't cleanly send transactional with inbox-grade deliverability → **KEEP Resend** (it "just works"; deliverability to users is worth one vendor). Don't migrate email just to migrate.
**Deliverability is the gate:** these emails go to real users — a spam-folder regression is worse than one extra vendor.

## Recommendation
Do Part A (Vercel) — worth it. Treat Part B (Resend) as "verify Cloudflare can actually replace it; if not, keep Resend." Plan-first session: resolve the two VERIFY questions (Next-16 adapter ISR; CF native transactional sending) before any cutover.
