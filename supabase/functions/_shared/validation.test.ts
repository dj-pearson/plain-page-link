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
import { validateLeadData, validateUuid } from './validation.ts';

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
