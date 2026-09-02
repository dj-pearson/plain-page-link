/**
 * US-114: a listing had no URL.
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

const dialog = (page: Page) => page.getByRole('dialog');

test.describe('Listing deep link', () => {
  test('?listing=<id> opens that property on load', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}?listing=${SECOND.id}`);

    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByText(SECOND.address).first()).toBeVisible();
  });

  test('an id that matches nothing renders the profile rather than an error', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}?listing=deleted-long-ago`);

    await expect(page.getByText(AGENT.fullName).first()).toBeVisible();
    await expect(dialog(page)).toHaveCount(0);
  });

  test('opening a listing puts it in the URL, and Back closes it', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`/${AGENT.username}`);

    await page
      .getByRole('button', { name: new RegExp(`View listing:\\s*${FIRST.address}`) })
      .first()
      .click();

    await expect(dialog(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`\\?listing=${FIRST.id}$`));

    await page.goBack();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/${AGENT.username}$`));
  });

  test('the share button copies the listing URL, not the profile URL', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setupMocks(page);
    await page.goto(`/${AGENT.username}?listing=${FIRST.id}`);
    await expect(dialog(page)).toBeVisible();

    // navigator.share exists on the mobile emulation Playwright ships, and the
    // component prefers it; remove it so the clipboard branch is the one under
    // test, which is what a desktop visitor gets.
    await page.evaluate(() => {
      // @ts-expect-error deleting an optional platform API for the test
      delete navigator.share;
    });

    await dialog(page).getByRole('button', { name: /share/i }).first().click();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(`/${AGENT.username}`);
    expect(copied).toContain(`listing=${FIRST.id}`);
  });
});
