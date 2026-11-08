/**
 * US-481 (slice 1 of US-470): the home-screen icons are named after the photo
 * they were rendered from, so the manifest derives them from avatar_url.
 */
import { describe, it, expect } from 'vitest';
import {
  appIconObjectName,
  avatarAppIconUrls,
  headshotSquare,
  isAppIconObjectName,
} from './avatarAppIcon';

const BASE = 'https://api.example.test';
const AVATAR = `${BASE}/storage/v1/object/public/avatars/u1/avatar-1700000000000.jpg`;

describe('appIconObjectName', () => {
  it('replaces the extension with the icon suffix', () => {
    expect(appIconObjectName('avatar-1.jpg', 512)).toBe('avatar-1-app-icon-512.png');
    expect(appIconObjectName('avatar-1.photo.webp', 192)).toBe('avatar-1.photo-app-icon-192.png');
    expect(appIconObjectName('avatar', 192)).toBe('avatar-app-icon-192.png');
  });

  it('recognises its own names', () => {
    expect(isAppIconObjectName(appIconObjectName('avatar-1.jpg', 512))).toBe(true);
    expect(isAppIconObjectName('avatar-1.jpg')).toBe(false);
  });
});

describe('avatarAppIconUrls', () => {
  it('derives both icons from an avatar in our bucket', () => {
    expect(avatarAppIconUrls(AVATAR, BASE)).toEqual({
      192: `${BASE}/storage/v1/object/public/avatars/u1/avatar-1700000000000-app-icon-192.png`,
      512: `${BASE}/storage/v1/object/public/avatars/u1/avatar-1700000000000-app-icon-512.png`,
    });
  });

  it('accepts a base with a trailing slash or a path prefix', () => {
    expect(avatarAppIconUrls(AVATAR, `${BASE}/`)).not.toBeNull();
    const prefixed = `${BASE}/supabase/storage/v1/object/public/avatars/u1/a.png`;
    expect(avatarAppIconUrls(prefixed, `${BASE}/supabase`)?.[512]).toBe(
      `${BASE}/supabase/storage/v1/object/public/avatars/u1/a-app-icon-512.png`
    );
    expect(avatarAppIconUrls(prefixed, BASE)).toBeNull();
  });

  it('never points at another host when a storage base is given', () => {
    expect(
      avatarAppIconUrls('https://evil.test/storage/v1/object/public/avatars/u1/a.jpg', BASE)
    ).toBeNull();
    // Without a base (the browser), the host is the avatar's own.
    expect(
      avatarAppIconUrls('https://cdn.test/storage/v1/object/public/avatars/u1/a.jpg')?.[192]
    ).toBe('https://cdn.test/storage/v1/object/public/avatars/u1/a-app-icon-192.png');
  });

  it('ignores anything that is not one object directly under a uid folder', () => {
    for (const value of [
      null,
      undefined,
      '',
      'not a url',
      'javascript:alert(1)',
      `${BASE}/storage/v1/object/public/listing-photos/u1/a.jpg`,
      `${BASE}/storage/v1/object/public/avatars/a.jpg`,
      `${BASE}/storage/v1/object/public/avatars/u1/nested/a.jpg`,
      `${BASE}/storage/v1/object/public/avatars/%2E%2E/a.jpg`,
      `${BASE}/storage/v1/object/public/avatars/u1/a-app-icon-512.png`,
      'https://images.example.com/headshot.jpg',
    ]) {
      expect(avatarAppIconUrls(value, BASE), String(value)).toBeNull();
    }
  });

  it('keeps percent-encoding in the object name', () => {
    const url = `${BASE}/storage/v1/object/public/avatars/u1/my%20photo.jpg`;
    expect(avatarAppIconUrls(url, BASE)?.[192]).toBe(
      `${BASE}/storage/v1/object/public/avatars/u1/my%20photo-app-icon-192.png`
    );
  });
});

describe('headshotSquare', () => {
  it('crops landscape from the centre', () => {
    expect(headshotSquare(1200, 800)).toEqual({ sx: 200, sy: 0, side: 800 });
  });

  it('keeps more of the top of a portrait', () => {
    expect(headshotSquare(800, 1100)).toEqual({ sx: 0, sy: 100, side: 800 });
  });

  it('leaves a square alone', () => {
    expect(headshotSquare(512, 512)).toEqual({ sx: 0, sy: 0, side: 512 });
  });
});
