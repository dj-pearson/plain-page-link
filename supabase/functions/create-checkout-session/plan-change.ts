/**
 * Whether a plan purchase is a new subscription or a change to the one the
 * customer already has (US-217).
 *
 * create-checkout-session used to open a new Checkout session every time.
 * For an agent already subscribed, that created a SECOND subscription: the
 * webhook upserts user_subscriptions on user_id, so the new subscription id
 * overwrote the old one while the old one kept billing, and its later events
 * matched no row. Every upgrade and downgrade was charged twice.
 *
 * Stripe, not our tables, is asked what the customer has: the tables are a
 * copy that can lag or drift (US-146), and the question is what Stripe will
 * bill.
 */

/** The statuses under which Stripe is still billing, or about to. */
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);

export interface SubscriptionLike {
  id: string;
  status: string;
  items: { data: { id: string; price: { id: string } }[] };
}

export interface StripeSubscriptionsApi {
  list(params: { customer: string; status: 'all'; limit: number }): Promise<{ data: SubscriptionLike[] }>;
  update(
    id: string,
    params: {
      items: { id: string; price: string }[];
      proration_behavior: 'create_prorations';
      cancel_at_period_end: boolean;
    }
  ): Promise<SubscriptionLike>;
}

export type PlanChangeResult =
  | { action: 'checkout' }
  | { action: 'unchanged'; subscriptionId: string }
  | { action: 'updated'; subscriptionId: string };

export async function changePlanIfSubscribed(
  subscriptions: StripeSubscriptionsApi,
  customerId: string | undefined,
  priceId: string
): Promise<PlanChangeResult> {
  if (!customerId) return { action: 'checkout' };

  const { data } = await subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  const live = data.filter((s) => LIVE_STATUSES.has(s.status));
  if (live.length === 0) return { action: 'checkout' };

  if (live.length > 1) {
    // Already double-billed before this fix. Change the first and say so; the
    // others need a human (refund and cancel), not another automatic write.
    console.error(
      `[create-checkout-session] customer ${customerId} has ${live.length} live subscriptions: ${live
        .map((s) => s.id)
        .join(', ')}`
    );
  }

  const current = live[0];
  const item = current.items.data[0];
  if (!item) return { action: 'checkout' };
  if (item.price.id === priceId) return { action: 'unchanged', subscriptionId: current.id };

  await subscriptions.update(current.id, {
    items: [{ id: item.id, price: priceId }],
    proration_behavior: 'create_prorations',
    // Choosing a plan is also a decision to stay.
    cancel_at_period_end: false,
  });
  return { action: 'updated', subscriptionId: current.id };
}
