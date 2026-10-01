/**
 * MRR and churn for the admin Health dashboard (US-231).
 *
 * Both were wrong before:
 *   - Churn filtered status === 'canceled'; stripe-webhook writes 'cancelled'
 *     (two l's) to `subscriptions`, so churn read 0% forever.
 *   - MRR summed the list price of each plan name, ignoring the amount and
 *     interval actually stored, so coupons and annual plans were miscounted
 *     (an annual subscriber counted a full month's list price).
 */

export interface SubscriptionMetricRow {
  plan_name: string | null;
  status: string | null;
  /** What Stripe charges per interval, in dollars (stripe-webhook stores unit_amount / 100). */
  amount: number | null;
  interval: string | null;
  canceled_at?: string | null;
}

const CANCELLED = new Set(['canceled', 'cancelled']);
/** Still billing: past_due is in dunning, not gone. */
const PAYING = new Set(['active', 'past_due']);

export const isCancelled = (status: string | null | undefined) => CANCELLED.has((status ?? '').toLowerCase());

/** The monthly value of one subscription. Falls back to list price when no amount is stored. */
export function monthlyAmount(sub: SubscriptionMetricRow, listPrice: (plan: string | null) => number): number {
  if (typeof sub.amount === 'number' && Number.isFinite(sub.amount) && sub.amount > 0) {
    return sub.interval === 'year' ? sub.amount / 12 : sub.amount;
  }
  return listPrice(sub.plan_name);
}

export function computeMrr(subs: SubscriptionMetricRow[], listPrice: (plan: string | null) => number): number {
  return Math.round(
    subs.filter((s) => PAYING.has((s.status ?? '').toLowerCase())).reduce((sum, s) => sum + monthlyAmount(s, listPrice), 0) *
      100
  ) / 100;
}

/**
 * Share of subscriptions lost in the last `days`: cancelled in the window over
 * (still paying + cancelled in the window). A percentage, rounded.
 */
export function churnRate(subs: SubscriptionMetricRow[], now: Date = new Date(), days = 30): number {
  const since = now.getTime() - days * 86_400_000;
  const lost = subs.filter(
    (s) => isCancelled(s.status) && !!s.canceled_at && new Date(s.canceled_at).getTime() >= since
  ).length;
  const paying = subs.filter((s) => PAYING.has((s.status ?? '').toLowerCase())).length;
  const base = paying + lost;
  return base > 0 ? Math.round((lost / base) * 1000) / 10 : 0;
}
