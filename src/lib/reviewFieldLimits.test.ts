import { describe, expect, it } from 'vitest';
import { REVIEW_FIELD_LIMITS, shouldShowCounter } from './reviewFieldLimits';
import {
  REVIEW_FIELD_LIMITS as SERVER_LIMITS,
  validateReviewData,
} from '../../supabase/functions/_shared/validation.ts';

const AGENT = 'e8b5a1c2-0000-4000-8000-000000000000';
const validReview = {
  user_id: AGENT,
  client_name: 'Jane Client',
  review: 'They were excellent.',
  rating: 5,
};

describe('the client and the edge function agree on review limits', () => {
  it('has the same table on both sides', () => {
    expect(REVIEW_FIELD_LIMITS).toEqual(SERVER_LIMITS);
  });
});

describe('the boundary the client now enforces is the one the server applies', () => {
  it.each([
    ['review', REVIEW_FIELD_LIMITS.review.max],
    ['client_name', REVIEW_FIELD_LIMITS.client_name.max],
    ['client_title', REVIEW_FIELD_LIMITS.client_title.max],
    ['property_type', REVIEW_FIELD_LIMITS.property_type.max],
  ])('accepts %s at exactly its limit and refuses one character more', (field, max) => {
    expect(validateReviewData({ ...validReview, [field]: 'a'.repeat(max) }).valid).toBe(true);
    expect(validateReviewData({ ...validReview, [field]: 'a'.repeat(max + 1) }).valid).toBe(false);
  });

  it('returns a specific message, which is what the page threw away', () => {
    const result = validateReviewData({ ...validReview, review: 'a'.repeat(2001) });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Review must be between 1 and 2000 characters');
  });
});

describe('shouldShowCounter', () => {
  const max = REVIEW_FIELD_LIMITS.review.max;

  it('stays out of the way while there is room', () => {
    expect(shouldShowCounter(0, max)).toBe(false);
    expect(shouldShowCounter(max / 2, max)).toBe(false);
  });

  it('appears once the writer is close', () => {
    expect(shouldShowCounter(max * 0.75, max)).toBe(true);
    expect(shouldShowCounter(max, max)).toBe(true);
  });
});
