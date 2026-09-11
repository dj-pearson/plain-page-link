/**
 * Accessibility tests (axe-core)
 *
 * Runs axe.analyze() against key pages and fails on any 'critical' or
 * 'serious' violations. Supabase + cookie consent are mocked so the run is
 * hermetic (no live backend), matching the E2E approach.
 *
 * Baseline (initial run, 2026) — count of distinct critical/serious axe rules
 * per page. The baseline is now ZERO everywhere: each of these pages had
 * critical/serious violations accepted as pre-existing, and US-206 fixed them
 * rather than continuing to grade against them.
 *
 * What was accepted, and what it actually meant to a user:
 *
 *   landing (3)
 *     button-name [critical] — the blog category filter is a Radix
 *       SelectTrigger whose accessible name comes from the value it shows, and
 *       SelectValue had no placeholder. With no articles loaded there is no
 *       matching item, so it showed nothing and a screen reader announced
 *       "button". The empty state is the one every first visitor sees.
 *     color-contrast — white on bg-red-500 (3.76) and bg-green-500 (2.27) in
 *       the before/after badges; text-red-400 on a red-500/10 wash (2.42) and
 *       text-green-400 on green-500/10 (1.59) in the Problem/Solution pills.
 *     link-in-text-block — the footer's legal links were blue-400 inside
 *       gray-500 prose at 1.9:1, with nothing but colour to mark them.
 *
 *   login (1), register (1) — gray-400 on white for the "or" divider (2.53)
 *     and the username hint, and white on the 500-level avatar fills at 10px
 *     bold (2.42-4.23).
 *
 *   dashboard (1) — reached only behind the mocked session; kept at 0 with the
 *     rest, since the shared components it renders are the ones that changed.
 *
 * US-113 added the listing-modal case. ListingDetailModal was a hand-rolled
 * overlay — no role=dialog, no aria-modal, no focus trap, no focus restore,
 * and unlabelled icon buttons — so the modal state was exactly the state the
 * suite never looked at. It now uses the Radix Dialog the rest of the page
 * uses, and this holds it there.
 *
 * A number above zero here is an accepted defect. Add one only with the
 * argument for it written down.
 */

const BASELINE: Record<string, number> = {
  landing: 0,
  login: 0,
  register: 0,
  dashboard: 0,
  'public profile': 0,
  'public profile with a listing modal open': 0,
};

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SERIOUS = ['critical', 'serious'];

/**
 * What failed, and on which element.
 *
 * "1 color-contrast violation" tells the next person a number and nothing they
 * can act on — axe groups every node under one rule, so a violation can be one
 * span or forty. US-206 spent its first twenty minutes rebuilding this by hand
 * in a scratch script; the measured ratio and the element are what make the
 * failure self-explanatory.
 */
function describe(
  violations: Array<{
    id: string;
    impact?: string | null;
    nodes: Array<{ html: string; failureSummary?: string }>;
  }>
): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 4)
        .map((n) => {
          const ratio = /contrast of ([\d.]+)/.exec(n.failureSummary ?? '')?.[1];
          return `      ${ratio ? `${ratio}:1  ` : ''}${n.html.replace(/\s+/g, ' ').slice(0, 140)}`;
        })
        .join('\n');
      const more = v.nodes.length > 4 ? `\n      ... +${v.nodes.length - 4} more` : '';
      return `  ${v.id} (${v.impact}) x${v.nodes.length}\n${nodes}${more}`;
    })
    .join('\n');
}

async function setupMocks(page: Page) {
  // Pre-seed cookie consent so the banner doesn't overlay/serialize into a11y noise.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'cookie_consent_v1',
        JSON.stringify({
          version: 1,
          timestamp: new Date(0).toISOString(),
          necessary: true,
          analytics: false,
          preferences: false,
        })
      );
    } catch {
      /* ignore */
    }
  });

  const session = () => {
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: 'fake',
      refresh_token: 'fake',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'a11y@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        user_metadata: {},
      },
    };
  };

  await page.route('**/rest/v1/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: '[]' })
  );
  // Registered after the '**/rest/v1/**' catch-all on purpose: Playwright
  // matches the most recently added route first, so these win for their tables
  // and everything else still resolves to an empty array.
  await page.route('**/rest/v1/listings**', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '00000000-0000-4000-8000-000000000010',
          image: null,
          photos: [],
          address: '412 Maple Avenue',
          city: 'Salt Lake City',
          price: '525000',
          bedrooms: 3,
          bathrooms: 2,
          square_feet: 1980,
          status: 'active',
          sort_order: 1,
          is_featured: false,
          days_on_market: 12,
          description: 'A quiet street, a loud kitchen.',
          property_type: 'Single Family',
          state: 'UT',
          zip_code: '84103',
          mls_number: 'MLS-0001',
          lot_size_acres: 0.19,
          virtual_tour_url: null,
          highlights: [],
          created_at: '2026-03-01T12:00:00.000Z',
        },
      ]),
    })
  );
  await page.route('**/rest/v1/profiles**', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-4000-8000-000000000001',
        username: 'demo',
        full_name: 'Demo Agent',
      }),
    })
  );
  await page.route('**/functions/v1/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: '{"success":true}' })
  );
  await page.route('**/auth/v1/token**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(session()) })
  );
  await page.route('**/auth/v1/user**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(session().user) })
  );
}

/**
 * axe reports zero violations on an empty document, so a suite that never
 * notices the app failed to mount passes every page and proves nothing. That
 * is what this suite did until US-113 gave the dev server its VITE_SUPABASE_*
 * placeholders. This is the tripwire for the next time.
 */
async function assertAppRendered(page: Page) {
  const text = (await page.locator('body').innerText()).trim();
  expect(
    text.length,
    'The page rendered no text at all — the SPA did not mount, so an axe run on it is meaningless.'
  ).toBeGreaterThan(0);
  expect(text, 'The app mounted straight into its error boundary.').not.toMatch(
    /This page didn.t load/i
  );
}

async function analyze(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blocking = results.violations.filter((v) => SERIOUS.includes(v.impact ?? ''));
  return { blocking, total: results.violations.length };
}

/**
 * US-208: this list was five pages. The public site has twenty-four routes, and
 * running axe over all of them found 14 critical/serious violations on 12 of
 * the 19 the suite could not see — including three more unnamed comboboxes, the
 * same CRITICAL button-name defect US-206 had just fixed on the landing page.
 *
 * That is the US-186 shape again: the guard was correct, and it was pointed at
 * the wrong pages. A sampled suite measures the sample.
 *
 * Every public route is here now. Adding a route to App.tsx and not to this list
 * is what the route-coverage test below is for.
 */
const PAGES: { name: string; path: string }[] = [
  // Authenticated and profile surfaces, which need the mocked session.
  { name: 'login', path: '/auth/login' },
  { name: 'register', path: '/auth/register' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'public profile', path: '/demo' },

  // The public marketing, legal, blog and free-tool surface.
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'press', path: '/press' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'dmca', path: '/dmca' },
  { name: 'acceptable use', path: '/acceptable-use' },
  { name: 'accessibility statement', path: '/accessibility' },
  { name: 'cookies', path: '/cookies' },
  { name: 'privacy choices', path: '/privacy-choices' },
  { name: 'blog', path: '/blog' },
  { name: 'for real estate agents', path: '/for-real-estate-agents' },
  { name: 'instagram bio for realtors', path: '/instagram-bio-for-realtors' },
  { name: 'vs linktree', path: '/vs/linktree' },
  { name: 'vs beacons', path: '/vs/beacons' },
  { name: 'vs later', path: '/vs/later' },
  { name: 'feature: property listings', path: '/features/property-listings' },
  { name: 'feature: lead capture', path: '/features/lead-capture' },
  { name: 'feature: calendar booking', path: '/features/calendar-booking' },
  { name: 'feature: testimonials', path: '/features/testimonials' },
  { name: 'feature: analytics', path: '/features/analytics' },
  { name: 'tools index', path: '/tools' },
  { name: 'instagram bio analyzer', path: '/tools/instagram-bio-analyzer' },
  { name: 'listing description generator', path: '/tools/listing-description-generator' },
  { name: 'agent bio generator', path: '/tools/real-estate-agent-bio-generator' },
  { name: 'not found', path: '/404' },

  // The rest of the auth and onboarding surface. The route-coverage test in
  // src/browser-suites.test.ts is what found these: the list above was written
  // from a sweep of the routes someone remembered, and it missed two free tools
  // and six auth screens.
  { name: 'forgot password', path: '/auth/forgot-password' },
  { name: 'reset password', path: '/auth/reset-password' },
  { name: 'mfa', path: '/auth/mfa' },
  { name: 'auth callback', path: '/auth/callback' },
  { name: 'sso callback', path: '/auth/sso/callback' },
  { name: 'onboarding wizard', path: '/onboarding/wizard' },
];

test.describe('Accessibility (axe-core)', () => {
  for (const { name, path } of PAGES) {
    test(`${name} critical/serious a11y violations stay at/below baseline`, async ({ page }) => {
      await setupMocks(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      // Let the SPA render.
      await page.waitForTimeout(1500);
      await assertAppRendered(page);

      const { blocking, total } = await analyze(page);
      if (blocking.length > 0) {
        console.log(
          `[a11y] ${name}: ${blocking.length} critical/serious of ${total} total →`,
          describe(blocking)
        );
      }
      const baseline = BASELINE[name] ?? 0;
      expect(
        blocking.length,
        `New critical/serious a11y violations on ${name} (baseline ${baseline}):\n${describe(blocking)}`
      ).toBeLessThanOrEqual(baseline);
    });
  }

  test('public profile with a listing modal open stays at/below baseline', async ({ page }) => {
    const name = 'public profile with a listing modal open';
    await setupMocks(page);
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await assertAppRendered(page);

    // The card's address is the interactive element (US-113 unnested the two
    // buttons that used to sit inside a role=button container).
    await page
      .getByRole('button', { name: /View listing:/ })
      .first()
      .click();
    // The assertion that the overlay is a dialog at all — the hand-rolled one
    // had no role, so this locator would never have resolved.
    await expect(page.getByRole('dialog')).toBeVisible();

    const { blocking, total } = await analyze(page);
    if (blocking.length > 0) {
      console.log(
        `[a11y] ${name}: ${blocking.length} critical/serious of ${total} total →`,
        describe(blocking)
      );
    }
    const baseline = BASELINE[name] ?? 0;
    expect(
      blocking.length,
      `New critical/serious a11y violations on ${name} (baseline ${baseline}):\n${describe(blocking)}`
    ).toBeLessThanOrEqual(baseline);
  });
});
