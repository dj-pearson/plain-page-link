/**
 * The homepage and /for-real-estate-agents may only claim what ships (US-310,
 * slice 2 of US-143).
 *
 * Two checks, both deliberately blunt:
 *
 * 1. Every file docs/product/FEATURES_README.md names as the implementation of
 *    a claim exists. The table is the place a claim has to earn its line; a
 *    row pointing at a deleted file is a claim that has stopped being true.
 * 2. Phrases that were on these pages and are false do not come back. Each
 *    carries the reason, so removing one from this list is a decision someone
 *    writes down.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICING_PLANS } from '@/config/pricing-plans';

const ROOT = join(__dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

const MARKETING_PAGES = [
  'src/pages/public/Landing.tsx',
  'src/components/landing/AgentTestimonials.tsx',
  'src/pages/landing/ForRealEstateAgents.tsx',
];

const FALSE_CLAIMS: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /time zone/i, why: 'nothing in AgentBio detects a visitor time zone' },
  { pattern: /google calendar (support|sync|integration)/i, why: 'no Google Calendar integration' },
  { pattern: /video testimonial/i, why: 'testimonials have no video column' },
  { pattern: /property videos/i, why: 'listings have no video field' },
  { pattern: /story vs\.? post/i, why: 'attribution cannot tell a Story from a Post' },
  { pattern: /based on behaviou?r/i, why: 'behavioural scoring inputs were removed (US-105)' },
  { pattern: /MLS attribution/i, why: 'only the MLS number is shown' },
  { pattern: /under 2 seconds|instant load|5\+ seconds/i, why: 'no measured load time' },
  { pattern: /43%/, why: 'unsourced statistic' },
  { pattern: /verified credentials/i, why: 'nothing verifies a license' },
  { pattern: /'\$39'/, why: '$39 is not the price of any plan' },
  { pattern: /top agents/i, why: 'the showcase is any published page, not ranked agents' },
];

describe('marketing pages claim only what ships', () => {
  for (const page of MARKETING_PAGES) {
    it(`${page} carries none of the removed false claims`, () => {
      const source = read(page);
      const found = FALSE_CLAIMS.filter(({ pattern }) => pattern.test(source)).map(
        ({ pattern, why }) => `${pattern} (${why})`
      );
      expect(found).toEqual([]);
    });
  }

  it('every implementing file named in FEATURES_README.md exists', () => {
    const doc = read('docs/product/FEATURES_README.md');
    const table = doc.split('## Claims and where they are implemented')[1].split('\n## ')[0];
    const paths = [...table.matchAll(/`([^`]+\.(?:tsx?|sql))`/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(15);
    const missing = paths.filter((p) => !existsSync(join(ROOT, p)));
    expect(missing).toEqual([]);
  });

  it('the comparison-table price comes from the plans on sale', () => {
    const source = read('src/pages/landing/ForRealEstateAgents.tsx');
    expect(source).toMatch(/agentbio: AGENTBIO_PRICE_CELL/);
    // The cell is built from the cheapest paid plan; make sure one exists.
    expect(PRICING_PLANS.some((p) => p.price_monthly > 0)).toBe(true);
  });
});
