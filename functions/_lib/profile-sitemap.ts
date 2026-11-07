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
 *
 * US-372: each agent's listing pages (/:username/listing/:id, US-275) follow
 * the agent's own URL. They are not prerendered either: their crawler half is
 * functions/[username]/listing/[listingId].ts, which writes the share card at
 * request time, the same way profiles are served, so a build-time file could
 * only go stale. This sitemap is where a crawler learns they exist. Which
 * listings appear follows selectListingForPage, the rule the page itself
 * applies: a listing hidden by show_listings, or a sold one hidden by
 * show_sold_properties, is not found at its own address and is not listed.
 * The listings and user_settings reads are anon reads, so RLS already drops
 * unpublished agents, sample rows and drafts (US-308, US-110).
 */
import { isReservedSegment } from './social-meta';
import { normalizeUsername } from '../../src/lib/username';
import { listingPagePath } from '../../src/lib/listingShare';
import { selectListingForPage } from '../../src/lib/publicListingVisibility';

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

export interface SitemapEntry {
  path: string;
  /** W3C datetime; only when the row carries a real modification time. */
  lastmod?: string;
  priority: string;
}

export interface PublishedProfileRow {
  id?: unknown;
  username?: unknown;
}

export interface PublicListingRow {
  id?: unknown;
  user_id?: unknown;
  status?: unknown;
  updated_at?: unknown;
}

export interface VisibilitySettingsRow {
  user_id?: unknown;
  show_listings?: unknown;
  show_sold_properties?: unknown;
}

const PROFILE_PRIORITY = '0.6';
const LISTING_PRIORITY = '0.5';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The address [username].ts serves a username at, or null when it never
 * serves one there. Normalised because [username].ts 301s anything that is
 * not, and a sitemap should list the address a URL ends at. A reserved segment
 * belongs to the app, and [username].ts never treats it as a profile.
 */
function canonicalUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const username = normalizeUsername(raw);
  if (!username || isReservedSegment(username)) return null;
  return username;
}

/** The canonical path for each username, in order, de-duplicated. */
export function profilePaths(usernames: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const raw of usernames) {
    const username = canonicalUsername(raw);
    if (!username || seen.has(username)) continue;
    seen.add(username);
    paths.push(`/${encodeURIComponent(username)}`);
  }
  return paths;
}

/** A PostgREST timestamp as an ISO datetime, or undefined when it is not one. */
function toLastmod(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

const asFlag = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

interface VisibleListing {
  id: string;
  lastmod?: string;
}

/**
 * Every URL the sitemap lists: each published agent's page, followed by the
 * listing pages a visitor can open from it (US-372).
 *
 * An agent with no user_settings row shows everything, the same default the
 * profile page uses. A listing whose agent is not among `profiles` (or whose
 * username is reserved) is skipped: its page would not resolve.
 */
export function sitemapEntries(
  profiles: readonly PublishedProfileRow[],
  listings: readonly PublicListingRow[] = [],
  settings: readonly VisibilitySettingsRow[] = []
): SitemapEntry[] {
  const settingsByUser = new Map<
    string,
    { show_listings: boolean | null; show_sold_properties: boolean | null }
  >();
  for (const row of settings) {
    if (typeof row?.user_id !== 'string') continue;
    settingsByUser.set(row.user_id, {
      show_listings: asFlag(row.show_listings),
      show_sold_properties: asFlag(row.show_sold_properties),
    });
  }

  const listingsByUser = new Map<string, VisibleListing[]>();
  for (const row of listings) {
    if (typeof row?.id !== 'string' || row.id === '' || typeof row.user_id !== 'string') continue;
    const candidate = { id: row.id, status: typeof row.status === 'string' ? row.status : null };
    if (!selectListingForPage([candidate], candidate.id, settingsByUser.get(row.user_id))) continue;
    const forUser = listingsByUser.get(row.user_id) ?? [];
    forUser.push({ id: row.id, lastmod: toLastmod(row.updated_at) });
    listingsByUser.set(row.user_id, forUser);
  }

  const seenUsernames = new Set<string>();
  const seenUsers = new Set<string>();
  const entries: SitemapEntry[] = [];
  for (const profile of profiles) {
    const username = canonicalUsername(profile?.username);
    if (!username || seenUsernames.has(username)) continue;
    seenUsernames.add(username);
    entries.push({ path: `/${encodeURIComponent(username)}`, priority: PROFILE_PRIORITY });

    const userId = typeof profile.id === 'string' ? profile.id : null;
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    for (const listing of listingsByUser.get(userId) ?? []) {
      entries.push({
        path: listingPagePath(username, listing.id),
        lastmod: listing.lastmod,
        priority: LISTING_PRIORITY,
      });
    }
  }
  return entries;
}

export function buildProfileSitemapXml(entries: readonly SitemapEntry[], origin: string): string {
  const base = origin.replace(/\/+$/, '');
  const urls = entries
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(`${base}${entry.path}`)}</loc>`,
        // A profile has no <lastmod>: profiles.updated_at is not readable with
        // the anon key (US-235), and a made-up date is worse than none — see
        // scripts/lib/sitemap.mts for the same choice on static pages. A
        // listing carries listings.updated_at, which anon can read.
        ...(entry.lastmod ? [`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`] : []),
        '    <changefreq>weekly</changefreq>',
        `    <priority>${entry.priority}</priority>`,
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

async function fetchPage<T>(
  fetchImpl: FetchLike,
  url: string,
  apiKey: string
): Promise<T[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return Array.isArray(body) ? (body as T[]) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function restBinding(env: ProfileSitemapEnv): { base: string; apiKey: string } | null {
  const restUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!restUrl || !apiKey) return null;
  return { base: restUrl.replace(/\/$/, ''), apiKey };
}

/**
 * Every row of one PostgREST query, paged by PAGE_SIZE up to MAX_URLS. Null
 * when the binding is missing or any page fails: a partial list would drop
 * real pages from the sitemap as surely as an empty one. `query` must order by
 * a unique column, so pages neither overlap nor skip.
 */
async function fetchAllRows<T>(
  env: ProfileSitemapEnv,
  fetchImpl: FetchLike,
  query: string
): Promise<T[] | null> {
  const binding = restBinding(env);
  if (!binding) return null;
  const rows: T[] = [];
  for (let offset = 0; offset < MAX_URLS; offset += PAGE_SIZE) {
    const page = await fetchPage<T>(
      fetchImpl,
      `${binding.base}/rest/v1/${query}&limit=${PAGE_SIZE}&offset=${offset}`,
      binding.apiKey
    );
    if (page === null) return null;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Every published profile's id and username, ordered by the unique username. */
export function fetchPublishedProfiles(
  env: ProfileSitemapEnv,
  fetchImpl: FetchLike
): Promise<PublishedProfileRow[] | null> {
  return fetchAllRows<PublishedProfileRow>(
    env,
    fetchImpl,
    'profiles?select=id,username&is_published=is.true&order=username.asc'
  );
}

/**
 * Every listing a visitor may read. The status filter repeats the anon RLS
 * policy, so a policy that ever widened would not widen the sitemap with it.
 */
export function fetchPublicListings(
  env: ProfileSitemapEnv,
  fetchImpl: FetchLike
): Promise<PublicListingRow[] | null> {
  return fetchAllRows<PublicListingRow>(
    env,
    fetchImpl,
    'listings?select=id,user_id,status,updated_at&status=in.(active,pending,under_contract,sold)&order=id.asc'
  );
}

/**
 * The listing toggles of every published agent who has saved settings. Anon
 * reads exactly these columns, for published agents only (US-110); user_id is
 * unique on user_settings, so it orders the pages.
 */
export function fetchVisibilitySettings(
  env: ProfileSitemapEnv,
  fetchImpl: FetchLike
): Promise<VisibilitySettingsRow[] | null> {
  return fetchAllRows<VisibilitySettingsRow>(
    env,
    fetchImpl,
    'user_settings?select=user_id,show_listings,show_sold_properties&order=user_id.asc'
  );
}

function unavailable(): Response {
  return new Response('Profile sitemap temporarily unavailable.\n', {
    status: 503,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '3600',
    },
  });
}

/** The whole response: a sitemap, or a 503 that tells the crawler to come back. */
export async function profileSitemapResponse(
  env: ProfileSitemapEnv,
  origin: string,
  fetchImpl: FetchLike
): Promise<Response> {
  if (!restBinding(env)) return unavailable();

  const [profiles, listings, settings] = await Promise.all([
    fetchPublishedProfiles(env, fetchImpl),
    fetchPublicListings(env, fetchImpl),
    // Without the toggles, a listing the agent hid would be listed, so a
    // failed settings read fails the sitemap rather than defaulting to "show".
    fetchVisibilitySettings(env, fetchImpl),
  ]);
  const entries =
    profiles && listings && settings
      ? sitemapEntries(profiles, listings, settings).slice(0, MAX_URLS)
      : [];

  if (entries.length === 0) {
    // An upstream failure, a missing binding, or no published profile at all.
    // The first two are certainly not "the site has no agents", and the third
    // is not worth risking that reading for.
    return unavailable();
  }

  return new Response(buildProfileSitemapXml(entries, origin), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // An hour at the edge: crawlers fetch sitemaps often, and a newly
      // published agent appearing within the hour is soon enough.
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
