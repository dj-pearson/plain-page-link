import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  backfillAvatarAppIcons,
  resetBackfillMemo,
  type BackfillDeps,
} from './backfillAvatarAppIcons';

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const BASE = 'https://db.agentbio.net';
const UID = '11111111-2222-3333-4444-555555555555';
const PHOTO = `${BASE}/storage/v1/object/public/avatars/${UID}/avatar-1700000000000.jpg`;
const ICON_512 = `${BASE}/storage/v1/object/public/avatars/${UID}/avatar-1700000000000-app-icon-512.png`;

function deps(headStatus: number | Error, photoStatus = 200) {
  const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
    if (init?.method === 'HEAD') {
      if (headStatus instanceof Error) throw headStatus;
      return new Response(null, { status: headStatus });
    }
    return new Response(photoStatus === 200 ? 'jpg' : null, { status: photoStatus });
  });
  const store = vi.fn(async (_uid: string, name: string, _photo: Blob) => [
    name.replace('.jpg', '-app-icon-192.png'),
    name.replace('.jpg', '-app-icon-512.png'),
  ]);
  const d: BackfillDeps = { storageBase: BASE, fetchImpl, store };
  return { d, fetchImpl, store };
}

describe('backfillAvatarAppIcons (US-492)', () => {
  beforeEach(() => resetBackfillMemo());

  it('stores both icons for a pre-US-481 photo whose 512 icon is missing', async () => {
    const { d, fetchImpl, store } = deps(404);
    await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('stored');
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      ICON_512,
      expect.objectContaining({ method: 'HEAD' })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(2, PHOTO, expect.anything());
    expect(store).toHaveBeenCalledWith(UID, 'avatar-1700000000000.jpg', expect.anything());
    // The photo's bytes, as downloaded, are what gets rendered.
    const photo = store.mock.calls[0]?.[2] as Blob;
    await expect(photo.text()).resolves.toBe('jpg');
  });

  it("treats storage's legacy 400 not_found as missing", async () => {
    const { d } = deps(400);
    await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('stored');
  });

  it('does nothing more when the icon is already there', async () => {
    const { d, fetchImpl, store } = deps(200);
    await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('present');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(store).not.toHaveBeenCalled();
  });

  it('does no work without a user or a photo', async () => {
    const { d, fetchImpl } = deps(404);
    await expect(backfillAvatarAppIcons(UID, null, d)).resolves.toBe('not-applicable');
    await expect(backfillAvatarAppIcons(null, PHOTO, d)).resolves.toBe('not-applicable');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("only touches our own storage, the avatars bucket, and the agent's own folder", async () => {
    const { d, fetchImpl } = deps(404);
    const others = [
      `https://evil.example/storage/v1/object/public/avatars/${UID}/a.jpg`,
      `${BASE}/storage/v1/object/public/brokerage-logos/${UID}/a.jpg`,
      `${BASE}/storage/v1/object/public/avatars/someone-else/a.jpg`,
      ICON_512,
      'https://lh3.googleusercontent.com/photo.jpg',
    ];
    for (const url of others) {
      await expect(backfillAvatarAppIcons(UID, url, d)).resolves.toBe('not-applicable');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is silent on failure and does not treat an unknown answer as missing', async () => {
    for (const head of [500, 403, new Error('offline')]) {
      resetBackfillMemo();
      const { d, store } = deps(head);
      await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('failed');
      expect(store).not.toHaveBeenCalled();
    }
  });

  it('fails quietly when the photo cannot be read or the icons cannot be stored', async () => {
    const unreadable = deps(404, 500);
    await expect(backfillAvatarAppIcons(UID, PHOTO, unreadable.d)).resolves.toBe('failed');
    expect(unreadable.store).not.toHaveBeenCalled();

    resetBackfillMemo();
    const unstorable = deps(404);
    unstorable.store.mockResolvedValueOnce([]);
    await expect(backfillAvatarAppIcons(UID, PHOTO, unstorable.d)).resolves.toBe('failed');
  });

  it('checks a photo once per page load, so a later visit retries a failure', async () => {
    const { d, fetchImpl } = deps(500);
    await backfillAvatarAppIcons(UID, PHOTO, d);
    await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('skipped');
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    resetBackfillMemo(); // a new page load
    await expect(backfillAvatarAppIcons(UID, PHOTO, d)).resolves.toBe('failed');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
