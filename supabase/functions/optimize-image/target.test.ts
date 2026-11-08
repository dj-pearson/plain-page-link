import { describe, expect, it } from 'vitest';
import { MAX_PATH_LENGTH, parseOptimizeTarget, variantPath } from './target';
import { withVariantPaths } from '../../../src/lib/listingPhotoCleanup';

const ME = '11111111-1111-4111-8111-111111111111';
const THEM = '22222222-2222-4222-8222-222222222222';

/** What a URL parser makes of a storage path once supabase-js puts it in a URL. */
const asStorageServerSeesIt = (path: string) =>
  new URL(`https://storage.example/object/listing-photos/${path}`).pathname.replace(
    '/object/listing-photos/',
    ''
  );

describe('parseOptimizeTarget (US-633)', () => {
  it("accepts the path useListingImageUpload writes in the caller's own folder", () => {
    const path = `${ME}/1731000000000/k3j4h5.jpg`;
    expect(parseOptimizeTarget({ bucket: 'listing-photos', path }, ME)).toEqual({
      ok: true,
      bucket: 'listing-photos',
      path,
    });
  });

  it('accepts a listing id folder and an upper-case or extensionless name', () => {
    for (const name of ['abc.JPG', 'abc.jpeg', 'abc.heic', 'abc']) {
      const path = `${ME}/${THEM}/${name}`; // a listing id is a uuid too
      expect(parseOptimizeTarget({ bucket: 'listing-photos', path }, ME).ok).toBe(true);
    }
  });

  it("refuses another agent's folder", () => {
    const result = parseOptimizeTarget({ bucket: 'listing-photos', path: `${THEM}/1/a.jpg` }, ME);
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it('refuses a first segment that only starts with the caller id', () => {
    const result = parseOptimizeTarget({ bucket: 'listing-photos', path: `${ME}x/1/a.jpg` }, ME);
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it.each([
    `${ME}/../${THEM}/1/photo.jpg`,
    `${ME}/./1/photo.jpg`,
    `${ME}/1/../../${THEM}/photo.jpg`,
    // The overwrite: everything before the last literal dot collapses into the
    // victim's folder, the whole path onto the caller's own upload.
    `${ME}/../${THEM}/1/photo./%2e%2e/%2e%2e/%2e%2e/${ME}/evil`,
    `${ME}/1/%2E%2E/%2e%2e/${THEM}/photo.jpg`,
    `${ME}/1/..%2f..%2f${THEM}/photo.jpg`,
    `${ME}/1\\..\\..\\${THEM}\\photo.jpg`,
    `${ME}//1/photo.jpg`,
    `${ME}/1/photo.jpg?x=1`,
    `${ME}/1/photo.jpg#frag`,
    `${ME}/1/my photo.jpg`,
    `${ME}/1/.hidden.jpg`,
    `/${ME}/1/photo.jpg`,
    `${ME}/1/`,
    ME,
  ])('refuses %s', (path) => {
    const result = parseOptimizeTarget({ bucket: 'listing-photos', path }, ME);
    expect(result.ok).toBe(false);
  });

  it('every refused traversal really would have escaped the folder (the test is not vacuous)', () => {
    const escaped = asStorageServerSeesIt(`${ME}/../${THEM}/1/photo./%2e%2e/%2e%2e/%2e%2e/${ME}/evil`);
    expect(escaped).toBe(`${ME}/evil`);
    const stem = asStorageServerSeesIt(variantPath(`${ME}/../${THEM}/1/photo./%2e%2e/%2e%2e/%2e%2e/${ME}/evil`, 400));
    // Under the old variantPath (last dot anywhere) this was the victim's file.
    expect(stem.startsWith(`${ME}/`)).toBe(true);
    expect(asStorageServerSeesIt(`${ME}/../${THEM}/1/photo.jpg`)).toBe(`${THEM}/1/photo.jpg`);
  });

  it.each(['avatars', 'brokerage-logos', 'gdpr-exports', 'listings', ''])(
    'refuses bucket %j',
    (bucket) => {
      const result = parseOptimizeTarget({ bucket, path: `${ME}/1/a.jpg` }, ME);
      expect(result.ok).toBe(false);
    }
  );

  it('refuses a missing body, non-string fields and an over-long path', () => {
    expect(parseOptimizeTarget(null, ME)).toMatchObject({ ok: false, status: 400 });
    expect(parseOptimizeTarget({ bucket: 'listing-photos', path: 42 }, ME)).toMatchObject({ ok: false, status: 400 });
    expect(parseOptimizeTarget({ bucket: ['listing-photos'], path: `${ME}/1/a.jpg` }, ME)).toMatchObject({
      ok: false,
      status: 400,
    });
    const long = `${ME}/1/${'a'.repeat(MAX_PATH_LENGTH)}.jpg`;
    expect(parseOptimizeTarget({ bucket: 'listing-photos', path: long }, ME)).toMatchObject({ ok: false, status: 400 });
  });

  it('refuses everything when there is no caller id', () => {
    expect(parseOptimizeTarget({ bucket: 'listing-photos', path: `/1/a.jpg` }, '')).toMatchObject({ ok: false });
  });
});

describe('variantPath', () => {
  it('replaces the extension of the file name', () => {
    expect(variantPath(`${ME}/1/abc.jpg`, 400)).toBe(`${ME}/1/abc-400.webp`);
    expect(variantPath(`${ME}/1/abc`, 200)).toBe(`${ME}/1/abc-200.webp`);
  });

  it('never treats a dot in a folder name as the extension', () => {
    expect(variantPath(`${ME}/v1.2/abc`, 800)).toBe(`${ME}/v1.2/abc-800.webp`);
  });

  it('names the same variants listingPhotoCleanup deletes', () => {
    for (const path of [`${ME}/1/abc.jpg`, `${ME}/1/abc`, `${ME}/v1.2/abc`, `${ME}/1/a.b.png`]) {
      expect(withVariantPaths(path).slice(1)).toEqual([200, 400, 800].map((w) => variantPath(path, w)));
    }
  });
});
