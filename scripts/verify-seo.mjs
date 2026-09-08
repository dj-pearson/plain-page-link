#!/usr/bin/env node
/**
 * Fail the build when a prerendered page loses its own identity (US-150).
 *
 * Run after `npm run build`. Walks every index.html under dist/ and applies the
 * rules in lib/seo-audit.mjs: a page must render, must not be the 404, and must
 * carry a title, a description and a self-referencing canonical that no other
 * page shares.
 *
 * scripts/prerender.mts already refuses to write a page that fails most of
 * this, which is exactly why the check lives here too — it inspects the files
 * that are about to ship rather than trusting the process that produced them.
 * The bug it exists to prevent ran for a year: 44 URLs, one <title>, and
 * nothing anywhere comparing them.
 *
 *   npm run verify:seo
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { auditPages } from './lib/seo-audit.mjs';

const DIST = join(process.cwd(), 'dist');
const ORIGIN = (process.env.VITE_APP_URL || 'https://agentbio.net').trim();

if (!existsSync(DIST)) {
  console.error('[verify-seo] dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

/** Every index.html under dist/, as the route it answers. */
function collect(dir, pages = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collect(full, pages);
    } else if (entry === 'index.html') {
      const rel = relative(DIST, full).split(sep).slice(0, -1).join('/');
      pages.push({ route: rel ? `/${rel}` : '/', html: readFileSync(full, 'utf8') });
    }
  }
  return pages;
}

const pages = collect(DIST);

if (pages.length === 0) {
  console.error('[verify-seo] no index.html anywhere under dist/. Nothing was prerendered.');
  process.exit(1);
}

const problems = auditPages(pages, { origin: ORIGIN });

if (problems.length > 0) {
  const byRoute = new Map();
  for (const { route, problem } of problems) {
    if (!byRoute.has(route)) byRoute.set(route, []);
    byRoute.get(route).push(problem);
  }
  console.error(
    `[verify-seo] ${byRoute.size} of ${pages.length} pages would ship without a usable identity:\n`
  );
  for (const [route, list] of [...byRoute].sort()) {
    console.error(`  ${route}`);
    for (const problem of list) console.error(`      - ${problem}`);
  }
  console.error(
    '\n[verify-seo] Do not relax these rules to make a page pass. A page that cannot\n' +
      '             produce its own title, description and canonical is the defect.'
  );
  process.exit(1);
}

console.log(`[verify-seo] ${pages.length} pages, each with its own title, description and canonical`);
