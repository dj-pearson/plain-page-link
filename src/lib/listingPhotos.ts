/**
 * Listing photos with alt text (US-235).
 *
 * `listings.photos` is jsonb. It held bare URL strings, so an agent had nowhere
 * to describe a photo and every renderer used the street address as the alt
 * text of every image — twelve photos, twelve identical announcements. An
 * element may now also be `{ url, alt }`. Existing rows keep working: a bare
 * string reads as a photo with no alt.
 *
 * Read through normalizePhotos; write through serializePhotos, which keeps a
 * photo without alt as a bare string so older readers still see a URL list.
 */

export interface ListingPhoto {
  url: string;
  /** The agent's description; '' when they have not written one. */
  alt: string;
}

export type StoredPhoto = string | { url: string; alt: string };

function one(value: unknown): ListingPhoto | null {
  if (typeof value === 'string') return value.trim() ? { url: value, alt: '' } : null;
  if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
    const { url, alt } = value as { url: string; alt?: unknown };
    if (!url.trim()) return null;
    return { url, alt: typeof alt === 'string' ? alt : '' };
  }
  return null;
}

/** Any stored shape (array, JSON string, legacy string list, null) → photos. */
export function normalizePhotos(value: unknown): ListingPhoto[] {
  if (Array.isArray(value)) return value.map(one).filter((p): p is ListingPhoto => p !== null);
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return normalizePhotos(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

export function photoUrls(value: unknown): string[] {
  return normalizePhotos(value).map((p) => p.url);
}

export function serializePhotos(photos: ListingPhoto[]): StoredPhoto[] {
  return photos.map((p) => (p.alt.trim() ? { url: p.url, alt: p.alt.trim() } : p.url));
}

/**
 * The alt text to render: the agent's, else "<address> — photo 3 of 12", which
 * at least tells a screen-reader user where they are in the set.
 */
export function photoAlt(photo: Pick<ListingPhoto, 'alt'> | null | undefined, address: string, index: number, total: number): string {
  const own = photo?.alt?.trim();
  if (own) return own;
  const where = address.trim() || 'Property';
  return total > 1 ? `${where} — photo ${index + 1} of ${total}` : `${where} — photo`;
}

/** The first photo, or the legacy single `image` column. */
export function primaryPhoto(photos: ListingPhoto[] | null | undefined, image?: string | null): ListingPhoto | null {
  if (image) {
    // image mirrors photos[0] on new writes; keep the alt if it does.
    const match = photos?.find((p) => p.url === image);
    return match ?? { url: image, alt: '' };
  }
  return photos?.[0] ?? null;
}
