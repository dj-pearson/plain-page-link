/**
 * The comparison pages say nothing about another product that we would have
 * to keep current, and nothing about AgentBio that is not in the product
 * (US-501, following US-156 and US-319).
 *
 * src/config/competitors.ts records the rule: no competitor prices, because
 * they change and vary by region, and a stale figure about somebody else is
 * both a credibility problem and a comparative-advertising one. /vs/linktree
 * and /vs/later followed it; /vs/beacons still compared "$49/month" with
 * "$10/month", and /for-real-estate-agents still carried "$24" and "$10".
 *
 * Comments are stripped first, because each removal leaves a note quoting
 * what it removed; whitespace is collapsed so wrapped JSX is still caught.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICING_PLANS } from '@/config/pricing-plans';
import { COMPETITORS } from '@/config/competitors';

const ROOT = join(__dirname, '..');

const COMPARISON_PAGES = [
  'src/pages/landing/VsBeacons.tsx',
  'src/pages/landing/VsLinktree.tsx',
  'src/pages/landing/VsLater.tsx',
  'src/pages/landing/ForRealEstateAgents.tsx',
];

function visibleText(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ');
}

/** A dollar figure written into the page as a literal, e.g. "$10" or '$24'. */
const LITERAL_PRICE = /['"`>][^'"`<]*\$\d/;

const FALSE_CLAIMS: Array<{ pattern: RegExp; why: string }> = [
  {
    pattern: /google calendar/i,
    why: 'no Google Calendar integration; showings go through Calendly',
  },
  { pattern: /verified badge|verified review/i, why: 'nothing verifies a testimonial' },
  { pattern: /unlimited links/i, why: 'links are a plan limit on Free and Starter' },
  { pattern: /agents report \d|\d+-\d+ qualified leads/i, why: 'unsourced lead figures' },
  { pattern: /pays for itself/i, why: 'an ROI claim with nothing behind it' },
  { pattern: /video testimonial/i, why: 'testimonials have no video column' },
  { pattern: /lead magnet/i, why: 'AgentBio has no downloadable-guide feature' },
  { pattern: /trusted by [\d,]+\+?|top agents/i, why: 'no measured agent count or ranking' },
  { pattern: /agentbio\.io/i, why: 'the domain is agentbio.net' },
  { pattern: /yourname\.agentbio\.net/i, why: 'profiles live at agentbio.net/yourname' },
];

const read = (path: string) => visibleText(readFileSync(join(ROOT, path), 'utf8'));

describe('comparison pages', () => {
  for (const page of COMPARISON_PAGES) {
    it(`${page} writes no price as a literal`, () => {
      // AgentBio's own prices are built from PRICING_PLANS in a template, so a
      // literal dollar figure can only be a hard-coded price — ours or theirs.
      const text = read(page);
      const match = text.match(new RegExp(LITERAL_PRICE.source, 'g')) ?? [];
      expect(match).toEqual([]);
    });

    it(`${page} carries none of the removed claims`, () => {
      const text = read(page);
      const found = FALSE_CLAIMS.filter(({ pattern }) => pattern.test(text)).map(
        ({ pattern, why }) => `${pattern} (${why})`
      );
      expect(found).toEqual([]);
    });
  }

  it('every page that names a competitor shows when its facts were checked', () => {
    for (const page of COMPARISON_PAGES) {
      expect(read(page), page).toMatch(/COMPETITORS_VERIFIED_LABEL/);
    }
  });

  it('the plans the pages build their figures from exist', () => {
    const paid = PRICING_PLANS.filter((p) => p.price_monthly > 0);
    expect(paid.length).toBeGreaterThanOrEqual(2);
    expect(PRICING_PLANS.some((p) => p.price_monthly === 0)).toBe(true);
    expect(COMPETITORS.beacons.tiers).toContain('Free');
  });
});
