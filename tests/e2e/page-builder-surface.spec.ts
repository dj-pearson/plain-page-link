/**
 * US-116: one public surface.
 *
 * FullProfilePage queried custom_pages on every view and, if the agent had any
 * active published page, replaced the entire profile with
 * `<Navigate to="/p/<slug>">`. So opening the page builder once silently took
 * an agent's listings, testimonials, contact buttons and lead capture off the
 * public web, and the /p/ page that replaced them tracked nothing and carried
 * none of the profile's metadata.
 *
 * DemoProfilesShowcase linked /p/${username}, which 404'd for every agent whose
 * page slug was not exactly their username.
 */

import { test, expect, type Page } from '@playwright/test';

const AGENT = {
  id: '00000000-0000-4000-8000-000000000006',
  username: 'surfaceagent',
  fullName: 'Surface Agent',
};

const LISTING_ADDRESS = '31 Profile Place';
const BLOCK_TEXT = 'Built with the page builder';

const THEME = {
  name: 'Default',
  preset: 'modern',
  colors: {
    primary: '#2563eb',
    secondary: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#f59e0b',
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  borderRadius: 'medium',
  spacing: 'normal',
};

async function setupMocks(page: Page, opts: { withCustomPage: boolean }) {
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
      /* localStorage unavailable — ignore */
    }
  });

  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  await page.route('**/rest/v1/profiles**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: AGENT.id,
        username: AGENT.username,
        full_name: AGENT.fullName,
        is_published: true,
        theme: 'modern',
        bio: 'Selling homes in Townsville.',
      }),
    })
  );

  await page.route('**/rest/v1/listings**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'listing-1',
          address: LISTING_ADDRESS,
          city: 'Townsville',
          price: '450000',
          bedrooms: 3,
          bathrooms: 2,
          square_feet: 1800,
          status: 'active',
          photos: [],
          image: null,
          sort_order: 0,
          is_featured: false,
          days_on_market: 10,
          description: null,
          property_type: 'single_family',
          state: 'TX',
          zip_code: '78701',
          mls_number: null,
          lot_size_acres: null,
          virtual_tour_url: null,
          highlights: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ]),
    })
  );

  await page.route('**/rest/v1/custom_pages**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: opts.withCustomPage
        ? JSON.stringify({
            id: '00000000-0000-4000-8000-0000000000c2',
            user_id: AGENT.id,
            slug: 'spring-listings',
            title: 'Spring Listings',
            theme: THEME,
            blocks: [
              {
                id: 'block-1',
                type: 'text',
                order: 0,
                visible: true,
                config: { content: BLOCK_TEXT },
              },
            ],
          })
        : 'null',
    })
  );

  await page.route('**/rest/v1/user_settings**', (route) =>
    route.fulfill({ contentType: 'application/json', body: 'null' })
  );
  await page.route('**/functions/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: '{}' })
  );
}

test.describe('One public surface', () => {
  test('a page-builder page adds to the profile instead of replacing it', async ({ page }) => {
    await setupMocks(page, { withCustomPage: true });

    await page.goto(`/${AGENT.username}`);

    // The URL does not change. It used to become /p/spring-listings.
    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}$`));

    // Everything the redirect used to take away is still here…
    await expect(page.getByText(AGENT.fullName).first()).toBeVisible();
    await expect(page.getByText(LISTING_ADDRESS).first()).toBeVisible();

    // …and the built blocks are on the same page.
    await expect(page.getByText(BLOCK_TEXT).first()).toBeVisible();
  });

  test('a profile without a page-builder page is unchanged', async ({ page }) => {
    await setupMocks(page, { withCustomPage: false });

    await page.goto(`/${AGENT.username}`);
    await expect(page.getByText(LISTING_ADDRESS).first()).toBeVisible();
    await expect(page.getByText(BLOCK_TEXT)).toHaveCount(0);
  });

  test('an already-shared /p/ link lands on the profile', async ({ page }) => {
    await setupMocks(page, { withCustomPage: true });

    await page.goto('/p/spring-listings');

    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}$`), { timeout: 20000 });
    await expect(page.getByText(LISTING_ADDRESS).first()).toBeVisible();
  });

  test('the demo showcase links to a profile, not a page slug', async ({ page }) => {
    await setupMocks(page, { withCustomPage: false });

    // The showcase has to actually render, or the assertion below is vacuous:
    // the catch-all returns [] for profiles, so without this the section is
    // absent and "no /p/ links" is true of an empty page.
    await page.route('**/rest/v1/profiles**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: AGENT.id,
            username: AGENT.username,
            full_name: AGENT.fullName,
            title: 'Associate Broker',
            bio: 'Selling homes in Townsville.',
            avatar_url: null,
            service_cities: ['Townsville'],
            theme: 'modern',
          },
        ]),
      })
    );

    await page.goto('/');

    const card = page.getByRole('link', { name: new RegExp(AGENT.fullName) });
    await expect(card.first()).toBeVisible({ timeout: 20000 });
    // It linked /p/${username}, which 404'd for every agent whose page slug was
    // not exactly their username.
    await expect(card.first()).toHaveAttribute('href', `/${AGENT.username}`);
  });
});
