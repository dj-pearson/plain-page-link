/**
 * The avatar's small companion image (US-604).
 *
 * Since US-591 the stored avatar is at most 800px, which is still about three
 * times what a phone needs for the 96-128px circle above the fold on the
 * public profile (ProfileHeader), and far more than the 48px and 32px avatars
 * in StickyActionBar and on a listing page. So an upload also stores a WebP
 * scaled to 256px on its short side next to the photo, and the public page
 * draws that.
 *
 * Whether a companion exists is written into the photo's own name, so the page
 * never has to ask storage and never requests one that is not there:
 *
 *   avatars/<uid>/avatar-1700000000000.jpg       older upload, no companion
 *   avatars/<uid>/avatar-1700000000000-full.jpg  has a companion:
 *   avatars/<uid>/avatar-1700000000000-256.webp
 *
 * Only an upload whose companion was stored first is given the `-full` name.
 * Guessing a companion for every avatar (as listing photos do with their
 * variants) would make every agent who uploaded before this change - nearly
 * all of them - pay a 404 in the LCP region before the fallback.
 *
 * Pure and dependency-free.
 */

/** Short side of the companion, in pixels: a 128px circle at DPR 2. */
export const AVATAR_VARIANT_SIDE = 256;

const FULL_MARKER = '-full';
const VARIANT_SUFFIX = `-${AVATAR_VARIANT_SIDE}.webp`;
const PUBLIC_AVATARS = '/storage/v1/object/public/avatars/';

/** `avatar-<stamp>-full.jpg` when a companion was stored, else `avatar-<stamp>.jpg`. */
export function avatarObjectName(stem: string, ext: string, hasVariant: boolean): string {
  return `${stem}${hasVariant ? FULL_MARKER : ''}.${ext}`;
}

/** `avatar-<stamp>` -> `avatar-<stamp>-256.webp`. */
export function avatarVariantObjectName(stem: string): string {
  return `${stem}${VARIANT_SUFFIX}`;
}

/**
 * The companion's public URL for an avatar_url, or null when it has none: not
 * an object in an avatars bucket, or not named `-full` (an older upload, a
 * browser that could not encode WebP, a hot-linked image).
 */
export function avatarVariantUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  const queryAt = avatarUrl.search(/[?#]/);
  const base = queryAt === -1 ? avatarUrl : avatarUrl.slice(0, queryAt);
  if (!/^https?:\/\//i.test(base) || !base.includes(PUBLIC_AVATARS)) return null;

  const fileName = base.slice(base.lastIndexOf('/') + 1);
  const match = /^(.+)-full\.[A-Za-z0-9]+$/.exec(fileName);
  if (!match) return null;
  return `${base.slice(0, base.length - fileName.length)}${avatarVariantObjectName(match[1])}`;
}

/** What an avatar <img> needs: the image to draw, and the photo to fall back to. */
export interface AvatarImage {
  src: string;
  original: string;
}

export function avatarImage(avatarUrl: string): AvatarImage {
  return { src: avatarVariantUrl(avatarUrl) ?? avatarUrl, original: avatarUrl };
}

/**
 * onError for an avatar <img>: if the companion failed (deleted, or a storage
 * hiccup), load the full photo once. A failing photo is left alone, as it was
 * before - there is no house placeholder for a face.
 */
export function fallBackToAvatarOriginal(img: HTMLImageElement, original: string): void {
  if (img.dataset.avatarFallback || img.getAttribute('src') === original) return;
  img.dataset.avatarFallback = 'original';
  img.src = original;
}
