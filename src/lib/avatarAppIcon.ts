/**
 * The agent's home-screen icon (US-481, slice 1 of US-470).
 *
 * A homebuyer who adds agentbio.net/jane to their home screen installs Jane's
 * page (US-460), but the icon was the AgentBio logo: the manifest could only
 * list the platform icons, because an avatar is whatever the agent uploaded —
 * any size, any aspect ratio — and Chrome decides installability from the
 * icon sizes the manifest declares.
 *
 * So when the agent uploads a photo, the browser also renders it as square
 * PNGs at the two sizes Chrome selects from (192 and 512) and stores them next
 * to the photo, named after it:
 *
 *   avatars/<uid>/avatar-1700000000000.jpg
 *   avatars/<uid>/avatar-1700000000000-app-icon-192.png
 *   avatars/<uid>/avatar-1700000000000-app-icon-512.png
 *
 * Naming the icons after the photo means the manifest derives them from the
 * profile's current avatar_url: a new photo can never be paired with the
 * previous photo's icons, and a removed photo takes its icons with it. If the
 * icons are not there (an older upload, a browser that could not draw it) the
 * manifest keeps the platform icons.
 *
 * Pure and dependency-free: functions/_lib/profile-manifest.ts imports it.
 */

/** The sizes rendered, and declared in the per-profile manifest. */
export const APP_ICON_SIZES = [192, 512] as const;
export type AppIconSize = (typeof APP_ICON_SIZES)[number];

const ICON_SUFFIX = /-app-icon-\d+\.png$/;

/** `avatar-123.jpg` -> `avatar-123-app-icon-512.png`. */
export function appIconObjectName(avatarObjectName: string, size: AppIconSize): string {
  const dot = avatarObjectName.lastIndexOf('.');
  const stem = dot > 0 ? avatarObjectName.slice(0, dot) : avatarObjectName;
  return `${stem}-app-icon-${size}.png`;
}

/** Whether a storage object name is one of the rendered icons. */
export function isAppIconObjectName(name: string): boolean {
  return ICON_SUFFIX.test(name);
}

const PUBLIC_AVATARS = '/storage/v1/object/public/avatars/';

/**
 * The public URLs of the icons rendered for `avatarUrl`, or null when the
 * avatar is not an object in this project's avatars bucket.
 *
 * With `storageBase` (the Supabase URL), the avatar must be served from that
 * origin and path: the Pages Function asks whether the icons exist, and must
 * only ever ask our own storage. An avatar_url is agent-writable text.
 */
export function avatarAppIconUrls(
  avatarUrl: string | null | undefined,
  storageBase?: string
): Record<AppIconSize, string> | null {
  if (!avatarUrl) return null;
  let url: URL;
  try {
    url = new URL(avatarUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  let prefix = PUBLIC_AVATARS;
  if (storageBase) {
    let base: URL;
    try {
      base = new URL(storageBase);
    } catch {
      return null;
    }
    if (base.origin !== url.origin) return null;
    prefix = `${base.pathname.replace(/\/$/, '')}${PUBLIC_AVATARS}`;
  }

  const index = url.pathname.indexOf(PUBLIC_AVATARS);
  if (index < 0 || (storageBase && !url.pathname.startsWith(prefix))) return null;

  const rest = url.pathname.slice(index + PUBLIC_AVATARS.length);
  const parts = rest.split('/');
  if (parts.length !== 2) return null;
  const [folder, name] = parts;
  let decodedFolder: string;
  let decodedName: string;
  try {
    decodedFolder = decodeURIComponent(folder);
    decodedName = decodeURIComponent(name);
  } catch {
    return null;
  }
  if (!decodedFolder || !decodedName || decodedFolder === '..' || decodedName === '..') return null;
  if (isAppIconObjectName(decodedName)) return null;

  const dir = `${url.origin}${url.pathname.slice(0, index)}${PUBLIC_AVATARS}${folder}/`;
  const icons = {} as Record<AppIconSize, string>;
  for (const size of APP_ICON_SIZES) {
    icons[size] = `${dir}${encodeURIComponent(appIconObjectName(decodedName, size))}`;
  }
  return icons;
}

/**
 * The source rectangle that crops a `width` x `height` image to a square, so
 * a headshot is cropped rather than squashed. Landscape is cut from the
 * centre; portrait keeps more of the top than the bottom, because a headshot's
 * face sits in its upper half and a centred crop takes the top of the head.
 */
export function headshotSquare(
  width: number,
  height: number
): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return {
    sx: Math.round((width - side) / 2),
    sy: Math.round((height - side) / 3),
    side,
  };
}
