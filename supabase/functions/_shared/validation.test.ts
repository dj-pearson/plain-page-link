/**
 * validateLeadData is the last thing between a public form and an INSERT.
 * US-096: it checked the string fields' lengths but not the types of the two
 * columns that are not strings, so a four-way pre-approval answer reached a
 * boolean column and Postgres raised 22P02 — a database error the visitor read
 * as "Submission Failed", with no indication of what was wrong.
 *
 * No Deno globals at module scope here, so this runs under vitest (see the
 * supabase/functions/**\/*.test.ts entry in vitest.config.ts).
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateLeadData,
  validatePhone,
  validateReviewData,
  validateStringLength,
  validateUuid,
} from './validation.ts';

const validLead = {
  name: 'Dana Rivers',
  email: 'dana@example.com',
  lead_type: 'buyer',
  user_id: '11111111-1111-1111-1111-111111111111',
};

describe('validateUuid', () => {
  it('accepts a uuid', () => {
    expect(validateUuid('22222222-2222-2222-2222-222222222222')).toBe(true);
  });

  it.each(['', 'not-a-uuid', '2222', 42, null, undefined])('rejects %s', (value) => {
    expect(validateUuid(value)).toBe(false);
  });
});

describe('validateLeadData', () => {
  it('accepts a minimal valid lead', () => {
    expect(validateLeadData(validLead)).toEqual({ valid: true, errors: [] });
  });

  it('rejects a pre-approval answer that is not a boolean', () => {
    const result = validateLeadData({ ...validLead, preapproved: 'in-process' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Pre-approval status must be a boolean');
  });

  it('accepts both booleans, and an absent value', () => {
    expect(validateLeadData({ ...validLead, preapproved: true }).valid).toBe(true);
    expect(validateLeadData({ ...validLead, preapproved: false }).valid).toBe(true);
    expect(validateLeadData(validLead).valid).toBe(true);
  });

  it('rejects a listing id that is not a uuid', () => {
    const result = validateLeadData({ ...validLead, listing_id: '17' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid listing ID');
  });

  it('accepts a uuid listing id', () => {
    expect(
      validateLeadData({ ...validLead, listing_id: '22222222-2222-2222-2222-222222222222' }).valid
    ).toBe(true);
  });

  it('still rejects the lead types the edge function cannot store', () => {
    expect(validateLeadData({ ...validLead, lead_type: 'showing' }).errors).toContain(
      'Invalid lead type'
    );
    const noUser = validateLeadData({ ...validLead, user_id: undefined });
    expect(noUser.errors).toContain('Invalid user ID');
  });
});

describe('validateReviewData', () => {
  const validReview = {
    user_id: '11111111-1111-1111-1111-111111111111',
    client_name: 'Dana Rivers',
    review: 'She found us three houses in a week and talked us out of the wrong one.',
    rating: 5,
  };

  it('accepts a minimal review', () => {
    expect(validateReviewData(validReview)).toEqual({ valid: true, errors: [] });
  });

  it('rejects a rating outside 1-5, and a numeric string', () => {
    expect(validateReviewData({ ...validReview, rating: 0 }).valid).toBe(false);
    expect(validateReviewData({ ...validReview, rating: 6 }).valid).toBe(false);
    expect(validateReviewData({ ...validReview, rating: 4.5 }).valid).toBe(false);
    // '5' would reach an integer column as a 22P02 the visitor reads as a
    // generic failure — the same shape as US-096 on leads.preapproved.
    expect(validateReviewData({ ...validReview, rating: '5' }).valid).toBe(false);
  });

  it('requires a uuid agent id', () => {
    expect(validateReviewData({ ...validReview, user_id: 'jane' }).valid).toBe(false);
    expect(validateReviewData({ ...validReview, user_id: undefined }).valid).toBe(false);
  });

  it('bounds the free text the RLS policy also bounds', () => {
    expect(validateReviewData({ ...validReview, client_name: '' }).valid).toBe(false);
    expect(validateReviewData({ ...validReview, client_name: 'x'.repeat(101) }).valid).toBe(false);
    expect(validateReviewData({ ...validReview, review: 'x'.repeat(2001) }).valid).toBe(false);
  });

  it('accepts the three transaction types the review form offers and no others', () => {
    for (const transaction_type of ['buyer', 'seller', 'both']) {
      expect(validateReviewData({ ...validReview, transaction_type }).valid).toBe(true);
    }
    expect(validateReviewData({ ...validReview, transaction_type: 'renter' }).valid).toBe(false);
  });
});

/**
 * US-197: the three ways this file could lose a lead or crash on one.
 */
describe('validatePhone (US-197)', () => {
  /**
   * All four public lead forms validate phone as `z.string().min(10)`, so the
   * browser accepts anything ten characters long. The server then applied a
   * character allow-list, /^[\d\s\-()+]{7,20}$/, and everything below was
   * refused — reaching the visitor as a failed submission rather than as
   * "try a different format". A lost lead is the expensive error here.
   */
  it.each([
    ['dots, which is how a lot of people write it', '555.123.4567'],
    ['an extension, which agents ask for', '555-123-4567 x12'],
    ['a spelled-out extension', '(555) 123-4567 ext. 890'],
    ['a comma pause, which phones dial', '555-123-4567,89'],
    ['an en dash, which iOS and Word insert for you', '(555) 123\u20134567'],
    ['a slash, common in European writing', '+49 30 / 12345678'],
  ])('accepts %s', (_why, phone) => {
    expect(validatePhone(phone)).toBe(true);
  });

  it.each([
    ['plain', '5551234567'],
    ['formatted US', '(555) 123-4567'],
    ['E.164', '+15551234567'],
    ['UK with spaces', '+44 20 7946 0958'],
  ])('still accepts %s', (_why, phone) => {
    expect(validatePhone(phone)).toBe(true);
  });

  it.each([
    ['too few digits to be a number', '12345'],
    ['more digits than E.164 allows', '1234567890123456789'],
    ['prose', 'call me maybe'],
    ['a letter-substituted vanity number', '+1-800-FLOWERS'],
    ['an injection attempt', '<script>alert(1)</script>'],
    ['absurdly long', '5'.repeat(60)],
  ])('rejects %s', (_why, phone) => {
    expect(validatePhone(phone)).toBe(false);
  });

  it('rejects a non-string instead of throwing', () => {
    expect(validatePhone(5551234567 as unknown as string)).toBe(false);
    expect(validatePhone(null as unknown as string)).toBe(false);
  });
});

describe('validateStringLength with input that is not a string (US-197)', () => {
  /**
   * This called `.trim()` on whatever it was given. A request body with
   * `"name": 12345` threw a TypeError inside validateLeadData, so the caller
   * got a 500 instead of a validation message — and the visitor got a failed
   * form with nothing to act on. A validator that crashes on invalid input is
   * not validating it.
   */
  it.each([[12345], [null], [undefined], [{}], [['a']], [true]])(
    'returns false for %s rather than throwing',
    (value) => {
      expect(() => validateStringLength(value as unknown as string, 1, 100)).not.toThrow();
      expect(validateStringLength(value as unknown as string, 1, 100)).toBe(false);
    }
  );

  it('does not crash validateLeadData either', () => {
    const result = validateLeadData({
      name: 12345,
      email: 'buyer@example.com',
      lead_type: 'buyer',
      user_id: 'e8b5a1c2-0000-4000-8000-000000000000',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name must be between 1 and 100 characters');
  });
});

describe('sanitizeString cannot be talked out of its own rule (US-197)', () => {
  /**
   * A single pass over a blacklist joins the text on either side of what it
   * removed, so the forbidden token can be reassembled from its own halves.
   */
  it.each([
    ['dadata:ta:'],
    ['javajavascript:script:'],
    ['vbvbscript:script:'],
  ])('does not reconstruct the token it removed from %s', (input) => {
    const out = sanitizeString(input);
    expect(out.toLowerCase()).not.toContain('data:');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out.toLowerCase()).not.toContain('vbscript:');
  });

  it('does not reconstruct a tag from its own halves', () => {
    expect(sanitizeString('<scr<script>ipt>alert(1)</script>')).not.toContain('<script');
  });

  it('leaves an ordinary message alone', () => {
    expect(sanitizeString('  Hi — I saw 123 Main St. Is it still available?  ')).toBe(
      'Hi \u2014 I saw 123 Main St. Is it still available?'
    );
  });

  it('returns an empty string for a non-string rather than throwing', () => {
    expect(() => sanitizeString(12345 as unknown as string)).not.toThrow();
    expect(sanitizeString(12345 as unknown as string)).toBe('');
  });
});
