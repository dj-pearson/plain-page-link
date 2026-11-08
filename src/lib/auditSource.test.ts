import { describe, expect, it } from 'vitest';
import { auditSourceQuery, isAuditSourceFilter, isClientReported } from './auditSource';
import { parseClientAuditEvent } from '../../supabase/functions/audit-log/policy';
import type { Json } from '@/integrations/supabase/types';

describe('isClientReported', () => {
  it('is true only for the tag the audit-log function sets', () => {
    expect(isClientReported({ client_reported: true })).toBe(true);
    expect(isClientReported({ client_reported: true, fields: ['bio'] })).toBe(true);
  });

  it('is false for server rows and for anything that only looks like the tag', () => {
    expect(isClientReported(null)).toBe(false);
    expect(isClientReported(undefined)).toBe(false);
    expect(isClientReported({})).toBe(false);
    expect(isClientReported({ client_reported: 'true' })).toBe(false);
    expect(isClientReported({ client_reported: false })).toBe(false);
    expect(isClientReported([{ client_reported: true }])).toBe(false);
    expect(isClientReported('client_reported')).toBe(false);
  });

  it('recognises every row the audit-log function would store', () => {
    for (const body of [
      { action: 'login', status: 'success' },
      { action: 'listing_delete', status: 'failure', details: { client_reported: false } },
      { action: 'profile_update', status: 'success', details: { big: 'x'.repeat(70 * 1024) } },
    ]) {
      const result = parseClientAuditEvent(body);
      expect(result.ok).toBe(true);
      if (result.ok) expect(isClientReported(result.event.details as Json)).toBe(true);
    }
  });
});

describe('auditSourceQuery', () => {
  it('adds no filter for all sources', () => {
    expect(auditSourceQuery('all')).toEqual({ kind: 'none' });
  });

  it('matches the tag for browser rows', () => {
    expect(auditSourceQuery('client')).toEqual({
      kind: 'eq',
      column: 'details->>client_reported',
      value: 'true',
    });
  });

  it('keeps server rows whose details are null as well as untagged ones', () => {
    const q = auditSourceQuery('server');
    expect(q.kind).toBe('or');
    if (q.kind === 'or') {
      const parts = q.filter.split(',');
      expect(parts).toContain('details.is.null');
      expect(parts).toContain('details->>client_reported.is.null');
      expect(parts).toContain('details->>client_reported.neq.true');
    }
  });
});

describe('isAuditSourceFilter', () => {
  it('accepts only the three sources', () => {
    expect(['all', 'server', 'client'].every(isAuditSourceFilter)).toBe(true);
    expect(isAuditSourceFilter('browser')).toBe(false);
    expect(isAuditSourceFilter('')).toBe(false);
  });
});
