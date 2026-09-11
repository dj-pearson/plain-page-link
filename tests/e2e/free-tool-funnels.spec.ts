/**
 * US-210: the free tools' submit buttons did nothing, and said nothing.
 *
 * Both tools are multi-step forms whose required fields are registered on the
 * early steps, with the submit button on the last one. react-hook-form's
 * `handleSubmit` refuses to call the submit handler while any registered field
 * fails validation — and it renders each message inside the step that owns the
 * field, which by then is unmounted.
 *
 * So a visitor who skims through, clicking Next without filling anything,
 * reaches the final step and presses the button, and nothing happens. No error,
 * no toast, no console warning, no network request. Measured before the fix:
 * the bio analyzer advanced to "Step 3 of 3" and the listing generator to
 * "Step 4 of 4", both with zero error messages on the page.
 *
 * These are the lead-generation funnels — the whole point of the free tools is
 * capturing an email from an agent at the end of them.
 *
 * Nothing here is mocked: neither tool calls Supabase to produce its result,
 * which is what makes them cheap to hold to this.
 */

import { test, expect, type Page } from '@playwright/test';

/** Pre-seed consent so the banner does not sit over the controls. */
async function dismissCookieBanner(page: Page) {
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
}

/** The step indicator, e.g. "Step 2 of 3". */
async function currentStep(page: Page): Promise<string | null> {
  const body = await page.locator('body').innerText();
  return body.match(/Step \d+ of \d+/)?.[0] ?? null;
}

/**
 * Click Next until it stops advancing, filling nothing. Returns how far it got.
 *
 * This is the path a visitor takes when they want to see what the tool does
 * before committing to typing, and it is the path that was broken.
 */
async function skimForward(page: Page, limit = 6): Promise<number> {
  let advanced = 0;
  for (let attempt = 0; attempt < limit; attempt++) {
    const next = page.getByRole('button', { name: /^Next$/ }).first();
    if ((await next.count()) === 0) break;
    const before = await currentStep(page);
    await next.click();
    await page.waitForTimeout(400);
    if ((await currentStep(page)) === before) break;
    advanced++;
  }
  return advanced;
}

const TOOLS = [
  {
    name: 'Instagram bio analyzer',
    path: '/tools/instagram-bio-analyzer',
    firstStep: 'Step 1 of 3',
    // The first required field the skimmer will be stopped on. currentBio is on
    // step 1 and is filled below, so city is the one that bites.
    expectedError: /City is required/i,
    stopsOn: 'Step 2 of 3',
    async prepare(page: Page) {
      await page.locator('textarea').first().fill('Realtor in Austin TX. DM for listings.');
    },
  },
  {
    name: 'listing description generator',
    path: '/tools/listing-description-generator',
    firstStep: 'Step 1 of 4',
    expectedError: /Bedrooms is required/i,
    stopsOn: 'Step 1 of 4',
    async prepare(page: Page) {
      // The form is behind a call to action on this one.
      const start = page.getByRole('button', { name: /Generate My Listing Descriptions/i }).first();
      if (await start.count()) {
        await start.click();
        await page.waitForTimeout(700);
      }
    },
  },
];

test.describe('Free tool funnels', () => {
  for (const tool of TOOLS) {
    test(`${tool.name} stops a skimming visitor where the missing field is`, async ({ page }) => {
      await dismissCookieBanner(page);
      await page.goto(tool.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await tool.prepare(page);

      expect(await currentStep(page)).toBe(tool.firstStep);

      await skimForward(page);

      // Before US-210 this walked to the last step with nothing shown, and the
      // submit button there was inert.
      expect(await currentStep(page)).toBe(tool.stopsOn);
      await expect(page.getByText(tool.expectedError).first()).toBeVisible();
    });

    test(`${tool.name} never leaves the visitor on a dead submit button`, async ({ page }) => {
      await dismissCookieBanner(page);
      await page.goto(tool.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await tool.prepare(page);
      await skimForward(page);

      // The mirror of the above: if a submit button IS reachable, pressing it
      // must do something — leave the step, or say why not.
      const submit = page.locator('button[type="submit"]:visible').first();
      if ((await submit.count()) === 0) return;

      const before = await currentStep(page);
      const errorsBefore = await page.locator('.text-red-500, .text-destructive').count();
      await submit.click();
      await page.waitForTimeout(1200);

      const changed =
        (await currentStep(page)) !== before ||
        (await page.locator('.text-red-500, .text-destructive').count()) !== errorsBefore;
      expect(changed, 'pressing submit produced neither progress nor an error').toBe(true);
    });
  }
});
