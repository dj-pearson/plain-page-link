/**
 * US-096: three of the four pre-approval answers could not be submitted.
 *
 * `leads.preapproved` is a boolean, but the buyer form asks a four-way
 * question. The raw string was written straight to the column, so Postgres
 * coerced 'yes' and raised 22P02 on 'in-process', 'not-yet' and 'cash' —
 * submit-lead rethrew and the buyer saw "Submission Failed". The leads an
 * agent most wants to nurture, the not-yet-approved ones, were the ones lost.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitFormData, toPreapprovedBoolean, submitLead } from './leadSubmission';

const { callEdgeFunctionMock } = vi.hoisted(() => ({ callEdgeFunctionMock: vi.fn() }));

vi.mock('@/lib/edgeFunctions', () => ({ callEdgeFunction: callEdgeFunctionMock }));

describe('toPreapprovedBoolean', () => {
  it.each([
    ['yes', true],
    ['cash', true],
    ['in-process', false],
    ['not-yet', false],
  ] as const)('maps %s to %s', (answer, expected) => {
    expect(toPreapprovedBoolean(answer)).toBe(expected);
  });

  it('passes a boolean through unchanged', () => {
    expect(toPreapprovedBoolean(true)).toBe(true);
    expect(toPreapprovedBoolean(false)).toBe(false);
  });
});

describe('splitFormData', () => {
  it.each(['yes', 'in-process', 'not-yet', 'cash'])(
    'sends a boolean to the preapproved column for %s',
    (answer) => {
      const { columns } = splitFormData({ preApproved: answer });
      expect(typeof columns.preapproved).toBe('boolean');
    }
  );

  it('keeps the four-way answer in form_data so the agent can still read it', () => {
    const { columns, formData } = splitFormData({ preApproved: 'cash' });
    expect(columns.preapproved).toBe(true);
    expect(formData.preApprovalStatus).toBe('cash');
  });

  it('distinguishes a cash buyer from someone who needs a lender', () => {
    expect(splitFormData({ preApproved: 'cash' }).columns.preapproved).toBe(true);
    expect(splitFormData({ preApproved: 'not-yet' }).columns.preapproved).toBe(false);
  });

  it('lifts the other dedicated columns without transforming them', () => {
    const { columns, formData } = splitFormData({
      priceRange: '400000-450000',
      timeline: '3_months',
      address: '123 Maple Ave',
      message: 'Interested',
      bedrooms: '3',
    });
    expect(columns).toEqual({
      price_range: '400000-450000',
      timeline: '3_months',
      property_address: '123 Maple Ave',
      message: 'Interested',
    });
    expect(formData).toEqual({ bedrooms: '3' });
  });

  it('drops empty answers rather than writing them', () => {
    const { columns, formData } = splitFormData({ timeline: '', message: null, notes: undefined });
    expect(columns).toEqual({});
    expect(formData).toEqual({});
  });
});

describe('submitLead', () => {
  beforeEach(() => {
    callEdgeFunctionMock.mockReset();
    callEdgeFunctionMock.mockResolvedValue({ success: true, leadId: 'lead-1' });
  });

  const base = {
    agentId: '11111111-1111-1111-1111-111111111111',
    leadType: 'buyer' as const,
    name: 'Dana Rivers',
    email: 'dana@example.com',
  };

  it('sends the listing the enquiry came from', async () => {
    await submitLead({
      ...base,
      listingId: '22222222-2222-2222-2222-222222222222',
      data: { address: '123 Maple Ave' },
    });

    const [, options] = callEdgeFunctionMock.mock.calls[0];
    expect(options.body).toMatchObject({
      listing_id: '22222222-2222-2222-2222-222222222222',
      property_address: '123 Maple Ave',
      user_id: base.agentId,
      lead_type: 'buyer',
    });
  });

  it('submits every pre-approval answer with a boolean the column accepts', async () => {
    for (const answer of ['yes', 'in-process', 'not-yet', 'cash']) {
      callEdgeFunctionMock.mockClear();
      const result = await submitLead({ ...base, data: { preApproved: answer } });

      expect(result.success).toBe(true);
      const [, options] = callEdgeFunctionMock.mock.calls[0];
      expect(typeof options.body.preapproved).toBe('boolean');
      expect(options.body.form_data.preApprovalStatus).toBe(answer);
    }
  });

  it('reports the failure instead of throwing when the function rejects', async () => {
    callEdgeFunctionMock.mockRejectedValue(new Error('Invalid lead type'));
    await expect(submitLead({ ...base, data: {} })).resolves.toEqual({
      success: false,
      error: 'Invalid lead type',
    });
  });
});
