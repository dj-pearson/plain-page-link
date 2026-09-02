/**
 * What a subscription entitles an agent to, and when (US-118).
 *
 * Two decisions used to be made inline in stripe-webhook, and both were wrong
 * in the same direction — they took away access the agent had already paid for:
 *
 *   1. `if (subscription.cancel_at_period_end) status = 'canceled'`. Stripe's
 *      own status at that moment is still 'active'; the subscription is paid
 *      through the end of the period and cancel_at_period_end is a separate
 *      boolean the webhook was already storing in its own column. Because
 *      get_user_plan joins on the status, scheduling a cancellation dropped the
 *      agent to the free plan that day — weeks early.
 *
 *   2. invoice.payment_failed wrote 'past_due' with no grace at all, so a card
 *      that expired on a Tuesday cut off access on the Tuesday, before Stripe
 *      had finished retrying and before anyone had told the agent.
 *
 * The database is the authority — get_user_plan applies the same rules in SQL,
 * because entitlement has to hold for readers that never see a webhook. This
 * module is the webhook's half, and exists separately so both halves can be
 * stated once and tested.
 */

/** Days past current_period_end that a past_due subscription keeps its plan. */
export const PAST_DUE_GRACE_DAYS = 7;

/** The subset of a Stripe subscription these decisions read. */
export interface StripeSubscriptionLike {
  status: string;
  cancel_at_period_end?: boolean | null;
}

/** The subset of a stored user_subscriptions row these decisions read. */
export interface StoredSubscription {
  status: string | null;
  current_period_end?: string | null;
}

/**
 * The status to store for a Stripe subscription.
 *
 * Stripe's status, unchanged. A scheduled cancellation is recorded in
 * cancel_at_period_end, not by rewriting the status — that is the distinction
 * the old code threw away.
 */
export function statusToStore(subscription: StripeSubscriptionLike): string {
  return subscription.status;
}

/**
 * Whether a stored subscription still entitles the agent to its plan.
 *
 * Mirrors get_user_plan's WHERE clause. `now` is a parameter so the boundaries
 * can be tested rather than waited for.
 */
export function isEntitled(subscription: StoredSubscription, now: Date = new Date()): boolean {
  const status = subscription.status ?? '';

  if (status === 'active' || status === 'trialing') return true;

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  if (!periodEnd || Number.isNaN(periodEnd.getTime())) return false;

  // Cancelled, but paid through the end of the period.
  if (status === 'canceled' || status === 'cancelled') {
    return periodEnd.getTime() > now.getTime();
  }

  // A failed payment is a dunning problem, not an immediate downgrade.
  if (status === 'past_due') {
    const graceEnds = periodEnd.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return graceEnds > now.getTime();
  }

  return false;
}
