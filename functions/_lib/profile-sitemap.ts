/**
 * The agents' own pages, as a sitemap (US-262).
 *
 * dist/sitemap.xml is written by scripts/prerender.mts from the routes it
 * rendered, and /:username is never prerendered — one page per tenant, served
 * by functions/[username].ts at request time. So the pages the product exists
 * to make visible, an agent's agentbio.net/<name>, were in no sitemap at all:
 * Google could find one only by following a link somebody else had posted.
 *
 * This is the request-time half. It asks PostgREST for published usernames with
 * the anon key — the same query shape and the same `is_published` filter
 * [username].ts uses to decide between a profile and a 404, so nothing listed
 * here answers 404 to the crawler that follows it.
 *
 * Failure is a 503, never an empty 200. A sitemap that suddenly lists nothing
 * reads as "every one of these pages is gone"; a 503 reads as "try later", and
 * Google keeps what it had.
 */
import { isReservedSegment } from './social-meta';
import { normalizeUsername } from '../../src/lib/username';

/** PostgREST's default max-rows on Supabase; one request never returns more. */
export const PAGE_SIZE = 1000;
/** The sitemap protocol's per-file ceiling. Past it, this needs a sitemap index. */
export const MAX_URLS = 50_000;
const UPSTREAM_TIMEOUT_MS = 5000;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ProfileSitemapEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The canonical path for each username, in order, de-duplicated.
 *
 * Normalised because [username].ts 301s anything that is not, and a sitemap
 * should list the address a URL ends at. A reserved segment is skipped: that
 * URL belongs to the app, and [username].ts never treats it as a profile.
 */
export function profilePaths(usernames: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const raw of usernames) {
    if (typeof raw !== 'string') continue;
    const username = normalizeUsername(raw);
    if (!username || isReservedSegment(username) || seen.has(username)) continue;
    seen.add(username);
    paths.push(`/${encodeURIComponent(username)}`);
  }
  return paths;
}

export function buildProfileSitemapXml(paths: readonly string[], origin: string): string {
  const base = origin.replace(/\/+$/, '');
  const urls = paths
    .map((path) =>
      [
        '  <url>',
        `    <loc>${escapeXml(`${base}${path}`)}</loc>`,
        // No <lastmod>: profiles.updated_at is not readable with the anon key
        // (US-235), and a made-up date is worse than none — see
        // scripts/lib/sitemap.mts for the same choice on static pages.
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.6</priority>',
        '  </url>',
      ].join('\n')
    )
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '\n</urlset>\n'
  );
}

async function fetchPage(
  fetchImpl: FetchLike,
  url: string,
  apiKey: string
): Promise<Array<{ username?: unknown }> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return Array.isArray(body) ? (body as Array<{ username?: unknown }>) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Every published username, paged. Null when any page fails: a partial list
 * would drop real agents from the sitemap as surely as an empty one.
 */
export async function fetchPublishedUsernames(
  env: ProfileSitemapEnv,
  fetchImpl: FetchLike
): Promise<string[] | null> {
  const restUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!restUrl || !apiKey) return null;
  const base = restUrl.replace(/\/$/, '');

  const usernames: string[] = [];
  for (let offset = 0; offset < MAX_URLS; offset += PAGE_SIZE) {
    // Ordered by the unique username so pages neither overlap nor skip.
    const rows = await fetchPage(
      fetchImpl,
      `${base}/rest/v1/profiles?select=username&is_published=is.true&order=username.asc&limit=${PAGE_SIZE}&offset=${offset}`,
      apiKey
    );
    if (rows === null) return null;
    for (const row of rows) {
      if (typeof row?.username === 'string') usernames.push(row.username);
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return usernames;
}

/** The whole response: a sitemap, or a 503 that tells the crawler to come back. */
export async function profileSitemapResponse(
  env: ProfileSitemapEnv,
  origin: string,
  fetchImpl: FetchLike
): Promise<Response> {
  const usernames = await fetchPublishedUsernames(env, fetchImpl);
  const paths = usernames ? profilePaths(usernames).slice(0, MAX_URLS) : [];

  if (paths.length === 0) {
    // An upstream failure, a missing binding, or no published profile at all.
    // The first two are certainly not "the site has no agents", and the third
    // is not worth risking that reading for.
    return new Response('Profile sitemap temporarily unavailable.\n', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '3600',
      },
    });
  }

  return new Response(buildProfileSitemapXml(paths, origin), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // An hour at the edge: crawlers fetch sitemaps often, and a newly
      // published agent appearing within the hour is soon enough.
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
