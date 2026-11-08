import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLIENT_AUDIT_ACTIONS,
  DEFAULT_LOG_PAGE,
  MAX_DETAILS_BYTES,
  MAX_LOG_PAGE,
  parseClientAuditEvent,
  parseLogPage,
} from './policy';
import { CLIENT_AUDIT_ACTIONS as BROWSER_ACTIONS } from '../../../src/lib/audit';

const ROOT = resolve(__dirname, '../../..');

describe('parseClientAuditEvent (US-657)', () => {
  it('accepts an action the app reports and tags it client_reported', () => {
    const result = parseClientAuditEvent({
      action: 'profile_update',
      status: 'success',
      resourceType: 'profile',
      resourceId: '7d0c1a52-0000-4000-8000-000000000001',
      details: { fields: ['bio'] },
    });
    expect(result).toEqual({
      ok: true,
      event: {
        action: 'profile_update',
        status: 'success',
        resourceType: 'profile',
        resourceId: '7d0c1a52-0000-4000-8000-000000000001',
        details: { fields: ['bio'], client_reported: true },
        riskLevel: 'low',
      },
    });
  });

  it.each(['admin_action', 'mfa_disable', 'account_deletion_request', 'gdpr_export_request', 'LOGIN', ''])(
    'refuses %j, which only the server may write',
    (action) => {
      expect(parseClientAuditEvent({ action, status: 'success' })).toEqual({
        ok: false,
        error: 'action is not one a client may report',
      });
    }
  );

  it('ignores a client-supplied riskLevel', () => {
    const result = parseClientAuditEvent({ action: 'login', status: 'success', riskLevel: 'critical' });
    expect(result.ok && result.event.riskLevel).toBe('low');
  });

  it('never rates a client event above medium', () => {
    for (const status of ['failure', 'blocked']) {
      const result = parseClientAuditEvent({ action: 'login', status });
      expect(result.ok && result.event.riskLevel).toBe('medium');
    }
  });

  it('does not let the client clear the client_reported tag', () => {
    const result = parseClientAuditEvent({
      action: 'logout',
      status: 'success',
      details: { client_reported: false },
    });
    expect(result.ok && result.event.details).toEqual({ client_reported: true });
  });

  it('defaults absent fields to null and an empty tagged details object', () => {
    const result = parseClientAuditEvent({ action: 'listing_reorder', status: 'success' });
    expect(result.ok && result.event).toMatchObject({
      resourceType: null,
      resourceId: null,
      details: { client_reported: true },
    });
  });

  it.each([
    [null, 'Request body must be a JSON object'],
    [[], 'Request body must be a JSON object'],
    [{ action: 'login' }, 'status must be success, failure or blocked'],
    [{ action: 'login', status: 'ok' }, 'status must be success, failure or blocked'],
    [{ action: 'login', status: 'success', resourceType: 'Profile; drop' }, 'resourceType is invalid'],
    [{ action: 'login', status: 'success', resourceId: 'x'.repeat(129) }, 'resourceId is invalid'],
    [{ action: 'login', status: 'success', resourceId: 42 }, 'resourceId is invalid'],
    [{ action: 'login', status: 'success', details: 'text' }, 'details must be an object'],
    [{ action: 'login', status: 'success', details: [1] }, 'details must be an object'],
  ])('refuses %j', (body, error) => {
    expect(parseClientAuditEvent(body)).toEqual({ ok: false, error });
  });

  it('keeps the event but drops oversized details', () => {
    const big = { listing_ids: Array.from({ length: 3000 }, (_, i) => `id-${i}-${'x'.repeat(20)}`) };
    const result = parseClientAuditEvent({ action: 'listing_import', status: 'success', details: big });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.details.details_truncated).toBe(true);
    expect(result.event.details.details_bytes).toBeGreaterThan(MAX_DETAILS_BYTES);
    expect(result.event.details.client_reported).toBe(true);
    expect(result.event.details).not.toHaveProperty('listing_ids');
  });
});

describe('parseLogPage', () => {
  it('clamps the page size and rejects nonsense', () => {
    expect(parseLogPage(null, null)).toEqual({ limit: DEFAULT_LOG_PAGE, offset: 0 });
    expect(parseLogPage('1000000', '20')).toEqual({ limit: MAX_LOG_PAGE, offset: 20 });
    expect(parseLogPage('-5', '-1')).toEqual({ limit: DEFAULT_LOG_PAGE, offset: 0 });
    expect(parseLogPage('abc', 'xyz')).toEqual({ limit: DEFAULT_LOG_PAGE, offset: 0 });
    expect(parseLogPage('25', '0')).toEqual({ limit: 25, offset: 0 });
  });
});

describe('the browser and the function agree on what may be reported', () => {
  it('src/lib/audit.ts lists exactly the actions the function accepts', () => {
    expect([...BROWSER_ACTIONS].sort()).toEqual([...CLIENT_AUDIT_ACTIONS].sort());
  });

  it('every logAuditEvent call in src uses an allowed action', () => {
    // Belt and braces next to the ClientAuditAction type: a call written with
    // a cast would still be caught here.
    const files = [
      'src/stores/useAuthStore.ts',
      'src/hooks/useProfile.ts',
      'src/hooks/useListings.ts',
    ];
    const used = new Set<string>();
    for (const file of files) {
      const text = readFileSync(resolve(ROOT, file), 'utf8');
      for (const m of text.matchAll(/logAuditEvent\(\s*'([a-z_]+)'/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const action of used) expect(CLIENT_AUDIT_ACTIONS).toContain(action);
  });

  it('the function validates through the policy and stores details as an object', () => {
    const index = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
    expect(index).toMatch(/parseClientAuditEvent\(/);
    expect(index).toMatch(/p_details: event\.details/);
    expect(index).toMatch(/p_risk_level: event\.riskLevel/);
    expect(index).not.toMatch(/JSON\.stringify\(details\)/);
    expect(index).not.toMatch(/riskLevel \|\|/);
  });
});
