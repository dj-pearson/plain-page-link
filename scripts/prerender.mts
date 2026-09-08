#!/usr/bin/env node
/**
 * Render every public route to real HTML at build time (US-147).
 *
 * The defect this closes: agentbio.net is a client-rendered SPA with no
 * prerender step, `public/_redirects` is `/* /index.html 200`, and index.html
 * hardcodes ONE <title> for the whole site. Every URL therefore answered a
 * crawler with an empty <div id="root"> and a title shared with 43 other pages.
 * SEOHead / PageSEO / ArticleSEO already emit the correct tags — they just emit
 * them in React, so the first crawl never saw them. Nothing in this script
 * changes those components; it changes when their output reaches the wire.
 *
 * How it works: serve the finished dist/ with Vite's own preview server, drive
 * it with the Playwright already in devDependencies, and snapshot each route's
 * DOM once React has painted and react-helmet-async has written the head. The
 * app mounts with ReactDOM.createRoot (see src/main.tsx), not hydrateRoot, so a
 * browser discards this markup and re-renders from scratch — there is no
 * hydration contract to break, and no mismatch to warn about. The snapshot
 * exists for the readers that never run the bundle at all.
 *
 * Every page is rendered before anything is written, so the script never serves
 * its own output back to itself mid-run.
 *
 *   npm run prerender          # after `vite build`
 *   npm run build              # does both
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { preview, type PreviewServer } from 'vite';

import {
  allPrerenderRoutes,
  blogRoutes,
  outputPathForRoute,
  type PrerenderRoute,
} from '../src/config/prerender-routes';
import { categorySlugs, loadArticles, type Article } from './lib/articles.mts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const DIST = join(root, 'dist');

const PORT = Number(process.env.PRERENDER_PORT || 4319);

/**
 * Where the output will actually be served from.
 *
 * This is not cosmetic. getCanonicalUrl() is built on getSafeOrigin(), which in
 * a browser returns window.location.origin — and during prerendering that is
 * the preview server. Snapshotting naively bakes
 * `<link rel="canonical" href="http://127.0.0.1:4319/pricing">` into every
 * page, which tells Google the real URL is a duplicate of a machine it cannot
 * reach. The origin is rewritten out of every snapshot before it is written.
 *
 * Mirrors FALLBACK_APP_URL in src/lib/utils.ts.
 */
const SITE_ORIGIN = (process.env.VITE_APP_URL || 'https://agentbio.net').trim().replace(/\/+$/, '');
const PREVIEW_ORIGIN = `http://127.0.0.1:${PORT}`;
/** Rendering 44 routes serially is the slow part of CI; four at a time is not. */
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 4);
const NAV_TIMEOUT_MS = 30_000;
/** After React paints, give lazy chunks and helmet a beat to settle. */
const SETTLE_MS = 350;
/** A route rendering less than this into #root has not really rendered. */
const MIN_ROOT_HTML = 500;

interface Rendered {
  route: PrerenderRoute;
  html: string;
  title: string;
  problems: string[];
}

/**
 * The title baked into index.html. Every route that still carries it after
 * rendering has failed to set its own, which is precisely the bug.
 */
async function indexDefaultTitle(): Promise<string> {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : '';
}

/**
 * Take the DOM as the browser has it, minus the things that should not be
 * frozen into a static file.
 *
 * The duplicate-tag cleanup matters: index.html ships its own
 * <meta name="description"> and og tags, and react-helmet-async adds its own
 * marked with data-rh instead of replacing them. Serialised naively, every page
 * would carry two descriptions and two og:titles, and which one a crawler
 * believes is not worth finding out.
 */
interface Snapshot {
  html: string;
  title: string;
  rootLength: number;
  h1: string;
  hasCanonical: boolean;
  hasDescription: boolean;
}

/**
 * Runs inside the page, as source rather than as a function reference.
 *
 * tsx transpiles this module with esbuild's keepNames helper, which rewrites a
 * passed-in function to reference a `__name` that exists in node and not in the
 * browser — `ReferenceError: __name is not defined`, 44 times. An expression
 * string is handed to the page verbatim and cannot pick up a build helper.
 */
const SERIALISE_EXPR = `(() => {
  const doc = document;

  const dedupe = (selector, keyOf) => {
    const managed = new Set();
    for (const el of doc.head.querySelectorAll(selector)) {
      if (el.hasAttribute('data-rh')) managed.add(keyOf(el));
    }
    for (const el of Array.from(doc.head.querySelectorAll(selector))) {
      if (el.hasAttribute('data-rh')) continue;
      if (managed.has(keyOf(el))) el.remove();
    }
  };

  dedupe('meta[name]', (el) => 'name:' + el.getAttribute('name'));
  dedupe('meta[property]', (el) => 'prop:' + el.getAttribute('property'));
  dedupe('link[rel="canonical"]', () => 'canonical');

  const rootEl = doc.getElementById('root');
  const h1 = doc.querySelector('h1');
  return {
    html: '<!DOCTYPE html>\\n' + doc.documentElement.outerHTML,
    title: doc.title || '',
    rootLength: rootEl ? rootEl.innerHTML.length : 0,
    h1: (h1 && h1.textContent ? h1.textContent : '').trim(),
    hasCanonical: !!doc.head.querySelector('link[rel="canonical"]'),
    hasDescription: !!doc.head.querySelector('meta[name="description"]'),
  };
})()`;

async function renderRoute(
  page: Page,
  route: PrerenderRoute,
  defaultTitle: string
): Promise<Rendered> {
  const problems: string[] = [];
  const url = `http://127.0.0.1:${PORT}${route.path}`;

  // A page that throws during boot renders nothing, and "#root is empty" is a
  // useless thing to be told 44 times. Keep the actual exception.
  const bootErrors: string[] = [];
  const onPageError = (error: Error) => bootErrors.push(error.message);
  page.on('pageerror', onPageError);

  try {
    await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });

    // React has mounted when #root has content. Lazy routes arrive a tick later.
    await page
      .waitForFunction(
        () => {
          const el = document.getElementById('root');
          return !!el && el.childElementCount > 0;
        },
        { timeout: NAV_TIMEOUT_MS }
      )
      .catch(() => problems.push('#root never received any children'));

    // react-helmet-async marks the tags it owns. Its absence is not fatal on its
    // own — the title check below is the one that decides — but waiting for it
    // removes a race on pages that do set tags.
    await page
      .waitForSelector('head [data-rh]', { timeout: 5_000, state: 'attached' })
      .catch(() => {});

    await page.waitForTimeout(SETTLE_MS);

    const result = (await page.evaluate(SERIALISE_EXPR)) as Snapshot;

    if (result.rootLength < MIN_ROOT_HTML) {
      problems.push(`#root rendered only ${result.rootLength} chars of HTML`);
    }
    if (result.h1 === '404') {
      problems.push('rendered the 404 page — this route does not exist in App.tsx');
    }
    if (!result.title) {
      problems.push('no <title>');
    } else if (route.path !== '/' && result.title === defaultTitle) {
      problems.push(`still carries index.html's default title (${JSON.stringify(defaultTitle)})`);
    }
    if (!result.hasDescription) {
      problems.push('no <meta name="description">');
    }
    if (!result.hasCanonical) {
      problems.push('no <link rel="canonical">');
    }

    // An exception during boot explains every other symptom; lead with it.
    if (bootErrors.length > 0) {
      problems.unshift(...bootErrors.map((m) => `threw during boot: ${m}`));
    }

    // Every absolute URL the app produced points at the preview server.
    // Canonicals, og:url and the url fields inside JSON-LD all have to move.
    const html = result.html.split(PREVIEW_ORIGIN).join(SITE_ORIGIN);
    if (html.includes('127.0.0.1') || html.includes('localhost')) {
      problems.push('a preview-server URL survived into the output');
    }

    return { route, html, title: result.title, problems };
  } finally {
    page.off('pageerror', onPageError);
  }
}

/**
 * Answer the app's own `articles` queries with the rows fetched at build time.
 *
 * The alternative was to teach BlogArticle.tsx about a preloaded cache, which
 * would mean changing the component to suit the build. This way the page runs
 * exactly the code it runs in production — same query, same TanStack Query
 * states, same ArticleSEO output — and only the transport is short-circuited.
 *
 * PostgREST's contract has to be honoured for supabase-js to be satisfied:
 * `.single()` sets Accept: application/vnd.pgrst.object+json and expects a bare
 * object plus a 406 when the row count is not exactly one, while an ordinary
 * select expects an array.
 */
async function interceptArticles(context: BrowserContext, articles: Article[]): Promise<void> {
  await context.route('**/rest/v1/articles*', async (route) => {
    const request = route.request();

    // BlogArticle increments view_count on mount. There is no view to count
    // here, and the anon role cannot write anyway.
    if (request.method() !== 'GET') {
      return route.fulfill({ status: 204, body: '' });
    }

    const url = new URL(request.url());
    let rows = articles.filter((a) => a.status === 'published');

    const slug = url.searchParams.get('slug');
    if (slug?.startsWith('eq.')) {
      const wanted = decodeURIComponent(slug.slice(3));
      rows = rows.filter((a) => a.slug === wanted);
    }

    const order = url.searchParams.get('order');
    if (order?.startsWith('published_at.')) {
      const dir = order.endsWith('.asc') ? 1 : -1;
      rows = [...rows].sort(
        (a, b) =>
          dir * ((a.published_at || '').localeCompare(b.published_at || ''))
      );
    }

    const wantsObject = (request.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (wantsObject) {
      if (rows.length !== 1) {
        return route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'PGRST116',
            message: `JSON object requested, ${rows.length} rows returned`,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify(rows[0]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(rows),
    });
  });
}

/** Render `routes` with at most `CONCURRENCY` pages open at once. */
async function renderAll(
  browser: Browser,
  routes: PrerenderRoute[],
  defaultTitle: string,
  articles: Article[]
): Promise<Rendered[]> {
  const context = await browser.newContext({
    // A crawler is what this output is for; render as one so any UA-conditional
    // behaviour resolves the same way it will in production.
    userAgent:
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) AgentBio-Prerender',
    // index.html's connect-src names the production API hosts. During a build
    // VITE_SUPABASE_URL may be a placeholder or a stub, and the browser would
    // block the article fetch before Playwright ever saw it — so the route
    // handler below would never fire and every post would render empty. This
    // affects the prerender context only; the shipped CSP is untouched.
    bypassCSP: true,
  });

  // The SW would cache the pre-prerender shell and serve it to later routes in
  // the same context. Analytics and Sentry are noise the snapshot does not need.
  await context.route('**/sw.js', (r) => r.abort());
  await context.route('**/scripts/analytics.js', (r) => r.abort());
  await context.route('https://www.googletagmanager.com/**', (r) => r.abort());
  await context.route('https://www.google-analytics.com/**', (r) => r.abort());
  await interceptArticles(context, articles);

  const results: Rendered[] = new Array(routes.length);
  let cursor = 0;

  const worker = async () => {
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT_MS);
    try {
      for (;;) {
        const i = cursor++;
        if (i >= routes.length) break;
        const route = routes[i];
        try {
          results[i] = await renderRoute(page, route, defaultTitle);
        } catch (error) {
          results[i] = {
            route,
            html: '',
            title: '',
            problems: [`threw while rendering: ${(error as Error).message}`],
          };
        }
        const r = results[i];
        const mark = r.problems.length ? '✗' : '✓';
        process.stdout.write(`  ${mark} ${route.path}\n`);
      }
    } finally {
      await page.close();
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, routes.length) }, () => worker()));
  await context.close();
  return results;
}

/**
 * Confirm the emitted layout is one Cloudflare Pages will actually serve, and
 * that `_redirects` cannot shadow it.
 *
 * This has to be reasoned about rather than executed, because Pages is not
 * running here (wrangler is not a dependency and `vite preview` answers a
 * different question — its SPA fallback fires before directory-index
 * resolution, so it returns dist/index.html for /pricing even when
 * dist/pricing/index.html exists. That is a preview-server behaviour, not a
 * Cloudflare one).
 *
 * Pages resolves a GET in this order:
 *   1. a Function whose route matches
 *   2. a static asset: exact path, then <path>/index.html, then <path>.html
 *   3. the rules in _redirects
 *
 * The load-bearing claim is that step 2 precedes step 3, and it is not a guess:
 * `public/_redirects` is `/* /index.html 200`, and if a splat rewrite outranked
 * static assets then every SPA on Pages would answer its own /assets/*.js
 * requests with index.html and no Pages-hosted SPA would work at all. Assets
 * win, so dist/pricing/index.html is what /pricing returns.
 *
 * What is checked here is therefore our half of the contract: that a file
 * exists exactly where step 2 looks for it, and that no author has added a
 * redirect rule that would intercept a prerendered path before step 2 is
 * reached.
 */
async function verifyServedLayout(results: Rendered[]): Promise<void> {
  const problems: string[] = [];

  for (const { route } of results) {
    // Where Pages' step-2 lookup lands for this URL.
    const resolved =
      route.path === '/' ? 'index.html' : `${route.path.replace(/^\//, '')}/index.html`;
    if (!existsSync(join(DIST, resolved))) {
      problems.push(`${route.path} -> dist/${resolved} is missing`);
    }
  }

  const redirectsPath = join(root, 'public', '_redirects');
  if (existsSync(redirectsPath)) {
    const prerendered = new Set(results.map((r) => r.route.path));
    const lines = (await readFile(redirectsPath, 'utf8'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    for (const line of lines) {
      const [from] = line.split(/\s+/);
      if (!from || from === '/*') continue; // the SPA fallback, which step 2 outranks
      // A concrete rule for a path we prerender would be consulted at step 3,
      // but only if step 2 missed — except for a rule that is itself a redirect
      // (3xx), which Pages honours regardless. Flag the overlap either way.
      if (prerendered.has(from)) {
        problems.push(`_redirects has a rule for ${from}, which is also prerendered: "${line}"`);
      }
    }
  }

  if (problems.length > 0) {
    console.error('\n[prerender] the output would not be served as intended:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log('[prerender] layout check: every route resolves to its own file, nothing shadows it');
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[prerender] dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  // Throws rather than shipping an empty blog; see scripts/lib/articles.mts.
  //
  // ALLOW_NO_ARTICLES exists for builds that verify the bundle and do not ship
  // it — CI's build and bundle-size jobs, which have no database credentials
  // and no reason to. It omits the blog routes entirely rather than emitting
  // empty ones, because an empty /blog/<slug> in the index is worse than none.
  // A deploy must never set it: without articles the deploy would quietly drop
  // every post from the site.
  let articles: Article[] = [];
  let blog: PrerenderRoute[] = [];
  if (process.env.PRERENDER_ALLOW_NO_ARTICLES === '1') {
    console.warn(
      '[prerender] PRERENDER_ALLOW_NO_ARTICLES=1 — skipping the blog entirely.\n' +
        '            Correct for a verification build, wrong for a deploy.'
    );
  } else {
    const loaded = await loadArticles();
    articles = loaded.articles;
    blog = blogRoutes(
      articles.map((a) => a.slug),
      categorySlugs(articles)
    );
    console.log(`[prerender] ${articles.length} published articles (from ${loaded.source})`);
  }

  const routes = allPrerenderRoutes(blog);
  const defaultTitle = await indexDefaultTitle();
  console.log(`[prerender] ${routes.length} routes, ${CONCURRENCY} at a time`);

  let server: PreviewServer | undefined;
  let browser: Browser | undefined;
  let results: Rendered[];

  try {
    server = await preview({
      root,
      preview: { port: PORT, strictPort: true, host: '127.0.0.1', open: false },
      logLevel: 'warn',
    });
    browser = await chromium.launch();
    results = await renderAll(browser, routes, defaultTitle, articles);
  } finally {
    await browser?.close().catch(() => {});
    await server?.close().catch(() => {});
  }

  const failed = results.filter((r) => r.problems.length > 0);
  if (failed.length > 0) {
    console.error(`\n[prerender] ${failed.length} of ${results.length} routes did not render:`);
    for (const r of failed) {
      console.error(`  ${r.route.path}`);
      for (const p of r.problems) console.error(`      - ${p}`);
    }
    console.error(
      '\n[prerender] Nothing was written. A page that cannot render to HTML must not ship\n' +
        '            as a silently-empty file — that is the bug this script exists to catch.'
    );
    process.exit(1);
  }

  // Only now that every route is known good does anything touch dist/.
  for (const r of results) {
    const outPath = join(DIST, outputPathForRoute(r.route.path));
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, r.html, 'utf8');
  }

  console.log(`\n[prerender] wrote ${results.length} HTML files into dist/`);

  await verifyServedLayout(results);
}

main().catch((error) => {
  console.error('[prerender] failed:', error);
  process.exit(1);
});
