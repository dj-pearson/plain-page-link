/**
 * US-118: three places each held their own copy of what a plan costs and
 * allows, and they disagreed.
 *
 *   src/config/pricing-plans.ts   29 / 49 / 99, analytics 30 days on free
 *   stripe-webhook getPlanLimits  its own table, analytics 7 days on free
 *   Pricing.tsx copy and JSON-LD  Starter $19, Professional $39, Team $29/agent
 *
 * subscription_plans is the source of truth now, seeded by
 * 20260902000014_seed_subscription_plans.sql, and the webhook reads limits from
 * it. This file is what remains of the frontend copy — the feature matrix — and
 * this test holds its numbers to the seed, so the two cannot drift again
 * silently.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRICING_PLANS } from './pricing-plans';

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20260902000014_seed_subscription_plans.sql'
);

/** Plan name → { monthly, yearly, listings, analytics_days } from the seed SQL. */
function seededPlans(): Record<
  string,
  { monthly: number; yearly: number; listings: number; analyticsDays: number }
> {
  const sql = readFileSync(MIGRATION, 'utf8');
  const out: Record<
    string,
    { monthly: number; yearly: number; listings: number; analyticsDays: number }
  > = {};

  // Each VALUES row opens with ( 'name', monthly, yearly, sort, is_active,
  // and carries its limits further down the same tuple.
  const rowPattern =
    /\(\s*'(\w+)',\s*(\d+),\s*(\d+),\s*\d+,\s*true,[\s\S]*?'listings',\s*(-?\d+)[\s\S]*?'analytics_days',\s*(-?\d+)/g;

  for (const m of sql.matchAll(rowPattern)) {
    out[m[1]] = {
      monthly: Number(m[2]),
      yearly: Number(m[3]),
      listings: Number(m[4]),
      analyticsDays: Number(m[5]),
    };
  }
  return out;
}

describe('pricing config matches the seeded plans', () => {
  const seeded = seededPlans();

  it('parses the seed migration', () => {
    // A parsing failure would make every comparison below vacuous.
    expect(Object.keys(seeded).sort()).toEqual([
      'enterprise',
      'free',
      'professional',
      'starter',
      'team',
    ]);
    expect(seeded.professional.monthly).toBe(49);
  });

  it('names the same plans', () => {
    expect(PRICING_PLANS.map((p) => p.id).sort()).toEqual(Object.keys(seeded).sort());
  });

  it('quotes the same prices', () => {
    for (const plan of PRICING_PLANS) {
      expect(plan.price_monthly, `${plan.id} monthly`).toBe(seeded[plan.id].monthly);
      expect(plan.price_yearly, `${plan.id} yearly`).toBe(seeded[plan.id].yearly);
    }
  });

  it('allows the same listings and analytics history', () => {
    for (const plan of PRICING_PLANS) {
      expect(plan.limits.listings, `${plan.id} listings`).toBe(seeded[plan.id].listings);
      expect(plan.limits.analyticsRetentionDays, `${plan.id} analytics days`).toBe(
        seeded[plan.id].analyticsDays
      );
    }
  });

  it('carries no Stripe price ids', () => {
    // They were the literals 'price_starter_monthly' and friends — strings that
    // pass create-checkout-session's /^price_/ check and are then rejected by
    // Stripe with "No such price". They belong to the Stripe account, per
    // environment, in subscription_plans.
    const source = readFileSync(join(process.cwd(), 'src/config/pricing-plans.ts'), 'utf8');
    const declared = source.match(/stripe_price_id\w*:\s*'[^']+'/g) ?? [];
    expect(declared).toEqual([]);
  });
});
