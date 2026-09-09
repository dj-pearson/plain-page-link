/**
 * US-171: the pricing page listed programmer identifiers, and the config beside
 * it priced features nobody had built.
 *
 * Pricing.tsx rendered each plan feature as
 *
 *     <span className="capitalize">{key.replace(/_/g, ' ')}</span>
 *
 * The keys in `subscription_plans.features` are camelCase, so the underscore
 * replace does nothing and CSS `capitalize` only lifts the first letter. The
 * page where money changes hands therefore read: CustomThemes, CustomDomain,
 * RemoveBranding, PrioritySupport, LeadScoring, AiListingDescriptions.
 *
 * Separately, this file carried a 15-entry PlanFeatures matrix while the
 * migration that owns the plans seeds 7 — and four of the extras
 * (marketReports, videoTours, mortgageCalculator, cmaGenerator) had no
 * implementation anywhere in src/ or supabase/functions/. A USAGE_PRICING table
 * put a price on three of them ($10 a Market Report, $15 a Video Tour, $19.99 a
 * CMA) and was referenced by nothing.
 *
 * These tests hold two things: every feature the database can hand the pricing
 * page has a human label, and this file cannot drift from the migration again.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLAN_FEATURE_LABELS, planFeatureLabel, PRICING_PLANS } from './pricing-plans';

const SEED = join(process.cwd(), 'supabase/migrations/20260902000014_seed_subscription_plans.sql');

/**
 * The feature keys the migration actually seeds into
 * `subscription_plans.features` — which is what the pricing page renders.
 */
function seededFeatureKeys(): string[] {
  const sql = readFileSync(SEED, 'utf8');
  const insert = sql.slice(sql.indexOf('INSERT INTO public.subscription_plans'));
  const keys = new Set<string>();

  // jsonb_build_object('analytics', true, 'customThemes', false, ...)
  for (const block of insert.matchAll(/jsonb_build_object\(([\s\S]*?)\)/g)) {
    const body = block[1];
    // Only the features objects carry these; limits use snake_case nouns.
    for (const pair of body.matchAll(/'([a-zA-Z][a-zA-Z0-9]*)',\s*(true|false)/g)) {
      keys.add(pair[1]);
    }
  }
  return [...keys].sort();
}

describe('plan features the pricing page can render', () => {
  const seeded = seededFeatureKeys();

  it('reads the seed migration, so an empty result cannot pass for agreement', () => {
    expect(seeded.length, 'no feature keys parsed out of the seed migration').toBeGreaterThan(4);
  });

  it.each(seededFeatureKeys())('%s has a human label', (key) => {
    expect(
      PLAN_FEATURE_LABELS[key],
      `subscription_plans.features can contain "${key}", and the pricing page ` +
        `renders whatever it finds. Without an entry in PLAN_FEATURE_LABELS a ` +
        `customer sees the identifier.`
    ).toBeTruthy();
  });

  it('labels no key the database never sends', () => {
    // Not fatal, but a label for a key that cannot appear is a sign the two
    // have started drifting again — which is the whole defect.
    for (const key of Object.keys(PLAN_FEATURE_LABELS)) {
      expect(seeded, `PLAN_FEATURE_LABELS has "${key}", which the seed does not`).toContain(key);
    }
  });

  it('declares no plan feature that has no implementation', () => {
    // The four removed in US-171. Named explicitly rather than inferred,
    // because "no implementation" is a judgement someone had to make by
    // reading the codebase, and it should be re-made rather than assumed.
    const unbuilt = ['marketReports', 'videoTours', 'mortgageCalculator', 'cmaGenerator'];
    const source = readFileSync(join(process.cwd(), 'src/config/pricing-plans.ts'), 'utf8');
    const declarations = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'));

    for (const feature of unbuilt) {
      expect(
        declarations.some((line) => new RegExp(`\\b${feature}\\b`).test(line)),
        `"${feature}" is back in pricing-plans.ts. It was removed because nothing ` +
          `in src/ or supabase/functions/ implements it. If it has been built, ` +
          `delete it from this list and say where.`
      ).toBe(false);
    }
  });
});

describe('planFeatureLabel', () => {
  it('names a known feature in English, not in camelCase', () => {
    expect(planFeatureLabel('aiListingDescriptions', true)).toBe('AI listing descriptions');
    expect(planFeatureLabel('removeBranding', true)).toBe('AgentBio branding removed');
    expect(planFeatureLabel('customDomain', true)).toBe('Custom domain');
  });

  it('says when a feature is capped rather than showing the same tick', () => {
    // 'limited' is truthy, so the old `value ? <Check/> : null` rendered it
    // identically to full inclusion — a customer comparing tiers could not see
    // what they were paying to lift.
    expect(planFeatureLabel('aiListingDescriptions', 'limited')).toBe(
      'AI listing descriptions (limited)'
    );
  });

  it('returns null for a feature the plan does not include', () => {
    expect(planFeatureLabel('customDomain', false)).toBeNull();
    expect(planFeatureLabel('customDomain', undefined)).toBeNull();
    expect(planFeatureLabel('customDomain', null)).toBeNull();
  });

  it('still reads as English for a key it has never seen', () => {
    // The database can be edited without touching this file, so the fallback
    // has to be readable rather than raw. This is the case the old code got
    // wrong for every key.
    expect(planFeatureLabel('smsAutomation', true)).toBe('Sms automation');
    expect(planFeatureLabel('open_house_management', true)).toBe('Open house management');
  });

  it('does not reproduce the identifiers the old renderer produced', () => {
    // The exact strings that shipped, as the guard against regressing.
    const wasRendered = (key: string) =>
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    expect(wasRendered('aiListingDescriptions')).toBe('AiListingDescriptions');
    expect(planFeatureLabel('aiListingDescriptions', true)).not.toBe('AiListingDescriptions');
  });
});

describe('PRICING_PLANS', () => {
  it('is still the price source the marketing pages read', () => {
    // seo.ts, Landing, Press, VsLater, VsLinktree and HealthDashboard all read
    // prices from here; only the feature matrix moved to the database.
    expect(PRICING_PLANS.length).toBeGreaterThan(0);
    for (const plan of PRICING_PLANS) {
      expect(typeof plan.price_monthly, `${plan.id} price_monthly`).toBe('number');
    }
  });
});
