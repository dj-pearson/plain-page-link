import { describe, it, expect } from 'vitest';
import { computeMrr, churnRate, monthlyAmount } from './revenueMetrics';

const list = (plan: string | null) => ({ starter: 19, professional: 39 })[plan ?? ''] ?? 0;
const now = new Date('2026-10-01T00:00:00Z');

describe('revenue metrics (US-231)', () => {
  it('uses the stored amount and interval, not the list price', () => {
    expect(monthlyAmount({ plan_name: 'professional', status: 'active', amount: 29, interval: 'month' }, list)).toBe(29);
    expect(monthlyAmount({ plan_name: 'professional', status: 'active', amount: 390, interval: 'year' }, list)).toBe(32.5);
    expect(monthlyAmount({ plan_name: 'starter', status: 'active', amount: null, interval: null }, list)).toBe(19);
  });

  it('MRR counts active and past_due, not cancelled or free', () => {
    expect(
      computeMrr(
        [
          { plan_name: 'professional', status: 'active', amount: 39, interval: 'month' },
          { plan_name: 'starter', status: 'past_due', amount: 19, interval: 'month' },
          { plan_name: 'free', status: 'cancelled', amount: 0, interval: 'month' },
        ],
        list
      )
    ).toBe(58);
  });

  it("churn sees the webhook's 'cancelled' spelling, within the window only", () => {
    const subs = [
      { plan_name: 'starter', status: 'active', amount: 19, interval: 'month' },
      { plan_name: 'starter', status: 'active', amount: 19, interval: 'month' },
      { plan_name: 'starter', status: 'active', amount: 19, interval: 'month' },
      { plan_name: 'free', status: 'cancelled', amount: 0, interval: 'month', canceled_at: '2026-09-20T00:00:00Z' },
      { plan_name: 'free', status: 'canceled', amount: 0, interval: 'month', canceled_at: '2026-01-01T00:00:00Z' },
    ];
    expect(churnRate(subs, now)).toBe(25);
  });
});
