/**
 * The /features/* pages may only claim what ships (US-332, slice 3 of US-143).
 *
 * /features/calendar-booking described a Google Calendar integration, two-way
 * sync, an approval step and "email and SMS reminders"; AgentBio embeds the
 * agent's Calendly and has no SMS provider. /features/testimonials offered
 * video testimonials (the table has no video column) and "unlimited"
 * testimonials (it is a plan limit). /features/analytics promised Story vs
 * Post attribution, time on page, a live activity feed and emailed metric
 * summaries, none of which exists, and quoted two invented agents.
 *
 * Each phrase below was on one of these pages or in the FEATURE_FAQS answers
 * they render (which also go out as FAQPage JSON-LD), and each carries the
 * reason it is false, so removing one from the list is a decision someone
 * writes down. Comments are stripped first, because each removal leaves a note
 * quoting what it removed; whitespace is collapsed, so copy that JSX wraps
 * across two lines is still caught.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');
const FEATURES_DIR = join(ROOT, 'src/pages/features');

/** Source text with block, JSX and line comments removed and whitespace collapsed. */
function visibleText(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ');
}

const ALL_PAGES_FALSE: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /\bSMS\b|text message reminder/i, why: 'there is no SMS provider' },
  {
    pattern: /video testimonial|video review|video support/i,
    why: 'testimonials have no video column',
  },
  { pattern: /real[- ]time/i, why: 'nothing on the dashboard updates live' },
];

const PAGE_FALSE: Record<string, Array<{ pattern: RegExp; why: string }>> = {
  'CalendarBooking.tsx': [
    {
      pattern:
        /google calendar (support|sync|integration|connection|account)|integrated calendly and google/i,
      why: 'no Google Calendar integration; bookings go through Calendly',
    },
    {
      pattern: /syncs both ways|one-click connection|OAuth/i,
      why: 'the agent pastes a Calendly URL; nothing is connected',
    },
    { pattern: /manual approval|approve each showing/i, why: 'no approval step exists' },
    { pattern: /require phone number/i, why: 'the booking asks for name and email only' },
  ],
  'Testimonials.tsx': [
    { pattern: /unlimited testimonials/i, why: 'testimonials are a plan limit (3 on Free)' },
    { pattern: /success stor/i, why: 'there is no success-story format' },
    { pattern: /real testimonial examples/i, why: 'the examples were invented' },
    { pattern: /\b\d{2}%/, why: 'unsourced statistics' },
  ],
  'Analytics.tsx': [
    {
      pattern: /stories vs|story, post|posts, reels/i,
      why: 'attribution cannot tell a Story from a Post or Reel',
    },
    { pattern: /time spent|engagement time/i, why: 'time on page is not measured' },
    {
      pattern: /photo gallery engagement|virtual tour click/i,
      why: 'photo and tour interactions are not tracked',
    },
    {
      pattern: /geographic location|device breakdown/i,
      why: 'visitor location and device are not reported',
    },
    { pattern: /live activity feed/i, why: 'there is no live feed' },
    {
      pattern: /email summaries of your key metrics/i,
      why: 'the morning email covers leads, tasks and key dates, not metrics',
    },
    { pattern: /industry average/i, why: 'unsourced benchmark' },
    { pattern: /Maria Lopez|David Kim/, why: 'invented agents' },
  ],
  // US-355: the last /features slice of US-295.
  'PropertyListings.tsx': [
    {
      pattern: /unlimited (properties|property listings|listings on pro)|pro plan/i,
      why: 'Professional allows 25 listings; only Team and above are unlimited',
    },
    { pattern: /monthly payment/i, why: 'the listing shows no payment estimate' },
    { pattern: /price reduc|just listed/i, why: 'there is no price-reduced or just-listed badge' },
    { pattern: /year built|HOA/i, why: 'year built and HOA fees are not shown on the page' },
    { pattern: /neighbo(u)?rhood information|amenities/i, why: 'no neighbourhood data' },
    { pattern: /close dates|before\/after/i, why: 'sold_date is not shown; no before/after view' },
    { pattern: /MLS attribution|fair housing disclaimer/i, why: 'neither is rendered' },
    { pattern: /GDPR/i, why: 'not an attestation anyone has made' },
  ],
};

/**
 * "MLS compliance" promised something nobody could point at (US-324). What the
 * public page shows is the Equal Housing Opportunity logo and statement, the
 * license number and state, and the MLS number on each listing; marketing copy
 * names those instead.
 */
const MLS_COMPLIANCE_FILES = [
  'src/pages/public/Landing.tsx',
  'src/pages/public/Press.tsx',
  'src/pages/landing/ForRealEstateAgents.tsx',
  'src/pages/landing/VsBeacons.tsx',
  'src/pages/landing/VsLinktree.tsx',
  'src/pages/landing/VsLater.tsx',
  'src/pages/landing/LocationTemplate.tsx',
  'src/config/seo.config.ts',
  'src/lib/faq-schema.ts',
];

const FAQ_FALSE: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /integrates with google calendar/i, why: 'no Google Calendar integration' },
  { pattern: /engagement time/i, why: 'time on page is not measured' },
  { pattern: /update in real-time/i, why: 'nothing updates live' },
  {
    pattern: /testimonials are added by the agent through the dashboard/i,
    why: 'clients can submit reviews at /:username/review',
  },
  { pattern: /create different appointment types/i, why: 'appointment types live in Calendly' },
  {
    pattern: /unlimited (property )?listings/i,
    why: 'listings are a plan limit; the allowance comes from listingAllowanceSummary()',
  },
  { pattern: /\$39/, why: 'no plan costs $39; prices come from PRICING_PLANS' },
];

const find = (text: string, rules: Array<{ pattern: RegExp; why: string }>) =>
  rules
    .filter(({ pattern }) => pattern.test(text))
    .map(({ pattern, why }) => `${pattern} (${why})`);

describe('/features/* pages claim only what ships', () => {
  const pages = readdirSync(FEATURES_DIR).filter(
    (f) => f.endsWith('.tsx') && !f.includes('.test.')
  );

  it('finds the feature pages', () => {
    expect(pages).toEqual(expect.arrayContaining(Object.keys(PAGE_FALSE)));
  });

  for (const page of pages) {
    it(`${page} carries none of the removed false claims`, () => {
      const text = visibleText(readFileSync(join(FEATURES_DIR, page), 'utf8'));
      expect(find(text, [...ALL_PAGES_FALSE, ...(PAGE_FALSE[page] ?? [])])).toEqual([]);
    });
  }

  it('the FEATURE_FAQS answers (also FAQPage JSON-LD) carry none of them', () => {
    const text = visibleText(readFileSync(join(ROOT, 'src/lib/faq-schema.ts'), 'utf8'));
    expect(find(text, [...ALL_PAGES_FALSE, ...FAQ_FALSE])).toEqual([]);
  });

  for (const file of [...MLS_COMPLIANCE_FILES, 'src/pages/features/PropertyListings.tsx']) {
    it(`${file} does not say "MLS compliance" without naming what it is`, () => {
      const text = visibleText(readFileSync(join(ROOT, file), 'utf8'));
      const hits = [...text.matchAll(/.{0,60}MLS complian.{0,40}/gi)].map((m) => m[0]);
      expect(hits).toEqual([]);
    });
  }

  it('strips comments but keeps copy JSX wrapped across lines', () => {
    const src = `{/* SMS was here */}\n// SMS too\n<p>Buyer gets email and\n  SMS reminder</p> https://x.test`;
    const text = visibleText(src);
    expect(text).toMatch(/email and SMS reminder/);
    expect(text).not.toMatch(/SMS was here|SMS too/);
    expect(text).toMatch(/https:\/\/x\.test/);
  });
});
