/**
 * Structured data (JSON-LD) helpers.
 *
 * Pure functions that build schema.org JSON-LD objects for the platform's
 * public surfaces:
 *   - Organization        → landing page
 *   - RealEstateAgent     → public agent profiles (a Person who is an agent)
 *   - RealEstateListing   → property listings (price, address, details)
 *   - Article             → blog posts
 *   - BreadcrumbList      → navigation breadcrumbs
 *
 * Each returns a plain object suitable for `<SEOHead schema={...}>` (which
 * serializes it into a <script type="application/ld+json"> tag). Undefined
 * fields are omitted so the output validates cleanly.
 */

const SITE_NAME = 'AgentBio';
const DEFAULT_SITE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || 'https://agentbio.net';

type JsonLd = Record<string, unknown>;

/** Remove undefined/null/empty-string values so JSON-LD stays clean. */
function compact<T extends JsonLd>(obj: T): T {
  const out: JsonLd = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out as T;
}

export function organizationSchema(siteUrl: string = DEFAULT_SITE_URL): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'AI-powered link-in-bio platform for real estate agents — portfolios, lead capture, and analytics.',
    sameAs: [] as string[],
  };
}

export interface AgentProfileInput {
  fullName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  brokerage?: string;
  siteUrl?: string;
}

export function realEstateAgentSchema(profile: AgentProfileInput): JsonLd {
  const siteUrl = profile.siteUrl || DEFAULT_SITE_URL;
  const profileUrl = `${siteUrl}/${profile.username}`;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: profile.fullName,
    url: profileUrl,
    image: profile.avatarUrl,
    description: profile.bio,
    telephone: profile.phone,
    email: profile.email,
    worksFor: profile.brokerage
      ? compact({ '@type': 'Organization', name: profile.brokerage })
      : undefined,
    address:
      profile.city || profile.state
        ? compact({
            '@type': 'PostalAddress',
            addressLocality: profile.city,
            addressRegion: profile.state,
          })
        : undefined,
  });
}

export interface ListingInput {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  images?: string[];
  url?: string;
  status?: string;
}

export function realEstateListingSchema(listing: ListingInput): JsonLd {
  const offerStatus =
    listing.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock';

  return compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: listing.url,
    image: listing.images && listing.images.length > 0 ? listing.images : undefined,
    address:
      listing.address || listing.city || listing.state
        ? compact({
            '@type': 'PostalAddress',
            streetAddress: listing.address,
            addressLocality: listing.city,
            addressRegion: listing.state,
          })
        : undefined,
    numberOfBedrooms: listing.bedrooms,
    numberOfBathroomsTotal: listing.bathrooms,
    floorSize:
      listing.squareFeet !== undefined
        ? compact({ '@type': 'QuantitativeValue', value: listing.squareFeet, unitCode: 'FTK' })
        : undefined,
    offers:
      listing.price !== undefined
        ? compact({
            '@type': 'Offer',
            price: listing.price,
            priceCurrency: listing.currency || 'USD',
            availability: offerStatus,
          })
        : undefined,
  });
}

export interface ArticleInput {
  title: string;
  description?: string;
  slug: string;
  authorName?: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  siteUrl?: string;
}

export function articleSchema(article: ArticleInput): JsonLd {
  const siteUrl = article.siteUrl || DEFAULT_SITE_URL;
  const url = `${siteUrl}/blog/${article.slug}`;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: compact({ '@type': 'Person', name: article.authorName || SITE_NAME }),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

export interface BreadcrumbItemInput {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItemInput[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
