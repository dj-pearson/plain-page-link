/**
 * US-243: the public profile served every listing photo at its uploaded size -
 * often several megabytes - into 330px cards and a phone-width carousel,
 * although optimize-image has written 200/400/800px WebP variants beside each
 * upload since US-107. These pin the mapping onto the names optimize-image
 * actually produces (`<stem>-<width>.webp`, same folder, listing-photos only)
 * and the fallback to the original for uploads that never got variants.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://db.example.com/storage/v1/object/public/${bucket}/${path}` },
        }),
      }),
    },
  },
}));

import {
  addImagePreload,
  fallBackToOriginal,
  getImageUrl,
  imageVariantUrl,
  PLACEHOLDER_PROPERTY_IMAGE,
  responsiveImage,
} from './images';

const BASE = 'https://db.example.com/storage/v1/object/public/listing-photos';
const ORIGINAL = `${BASE}/user-1/listing-1/abc123.jpg`;

describe('imageVariantUrl', () => {
  it('maps a listing-photos original to the variant optimize-image writes', () => {
    expect(imageVariantUrl(ORIGINAL, 200)).toBe(`${BASE}/user-1/listing-1/abc123-200.webp`);
    expect(imageVariantUrl(ORIGINAL, 400)).toBe(`${BASE}/user-1/listing-1/abc123-400.webp`);
    expect(imageVariantUrl(ORIGINAL, 800)).toBe(`${BASE}/user-1/listing-1/abc123-800.webp`);
  });

  it('drops only the last extension, as variantPath does', () => {
    expect(imageVariantUrl(`${BASE}/u/l/photo.final.PNG`, 400)).toBe(
      `${BASE}/u/l/photo.final-400.webp`
    );
    expect(imageVariantUrl(`${BASE}/u/l/noext`, 400)).toBe(`${BASE}/u/l/noext-400.webp`);
  });

  it('ignores a query string or fragment on the original', () => {
    expect(imageVariantUrl(`${ORIGINAL}?t=1#x`, 200)).toBe(
      `${BASE}/user-1/listing-1/abc123-200.webp`
    );
  });

  it('returns null where no variant can exist', () => {
    // Another bucket: avatars are never optimized.
    expect(
      imageVariantUrl('https://db.example.com/storage/v1/object/public/avatars/u/a.jpg', 400)
    ).toBeNull();
    // Hot-linked from elsewhere.
    expect(imageVariantUrl('https://photos.mls.example/123.jpg', 400)).toBeNull();
    expect(imageVariantUrl(PLACEHOLDER_PROPERTY_IMAGE, 400)).toBeNull();
    // Already a variant.
    expect(imageVariantUrl(`${BASE}/u/l/abc-800.webp`, 400)).toBeNull();
  });
});

describe('getImageUrl', () => {
  it('is unchanged without a width', () => {
    expect(getImageUrl(ORIGINAL)).toBe(ORIGINAL);
    expect(getImageUrl('user-1/listing-1/abc123.jpg')).toBe(ORIGINAL);
    expect(getImageUrl(null)).toBe(PLACEHOLDER_PROPERTY_IMAGE);
    expect(getImageUrl('u/a.jpg', 'avatars')).toBe(
      'https://db.example.com/storage/v1/object/public/avatars/u/a.jpg'
    );
  });

  it('returns the variant for a width, from a URL or a bare storage path', () => {
    expect(getImageUrl(ORIGINAL, { width: 400 })).toBe(`${BASE}/user-1/listing-1/abc123-400.webp`);
    expect(getImageUrl('user-1/listing-1/abc123.jpg', { width: 200 })).toBe(
      `${BASE}/user-1/listing-1/abc123-200.webp`
    );
  });

  it('falls back to the original when there can be no variant', () => {
    expect(getImageUrl('https://photos.mls.example/1.jpg', { width: 400 })).toBe(
      'https://photos.mls.example/1.jpg'
    );
    expect(getImageUrl(undefined, { width: 400 })).toBe(PLACEHOLDER_PROPERTY_IMAGE);
  });
});

describe('responsiveImage', () => {
  it('offers the three variants, never the original, in the srcset', () => {
    const image = responsiveImage(ORIGINAL);
    expect(image.src).toBe(`${BASE}/user-1/listing-1/abc123-800.webp`);
    expect(image.srcSet).toBe(
      `${BASE}/user-1/listing-1/abc123-200.webp 200w, ` +
        `${BASE}/user-1/listing-1/abc123-400.webp 400w, ` +
        `${BASE}/user-1/listing-1/abc123-800.webp 800w`
    );
    expect(image.srcSet).not.toContain('abc123.jpg');
    expect(image.original).toBe(ORIGINAL);
  });

  it('has no srcset for an image without variants', () => {
    expect(responsiveImage('https://photos.mls.example/1.jpg')).toEqual({
      src: 'https://photos.mls.example/1.jpg',
      srcSet: undefined,
      original: 'https://photos.mls.example/1.jpg',
    });
    expect(responsiveImage(null).src).toBe(PLACEHOLDER_PROPERTY_IMAGE);
  });
});

describe('fallBackToOriginal', () => {
  function imgFor(src: string, srcSet?: string) {
    const img = document.createElement('img');
    img.src = src;
    if (srcSet) img.setAttribute('srcset', srcSet);
    img.setAttribute('sizes', '100vw');
    return img;
  }

  it('retries the original when a variant is missing, then the placeholder', () => {
    const { src, srcSet, original } = responsiveImage(ORIGINAL);
    const img = imgFor(src, srcSet);

    fallBackToOriginal(img, original);
    expect(img.src).toBe(ORIGINAL);
    expect(img.hasAttribute('srcset')).toBe(false);
    expect(img.hasAttribute('sizes')).toBe(false);

    fallBackToOriginal(img, original);
    expect(img.getAttribute('src')).toBe(PLACEHOLDER_PROPERTY_IMAGE);

    // A broken placeholder must not loop.
    img.src = 'about:blank';
    fallBackToOriginal(img, original);
    expect(img.src).toBe('about:blank');
  });

  it('goes straight to the placeholder when the original itself failed', () => {
    const img = imgFor('https://photos.mls.example/1.jpg');
    fallBackToOriginal(img, 'https://photos.mls.example/1.jpg');
    expect(img.getAttribute('src')).toBe(PLACEHOLDER_PROPERTY_IMAGE);
  });
});

describe('addImagePreload', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('preloads the srcset the <img> will use, at high priority', () => {
    const cleanup = addImagePreload(responsiveImage(ORIGINAL), '100vw');
    const link = document.head.querySelector('link[rel="preload"]');
    expect(link?.getAttribute('as')).toBe('image');
    expect(link?.getAttribute('imagesrcset')).toBe(responsiveImage(ORIGINAL).srcSet);
    expect(link?.getAttribute('imagesizes')).toBe('100vw');
    expect(link?.getAttribute('fetchpriority')).toBe('high');
    cleanup();
  });

  it('removes only the link it added', () => {
    const foreign = document.createElement('link');
    foreign.rel = 'preload';
    foreign.as = 'image';
    foreign.href = '/hero.webp';
    document.head.appendChild(foreign);

    const cleanup = addImagePreload(responsiveImage(ORIGINAL), '100vw');
    expect(document.head.querySelectorAll('link[rel="preload"]')).toHaveLength(2);

    cleanup();
    const left = document.head.querySelectorAll('link[rel="preload"]');
    expect(left).toHaveLength(1);
    expect(left[0]).toBe(foreign);
  });
});
