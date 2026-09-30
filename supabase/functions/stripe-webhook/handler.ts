/**
 * What the Stripe webhook does with a verified event (US-216).
 *
 * Kept free of Deno globals and runtime imports from esm.sh so vitest can run
 * it: index.ts verifies the signature, builds the dependencies and hands the
 * event here.
 *
 * The rule this module exists to hold: a 2xx means the database has the
 * change. Stripe retries anything else for three days, so an error is how a
 * transient failure gets a second chance. Before US-216:
 *
 *   - 3 of 19 database writes checked their error. An upsert into
 *     user_subscriptions — the row get_user_plan() reads to decide an agent's
 *     plan — could fail and the webhook still answered 200.
 *   - The event was recorded as processed BEFORE any of the work, so when a
 *     thrown error did produce a non-2xx, Stripe's retry was skipped as a
 *     duplicate. Either way the payment never reached the plan.
 *   - A checkout session with no user_id in its metadata was a silent 200.
 *
 * Now every write that decides entitlement throws on error, a failure releases
 * the idempotency claim so the retry runs, and the handler answers 500.
 * Best-effort side effects (audit log, in-app notification, dunning email,
 * invoice copy) are logged when they fail but never fail the event.
 */

import type Stripe from 'https://esm.sh/stripe@14.21.0';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { statusToStore } from '../_shared/subscription-entitlement.ts';

export interface WebhookDeps {
  db: SupabaseClient;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  sendEmail(options: { to: string; subject: string; body: string }): Promise<unknown>;
  getAgentContact(
    db: SupabaseClient,
    userId: string
  ): Promise<{ email?: string | null; fullName?: string | null } | null>;
  siteUrl: string;
  /** STRIPE_PRICE_* environment variables, name → price id. */
  envPriceIds: Record<string, string>;
}

export interface WebhookResult {
  status: number;
  body: Record<string, unknown>;
}

/** A write the event cannot be considered processed without. */
export class WebhookWriteError extends Error {}

function must<T extends { error: { message: string } | null }>(result: T, what: string): T {
  if (result.error) throw new WebhookWriteError(`${what}: ${result.error.message}`);
  return result;
}

function warnIf(result: { error: { message: string } | null }, what: string): void {
  if (result.error) console.error(`[stripe-webhook] ${what} failed (non-fatal):`, result.error.message);
}

type Claim = 'claimed' | 'duplicate' | 'unclaimed';

/**
 * Durable idempotency (US-084): the unique constraint on
 * stripe_processed_events is the check.
 *
 * If the claim itself cannot be written for any reason other than a duplicate,
 * the event is processed without one. Every entitlement write below is an
 * upsert or an update to the same values, so a repeat is harmless — whereas
 * refusing to process would leave paying agents on the free plan for as long
 * as the table is unreachable (it is missing in production today, US-146).
 */
async function claimEvent(db: SupabaseClient, event: Stripe.Event): Promise<Claim> {
  const { error } = await db
    .from('stripe_processed_events')
    .insert({ event_id: event.id, event_type: event.type });
  if (!error) return 'claimed';
  if (error.code === '23505') return 'duplicate';
  console.error('[stripe-webhook] idempotency claim failed; processing without one:', error.message);
  return 'unclaimed';
}

async function releaseClaim(db: SupabaseClient, eventId: string): Promise<void> {
  const { error } = await db.from('stripe_processed_events').delete().eq('event_id', eventId);
  if (error) {
    // The retry will be skipped as a duplicate. Loud, because this is the one
    // way an event can still be lost.
    console.error(`[stripe-webhook] could not release claim on ${eventId}; its retry will be skipped:`, error.message);
  }
}

export async function handleStripeEvent(event: Stripe.Event, deps: WebhookDeps): Promise<WebhookResult> {
  const claim = await claimEvent(deps.db, event);
  if (claim === 'duplicate') {
    console.log(`Event ${event.id} already processed, skipping`);
    return { status: 200, body: { received: true, skipped: true } };
  }

  try {
    await processEvent(event, deps);
  } catch (error) {
    if (claim === 'claimed') await releaseClaim(deps.db, event.id);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[stripe-webhook] ${event.type} (${event.id}) failed; Stripe will retry:`, message);
    return { status: 500, body: { error: message } };
  }

  return { status: 200, body: { received: true } };
}

/**
 * Resolve a Stripe price id to its plan row (US-118). An unrecognised price
 * fails closed to 'free' (US-084); a database error throws, so a transient
 * failure is retried instead of recording a paying agent as free.
 */
async function resolvePlanFromPriceId(
  deps: WebhookDeps,
  priceId: string | undefined
): Promise<{ name: string; id: string | null }> {
  if (!priceId) {
    console.error('[stripe-webhook] subscription item carried no price id');
    return { name: 'free', id: null };
  }

  const { data } = must(
    await deps.db
      .from('subscription_plans')
      .select('id, name')
      .or(`stripe_price_id.eq.${priceId},stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .maybeSingle(),
    'subscription_plans lookup by price'
  );
  if (data?.name) return { name: data.name as string, id: data.id as string };

  const envKey = Object.entries(deps.envPriceIds).find(
    ([key, value]) => value === priceId && key.startsWith('STRIPE_PRICE_')
  )?.[0];
  if (envKey) {
    const name = envKey.replace('STRIPE_PRICE_', '').replace('_MONTHLY', '').replace('_YEARLY', '').toLowerCase();
    const { data: byName } = must(
      await deps.db.from('subscription_plans').select('id').eq('name', name).maybeSingle(),
      'subscription_plans lookup by name'
    );
    return { name, id: (byName?.id as string) ?? null };
  }

  console.error(`[stripe-webhook] unrecognised Stripe price id ${priceId}; defaulting to the free plan`);
  return { name: 'free', id: null };
}

/** The flat limit columns on `subscriptions`, as this webhook writes them. */
export interface FlatPlanLimits {
  max_listings: number;
  max_links: number;
  max_testimonials: number;
  analytics_history_days: number;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  priority_support: boolean;
}

/** The free plan's numbers: used when a plan row is missing, never more. */
export const FALLBACK_LIMITS: FlatPlanLimits = {
  max_listings: 3,
  max_links: 5,
  max_testimonials: 3,
  analytics_history_days: 30,
  custom_domain_enabled: false,
  remove_branding: false,
  priority_support: false,
};

/**
 * The plan's limits from `subscription_plans` (US-118), mapped onto the flat
 * columns of `subscriptions`. That table is a copy for admin screens;
 * get_user_plan() is the authority.
 */
async function loadPlanLimits(deps: WebhookDeps, planName: string): Promise<FlatPlanLimits> {
  const { data } = must(
    await deps.db.from('subscription_plans').select('limits, features').eq('name', planName).maybeSingle(),
    'subscription_plans limits'
  );
  if (!data) {
    console.error(`[stripe-webhook] no subscription_plans row for "${planName}"; falling back to free limits`);
    return FALLBACK_LIMITS;
  }

  const limits = (data.limits ?? {}) as Record<string, number>;
  const features = (data.features ?? {}) as Record<string, boolean>;
  const num = (key: string, fallback: number) => (typeof limits[key] === 'number' ? limits[key] : fallback);

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

/**
 * Stripe's status as the subscription_status enum can hold it
 * (active, canceled, past_due, incomplete, trialing). Stripe also sends unpaid,
 * paused and incomplete_expired; writing those raised an enum error that the
 * unchecked update used to swallow, and would now fail the event forever.
 */
export function toStoredStatus(subscription: Stripe.Subscription): string {
  const status = statusToStore(subscription);
  switch (status) {
    case 'active':
    case 'canceled':
    case 'past_due':
    case 'incomplete':
    case 'trialing':
      return status;
    case 'unpaid':
      return 'past_due';
    default:
      // incomplete_expired, paused, anything new: not paying.
      return 'canceled';
  }
}

const iso = (seconds: number) => new Date(seconds * 1000).toISOString();

/**
 * The agent a checkout belongs to: the user_id create-checkout-session put in
 * the metadata, else whoever already owns the Stripe customer. Neither is an
 * error Stripe should stop retrying.
 */
async function resolveCheckoutUser(deps: WebhookDeps, session: Stripe.Checkout.Session): Promise<string> {
  if (session.metadata?.user_id) return session.metadata.user_id;

  const customerId = session.customer as string | null;
  if (customerId) {
    const { data } = must(
      await deps.db.from('stripe_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle(),
      'stripe_customers lookup'
    );
    if (data?.user_id) return data.user_id as string;
  }
  throw new WebhookWriteError(
    `checkout session ${session.id} has no user_id in its metadata and customer ${customerId ?? '(none)'} is unknown`
  );
}

async function processEvent(event: Stripe.Event, deps: WebhookDeps): Promise<void> {
  const { db } = deps;
  console.log(`Processing event: ${event.type} (${event.id})`);

  // Audit every webhook event (best-effort).
  const auditUserId = (event.data.object as { metadata?: { user_id?: string } })?.metadata?.user_id ?? null;
  warnIf(
    await db.rpc('log_audit_event', {
      p_user_id: auditUserId,
      p_action: `stripe_${event.type}`,
      p_status: 'success',
      p_resource_type: 'subscription',
      p_details: JSON.stringify({ event_id: event.id, event_type: event.type }),
    }),
    'audit log'
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // One-time payments were removed in US-059; only subscriptions are sold.
      if (session.mode !== 'subscription') return;

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const userId = await resolveCheckoutUser(deps, session);

      const subscription = await deps.retrieveSubscription(subscriptionId);
      const price = subscription.items.data[0]?.price;
      const plan = await resolvePlanFromPriceId(deps, price?.id);
      const planLimits = await loadPlanLimits(deps, plan.name);
      if (!plan.id) {
        console.error(`[stripe-webhook] no subscription_plans row matches price ${price?.id}; plan_id will be null`);
      }

      must(
        await db.from('user_subscriptions').upsert(
          {
            user_id: userId,
            plan_id: plan.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: toStoredStatus(subscription),
            current_period_start: iso(subscription.current_period_start),
            current_period_end: iso(subscription.current_period_end),
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          },
          { onConflict: 'user_id' }
        ),
        'user_subscriptions upsert'
      );

      must(
        await db.from('subscriptions').upsert(
          {
            user_id: userId,
            plan_name: plan.name,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: price?.id,
            current_period_start: iso(subscription.current_period_start),
            current_period_end: iso(subscription.current_period_end),
            amount: (price?.unit_amount || 0) / 100,
            interval: price?.recurring?.interval || 'month',
            ...planLimits,
          },
          { onConflict: 'user_id' }
        ),
        'subscriptions upsert'
      );

      must(
        await db.from('stripe_customers').upsert(
          { user_id: userId, stripe_customer_id: customerId, email: session.customer_email, is_active: true },
          { onConflict: 'user_id' }
        ),
        'stripe_customers upsert'
      );

      console.log(`Subscription created for user ${userId}: ${plan.name}`);
      return;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const price = subscription.items.data[0]?.price;
      const plan = await resolvePlanFromPriceId(deps, price?.id);
      const planLimits = await loadPlanLimits(deps, plan.name);
      // Stripe's status unchanged; a scheduled cancellation is its own column (US-118).
      const status = toStoredStatus(subscription);

      must(
        await db
          .from('user_subscriptions')
          .update({
            status,
            ...(plan.id ? { plan_id: plan.id } : {}),
            current_period_start: iso(subscription.current_period_start),
            current_period_end: iso(subscription.current_period_end),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id),
        'user_subscriptions update'
      );

      must(
        await db
          .from('subscriptions')
          .update({
            plan_name: plan.name,
            status: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'cancelled',
            stripe_price_id: price?.id,
            current_period_start: iso(subscription.current_period_start),
            current_period_end: iso(subscription.current_period_end),
            cancel_at: subscription.cancel_at ? iso(subscription.cancel_at) : null,
            amount: (price?.unit_amount || 0) / 100,
            interval: price?.recurring?.interval || 'month',
            ...planLimits,
          })
          .eq('stripe_subscription_id', subscription.id),
        'subscriptions update'
      );

      console.log(`Subscription updated: ${subscription.id} -> ${status}`);
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const freeLimits = await loadPlanLimits(deps, 'free');

      must(
        await db
          .from('user_subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: false })
          .eq('stripe_subscription_id', subscription.id),
        'user_subscriptions cancel'
      );

      must(
        await db
          .from('subscriptions')
          .update({
            plan_name: 'free',
            status: 'cancelled',
            canceled_at: new Date().toISOString(),
            amount: 0,
            ...freeLimits,
          })
          .eq('stripe_subscription_id', subscription.id),
        'subscriptions cancel'
      );

      console.log(`Subscription deleted: ${subscription.id}`);
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) return;

      must(
        await db.from('user_subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', subscriptionId),
        'user_subscriptions past_due'
      );
      must(
        await db.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', subscriptionId),
        'subscriptions past_due'
      );

      const { data: sub } = must(
        await db.from('user_subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).maybeSingle(),
        'user_subscriptions lookup'
      );
      if (!sub?.user_id) return;

      warnIf(
        await db.from('notifications').insert({
          user_id: sub.user_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method to continue your service.',
          data: { invoice_id: invoice.id, amount: invoice.amount_due / 100 },
        }),
        'payment_failed notification'
      );

      // The account address lives in auth.users, not on the profile (US-070).
      const contact = await deps.getAgentContact(db, sub.user_id as string);
      if (!contact?.email) {
        console.error(`Dunning email skipped: no account email for ${sub.user_id}`);
        return;
      }
      await deps.sendEmail({
        to: contact.email,
        subject: 'Action needed: your AgentBio payment failed',
        body: `Hi ${contact.fullName || 'there'},

We were unable to process your most recent AgentBio subscription payment${
          invoice.amount_due ? ` of $${(invoice.amount_due / 100).toFixed(2)}` : ''
        }.

Please update your payment method to avoid any interruption to your service:
${deps.siteUrl}/dashboard/subscription

If you've already updated your details, you can ignore this message.

— The AgentBio Team`,
      });
      console.log(`Payment failed for subscription: ${subscriptionId}`);
      return;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) return;

      must(
        await db.from('user_subscriptions').update({ status: 'active' }).eq('stripe_subscription_id', subscriptionId),
        'user_subscriptions active'
      );
      must(
        await db.from('subscriptions').update({ status: 'active' }).eq('stripe_subscription_id', subscriptionId),
        'subscriptions active'
      );

      warnIf(
        await db.from('invoices').upsert(
          {
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subscriptionId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'paid',
            paid_at: invoice.status_transitions?.paid_at
              ? iso(invoice.status_transitions.paid_at)
              : new Date().toISOString(),
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
          },
          { onConflict: 'stripe_invoice_id' }
        ),
        'invoice record'
      );
      console.log(`Invoice paid for subscription: ${subscriptionId}`);
      return;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
