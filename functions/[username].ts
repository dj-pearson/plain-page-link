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
  type ListingMeta,
  type ProfileMeta,
} from './_lib/social-meta';

interface Env {
  /** Same values the SPA build uses; set in the Pages project's variables. */
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
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

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const { request, env, params, next } = context;

  if (!isCrawler(request.headers.get('user-agent'))) {
    return next();
  }

  const raw = params.username;
  const username = Array.isArray(raw) ? raw[0] : raw;
  if (!username || isReservedSegment(username)) {
    return next();
  }

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
    // Not an agent, not published, or the lookup failed. Either way the SPA
    // answers — including with its own 404.
    return next();
  }

  const url = new URL(request.url);
  const origin = url.origin;
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
