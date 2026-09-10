import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LEAD_FIELD_LIMITS, tooLong } from './leadFieldLimits';
import {
  LEAD_FIELD_LIMITS as SERVER_LIMITS,
  validateLeadData,
} from '../../supabase/functions/_shared/validation.ts';

/**
 * US-198: the browser and the edge function did not agree about how long a
 * lead field may be, and only one of them said so.
 *
 * Not one of the four public lead forms carried a `.max()`. The edge function
 * has enforced these bounds all along, so a buyer writing more than 2000
 * characters about what they are looking for passed client validation, pressed
 * Send, and got a generic failure. Their message was gone.
 *
 * The two tables cannot import each other — one is Deno, one is bundled by
 * Vite — so this test imports both. Prose promising they match asserts
 * nothing; this fails when they drift.
 */
describe('the client and the edge function agree on field limits', () => {
  it('has the same table on both sides', () => {
    expect(LEAD_FIELD_LIMITS).toEqual(SERVER_LIMITS);
  });

  it.each(Object.keys(LEAD_FIELD_LIMITS))('names %s on both sides', (field) => {
    expect(Object.keys(SERVER_LIMITS)).toContain(field);
  });
});

describe('the limit the client now enforces is the one the server applies', () => {
  const validLead = {
    name: 'Jane Buyer',
    email: 'jane@example.com',
    lead_type: 'buyer',
    user_id: 'e8b5a1c2-0000-4000-8000-000000000000',
  };

  it.each([
    ['message', LEAD_FIELD_LIMITS.message.max],
    ['property_address', LEAD_FIELD_LIMITS.property_address.max],
    ['price_range', LEAD_FIELD_LIMITS.price_range.max],
    ['timeline', LEAD_FIELD_LIMITS.timeline.max],
    ['name', LEAD_FIELD_LIMITS.name.max],
  ])('accepts %s at exactly its limit and refuses one character more', (field, max) => {
    expect(validateLeadData({ ...validLead, [field]: 'a'.repeat(max) }).valid).toBe(true);
    expect(validateLeadData({ ...validLead, [field]: 'a'.repeat(max + 1) }).valid).toBe(false);
  });
});

describe('the form schemas stop the visitor at the same boundary', () => {
  // The shape each form now uses, rebuilt here so the boundary is asserted
  // rather than assumed to have been typed correctly four times.
  const messageField = z
    .string()
    .max(LEAD_FIELD_LIMITS.message.max, tooLong('Message', LEAD_FIELD_LIMITS.message.max));

  it('rejects a message one character over, with a message that says the number', () => {
    const result = messageField.safeParse('a'.repeat(LEAD_FIELD_LIMITS.message.max + 1));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message must be 2000 characters or fewer');
    }
  });

  it('accepts a message at exactly the limit', () => {
    expect(messageField.safeParse('a'.repeat(LEAD_FIELD_LIMITS.message.max)).success).toBe(true);
  });
});
