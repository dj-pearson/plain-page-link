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
import {
  CHECK_THEIR_SITE,
  COMPETITORS,
  NOT_REAL_ESTATE,
  competitorCell,
  type ComparisonFeature,
  type CompetitorId,
} from '@/config/competitors';

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
  // US-519 (US-508)
  {
    pattern: /\d+(-\d+)?[- ]minutes?\b/i,
    why: 'no setup or migration time has been measured',
  },
  {
    pattern: /join agents|agents who switched|agents switch|most agents (find|switch)/i,
    why: 'nothing records agents switching or what most agents think',
  },
  {
    pattern: /real estate templates|pre-designed pages/i,
    why: 'AgentBio has general visual themes, not real estate templates',
  },
  {
    pattern: /agentbio="(Advanced|Basic|Limited)"/,
    why: 'a ranking of AgentBio against a competitor that nobody measured',
  },
  {
    pattern: /home value expectations/i,
    why: 'the seller form asks property, timeline and reason, not an expected price',
  },
  // US-648: prose saying what a competitor lacks. The tables stopped doing this
  // in US-507; the FAQ answers, SEO descriptions and cards around them had not.
  {
    pattern:
      /\b(linktree|beacons|later)(['’]s)?( link in bio| contact forms?)? (can['’]t|cannot|doesn['’]t|don['’]t|has no|lacks?|only offers)\b/i,
    why: 'a statement that a named competitor lacks a feature, which nothing recorded checking',
  },
  {
    pattern: /not found in generic tools|simply don['’]t offer|features linktree doesn['’]t/i,
    why: 'a claim that Linktree lacks listings, lead forms and booking',
  },
  {
    pattern: /lack features like|tools are missing|missing from generic/i,
    why: 'a claim about what general link tools lack',
  },
  {
    pattern: /generic tools can['’]t|generic contact forms don['’]t/i,
    why: 'a claim about what general link tools cannot do',
  },
  {
    pattern: /falls short|fails if you|tools fail for|is not good for/i,
    why: 'framing a competitor as failing, rather than saying what each is built for',
  },
  {
    pattern: /basic link in bio|basic link organi[sz]ation|basic link functionality/i,
    why: "a ranking of a competitor's link page that nobody measured",
  },
  { pattern: /industry-leading/i, why: 'a superlative about a competitor with no source' },
  {
    pattern: /no (property )?listing (showcase|features)|no way to showcase/i,
    why: "a cross against a competitor's listing features, which nothing recorded checking",
  },
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

  for (const page of COMPARISON_PAGES) {
    it(`${page} fills no competitor cell with a literal (US-507)`, () => {
      // `beacons="Generic Contact Form"`, `later={false}`, `linktree: 'Basic'`:
      // each was a claim about another product that nothing recorded checking.
      // A competitor cell must be an expression that reads src/config/competitors.ts.
      const text = read(page);
      const literalCell = /\b(linktree|beacons|later)(?:=\{?|\s*:\s*)\s*(['"`]|true\b|false\b)/g;
      expect(text.match(literalCell) ?? []).toEqual([]);
    });

    it(`${page} explains how to read the competitor column`, () => {
      expect(read(page)).toMatch(/COMPETITOR_CELLS_NOTE/);
    });
  }

  it('a competitor cell is never a cross, and an unrecorded feature says to check (US-507)', () => {
    const ids = Object.keys(COMPETITORS) as CompetitorId[];
    for (const id of ids) {
      for (const [feature, cell] of Object.entries(COMPETITORS[id].features)) {
        const rendered = competitorCell(id, feature as ComparisonFeature);
        expect(rendered, `${id}.${feature}`).toBe(cell === 'offered' ? true : NOT_REAL_ESTATE);
      }
    }
    // Nothing is recorded about Linktree's testimonials or Later's branding.
    expect(competitorCell('linktree', 'testimonials')).toBe(CHECK_THEIR_SITE);
    expect(competitorCell('later', 'customBranding')).toBe(CHECK_THEIR_SITE);
    expect(competitorCell('beacons', 'listingGalleries')).toBe(NOT_REAL_ESTATE);
    expect(competitorCell('later', 'socialScheduling')).toBe(true);
  });

  it('every page that names a competitor shows when its facts were checked', () => {
    for (const page of COMPARISON_PAGES) {
      expect(read(page), page).toMatch(/COMPETITORS_VERIFIED_LABEL/);
    }
  });

  it('/vs/later builds its head through SEOHead and its FAQ from one array (US-519)', () => {
    // The last comparison page with a hand-written <Helmet>; its visible FAQ
    // and FAQPage schema were two copies that had already drifted apart.
    const source = readFileSync(join(ROOT, 'src/pages/landing/VsLater.tsx'), 'utf8');
    expect(source).toMatch(/<SEOHead\b/);
    expect(source).not.toMatch(/react-helmet-async/);
    expect(source).toMatch(/faqPageSchema\(FAQ_ENTRIES\)/);
    expect(source).toMatch(/<FaqSection entries=\{FAQ_ENTRIES\}/);
  });

  it('the plans the pages build their figures from exist', () => {
    const paid = PRICING_PLANS.filter((p) => p.price_monthly > 0);
    expect(paid.length).toBeGreaterThanOrEqual(2);
    expect(PRICING_PLANS.some((p) => p.price_monthly === 0)).toBe(true);
    expect(COMPETITORS.beacons.tiers).toContain('Free');
  });
});
