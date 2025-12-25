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
 * - payment_intent.succeeded: One-time payment completed
 *
 * Security:
 * - Stripe signature verification
 * - Idempotency (prevents duplicate processing)
 * - Service role for database access
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// In-memory idempotency cache (for edge functions)
// In production, consider using Redis or database table
const processedEvents = new Map<string, number>();

// Clean old entries every 5 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (timestamp < oneHourAgo) {
      processedEvents.delete(eventId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if event was already processed (idempotency)
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
}

/**
 * Get plan name from price ID
 */
function getPlanNameFromPriceId(priceId: string): string {
  // Map price IDs to plan names
  const priceMap: Record<string, string> = {
    'price_starter_monthly': 'starter',
    'price_starter_yearly': 'starter',
    'price_professional_monthly': 'professional',
    'price_professional_yearly': 'professional',
    'price_team_monthly': 'team',
    'price_team_yearly': 'team',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  };

  // Check environment variables for production price IDs
  const envPriceId = Object.entries(Deno.env.toObject())
    .find(([key, value]) => value === priceId && key.startsWith('STRIPE_PRICE_'));

  if (envPriceId) {
    const planName = envPriceId[0]
      .replace('STRIPE_PRICE_', '')
      .replace('_MONTHLY', '')
      .replace('_YEARLY', '')
      .toLowerCase();
    return planName;
  }

  return priceMap[priceId] || 'professional';
}

/**
 * Get plan limits based on plan name
 */
function getPlanLimits(planName: string): {
  max_listings: number;
  max_links: number;
  max_testimonials: number;
  analytics_history_days: number;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  priority_support: boolean;
} {
  const limits: Record<string, any> = {
    free: {
      max_listings: 3,
      max_links: 5,
      max_testimonials: 3,
      analytics_history_days: 7,
      custom_domain_enabled: false,
      remove_branding: false,
      priority_support: false,
    },
    starter: {
      max_listings: 10,
      max_links: 15,
      max_testimonials: 10,
      analytics_history_days: 90,
      custom_domain_enabled: false,
      remove_branding: false,
      priority_support: false,
    },
    professional: {
      max_listings: 25,
      max_links: -1, // unlimited
      max_testimonials: 25,
      analytics_history_days: 365,
      custom_domain_enabled: true,
      remove_branding: true,
      priority_support: false,
    },
    team: {
      max_listings: -1,
      max_links: -1,
      max_testimonials: -1,
      analytics_history_days: 730,
      custom_domain_enabled: true,
      remove_branding: true,
      priority_support: true,
    },
    enterprise: {
      max_listings: -1,
      max_links: -1,
      max_testimonials: -1,
      analytics_history_days: -1,
      custom_domain_enabled: true,
      remove_branding: true,
      priority_support: true,
    },
  };

  return limits[planName] || limits.professional;
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

    // Idempotency check
    if (isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Processing event: ${event.type} (${event.id})`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          const planName = getPlanNameFromPriceId(priceId);
          const planLimits = getPlanLimits(planName);

          // Get plan from database
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('stripe_price_id', priceId)
            .single();

          // Update user_subscriptions table (relational model)
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan_id: plan?.id,
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

        // Handle one-time payment mode
        if (session.mode === 'payment') {
          const userId = session.metadata?.user_id;
          const productType = session.metadata?.product_type;

          if (userId && productType) {
            // Record one-time purchase
            await supabase
              .from('purchases')
              .insert({
                user_id: userId,
                product_type: productType,
                stripe_payment_intent_id: session.payment_intent as string,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency || 'usd',
                status: 'completed',
              });

            console.log(`One-time purchase recorded for user ${userId}: ${productType}`);
          }
        }
        break;
      }

      // ========================================
      // SUBSCRIPTION UPDATED
      // ========================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const planName = getPlanNameFromPriceId(priceId);
        const planLimits = getPlanLimits(planName);

        // Map Stripe status to our status
        let status = subscription.status;
        if (subscription.cancel_at_period_end) {
          status = 'canceled'; // Will cancel at end of period
        }

        // Update user_subscriptions table
        await supabase
          .from('user_subscriptions')
          .update({
            status: status,
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
        const freeLimits = getPlanLimits('free');

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
          }

          console.log(`Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      // ========================================
      // INVOICE PAID (Payment success)
      // ========================================
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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.user_id;
        const productType = paymentIntent.metadata?.product_type;

        if (userId && productType) {
          // Update purchase status
          await supabase
            .from('purchases')
            .update({ status: 'completed' })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          console.log(`Payment intent succeeded for user ${userId}: ${productType}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    markEventProcessed(event.id);

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
