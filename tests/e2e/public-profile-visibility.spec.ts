/**
 * The agent's visibility toggles, from a logged-out visitor's point of view.
 *
 * US-110: usePublicProfile reads user_settings with the ANON client, and the
 * only SELECT policy was `auth.uid() = user_id`. maybeSingle() therefore
 * returned null for every real visitor and the hook fell back to all-true — so
 * an agent switched "Show sold properties" off, saw it work because they are
 * logged in, and every visitor went on seeing them.
 *
 * These run logged out, which is the whole point: the previous behaviour was
 * correct for exactly the one person it did not apply to.
 *
 * Supabase is intercepted, as in auth.spec.ts, so no backend is needed.
 */

import { test, expect, type Page } from '@playwright/test';

const AGENT = {
  id: '00000000-0000-4000-8000-000000000003',
  username: 'visibilityagent',
  fullName: 'Visibility Agent',
};

const SOLD_ADDRESS = '99 Sold Street';
const PENDING_ADDRESS = '77 Pending Place';
const ACTIVE_ADDRESS = '11 Active Avenue';

function listing(id: string, address: string, status: string) {
  return {
    id,
    address,
    city: 'Townsville',
    price: '450000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    status,
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

/**
 * @param settings what user_settings returns for an anonymous read. `null`
 *        reproduces the old behaviour, where RLS hid the row entirely.
 */
async function setupProfileMocks(page: Page, settings: Record<string, boolean> | null) {
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
        listing('l1', ACTIVE_ADDRESS, 'active'),
        listing('l2', PENDING_ADDRESS, 'pending'),
        listing('l3', SOLD_ADDRESS, 'sold'),
      ]),
    })
  );

  // maybeSingle(): a row, or null when RLS hides it.
  await page.route('**/rest/v1/user_settings**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: settings ? JSON.stringify(settings) : 'null',
    })
  );

  await page.route('**/functions/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: '{}' })
  );
}

test.describe('Public profile visibility', () => {
  test('a pending listing appears on the public page', async ({ page }) => {
    await setupProfileMocks(page, {
      user_id: AGENT.id,
      show_listings: true,
      show_sold_properties: true,
      show_testimonials: true,
      show_social_proof: true,
      show_contact_buttons: true,
    } as unknown as Record<string, boolean>);

    await page.goto(`/${AGENT.username}`);

    // The gallery filtered on status === 'active' alone, so marking a listing
    // Pending made it vanish — despite ListingCard having a Pending badge.
    await expect(page.getByText(PENDING_ADDRESS).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(ACTIVE_ADDRESS).first()).toBeVisible();
  });

  test('turning off "show sold properties" hides them from a logged-out visitor', async ({
    page,
  }) => {
    await setupProfileMocks(page, {
      user_id: AGENT.id,
      show_listings: true,
      show_sold_properties: false,
      show_testimonials: true,
      show_social_proof: true,
      show_contact_buttons: true,
    } as unknown as Record<string, boolean>);

    await page.goto(`/${AGENT.username}`);

    await expect(page.getByText(ACTIVE_ADDRESS).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(SOLD_ADDRESS)).toHaveCount(0);
  });

  test('sold properties are shown when the toggle is on', async ({ page }) => {
    await setupProfileMocks(page, {
      user_id: AGENT.id,
      show_listings: true,
      show_sold_properties: true,
      show_testimonials: true,
      show_social_proof: true,
      show_contact_buttons: true,
    } as unknown as Record<string, boolean>);

    await page.goto(`/${AGENT.username}`);

    await expect(page.getByText(SOLD_ADDRESS).first()).toBeVisible({ timeout: 20000 });
  });
});
