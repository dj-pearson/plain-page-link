/**
 * US-270: /pricing printed raw feature keys ("CustomThemes",
 * "AiListingDescriptions") and would have printed any key a migration added,
 * whether or not the product delivers it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { planCardLines, PLAN_CARD_FEATURES } from './planCardCopy';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');

/**
 * Feature keys the migrations put on subscription_plans.features that the card
 * deliberately leaves off as a yes/no line — the reasons are in
 * planCardCopy.ts. A new key must land in one list or the other, so it is
 * decided rather than rendered raw or silently dropped.
 */
const DELIBERATELY_OMITTED = [
  'analytics',
  'openHouseManagement',
  'leadScoring',
  'aiListingDescriptions',
];

/** Every camelCase key written into a subscription_plans features object. */
function seededFeatureKeys(): string[] {
  const keys = new Set<string>();
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql'));
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8');
    if (!sql.includes('subscription_plans')) continue;
    // jsonb_build_object('customThemes', true, ...) in the seed
    for (const m of sql.matchAll(/'([a-z]+[A-Z]\w*)',\s*(?:true|false)/g)) keys.add(m[1]);
    // '{"openHouseManagement": true}'::jsonb in later updates
    for (const m of sql.matchAll(/"([a-z]+[A-Z]\w*)":\s*(?:true|false)/g)) keys.add(m[1]);
  }
  return [...keys].sort();
}

// The seed rows, as the page receives them (20260902000014 + 20260923000002/3).
const free = {
  features: {
    analytics: true,
    customThemes: false,
    customDomain: false,
    removeBranding: false,
    prioritySupport: false,
    leadScoring: false,
    aiListingDescriptions: false,
    openHouseManagement: true,
  },
  limits: {
    listings: 3,
    links: 5,
    testimonials: 3,
    sold_properties: 3,
    leads_per_month: 10,
    analytics_days: 30,
    themes: 3,
    contacts: 50,
    open_houses_per_month: 1,
    workflows: 0,
    ai_listing_descriptions_per_month: 0,
    emails_per_month: 0,
    sms_per_month: 0,
  },
};

const professional = {
  features: {
    analytics: true,
    customThemes: true,
    customDomain: true,
    removeBranding: true,
    prioritySupport: false,
    leadScoring: true,
    aiListingDescriptions: true,
    openHouseManagement: true,
  },
  limits: {
    listings: 25,
    links: -1,
    testimonials: 25,
    leads_per_month: -1,
    analytics_days: 365,
    contacts: 2500,
    open_houses_per_month: 15,
    workflows: 10,
    ai_listing_descriptions_per_month: 25,
    emails_per_month: 2000,
    sms_per_month: 500,
    market_reports_per_month: 5,
    cma_reports_per_month: 10,
    virtual_staging_photos_per_month: 20,
    video_tours_per_month: 5,
  },
};

describe('planCardLines', () => {
  it('words the free plan', () => {
    expect(planCardLines(free)).toEqual([
      '3 active listings',
      '50 clients with key dates',
      '1 open house a month with sign-in kiosk',
      '10 leads a month',
      '5 custom links',
      '3 testimonials',
      '30-day analytics',
    ]);
  });

  it('words the professional plan, quota included', () => {
    expect(planCardLines(professional)).toEqual([
      '25 active listings',
      '2,500 clients with key dates',
      '15 open houses a month with sign-in kiosk',
      'Unlimited leads',
      'Unlimited custom links',
      '25 testimonials',
      '365-day analytics',
      '25 AI listing descriptions a month',
      'Premium themes',
      'Your own domain',
      'No AgentBio branding',
    ]);
  });

  it('never prints a raw key', () => {
    for (const line of [...planCardLines(free), ...planCardLines(professional)]) {
      // The brand is the one camelCase word allowed.
      expect(line.replace(/AgentBio/g, ''), line).not.toMatch(/[a-z][A-Z]/);
      expect(line, line).not.toMatch(/_/);
    }
  });

  it('does not sell what is metered but not built', () => {
    const text = planCardLines(professional).join(' ').toLowerCase();
    for (const word of [
      'sms',
      'text',
      'email',
      'sequence',
      'workflow',
      'cma',
      'staging',
      'video',
      'market report',
    ]) {
      expect(text, word).not.toContain(word);
    }
  });

  it('ignores feature keys it has no words for', () => {
    const lines = planCardLines({ limits: {}, features: { smsAutomation: true, newThing: true } });
    expect(lines).toEqual([]);
  });

  it('shows unlimited AI descriptions, and the bare feature when no quota is known', () => {
    expect(
      planCardLines({ limits: { ai_listing_descriptions_per_month: -1 }, features: {} })
    ).toEqual(['Unlimited AI listing descriptions']);
    expect(planCardLines({ limits: {}, features: { aiListingDescriptions: true } })).toEqual([
      'AI listing descriptions',
    ]);
  });

  it('tolerates a row with no jsonb', () => {
    expect(planCardLines({ limits: null, features: undefined })).toEqual([]);
  });
});

describe('every seeded plan feature has a decision', () => {
  const keys = seededFeatureKeys();

  it('finds the seeded keys', () => {
    // A parsing failure would make the check below vacuous.
    expect(keys).toEqual(
      expect.arrayContaining(['customThemes', 'removeBranding', 'openHouseManagement'])
    );
  });

  it('is either worded for the card or deliberately omitted', () => {
    const decided = new Set([...Object.keys(PLAN_CARD_FEATURES), ...DELIBERATELY_OMITTED]);
    expect(keys.filter((k) => !decided.has(k))).toEqual([]);
  });
});
