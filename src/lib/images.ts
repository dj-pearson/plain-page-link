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
 * Convert a Supabase Storage path to a public URL.
 * If the path is already a full URL, return it as-is.
 */
export function getImageUrl(
  path: string | null | undefined,
  bucket: string = LISTING_PHOTO_BUCKET
): string {
  if (!path) {
    return PLACEHOLDER_PROPERTY_IMAGE;
  }

  // If it's already a full URL (http/https), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, convert to public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
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
