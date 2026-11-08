/**
 * Store the home-screen icons for a photo uploaded before they existed (US-492,
 * the backfill US-481 left open).
 *
 * Since US-481 every avatar upload also stores `<photo>-app-icon-192/512.png`
 * next to the photo, and the agent's page manifest lists them once both are
 * there (functions/_lib/profile-manifest.ts findAvatarIcons). A photo uploaded
 * before that has no icons, so a homebuyer who adds that agent's page to their
 * home screen still gets the AgentBio logo — until the agent happens to upload
 * a new photo, which most never will.
 *
 * So when the agent opens the dashboard, the browser asks storage whether the
 * 512 icon exists and, if storage says it does not, downloads the photo,
 * renders both icons and uploads them under the names the manifest derives.
 *
 * - Only the signed-in agent's own photo, in this project's avatars bucket and
 *   in their own folder (the only one storage lets them write).
 * - No work when there is no photo or the icon is already there.
 * - Silent: any failure leaves things as they were and is tried again on a
 *   later visit. Once per photo per page load, so moving between dashboard
 *   pages does not repeat the check.
 */
import { avatarAppIconUrls } from '@/lib/avatarAppIcon';
import { logger } from '@/lib/logger';

export type BackfillOutcome =
  /** No photo, or not an object in our avatars bucket under this agent's folder. */
  | 'not-applicable'
  /** Both icons are already stored (the 512 answered). */
  | 'present'
  /** The icons were rendered and stored. */
  | 'stored'
  /** Storage could not be asked, the photo could not be read, or storing failed. */
  | 'failed'
  /** Already attempted for this photo during this page load. */
  | 'skipped';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface BackfillDeps {
  /** The Supabase URL; the photo must be served from its storage. */
  storageBase: string;
  fetchImpl: FetchLike;
  /** storeAvatarAppIcons, bound to the avatars bucket. Returns the names stored. */
  store: (userId: string, objectName: string, photo: Blob) => Promise<string[]>;
}

/**
 * Storage's answer for an object that is not there. Self-hosted storage answers
 * 404; older storage-api versions answer 400 with a not_found body. Anything
 * else (5xx, 401/403, a network error) is "could not tell", not "missing".
 */
function isMissing(status: number): boolean {
  return status === 404 || status === 400;
}

const attempted = new Set<string>();

/** Test hook: forget which photos this page load has already checked. */
export function resetBackfillMemo(): void {
  attempted.clear();
}

/** The decoded `<folder>/<name>` of a public avatars object URL. */
function objectPath(avatarUrl: string): { folder: string; name: string } | null {
  try {
    const segments = new URL(avatarUrl).pathname.split('/');
    const name = decodeURIComponent(segments[segments.length - 1] ?? '');
    const folder = decodeURIComponent(segments[segments.length - 2] ?? '');
    return folder && name ? { folder, name } : null;
  } catch {
    return null;
  }
}

export async function backfillAvatarAppIcons(
  userId: string | null | undefined,
  avatarUrl: string | null | undefined,
  deps: BackfillDeps
): Promise<BackfillOutcome> {
  if (!userId || !avatarUrl) return 'not-applicable';
  // Validates origin, bucket and shape, and refuses an icon URL as the photo.
  const icons = avatarAppIconUrls(avatarUrl, deps.storageBase);
  const path = icons ? objectPath(avatarUrl) : null;
  if (!icons || !path || path.folder !== userId) return 'not-applicable';

  if (attempted.has(avatarUrl)) return 'skipped';
  attempted.add(avatarUrl);

  try {
    const head = await deps.fetchImpl(icons[512], { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return 'present';
    if (!isMissing(head.status)) return 'failed';

    const photo = await deps.fetchImpl(avatarUrl, { cache: 'no-store' });
    if (!photo.ok) return 'failed';
    const blob = await photo.blob();

    const stored = await deps.store(userId, path.name, blob);
    return stored.length > 0 ? 'stored' : 'failed';
  } catch (error) {
    logger.warn('Could not backfill the home-screen icon', { error });
    return 'failed';
  }
}
