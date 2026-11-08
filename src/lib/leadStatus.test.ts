/**
 * US-101: every status change in the app was `.update({ status })` and nothing
 * else, so three timestamps the CRM reports on were never maintained from the
 * UI. The rules live in one place now, and this is that place's test.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildLeadStatusPatch,
  buildContactPatch,
  LEAD_STATUSES,
  LEAD_STATUS_VALUES,
  CLOSED_STATUSES,
  CONTACTED_STATUSES,
  isLeadStatus,
  leadStatusLabel,
  IN_PROGRESS_STATUSES,
  WON_STATUSES,
  LEAD_STATUS_GROUPS,
  statusFilterValues,
  normalizeStatusFilter,
  summarizeLeadStatuses,
} from './leadStatus';
import { LEAD_STATUS_VALUES as EDGE_LEAD_STATUS_VALUES } from '../../supabase/functions/_shared/lead-status';
import { NODE_CONFIG_SCHEMAS } from '@/types/workflow';
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

/**
 * US-428 (US-278): one vocabulary. The database CHECK, the browser list and the
 * edge-function copy must name exactly the same statuses, in the same order.
 */
describe('the lead status vocabulary', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20261107000428_lead_status_vocabulary.sql'),
    'utf8'
  );

  it('includes nurturing and closed (owner decision 2026-11-07)', () => {
    expect(LEAD_STATUS_VALUES).toEqual([
      'new',
      'contacted',
      'qualified',
      'nurturing',
      'converted',
      'closed',
      'lost',
    ]);
  });

  it('matches leads_status_check in the migration exactly', () => {
    const check = migration.match(
      /CONSTRAINT leads_status_check\s+CHECK \(status IN \(([^)]*)\)\)/
    );
    expect(check).not.toBeNull();
    const values = [...check![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(values).toEqual([...LEAD_STATUS_VALUES]);
  });

  it('normalises existing rows to the same list before adding the CHECK', () => {
    const lists = [...migration.matchAll(/IN\s*\(\s*('new'[^)]*)\)/g)].map((m) =>
      [...m[1].matchAll(/'([a-z_]+)'/g)].map((v) => v[1])
    );
    expect(lists.length).toBeGreaterThanOrEqual(3);
    for (const list of lists) expect(list).toEqual([...LEAD_STATUS_VALUES]);
    expect(migration.indexOf('UPDATE public.leads')).toBeLessThan(
      migration.indexOf('ADD CONSTRAINT leads_status_check')
    );
  });

  it('keeps the edge-function copy identical', () => {
    expect([...EDGE_LEAD_STATUS_VALUES]).toEqual([...LEAD_STATUS_VALUES]);
  });

  it('is what the workflow builder offers for update_lead', () => {
    expect(NODE_CONFIG_SCHEMAS.update_lead.status.options).toEqual([...LEAD_STATUS_VALUES]);
  });

  it('classifies every status as closed, contacted or new', () => {
    for (const status of LEAD_STATUS_VALUES) {
      const known =
        status === 'new' || CLOSED_STATUSES.has(status) || CONTACTED_STATUSES.has(status);
      expect(known, status).toBe(true);
    }
    expect(CLOSED_STATUSES.has('closed')).toBe(true);
    expect(CONTACTED_STATUSES.has('nurturing')).toBe(true);
    expect(CLOSED_STATUSES.has('nurturing')).toBe(false);
  });

  it('labels statuses and rejects strings outside the list', () => {
    expect(LEAD_STATUSES.map((s) => leadStatusLabel(s.value))).toEqual(
      LEAD_STATUSES.map((s) => s.label)
    );
    expect(leadStatusLabel(null)).toBe('New');
    expect(leadStatusLabel('archived')).toBe('archived');
    expect(isLeadStatus('nurturing')).toBe(true);
    expect(isLeadStatus('spam')).toBe(false);
    expect(isLeadStatus('Contacted')).toBe(false);
  });

  it('keeps a nurturing lead open and closes a closed one', () => {
    const patch = buildLeadStatusPatch('nurturing', makeLead({ status: 'contacted' }), NOW);
    expect(patch.closed_at).toBeNull();
    expect(buildLeadStatusPatch('closed', makeLead(), NOW).closed_at).toBe(ISO);
  });
});

/**
 * US-439: the Leads chips counted new / contacted / converted only, so
 * qualified, nurturing and closed leads were in no count, and a closed deal
 * was never a win.
 */
describe('status groups', () => {
  it('puts every status in exactly one of new, in progress, won and lost', () => {
    for (const status of LEAD_STATUS_VALUES) {
      const homes = [
        status === 'new',
        IN_PROGRESS_STATUSES.includes(status),
        WON_STATUSES.includes(status),
        status === 'lost',
      ].filter(Boolean);
      expect(homes.length, status).toBe(1);
    }
  });

  it('treats closed as won and nurturing as in progress', () => {
    expect(WON_STATUSES).toContain('closed');
    expect(IN_PROGRESS_STATUSES).toContain('nurturing');
    // Won agrees with the close-date rules: every win records closed_at.
    for (const s of WON_STATUSES) expect(CLOSED_STATUSES.has(s)).toBe(true);
  });

  it('summarises lead_stats by_status into the chip counts', () => {
    expect(
      summarizeLeadStatuses({
        new: 4,
        contacted: 2,
        qualified: 1,
        nurturing: 3,
        converted: 5,
        closed: 2,
        lost: 6,
      })
    ).toEqual({ new: 4, inProgress: 6, won: 7, lost: 6 });
    expect(summarizeLeadStatuses(undefined)).toEqual({ new: 0, inProgress: 0, won: 0, lost: 0 });
  });

  it('turns a ?status= filter into the statuses it selects', () => {
    expect(statusFilterValues('all')).toBeUndefined();
    expect(statusFilterValues(null)).toBeUndefined();
    expect(statusFilterValues('nurturing')).toEqual(['nurturing']);
    expect(statusFilterValues('won')).toEqual(['converted', 'closed']);
    expect(statusFilterValues('in_progress')).toEqual(['contacted', 'qualified', 'nurturing']);
    // A stale link does not become a filter that matches nothing.
    expect(statusFilterValues('archived')).toBeUndefined();
    expect(normalizeStatusFilter('archived')).toBe('all');
    expect(normalizeStatusFilter('won')).toBe('won');
    expect(normalizeStatusFilter('closed')).toBe('closed');
  });

  it('never names a group the same as a status', () => {
    for (const g of LEAD_STATUS_GROUPS) expect(isLeadStatus(g.value)).toBe(false);
  });
});
