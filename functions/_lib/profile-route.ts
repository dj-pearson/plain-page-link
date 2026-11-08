/**
 * The crawler response for an agent's public URLs (US-114, US-176, US-242),
 * shared by functions/[username].ts and, since US-275, by
 * functions/[username]/listing/[listingId].ts. Moved here from [username].ts
 * unchanged apart from taking the listing id as an argument.
 */

import {
  buildListingBody,
  buildListingTags,
  buildProfileBody,
  buildProfileTags,
  injectSocialTags,
  isCrawler,
  isReservedNonRoute,
  isReservedSegment,
  type BodyListing,
  type ListingMeta,
  type ProfileBodyOptions,
  type ProfileMeta,
} from './social-meta';
import { profileManifestPath } from './profile-manifest';
import { needsCanonicalRedirect, normalizeUsername } from '../../src/lib/username';
import {
  selectAvailableListings,
  selectListingForPage,
  selectSoldListings,
} from '../../src/lib/publicListingVisibility';

export interface Env {
  /** Same values the SPA build uses; set in the Pages project's variables. */
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  /** Cloudflare Pages' static-asset binding, used to read dist/404.html. */
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: { username?: string | string[]; listingId?: string | string[] };
  next: () => Promise<Response>;
}

/** `id` is read only to scope a ?listing= lookup to this agent's own listings. */
type ProfileRow = ProfileMeta & { id: string };

const PROFILE_COLUMNS =
  'id,username,full_name,bio,avatar_url,og_image,seo_title,seo_description,title,brokerage_name,service_cities,license_number,license_state,phone,email_display';
const LISTING_COLUMNS =
  'id,status,address,city,state,price,bedrooms,bathrooms,square_feet,description,photos,image,property_type';
/** The profile body's listing rows (US-539): what a link label needs, no photos. */
const BODY_LISTING_COLUMNS = 'id,status,address,city,state,price,bedrooms,bathrooms,square_feet';
/**
 * Enough rows to fill the body after the visibility filter drops the hidden
 * ones; the sitemap, not this page, is what lists every home.
 */
const BODY_LISTING_FETCH_LIMIT = 40;
/** The two toggles that decide whether a listing is public (anon holds SELECT on these). */
const SETTINGS_COLUMNS = 'show_listings,show_sold_properties';
/** The profile body also honours the contact toggle (anon holds SELECT on it too). */
const PROFILE_SETTINGS_COLUMNS = 'show_listings,show_sold_properties,show_contact_buttons';

type ListingRow = ListingMeta & { id: string; status?: string | null };

interface VisibilitySettings {
  show_listings?: boolean | null;
  show_sold_properties?: boolean | null;
  show_contact_buttons?: boolean | null;
}

/** The upstream must answer quickly or not at all; a crawler will not wait. */
const UPSTREAM_TIMEOUT_MS = 4000;

async function fetchJson<T>(url: string, apiKey: string): Promise<T[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T[];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The site's 404 document, with a 404 status.
 *
 * dist/404.html is what Cloudflare Pages serves for a request matching no asset
 * and no rule. This function is invoked for /:username, which _redirects DOES
 * rewrite to index.html, so Pages' own 404 handling never runs here — it has to
 * be fetched and returned deliberately.
 *
 * If that fetch fails for any reason, fall through rather than invent a
 * response: a working profile page is worth more than a correct status code on
 * a page nobody asked for.
 */
async function notFoundResponse(context: PagesContext): Promise<Response> {
  const { request, env, next } = context;
  try {
    const documentUrl = new URL('/404.html', new URL(request.url).origin).toString();
    // env.ASSETS reads the deployed file directly. Plain fetch() would work too
    // but costs a real subrequest per unknown username, which crawlers generate
    // in bulk; it is the fallback for a runtime that does not expose the
    // binding.
    const document = env.ASSETS
      ? await env.ASSETS.fetch(new Request(documentUrl, { headers: { Accept: 'text/html' } }))
      : await fetch(documentUrl, { headers: { Accept: 'text/html' } });
    if (!document.ok) return next();

    const headers = new Headers(document.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, s-maxage=60');
    headers.set('x-agentbio-prerender', 'not-found');
    return new Response(await document.text(), { status: 404, statusText: 'Not Found', headers });
  } catch {
    return next();
  }
}

/**
 * The listing a crawler may describe, or null.
 *
 * Scoped to this agent: without user_id, /jane?listing=<anyone's id> unfurled
 * another agent's property under Jane's name and URL (US-242).
 *
 * And held to the rule the listing page and the sitemap apply,
 * selectListingForPage (US-382). Before this, an agent who switched "Show
 * listings" off — or "Show sold properties" off — still had a full share card,
 * photo, price and address, served for every hidden home whose URL had ever
 * been shared, while the page itself said the home was not listed.
 *
 * If the settings read fails the listing is withheld: a database blip may cost
 * a listing its card for five minutes, but must not publish a home the agent
 * chose to hide. No settings row means the defaults, which show everything.
 *
 * `listing: null` comes in two kinds, and only one is an answer (US-416):
 * `unknown` means a read errored or timed out, so nothing is known about the
 * home; `hidden` means both reads answered and the home is missing, withdrawn
 * or hidden by the agent's toggles.
 */
type ListingLookup =
  | { state: 'visible'; listing: ListingRow }
  | { state: 'hidden'; listing: null }
  | { state: 'unknown'; listing: null };

async function fetchVisibleListing(
  base: string,
  apiKey: string,
  profileId: string,
  listingId: string
): Promise<ListingLookup> {
  const [listings, settings] = await Promise.all([
    fetchJson<ListingRow>(
      `${base}/rest/v1/listings?select=${LISTING_COLUMNS}&id=eq.${encodeURIComponent(listingId)}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
      apiKey
    ),
    fetchJson<VisibilitySettings>(
      `${base}/rest/v1/user_settings?select=${SETTINGS_COLUMNS}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
      apiKey
    ),
  ]);
  if (!listings || !settings) return { state: 'unknown', listing: null };
  const listing = selectListingForPage(listings, listingId, settings[0] ?? null);
  return listing ? { state: 'visible', listing } : { state: 'hidden', listing: null };
}

/**
 * What the profile body may show (US-539): the listings the page itself would
 * show, in its order (available first, then sold), and whether contact links
 * are allowed.
 *
 * Every row is held to selectListingForPage, the rule the page, the listing
 * route and the sitemap apply, so a home the agent hid is never named here.
 * If either read fails, nothing is shown: the body is a bonus, and a blip
 * must not publish what the agent chose to hide.
 */
async function fetchProfileBodyOptions(
  base: string,
  apiKey: string,
  profileId: string
): Promise<ProfileBodyOptions> {
  const [listings, settings] = await Promise.all([
    fetchJson<BodyListing>(
      `${base}/rest/v1/listings?select=${BODY_LISTING_COLUMNS}&user_id=eq.${encodeURIComponent(profileId)}&status=in.(active,pending,under_contract,sold)&order=sort_order.asc,created_at.desc,id.asc&limit=${BODY_LISTING_FETCH_LIMIT}`,
      apiKey
    ),
    fetchJson<VisibilitySettings>(
      `${base}/rest/v1/user_settings?select=${PROFILE_SETTINGS_COLUMNS}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
      apiKey
    ),
  ]);
  if (!settings) return { listings: [], showContact: false };
  const toggles = settings[0] ?? null;
  const visible = (listings ?? []).filter(
    (row) => typeof row?.id === 'string' && selectListingForPage([row], row.id, toggles) !== null
  );
  return {
    listings: [...selectAvailableListings(visible), ...selectSoldListings(visible)],
    showContact: toggles?.show_contact_buttons !== false,
  };
}

/**
 * Replace any robots meta with noindex, follow. The prerendered homepage
 * carries its own (index), which must not survive on a 404.
 */
export function markNoindex(html: string): string {
  const stripped = html.replace(/<meta\s+name="robots"[^>]*>/gi, '');
  return stripped.includes('</head>')
    ? stripped.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n  </head>')
    : stripped;
}

const MANIFEST_LINK = /<link\b[^>]*\brel=["']?manifest["']?[^>]*>/gi;

/** index.html's iOS home-screen label, with its own indentation and line break. */
const APPLE_WEB_APP_TITLE =
  /[ \t]*<meta\b[^>]*\bname=["']?apple-mobile-web-app-title["']?[^>]*>[ \t]*\r?\n?/gi;

/**
 * Drop the "AgentBio" apple-mobile-web-app-title meta from an agent's page
 * (US-569).
 *
 * Safari prefers that meta over everything else as the label for Add to Home
 * Screen, so a buyer saving agentbio.net/jane got an icon called "AgentBio".
 * useProfileManifest lifts it once React runs; this does the same in the HTML
 * the parser sees first, so a slow or failed bundle still leaves the label to
 * the page title, which on the crawler path is the agent's name.
 */
export function dropAppleWebAppTitle(html: string): string {
  return html.replace(APPLE_WEB_APP_TITLE, '');
}

/**
 * Point the document's web app manifest at the agent's own (US-471).
 *
 * index.html links /manifest.json, the AgentBio dashboard app (start_url
 * /dashboard). In the browser useProfileManifest swaps it once React runs; the
 * crawler HTML is never touched by React, so it went on naming the dashboard
 * app under the agent's URL. Every manifest link is removed and exactly one,
 * naming /:username/manifest.json, goes back in its place (or before </head>
 * if the document had none). The AgentBio home-screen label goes with it
 * (dropAppleWebAppTitle, US-569): every caller is serving an agent's page.
 */
export function linkProfileManifest(html: string, username: string): string {
  const link = `<link rel="manifest" href="${profileManifestPath(username)}" />`;
  let placed = false;
  const out = dropAppleWebAppTitle(html).replace(MANIFEST_LINK, () => {
    if (placed) return '';
    placed = true;
    return link;
  });
  if (placed) return out;
  return out.includes('</head>') ? out.replace('</head>', `    ${link}\n  </head>`) : out;
}

/**
 * The SPA document for a person, naming the agent's manifest (US-553).
 *
 * index.html links /manifest.json, the dashboard app. useProfileManifest
 * swaps it once React runs, but Chrome on Android can judge install
 * eligibility against the manifest the parser saw first, so a buyer could be
 * offered the dashboard app (start_url /dashboard) on an agent's page. The
 * body is otherwise byte-for-byte what the asset server sent, and nothing here
 * reads the database: the username comes from the URL, and the manifest route
 * answers for itself when the handle does not exist.
 *
 * Anything that is not a successful HTML document passes through untouched.
 * content-length and the asset ETag describe the original bytes, so both go;
 * the asset's own cache-control stays.
 */
async function serveHumanDocument(assetResponse: Response, username: string): Promise<Response> {
  const contentType = assetResponse.headers.get('content-type') ?? '';
  if (!assetResponse.ok || !contentType.includes('text/html')) return assetResponse;

  const html = await assetResponse.text();
  const headers = new Headers(assetResponse.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(linkProfileManifest(html, username), {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}

/** A single route parameter, whichever shape Pages hands it over in. */
export function routeParam(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Serve a public profile URL: /:username (optionally with the legacy
 * ?listing=<id>), or /:username/listing/:id (US-275). `listingId` is whichever
 * of the two the URL carried; `listingPath` says which shape it is, which
 * decides the canonical redirect's path.
 */
export async function serveProfileRoute(
  context: PagesContext,
  segment: string | undefined,
  listingId: string | null,
  listingPath: boolean
): Promise<Response> {
  const { request, env, next } = context;

  if (!segment) {
    return next();
  }
  if (isReservedSegment(segment)) {
    // A reserved word that is not a page (/about, /legal, /api, ...) is a 404
    // for crawlers and people alike (US-435). It used to fall through to the
    // /:username rewrite and answer 200 with the homepage. Real routes and
    // assets still fall through untouched.
    return isReservedNonRoute(segment) ? notFoundResponse(context) : next();
  }

  // Usernames are stored lower case, so /JaneDoe used to query
  // username=eq.JaneDoe, find nothing, and answer a crawler 404 (US-176) —
  // for a URL printed on business cards and typed on phones that capitalise
  // the first letter. One 301 to the canonical address, for crawlers and
  // people alike: FullProfilePage already redirects in the browser, and this
  // gives the URL a single address before any script runs (US-242).
  if (needsCanonicalRedirect(segment)) {
    const url = new URL(request.url);
    const profilePath = `/${encodeURIComponent(normalizeUsername(segment))}`;
    url.pathname =
      listingPath && listingId
        ? `${profilePath}/listing/${encodeURIComponent(listingId)}`
        : profilePath;
    return new Response(null, {
      status: 301,
      headers: { location: url.toString(), 'cache-control': 'public, max-age=3600' },
    });
  }
  const username = segment;

  if (!isCrawler(request.headers.get('user-agent'))) {
    return serveHumanDocument(await next(), username);
  }

  const restUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!restUrl || !apiKey) {
    console.error('[social-meta] no Supabase binding on this Pages project');
    return next();
  }

  const base = restUrl.replace(/\/$/, '');
  const profiles = await fetchJson<ProfileRow>(
    `${base}/rest/v1/profiles?select=${PROFILE_COLUMNS}&username=eq.${encodeURIComponent(username)}&is_published=is.true&limit=1`,
    apiKey
  );

  const profile = profiles?.[0];
  if (!profile) {
    // The lookup failing and the username not existing are different things,
    // and only one of them is a 404 (US-176).
    //
    // `profiles === null` means the request to PostgREST errored, timed out or
    // was aborted. Answering 404 there would turn a database blip into a
    // deindexing event for every agent on the platform at once, so it falls
    // through to the SPA exactly as before.
    //
    // An empty array means PostgREST answered and there is no published profile
    // with that username. Before this, that returned 200 with the prerendered
    // homepage, because _redirects rewrote every single-segment URL to
    // index.html — so every typo of an agent's handle was a duplicate homepage
    // that Google had to crawl and discard. /:username is the one shape the
    // static rules cannot resolve, because telling a real handle from a typo
    // takes the database lookup this function has just done.
    if (profiles === null) {
      return next();
    }
    return notFoundResponse(context);
  }

  const origin = new URL(request.url).origin;
  let tags = buildProfileTags(profile, origin);
  // Undefined means injectSocialTags' heading-and-summary body.
  let body: string | undefined;
  let listingGone = false;

  if (listingId) {
    const lookup = await fetchVisibleListing(base, apiKey, profile.id, listingId);
    // A listing that does not resolve, or that the agent has hidden, keeps the
    // agent's card rather than producing a broken one.
    if (lookup.state === 'visible') {
      tags = buildListingTags(profile, lookup.listing, origin);
      body = buildListingBody(profile, lookup.listing, tags, origin);
    }
    // On its own address, a home that is definitively not public is a 404
    // (US-416). It used to answer 200 with the agent's card while the SPA
    // marked the same URL noindex with a canonical to the profile: a soft 404,
    // which search engines keep re-crawling and may report as an error, for
    // every withdrawn or sold-and-hidden home whose URL was ever shared or
    // listed in the sitemap. The body is still the agent's card, so a preview
    // bot that renders a 404's tags points at the agent rather than at a
    // generic error page.
    //
    // Only when PostgREST answered both reads: a blip ('unknown') must not
    // turn every listing URL into a deindexing event. The legacy
    // /:username?listing= link stays 200, because that URL is the profile.
    listingGone = listingPath && lookup.state === 'hidden';
  }

  // The agent's page itself: what answer engines read about them (US-539).
  // Read alongside the document rather than before it.
  const [assetResponse, bodyOptions] = await Promise.all([
    next(),
    listingId ? Promise.resolve(null) : fetchProfileBodyOptions(base, apiKey, profile.id),
  ]);
  if (bodyOptions) {
    // The JSON-LD names the same visible homes the body lists (US-551).
    tags = buildProfileTags(profile, origin, bodyOptions.listings);
    body = buildProfileBody(profile, tags, origin, bodyOptions);
  }
  const contentType = assetResponse.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return assetResponse;
  }

  const html = await assetResponse.text();
  const headers = new Headers(assetResponse.headers);
  headers.delete('content-length');
  // Crawlers re-fetch; a short shared cache keeps a viral link from becoming a
  // read amplifier on the database.
  headers.set('cache-control', 'public, max-age=0, s-maxage=300');

  if (listingGone) {
    headers.set('x-agentbio-prerender', 'listing-not-found');
    headers.set('x-robots-tag', 'noindex');
    return new Response(
      markNoindex(linkProfileManifest(injectSocialTags(html, tags, body), username)),
      {
        status: 404,
        statusText: 'Not Found',
        headers,
      }
    );
  }

  headers.set('x-agentbio-prerender', listingId ? 'listing' : 'profile');

  return new Response(linkProfileManifest(injectSocialTags(html, tags, body), username), {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}
