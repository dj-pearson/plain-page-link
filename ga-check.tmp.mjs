import { chromium } from '@playwright/test';

const url = process.argv[2];
const expect = process.argv[3]; // 'loaded' or 'absent'

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage();
// Grant analytics consent before the page scripts run.
await page.addInitScript(() => {
  window.localStorage.setItem(
    'cookie_consent_v1',
    JSON.stringify({ analytics: true, marketing: false, necessary: true, version: 1 })
  );
});
const requested = [];
await page.route('**://www.googletagmanager.com/**', (route) => {
  requested.push(route.request().url());
  return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const injected = await page.evaluate(() =>
  Array.from(document.querySelectorAll('script[src*="googletagmanager"]')).map((s) => s.src)
);
console.log('meta content   :', await page.evaluate(() => document.querySelector('meta[name="ga-measurement-id"]')?.content));
console.log('injected gtag  :', injected);
console.log('requested gtag :', requested);
console.log('dataLayer len  :', await page.evaluate(() => (window.dataLayer || []).length));
await browser.close();
