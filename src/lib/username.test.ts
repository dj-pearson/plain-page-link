import { describe, expect, it } from 'vitest';
import { needsCanonicalRedirect, normalizeUsername } from './username';

describe('normalizeUsername', () => {
  it('lowercases what a phone keyboard capitalised', () => {
    expect(normalizeUsername('JaneDoe')).toBe('janedoe');
  });

  it('trims what a paste brought along', () => {
    expect(normalizeUsername('  jane-doe \n')).toBe('jane-doe');
  });

  it('leaves an already-canonical username alone', () => {
    expect(normalizeUsername('jane_doe-2')).toBe('jane_doe-2');
  });

  it('treats null and undefined as empty rather than throwing', () => {
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
  });
});

describe('needsCanonicalRedirect', () => {
  it('is true only when a usable username is not canonical', () => {
    expect(needsCanonicalRedirect('JaneDoe')).toBe(true);
    expect(needsCanonicalRedirect(' jane')).toBe(true);
  });

  it('is false for a canonical username', () => {
    expect(needsCanonicalRedirect('jane')).toBe(false);
  });

  it('is false for nothing at all, so an empty slug does not redirect to /', () => {
    expect(needsCanonicalRedirect('')).toBe(false);
    expect(needsCanonicalRedirect('   ')).toBe(false);
    expect(needsCanonicalRedirect(undefined)).toBe(false);
  });
});
