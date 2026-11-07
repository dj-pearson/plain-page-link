/**
 * US-114: a listing had no URL. US-275: it has a page of its own now, and the
 * old ?listing= links redirect to it.
 *
 * The detail modal was component state, so every share button shared
 * window.location.href — the profile. The recipient landed at the top of a
 * page listing a dozen properties with no indication which one they had been
 * sent, and the JSON-LD the modal injects could never be indexed because there
 * was no address to index it against.
 *
 * These run logged out against an intercepted Supabase, like the other public
 * profile specs.
 */

import { test, expect, type Page } from '@playwright/test';

const AGENT = {
  id: '00000000-0000-4000-8000-000000000004',
  username: 'deeplinkagent',
  fullName: 'Deep Link Agent',
};

const FIRST = { id: 'listing-one', address: '11 First Avenue' };
const SECOND = { id: 'listing-two', address: '22 Second Street' };

function listing(id: string, address: string) {
  return {
    id,
    address,
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
  };
}

async function setupMocks(page: Page) {
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
      body: JSON.stringify([listing(FIRST.id, FIRST.address), listing(SECOND.id, SECOND.address)]),
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

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

test.describe('Listing page (US-275)', () => {
  test('/:username/listing/:id renders that property as a page', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}/listing/${SECOND.id}`);

    await expect(heading(page)).toContainText(SECOND.address);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Equal Housing Opportunity')).toBeVisible();
  });

  test('an old ?listing=<id> link redirects to the listing page', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}?listing=${SECOND.id}`);

    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}/listing/${SECOND.id}$`));
    await expect(heading(page)).toContainText(SECOND.address);
  });

  test("an id that matches nothing points the visitor at the agent's listings", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}/listing/deleted-long-ago`);

    await expect(heading(page)).toHaveText('This home is no longer listed');
    await page.getByRole('link', { name: /listings/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}$`));
  });

  test('opening a listing navigates to its page, and Back returns to the profile', async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}`);

    await page
      .getByRole('button', { name: new RegExp(`View listing:\\s*${FIRST.address}`) })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}/listing/${FIRST.id}$`));
    await expect(heading(page)).toContainText(FIRST.address);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}$`));
  });

  test('the share button copies the listing page URL, not the profile URL', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setupMocks(page);
    await page.goto(`/${AGENT.username}/listing/${FIRST.id}`);
    await expect(heading(page)).toContainText(FIRST.address);

    // navigator.share exists on the mobile emulation Playwright ships, and the
    // component prefers it; remove it so the clipboard branch is the one under
    // test, which is what a desktop visitor gets.
    await page.evaluate(() => {
      // @ts-expect-error deleting an optional platform API for the test
      delete navigator.share;
    });

    await page.getByRole('button', { name: 'Share property', exact: true }).first().click();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(new RegExp(`/${AGENT.username}/listing/${FIRST.id}$`));
  });
});
