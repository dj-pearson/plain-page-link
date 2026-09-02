import { describe, it, expect } from 'vitest';
import { parseSquareFeet } from './format';

/**
 * US-106: the Add Listing form's own placeholder is "2,400", and the writer
 * used parseInt — which stops at the comma. "2,400" stored 2, and the listing
 * card then rendered "$625,000/sqft".
 */
describe('parseSquareFeet', () => {
  it('accepts the separator the form itself suggests', () => {
    expect(parseSquareFeet('2,400')).toBe(2400);
  });

  it('accepts a bare number and a number with units', () => {
    expect(parseSquareFeet('2400')).toBe(2400);
    expect(parseSquareFeet('2,400 sq ft')).toBe(2400);
  });

  it('returns null for a value with no digits, not 0', () => {
    // An unknown size and a zero-square-foot property are different claims.
    expect(parseSquareFeet('')).toBeNull();
    expect(parseSquareFeet('unknown')).toBeNull();
    expect(parseSquareFeet(null)).toBeNull();
    expect(parseSquareFeet(undefined)).toBeNull();
  });

  it('rounds a fractional value rather than truncating it', () => {
    expect(parseSquareFeet('2400.6')).toBe(2401);
    expect(parseSquareFeet(2400.4)).toBe(2400);
  });
});
