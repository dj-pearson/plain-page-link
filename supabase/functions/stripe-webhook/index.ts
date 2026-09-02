/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription and payment management.
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription modified
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_failed: Payment failed (dunning)
 * - invoice.paid: Payment successful
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
import { statusToStore } from '../_shared/subscription-entitlement.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

/**
 * Durable idempotency (US-084).
 *
 * This was a module-level Map plus a setInterval sweeper. Edge isolates are
 * ephemeral and horizontally scaled, so Stripe's retries landed on cold
 * instances with an empty map and reprocessed the event; the setInterval also
 * pinned the isolate for no benefit. The unique constraint on
 * stripe_processed_events IS the check — an insert that conflicts means the
 * event is already handled, which is race-free in a way read-then-write is not.
 *
 * Returns true when this call claimed the event and should process it.
 */
async function claimEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const { error } = await supabase
    .from('stripe_processed_events')
    .insert({ event_id: eventId, event_type: eventType });

  if (!error) return true;

  // 23505 = unique_violation: another delivery got there first.
  if (error.code === '23505') return false;

  // Anything else is a real failure. Fail OPEN — Stripe will retry, and
  // processing an event twice is far less damaging than dropping a
  // subscription change on the floor.
  console.error('Idempotency claim failed, processing anyway:', error.message);
  return true;
}

/**
 * Resolve a Stripe price id to the plan row it belongs to (US-118).
 *
 * This used to be a hard-coded map from 'price_starter_monthly' and friends —
 * literals that also appeared in src/config/pricing-plans.ts, and which are not
 * price ids that exist in any Stripe account. `subscription_plans` holds the
 * real ones (per environment, in three columns), so the table answers.
 *
 * The STRIPE_PRICE_* environment fallback is kept for an environment whose
 * plan rows have not been filled in yet.
 *
 * US-084: an unrecognised price fails closed to 'free'. It used to fall back to
 * 'professional', so a new tier, an add-on or a typo silently granted the paid
 * entitlements.
 */
async function resolvePlanFromPriceId(
  supabase: ReturnType<typeof createClient>,
  priceId: string | undefined
): Promise<{ name: string; id: string | null }> {
  if (!priceId) {
    console.error('[stripe-webhook] subscription item carried no price id');
    return { name: 'free', id: null };
  }

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name')
    .or(
      `stripe_price_id.eq.${priceId},stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`
    )
    .maybeSingle();

  if (!error && data?.name) {
    return { name: data.name as string, id: data.id as string };
  }

  const envPriceId = Object.entries(Deno.env.toObject()).find(
    ([key, value]) => value === priceId && key.startsWith('STRIPE_PRICE_')
  );

  if (envPriceId) {
    const name = envPriceId[0]
      .replace('STRIPE_PRICE_', '')
      .replace('_MONTHLY', '')
      .replace('_YEARLY', '')
      .toLowerCase();

    const { data: byName } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    return { name, id: (byName?.id as string) ?? null };
  }

  console.error(
    `[stripe-webhook] unrecognised Stripe price id ${priceId}; defaulting to the free plan`
  );
  return { name: 'free', id: null };
}

/** The flat limit columns on `subscriptions`, as this webhook writes them. */
interface FlatPlanLimits {
  max_listings: number;
  max_links: number;
  max_testimonials: number;
  analytics_history_days: number;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  priority_support: boolean;
}

/**
 * The most restrictive answer, used only when the plan row cannot be read.
 *
 * Deliberately the free plan and not `professional`, which is what the old
 * hard-coded table returned for an unknown name — a lookup miss handed out the
 * paid tier.
 */
const FALLBACK_LIMITS: FlatPlanLimits = {
  max_listings: 3,
  max_links: 5,
  max_testimonials: 3,
  analytics_history_days: 30,
  custom_domain_enabled: false,
  remove_branding: false,
  priority_support: false,
};

/**
 * The plan's limits, read from `subscription_plans` (US-118).
 *
 * This used to be a fourth hard-coded copy of the plan matrix, living here in
 * the webhook. It disagreed with src/config/pricing-plans.ts (analytics 7 days
 * on free, against 30 in the config) and with the pricing page, and nothing
 * could tell which was right. The table is the source of truth now; this maps
 * its jsonb onto the flat columns `subscriptions` actually has.
 */
async function loadPlanLimits(
  supabase: ReturnType<typeof createClient>,
  planName: string
): Promise<FlatPlanLimits> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('limits, features')
    .eq('name', planName)
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[stripe-webhook] no subscription_plans row for "${planName}"; falling back to free limits`,
      error?.message ?? ''
    );
    return FALLBACK_LIMITS;
  }

  const limits = (data.limits ?? {}) as Record<string, number>;
  const features = (data.features ?? {}) as Record<string, boolean>;

  // A missing key is not "unlimited": fall back to the free number, so a plan
  // row that is incomplete cannot grant more than it names.
  const num = (key: string, fallback: number) =>
    typeof limits[key] === 'number' ? limits[key] : fallback;

  return {
    max_listings: num('listings', FALLBACK_LIMITS.max_listings),
    max_links: num('links', FALLBACK_LIMITS.max_links),
    max_testimonials: num('testimonials', FALLBACK_LIMITS.max_testimonials),
    analytics_history_days: num('analytics_days', FALLBACK_LIMITS.analytics_history_days),
    custom_domain_enabled: features.customDomain === true,
    remove_branding: features.removeBranding === true,
    priority_support: features.prioritySupport === true,
  };
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response(
      JSON.stringify({ error: 'Webhook signature missing' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency check — durable, so a retry on a cold isolate is still a
    // duplicate rather than a re-run.
    if (!(await claimEvent(supabase, event.id, event.type))) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Processing event: ${event.type} (${event.id})`);

    // Audit every webhook event (best-effort; never blocks processing).
    // user_id is extracted from metadata when present, otherwise null (system).
    const auditUserId =
      ((event.data.object as { metadata?: { user_id?: string } })?.metadata?.user_id) ?? null;
    await supabase
      .rpc('log_audit_event', {
        p_user_id: auditUserId,
        p_action: `stripe_${event.type}`,
        p_status: 'success',
        p_resource_type: 'subscription',
        p_details: JSON.stringify({ event_id: event.id, event_type: event.type }),
      })
      .then(undefined, () => undefined);

    switch (event.type) {
      // ========================================
      // CHECKOUT COMPLETED - New subscription
      // ========================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle subscription mode
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.user_id;

          if (!userId) {
            console.error('No user_id in session metadata');
            break;
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          // One lookup for both the name and the id. The id used to come from a
          // separate query matching `stripe_price_id` alone — the pre-interval
          // column, which is NULL on every seeded row — so plan_id came back
          // undefined, user_subscriptions stored NULL, and get_user_plan's JOIN
          // found nothing. A paying agent was on the free plan from the moment
          // checkout completed (US-118).
          const plan = await resolvePlanFromPriceId(supabase, priceId);
          const planName = plan.name;
          const planLimits = await loadPlanLimits(supabase, planName);

          if (!plan.id) {
            console.error(
              `[stripe-webhook] no subscription_plans row matches price ${priceId}; the subscription will have no plan_id`
            );
          }

          // Update user_subscriptions table (relational model)
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan_id: plan.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: false,
            }, { onConflict: 'user_id' });

          // Update subscriptions table (flat model for quick access)
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan_name: planName,
              status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
              interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
              ...planLimits,
            }, { onConflict: 'user_id' });

          // Store Stripe customer mapping
          await supabase
            .from('stripe_customers')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              email: session.customer_email,
              is_active: true,
            }, { onConflict: 'user_id' });

          console.log(`Subscription created for user ${userId}: ${planName}`);
        }

        // One-time payment mode was removed in US-059: it wrote to a `purchases`
        // table no migration ever created, so every write silently failed, and no
        // caller in src/ ever requests mode: 'payment' — both call sites of
        // create-checkout-session pass a priceId only. If add-on purchases come
        // back, they need the table, RLS, and a recording path added together.

        break;
      }

      // ========================================
      // SUBSCRIPTION UPDATED
      // ========================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = await resolvePlanFromPriceId(supabase, priceId);
        const planName = plan.name;
        const planLimits = await loadPlanLimits(supabase, planName);

        // Stripe's own status, unchanged.
        //
        // This used to do `if (cancel_at_period_end) status = 'canceled'`, and
        // get_user_plan joins on the status — so the moment an agent scheduled
        // a cancellation they dropped to the free plan, losing weeks of the
        // plan they had already paid for. cancel_at_period_end is a separate
        // boolean, stored in its own column below; the status stays 'active'
        // until Stripe says otherwise (US-118).
        const status = statusToStore(subscription);

        // Update user_subscriptions table
        await supabase
          .from('user_subscriptions')
          .update({
            status: status,
            // Kept in step with the price. A plan change through the billing
            // portal arrives as customer.subscription.updated, and plan_id was
            // never updated here — so an agent who upgraded kept the entitlements
            // of the plan they left.
            ...(plan.id ? { plan_id: plan.id } : {}),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update subscriptions table
        await supabase
          .from('subscriptions')
          .update({
            plan_name: planName,
            status: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'cancelled',
            stripe_price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
            interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
            ...planLimits,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription updated: ${subscription.id} -> ${status}`);
        break;
      }

      // ========================================
      // SUBSCRIPTION DELETED (Canceled)
      // ========================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const freeLimits = await loadPlanLimits(supabase, 'free');

        // Update user_subscriptions table
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade to free plan in subscriptions table
        await supabase
          .from('subscriptions')
          .update({
            plan_name: 'free',
            status: 'cancelled',
            canceled_at: new Date().toISOString(),
            amount: 0,
            ...freeLimits,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription deleted: ${subscription.id}`);
        break;
      }

      // ========================================
      // INVOICE PAYMENT FAILED (Dunning)
      // ========================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Update status to past_due
          await supabase
            .from('user_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);

          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);

          // Get user for notification
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (sub?.user_id) {
            // Create notification record (if notifications table exists)
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: sub.user_id,
                  type: 'payment_failed',
                  title: 'Payment Failed',
                  message: 'Your subscription payment failed. Please update your payment method to continue your service.',
                  data: { invoice_id: invoice.id, amount: invoice.amount_due / 100 },
                });
            } catch {
              // Notifications table might not exist
              console.log('Could not create payment failed notification');
            }

            // Send a dunning email (best-effort; sendEmail never throws).
            // The account address is in auth.users, not on the profile —
            // see _shared/agent-contact.ts (US-070). This selected a column
            // that does not exist, so no customer whose card failed was ever
            // told about it.
            const profile = await getAgentContact(supabase, sub.user_id);

            if (!profile?.email) {
              console.error(`Dunning email skipped: no account email for ${sub.user_id}`);
            }

            if (profile?.email) {
              const portalUrl = `${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard/subscription`;
              await sendEmail({
                to: profile.email,
                subject: 'Action needed: your AgentBio payment failed',
                body: `Hi ${profile.fullName || 'there'},

We were unable to process your most recent AgentBio subscription payment${
                  invoice.amount_due ? ` of $${(invoice.amount_due / 100).toFixed(2)}` : ''
                }.

Please update your payment method to avoid any interruption to your service:
${portalUrl}

If you've already updated your details, you can ignore this message.

— The AgentBio Team`,
              });
            }
          }

          console.log(`Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      // ========================================
      // INVOICE PAID / PAYMENT SUCCEEDED (Payment success)
      // ========================================
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Ensure subscription is active
          await supabase
            .from('user_subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', subscriptionId);

          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', subscriptionId);

          // Record invoice
          try {
            await supabase
              .from('invoices')
              .upsert({
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: subscriptionId,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                status: 'paid',
                paid_at: invoice.status_transitions?.paid_at
                  ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                  : new Date().toISOString(),
                invoice_pdf: invoice.invoice_pdf,
                hosted_invoice_url: invoice.hosted_invoice_url,
              }, { onConflict: 'stripe_invoice_id' });
          } catch {
            // Invoices table might not exist
            console.log('Could not record invoice');
          }

          console.log(`Invoice paid for subscription: ${subscriptionId}`);
        }
        break;
      }

      // ========================================
      // PAYMENT INTENT SUCCEEDED (One-time)
      // ========================================

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
