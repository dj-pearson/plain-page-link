/**
 * US-250: deleting an account must stop the card being charged, and a Stripe
 * failure must never erase the only record of a subscription still charging.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  pauseBillingForDeletion,
  restoreBillingAfterCancel,
  processDueDeletions,
  type DeletionStore,
  type DueDeletion,
} from './account-deletion.ts';
import {
  createSubscriptionApi,
  StripeRequestError,
  type StripeSubscriptionState,
  type SubscriptionApi,
} from './stripe-subscriptions.ts';

function fakeStripe(subs: Record<string, StripeSubscriptionState>, failing: Partial<Record<keyof SubscriptionApi, string>> = {}) {
  const fail = (op: keyof SubscriptionApi) => {
    if (failing[op]) throw new StripeRequestError(failing[op] as string, 500);
  };
  const api = {
    retrieve: vi.fn(async (id: string) => (fail('retrieve'), subs[id] ? { ...subs[id] } : null)),
    setCancelAtPeriodEnd: vi.fn(async (id: string, value: boolean) => {
      fail('setCancelAtPeriodEnd');
      subs[id] = { ...subs[id], cancel_at_period_end: value };
      return { ...subs[id] };
    }),
    cancel: vi.fn(async (id: string) => {
      fail('cancel');
      subs[id] = { ...subs[id], status: 'canceled', cancel_at_period_end: false };
      return { ...subs[id] };
    }),
  };
  return api;
}

function fakeStore(init: { live?: Record<string, string[]>; due?: DueDeletion[] } = {}) {
  const live = { ...(init.live ?? {}) };
  const remembered: Record<string, { subscriptionId: string; prior: boolean }> = {};
  const failures: { userId: string; detail: string }[] = [];
  const canceled: string[] = [];
  const erased: string[] = [];
  const store: DeletionStore = {
    liveSubscriptionIds: async (userId) => live[userId] ?? [],
    pendingDeletion: async (userId) =>
      remembered[userId]
        ? { stripeSubscriptionId: remembered[userId].subscriptionId, priorCancelAtPeriodEnd: remembered[userId].prior }
        : { stripeSubscriptionId: null, priorCancelAtPeriodEnd: null },
    rememberSubscription: async (userId, subscriptionId, prior) => {
      remembered[userId] = { subscriptionId, prior };
    },
    dueDeletions: async () => init.due ?? [],
    markSubscriptionCanceled: async (id) => {
      canceled.push(id);
      for (const k of Object.keys(live)) live[k] = live[k].filter((s) => s !== id);
    },
    logFailure: async (deletion, detail) => {
      failures.push({ userId: deletion.userId, detail });
    },
    // Mirrors the SQL guard: an account with a live subscription is skipped.
    eraseDue: async () => {
      let n = 0;
      for (const d of init.due ?? []) {
        if ((live[d.userId] ?? []).length === 0) {
          erased.push(d.userId);
          n++;
        }
      }
      return n;
    },
  };
  return { store, remembered, failures, canceled, erased };
}

const sub = (id: string, over: Partial<StripeSubscriptionState> = {}): StripeSubscriptionState => ({
  id,
  status: 'active',
  cancel_at_period_end: false,
  current_period_end: 1_800_000_000,
  ...over,
});

const due = (userId: string): DueDeletion => ({
  userId,
  gdprRequestId: `req-${userId}`,
  scheduledFor: '2026-10-01T00:00:00Z',
  requestedAt: '2026-09-01T00:00:00Z',
});

describe('pauseBillingForDeletion', () => {
  it('sets cancel_at_period_end and remembers the prior flag', async () => {
    const subs = { sub_1: sub('sub_1') };
    const stripe = fakeStripe(subs);
    const { store, remembered } = fakeStore({ live: { u1: ['sub_1'] } });

    const outcome = await pauseBillingForDeletion({ store, stripe, log: () => {} }, 'u1');

    expect(outcome).toEqual({
      subscription: 'ends_at_period_end',
      periodEnd: new Date(1_800_000_000 * 1000).toISOString(),
    });
    expect(stripe.setCancelAtPeriodEnd).toHaveBeenCalledWith('sub_1', true);
    expect(subs.sub_1.cancel_at_period_end).toBe(true);
    expect(remembered.u1).toEqual({ subscriptionId: 'sub_1', prior: false });
  });

  it('remembers an already-cancelling subscription without touching it', async () => {
    const stripe = fakeStripe({ sub_1: sub('sub_1', { cancel_at_period_end: true }) });
    const { store, remembered } = fakeStore({ live: { u1: ['sub_1'] } });
    await pauseBillingForDeletion({ store, stripe, log: () => {} }, 'u1');
    expect(stripe.setCancelAtPeriodEnd).not.toHaveBeenCalled();
    expect(remembered.u1.prior).toBe(true);
  });

  it('does nothing for an account with no subscription', async () => {
    const stripe = fakeStripe({});
    const { store } = fakeStore();
    expect(await pauseBillingForDeletion({ store, stripe }, 'u1')).toEqual({ subscription: 'none' });
    expect(stripe.retrieve).not.toHaveBeenCalled();
  });

  it('reports a Stripe failure instead of throwing', async () => {
    const stripe = fakeStripe({ sub_1: sub('sub_1') }, { setCancelAtPeriodEnd: 'card network down' });
    const { store } = fakeStore({ live: { u1: ['sub_1'] } });
    const log = vi.fn();
    const outcome = await pauseBillingForDeletion({ store, stripe, log }, 'u1');
    expect(outcome).toMatchObject({ subscription: 'unchanged', error: expect.stringContaining('card network down') });
    expect(log).toHaveBeenCalled();
  });
});

describe('restoreBillingAfterCancel', () => {
  it('turns renewal back on when the request had turned it off', async () => {
    const subs = { sub_1: sub('sub_1', { cancel_at_period_end: true }) };
    const stripe = fakeStripe(subs);
    const { store } = fakeStore();
    const outcome = await restoreBillingAfterCancel({ store, stripe }, 'u1', {
      stripeSubscriptionId: 'sub_1',
      priorCancelAtPeriodEnd: false,
    });
    expect(outcome).toEqual({ subscription: 'restored' });
    expect(subs.sub_1.cancel_at_period_end).toBe(false);
  });

  it('leaves a subscriber who had already chosen to cancel cancelling', async () => {
    const stripe = fakeStripe({ sub_1: sub('sub_1', { cancel_at_period_end: true }) });
    const { store } = fakeStore();
    const outcome = await restoreBillingAfterCancel({ store, stripe }, 'u1', {
      stripeSubscriptionId: 'sub_1',
      priorCancelAtPeriodEnd: true,
    });
    expect(outcome).toEqual({ subscription: 'unchanged' });
    expect(stripe.setCancelAtPeriodEnd).not.toHaveBeenCalled();
  });

  it('round-trips with pauseBillingForDeletion', async () => {
    const subs = { sub_1: sub('sub_1') };
    const stripe = fakeStripe(subs);
    const { store } = fakeStore({ live: { u1: ['sub_1'] } });
    await pauseBillingForDeletion({ store, stripe }, 'u1');
    await restoreBillingAfterCancel({ store, stripe }, 'u1', await store.pendingDeletion('u1'));
    expect(subs.sub_1.cancel_at_period_end).toBe(false);
  });
});

describe('processDueDeletions', () => {
  it('cancels a live subscription before erasing the account', async () => {
    const subs = { sub_1: sub('sub_1', { cancel_at_period_end: true }) };
    const stripe = fakeStripe(subs);
    const { store, canceled, erased } = fakeStore({ live: { u1: ['sub_1'] }, due: [due('u1'), due('u2')] });

    const report = await processDueDeletions({ store, stripe, log: () => {} });

    expect(stripe.cancel).toHaveBeenCalledWith('sub_1');
    expect(subs.sub_1.status).toBe('canceled');
    expect(canceled).toEqual(['sub_1']);
    expect(erased).toEqual(['u1', 'u2']);
    expect(report).toEqual({ processed: 2, blocked: 0, errors: [] });
  });

  it('leaves the deletion for retry, and logs it, when Stripe fails', async () => {
    const stripe = fakeStripe({ sub_1: sub('sub_1') }, { cancel: 'Stripe is down' });
    const log = vi.fn();
    const { store, failures, canceled, erased } = fakeStore({ live: { u1: ['sub_1'] }, due: [due('u1'), due('u2')] });

    const report = await processDueDeletions({ store, stripe, log });

    expect(canceled).toEqual([]);
    expect(erased).toEqual(['u2']);
    expect(report.processed).toBe(1);
    expect(report.blocked).toBe(1);
    expect(report.errors[0]).toContain('Stripe is down');
    expect(failures).toEqual([{ userId: 'u1', detail: expect.stringContaining('Stripe is down') }]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('left for retry'));
  });

  it('holds every deletion with a subscription when Stripe is not configured', async () => {
    const { store, erased } = fakeStore({ live: { u1: ['sub_1'] }, due: [due('u1')] });
    const report = await processDueDeletions({ store, stripe: null, log: () => {} });
    expect(erased).toEqual([]);
    expect(report).toMatchObject({ processed: 0, blocked: 1 });
  });

  it('marks a subscription Stripe already ended as canceled and erases', async () => {
    const stripe = fakeStripe({ sub_1: sub('sub_1', { status: 'canceled' }) });
    const { store, canceled, erased } = fakeStore({ live: { u1: ['sub_1'] }, due: [due('u1')] });
    await processDueDeletions({ store, stripe });
    expect(stripe.cancel).not.toHaveBeenCalled();
    expect(canceled).toEqual(['sub_1']);
    expect(erased).toEqual(['u1']);
  });
});

describe('createSubscriptionApi', () => {
  const respond = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  it('sends form-encoded requests with the secret key', async () => {
    const fetchImpl = vi.fn((_url: string, _init?: RequestInit) => respond(200, sub('sub_1', { cancel_at_period_end: true })));
    const api = createSubscriptionApi('sk_test_x', fetchImpl);
    await api.setCancelAtPeriodEnd('sub_1', true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.stripe.com/v1/subscriptions/sub_1');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('cancel_at_period_end=true');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_x');
  });

  it('cancels with DELETE', async () => {
    const fetchImpl = vi.fn((_url: string, _init?: RequestInit) => respond(200, sub('sub_1', { status: 'canceled' })));
    await createSubscriptionApi('sk', fetchImpl).cancel('sub_1');
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('returns null for a subscription Stripe does not have', async () => {
    const api = createSubscriptionApi('sk', () =>
      respond(404, { error: { code: 'resource_missing', message: 'No such subscription' } })
    );
    expect(await api.retrieve('sub_gone')).toBeNull();
  });

  it('throws on any other failure', async () => {
    const api = createSubscriptionApi('sk', () => respond(500, { error: { message: 'boom' } }));
    await expect(api.cancel('sub_1')).rejects.toThrow('boom');
  });
});
