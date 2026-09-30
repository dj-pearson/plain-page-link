/**
 * Stripe Webhook Handler
 *
 * Verifies the signature and hands the event to handler.ts, which holds the
 * processing logic (US-216) so it can be tested without Deno or Stripe.
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription modified
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_failed: Payment failed (dunning)
 * - invoice.paid / invoice.payment_succeeded: Payment successful
 *
 * Security:
 * - Stripe signature verification
 * - Idempotency (prevents duplicate processing)
 * - Service role for database access
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { sendEmail } from '../_shared/email.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { handleStripeEvent } from './handler.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

// US-216: esm.sh resolves stripe for Deno to its worker build, whose crypto
// provider is SubtleCrypto — which has no synchronous HMAC. The synchronous
// constructEvent() therefore throws on every call in this runtime, and every
// event was answered 400 before any of it was processed. The async variant
// with an explicit SubtleCrypto provider is the documented form for Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return json(400, { error: 'Webhook signature missing' });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (error) {
    // A bad signature is the one failure Stripe should not retry.
    console.error('Webhook signature verification failed:', error instanceof Error ? error.message : error);
    return json(400, { error: 'Invalid signature' });
  }

  const envPriceIds = Object.fromEntries(
    Object.entries(Deno.env.toObject()).filter(([key]) => key.startsWith('STRIPE_PRICE_'))
  );

  const result = await handleStripeEvent(event, {
    db: createClient(supabaseUrl, supabaseServiceKey),
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    sendEmail,
    getAgentContact,
    siteUrl: getSiteUrl(),
    envPriceIds,
  });
  return json(result.status, result.body);
});
