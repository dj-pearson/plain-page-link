/**
 * Client-side file validation by magic number (US-076).
 *
 * `File.type` is whatever the browser inferred from the extension — it is not
 * read from the bytes and a caller can set it to anything. Every upload path in
 * the app validated only that, and the buckets had no `allowed_mime_types`
 * because they had no definition at all (US-075), so an arbitrary file could be
 * hosted on the platform's own public storage origin under a plausible name.
 *
 * Three layers now, in order of trust:
 *   1. this module — rejects a mismatched file before it leaves the browser,
 *      so the user gets an immediate, specific error;
 *   2. `allowed_mime_types` / `file_size_limit` on the bucket — the actual
 *      enforcement point, since the browser uploads straight to Storage;
 *   3. `supabase/functions/_shared/fileValidation.ts` in optimize-image, which
 *      re-checks the stored bytes before handing them to an image decoder.
 *
 * Only (2) is a security boundary. (1) is UX and (3) is defence in depth around
 * a parser — but a client check that can be skipped is still worth having,
 * because it is the one that tells the user *why*.
 */

/** First bytes that identify a file's real type. */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff, 0xe0], // JFIF
    [0xff, 0xd8, 0xff, 0xe1], // EXIF
    [0xff, 0xd8, 0xff, 0xe2], // Canon
    [0xff, 0xd8, 0xff, 0xdb], // raw
    [0xff, 0xd8, 0xff, 0xee], // Adobe
  ],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // RIFF container; the WEBP tag sits at offset 8 and is checked separately.
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/heic': [], // brand-checked below, not signature-matched
};

// image/jpg is what browsers report for .jpg on some platforms; it is the same
// format as image/jpeg.
FILE_SIGNATURES['image/jpg'] = FILE_SIGNATURES['image/jpeg'];

const HEADER_BYTES = 16;

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

function ascii(bytes: Uint8Array, from: number, length: number): string {
  return String.fromCharCode(...Array.from(bytes.slice(from, from + length)));
}

/**
 * Does the file's content match the type it claims to be?
 *
 * Returns false for any type we have no signature for — an unknown type is not
 * a passing type.
 */
export function bytesMatchDeclaredType(header: Uint8Array, declaredMimeType: string): boolean {
  const type = declaredMimeType.toLowerCase();

  // WebP is a RIFF container: bytes 0-3 are "RIFF" and bytes 8-11 are "WEBP".
  // Checking only RIFF would accept a .wav.
  if (type === 'image/webp') {
    return startsWith(header, FILE_SIGNATURES['image/webp'][0]) && ascii(header, 8, 4) === 'WEBP';
  }

  // HEIC/HEIF is an ISO-BMFF box: bytes 4-7 are "ftyp", then a brand.
  if (type === 'image/heic' || type === 'image/heif') {
    if (ascii(header, 4, 4) !== 'ftyp') return false;
    const brand = ascii(header, 8, 4);
    return ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand);
  }

  const signatures = FILE_SIGNATURES[type];
  if (!signatures || signatures.length === 0) return false;
  return signatures.some((sig) => startsWith(header, sig));
}

/** Human-readable size limit. Rounding a sub-MB limit to MB reads "less than 0MB". */
function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Math.round(mb)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export interface FileValidationOptions {
  /** MIME types the caller accepts. */
  accept: string[];
  /** Maximum size in bytes. */
  maxBytes: number;
}

/**
 * Validate a File for upload. Returns null when it is acceptable, or a message
 * suitable for showing to the user.
 */
export async function validateUpload(
  file: File,
  { accept, maxBytes }: FileValidationOptions
): Promise<string | null> {
  if (!accept.map((t) => t.toLowerCase()).includes(file.type.toLowerCase())) {
    const names = accept
      .map((t) => t.replace(/^image\//, '').toUpperCase())
      .filter((n, i, a) => a.indexOf(n) === i)
      .join(', ');
    return `Please upload a ${names} image`;
  }

  if (file.size > maxBytes) {
    return `File size must be less than ${formatBytes(maxBytes)}`;
  }

  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  if (!bytesMatchDeclaredType(header, file.type)) {
    return "This file's contents don't match its type. Please re-save it and try again.";
  }

  return null;
}
