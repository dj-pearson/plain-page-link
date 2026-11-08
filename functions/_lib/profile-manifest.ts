/**
 * A web app manifest for one agent's public page (US-460, fixing US-450).
 *
 * Every page linked the one /manifest.json, whose start_url US-436 moved to
 * /dashboard. A homebuyer who tapped Add to Home Screen on agentbio.net/jane
 * got an icon that opened the AgentBio dashboard and, signed out, its login
 * screen — the agent's page was nowhere. Before US-436 it opened the marketing
 * homepage, which was no better.
 *
 * ProfileRoute now points <link rel="manifest"> at /:username/manifest.json,
 * which functions/[username]/manifest.json.ts answers from here: an app whose
 * identity, start_url and scope are the agent's page. The dashboard manifest
 * keeps id "/", so an agent's own install is a different app and is untouched.
 *
 * Scope is "/jane", not "/jane/": start_url has to be inside the scope and
 * the page's address has no trailing slash. A scope is a path prefix, so
 * "/jane" also covers "/janedoe"; the cost is that a link from Jane's page to
 * Jane Doe's stays in the installed window, which is harmless.
 *
 * Only published profiles get one. An unpublished or unknown username is a
 * 404, which leaves the browser with no manifest: the home-screen icon is then
 * a plain bookmark of the page the visitor was on, which is still right.
 *
 * The icons are the agent's photo when the avatar upload stored square
 * renders of it (US-481, src/lib/avatarAppIcon.ts), listed ahead of the
 * platform icons, which stay as the fallback. They are listed only after a
 * HEAD request finds both: a declared icon that does not load costs Chrome's
 * installability check, which a logo never does.
 *
 * Pure — no Workers globals — so it is tested directly.
 */
import { isReservedSegment } from './social-meta';
import { needsCanonicalRedirect } from '../../src/lib/username';
import { APP_ICON_SIZES, avatarAppIconUrls, type AppIconSize } from '../../src/lib/avatarAppIcon';

export interface ProfileManifestEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export interface ManifestProfile {
  username: string;
  full_name: string | null;
  avatar_url?: string | null;
}

/** Icon URLs by size, as avatarAppIconUrls returns them. */
export type AvatarIcons = Record<AppIconSize, string>;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** The platform icons in public/icons; the same files the dashboard app uses. */
const ICON_SIZES = [192, 384, 512] as const;

/** Android truncates a home-screen label beyond about twelve characters. */
const SHORT_NAME_MAX = 12;

const UPSTREAM_TIMEOUT_MS = 4000;

/** The icon check is optional; a slow one should not hold the manifest. */
const ICON_CHECK_TIMEOUT_MS = 2000;

/** The path of the manifest for `username`, as ProfileRoute links it. */
export function profileManifestPath(username: string): string {
  return `/${encodeURIComponent(username)}/manifest.json`;
}

function shortName(name: string): string {
  if (name.length <= SHORT_NAME_MAX) return name;
  const first = name.split(/\s+/)[0] ?? name;
  return first.length <= SHORT_NAME_MAX ? first : `${first.slice(0, SHORT_NAME_MAX - 1)}…`;
}

export function buildProfileManifest(
  profile: ManifestProfile,
  avatarIcons: AvatarIcons | null = null
): Record<string, unknown> {
  const page = `/${encodeURIComponent(profile.username)}`;
  const name = profile.full_name?.trim() || profile.username;
  return {
    // Its own identity: never "/", which is the agent's dashboard app.
    id: page,
    name,
    short_name: shortName(name),
    description: `Listings and contact details for ${name}`,
    start_url: page,
    scope: page,
    display: 'standalone',
    background_color: '#ffffff',
    // SEO_CONFIG.themeColor; src/config/theme-color.test.ts holds them equal.
    theme_color: '#2563eb',
    // The agent's photo first. Chrome takes the icon nearest the size it
    // wants and, at equal sizes, the first one listed — so the photo wins at
    // every size it comes in, and the logo is dropped at sizes it does not
    // (a 384 logo would otherwise beat a 512 photo on a screen that wants
    // 256-384).
    icons: [
      ...(avatarIcons
        ? APP_ICON_SIZES.map((size) => ({
            src: avatarIcons[size],
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any',
          }))
        : []),
      ...ICON_SIZES.filter(
        (size) => !avatarIcons || (APP_ICON_SIZES as readonly number[]).includes(size)
      ).map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any',
      })),
    ],
  };
}

/**
 * The agent's photo icons when every size is stored, else null. Any failure,
 * including a timeout, is "not stored": the platform icon is always safe.
 */
export async function findAvatarIcons(
  avatarUrl: string | null | undefined,
  storageBase: string,
  fetchImpl: FetchLike
): Promise<AvatarIcons | null> {
  const icons = avatarAppIconUrls(avatarUrl, storageBase);
  if (!icons) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ICON_CHECK_TIMEOUT_MS);
  try {
    const found = await Promise.all(
      APP_ICON_SIZES.map(async (size) => {
        const response = await fetchImpl(icons[size], {
          method: 'HEAD',
          signal: controller.signal,
        });
        return response.ok;
      })
    );
    return found.every(Boolean) ? icons : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The answer for GET /:username/manifest.json.
 *
 * 404 for anything that is not a canonical, published username; 503 (never
 * cached) when the database cannot be asked, so a blip is not remembered as
 * "this agent has no app".
 */
export async function profileManifestResponse(
  segment: string | undefined,
  env: ProfileManifestEnv,
  fetchImpl: FetchLike
): Promise<Response> {
  const notFound = () =>
    new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=0, s-maxage=60' },
    });
  const unavailable = () =>
    new Response('Unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' },
    });

  // ProfileRoute links the normalised username; anything else is not a link
  // this site produces.
  if (!segment || isReservedSegment(segment) || needsCanonicalRedirect(segment)) {
    return notFound();
  }

  const restUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!restUrl || !apiKey) return unavailable();

  const base = restUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let rows: ManifestProfile[];
  try {
    const response = await fetchImpl(
      `${base}/rest/v1/profiles?select=username,full_name,avatar_url&username=eq.${encodeURIComponent(segment)}&is_published=is.true&limit=1`,
      {
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: controller.signal,
      }
    );
    if (!response.ok) return unavailable();
    rows = (await response.json()) as ManifestProfile[];
  } catch {
    return unavailable();
  } finally {
    clearTimeout(timer);
  }

  const profile = Array.isArray(rows) ? rows[0] : undefined;
  if (!profile) return notFound();

  const avatarIcons = await findAvatarIcons(profile.avatar_url, base, fetchImpl);

  return new Response(JSON.stringify(buildProfileManifest(profile, avatarIcons)), {
    status: 200,
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      // A renamed agent shows up within five minutes; a viral profile does not
      // turn every visit into a database read.
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
