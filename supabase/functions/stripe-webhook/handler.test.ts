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

function fakeDb(
  opts: { failOn?: string; failClaim?: 'duplicate' | 'missing'; plans?: Row[]; customers?: Row[]; userSubs?: Row[] } = {}
) {
  const rpcs: { name: string; args: Row }[] = [];
  const calls: Call[] = [];
  const plans = opts.plans ?? [
    { id: 'plan-pro', name: 'professional', stripe_price_id_monthly: 'price_pro', limits: { listings: 25 }, features: {} },
    { id: 'plan-free', name: 'free', limits: { listings: 3 }, features: {} },
  ];
  const userSubs: Row[] = opts.userSubs ?? [{ user_id: 'user-1', stripe_subscription_id: 'sub_1', status: 'active' }];

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
        return {
          data:
            userSubs.find((r) =>
              eq.user_id ? r.user_id === eq.user_id : r.stripe_subscription_id === eq.stripe_subscription_id
            ) ?? null,
          error: null,
        };
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
      neq: (col: string, val: unknown) => (call.filters.push([`!${col}`, val]), builder),
      or: (expr: string) => (call.filters.push(['__or', expr]), builder),
      maybeSingle: () => Promise.resolve(result()),
      single: () => Promise.resolve(result()),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej),
    };
    return builder;
  };
  const db = {
    from,
    rpc: (name: string, args: Row) => (rpcs.push({ name, args }), Promise.resolve({ data: null, error: null })),
  };
  return { db, calls, rpcs };
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

  it('flags a checkout that lands while another subscription is still live (US-217)', async () => {
    const { db, rpcs } = fakeDb({ userSubs: [{ user_id: 'user-1', stripe_subscription_id: 'sub_old', status: 'active' }] });
    const res = await handleStripeEvent(checkout(), deps(db));
    expect(res.status).toBe(200);
    expect(rpcs.some((r) => r.args.p_action === 'stripe_duplicate_subscription')).toBe(true);
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
    await handleStripeEvent(event('customer.subscription.updated', subscription('unpaid')), {
      ...d,
      db: db as never,
      retrieveSubscription: vi.fn(async () => subscription('unpaid') as never),
    });
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

  it('invoice.payment_failed stores past_due from Stripe and sends the dunning email', async () => {
    const { db, calls } = fakeDb();
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      { ...d, db: db as never, retrieveSubscription: vi.fn(async () => subscription('past_due') as never) }
    );
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.table === 'user_subscriptions' && c.op === 'update')?.payload).toMatchObject({
      status: 'past_due',
    });
    expect(calls.find((c) => c.table === 'subscriptions' && c.op === 'update')?.payload).toMatchObject({
      status: 'past_due',
    });
    expect(calls.some((c) => c.table === 'notifications' && c.op === 'insert')).toBe(true);
    expect(d.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'agent@example.test' }));
  });

  it('invoice.payment_failed: a failed notification does not fail the event', async () => {
    const { db } = fakeDb({ failOn: 'notifications.insert' });
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      { ...d, db: db as never, retrieveSubscription: vi.fn(async () => subscription('past_due') as never) }
    );
    expect(res.status).toBe(200);
    expect(d.sendEmail).toHaveBeenCalled();
  });

  it('invoice.payment_failed: a failed status write is a 500', async () => {
    const { db } = fakeDb({ failOn: 'user_subscriptions.update' });
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      { ...d, db: db as never, retrieveSubscription: vi.fn(async () => subscription('past_due') as never) }
    );
    expect(res.status).toBe(500);
    expect(d.sendEmail).not.toHaveBeenCalled();
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

/**
 * US-251: Stripe does not deliver events in order, and retries a failed one for
 * three days. The handler used to write whatever the event carried, so an
 * invoice.paid or a stale subscription.updated landing after
 * customer.subscription.deleted put the row back to 'active' — and
 * get_user_plan grants 'active' with no period check, i.e. forever.
 */
describe('event order (US-251)', () => {
  const NOW = Math.floor(Date.now() / 1000);
  const canceled = (over: Row = {}) => ({
    ...subscription('canceled'),
    current_period_end: NOW + 20 * 86_400,
    canceled_at: NOW - 3_600,
    ended_at: NOW - 3_600,
    ...over,
  });
  const write = (calls: Call[], table: string) =>
    calls.filter((c) => c.table === table && c.op === 'update').map((c) => c.payload as Row);
  const retrieving = (sub: unknown) => vi.fn(async () => sub as never);

  it('invoice.paid after deleted leaves the row canceled', async () => {
    const { db, calls } = fakeDb();
    const retrieveSubscription = retrieving(canceled());
    const res = await handleStripeEvent(
      event('invoice.paid', { id: 'in_1', subscription: 'sub_1', amount_paid: 4900 }),
      deps(db, { retrieveSubscription })
    );
    expect(res.status).toBe(200);
    expect(retrieveSubscription).toHaveBeenCalledWith('sub_1');
    expect(write(calls, 'user_subscriptions').every((p) => p.status === 'canceled')).toBe(true);
    expect(write(calls, 'user_subscriptions')).toHaveLength(1);
    expect(write(calls, 'subscriptions')).toEqual([expect.objectContaining({ status: 'cancelled', plan_name: 'free' })]);
  });

  it('invoice.payment_succeeded for a live subscription writes its current state', async () => {
    const { db, calls } = fakeDb();
    await handleStripeEvent(
      event('invoice.payment_succeeded', { id: 'in_1', subscription: 'sub_1', amount_paid: 4900 }),
      deps(db)
    );
    expect(write(calls, 'user_subscriptions')).toEqual([
      expect.objectContaining({ status: 'active', plan_id: 'plan-pro', current_period_end: iso(1_702_600_000) }),
    ]);
  });

  it('a stale subscription.updated(active) after deleted leaves the row canceled', async () => {
    const { db, calls } = fakeDb();
    const res = await handleStripeEvent(
      event('customer.subscription.updated', subscription('active')),
      deps(db, { retrieveSubscription: retrieving(canceled()) })
    );
    expect(res.status).toBe(200);
    expect(write(calls, 'user_subscriptions')).toEqual([expect.objectContaining({ status: 'canceled' })]);
    expect(write(calls, 'subscriptions')).toEqual([
      expect.objectContaining({ status: 'cancelled', plan_name: 'free', amount: 0 }),
    ]);
  });

  it('deleted stores a period end no later than ended_at, so no unpaid grace is granted', async () => {
    const { db, calls } = fakeDb();
    const ended = canceled();
    await handleStripeEvent(
      event('customer.subscription.deleted', ended),
      deps(db, { retrieveSubscription: retrieving(ended) })
    );
    const [us] = write(calls, 'user_subscriptions');
    const [flat] = write(calls, 'subscriptions');
    expect(us).toMatchObject({ status: 'canceled', current_period_end: iso(NOW - 3_600) });
    expect(flat).toMatchObject({ status: 'cancelled', current_period_end: iso(NOW - 3_600) });
  });

  it('deleted at the end of a paid period keeps that period end', async () => {
    const { db, calls } = fakeDb();
    const ended = canceled({ current_period_end: NOW - 60, ended_at: NOW - 60 });
    await handleStripeEvent(
      event('customer.subscription.deleted', ended),
      deps(db, { retrieveSubscription: retrieving(ended) })
    );
    expect(write(calls, 'user_subscriptions')[0]).toMatchObject({ current_period_end: iso(NOW - 60) });
  });

  it('deleted is canceled even if Stripe has not caught up yet', async () => {
    const { db, calls } = fakeDb();
    await handleStripeEvent(event('customer.subscription.deleted', canceled()), deps(db));
    expect(write(calls, 'user_subscriptions')).toEqual([expect.objectContaining({ status: 'canceled' })]);
    expect(Date.parse(write(calls, 'user_subscriptions')[0].current_period_end as string)).toBeLessThanOrEqual(
      Date.now()
    );
  });

  it('trialing is stored as trialing in both tables', async () => {
    const { db, calls } = fakeDb();
    await handleStripeEvent(
      event('customer.subscription.updated', subscription('trialing')),
      deps(db, { retrieveSubscription: retrieving(subscription('trialing')) })
    );
    expect(write(calls, 'user_subscriptions')[0]).toMatchObject({ status: 'trialing' });
    expect(write(calls, 'subscriptions')[0]).toMatchObject({ status: 'trialing', plan_name: 'professional' });

    const co = fakeDb();
    await handleStripeEvent(checkout(), deps(co.db, { retrieveSubscription: retrieving(subscription('trialing')) }));
    expect(co.calls.find((c) => c.table === 'subscriptions' && c.op === 'upsert')?.payload).toMatchObject({
      status: 'trialing',
    });
  });

  it('a failed Stripe lookup is a 500 so the event is retried', async () => {
    const { db, calls } = fakeDb();
    const res = await handleStripeEvent(
      event('invoice.paid', { id: 'in_1', subscription: 'sub_1', amount_paid: 4900 }),
      deps(db, { retrieveSubscription: vi.fn(async () => Promise.reject(new Error('stripe down'))) })
    );
    expect(res.status).toBe(500);
    expect(write(calls, 'user_subscriptions')).toHaveLength(0);
  });

  it('invoice.payment_failed after deleted leaves the row canceled and sends no dunning', async () => {
    const { db, calls } = fakeDb();
    const sendEmail = vi.fn(async () => ({ success: true }));
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      deps(db, { retrieveSubscription: retrieving(canceled()), sendEmail })
    );
    expect(res.status).toBe(200);
    expect(write(calls, 'user_subscriptions')).toEqual([expect.objectContaining({ status: 'canceled' })]);
    expect(write(calls, 'subscriptions')).toEqual([expect.objectContaining({ status: 'cancelled', plan_name: 'free' })]);
    expect(calls.some((c) => c.table === 'notifications')).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  /**
   * US-593: the failure of a first attempt can be delivered after the retry
   * that paid it. The handler used to write past_due regardless, so a paid-up
   * agent was left in dunning, sent a Payment Failed notice and emailed to fix their card.
   */
  it('invoice.payment_failed after the invoice was paid keeps the row active and sends no dunning', async () => {
    const { db, calls } = fakeDb();
    const sendEmail = vi.fn(async () => ({ success: true }));
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      deps(db, { retrieveSubscription: retrieving(subscription('active')), sendEmail })
    );
    expect(res.status).toBe(200);
    expect(write(calls, 'user_subscriptions')).toEqual([
      expect.objectContaining({ status: 'active', plan_id: 'plan-pro' }),
    ]);
    expect(write(calls, 'subscriptions')).toEqual([expect.objectContaining({ status: 'active' })]);
    expect(calls.some((c) => c.table === 'notifications')).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('invoice.payment_failed while Stripe reports unpaid stores past_due and dunns', async () => {
    const { db, calls } = fakeDb();
    const sendEmail = vi.fn(async () => ({ success: true }));
    await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      deps(db, { retrieveSubscription: retrieving(subscription('unpaid')), sendEmail })
    );
    expect(write(calls, 'user_subscriptions')).toEqual([expect.objectContaining({ status: 'past_due' })]);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('invoice.payment_failed: a failed Stripe lookup is a 500 and writes nothing', async () => {
    const { db, calls } = fakeDb();
    const sendEmail = vi.fn(async () => ({ success: true }));
    const res = await handleStripeEvent(
      event('invoice.payment_failed', { id: 'in_1', subscription: 'sub_1', amount_due: 4900 }),
      deps(db, { retrieveSubscription: vi.fn(async () => Promise.reject(new Error('stripe down'))), sendEmail })
    );
    expect(res.status).toBe(500);
    expect(write(calls, 'user_subscriptions')).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

const iso = (seconds: number) => new Date(seconds * 1000).toISOString();

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
