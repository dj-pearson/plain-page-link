/**
 * public/llms.txt is written to be quoted verbatim by AI systems, so it is the
 * one file where a wrong number costs the most (US-177).
 *
 * What it said before this test existed:
 *
 *   "Used by 5,000+ real estate agents with a 4.8/5 star rating from 523+
 *    reviews."
 *
 * Those are the exact invented figures US-111, US-157 and US-159 removed from
 * the UI over three passes. Nobody looked in here, because it is a text file in
 * public/ rather than a component. It also linked to /features, /compare/linktree,
 * /compare/beacons and /compare/later — four URLs with no page behind them,
 * which since US-176 return a real 404 — quoted Professional at $39/month when
 * the plan matrix charges $49 and omitted the $29 Starter plan entirely, and
 * gave two social handles that are not the ones the site links to.
 *
 * A file nothing checks is a file that drifts. This checks it against the
 * things that are already true elsewhere: the routes the build publishes, the
 * plan matrix the app enforces, and the marketing-claims rules the UI obeys.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICING_PLANS } from './config/pricing-plans';
import { STATIC_ROUTES, locationRoutes } from './config/prerender-routes';
import { TOOLS } from './config/tools';

const LLMS_TXT = readFileSync(join(process.cwd(), 'public', 'llms.txt'), 'utf8');

const ORIGIN = 'https://agentbio.net';

/** Every agentbio.net URL the file points at, as a route path. */
function referencedPaths(): string[] {
  const paths = new Set<string>();
  for (const match of LLMS_TXT.matchAll(/https:\/\/agentbio\.net(\/[^\s)]*)?/g)) {
    const path = (match[1] ?? '/').replace(/[.,]$/, '').replace(/\/+$/, '') || '/';
    paths.add(path);
  }
  return [...paths].sort();
}

/** Paths the build renders to a file. Blog articles come from rows, so /blog only. */
const PUBLISHED = new Set<string>([
  ...STATIC_ROUTES.filter((r) => r.kind !== 'auth').map((r) => r.path),
  ...locationRoutes().map((r) => r.path),
  // Rendered from `articles` rows rather than from STATIC_ROUTES, so it is not
  // in that list — but /blog itself is always published.
  '/blog',
]);

describe('llms.txt', () => {
  it('points only at pages the build publishes', () => {
    const broken = referencedPaths().filter((path) => !PUBLISHED.has(path));
    expect(
      broken,
      'every one of these would 404. /features and /compare/* were in this file ' +
        'for months; the real comparison pages are under /vs/.'
    ).toEqual([]);
  });

  it('links the comparison pages at their real paths', () => {
    for (const competitor of ['linktree', 'beacons', 'later']) {
      expect(LLMS_TXT).toContain(`${ORIGIN}/vs/${competitor}`);
    }
    expect(LLMS_TXT, '/compare/* has never been a route here').not.toContain('/compare/');
  });

  it('lists every free tool, including the one added after it was last edited', () => {
    for (const tool of TOOLS) {
      expect(LLMS_TXT, `${tool.path} is missing from llms.txt`).toContain(`${ORIGIN}${tool.path}`);
    }
  });

  it('quotes the prices the application actually charges', () => {
    for (const plan of PRICING_PLANS) {
      expect(
        LLMS_TXT,
        `${plan.name} costs $${plan.price_monthly}/month; llms.txt must say so`
      ).toContain(`$${plan.price_monthly}`);
    }
  });

  it('names no price that is not a plan', () => {
    const allowed = new Set(PRICING_PLANS.map((plan) => String(plan.price_monthly)));
    const quoted = [...LLMS_TXT.matchAll(/\$(\d[\d,]*)/g)].map((m) => m[1].replace(/,/g, ''));
    const strays = [...new Set(quoted)].filter((value) => !allowed.has(value));
    expect(strays, 'a price nobody can be charged is a claim, not a number').toEqual([]);
  });

  it('claims no user count, rating or review total', () => {
    // Each pattern needs a digit, not just a separator: `[\d,]+` alone happily
    // matches the comma in "agents, realtors", which is how the first version
    // of this test failed on the honest rewrite it was written to protect.
    const count = String.raw`\d[\d,]*\+?`;
    const banned: [string, RegExp][] = [
      [
        'a user count',
        new RegExp(
          String.raw`\b${count}\s*(real estate\s+)?(agents|realtors|users|customers)\b`,
          'i'
        ),
      ],
      ['a star rating', /\b\d(\.\d)?\s*\/\s*5\b/],
      ['a review count', new RegExp(String.raw`\b${count}\s*reviews\b`, 'i')],
      // A plan limit is what the product permits; a lead-volume CLAIM is what
      // it is asserted to produce. "100 leads a month" on the Starter line is
      // the first; "the average user captures 10+ qualified leads a month" was
      // the second, and was in this file. Only the claim frame is banned.
      [
        'a lead-volume claim',
        new RegExp(
          String.raw`(average|typical|report|generate|capture|see|get)s?\b[^.\n]{0,40}\b${count}\s*(qualified\s+)?leads?`,
          'i'
        ),
      ],
      [
        'a performance multiplier',
        /\b\d+(\.\d+)?(\s*[-–]\s*\d+(\.\d+)?)?x\s+(more|higher|better|faster)\b/i,
      ],
    ];
    const found = banned.filter(([, pattern]) => pattern.test(LLMS_TXT)).map(([label]) => label);
    expect(
      found,
      'this file is quoted verbatim by AI systems, so an invented figure here ' +
        'is repeated as fact by everything that reads it'
    ).toEqual([]);
  });

  it('gives the social handles the site actually links to', () => {
    expect(LLMS_TXT).toContain('https://x.com/AgentBioApp');
    expect(LLMS_TXT).toContain('https://www.instagram.com/agentbioapp/');
    expect(LLMS_TXT, 'twitter.com/agentbio is not an account this site links to').not.toContain(
      'twitter.com/agentbio'
    );
  });

  it('is substantial enough to be worth serving', () => {
    expect(LLMS_TXT.length).toBeGreaterThan(2000);
    expect(LLMS_TXT).toMatch(/^# AgentBio/);
  });
});
