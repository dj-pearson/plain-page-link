/**
 * Marks an auth route noindex, with a title of its own (US-151).
 *
 * /auth/login took 114 impressions in the 16 months to 2026-09-08 and
 * /auth/register 42 — 156 impressions spent on pages nobody searching for a
 * link-in-bio tool wants to land on. None of the seven auth pages set any meta
 * at all, so every one of them inherited index.html's marketing title and
 * competed with the pages that sell the product.
 *
 * public/robots.txt already said `Disallow: /auth/`, which is why this could
 * not be fixed by adding a directive to the page: Disallow stops the crawl, so
 * Google indexes the URL from links alone and never fetches the document that
 * would tell it not to. Blocking harder makes it worse. US-151 removes the
 * Disallow so the crawler can read what this emits.
 *
 * Applied at the route rather than inside each page, so a new auth route gets
 * it by construction and the seven components stay untouched. public/_headers
 * additionally sends X-Robots-Tag for /auth/*, which covers any auth URL that
 * is never prerendered.
 */
import type { ReactNode } from 'react';
import { SEOHead } from '@/components/SEOHead';

interface AuthRouteSEOProps {
  /** Distinct per route: two pages sharing a title fails `npm run verify:seo`. */
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthRouteSEO = ({ title, description, children }: AuthRouteSEOProps) => (
  <>
    {/* No canonicalUrl: a page telling Google not to index it has no use for
        one, and scripts/lib/seo-audit.mjs exempts noindex pages from needing it. */}
    <SEOHead title={title} description={description} noindex />
    {children}
  </>
);

export default AuthRouteSEO;
