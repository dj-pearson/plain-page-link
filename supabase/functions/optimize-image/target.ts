/**
 * Which stored object optimize-image may read, and where its variants go.
 *
 * US-633: the handler checked only `path.startsWith(`${user.id}/`)` and took
 * the bucket from the body, then read and wrote with the service-role client.
 * Storage paths are URL paths: supabase-js puts them in the request URL as
 * given, and URL parsing collapses `..` (and its encoded form `%2e%2e`). So
 * `<me>/../<victim>/photo.jpg` passed the prefix check and read the victim's
 * object, and a path built so that the part before its last literal dot
 * collapses into the victim's folder while the whole path collapses onto the
 * caller's own upload wrote the caller's image over the victim's
 * `-200/-400/-800.webp` variants: the files every public listing page
 * serves. The bucket was any bucket, private ones included.
 *
 * Now the path must be the shape the upload flow writes
 * (`<uid>/<listing or timestamp>/<random>.<ext>`, useListingImageUpload.ts):
 * plain segments only, the first one the caller's id, nothing a URL parser
 * would rewrite. The bucket must be listing-photos, the only bucket with
 * variants (avatars deliberately have none; see ProfileHeader.tsx).
 */

export const OPTIMIZABLE_BUCKETS: readonly string[] = ['listing-photos'];

/** Longest object path accepted; the upload flow's paths are under 120. */
export const MAX_PATH_LENGTH = 512;

/**
 * One path segment: starts with a letter or digit (so never `.` or `..`),
 * then letters, digits, `_`, `-` and `.`. Nothing percent-encoded, no
 * backslash, `?`, `#` or whitespace, all of which a URL parser or the storage
 * API could read differently from this check.
 */
const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

export type OptimizeTarget =
  | { ok: true; bucket: string; path: string }
  | { ok: false; status: 400 | 403; code: string; message: string };

const refuse = (status: 400 | 403, code: string, message: string): OptimizeTarget => ({
  ok: false,
  status,
  code,
  message,
});

export function parseOptimizeTarget(body: unknown, userId: string): OptimizeTarget {
  const { bucket, path } = (body ?? {}) as { bucket?: unknown; path?: unknown };

  if (typeof bucket !== 'string' || typeof path !== 'string' || !bucket || !path) {
    return refuse(400, 'REQUEST_VALIDATION_FAILED', 'bucket and path are required');
  }

  if (!OPTIMIZABLE_BUCKETS.includes(bucket)) {
    return refuse(403, 'FORBIDDEN', 'Images in this bucket are not optimized');
  }

  if (path.length > MAX_PATH_LENGTH) {
    return refuse(400, 'REQUEST_VALIDATION_FAILED', 'path is too long');
  }

  const segments = path.split('/');
  if (segments.length < 2 || !segments.every((segment) => SEGMENT_RE.test(segment))) {
    return refuse(400, 'REQUEST_VALIDATION_FAILED', 'path is not a valid object path');
  }

  // Compared as a whole segment, after the shape check above, so neither
  // `<uid>x/...` nor `<uid>/../<other>/...` can stand in for the caller.
  if (!userId || segments[0] !== userId) {
    return refuse(403, 'FORBIDDEN', 'Forbidden: cannot optimize this object');
  }

  return { ok: true, bucket, path };
}

/** Derive a variant object path: photo.jpg -> photo-400.webp */
export function variantPath(originalPath: string, width: number): string {
  const slash = originalPath.lastIndexOf('/');
  const dot = originalPath.lastIndexOf('.');
  // Only a dot in the file name starts an extension (`<uid>/a.b/c` has none).
  const stem = dot > slash ? originalPath.slice(0, dot) : originalPath;
  return `${stem}-${width}.webp`;
}
