/**
 * Where Stripe Checkout sends an agent back to, and how that page recognises
 * the return (US-258).
 *
 * The two checkout entry points disagreed: SubscriptionPage sent agents to
 * /dashboard/subscription?status=success, which nothing read, and Pricing to
 * /dashboard?subscription=success, whose modal congratulated the agent on
 * whatever plan the webhook had recorded so far — usually still Free. Both
 * now return to one URL, which SubscriptionPage handles: it says the payment
 * went through and polls the plan until the webhook has caught up.
 */

export const CHECKOUT_RETURN_PATH = '/dashboard/subscription';
export const CHECKOUT_STATUS_PARAM = 'checkout_status';
export const CHECKOUT_PLAN_PARAM = 'plan';

/** How often, and for how long, the returning page re-reads the plan. */
export const CHECKOUT_POLL_INTERVAL_MS = 2000;
export const CHECKOUT_POLL_TIMEOUT_MS = 30000;

/** The success URL for a purchase of (or change to) `planName`. */
export function checkoutSuccessUrl(origin: string, planName: string): string {
  const params = new URLSearchParams({
    [CHECKOUT_STATUS_PARAM]: 'success',
    [CHECKOUT_PLAN_PARAM]: planName.toLowerCase(),
  });
  return `${origin}${CHECKOUT_RETURN_PATH}?${params.toString()}`;
}

export interface CheckoutReturn {
  /** The plan bought, when the URL says; null for a return from an old link. */
  planName: string | null;
}

/**
 * Whether these params are a return from a successful checkout. Also accepts
 * `status=success`, the success URL SubscriptionPage used before US-258, so a
 * checkout opened before the deploy is still confirmed when it completes.
 */
export function readCheckoutReturn(params: URLSearchParams): CheckoutReturn | null {
  const isReturn =
    params.get(CHECKOUT_STATUS_PARAM) === 'success' || params.get('status') === 'success';
  if (!isReturn) return null;
  const plan = params.get(CHECKOUT_PLAN_PARAM);
  return { planName: plan ? plan.toLowerCase() : null };
}

/** The same params without the checkout-return markers. */
export function stripCheckoutReturn(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(CHECKOUT_STATUS_PARAM);
  next.delete(CHECKOUT_PLAN_PARAM);
  if (next.get('status') === 'success') next.delete('status');
  return next;
}

/**
 * Whether the plan the database reports reflects the purchase. With the target
 * known, the plan must be it; without (an old success URL), any paid plan will
 * do — the purchase was of a paid plan.
 */
export function planHasArrived(
  currentPlanName: string | null | undefined,
  target: string | null
): boolean {
  const current = (currentPlanName ?? 'free').toLowerCase();
  return target ? current === target.toLowerCase() : current !== 'free';
}
