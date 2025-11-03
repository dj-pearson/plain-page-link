import { supabase } from "@/integrations/supabase/client";

/**
 * Convert a Supabase Storage path to a public URL
 * If the path is already a full URL, return it as-is
 */
export function getImageUrl(path: string | null | undefined, bucket: string = 'listings'): string {
  if (!path) {
    return '/placeholder-property.jpg';
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
export function getImageUrls(paths: string[] | null | undefined, bucket: string = 'listings'): string[] {
  if (!paths || paths.length === 0) {
    return ['/placeholder-property.jpg'];
  }

  return paths.map(path => getImageUrl(path, bucket));
}

