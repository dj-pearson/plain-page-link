import { IMAGE_VARIANT_WIDTHS, LISTING_PHOTO_BUCKET } from '@/lib/images';

/**
 * Which listing-photos objects a listing write has orphaned (US-451).
 *
 * Deleting a listing, or removing a photo from one, only changed the row. The
 * originals and the three WebP variants optimize-image writes beside each one
 * stayed in the public bucket for good: an agent who deleted a home (or took a
 * photo of a client's living room down) still had it served from our storage
 * origin to anyone holding the link, and the bucket grew without bound.
 *
 * These helpers are pure so the rules can be tested without storage:
 * - only objects in the listing-photos bucket, under the agent's own folder,
 *   are ever candidates (a hot-linked or imported URL, or another agent's
 *   object, is not ours to remove; storage RLS would refuse it anyway);
 * - a URL still used by any other listing of the agent is kept;
 * - a variant URL stored as a listing's photo is never removed on its own,
 *   since its original may still be in use.
 */

const PUBLIC_PREFIX = `/storage/v1/object/public/${LISTING_PHOTO_BUCKET}/`;
const VARIANT_NAME = new RegExp(`-(${IMAGE_VARIANT_WIDTHS.join('|')})\\.webp$`, 'i');

/** The photo URLs a listing row refers to: its gallery and its legacy cover. */
export function listingPhotoUrls(listing: {
  photos?: readonly string[] | null;
  image?: string | null;
}): string[] {
  const urls = [...(listing.photos ?? [])];
  if (listing.image) urls.push(listing.image);
  return urls.filter((u): u is string => typeof u === 'string' && u.length > 0);
}

/**
 * The object path of an original listing photo owned by `userId`, or null when
 * the URL is not one we may remove.
 */
export function ownedListingPhotoPath(url: string, userId: string): string | null {
  const path = ownedObjectPath(url, userId);
  if (!path) return null;
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  return VARIANT_NAME.test(fileName) ? null : path;
}

/** Any listing-photos object path (original or variant) owned by `userId`. */
function ownedObjectPath(url: string, userId: string): string | null {
  const queryAt = url.search(/[?#]/);
  const base = queryAt === -1 ? url : url.slice(0, queryAt);
  const at = base.indexOf(PUBLIC_PREFIX);
  if (at === -1) return null;

  let path: string;
  try {
    path = decodeURIComponent(base.slice(at + PUBLIC_PREFIX.length));
  } catch {
    return null;
  }
  // Owner folder only, and no path tricks.
  if (!userId || !path.startsWith(`${userId}/`)) return null;
  if (path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return null;
  }
  return path;
}

/** The original's path plus the paths of its optimize-image variants. */
export function withVariantPaths(path: string): string[] {
  const dot = path.lastIndexOf('.');
  const slash = path.lastIndexOf('/');
  const stem = dot > slash ? path.slice(0, dot) : path;
  return [path, ...IMAGE_VARIANT_WIDTHS.map((w) => `${stem}-${w}.webp`)];
}

/**
 * The storage paths to remove after `removed` URLs stopped being used, given
 * every URL that is still referenced by the agent's listings.
 */
export function orphanedListingPhotoPaths(params: {
  removed: readonly string[];
  stillReferenced: readonly string[];
  userId: string;
}): string[] {
  const { removed, stillReferenced, userId } = params;
  // Every object another listing still points at, variants included: a
  // listing whose stored photo is a variant URL keeps that object alive.
  const kept = new Set<string>();
  for (const url of stillReferenced) {
    const path = ownedObjectPath(url, userId);
    if (path) kept.add(path);
  }

  const out = new Set<string>();
  for (const url of removed) {
    const path = ownedListingPhotoPath(url, userId);
    if (!path || kept.has(path)) continue;
    for (const p of withVariantPaths(path)) if (!kept.has(p)) out.add(p);
  }
  return [...out];
}
