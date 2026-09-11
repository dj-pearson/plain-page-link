#!/usr/bin/env node
/**
 * What a visitor actually downloads to open a page.
 *
 * US-212. scripts/check-bundle-size.mjs weighs each chunk in isolation and
 * checks which ones are on the entry graph. Neither is the number a visitor
 * experiences, and the gap between them is where US-211 lived for a year: every
 * page fetched its own document, its stylesheet and every entry chunk TWICE —
 * a 70-90% overhead that no existing check could see, because every individual
 * chunk was within budget and the entry graph was correct.
 *
 * So this serves dist/ the way Cloudflare Pages does, opens each route in a real
 * browser, and counts.
 *
 * Two things make it faithful rather than merely indicative:
 *
 *   - The cache policy is READ from public/_headers, not copied. A route weight
 *     measured without `immutable` on /assets/* is fiction: the first run of the
 *     harness that found US-211 reported /pricing at 1914 KB purely because its
 *     own server sent no Cache-Control.
 *   - Service workers are ALLOWED. US-211's reload fired from the service
 *     worker's `controlling` event, so blocking them — the convenient thing to
 *     do in a test — hides exactly the defect this exists to catch.
 *
 * Usage: node scripts/check-route-weight.mjs [--update]
 *        --update prints the measured numbers in the shape of the table below.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.ROUTE_WEIGHT_PORT ?? 8099);

/**
 * Budgets, in kilobytes and requests, with headroom over what was measured when
 * this was written. They are ceilings, not targets: a change that needs one
 * raised should say why in the same commit.
 *
 * Measured 2026-09-11, after US-211:
 *     /          1232 KB / 36      /demo   1397 KB / 65
 *     /pricing   1035 KB / 28
 */
const ROUTES = [
  { path: '/', name: 'landing', maxKb: 1400, maxRequests: 45 },
  { path: '/demo', name: 'public profile', maxKb: 1600, maxRequests: 80 },
  { path: '/pricing', name: 'pricing', maxKb: 1200, maxRequests: 40 },
  { path: '/tools/instagram-bio-analyzer', name: 'bio analyzer', maxKb: 1600, maxRequests: 80 },
];

const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

/**
 * public/_headers, as ordered rules. Cloudflare Pages applies every matching
 * rule in file order and a later one wins for a header it repeats.
 */
export async function parseHeaders() {
  const source = await readFile(join(ROOT, 'public/_headers'), 'utf-8');
  const rules = [];
  let current = null;
  for (const line of source.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: {} };
      rules.push(current);
      continue;
    }
    const colon = line.indexOf(':');
    if (current && colon > -1) {
      current.headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return rules;
}

export function matches(pattern, path) {
  if (pattern === path) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

export function headersFor(rules, path) {
  const out = {};
  for (const rule of rules) {
    if (matches(rule.pattern, path)) Object.assign(out, rule.headers);
  }
  return out;
}

/** Serve dist/ the way Pages does: real files first, then the SPA fallback. */
async function serveDist(rules) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    let file = join(DIST, path);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    } catch {
      file = join(DIST, 'index.html');
    }
    if (!existsSync(file)) file = join(DIST, 'index.html');

    const declared = headersFor(rules, path);
    // Content-Type comes from the extension unless _headers overrides it.
    const type = CONTENT_TYPES[extname(file)] ?? 'application/octet-stream';
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': type, ...declared });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  return server;
}

async function measure(browser, route) {
  // Service workers ALLOWED on purpose — see the note at the top.
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();

  const seen = [];
  page.on('response', async (response) => {
    const url = new URL(response.url());
    if (url.hostname !== '127.0.0.1') return;
    let bytes = 0;
    try {
      bytes = (await response.body()).length;
    } catch {
      // A response with no retrievable body (a redirect, an aborted preload)
      // still counts as a request.
    }
    seen.push({ path: url.pathname, bytes });
  });

  await page.goto(`http://127.0.0.1:${PORT}${route.path}`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  // A service worker registers after load, and US-211's reload came after that.
  await page.waitForTimeout(2500);

  const counts = new Map();
  for (const entry of seen) counts.set(entry.path, (counts.get(entry.path) ?? 0) + 1);

  await context.close();
  return {
    kb: Math.round(seen.reduce((total, entry) => total + entry.bytes, 0) / 1024),
    requests: seen.length,
    repeated: [...counts.entries()].filter(([, n]) => n > 1),
  };
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[route-weight] dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  const rules = await parseHeaders();
  const assetPolicy = headersFor(rules, '/assets/index-abc123.js')['Cache-Control'];
  if (!assetPolicy?.includes('immutable')) {
    // Without this the numbers below are fiction, and quietly so.
    console.error(
      `[route-weight] public/_headers does not mark hashed assets immutable (got ${assetPolicy ?? 'nothing'}).`
    );
    process.exit(1);
  }

  const server = await serveDist(rules);
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
  const failures = [];
  const measured = [];

  try {
    for (const route of ROUTES) {
      const result = await measure(browser, route);
      measured.push({ route, result });

      const over = result.kb > route.maxKb || result.requests > route.maxRequests;
      const status = over || result.repeated.length ? 'FAIL' : ' ok ';
      console.log(
        `[route-weight] ${status} ${route.name.padEnd(16)} ${String(result.kb).padStart(5)} KB / ` +
          `${String(result.requests).padStart(3)} req   (budget ${route.maxKb} KB / ${route.maxRequests})`
      );

      if (over) {
        failures.push(
          `${route.name} (${route.path}): ${result.kb} KB / ${result.requests} requests, ` +
            `budget ${route.maxKb} KB / ${route.maxRequests}`
        );
      }
      if (result.repeated.length) {
        // The check that made US-211 obvious in one line.
        failures.push(
          `${route.name} (${route.path}) fetched ${result.repeated.length} URL(s) more than once: ` +
            result.repeated.map(([p, n]) => `${p} x${n}`).slice(0, 8).join(', ')
        );
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (process.argv.includes('--update')) {
    console.log('\nMeasured:');
    for (const { route, result } of measured) {
      console.log(`  ${route.path.padEnd(32)} ${result.kb} KB / ${result.requests}`);
    }
  }

  if (failures.length) {
    console.error('\n[route-weight] over budget:');
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      '\nA repeated URL is almost never a caching question — it means the page, or ' +
        'something it registers, is loading twice. See US-211.'
    );
    process.exit(1);
  }

  console.log(`[route-weight] OK — ${ROUTES.length} routes within budget, nothing fetched twice.`);
}

// Only run when invoked directly: src/route-weight.test.ts imports the parser
// above, and a header rule matched wrongly makes every number here fiction
// without changing anything visible.
if (process.argv[1] && process.argv[1].endsWith('check-route-weight.mjs')) {
  main().catch((error) => {
    console.error(`[route-weight] ${error.message}`);
    process.exit(1);
  });
}
