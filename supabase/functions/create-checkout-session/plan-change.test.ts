/**
 * US-217: choosing a plan while subscribed changes that subscription; it never
 * opens a second one.
 */
import { describe, it, expect, vi } from 'vitest';
import { changePlanIfSubscribed, type StripeSubscriptionsApi, type SubscriptionLike } from './plan-change.ts';

const sub = (id: string, status: string, price: string): SubscriptionLike => ({
  id,
  status,
  items: { data: [{ id: `si_${id}`, price: { id: price } }] },
});

function api(existing: SubscriptionLike[]) {
  return {
    list: vi.fn(async () => ({ data: existing })),
    update: vi.fn(async (id: string) => existing.find((s) => s.id === id)!),
  } satisfies StripeSubscriptionsApi;
}

describe('changePlanIfSubscribed', () => {
  it('no Stripe customer yet → checkout', async () => {
    const a = api([]);
    expect(await changePlanIfSubscribed(a, undefined, 'price_pro')).toEqual({ action: 'checkout' });
    expect(a.list).not.toHaveBeenCalled();
  });

  it('a customer with only cancelled subscriptions → checkout', async () => {
    const a = api([sub('sub_old', 'canceled', 'price_starter')]);
    expect(await changePlanIfSubscribed(a, 'cus_1', 'price_pro')).toEqual({ action: 'checkout' });
    expect(a.update).not.toHaveBeenCalled();
  });

  it('an active subscription → updated in place with proration, no new checkout', async () => {
    const a = api([sub('sub_1', 'active', 'price_starter')]);
    expect(await changePlanIfSubscribed(a, 'cus_1', 'price_pro')).toEqual({ action: 'updated', subscriptionId: 'sub_1' });
    expect(a.update).toHaveBeenCalledWith('sub_1', {
      items: [{ id: 'si_sub_1', price: 'price_pro' }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    });
  });

  it('past_due and trialing subscriptions count as live', async () => {
    for (const status of ['past_due', 'trialing']) {
      const a = api([sub('sub_1', status, 'price_starter')]);
      expect((await changePlanIfSubscribed(a, 'cus_1', 'price_pro')).action).toBe('updated');
    }
  });

  it('choosing the plan you are on changes nothing', async () => {
    const a = api([sub('sub_1', 'active', 'price_pro')]);
    expect(await changePlanIfSubscribed(a, 'cus_1', 'price_pro')).toEqual({ action: 'unchanged', subscriptionId: 'sub_1' });
    expect(a.update).not.toHaveBeenCalled();
  });
});
