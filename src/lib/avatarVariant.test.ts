import { describe, it, expect } from 'vitest';
import {
  avatarImage,
  avatarObjectName,
  avatarVariantObjectName,
  avatarVariantUrl,
  fallBackToAvatarOriginal,
} from './avatarVariant';

const DIR = 'https://example.supabase.co/storage/v1/object/public/avatars/u1/';

describe('avatar object names (US-604)', () => {
  it('marks a photo whose companion was stored', () => {
    expect(avatarObjectName('avatar-1700', 'jpg', true)).toBe('avatar-1700-full.jpg');
    expect(avatarObjectName('avatar-1700', 'jpg', false)).toBe('avatar-1700.jpg');
    expect(avatarVariantObjectName('avatar-1700')).toBe('avatar-1700-256.webp');
  });
});

describe('avatarVariantUrl', () => {
  it('derives the companion of a -full photo in the avatars bucket', () => {
    expect(avatarVariantUrl(`${DIR}avatar-1700-full.jpg`)).toBe(`${DIR}avatar-1700-256.webp`);
  });

  it('drops a query string or fragment', () => {
    expect(avatarVariantUrl(`${DIR}avatar-1700-full.jpg?t=1#x`)).toBe(`${DIR}avatar-1700-256.webp`);
  });

  it('has none for an older upload, so no request can 404', () => {
    expect(avatarVariantUrl(`${DIR}avatar-1700.jpg`)).toBeNull();
    expect(avatarVariantUrl(`${DIR}avatar-1700-app-icon-512.png`)).toBeNull();
  });

  it('has none outside the avatars bucket or for a hot-linked image', () => {
    expect(
      avatarVariantUrl(
        'https://example.supabase.co/storage/v1/object/public/listing-photos/u1/a-full.jpg'
      )
    ).toBeNull();
    expect(avatarVariantUrl('https://cdn.example.com/me-full.jpg')).toBeNull();
    expect(avatarVariantUrl('/storage/v1/object/public/avatars/u1/a-full.jpg')).toBeNull();
    expect(avatarVariantUrl('')).toBeNull();
    expect(avatarVariantUrl(null)).toBeNull();
  });

  it('avatarImage draws the companion and keeps the photo to fall back to', () => {
    expect(avatarImage(`${DIR}a-full.jpg`)).toEqual({
      src: `${DIR}a-256.webp`,
      original: `${DIR}a-full.jpg`,
    });
    expect(avatarImage(`${DIR}a.jpg`)).toEqual({ src: `${DIR}a.jpg`, original: `${DIR}a.jpg` });
  });
});

describe('fallBackToAvatarOriginal', () => {
  it('loads the photo once when the companion fails, and then stops', () => {
    const img = document.createElement('img');
    img.setAttribute('src', `${DIR}a-256.webp`);

    fallBackToAvatarOriginal(img, `${DIR}a-full.jpg`);
    expect(img.getAttribute('src')).toBe(`${DIR}a-full.jpg`);

    img.setAttribute('src', 'changed-by-test');
    fallBackToAvatarOriginal(img, `${DIR}a-full.jpg`);
    expect(img.getAttribute('src')).toBe('changed-by-test');
  });

  it('leaves a failing photo alone when it was already the photo', () => {
    const img = document.createElement('img');
    img.setAttribute('src', `${DIR}a.jpg`);
    fallBackToAvatarOriginal(img, `${DIR}a.jpg`);
    expect(img.dataset.avatarFallback).toBeUndefined();
  });
});
