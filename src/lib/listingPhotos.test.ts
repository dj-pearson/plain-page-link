import { describe, it, expect } from 'vitest';
import { normalizePhotos, photoUrls, serializePhotos, photoAlt, primaryPhoto } from './listingPhotos';

describe('normalizePhotos', () => {
  it('reads legacy string lists', () => {
    expect(normalizePhotos(['/a.jpg', '/b.jpg'])).toEqual([
      { url: '/a.jpg', alt: '' },
      { url: '/b.jpg', alt: '' },
    ]);
  });

  it('reads {url, alt} objects mixed with strings', () => {
    expect(normalizePhotos(['/a.jpg', { url: '/b.jpg', alt: 'Kitchen with island' }])).toEqual([
      { url: '/a.jpg', alt: '' },
      { url: '/b.jpg', alt: 'Kitchen with island' },
    ]);
  });

  it('reads a JSON string (what sample data once stored)', () => {
    expect(photoUrls('["/a.jpg"]')).toEqual(['/a.jpg']);
  });

  it('drops junk instead of throwing', () => {
    expect(normalizePhotos([null, 3, '', { alt: 'no url' }, { url: 5 }, { url: '/ok.jpg', alt: 7 }])).toEqual([
      { url: '/ok.jpg', alt: '' },
    ]);
    expect(normalizePhotos(null)).toEqual([]);
    expect(normalizePhotos('not json [')).toEqual([]);
    expect(normalizePhotos({ url: '/x.jpg' })).toEqual([]);
  });
});

describe('serializePhotos', () => {
  it('keeps photos without alt as bare strings, so older readers see URLs', () => {
    expect(serializePhotos([{ url: '/a.jpg', alt: '  ' }, { url: '/b.jpg', alt: ' Pool ' }])).toEqual([
      '/a.jpg',
      { url: '/b.jpg', alt: 'Pool' },
    ]);
  });

  it('round-trips', () => {
    const photos = [{ url: '/a.jpg', alt: '' }, { url: '/b.jpg', alt: 'Garden' }];
    expect(normalizePhotos(serializePhotos(photos))).toEqual(photos);
  });
});

describe('photoAlt', () => {
  it("uses the agent's text when there is some", () => {
    expect(photoAlt({ alt: 'Sunlit living room' }, '1 Main St', 0, 12)).toBe('Sunlit living room');
  });

  it('falls back to address and position', () => {
    expect(photoAlt({ alt: '' }, '1 Main St', 2, 12)).toBe('1 Main St — photo 3 of 12');
    expect(photoAlt(null, '1 Main St', 0, 1)).toBe('1 Main St — photo');
    expect(photoAlt(undefined, '  ', 0, 2)).toBe('Property — photo 1 of 2');
  });
});

describe('primaryPhoto', () => {
  it('prefers the image column, keeping the alt when it matches a photo', () => {
    const photos = [{ url: '/a.jpg', alt: 'Front' }];
    expect(primaryPhoto(photos, '/a.jpg')).toEqual({ url: '/a.jpg', alt: 'Front' });
    expect(primaryPhoto(photos, '/legacy.jpg')).toEqual({ url: '/legacy.jpg', alt: '' });
    expect(primaryPhoto(photos, null)).toEqual({ url: '/a.jpg', alt: 'Front' });
    expect(primaryPhoto(null, null)).toBeNull();
  });
});
