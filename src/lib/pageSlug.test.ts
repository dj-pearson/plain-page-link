/**
 * US-116: every page was created with slug = username, so an agent's second
 * page hit custom_pages_user_id_slug_key and the editor said "Failed to save
 * page" — with no slug field anywhere to change it in.
 */
import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug, validateSlug, SLUG_MAX_LENGTH } from './pageSlug';

describe('slugify', () => {
  it('makes free text URL-safe', () => {
    expect(slugify('My Spring Listings!')).toBe('my-spring-listings');
    expect(slugify('  Buy   &   Sell  ')).toBe('buy-sell');
  });

  it('folds accents rather than dropping the letter', () => {
    expect(slugify('Peña Homes')).toBe('pena-homes');
  });

  it('returns empty for input with nothing usable, so callers can fall back', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
  });

  it('never ends in a hyphen, even when the length cut lands on one', () => {
    const long = slugify('a'.repeat(SLUG_MAX_LENGTH - 1) + ' b');
    expect(long.endsWith('-')).toBe(false);
    expect(long.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
  });
});

describe('uniqueSlug', () => {
  it('keeps the desired slug when it is free', () => {
    expect(uniqueSlug('janedoe', [])).toBe('janedoe');
  });

  it('suffixes instead of colliding — the whole defect', () => {
    expect(uniqueSlug('janedoe', ['janedoe'])).toBe('janedoe-2');
    expect(uniqueSlug('janedoe', ['janedoe', 'janedoe-2'])).toBe('janedoe-3');
  });

  it('falls back to a usable base when the name yields nothing', () => {
    expect(uniqueSlug('***', [])).toBe('page');
  });

  it('avoids a reserved word even when it is otherwise free', () => {
    expect(uniqueSlug('dashboard', [])).not.toBe('dashboard');
  });
});

describe('validateSlug', () => {
  it('accepts an ordinary slug', () => {
    expect(validateSlug('spring-listings')).toEqual({ valid: true });
  });

  it('rejects what the URL or the constraint would reject', () => {
    expect(validateSlug('').valid).toBe(false);
    expect(validateSlug('Spring Listings').valid).toBe(false);
    expect(validateSlug('spring--listings').valid).toBe(false);
    expect(validateSlug('-spring').valid).toBe(false);
    expect(validateSlug('a'.repeat(SLUG_MAX_LENGTH + 1)).valid).toBe(false);
  });

  it('rejects a reserved word and a slug the agent already uses', () => {
    expect(validateSlug('dashboard').valid).toBe(false);
    expect(validateSlug('spring-listings', ['spring-listings']).valid).toBe(false);
    expect(validateSlug('spring-listings', ['other-page']).valid).toBe(true);
  });
});
