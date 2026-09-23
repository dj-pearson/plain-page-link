import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRICING_PLANS } from '@/config/pricing-plans';
import {
  describeLimit,
  limitStatus,
  nextPlanFor,
  planLimitKeyFromError,
  shouldNudge,
  upgradePitch,
} from './planLimits';

describe('limitStatus', () => {
  it('reads unlimited as always addable', () => {
    expect(limitStatus(900, -1)).toMatchObject({ level: 'unlimited', canAdd: true });
  });

  it('reads a zero limit as a locked feature', () => {
    expect(limitStatus(0, 0)).toMatchObject({ level: 'locked', canAdd: false });
  });

  it('walks ok → near → at → over', () => {
    expect(limitStatus(1, 10).level).toBe('ok');
    expect(limitStatus(8, 10).level).toBe('near');
    expect(limitStatus(10, 10)).toMatchObject({ level: 'at', canAdd: false, remaining: 0 });
    expect(limitStatus(12, 10)).toMatchObject({ level: 'over', percent: 100 });
  });

  it('nudges only when there is something to say', () => {
    expect(shouldNudge(limitStatus(1, 10))).toBe(false);
    expect(shouldNudge(limitStatus(8, 10))).toBe(true);
    expect(shouldNudge(limitStatus(0, 0))).toBe(true);
    expect(shouldNudge(limitStatus(5, -1))).toBe(false);
  });
});

describe('nextPlanFor', () => {
  it('names the cheapest plan that raises the ceiling', () => {
    expect(nextPlanFor('listings', 'free')).toMatchObject({ plan: { id: 'starter' }, limit: 10 });
    expect(nextPlanFor('open_houses_per_month', 'free')).toMatchObject({
      plan: { id: 'starter' },
      limit: 5,
    });
    expect(nextPlanFor('links', 'starter')).toMatchObject({
      plan: { id: 'professional' },
      limit: -1,
    });
  });

  it('has nothing to offer once the limit is unlimited', () => {
    expect(nextPlanFor('links', 'professional')).toBeNull();
    expect(nextPlanFor('listings', 'team')).toBeNull();
  });

  it('treats an unknown plan as free', () => {
    expect(nextPlanFor('contacts', 'mystery')).toMatchObject({ plan: { id: 'starter' } });
  });
});

describe('wording', () => {
  it('describes limits the way the pricing page would', () => {
    expect(describeLimit('listings', 10)).toBe('10 active listings');
    expect(describeLimit('open_houses_per_month', 5)).toBe('5 open houses a month');
    expect(describeLimit('contacts', -1)).toBe('Unlimited clients');
    expect(describeLimit('analytics_days', 90)).toBe('90 days of analytics');
  });

  it('pitches the next plan with its price', () => {
    expect(upgradePitch('listings', 'free')).toBe('Starter ($29/mo) includes 10 active listings.');
    expect(upgradePitch('links', 'starter')).toBe(
      'Professional ($49/mo) includes unlimited links.'
    );
    expect(upgradePitch('links', 'team')).toBeNull();
  });
});

describe('planLimitKeyFromError', () => {
  it('reads the key the trigger puts in DETAIL', () => {
    expect(
      planLimitKeyFromError({
        code: '23514',
        message: 'Your plan allows 3 active listings. Upgrade to add more.',
        details: 'plan_limit:listings',
      })
    ).toBe('listings');
  });

  it('ignores other errors', () => {
    expect(planLimitKeyFromError({ message: 'duplicate key' })).toBeNull();
    expect(planLimitKeyFromError({ details: 'plan_limit:nonsense' })).toBeNull();
    expect(planLimitKeyFromError(null)).toBeNull();
  });
});

/**
 * The limits 20260923000002 adds to subscription_plans must match what the
 * pricing page sells, or the page promises one number and the trigger enforces
 * another. Same approach as pricing-plans.test.ts for the original seed.
 */
describe('the enforcement migration matches the pricing config', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260923000002_enforce_plan_limits_everywhere.sql'),
    'utf8'
  );
  const rows = Array.from(
    sql.matchAll(
      /\('(\w+)',\s*'\{"contacts":\s*(-?\d+),\s*"open_houses_per_month":\s*(-?\d+)\}'::jsonb,\s*'\{"openHouseManagement":\s*(true|false)\}'/g
    )
  );

  it('parses a row for every plan', () => {
    expect(rows.map((r) => r[1]).sort()).toEqual(PRICING_PLANS.map((p) => p.id).sort());
  });

  for (const plan of PRICING_PLANS) {
    it(`${plan.id}: clients, open houses and the open house feature agree`, () => {
      const row = rows.find((r) => r[1] === plan.id);
      expect(row, plan.id).toBeDefined();
      expect(Number(row![2])).toBe(plan.limits.contacts);
      expect(Number(row![3])).toBe(plan.limits.openHousesPerMonth);
      expect(row![4] === 'true').toBe(plan.features.openHouseManagement);
    });
  }
});
