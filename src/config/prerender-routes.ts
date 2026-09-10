/**
 * The one list of public routes that get rendered to real HTML at build time
 * (US-147).
 *
 * Before this existed, `public/_redirects` was `/* /index.html 200` and nothing
 * prerendered, so all 44 sitemap URLs answered with the same shell and the same
 * single hardcoded <title> from index.html. The per-page tags were correct but
 * lived in react-helmet-async, which means they only existed after hydration and
 * a crawler's first pass never saw them. The Search Console export of 2026-09-08
 * shows the cost: the 23 /for/{city} pages, the 5 /features/* pages and the 3
 * /vs/* pages took ZERO impressions across the full 16 months despite being in
 * the sitemap.
 *
 * This module is deliberately free of React and of any `@/` import beyond the
 * plain location data, so `scripts/prerender.mts` and the sitemap generator can
 * both import it from node without pulling in the app.
 *
 * Two rules keep it honest:
 *   - A route listed here MUST render meaningful HTML with no session and no
 *     database round-trip. Anything data-backed belongs to US-148.
 *   - Adding a route here is what puts it in front of Google. That is a
 *     decision, not a formality.
 */

import { LOCATIONS } from '../data/locations';

export interface PrerenderRoute {
  /** Absolute path as React Router sees it, always leading-slash, never trailing. */
  path: string;
  /**
   * Why this route is in the list. Read by nobody at runtime; it exists so the
   * next person can tell a marketing page from a legal obligation.
   */
  kind:
    | 'marketing'
    | 'feature'
    | 'comparison'
    | 'tool'
    | 'location'
    | 'legal'
    | 'blog'
    | 'article'
    | 'auth';
  /**
   * Set false for a route that should be rendered and crawlable but kept out of
   * sitemap.xml — a page carrying a noindex directive, for instance. Omitted
   * means listed. US-151 and US-153 are the first users.
   */
  sitemap?: false;
}

/**
 * Routes whose content is entirely in the bundle.
 *
 * Deliberately absent, each for a reason:
 *   - /blog, /blog/:slug, /blog/category/:category — the body comes from the
 *     `articles` table and has to be fetched at build time (US-148).
 *   - (/auth/* used to be listed here; US-151 added it below.)
 *   - /dashboard/*, /admin/*, /onboarding/* — behind a session; there is no
 *     meaningful anonymous render.
 *   - /:username, /p/:slug, /:username/review — one page per tenant. These are
 *     served by the existing Cloudflare Pages Function in functions/[username].ts
 *     (US-114), which injects real tags per profile at request time.
 *   - /features (no trailing segment) — has no route in App.tsx at all. It is in
 *     the sitemap and returns the 404 page under a 200. US-149 removes it.
 */
export const STATIC_ROUTES: readonly PrerenderRoute[] = [
  { path: '/', kind: 'marketing' },
  { path: '/pricing', kind: 'marketing' },
  // US-158. What a roundup author needs in order to include the product.
  { path: '/press', kind: 'marketing' },
  { path: '/for-real-estate-agents', kind: 'marketing' },
  { path: '/instagram-bio-for-realtors', kind: 'marketing' },

  { path: '/features/property-listings', kind: 'feature' },
  { path: '/features/lead-capture', kind: 'feature' },
  { path: '/features/calendar-booking', kind: 'feature' },
  { path: '/features/testimonials', kind: 'feature' },
  { path: '/features/analytics', kind: 'feature' },

  { path: '/vs/linktree', kind: 'comparison' },
  { path: '/vs/beacons', kind: 'comparison' },
  { path: '/vs/later', kind: 'comparison' },

  // US-167. The hub the tool breadcrumbs had been claiming existed.
  { path: '/tools', kind: 'tool' },
  { path: '/tools/instagram-bio-analyzer', kind: 'tool' },
  { path: '/tools/listing-description-generator', kind: 'tool' },
  // US-155. The page that serves the ~180-impression "real estate agent bio"
  // cluster the homepage stopped chasing in US-152.
  { path: '/tools/real-estate-agent-bio-generator', kind: 'tool' },

  { path: '/privacy', kind: 'legal' },
  { path: '/terms', kind: 'legal' },
  { path: '/dmca', kind: 'legal' },
  { path: '/acceptable-use', kind: 'legal' },
  { path: '/cookies', kind: 'legal' },
  { path: '/privacy-choices', kind: 'legal' },
  { path: '/accessibility', kind: 'legal' },

  // Prerendered so the noindex directive is in the served HTML rather than only
  // after hydration, and kept out of the sitemap. robots.txt no longer
  // Disallows /auth/, because a blocked page is one Google can index from links
  // alone while never being allowed to read the directive that would stop it
  // (US-151). public/_headers sends X-Robots-Tag for the same paths.
  { path: '/auth/login', kind: 'auth', sitemap: false },
  { path: '/auth/register', kind: 'auth', sitemap: false },
  // /auth/callback is NOT prerendered. Its whole job is to consume an OAuth
  // code and redirect, so with no code it lands on /auth/login and the
  // snapshot is the login page under the callback's URL — caught by
  // `npm run verify:seo` complaining the two shared a title. The
  // X-Robots-Tag in public/_headers keeps it out of the index without
  // needing a file. Do not add it back.
  { path: '/auth/forgot-password', kind: 'auth', sitemap: false },
  { path: '/auth/mfa', kind: 'auth', sitemap: false },
  { path: '/auth/reset-password', kind: 'auth', sitemap: false },
  { path: '/auth/sso/callback', kind: 'auth', sitemap: false },
] as const;

/**
 * One route per entry in LOCATIONS, so the city pages cannot drift out of step
 * with the data that generates them the way the hand-edited sitemap did.
 */
export function locationRoutes(): PrerenderRoute[] {
  return LOCATIONS.map((location) => ({
    path: `/for/${location.slug}`,
    kind: 'location' as const,
    // Indexing is opt-in per location (US-153). A page that is not indexable
    // still renders and is still crawlable — that is how the noindex directive
    // reaches Google at all — it just does not get advertised in the sitemap.
    // Flipping `indexable` in src/data/locations.ts moves it here automatically.
    ...(location.indexable ? {} : { sitemap: false as const }),
  }));
}

/**
 * The blog, which only exists once the `articles` rows are in hand (US-148).
 *
 * Kept here rather than in the prerender script so the sitemap generator reads
 * article URLs from the same function that produced the files — the hand-edited
 * sitemap listing no articles at all is the failure this prevents.
 */
export function blogRoutes(slugs: string[], categorySlugs: string[]): PrerenderRoute[] {
  return [
    { path: '/blog', kind: 'blog' },
    ...categorySlugs.map((c) => ({ path: `/blog/category/${c}`, kind: 'blog' as const })),
    ...slugs.map((s) => ({ path: `/blog/${s}`, kind: 'article' as const })),
  ];
}

/** Every route the build renders to HTML. */
export function allPrerenderRoutes(blog: PrerenderRoute[] = []): PrerenderRoute[] {
  return [...STATIC_ROUTES, ...locationRoutes(), ...blog];
}

/**
 * Where a route's HTML lands under dist/.
 *
 * '/' is dist/index.html; everything else is dist/<path>/index.html, which is
 * what Cloudflare Pages serves for the extensionless URL and what keeps the
 * canonical free of a .html suffix.
 */
export function outputPathForRoute(routePath: string): string {
  if (routePath === '/') return 'index.html';
  return `${routePath.replace(/^\//, '')}/index.html`;
}
