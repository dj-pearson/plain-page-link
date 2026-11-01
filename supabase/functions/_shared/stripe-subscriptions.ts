/**
 * The three Stripe subscription calls account deletion needs (US-250), over
 * plain fetch so it runs under vitest without esm.sh and can be handed a fake.
 */

export interface StripeSubscriptionState {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  /** Unix seconds. */
  current_period_end?: number | null;
}

export interface SubscriptionApi {
  /** Null when Stripe has no such subscription. */
  retrieve(id: string): Promise<StripeSubscriptionState | null>;
  setCancelAtPeriodEnd(id: string, value: boolean): Promise<StripeSubscriptionState>;
  /** Cancels immediately. */
  cancel(id: string): Promise<StripeSubscriptionState>;
}

/** Statuses after which the subscription can never charge again. */
export const ENDED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'incomplete_expired']);

export class StripeRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'StripeRequestError';
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createSubscriptionApi(
  secretKey: string,
  fetchImpl: FetchLike = (input, init) => fetch(input, init)
): SubscriptionApi {
  const call = async (method: string, id: string, form?: Record<string, string>) => {
    const response = await fetchImpl(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form ? new URLSearchParams(form).toString() : undefined,
      }
    );
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string };
    } & Partial<StripeSubscriptionState>;
    if (!response.ok) {
      throw new StripeRequestError(
        `Stripe ${method} subscription ${id}: ${body.error?.message ?? response.status}`,
        response.status,
        body.error?.code
      );
    }
    return body as StripeSubscriptionState;
  };

  return {
    async retrieve(id) {
      try {
        return await call('GET', id);
      } catch (error) {
        if (error instanceof StripeRequestError && error.code === 'resource_missing') return null;
        throw error;
      }
    },
    setCancelAtPeriodEnd: (id, value) =>
      call('POST', id, { cancel_at_period_end: value ? 'true' : 'false' }),
    cancel: (id) => call('DELETE', id),
  };
}
