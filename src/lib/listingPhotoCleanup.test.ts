import { describe, it, expect } from 'vitest';
import {
  listingPhotoUrls,
  orphanedListingPhotoPaths,
  ownedListingPhotoPath,
  withVariantPaths,
} from './listingPhotoCleanup';

const USER = 'u1';
const BASE = 'https://db.example.com/storage/v1/object/public/listing-photos';
const url = (path: string) => `${BASE}/${path}`;

describe('ownedListingPhotoPath', () => {
  it('returns the object path of an original in the agent folder', () => {
    expect(ownedListingPhotoPath(url('u1/l1/abc.jpg'), USER)).toBe('u1/l1/abc.jpg');
  });

  it('ignores a query string and decodes the path', () => {
    expect(ownedListingPhotoPath(url('u1/l1/my%20photo.jpg?v=2'), USER)).toBe('u1/l1/my photo.jpg');
  });

  it('refuses another agent folder, other buckets and hot-linked URLs', () => {
    expect(ownedListingPhotoPath(url('u2/l1/abc.jpg'), USER)).toBeNull();
    expect(
      ownedListingPhotoPath(
        'https://db.example.com/storage/v1/object/public/avatars/u1/a.jpg',
        USER
      )
    ).toBeNull();
    expect(ownedListingPhotoPath('https://photos.zillowstatic.com/u1/abc.jpg', USER)).toBeNull();
  });

  it('refuses path tricks and a folder that only starts with the user id', () => {
    expect(ownedListingPhotoPath(url('u1/../u2/abc.jpg'), USER)).toBeNull();
    expect(ownedListingPhotoPath(url('u1%2F..%2Fu2/abc.jpg'), USER)).toBeNull();
    expect(ownedListingPhotoPath(url('u10/l1/abc.jpg'), USER)).toBeNull();
    expect(ownedListingPhotoPath(url('u1/l1/abc.jpg'), '')).toBeNull();
  });

  it('never treats a variant as an original', () => {
    expect(ownedListingPhotoPath(url('u1/l1/abc-400.webp'), USER)).toBeNull();
  });
});

describe('withVariantPaths', () => {
  it('lists the original and the three optimize-image variants', () => {
    expect(withVariantPaths('u1/l1/abc.jpg')).toEqual([
      'u1/l1/abc.jpg',
      'u1/l1/abc-200.webp',
      'u1/l1/abc-400.webp',
      'u1/l1/abc-800.webp',
    ]);
  });

  it('handles a file with no extension', () => {
    expect(withVariantPaths('u1/l.1/abc')[1]).toBe('u1/l.1/abc-200.webp');
  });
});

describe('listingPhotoUrls', () => {
  it('collects the gallery and the legacy cover, skipping blanks', () => {
    expect(listingPhotoUrls({ photos: ['a', ''], image: 'b' })).toEqual(['a', 'b']);
    expect(listingPhotoUrls({ photos: null, image: null })).toEqual([]);
  });
});

describe('orphanedListingPhotoPaths', () => {
  it('removes each dropped original with its variants', () => {
    expect(
      orphanedListingPhotoPaths({
        removed: [url('u1/l1/a.jpg'), url('u1/l1/b.png')],
        stillReferenced: [url('u1/l1/b.png')],
        userId: USER,
      })
    ).toEqual(['u1/l1/a.jpg', 'u1/l1/a-200.webp', 'u1/l1/a-400.webp', 'u1/l1/a-800.webp']);
  });

  it('keeps a photo another listing still uses, even through a different query string', () => {
    expect(
      orphanedListingPhotoPaths({
        removed: [url('u1/l1/a.jpg')],
        stillReferenced: [`${url('u1/l1/a.jpg')}?t=1`],
        userId: USER,
      })
    ).toEqual([]);
  });

  it('keeps a variant another listing stores as its photo', () => {
    const out = orphanedListingPhotoPaths({
      removed: [url('u1/l1/a.jpg')],
      stillReferenced: [url('u1/l1/a-800.webp')],
      userId: USER,
    });
    expect(out).toContain('u1/l1/a.jpg');
    expect(out).not.toContain('u1/l1/a-800.webp');
  });

  it('never removes external or foreign objects, and dedupes', () => {
    expect(
      orphanedListingPhotoPaths({
        removed: [
          'https://example.com/house.jpg',
          url('u2/l1/a.jpg'),
          url('u1/l1/a.jpg'),
          url('u1/l1/a.jpg'),
        ],
        stillReferenced: [],
        userId: USER,
      })
    ).toHaveLength(4);
  });
});
