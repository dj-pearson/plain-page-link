/**
 * US-101: every status change in the app was `.update({ status })` and nothing
 * else, so three timestamps the CRM reports on were never maintained from the
 * UI. The rules live in one place now, and this is that place's test.
 */
import { describe, it, expect } from 'vitest';
import { buildLeadStatusPatch, buildContactPatch } from './leadStatus';
import { makeLead } from '@/test/fixtures/lead';

const NOW = new Date('2026-09-02T12:00:00.000Z');
const ISO = NOW.toISOString();

describe('buildLeadStatusPatch', () => {
  it('records a close date when a lead is converted', () => {
    const patch = buildLeadStatusPatch('converted', makeLead({ status: 'qualified' }), NOW);
    expect(patch.status).toBe('converted');
    expect(patch.closed_at).toBe(ISO);
  });

  it('records a close date when a lead is lost', () => {
    expect(buildLeadStatusPatch('lost', makeLead(), NOW).closed_at).toBe(ISO);
  });

  it('reopens a closed lead by clearing the close date', () => {
    const patch = buildLeadStatusPatch(
      'qualified',
      makeLead({ status: 'converted', contacted_at: '2026-03-01T00:00:00.000Z' }),
      NOW
    );
    expect(patch.closed_at).toBeNull();
  });

  it('sets contacted_at on the first move into contact', () => {
    const patch = buildLeadStatusPatch('contacted', makeLead({ status: 'new' }), NOW);
    expect(patch.contacted_at).toBe(ISO);
  });

  it('leaves an existing contacted_at alone — it records FIRST contact', () => {
    const patch = buildLeadStatusPatch(
      'qualified',
      makeLead({ status: 'contacted', contacted_at: '2026-03-01T13:00:00.000Z' }),
      NOW
    );
    expect(patch.contacted_at).toBeUndefined();
  });

  describe('resetting a lead to new', () => {
    const reopened = buildLeadStatusPatch(
      'new',
      makeLead({
        status: 'converted',
        contacted_at: '2026-03-01T13:00:00.000Z',
        first_responded_at: '2026-03-01T13:00:00.000Z',
      }),
      NOW
    );

    it('clears first_responded_at, which the trigger can never re-set', () => {
      // set_lead_first_responded_at only fires when first_responded_at IS NULL
      // and the status moves off 'new'. Leaving it set meant a reopened lead
      // counted as responded to forever and could never contribute again.
      expect(reopened.first_responded_at).toBeNull();
    });

    it('clears contacted_at and closed_at too', () => {
      expect(reopened.contacted_at).toBeNull();
      expect(reopened.closed_at).toBeNull();
    });
  });

  it('skips the previous-value rules when no lead is supplied, rather than guessing', () => {
    // The bulk action changes many leads at once and holds none of them.
    const patch = buildLeadStatusPatch('contacted', undefined, NOW);
    expect(patch).toEqual({ status: 'contacted', closed_at: null });
  });

  it('still applies the clearing rules for a bulk reset to new', () => {
    expect(buildLeadStatusPatch('new', undefined, NOW)).toEqual({
      status: 'new',
      first_responded_at: null,
      contacted_at: null,
      closed_at: null,
    });
  });
});

describe('buildContactPatch', () => {
  it('moves a new lead to contacted, so tapping call counts as the response', () => {
    const patch = buildContactPatch(makeLead({ status: 'new', contacted_at: null }), NOW);
    expect(patch).toMatchObject({ status: 'contacted', contacted_at: ISO });
  });

  it('does not un-qualify a lead the agent calls again', () => {
    const patch = buildContactPatch(
      makeLead({ status: 'qualified', contacted_at: '2026-03-01T13:00:00.000Z' }),
      NOW
    );
    expect(patch).toBeNull();
  });

  it('backfills contacted_at on a past-new lead that somehow has none', () => {
    const patch = buildContactPatch(makeLead({ status: 'qualified', contacted_at: null }), NOW);
    expect(patch).toEqual({ status: 'qualified', contacted_at: ISO });
  });
});
