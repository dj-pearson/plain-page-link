/**
 * Cloudflare Pages Function for /:username (US-114).
 *
 * public/_redirects is `/* /index.html 200` with nothing prerendering, so a
 * crawler that fetched agentbio.net/jane received index.html's marketing tags
 * and Cover.png. Agents share this link from business cards and Instagram
 * bios; the unfurl was a pitch for the platform, with no trace of the agent.
 *
 * Only crawlers are served the rewritten document. A human still gets the SPA
 * byte-for-byte from the asset server, so nothing about the app's behaviour,
 * caching or hydration changes — this adds a path, it does not divert the
 * existing one.
 *
 * Everything that can fail — a missing binding, an unreachable database, an
 * unknown username, a five-second timeout — falls through to next(). A social
 * card is worth having; it is not worth risking the page itself for.
 */

import {
  buildListingTags,
  buildProfileTags,
  injectSocialTags,
  isCrawler,
  isReservedSegment,
  normalizeUsername,
  type ListingMeta,
  type ProfileMeta,
} from './_lib/social-meta';

interface Env {
  /** Same values the SPA build uses; set in the Pages project's variables. */
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  /** Cloudflare Pages' static-asset binding, used to read dist/404.html. */
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

interface PagesContext {
  request: Request;
  env: Env;
  params: { username?: string | string[] };
  next: () => Promise<Response>;
}

const PROFILE_COLUMNS =
  'username,full_name,bio,avatar_url,og_image,seo_title,seo_description,title,brokerage_name,service_cities';
const LISTING_COLUMNS =
  'id,address,city,state,price,bedrooms,bathrooms,square_feet,description,photos,image';

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

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const { request, env, params, next } = context;

  if (!isCrawler(request.headers.get('user-agent'))) {
    return next();
  }

  const raw = params.username;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  if (!segment || isReservedSegment(segment)) {
    return next();
  }

  // Look the profile up by its canonical form (US-202).
  //
  // This queried PostgREST with the URL segment exactly. US-187 had already
  // made the SPA resolve /JaneDoe case-insensitively and the database refuse to
  // store a non-canonical username — so a crawler fetching the URL printed on
  // an agent's business card got an empty result and a hard 404 from
  // notFoundResponse(), while a human opening the same URL got the page. The
  // link worked in a browser and produced no unfurl at all on Facebook,
  // iMessage or LinkedIn.
  const username = normalizeUsername(segment);

  const restUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!restUrl || !apiKey) {
    console.error('[social-meta] no Supabase binding on this Pages project');
    return next();
  }

  const base = restUrl.replace(/\/$/, '');
  const profiles = await fetchJson<ProfileMeta>(
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

  const url = new URL(request.url);
  const origin = url.origin;

  // One profile, one URL — for a crawler too.
  //
  // The SPA rewrites a non-canonical slug in the address bar, but a crawler
  // does not run it. Without this, /JaneDoe and /janedoe would both answer 200
  // with identical markup, which is a duplicate every search engine has to
  // crawl and reconcile. A 301 says which one is the page, and is the same
  // answer the SPA gives a person.
  if (segment !== username) {
    const canonical = new URL(url.toString());
    canonical.pathname = `/${encodeURIComponent(username)}`;
    return new Response(null, {
      status: 301,
      headers: {
        location: canonical.pathname + canonical.search,
        'cache-control': 'public, max-age=0, s-maxage=300',
        'x-agentbio-prerender': 'canonical-redirect',
      },
    });
  }

  let tags = buildProfileTags(profile, origin);

  const listingId = url.searchParams.get('listing');
  if (listingId) {
    const listings = await fetchJson<ListingMeta>(
      `${base}/rest/v1/listings?select=${LISTING_COLUMNS}&id=eq.${encodeURIComponent(listingId)}&limit=1`,
      apiKey
    );
    const listing = listings?.[0];
    // A listing that does not resolve keeps the agent's card rather than
    // producing a broken one.
    if (listing) {
      tags = buildListingTags(profile, listing, origin);
    }
  }

  const assetResponse = await next();
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
  headers.set('x-agentbio-prerender', listingId ? 'listing' : 'profile');

  return new Response(injectSocialTags(html, tags), {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
};
