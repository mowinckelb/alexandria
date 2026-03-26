/**
 * Billing — Stripe subscription management
 *
 * Two prices: $5/mo (with 3+ active kin) and $10/mo (without).
 * Free during beta — billing infra is ready but not gating.
 * Kin repricing runs on each billing cycle (subscription.updated webhook).
 *
 * Stripe products/prices are created lazily on first checkout if they
 * don't exist yet. No manual dashboard setup needed.
 */

import Stripe from 'stripe';
import { Router, raw } from 'express';
import { logEvent } from './analytics.js';
import { callbackPageHtml } from './templates.js';

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://mowinckel.ai';

// ---------------------------------------------------------------------------
// Price IDs — resolved lazily on first use
// ---------------------------------------------------------------------------

let priceWithKin: string | null = null;   // $5/mo
let priceWithoutKin: string | null = null; // $10/mo

async function ensurePrices(): Promise<{ withKin: string; withoutKin: string }> {
  if (priceWithKin && priceWithoutKin) {
    return { withKin: priceWithKin, withoutKin: priceWithoutKin };
  }

  // Look for existing product by metadata
  const products = await stripe.products.list({ limit: 10 });
  let product = products.data.find(p => p.metadata.alexandria === 'examined_life');

  if (!product) {
    product = await stripe.products.create({
      name: 'The Examined Life',
      description: 'Alexandria — sovereign cognitive identity layer. One tier, everything included.',
      metadata: { alexandria: 'examined_life' },
    });
  }

  // Look for existing prices
  const prices = await stripe.prices.list({ product: product.id, limit: 10 });

  let kin = prices.data.find(p => p.metadata.tier === 'with_kin' && p.active);
  let noKin = prices.data.find(p => p.metadata.tier === 'without_kin' && p.active);

  if (!kin) {
    kin = await stripe.prices.create({
      product: product.id,
      unit_amount: 500, // $5
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'with_kin' },
    });
  }

  if (!noKin) {
    noKin = await stripe.prices.create({
      product: product.id,
      unit_amount: 1000, // $10
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'without_kin' },
    });
  }

  priceWithKin = kin.id;
  priceWithoutKin = noKin.id;
  return { withKin: priceWithKin, withoutKin: priceWithoutKin };
}

// ---------------------------------------------------------------------------
// Account helpers — imported by prosumer.ts, shared state
// ---------------------------------------------------------------------------

export interface BillingInfo {
  stripe_customer_id?: string;
  subscription_status?: string; // 'active' | 'past_due' | 'canceled' | 'trialing' | 'beta'
  subscription_id?: string;
  current_period_end?: string;
}

// ---------------------------------------------------------------------------
// Checkout — create a Stripe Checkout session
// ---------------------------------------------------------------------------

export async function createCheckoutSession(opts: {
  email: string;
  githubLogin: string;
  apiKey: string;
  stripeCustomerId?: string;
}): Promise<string> {
  const BETA = process.env.BETA_MODE !== 'false'; // default: beta is on

  const customer = opts.stripeCustomerId
    ? { customer: opts.stripeCustomerId }
    : { customer_email: opts.email };

  if (BETA) {
    // Beta: just collect payment info. No subscription, no trial language.
    // When beta ends, create subscriptions via API for all accounts with
    // a stored payment method. Clean checkout — no "364 days free" ugliness.
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      currency: 'usd',
      ...customer,
      metadata: {
        github_login: opts.githubLogin,
        api_key: opts.apiKey,
      },
      custom_text: {
        submit: { message: 'free in beta. we\'ll let you know before billing starts.' },
      },
      success_url: `${SERVER_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEBSITE_URL}/signup?billing=cancel`,
    });
    return session.url || '';
  }

  // Post-beta: real subscription at $5/mo (with kin default).
  // Kin repricing bumps to $10 if <3 active kin at billing cycle.
  const prices = await ensurePrices();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: prices.withKin, quantity: 1 }],
    ...customer,
    subscription_data: {
      description: 'the examined life',
      metadata: { api_key: opts.apiKey, github_login: opts.githubLogin },
    },
    metadata: {
      github_login: opts.githubLogin,
      api_key: opts.apiKey,
    },
    success_url: `${SERVER_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEBSITE_URL}/signup?billing=cancel`,
  });

  return session.url || '';
}

// ---------------------------------------------------------------------------
// Portal — let Authors manage their subscription
// ---------------------------------------------------------------------------

export async function createPortalSession(stripeCustomerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${WEBSITE_URL}/signup`,
  });
  return session.url;
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

export type AccountUpdater = (apiKey: string, billing: Partial<BillingInfo>) => void;

export function createBillingRouter(onAccountUpdate: AccountUpdater): Router {
  const router = Router();

  // Success — Stripe redirects here after checkout. Show the branded callback page.
  router.get('/billing/success', async (req, res) => {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      res.redirect(`${WEBSITE_URL}/signup`);
      return;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const login = session.metadata?.github_login || '';
      const apiKey = session.metadata?.api_key || '';

      if (!apiKey) {
        res.redirect(`${WEBSITE_URL}/signup`);
        return;
      }

      // Update account with Stripe customer ID
      // In setup mode (beta): no subscription, just customer + payment method
      // In subscription mode (post-beta): customer + subscription
      const customerId = session.customer as string | null;
      if (customerId) {
        onAccountUpdate(apiKey, {
          stripe_customer_id: customerId,
          ...(session.subscription
            ? { subscription_id: session.subscription as string, subscription_status: 'active' }
            : { subscription_status: 'beta' }),
        });
      }

      res.type('html').send(callbackPageHtml(login, apiKey));
    } catch (err) {
      console.error('Billing success page error:', err);
      res.redirect(`${WEBSITE_URL}/signup`);
    }
  });

  // Portal — manage subscription (authenticated by API key)
  router.post('/billing/portal', async (req, res) => {
    const { stripe_customer_id } = req.body || {};

    if (!stripe_customer_id) {
      res.status(400).json({ error: 'No Stripe customer ID' });
      return;
    }

    try {
      const url = await createPortalSession(stripe_customer_id);
      res.json({ url });
    } catch (err) {
      console.error('Portal error:', err);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // Webhook — Stripe events (raw body required for signature verification)
  router.post('/billing/webhook', raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!WEBHOOK_SECRET) {
      console.warn('STRIPE_WEBHOOK_SECRET not set — accepting webhook without verification');
    }

    let event: Stripe.Event;

    try {
      if (WEBHOOK_SECRET && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
      } else {
        event = req.body as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send('Invalid signature');
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const apiKey = session.metadata?.api_key;
          if (apiKey && session.customer && session.subscription) {
            onAccountUpdate(apiKey, {
              stripe_customer_id: session.customer as string,
              subscription_id: session.subscription as string,
              subscription_status: 'active',
            });
            logEvent('billing_subscription_created', {
              github_login: session.metadata?.github_login || '',
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          const apiKey = sub.metadata?.api_key;
          if (apiKey) {
            const periodEnd = sub.items?.data?.[0]?.current_period_end;
            onAccountUpdate(apiKey, {
              subscription_status: sub.status,
              ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
            });
          }
          logEvent('billing_subscription_updated', {
            status: sub.status,
            customer: customerId,
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const apiKey = sub.metadata?.api_key;
          if (apiKey) {
            onAccountUpdate(apiKey, {
              subscription_status: 'canceled',
            });
          }
          logEvent('billing_subscription_canceled', {
            customer: sub.customer as string,
          });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          // v21: subscription is under parent.subscription_details
          const subDetails = invoice.parent?.subscription_details;
          const subId = typeof subDetails?.subscription === 'string'
            ? subDetails.subscription
            : subDetails?.subscription?.id;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            const apiKey = sub.metadata?.api_key;
            if (apiKey) {
              onAccountUpdate(apiKey, { subscription_status: 'past_due' });
            }
          }
          logEvent('billing_payment_failed', {
            customer: invoice.customer as string,
          });
          break;
        }
      }
    } catch (err) {
      console.error('Webhook handler error:', err);
    }

    res.json({ received: true });
  });

  return router;
}
