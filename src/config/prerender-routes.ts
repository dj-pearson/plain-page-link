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
  kind: 'marketing' | 'feature' | 'comparison' | 'tool' | 'location' | 'legal';
}

/**
 * Routes whose content is entirely in the bundle.
 *
 * Deliberately absent, each for a reason:
 *   - /blog, /blog/:slug, /blog/category/:category — the body comes from the
 *     `articles` table and has to be fetched at build time (US-148).
 *   - /auth/* — prerendered with a noindex directive by US-151, not here.
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

  { path: '/tools/instagram-bio-analyzer', kind: 'tool' },
  { path: '/tools/listing-description-generator', kind: 'tool' },

  { path: '/privacy', kind: 'legal' },
  { path: '/terms', kind: 'legal' },
  { path: '/dmca', kind: 'legal' },
  { path: '/acceptable-use', kind: 'legal' },
  { path: '/cookies', kind: 'legal' },
  { path: '/privacy-choices', kind: 'legal' },
  { path: '/accessibility', kind: 'legal' },
] as const;

/**
 * One route per entry in LOCATIONS, so the city pages cannot drift out of step
 * with the data that generates them the way the hand-edited sitemap did.
 */
export function locationRoutes(): PrerenderRoute[] {
  return LOCATIONS.map((location) => ({
    path: `/for/${location.slug}`,
    kind: 'location' as const,
  }));
}

/** Every route the build renders to HTML. */
export function allPrerenderRoutes(): PrerenderRoute[] {
  return [...STATIC_ROUTES, ...locationRoutes()];
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
