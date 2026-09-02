/**
 * US-115: what the public pages actually record.
 *
 * Three things were wrong and all of them are only observable from the network:
 *
 *   - An agent with a page-builder page got the full profile fetch and a view
 *     recorded against their profile, and was then redirected to /p/<slug>,
 *     which tracked nothing at all. So the page their visitors actually saw had
 *     no analytics, and the page they never saw got the view.
 *   - profiles.view_count was bumped by a separate unthrottled RPC, so the
 *     headline number and the chart counted different things.
 *   - Call, Email and Text taps were logger.info'd and nowhere else.
 *
 * These assert the requests, because the requests are what changed.
 */

import { test, expect, type Page, type Request } from '@playwright/test';

const AGENT = {
  id: '00000000-0000-4000-8000-000000000005',
  username: 'trackingagent',
  fullName: 'Tracking Agent',
};

interface Recorded {
  views: Request[];
  events: Request[];
  viewRpcs: Request[];
}

async function setupMocks(page: Page, recorded: Recorded, customPageSlug: string | null) {
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

  // The old unthrottled path. Recorded so its absence can be asserted.
  await page.route('**/rest/v1/rpc/increment_profile_views**', (route) => {
    recorded.viewRpcs.push(route.request());
    return route.fulfill({ contentType: 'application/json', body: 'null' });
  });

  await page.route('**/rest/v1/analytics_views**', (route) => {
    if (route.request().method() === 'POST') recorded.views.push(route.request());
    return route.fulfill({ contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/analytics_events**', (route) => {
    if (route.request().method() === 'POST') recorded.events.push(route.request());
    return route.fulfill({ contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/profiles**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: AGENT.id,
        username: AGENT.username,
        full_name: AGENT.fullName,
        is_published: true,
        theme: 'modern',
        phone: '5550142000',
        email_display: 'tracking@example.test',
        sms_enabled: true,
      }),
    })
  );

  await page.route('**/rest/v1/custom_pages**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: customPageSlug
        ? JSON.stringify({
            id: '00000000-0000-4000-8000-0000000000c1',
            user_id: AGENT.id,
            slug: customPageSlug,
            title: 'My Custom Page',
            description: 'Built with the page builder',
            blocks: [],
            // A full theme: PublicPage reads theme.colors.primary directly, so
            // an empty object crashes it into the error boundary.
            theme: {
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
            },
            seo: {},
            published: true,
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
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

const fresh = (): Recorded => ({ views: [], events: [], viewRpcs: [] });

test.describe('Public page analytics', () => {
  test('a profile view is recorded once, and not through the unthrottled RPC', async ({ page }) => {
    const recorded = fresh();
    await setupMocks(page, recorded, null);

    await page.goto(`/${AGENT.username}`);
    await expect(page.getByText(AGENT.fullName).first()).toBeVisible();
    await page.waitForTimeout(1500);

    expect(recorded.views).toHaveLength(1);
    const body = recorded.views[0].postDataJSON() as Record<string, unknown>;
    expect(body.user_id).toBe(AGENT.id);
    // The counter is a trigger on this insert now, so it inherits the throttle.
    expect(body.visitor_id).toBeTruthy();
    expect(recorded.viewRpcs).toHaveLength(0);
  });

  test('an agent with a page-builder page is counted on the page visitors see, once', async ({
    page,
  }) => {
    const recorded = fresh();
    await setupMocks(page, recorded, 'my-custom-page');

    await page.goto(`/${AGENT.username}`);
    await expect(page).toHaveURL(/\/p\/my-custom-page/, { timeout: 20000 });
    await page.waitForTimeout(1500);

    // Exactly one: the profile page must not count the view it is about to
    // redirect away from, and the custom page must not be a blind spot.
    expect(recorded.views).toHaveLength(1);
    expect(recorded.viewRpcs).toHaveLength(0);
  });

  test('a Call tap is recorded against the agent', async ({ page }) => {
    const recorded = fresh();
    await setupMocks(page, recorded, null);

    await page.goto(`/${AGENT.username}`);
    await expect(page.getByText(AGENT.fullName).first()).toBeVisible();

    // tel: would navigate away, so intercept the scheme rather than following it.
    await page.route('tel:*', (route) => route.abort());
    await page
      .getByRole('button', { name: /^Call$/ })
      .first()
      .click();

    await expect.poll(() => recorded.events.length, { timeout: 10000 }).toBeGreaterThan(0);

    const bodies = recorded.events.map((r) => r.postDataJSON() as Record<string, unknown>);
    const call = bodies.find((b) => b.event_type === 'contact_call');
    expect(call, `expected a contact_call event, got ${JSON.stringify(bodies)}`).toBeTruthy();
    expect(call?.user_id).toBe(AGENT.id);
  });
});
