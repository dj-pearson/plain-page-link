#!/usr/bin/env node
/* global process, console */
/**
 * What each agent dashboard route downloads on top of what is already loaded.
 *
 * US-535 (first slice of US-402). scripts/check-route-weight.mjs opens public
 * routes in a browser; it cannot open /dashboard/* without a login, so no
 * dashboard route had a budget. Rounds 6-12 cut Analytics (recharts, 107 KB),
 * Listings, Clients, Leads and Settings by hand, each measured with a one-off
 * script, and nothing stopped any of it coming back: one static import of a
 * dialog from a route file puts form-vendor or date-fns on first paint again,
 * and every check stays green.
 *
 * This needs no browser and no login. It reads the Vite manifest, takes the
 * static-import closure of a route chunk, subtracts what the visitor already
 * holds when that route renders — the entry closure and the DashboardLayout
 * closure (ui-vendor arrives with the layout, so every route paying for it is
 * not that route's cost) — and gzips the rest. The same number the US-395 /
 * US-412 / US-476 write-ups quote as "beyond layout".
 *
 * Routes are found by source path, through the entry's dynamic imports, not by
 * manifest key or file name. Rollup sometimes hoists shared modules into a
 * route chunk, and the route is then keyed `_Leads-<hash>.js` with no `src`
 * (it happened to Listings in US-412 and to Leads since); and two chunks can
 * share a name (the admin and agent Analytics pages both emit Analytics-*.js).
 *
 * The manifest is only written when BUILD_MANIFEST=true (vite.config.ts), so
 * the deployed site never publishes /.vite/manifest.json. CI's bundle-size job
 * sets it.
 *
 * Usage: node scripts/check-dashboard-weight.mjs [--update]
 *        BUNDLE_DIST=<dir> checks a build in another directory.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST_DIR = process.env.BUNDLE_DIST || join(process.cwd(), 'dist');
const MANIFEST = join(DIST_DIR, '.vite', 'manifest.json');
const LAYOUT_SRC = 'src/components/layout/DashboardLayout.tsx';

/**
 * Budgets in KB of gzipped JavaScript beyond entry + DashboardLayout. Ceilings
 * with roughly 15% headroom over what was measured, not targets. A change that
 * needs one raised should say why in the same commit; a change that cuts a
 * route well below its budget should lower it (`--update` prints the numbers).
 *
 * `beyond` names further routes whose closure is also already loaded — a dialog
 * that only opens from its route is measured beyond that route, which is the
 * cost of the first open (US-490).
 *
 * Measured 2026-11-08 (US-535), KB gzip beyond entry + layout:
 *   Overview 36.5     Listings 38.1     Leads 30.6        Clients 20.4
 *   OpenHouses 28.8   Profile 14.9      Theme 19.7        Links 15.2
 *   Testimonials 13.1 Analytics 47.3    Settings 15.5     Subscription 8.5
 *   ApiKeys 5.3       Team 9.6          DeleteAccount 3.6 Workflows 14.3
 *   WorkflowBuilder 16.8                LeadDetailModal 26.2 (beyond Leads)
 *   DashboardLayout itself: 48.9 beyond the entry (ui-vendor is most of it)
 */
export const DASHBOARD_ROUTES = [
  // What every dashboard route pays first; measured beyond the entry only.
  { src: LAYOUT_SRC, isLayout: true, maxKb: 54 },
  { src: 'src/pages/dashboard/Overview.tsx', maxKb: 42 },
  { src: 'src/pages/dashboard/Listings.tsx', maxKb: 44 },
  { src: 'src/pages/dashboard/Leads.tsx', maxKb: 35 },
  { src: 'src/pages/dashboard/Clients.tsx', maxKb: 24 },
  { src: 'src/pages/dashboard/OpenHouses.tsx', maxKb: 33 },
  { src: 'src/pages/dashboard/Profile.tsx', maxKb: 18 },
  { src: 'src/pages/dashboard/Theme.tsx', maxKb: 23 },
  { src: 'src/pages/dashboard/Links.tsx', maxKb: 18 },
  { src: 'src/pages/dashboard/Testimonials.tsx', maxKb: 15 },
  // The heaviest agent route: useLeadStats, date-fns and the CSV writer load
  // on open (US-535 nextSlices). Lower this when they move.
  { src: 'src/pages/dashboard/Analytics.tsx', maxKb: 54 },
  { src: 'src/pages/dashboard/Settings.tsx', maxKb: 18 },
  { src: 'src/pages/dashboard/SubscriptionPage.tsx', maxKb: 10 },
  { src: 'src/pages/dashboard/ApiKeysPage.tsx', maxKb: 7 },
  { src: 'src/pages/dashboard/TeamPage.tsx', maxKb: 11 },
  { src: 'src/pages/dashboard/DeleteAccount.tsx', maxKb: 5 },
  { src: 'src/pages/dashboard/workflows/WorkflowsListPage.tsx', maxKb: 17 },
  { src: 'src/pages/dashboard/workflows/WorkflowBuilderPage.tsx', maxKb: 20 },
  {
    src: 'src/components/leads/LeadDetailModal.tsx',
    beyond: ['src/pages/dashboard/Leads.tsx'],
    maxKb: 30,
  },
];

/**
 * Vendor chunks no dashboard route may reach statically. form-vendor is
 * allowed only where a form is on first paint; list a route under `allow` to
 * say so. Admin screens are not in DASHBOARD_ROUTES, so recharts there is fine.
 */
export const ROUTE_MUST_NOT_INCLUDE = {
  'charts-vendor': {
    why: 'recharts. The agent Analytics chart is plain SVG since US-395.',
    allow: [],
  },
  'three-vendor': { why: 'Three.js. No dashboard route renders 3D on open.', allow: [] },
  'markdown-vendor': { why: 'react-markdown. Blog rendering only.', allow: [] },
  // US-412, US-431, US-498: every dashboard form is a dialog or section that
  // loads when it opens. None of the routes above reaches form-vendor today.
  'form-vendor': {
    why: 'react-hook-form + zod (23 KB gzip). Forms load when their dialog opens.',
    allow: [],
  },
};

/** The manifest key of the build's HTML entry. */
export function entryKey(manifest) {
  const key = Object.keys(manifest).find((k) => manifest[k].isEntry);
  if (!key) throw new Error('manifest has no isEntry chunk');
  return key;
}

/**
 * The manifest key for a source module that is loaded with import().
 *
 * Exact key first. Otherwise Rollup turned the route into a shared chunk keyed
 * `_<Name>-<hash>.js`; look for it among the dynamic imports of every chunk
 * (normally the entry, App.tsx) by `name`, and refuse to guess between two.
 */
export function resolveKey(manifest, src) {
  if (manifest[src]) return src;
  const name = basename(src, extname(src));
  const candidates = new Set();
  for (const chunk of Object.values(manifest)) {
    for (const key of chunk.dynamicImports ?? []) {
      if (manifest[key]?.name === name && !manifest[key].src) candidates.add(key);
    }
  }
  if (candidates.size === 1) return [...candidates][0];
  if (candidates.size > 1) {
    throw new Error(`${src}: ${candidates.size} dynamic chunks named ${name} (${[...candidates].join(', ')})`);
  }
  throw new Error(`${src}: not in the manifest and no dynamically imported chunk is named ${name}`);
}

/** Every manifest key statically reachable from `key`, `key` included. */
export function staticClosure(manifest, key) {
  const seen = new Set();
  const queue = [key];
  while (queue.length) {
    const next = queue.pop();
    if (seen.has(next)) continue;
    seen.add(next);
    for (const imported of manifest[next]?.imports ?? []) queue.push(imported);
  }
  return seen;
}

/**
 * Output files `key` adds on top of the closures of `baseKeys`, as
 * [{ file, bytes }] sorted heaviest first. `sizeOf(file)` returns gzipped bytes.
 */
export function weighBeyond(manifest, key, baseKeys, sizeOf) {
  const loaded = new Set();
  for (const base of baseKeys) {
    for (const k of staticClosure(manifest, base)) loaded.add(manifest[k].file);
  }
  const files = new Set();
  for (const k of staticClosure(manifest, key)) {
    const file = manifest[k].file;
    if (!loaded.has(file)) files.add(file);
  }
  return [...files]
    .map((file) => ({ file, bytes: sizeOf(file) }))
    .sort((a, b) => b.bytes - a.bytes);
}

/** Vendor prefixes from `banned` that appear in `files`, with the offending file. */
export function bannedIn(files, banned, src) {
  const hits = [];
  for (const [prefix, rule] of Object.entries(banned)) {
    if (rule.allow.includes(src)) continue;
    const hit = files.find((f) => basename(f).startsWith(`${prefix}-`));
    if (hit) hits.push({ prefix, file: hit, why: rule.why });
  }
  return hits;
}

const kb = (bytes) => (bytes / 1024).toFixed(1);

function main() {
  if (!existsSync(MANIFEST)) {
    console.error(
      `[dashboard-weight] ${MANIFEST} not found. Build with BUILD_MANIFEST=true ` +
        '(npm run build sets nothing by default, so the deployed site has no manifest).'
    );
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const gz = new Map();
  const sizeOf = (file) => {
    if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(join(DIST_DIR, file))).length);
    return gz.get(file);
  };

  const entry = entryKey(manifest);
  const layout = resolveKey(manifest, LAYOUT_SRC);
  const failures = [];
  const measured = [];

  for (const route of DASHBOARD_ROUTES) {
    const key = resolveKey(manifest, route.src);
    const base = [entry, ...(route.isLayout ? [] : [layout]), ...(route.beyond ?? []).map((src) => resolveKey(manifest, src))];
    const files = weighBeyond(manifest, key, base, sizeOf).filter((f) => f.file.endsWith('.js'));
    const bytes = files.reduce((total, f) => total + f.bytes, 0);
    const label = basename(route.src, extname(route.src));
    measured.push({ label, bytes });

    const over = bytes > route.maxKb * 1024;
    const banned = bannedIn(
      files.map((f) => f.file),
      ROUTE_MUST_NOT_INCLUDE,
      route.src
    );
    console.log(
      `[dashboard-weight] ${over || banned.length ? 'FAIL' : ' ok '} ${label.padEnd(22)} ` +
        `${kb(bytes).padStart(6)} KB gzip   (budget ${route.maxKb} KB)`
    );
    if (over) {
      const top = files
        .slice(0, 6)
        .map((f) => `${basename(f.file)} ${kb(f.bytes)}`)
        .join(', ');
      failures.push(`${label}: ${kb(bytes)} KB, over its ${route.maxKb} KB budget. Heaviest: ${top}`);
    }
    for (const hit of banned) {
      failures.push(`${label} statically reaches ${basename(hit.file)}: ${hit.why}`);
    }
  }

  if (process.argv.includes('--update')) {
    console.log('\nMeasured (KB gzip beyond entry + layout):');
    for (const { label, bytes } of measured) console.log(`  ${label.padEnd(22)} ${kb(bytes)}`);
  }

  if (failures.length) {
    console.error('\n[dashboard-weight] FAILED:');
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      '\nUsually a dialog, tab or panel that is closed on first render was imported ' +
        'statically. Load it when it opens (useMountOnFirstOpen + LazyModal). If the ' +
        'weight is genuinely needed on first paint, raise the budget in this file and say why.'
    );
    process.exit(1);
  }
  console.log(`[dashboard-weight] OK — ${DASHBOARD_ROUTES.length} dashboard chunks within budget.`);
}

if (process.argv[1] && process.argv[1].endsWith('check-dashboard-weight.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(`[dashboard-weight] ${error.message}`);
    process.exit(1);
  }
}
