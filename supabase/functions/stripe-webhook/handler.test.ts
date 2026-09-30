/**
 * US-216: a 2xx from the webhook must mean the database has the change.
 *
 * The fake client below records every write and can be told to fail one
 * table, which is how the old handler lost payments: the user_subscriptions
 * upsert failed, the event was already marked processed, and Stripe was told
 * 200.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleStripeEvent, toStoredStatus, type WebhookDeps } from './handler.ts';

type Row = Record<string, unknown>;
interface Call {
  table: string;
  op: string;
  payload?: unknown;
  filters: [string, unknown][];
}

function fakeDb(opts: { failOn?: string; failClaim?: 'duplicate' | 'missing'; plans?: Row[]; customers?: Row[] } = {}) {
  const calls: Call[] = [];
  const plans = opts.plans ?? [
    { id: 'plan-pro', name: 'professional', stripe_price_id_monthly: 'price_pro', limits: { listings: 25 }, features: {} },
    { id: 'plan-free', name: 'free', limits: { listings: 3 }, features: {} },
  ];
  const userSubs: Row[] = [{ user_id: 'user-1', stripe_subscription_id: 'sub_1' }];

  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] };
    const result = () => {
      if (opts.failOn === `${table}.${call.op}`) return { data: null, error: { message: `${table} is down`, code: 'XX000' } };
      if (table === 'stripe_processed_events' && call.op === 'insert') {
        if (opts.failClaim === 'duplicate') return { data: null, error: { message: 'dup', code: '23505' } };
        if (opts.failClaim === 'missing') return { data: null, error: { message: 'relation does not exist', code: '42P01' } };
      }
      if (call.op !== 'select') return { data: null, error: null };
      const eq = Object.fromEntries(call.filters);
      if (table === 'subscription_plans') {
        const or = eq.__or as string | undefined;
        const match = or
          ? plans.find((p) => or.includes(`.eq.${p.stripe_price_id_monthly}`) && p.stripe_price_id_monthly)
          : plans.find((p) => p.name === eq.name);
        return { data: match ?? null, error: null };
      }
      if (table === 'stripe_customers') {
        return { data: (opts.customers ?? []).find((c) => c.stripe_customer_id === eq.stripe_customer_id) ?? null, error: null };
      }
      if (table === 'user_subscriptions') {
        return { data: userSubs.find((r) => r.stripe_subscription_id === eq.stripe_subscription_id) ?? null, error: null };
      }
      return { data: null, error: null };
    };
    const builder: Record<string, unknown> = {
      select: () => builder,
      insert: (payload: unknown) => ((call.op = 'insert'), (call.payload = payload), calls.push(call), builder),
      upsert: (payload: unknown) => ((call.op = 'upsert'), (call.payload = payload), calls.push(call), builder),
      update: (payload: unknown) => ((call.op = 'update'), (call.payload = payload), calls.push(call), builder),
      delete: () => ((call.op = 'delete'), calls.push(call), builder),
      eq: (col: string, val: unknown) => (call.filters.push([col, val]), builder),
      or: (expr: string) => (call.filters.push(['__or', expr]), builder),
      maybeSingle: () => Promise.resolve(result()),
      single: () => Promise.resolve(result()),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej),
    };
    return builder;
  };
  const db = { from, rpc: () => Promise.resolve({ data: null, error: null }) };
  return { db, calls };
}

const subscription = (status = 'active') => ({
  id: 'sub_1',
  status,
  cancel_at_period_end: false,
  cancel_at: null,
  current_period_start: 1_700_000_000,
  current_period_end: 1_702_600_000,
  items: { data: [{ price: { id: 'price_pro', unit_amount: 4900, recurring: { interval: 'month' } } }] },
});

function deps(db: unknown, over: Partial<WebhookDeps> = {}): WebhookDeps {
  return {
    db: db as WebhookDeps['db'],
    retrieveSubscription: vi.fn(async () => subscription() as never),
    sendEmail: vi.fn(async () => ({ success: true })),
    getAgentContact: vi.fn(async () => ({ email: 'agent@example.test', fullName: 'Agent' })),
    siteUrl: 'https://agentbio.test',
    envPriceIds: {},
    ...over,
  };
}

const event = (type: string, object: unknown) =>
  ({ id: `evt_${type}`, type, data: { object } }) as never;

const checkout = (metadata: Row = { user_id: 'user-1' }) =>
  event('checkout.session.completed', {
    id: 'cs_1',
    mode: 'subscription',
    subscription: 'sub_1',
    customer: 'cus_1',
    customer_email: 'agent@example.test',
    metadata,
  });

describe('checkout.session.completed', () => {
  it('writes the plan the price belongs to and answers 200', async () => {
    const { db, calls } = fakeDb();
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res.status).toBe(200);
    const upsert = calls.find((c) => c.table === 'user_subscriptions' && c.op === 'upsert');
    expect(upsert?.payload).toMatchObject({ user_id: 'user-1', plan_id: 'plan-pro', status: 'active' });
  });

  it('a failed user_subscriptions write is a 500, and the claim is released so the retry runs', async () => {
    const { db, calls } = fakeDb({ failOn: 'user_subscriptions.upsert' });
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res.status).toBe(500);
    expect(calls.some((c) => c.table === 'stripe_processed_events' && c.op === 'delete')).toBe(true);
  });

  it('a failed plan lookup is a 500, not a paying agent recorded as free', async () => {
    const { db, calls } = fakeDb({ failOn: 'subscription_plans.select' });
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res.status).toBe(500);
    expect(calls.some((c) => c.table === 'user_subscriptions' && c.op === 'upsert')).toBe(false);
  });

  it('falls back to the Stripe customer when metadata has no user_id', async () => {
    const { db, calls } = fakeDb({ customers: [{ stripe_customer_id: 'cus_1', user_id: 'user-9' }] });
    const res = await handleStripeEvent(checkout({}), deps(db));
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.table === 'user_subscriptions' && c.op === 'upsert')?.payload).toMatchObject({
      user_id: 'user-9',
    });
  });

  it('no user_id and an unknown customer is a 500, not a silent 200', async () => {
    const { db } = fakeDb();
    const res = await handleStripeEvent(checkout({}), deps(db));
    expect(res.status).toBe(500);
    expect(String(res.body.error)).toContain('no user_id');
  });
});

describe('idempotency', () => {
  it('a duplicate delivery is skipped with 200', async () => {
    const { db, calls } = fakeDb({ failClaim: 'duplicate' });
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res).toEqual({ status: 200, body: { received: true, skipped: true } });
    expect(calls.some((c) => c.table === 'user_subscriptions')).toBe(false);
  });

  it('an unwritable claim table still processes the event', async () => {
    const { db, calls } = fakeDb({ failClaim: 'missing' });
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.table === 'user_subscriptions' && c.op === 'upsert')).toBe(true);
  });
});

describe('subscription and invoice events', () => {
  let d: WebhookDeps;
  beforeEach(() => {
    d = deps(null);
  });

  it('customer.subscription.updated: a failed write is a 500', async () => {
    const { db } = fakeDb({ failOn: 'user_subscriptions.update' });
    const res = await handleStripeEvent(event('customer.subscription.updated', subscription()), { ...d, db: db as never });
    expect(res.status).toBe(500);
  });

  it('customer.subscription.updated stores statuses the enum can hold', async () => {
    const { db, calls } = fakeDb();
    await handleStripeEvent(event('customer.subscription.updated', subscription('unpaid')), { ...d, db: db as never });
    expect(calls.find((c) => c.table === 'user_subscriptions' && c.op === 'update')?.payload).toMatchObject({
      status: 'past_due',
    });
  });

  it('customer.subscription.deleted: drops to canceled, and a failed write is a 500', async () => {
    const ok = fakeDb();
    expect((await handleStripeEvent(event('customer.subscription.deleted', subscription()), { ...d, db: ok.db as never })).status).toBe(200);
    expect(ok.calls.find((c) => c.table === 'user_subscriptions')?.payload).toMatchObject({ status: 'canceled' });

    const bad = fakeDb({ failOn: 'subscriptions.update' });
    expect((await handleStripeEvent(event('customer.subscription.deleted', subscription()), { ...d, db: bad.db as never })).status).toBe(500);
  });

  it('invoice.payment_failed marks past_due and sends the dunning email', async () => {
    const { db, calls } = fakeDb();
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      { ...d, db: db as never }
    );
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.table === 'user_subscriptions' && c.op === 'update')?.payload).toEqual({ status: 'past_due' });
    expect(d.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'agent@example.test' }));
  });

  it('invoice.payment_failed: a failed notification does not fail the event', async () => {
    const { db } = fakeDb({ failOn: 'notifications.insert' });
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      { ...d, db: db as never }
    );
    expect(res.status).toBe(200);
  });

  it('invoice.paid: a failed status write is a 500', async () => {
    const { db } = fakeDb({ failOn: 'subscriptions.update' });
    const res = await handleStripeEvent(event('invoice.paid', { id: 'in_1', subscription: 'sub_1', amount_paid: 4900 }), {
      ...d,
      db: db as never,
    });
    expect(res.status).toBe(500);
  });
});

describe('toStoredStatus', () => {
  it.each([
    ['active', 'active'],
    ['trialing', 'trialing'],
    ['past_due', 'past_due'],
    ['unpaid', 'past_due'],
    ['incomplete_expired', 'canceled'],
    ['paused', 'canceled'],
  ])('%s → %s', (stripe, stored) => {
    expect(toStoredStatus(subscription(stripe) as never)).toBe(stored);
  });
});
