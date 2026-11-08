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

// Relative, not '@/': the Pages Functions bundle does not resolve the Vite alias.
import { isPublicListingStatus, listingStatusLabel } from '../../src/lib/listingStatus';
import {
  AGENT_OFFER_LIMIT,
  agentListingOffers,
  listingJsonLdNodes,
  listingPageUrl,
} from '../../src/lib/listingJsonLd';

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
  /**
   * Read only for the crawler body (US-539). Optional so a caller that never
   * selected them still type-checks; anon holds SELECT on all four.
   */
  license_number?: string | null;
  license_state?: string | null;
  phone?: string | null;
  email_display?: string | null;
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
  /** Picks the property node's schema.org type (residenceType). */
  property_type?: string | null;
  /** 'sold' makes the offer SoldOut. */
  status?: string | null;
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
const PREVIEW_AND_SEARCH_TOKENS = [
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
  // US-520. Search engines that robots.txt admits under `*` but this list
  // used to miss.
  'duckduckbot',
  'yandexbot',
];

/**
 * Answer engines' fetchers (US-520): the crawlers that build ChatGPT,
 * Claude, Perplexity, Alexa and DuckDuckGo answers, and the fetchers those
 * assistants send when a person pastes a link. robots.txt explicitly allows
 * them, for citation, and none of them executes scripts.
 *
 * Without these, GPTBot or PerplexityBot fetching agentbio.net/jane received
 * dist/index.html as it is: the prerendered homepage, whose body is the
 * platform's pitch and whose JSON-LD declares WebSite, SoftwareApplication and
 * FAQPage. An assistant asked about Jane read and cited AgentBio's marketing
 * page; an unknown handle answered 200 with that same page instead of 404.
 */
const ANSWER_ENGINE_TOKENS = [
  'gptbot',
  'oai-searchbot',
  'chatgpt-user',
  'claudebot',
  'claude-searchbot',
  'claude-user',
  'perplexitybot',
  'perplexity-user',
  'amazonbot',
  'duckassistbot',
  'mistralai-user',
  'meta-externalfetcher',
];

const CRAWLER_TOKENS = [...PREVIEW_AND_SEARCH_TOKENS, ...ANSWER_ENGINE_TOKENS];

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
  // US-425: the Unsubscribe page, linked from marketing email.
  'unsubscribe',
  'pricing',
  'about',
  'contact',
  'help',
  'support',
  'api',
  'assets',
  'icons',
  'sitemap.xml',
  // US-262. A Pages Function of its own; isReservedSegment's dot rule already
  // rejects it, and naming it here keeps that true if the dot rule changes.
  'sitemap-profiles.xml',
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

/**
 * Reserved segments that are not pages on their own (US-435).
 *
 * Each is kept out of the username lookup, but App.tsx has no route at the bare
 * segment: /auth and /onboarding are prefixes whose children are routes,
 * /assets and /icons are asset directories, /api holds only /api/sentry, and
 * /legal, /about, /contact, /help and /support have never been URLs here.
 * Being one segment, each matched the /:username rule and answered 200 with the
 * prerendered homepage — a soft 404. The profile route answers them with
 * dist/404.html instead.
 *
 * Not here: segments that ARE routes (/dashboard, /admin, /blog, /tools,
 * /pricing) and the two prefixes _redirects sends to the homepage with a 301
 * (/features, /for). src/spa-routes.test.ts holds every reserved segment to one
 * of those three answers, so a new entry has to say which it is.
 */
const RESERVED_NON_ROUTE_SEGMENTS = new Set([
  'auth',
  'onboarding',
  'legal',
  'about',
  'contact',
  'help',
  'support',
  'api',
  'assets',
  'icons',
]);

export function isReservedNonRoute(segment: string): boolean {
  return RESERVED_NON_ROUTE_SEGMENTS.has(segment.toLowerCase());
}

/** Every named reserved segment, for the test that holds each to an answer. */
export const RESERVED_SEGMENT_NAMES: readonly string[] = [...RESERVED_SEGMENTS];

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

/** The listing's photos for its JSON-LD: the gallery, else the legacy single image. */
function listingImages(listing: ListingMeta, origin: string): string[] {
  const gallery = Array.isArray(listing.photos)
    ? listing.photos.filter((p): p is string => typeof p === 'string' && p.length > 0)
    : [];
  const sources = gallery.length ? gallery : listing.image ? [listing.image] : [];
  return sources
    .slice(0, 10)
    .map((src) => absolute(src, origin))
    .filter((src): src is string => src !== null);
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
 *
 * `listings` is the visible set the crawler body shows (US-551); without it
 * the JSON-LD names no homes.
 */
export function buildProfileTags(
  profile: ProfileMeta,
  origin: string,
  listings: readonly BodyListing[] = []
): SocialTags {
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
      // The same node id FullProfilePage.tsx declares for the agent.
      '@id': `${url}#agent`,
      name,
      url,
      ...(profile.avatar_url ? { image: absolute(profile.avatar_url, origin) } : {}),
      ...(profile.bio ? { description: summarise(profile.bio, 500) } : {}),
      ...(brokerage ? { worksFor: { '@type': 'Organization', name: brokerage } } : {}),
      ...(cities.length ? { areaServed: cities.map((c) => ({ '@type': 'City', name: c })) } : {}),
      ...(listings.length
        ? {
            makesOffer: agentListingOffers(
              listings,
              profile.username,
              origin,
              PROFILE_BODY_LISTING_LIMIT
            ),
          }
        : {}),
    },
  };
}

/**
 * The tags for one listing: /:username/listing/<id>, or the legacy
 * /:username?listing=<id> share link, which canonicalises to it.
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

  // The listing's own page (US-275), whichever URL the crawler arrived on.
  const url = listingPageUrl(origin, profile.username, listing.id);

  return {
    title: `${address}${place ? `, ${place}` : ''}${price ? ` — ${price}` : ''}`,
    description,
    image: absolute(firstPhoto(listing), origin) ?? agentTags.image,
    url,
    ogType: 'website',
    // The same RealEstateListing + property model ListingPage.tsx declares
    // (src/lib/listingJsonLd.ts), so the two renderings agree on the type of
    // the `#listing` node the agent's page links to (US-578).
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': listingJsonLdNodes({
        pageUrl: url,
        // The name ListingPage.tsx gives the node: address and city.
        name:
          [listing.address?.trim(), listing.city?.trim()].filter(Boolean).join(', ') ||
          'Property listing',
        description: listing.description ? summarise(listing.description, 500) : null,
        images: listingImages(listing, origin),
        streetAddress: listing.address,
        city: listing.city,
        state: listing.state,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        squareFeet: listing.square_feet,
        price: Number(String(listing.price ?? '').replace(/[^0-9.]/g, '')),
        status: listing.status,
        propertyType: listing.property_type,
      }),
    },
  };
}

/**
 * Tags that dist/index.html carries and that must not survive into a profile
 * response.
 *
 * dist/index.html is not the bare shell in the repository: since US-147 it is
 * the prerendered homepage, so on top of index.html's own tags it carries every
 * tag react-helmet-async wrote for Landing (each marked data-rh="true"), the
 * homepage's <meta name="title">, and its JSON-LD — one @graph of WebSite,
 * Organization, SoftwareApplication, BreadcrumbList, ProfessionalService and
 * FAQPage. Left in, that graph told Google every agent's URL was the
 * platform's homepage (US-242).
 *
 * Every application/ld+json block in the input is the homepage's: next() for
 * /:username is the _redirects rewrite to /index.html, never a document of the
 * agent's own. The agent's JSON-LD is added back below.
 */
const STRIP_PATTERNS: RegExp[] = [
  /<title>[\s\S]*?<\/title>/i,
  /<meta\s+name="description"[^>]*>/gi,
  /<meta\s+name="title"[^>]*>/gi,
  /<meta\s+name="keywords"[^>]*>/gi,
  /<meta\s+property="og:[^"]*"[^>]*>/gi,
  /<meta\s+property="twitter:[^"]*"[^>]*>/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
  /<link\s+rel="canonical"[^>]*>/gi,
  /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
];

const ROOT_OPEN = /<div\b[^>]*\bid="root"[^>]*>/i;

/**
 * Replace whatever is inside <div id="root"> with `body`.
 *
 * The prerendered homepage puts its whole body there — hero, pricing, FAQ,
 * footer: 80 KB of somebody else's page under an agent's URL, and the first
 * thing a crawler that does not run scripts reads as that page's content. The
 * SPA mounts with createRoot, which discards whatever it finds in #root, so
 * what goes here is read by crawlers only.
 *
 * The matching </div> is found by counting <div> depth, not by a lazy regex,
 * which would stop at the first nested </div>. A document whose #root is
 * missing or unbalanced is returned unchanged: the homepage's body is a worse
 * page, not a broken one.
 */
export function replaceRootContent(html: string, body: string): string {
  const open = ROOT_OPEN.exec(html);
  if (!open) return html;
  const contentStart = open.index + open[0].length;

  const tag = /<(\/?)div\b[^>]*>/gi;
  tag.lastIndex = contentStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(html)) !== null) {
    if (match[1]) {
      depth -= 1;
      if (depth === 0) {
        return html.slice(0, contentStart) + body + html.slice(match.index);
      }
    } else if (!match[0].endsWith('/>')) {
      depth += 1;
    }
  }
  return html;
}

/**
 * Replace the prerendered homepage's head and body with this page's own.
 *
 * A string rewrite rather than HTMLRewriter: the same code then runs in a test
 * without a Workers runtime, and the document being rewritten is one this
 * repository builds, not arbitrary markup.
 */
export function injectSocialTags(html: string, tags: SocialTags, body?: string): string {
  let out = html;
  for (const pattern of STRIP_PATTERNS) {
    out = out.replace(pattern, '');
  }

  // The page's own content in place of the homepage's body, so a crawler's
  // first, script-free pass reads the agent. `body` comes from
  // buildProfileBody / buildListingBody, which escape everything they
  // interpolate; without one, the heading and summary alone.
  out = replaceRootContent(out, body ?? summaryBody(tags));

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

// ---------------------------------------------------------------------------
// The script-free body (US-539)
// ---------------------------------------------------------------------------

/** The body when there is nothing more to say than the head already does. */
function summaryBody(tags: SocialTags): string {
  return `<main><h1>${escapeAttribute(tags.title)}</h1><p>${escapeAttribute(tags.description)}</p></main>`;
}

/** A listing row as the profile body needs it. */
export interface BodyListing {
  id: string;
  status?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
}

/**
 * How many listings the profile body links to, and its JSON-LD offers. The
 * sitemap carries the rest. The SPA's makesOffer uses the same number.
 */
export const PROFILE_BODY_LISTING_LIMIT = AGENT_OFFER_LIMIT;

/** The status as the page's badge names it; nothing for a non-public or missing one. */
function statusLabel(status: string | null | undefined): string[] {
  return isPublicListingStatus(status) ? [listingStatusLabel(status)] : [];
}

function serviceCities(profile: ProfileMeta): string[] {
  return Array.isArray(profile.service_cities)
    ? profile.service_cities
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map((c) => c.trim())
    : [];
}

function listingFacts(listing: BodyListing): string[] {
  return [
    formatPrice(listing.price),
    listing.bedrooms ? `${listing.bedrooms} bd` : null,
    listing.bathrooms ? `${listing.bathrooms} ba` : null,
    listing.square_feet ? `${listing.square_feet.toLocaleString('en-US')} sqft` : null,
  ].filter((fact): fact is string => Boolean(fact));
}

/**
 * A `tel:` target, or null. Only digits and a leading plus survive, so the
 * stored text can never put anything but a number into the href.
 */
function telHref(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** A `mailto:` target for a plausible address, or null. */
function mailtoHref(email: string | null | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed || !/^[^\s@<>"'()?&]+@[^\s@<>"'()?&]+\.[^\s@<>"'()?&]+$/.test(trimmed)) {
    return null;
  }
  return `mailto:${trimmed}`;
}

export interface ProfileBodyOptions {
  /**
   * The listings the page itself would show, already held to
   * selectListingForPage by the caller. Empty when the agent hides them or
   * the read failed.
   */
  listings: readonly BodyListing[];
  /** False when the agent hides contact buttons, or the settings read failed. */
  showContact: boolean;
}

/**
 * What a crawler that runs no scripts reads at /:username (US-539).
 *
 * It used to be a heading and one paragraph, which, once answer engines
 * reached this path (US-520), was all ChatGPT or Perplexity learned about the
 * agent: no service area, no brokerage, no licence, no homes. This is the
 * page's substance as plain HTML: who the agent is and where they work, the
 * homes the page lists, each linking to its own page, and how to reach them.
 *
 * Every interpolated value is escaped, and every href is built here from a
 * validated value, never copied from the row.
 */
export function buildProfileBody(
  profile: ProfileMeta,
  tags: SocialTags,
  origin: string,
  options: ProfileBodyOptions
): string {
  const base = origin.replace(/\/$/, '');
  const name = profile.full_name?.trim() || profile.username;
  const role = profile.title?.trim() || 'Real Estate Agent';
  const brokerage = profile.brokerage_name?.trim();
  const licenseNumber = profile.license_number?.trim();
  const licenseState = profile.license_state?.trim();
  const cities = serviceCities(profile);
  const bio = profile.bio?.trim() ? summarise(profile.bio, 1200) : '';

  const parts: string[] = [
    `<h1>${escapeAttribute(tags.title)}</h1>`,
    `<p>${escapeAttribute(tags.description)}</p>`,
  ];
  if (bio && bio !== tags.description) parts.push(`<p>${escapeAttribute(bio)}</p>`);

  const facts = [
    `<li>${escapeAttribute(role)}${brokerage ? ` at ${escapeAttribute(brokerage)}` : ''}</li>`,
  ];
  if (licenseNumber) {
    facts.push(
      `<li>License #${escapeAttribute(licenseNumber)}${
        licenseState ? ` (${escapeAttribute(licenseState)})` : ''
      }</li>`
    );
  }
  parts.push(`<ul>${facts.join('')}</ul>`);

  if (cities.length) {
    const items = cities.map((city) => `<li>${escapeAttribute(city)}</li>`).join('');
    parts.push(`<section><h2>Service areas</h2><ul>${items}</ul></section>`);
  }

  const listings = options.listings.slice(0, PROFILE_BODY_LISTING_LIMIT);
  if (listings.length) {
    const items = listings.map((listing) => {
      const address = listing.address?.trim() || 'Property';
      const place = [listing.city?.trim(), listing.state?.trim()].filter(Boolean).join(', ');
      const href = listingPageUrl(base, profile.username, listing.id);
      const details = [...statusLabel(listing.status), ...listingFacts(listing)];
      return `<li><a href="${escapeAttribute(href)}">${escapeAttribute(
        `${address}${place ? `, ${place}` : ''}`
      )}</a>${details.length ? ` — ${escapeAttribute(details.join(' · '))}` : ''}</li>`;
    });
    parts.push(`<section><h2>Listings</h2><ul>${items.join('')}</ul></section>`);
  }

  if (options.showContact) {
    const tel = telHref(profile.phone);
    const mailto = mailtoHref(profile.email_display);
    const links: string[] = [];
    if (tel && profile.phone) {
      links.push(
        `<li><a href="${escapeAttribute(tel)}">${escapeAttribute(profile.phone.trim())}</a></li>`
      );
    }
    if (mailto && profile.email_display) {
      links.push(
        `<li><a href="${escapeAttribute(mailto)}">${escapeAttribute(profile.email_display.trim())}</a></li>`
      );
    }
    if (links.length) {
      parts.push(
        `<section><h2>Contact ${escapeAttribute(name)}</h2><ul>${links.join('')}</ul></section>`
      );
    }
  }

  return `<main>${parts.join('')}</main>`;
}

/**
 * What a crawler reads at /:username/listing/:id (US-539): the home's facts
 * and who lists it, with a link back to the agent's page.
 */
export function buildListingBody(
  profile: ProfileMeta,
  listing: ListingMeta & { status?: string | null },
  tags: SocialTags,
  origin: string
): string {
  const name = profile.full_name?.trim() || profile.username;
  const role = profile.title?.trim() || 'Real Estate Agent';
  const brokerage = profile.brokerage_name?.trim();
  const profileUrl = `${origin.replace(/\/$/, '')}/${encodeURIComponent(profile.username)}`;
  const details = [...statusLabel(listing.status), ...listingFacts(listing)];

  const parts = [`<h1>${escapeAttribute(tags.title)}</h1>`];
  if (details.length) parts.push(`<p>${escapeAttribute(details.join(' · '))}</p>`);
  if (listing.description?.trim()) {
    parts.push(`<p>${escapeAttribute(summarise(listing.description, 1200))}</p>`);
  }
  parts.push(
    `<p>Listed by <a href="${escapeAttribute(profileUrl)}">${escapeAttribute(name)}</a>, ${escapeAttribute(
      role
    )}${brokerage ? ` at ${escapeAttribute(brokerage)}` : ''}.</p>`
  );
  return `<main>${parts.join('')}</main>`;
}
