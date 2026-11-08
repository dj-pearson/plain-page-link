/**
 * US-414 (US-403): what the subject is told about their queued data exports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: vi.fn() } },
  supabaseConfig: { functionsUrl: 'https://functions.example.test' },
}));

import { EdgeFunctionError } from '@/lib/edgeFunctions';
import {
  EXPORT_REQUEST_COLUMNS,
  describeExportFailure,
  describeExportRequest,
  describeQueueError,
  describeResendError,
  hasExportInFlight,
  MIN_RESEND_LINK_MS,
  shouldOfferQueuedExport,
  type ExportRequestRow,
} from './dataExportRequests';

const row = (over: Partial<ExportRequestRow>): ExportRequestRow => ({
  id: 'r1',
  status: 'pending',
  created_at: '2026-11-01T10:00:00Z',
  processed_at: null,
  completed_at: null,
  failed_reason: null,
  file_expires_at: null,
  ...over,
});

const err = (status: number) => new EdgeFunctionError('x', { functionName: 'gdpr-export', status });
const NOW = new Date('2026-11-05T00:00:00Z');

describe('EXPORT_REQUEST_COLUMNS', () => {
  it('never reads file_url: the link exists only in the email', () => {
    expect(EXPORT_REQUEST_COLUMNS).not.toMatch(/file_url/);
    expect(EXPORT_REQUEST_COLUMNS).toMatch(/failed_reason/);
  });
});

describe('describeExportRequest', () => {
  it('a fresh request is queued, with the email promise', () => {
    const v = describeExportRequest(row({}), NOW);
    expect(v.label).toBe('Queued');
    expect(v.tone).toBe('progress');
    expect(v.detail).toMatch(/email you a download link/);
  });

  it('a pending request that already failed once is retrying', () => {
    expect(describeExportRequest(row({ failed_reason: 'Could not read: leads' }), NOW).label).toBe(
      'Retrying'
    );
  });

  it('processing is being prepared', () => {
    expect(describeExportRequest(row({ status: 'processing' }), NOW).label).toBe('Being prepared');
  });

  it('a completed export with a live link says until when', () => {
    const v = describeExportRequest(
      row({ status: 'completed', file_expires_at: '2026-11-08T10:00:00Z' }),
      NOW
    );
    expect(v.label).toBe('Ready');
    expect(v.detail).toMatch(/Sent by email/);
  });

  it('a completed export past its expiry is expired', () => {
    const v = describeExportRequest(
      row({ status: 'completed', file_expires_at: '2026-11-02T10:00:00Z' }),
      NOW
    );
    expect(v.label).toBe('Expired');
    expect(v.tone).toBe('neutral');
  });

  it('a request closed by an immediate download is completed with no link', () => {
    const v = describeExportRequest(row({ status: 'completed' }), NOW);
    expect(v.label).toBe('Completed');
    expect(v.detail).toBeNull();
  });

  it('a failed request gives the reason in words for the subject', () => {
    const v = describeExportRequest(
      row({
        status: 'failed',
        failed_reason: 'The account has no email address to send the link to.',
      }),
      NOW
    );
    expect(v.label).toBe('Failed');
    expect(v.tone).toBe('failed');
    expect(v.detail).toMatch(/no email address/);
  });
});

describe('describeExportFailure', () => {
  it('does not paste an operator error verbatim', () => {
    const text = describeExportFailure('StorageApiError: bucket not found');
    expect(text).not.toMatch(/StorageApiError/);
    expect(text).toMatch(/request a new one/);
  });

  it('explains an unreadable section', () => {
    expect(describeExportFailure('Could not read: leads, contacts')).toMatch(/could not be read/);
  });

  it('handles a missing reason', () => {
    expect(describeExportFailure(null)).toMatch(/could not build/);
  });
});

describe('hasExportInFlight', () => {
  it('is true for pending or processing only', () => {
    expect(hasExportInFlight([row({ status: 'processing' })])).toBe(true);
    expect(hasExportInFlight([row({ status: 'failed' }), row({ status: 'completed' })])).toBe(
      false
    );
    expect(hasExportInFlight([])).toBe(false);
  });
});

describe('shouldOfferQueuedExport', () => {
  it('offers the emailed link when the server could not finish', () => {
    expect(shouldOfferQueuedExport(err(503))).toBe(true);
    expect(shouldOfferQueuedExport(err(504))).toBe(true);
    expect(shouldOfferQueuedExport(err(502))).toBe(true);
  });

  it('offers it when the browser stopped waiting or the connection dropped', () => {
    expect(shouldOfferQueuedExport(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(shouldOfferQueuedExport(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not offer it for a sign-in or rate-limit failure', () => {
    expect(shouldOfferQueuedExport(err(401))).toBe(false);
    expect(shouldOfferQueuedExport(err(429))).toBe(false);
    expect(shouldOfferQueuedExport(new Error('boom'))).toBe(false);
  });
});

describe('describeQueueError', () => {
  it('a 409 says one is already on its way', () => {
    expect(describeQueueError(err(409))).toMatch(/already on its way/);
  });
  it('a 429 says try later', () => {
    expect(describeQueueError(err(429))).toMatch(/try again later/);
  });
  it('anything else is generic', () => {
    expect(describeQueueError(new Error('x'))).toMatch(/could not queue/);
  });
});

describe('resending an export link (US-404)', () => {
  it('only a completed export whose file is still held can be re-sent', () => {
    const live = row({ status: 'completed', file_expires_at: '2026-11-08T10:00:00Z' });
    expect(describeExportRequest(live, NOW).canResend).toBe(true);
    expect(
      describeExportRequest(
        row({ status: 'completed', file_expires_at: '2026-11-02T10:00:00Z' }),
        NOW
      ).canResend
    ).toBe(false);
    // Closed by an immediate download: there is no file.
    expect(describeExportRequest(row({ status: 'completed' }), NOW).canResend).toBe(false);
    for (const status of ['pending', 'processing', 'failed', 'cancelled']) {
      expect(describeExportRequest(row({ status }), NOW).canResend).toBe(false);
    }
  });

  it('a link about to expire is not offered (the server refuses under five minutes)', () => {
    const soon = new Date(NOW.getTime() + MIN_RESEND_LINK_MS - 1000).toISOString();
    expect(
      describeExportRequest(row({ status: 'completed', file_expires_at: soon }), NOW).canResend
    ).toBe(false);
  });

  it('explains each refusal in words', () => {
    expect(describeResendError(err(410))).toMatch(/expired/);
    expect(describeResendError(err(409))).toMatch(/not been sent yet/);
    expect(describeResendError(err(422))).toMatch(/no email address/);
    expect(describeResendError(err(429))).toMatch(/spam folder/);
    expect(describeResendError(err(404))).toMatch(/not found/);
    expect(describeResendError(new Error('x'))).toMatch(/could not send/);
  });
});
