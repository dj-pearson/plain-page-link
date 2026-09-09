/**
 * Accessibility tests (axe-core)
 *
 * Runs axe.analyze() against key pages and fails on any 'critical' or
 * 'serious' violations. Supabase + cookie consent are mocked so the run is
 * hermetic (no live backend), matching the E2E approach.
 *
 * Baseline — the number of distinct critical/serious axe rules each page is
 * allowed. Every page is now ZERO (US-167). It was not: the suite shipped with
 * a non-zero baseline per page, "drive these numbers down over time", and a
 * warn-only CI job, which together meant the violations were permanent. They
 * sat there long enough that the landing page's critical finding — a filter
 * control with no accessible name, which also rendered as a visibly empty box —
 * read as normal.
 *
 * What US-167 cleared:
 *
 *   landing        : 3 -> 0  (button-name [critical], color-contrast x9,
 *                             link-in-text-block x3 on the legal links)
 *   login          : 1 -> 0  (the "or" divider)
 *   register       : 1 -> 0  (four avatar swatches, username helper text)
 *   dashboard      : 1 -> 0
 *   public profile : 1 -> 0  (listing status pills, bd/ba/sqft units,
 *                             "Powered by", the muted-foreground token)
 *   listing modal  : 1 -> 0  (the status pill again, from a second copy of
 *                             the colour map)
 *
 * Raising a number here is not a fix. If a page needs a non-zero baseline
 * again, say in a comment which violation and why it cannot be fixed now.
 *
 * US-113 added the listing-modal case. ListingDetailModal was a hand-rolled
 * overlay — no role=dialog, no aria-modal, no focus trap, no focus restore,
 * and unlabelled icon buttons — so the modal state was exactly the state the
 * suite never looked at. It now uses the Radix Dialog the rest of the page
 * uses, and this holds it there.
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

  // US-167: a compile error does not blank the page — Vite covers it with an
  // overlay, so `body` still has text and the check above still passes. What
  // axe then measures is the overlay: during this story a syntax error in
  // BlogSection.tsx turned landing and login into one identical
  // `scrollable-region-focusable` finding and the suite reported six passes.
  // The overlay lives in a shadow root, so it has to be asked for by element
  // name rather than found in innerText.
  const overlays = await page.locator('vite-error-overlay').count();
  expect(
    overlays,
    'A Vite error overlay is covering the page: the build is broken, and axe is ' +
      'measuring the overlay rather than the application.'
  ).toBe(0);
}

async function analyze(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blocking = results.violations.filter((v) => SERIOUS.includes(v.impact ?? ''));
  return { blocking, total: results.violations.length };
}

/**
 * Print what failed, and on which element.
 *
 * Naming the rule is not enough to act on it: US-167 began with "landing: 3
 * critical/serious → button-name, color-contrast, link-in-text-block" and
 * needed a throwaway spec bolted onto the suite before anyone could tell WHICH
 * button or WHICH text. The nodes are already in the axe result; they just were
 * not being printed.
 */
function reportBlocking(
  name: string,
  blocking: Awaited<ReturnType<typeof analyze>>['blocking'],
  total: number
) {
  if (blocking.length === 0) return;

  console.log(
    `[a11y] ${name}: ${blocking.length} critical/serious of ${total} total →`,
    blocking.map((v) => `${v.id} (${v.impact})`).join(', ')
  );
  for (const violation of blocking) {
    for (const node of violation.nodes.slice(0, 5)) {
      console.log(`  ${violation.id} :: ${node.html.slice(0, 160).replace(/\s+/g, ' ')}`);
      for (const check of node.any) {
        console.log(`      ${check.message.slice(0, 160)}`);
      }
    }
  }
}

const PAGES: { name: string; path: string }[] = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/auth/login' },
  { name: 'register', path: '/auth/register' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'public profile', path: '/demo' },
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
      reportBlocking(name, blocking, total);
      const baseline = BASELINE[name] ?? 0;
      expect(
        blocking.length,
        `New critical/serious a11y violations on ${name} (baseline ${baseline}): ` +
          blocking.map((v) => `${v.id} (${v.impact})`).join(', ')
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
    reportBlocking(name, blocking, total);
    const baseline = BASELINE[name] ?? 0;
    expect(
      blocking.length,
      `New critical/serious a11y violations on ${name} (baseline ${baseline}): ` +
        blocking.map((v) => `${v.id} (${v.impact})`).join(', ')
    ).toBeLessThanOrEqual(baseline);
  });
});
