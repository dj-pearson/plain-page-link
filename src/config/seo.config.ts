/**
 * Centralized SEO Configuration
 * Site-wide constants for consistent SEO across all pages
 */

import { PRICING_PLANS } from './pricing-plans';
import { getConfiguredAppUrl } from '@/lib/utils';
import { ORGANIZATION_LOGO } from './og-image';
import { SAME_AS, X_HANDLE } from './social-profiles';

/**
 * The `priceValidUntil` for an AgentBio plan Offer: one year from `now`, as an
 * ISO date (US-502).
 *
 * Three schemas carried the literal '2026-12-31' — the homepage
 * ProfessionalService offer, every city page and the /pricing Product. From
 * 2027-01-01 that is a date in the past, and an Offer whose price has expired
 * is one Google stops showing a price for. Our prices have no end date, so the
 * honest value is a rolling one, the same rule Pricing.tsx already used for its
 * own offers. A prerendered page carries its build date plus a year.
 */
export function offerPriceValidUntil(now: Date = new Date()): string {
  const next = new Date(now.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export const SEO_CONFIG = {
  siteName: 'AgentBio',
  // From lib/utils, so a staging deploy that sets VITE_APP_URL does not emit
  // canonical tags and JSON-LD pointing at production (US-123).
  siteUrl: getConfiguredAppUrl(),
  defaultTitle: 'AgentBio - Real Estate Agent Bio Page Builder',
  defaultDescription:
    'Purpose-built link-in-bio for real estate agents. Showcase properties, capture leads, and book appointments from Instagram.',
  defaultImage: '/Cover.png',
  // Was '@agentbio'. The account this site links to is x.com/AgentBioApp,
  // so twitter:site named a different account on every page (US-178).
  twitterHandle: X_HANDLE,
  locale: 'en_US',
  themeColor: '#0ea5e9',

  // Organization info for schema
  organization: {
    name: 'AgentBio',
    legalName: 'AgentBio Intelligence',
    email: 'support@agentbio.net',
    foundingDate: '2024',
    slogan: 'Transform Instagram followers into qualified leads',
    logo: ORGANIZATION_LOGO.path,
    // Were 512x512, for a 946x436 file (US-178).
    logoWidth: ORGANIZATION_LOGO.width,
    logoHeight: ORGANIZATION_LOGO.height,
  },

  // Social links for schema. A third copy of the same six wrong accounts stood
  // here; @/config/social-profiles is the one list now (US-178).
  socialLinks: SAME_AS,

  // Default ratings
  // `ratings` removed (US-157). It held ratingValue '4.8' over reviewCount
  // '523' — the invented pair US-111 identified and stripped from the landing
  // page, still being read here by LocationTemplate and emitted on 31 built
  // pages. Real ratings come from real testimonials: see ReviewSchema.tsx and
  // FullProfilePage, which compute them from the testimonials table.

  // Pricing info
  pricing: {
    // Was '39', which is not a plan. Derived from PRICING_PLANS so it cannot
    // drift from what Stripe actually charges (US-157).
    startingPrice: String(
      PRICING_PLANS.filter((plan) => plan.price_monthly > 0)[0]?.price_monthly ?? 0
    ),
    currency: 'USD',
    // priceValidUntil was the literal '2026-12-31' here; use
    // offerPriceValidUntil() so it never falls into the past (US-502).
  },

  // Default keywords
  defaultKeywords: [
    'real estate agent bio page',
    'Instagram bio page for realtors',
    'real estate link in bio',
    'agent portfolio website',
    'real estate social media landing page',
  ],
} as const;

/*
 * PAGE_SEO_TEMPLATES, PRICING_TIERS, COMPARISON_DATA and SEO_STARTING_PRICE
 * were deleted in US-577. Nothing imported them, so the claims tests never
 * read them, yet they held plan claims: hard-coded Team and Enterprise prices,
 * no Starter plan, a feature list per tier that nothing checked, and an
 * AgentBio "rating: '4.8'" with no reviews behind it. Page metadata lives on
 * each page's SEOHead; plan facts come from PRICING_PLANS. src/dead-claim-exports.test.ts
 * fails if an export here loses its last importer.
 */

/**
 * The origin the site canonically lives at, whatever host served this response
 * (US-172).
 *
 * This was getSafeOrigin(), which in a browser is window.location.origin. Every
 * canonical, og:url and JSON-LD url on every marketing, feature, comparison,
 * tool, blog and legal page was therefore whatever host the visitor happened to
 * be on. On agentbio.net that is right by coincidence. Anywhere else it is a
 * page telling Google it is the original at an address that is not the site:
 *
 *   - Cloudflare Pages gives every branch a *.pages.dev preview URL serving the
 *     whole site. The prerendered HTML carries the right canonical, because
 *     prerender.mts rewrites its own preview origin out of every snapshot — but
 *     the moment the bundle hydrates, react-helmet-async replaces it with the
 *     pages.dev host. Googlebot renders JavaScript. That is how a preview
 *     deployment self-canonicalises and gets indexed as a duplicate of the
 *     entire site.
 *   - The same holds for any staging domain, any alias, and any future host.
 *
 * A canonical is a claim about identity, so it has to be a constant, not a
 * reading of the current environment.
 *
 * getSafeOrigin() is still correct for the pages a tenant owns — /:username and
 * /p/:slug can legitimately be served from an agent's own custom_domain, and
 * there the visitor's host IS the canonical one. Those call sites use it
 * directly and say why.
 */
export const getBaseUrl = (): string => getConfiguredAppUrl();

/**
 * Generate canonical URL from path
 */
export const getCanonicalUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Generate OG image URL
 */
export const getOgImageUrl = (imagePath?: string): string => {
  const baseUrl = getBaseUrl();
  const path = imagePath || SEO_CONFIG.defaultImage;
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
