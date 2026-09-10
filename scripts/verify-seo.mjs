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
 * It also checks that the site links to what it advertises (US-165). A page can
 * have a perfect title, a self-referencing canonical and a sitemap entry, and
 * still be a page no crawler ever arrives at, because nothing on the site links
 * to it. Four pages were in exactly that state — including one built for a
 * named query cluster two stories earlier.
 *
 *   npm run verify:seo
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { auditPages, auditStructuredDataUrls } from './lib/seo-audit.mjs';
import { auditReachability, sitemapPaths } from './lib/link-graph.mjs';

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

console.log(
  `[verify-seo] ${pages.length} pages, each with its own title, description and canonical`
);

// The crawl graph. Separate from the per-page audit above because it is a
// property of the whole build: no single page can be inspected and found
// unreachable.
const sitemapPath = join(DIST, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  console.error('[verify-seo] dist/sitemap.xml not found. The prerender writes it; it did not.');
  process.exit(1);
}

const advertised = sitemapPaths(readFileSync(sitemapPath, 'utf8'));
const unreachable = auditReachability(pages, advertised);

if (unreachable.length > 0) {
  console.error(
    `\n[verify-seo] ${unreachable.length} of ${advertised.size} sitemap URLs are not ` +
      `part of the site's own link graph:\n`
  );
  for (const { route, problem } of unreachable) console.error(`  ${route}\n      - ${problem}`);
  console.error(
    '\n[verify-seo] Submitting a URL is a request; linking to it is what makes it part\n' +
      '             of the site. Link the page from somewhere a crawler reaches — the\n' +
      '             footer renders on every page — or take it out of the sitemap.\n' +
      '             Note that an inbound link from a noindex page does not count: those\n' +
      '             pages are unreachable themselves, which is how this went unnoticed.'
  );
  process.exit(1);
}

console.log(
  `[verify-seo] ${advertised.size} sitemap URLs, every one of them reachable from / by internal links`
);

// URLs asserted inside JSON-LD. Also a whole-build property: whether a URL is
// a page is a fact about the build, not about the page naming it (US-179).
const danglingUrls = auditStructuredDataUrls(pages, new Set(pages.map((p) => p.route)), {
  origin: ORIGIN,
});

if (danglingUrls.length > 0) {
  const byProblem = new Map();
  for (const { route, problem } of danglingUrls) {
    if (!byProblem.has(problem)) byProblem.set(problem, []);
    byProblem.get(problem).push(route);
  }
  console.error(`\n[verify-seo] structured data names ${byProblem.size} URL(s) with no page:\n`);
  for (const [problem, routes] of byProblem) {
    console.error(`  ${problem}`);
    console.error(`      on ${routes.length} page(s), e.g. ${routes.slice(0, 3).join(', ')}`);
  }
  console.error(
    '\n[verify-seo] A URL in structured data is an assertion that the URL is a thing.\n' +
      '             Point it at a page that exists, or drop the field — an absent\n' +
      '             field costs nothing and a wrong one is a claim Google checks.'
  );
  process.exit(1);
}

console.log('[verify-seo] every URL asserted in structured data resolves to a page');
