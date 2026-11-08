/**
 * Downscale a headshot or brokerage logo in the browser before it is stored
 * (US-591).
 *
 * Avatars and logos are served exactly as uploaded: optimize-image only writes
 * variants for listing photos (IMAGE_VARIANT_WIDTHS in images.ts). A phone
 * headshot is typically 3-5 MB at 3000-4000px, and the public profile draws it
 * at 96-128 CSS px above the fold (ProfileHeader, StickyActionBar), so the
 * single largest request on most agents' pages was a photo some forty times
 * wider than its box, competing with the page's own LCP. The logo is drawn
 * 20px tall from a file of up to 2 MB.
 *
 * Re-encoding here costs nothing on the server and needs no new storage
 * objects or URL scheme: the stored file simply is the small one.
 *
 * Best effort, never throws: a browser that cannot decode or encode the image
 * keeps the original, which is what every upload stored before.
 */

export interface ShrinkOptions {
  /** Longest side of the stored image, in pixels. */
  maxSide: number;
  /**
   * Whether the image may lose transparency. A photo may, and is stored as
   * JPEG; a logo may not, so it only ever becomes WebP or stays as uploaded.
   */
  opaque: boolean;
}

/** Avatar: 800px covers a 128px circle at 3x and a share-card image. */
export const AVATAR_SHRINK: ShrinkOptions = { maxSide: 800, opaque: true };
/** Logo: drawn 20px tall; 400px on its longest side is ample. */
export const LOGO_SHRINK: ShrinkOptions = { maxSide: 400, opaque: false };

/**
 * Cache-Control for avatars, logos and their app icons. Each is stored under a
 * fresh timestamped name and never rewritten, so a cache may keep it for a
 * year, as optimize-image's listing variants already are. An hour made every
 * visitor's browser and the CDN refetch the agent's photo hourly for nothing.
 */
export const PROFILE_IMAGE_CACHE_CONTROL = '31536000';

const QUALITY = 0.85;
/** Photos have no transparency to keep; JPEG/WebP fill it black otherwise. */
const OPAQUE_BACKGROUND = '#ffffff';

/** The size to draw `width`x`height` at so its longest side is <= maxSide. */
export function scaledSize(
  width: number,
  height: number,
  maxSide: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest <= 0) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * The encodings to try, best first.
 *
 * The avatar is JPEG only. It is not just drawn by the app: submit-lead puts
 * profiles.avatar_url into the lead auto-reply email (an <img> in
 * _shared/email.ts), and it is the og:image fallback when og_image is unset
 * (functions/_lib/social-meta.ts). Classic Outlook for Windows and some
 * share-preview crawlers do not render WebP, so a WebP headshot would show as
 * a broken image in the first email a lead receives. An 800px JPEG at 0.85 is
 * still a 20-50x saving over a phone original.
 *
 * The logo keeps WebP (for its transparency): only the app shows it; no edge
 * function or email reads brokerage_logo.
 */
export function candidateTypes(opaque: boolean): string[] {
  return opaque ? ['image/jpeg'] : ['image/webp'];
}

/**
 * Whether an encoded blob should replace the original: it must be a type we
 * asked for (canvas.toBlob silently falls back to PNG for a type it cannot
 * encode) and actually be smaller.
 */
export function shouldReplace(original: Blob, encoded: Blob, requested: string): boolean {
  return encoded.type === requested && encoded.size > 0 && encoded.size < original.size;
}

/** `photo.HEIC.jpg` + image/webp -> `photo.HEIC.webp`. */
export function renameForType(name: string, type: string): string {
  const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1];
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name || 'image';
  return `${stem}.${ext}`;
}

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, QUALITY);
    } catch {
      resolve(null);
    }
  });
}

export async function shrinkProfileImage(file: File, options: ShrinkOptions): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  let bitmap: ImageBitmap | null = null;
  try {
    // EXIF orientation applied, so a phone photo taken upright stays upright
    // once the re-encode drops the EXIF block.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = scaledSize(bitmap.width, bitmap.height, options.maxSide);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    if (options.opaque) {
      context.fillStyle = OPAQUE_BACKGROUND;
      context.fillRect(0, 0, width, height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    for (const type of candidateTypes(options.opaque)) {
      const encoded = await encode(canvas, type);
      if (encoded && shouldReplace(file, encoded, type)) {
        return new File([encoded], renameForType(file.name, type), {
          type,
          lastModified: file.lastModified,
        });
      }
    }
    return file;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

/**
 * The size of the avatar's small companion (US-604): scaled so its SHORTER
 * side is `minSide`, because the circle is drawn with object-cover and the
 * short side is what fills it. A 128px circle at DPR 2 needs 256 on the short
 * side. The long side is capped at three times that, for a panorama.
 */
export function variantSize(
  width: number,
  height: number,
  minSide: number
): { width: number; height: number } {
  const shortest = Math.min(width, height);
  if (shortest <= minSide || shortest <= 0) return { width, height };
  const scale = minSide / shortest;
  const scaled = {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
  return scaledSize(scaled.width, scaled.height, minSide * 3);
}

/**
 * Render the avatar's small WebP companion (US-604), or null when this browser
 * cannot decode the photo or cannot encode WebP (older Safari answers toBlob
 * with a PNG). Only the app draws the companion; the lead auto-reply email and
 * share cards keep the JPEG avatar_url, so WebP is safe here. Never throws.
 */
export async function renderAvatarVariant(file: Blob, minSide: number): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = variantSize(bitmap.width, bitmap.height, minSide);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = OPAQUE_BACKGROUND;
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const encoded = await encode(canvas, 'image/webp');
    return encoded && encoded.type === 'image/webp' && encoded.size > 0 ? encoded : null;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}
