import { supabase } from '@/integrations/supabase/client';

/**
 * Shown when a listing has no usable photo, and by every `onError` handler.
 *
 * It used to be '/placeholder-property.jpg', and there has never been such a
 * file in public/. Cloudflare Pages answered it with the SPA's index.html under
 * a JPEG content type, so the browser got 5.8 KB of markup where an image
 * should be and drew a broken-image icon - including from the onError handlers
 * whose whole job was to replace a broken image.
 */
export const PLACEHOLDER_PROPERTY_IMAGE = '/placeholder-property.svg';

/**
 * The bucket listing photos actually live in.
 *
 * Every call site passed 'listings', which is not a bucket in any environment;
 * 20260808000005_storage_buckets_and_policies.sql standardised on
 * 'listing-photos' and useListingImageUpload has uploaded there since US-107.
 * The mismatch only ever hid because uploads store an absolute public URL,
 * which getImageUrl returns untouched - a listing holding a bare storage path
 * resolved against a bucket that does not exist.
 */
export const LISTING_PHOTO_BUCKET = 'listing-photos';

/**
 * The widths optimize-image writes beside every listing photo (US-032/US-107).
 *
 * For an original at `listing-photos/<user>/<listing>/<id>.jpg` it stores
 * `<id>-200.webp`, `<id>-400.webp` and `<id>-800.webp` in the same folder
 * (`variantPath` in supabase/functions/optimize-image/index.ts, invoked by
 * useListingImageUpload). Nothing else produces variants: avatars are stored
 * as uploaded, and a photo hot-linked from elsewhere has no siblings at all.
 */
export const IMAGE_VARIANT_WIDTHS = [200, 400, 800] as const;
export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

/** Where a public object of the listing-photos bucket sits in its URL. */
const LISTING_PHOTO_PUBLIC_PREFIX = `/storage/v1/object/public/${LISTING_PHOTO_BUCKET}/`;

/**
 * The URL of the `width` variant of a listing photo, or null when no such
 * variant can exist.
 *
 * Only a public URL in the listing-photos bucket can have one. Even then it
 * may be missing - photos uploaded before US-107 fixed the bucket name were
 * never optimized, and optimization is best-effort - so every <img> that uses
 * one must fall back to the original on error (`fallBackToOriginal`).
 */
export function imageVariantUrl(url: string, width: ImageVariantWidth): string | null {
  const queryAt = url.search(/[?#]/);
  const base = queryAt === -1 ? url : url.slice(0, queryAt);
  if (!base.includes(LISTING_PHOTO_PUBLIC_PREFIX)) return null;

  const fileName = base.slice(base.lastIndexOf('/') + 1);
  if (!fileName) return null;
  // Already a variant: there is no variant of a variant.
  if (/-(200|400|800)\.webp$/i.test(fileName)) return null;

  // Same rule as optimize-image's variantPath: drop the last extension.
  const dot = fileName.lastIndexOf('.');
  const stem = dot === -1 ? fileName : fileName.slice(0, dot);
  return `${base.slice(0, base.length - fileName.length)}${stem}-${width}.webp`;
}

export interface GetImageUrlOptions {
  bucket?: string;
  /**
   * Ask for the optimized WebP variant of this width. Returns the original
   * whenever no variant can exist (see `imageVariantUrl`).
   */
  width?: ImageVariantWidth;
}

/**
 * Convert a Supabase Storage path to a public URL.
 * If the path is already a full URL, return it as-is.
 *
 * The second argument is the bucket (a string, as older callers pass it) or
 * `{ bucket, width }`.
 */
export function getImageUrl(
  path: string | null | undefined,
  bucketOrOptions: string | GetImageUrlOptions = LISTING_PHOTO_BUCKET
): string {
  const { bucket = LISTING_PHOTO_BUCKET, width }: GetImageUrlOptions =
    typeof bucketOrOptions === 'string' ? { bucket: bucketOrOptions } : bucketOrOptions;

  if (!path) {
    return PLACEHOLDER_PROPERTY_IMAGE;
  }

  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Already a full URL (http/https): use it as-is
    url = path;
  } else {
    // Otherwise, convert to public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    url = data.publicUrl;
  }

  if (width === undefined) return url;
  return imageVariantUrl(url, width) ?? url;
}

/** What an <img> needs to serve a listing photo at the size it is shown. */
export interface ResponsiveImage {
  /** The 800px variant when variants exist, else the original. */
  src: string;
  /** `<200> 200w, <400> 400w, <800> 800w`, or undefined without variants. */
  srcSet: string | undefined;
  /** The untouched original, for `fallBackToOriginal`. */
  original: string;
}

/**
 * src/srcSet for a listing photo.
 *
 * The original - often a multi-megabyte phone photo - is deliberately left out
 * of the srcSet: its width is unknown, and a DPR-3 phone wanting a full-width
 * image would pick it every time, which is the download this exists to avoid.
 * 800px is the largest variant optimize-image makes.
 */
export function responsiveImage(path: string | null | undefined): ResponsiveImage {
  const original = getImageUrl(path);
  const largest = imageVariantUrl(original, 800);
  if (!largest) {
    return { src: original, srcSet: undefined, original };
  }
  const srcSet = IMAGE_VARIANT_WIDTHS.map((w) => `${imageVariantUrl(original, w)} ${w}w`).join(
    ', '
  );
  return { src: largest, srcSet, original };
}

/**
 * `sizes` for the featured-listing carousel: full width up to the profile
 * page's max-w-5xl column. FullProfilePage's preload uses the same value, so
 * the preloaded candidate is the one the <img> then asks for.
 */
export const FEATURED_LISTING_IMAGE_SIZES = '(min-width: 1024px) 1024px, 100vw';

/** `sizes` for ListingCard: the 1 / 2 / 3-column grids it is rendered in. */
export const LISTING_CARD_IMAGE_SIZES = '(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw';

/**
 * fetchpriority="high", spread onto an <img>. React 18 does not know the
 * camelCase `fetchPriority` prop and warns about it, but passes a lowercase
 * attribute through untouched.
 */
export const HIGH_FETCH_PRIORITY: Record<string, string> = { fetchpriority: 'high' };

/**
 * Add a high-priority `<link rel="preload" as="image">` for one responsive
 * image, and return a cleanup that removes exactly that link.
 *
 * imagesrcset/imagesizes must match the <img>'s srcSet/sizes; a preload of
 * the bare `src` would fetch a candidate the <img> then never uses, and the
 * photo would download twice. The cleanup used to remove every image preload
 * in the document, including ones it never added.
 */
export function addImagePreload(image: ResponsiveImage, sizes: string): () => void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.setAttribute('as', 'image');
  link.href = image.src;
  if (image.srcSet) {
    link.setAttribute('imagesrcset', image.srcSet);
    link.setAttribute('imagesizes', sizes);
  }
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
  return () => link.remove();
}

/**
 * onError for an <img> built from `responsiveImage`.
 *
 * First failure with a srcset: the variant is missing (an older upload, or
 * optimize-image failed), so drop the srcset and load the original. Any later
 * failure: show the placeholder - once, so a failing placeholder cannot loop.
 */
export function fallBackToOriginal(img: HTMLImageElement, original: string): void {
  const stage = img.dataset.imageFallback;
  if (stage === 'placeholder') return;

  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  if (!stage && original !== PLACEHOLDER_PROPERTY_IMAGE && img.src !== original) {
    img.dataset.imageFallback = 'original';
    img.src = original;
    return;
  }
  img.dataset.imageFallback = 'placeholder';
  img.src = PLACEHOLDER_PROPERTY_IMAGE;
}

/**
 * Get public URLs for an array of image paths
 */
export function getImageUrls(
  paths: string[] | null | undefined,
  bucket: string = LISTING_PHOTO_BUCKET
): string[] {
  if (!paths || paths.length === 0) {
    return [PLACEHOLDER_PROPERTY_IMAGE];
  }

  return paths.map((path) => getImageUrl(path, bucket));
}
