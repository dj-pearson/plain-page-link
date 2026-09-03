/**
 * toStringList is the read boundary for every jsonb list column: profiles'
 * specialties/certifications/service_cities/service_zip_codes and, through
 * useListings, listings.photos. It returning [] for a value the database
 * genuinely holds is invisible - no error, no log, just an empty gallery.
 */
import { describe, it, expect } from 'vitest';
import { toStringList } from './profile';

describe('toStringList', () => {
  it('passes a real array through, dropping non-strings', () => {
    expect(toStringList(['a', 'b'])).toEqual(['a', 'b']);
    expect(toStringList(['a', 3, null, { b: 1 }, 'c'])).toEqual(['a', 'c']);
  });

  it('parses a JSON-encoded array, which is what a stringified write stores', () => {
    // Production held exactly this in listings.photos for every seeded
    // listing: sample-data-service called JSON.stringify before the insert, so
    // the jsonb column stored a JSON string rather than a JSON array.
    const stored = JSON.stringify([
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ]);
    expect(toStringList(stored)).toEqual([
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ]);
  });

  it('returns an empty list for anything else, rather than throwing mid-render', () => {
    expect(toStringList(null)).toEqual([]);
    expect(toStringList(undefined)).toEqual([]);
    expect(toStringList('a plain string')).toEqual([]);
    expect(toStringList('[not valid json')).toEqual([]);
    expect(toStringList('{"a":1}')).toEqual([]);
    expect(toStringList(42)).toEqual([]);
    expect(toStringList({ 0: 'a' })).toEqual([]);
  });
});
