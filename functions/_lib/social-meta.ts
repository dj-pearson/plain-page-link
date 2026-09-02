/**
 * Server-rendered social metadata for public profile pages (US-114).
 *
 * public/_redirects is `/* /index.html 200` and nothing prerenders, so every
 * crawler that fetched agentbio.net/jane got index.html's marketing tags:
 * "Real Estate Agent Bio Page Builder | Turn Instagram Followers into Leads",
 * and Cover.png. SEOHead sets the right tags, but it sets them in React, and
 * iMessage, Facebook, Slack and LinkedIn do not run JavaScript. Agents put this
 * link on business cards and in Instagram bios; the unfurl is the first thing
 * anyone sees of them, and it was somebody else's product pitch.
 *
 * This module is the pure half — no Workers globals — so it can be tested
 * directly. functions/[username].ts is the Cloudflare Pages route that uses it.
 */

export interface ProfileMeta {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  og_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  title: string | null;
  brokerage_name: string | null;
  service_cities: unknown;
}

export interface ListingMeta {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  price: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  description: string | null;
  photos: unknown;
  image: string | null;
}

export interface SocialTags {
  title: string;
  description: string;
  image: string | null;
  url: string;
  /** og:type. A person's page is a profile; a property listing is not. */
  ogType: 'profile' | 'website';
  jsonLd: Record<string, unknown>;
}

/**
 * Crawlers that fetch a URL for a preview card and never execute scripts.
 *
 * Matched case-insensitively as substrings of the User-Agent. Googlebot is
 * deliberately included even though it can render JavaScript: it renders on a
 * second pass, days later, and the first pass is what seeds the snippet.
 */
const CRAWLER_TOKENS = [
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'pinterest',
  'redditbot',
  'skypeuripreview',
  'applebot',
  'googlebot',
  'bingbot',
  'embedly',
  'quora link preview',
  'nuzzel',
  'vkshare',
  'outbrain',
  'iframely',
  'developers.google.com/+/web/snippet',
];

export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_TOKENS.some((token) => ua.includes(token));
}

/**
 * Path segments that are application routes, not usernames.
 *
 * The Pages route pattern `/:username` matches any single segment, so it also
 * matches /dashboard and /pricing. Those must fall through to the SPA
 * untouched. This is a fast reject before the database is consulted; a
 * username that is not in the table falls through too.
 */
const RESERVED_SEGMENTS = new Set([
  'auth',
  'admin',
  'dashboard',
  'onboarding',
  'blog',
  'features',
  'for',
  'tools',
  'legal',
  'pricing',
  'about',
  'contact',
  'help',
  'support',
  'api',
  'assets',
  'icons',
  'sitemap.xml',
  'robots.txt',
  'manifest.json',
  'llms.txt',
  'sw.js',
  'offline.html',
  'index.html',
  'favicon.ico',
]);

export function isReservedSegment(segment: string): boolean {
  if (!segment) return true;
  // Anything with a file extension is an asset, not a profile.
  if (segment.includes('.')) return true;
  return RESERVED_SEGMENTS.has(segment.toLowerCase());
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Collapse whitespace and cut on a word boundary, so a card is not truncated mid-word. */
function summarise(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function firstPhoto(listing: ListingMeta): string | null {
  if (listing.image) return listing.image;
  if (Array.isArray(listing.photos) && typeof listing.photos[0] === 'string') {
    return listing.photos[0];
  }
  return null;
}

/** `525000` and `$525,000` both occur in the price column, which is text. */
function formatPrice(raw: string | null): string | null {
  if (!raw) return null;
  const digits = Number(String(raw).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(digits) || digits <= 0) return null;
  return `$${Math.round(digits).toLocaleString('en-US')}`;
}

function absolute(url: string | null | undefined, origin: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

/**
 * The tags for an agent's profile page.
 */
export function buildProfileTags(profile: ProfileMeta, origin: string): SocialTags {
  const name = profile.full_name?.trim() || profile.username;
  const role = profile.title?.trim() || 'Real Estate Agent';
  const brokerage = profile.brokerage_name?.trim();
  const cities = Array.isArray(profile.service_cities)
    ? profile.service_cities.filter((c): c is string => typeof c === 'string' && c.length > 0)
    : [];

  const title =
    profile.seo_title?.trim() || `${name} — ${role}${brokerage ? ` at ${brokerage}` : ''}`;

  const description =
    profile.seo_description?.trim() ||
    (profile.bio?.trim() && summarise(profile.bio)) ||
    `Browse listings and get in touch with ${name}${
      cities.length ? `, serving ${cities.slice(0, 3).join(', ')}` : ''
    }.`;

  const url = `${origin.replace(/\/$/, '')}/${profile.username}`;

  return {
    title,
    description,
    image: absolute(profile.og_image || profile.avatar_url, origin),
    url,
    ogType: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name,
      url,
      ...(profile.avatar_url ? { image: absolute(profile.avatar_url, origin) } : {}),
      ...(profile.bio ? { description: summarise(profile.bio, 500) } : {}),
      ...(brokerage ? { worksFor: { '@type': 'Organization', name: brokerage } } : {}),
      ...(cities.length ? { areaServed: cities.map((c) => ({ '@type': 'City', name: c })) } : {}),
    },
  };
}

/**
 * The tags for one listing, shared as /:username?listing=<id>.
 *
 * Falls back to the agent's own card for anything the listing does not carry,
 * so a listing with no photo still unfurls as that agent rather than as the
 * product.
 */
export function buildListingTags(
  profile: ProfileMeta,
  listing: ListingMeta,
  origin: string
): SocialTags {
  const agentTags = buildProfileTags(profile, origin);
  const name = profile.full_name?.trim() || profile.username;
  const address = listing.address?.trim() || 'Property';
  const place = [listing.city, listing.state].filter(Boolean).join(', ');
  const price = formatPrice(listing.price);

  const facts = [
    price,
    listing.bedrooms ? `${listing.bedrooms} bd` : null,
    listing.bathrooms ? `${listing.bathrooms} ba` : null,
    listing.square_feet ? `${listing.square_feet.toLocaleString('en-US')} sqft` : null,
  ].filter(Boolean);

  const description = listing.description?.trim()
    ? summarise(listing.description)
    : `${facts.join(' · ')}${facts.length ? '. ' : ''}Listed by ${name}.`;

  const url = `${origin.replace(/\/$/, '')}/${profile.username}?listing=${encodeURIComponent(listing.id)}`;

  return {
    title: `${address}${place ? `, ${place}` : ''}${price ? ` — ${price}` : ''}`,
    description,
    image: absolute(firstPhoto(listing), origin) ?? agentTags.image,
    url,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SingleFamilyResidence',
      name: address,
      url,
      ...(listing.description ? { description: summarise(listing.description, 500) } : {}),
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
        ...(listing.city ? { addressLocality: listing.city } : {}),
        ...(listing.state ? { addressRegion: listing.state } : {}),
      },
      ...(listing.bedrooms ? { numberOfRooms: listing.bedrooms } : {}),
      ...(listing.square_feet
        ? {
            floorSize: {
              '@type': 'QuantitativeValue',
              value: listing.square_feet,
              unitCode: 'FTK',
            },
          }
        : {}),
      ...(price
        ? {
            offers: {
              '@type': 'Offer',
              price: Number(String(listing.price).replace(/[^0-9.]/g, '')),
              priceCurrency: 'USD',
            },
          }
        : {}),
    },
  };
}

/** Tags that index.html hard-codes and that must not survive into a profile response. */
const STRIP_PATTERNS: RegExp[] = [
  /<title>[\s\S]*?<\/title>/i,
  /<meta\s+name="description"[^>]*>/gi,
  /<meta\s+name="keywords"[^>]*>/gi,
  /<meta\s+property="og:[^"]*"[^>]*>/gi,
  /<meta\s+property="twitter:[^"]*"[^>]*>/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
  /<link\s+rel="canonical"[^>]*>/gi,
];

/**
 * Replace index.html's marketing head with this page's own.
 *
 * A string rewrite rather than HTMLRewriter: the same code then runs in a test
 * without a Workers runtime, and the tags being replaced are hard-coded in a
 * file in this repository, not arbitrary markup.
 */
export function injectSocialTags(html: string, tags: SocialTags): string {
  let out = html;
  for (const pattern of STRIP_PATTERNS) {
    out = out.replace(pattern, '');
  }

  const image = tags.image;
  const head = [
    `<title>${escapeAttribute(tags.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(tags.description)}" />`,
    `<link rel="canonical" href="${escapeAttribute(tags.url)}" />`,
    `<meta property="og:type" content="${tags.ogType}" />`,
    `<meta property="og:site_name" content="AgentBio" />`,
    `<meta property="og:url" content="${escapeAttribute(tags.url)}" />`,
    `<meta property="og:title" content="${escapeAttribute(tags.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(tags.description)}" />`,
    image ? `<meta property="og:image" content="${escapeAttribute(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:url" content="${escapeAttribute(tags.url)}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(tags.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(tags.description)}" />`,
    image ? `<meta name="twitter:image" content="${escapeAttribute(image)}" />` : '',
    `<script type="application/ld+json">${JSON.stringify(tags.jsonLd).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  if (out.includes('</head>')) {
    return out.replace('</head>', `    ${head}\n  </head>`);
  }
  // No </head> is not a shape this app's index.html has ever had, but returning
  // the document unchanged is better than returning a broken one.
  return out;
}
