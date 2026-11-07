/**
 * Queued data exports, as the subject sees them (US-414, US-403).
 *
 * gdpr-export's POST queues an export that scheduled-maintenance builds into
 * the private gdpr-exports bucket and emails as a signed link (US-397). No
 * screen called it, so the only way a subject could ask for their data was the
 * immediate GET, which builds the whole document inside one browser request —
 * and an account large enough to time that out had no way to get its data at
 * all.
 *
 * The subject reads their own rows through the "Users can view own GDPR
 * requests" SELECT policy. `file_url` is deliberately never selected: it is the
 * object's path in the private bucket, and the link is only ever sent by email.
 */

import { EdgeFunctionError } from '@/lib/edgeFunctions';

/** Every column the settings screen reads. Never file_url. */
export const EXPORT_REQUEST_COLUMNS =
  'id, status, created_at, processed_at, completed_at, failed_reason, file_expires_at';

/** How many past requests the screen lists. */
export const EXPORT_REQUEST_LIST_LIMIT = 5;

/**
 * How long the immediate download may take before the screen gives up and
 * offers the emailed link instead. The export keeps building on the server
 * after the browser stops waiting; the rate limit already counted it.
 */
export const IMMEDIATE_EXPORT_TIMEOUT_MS = 90_000;

export interface ExportRequestRow {
  id: string;
  status: string;
  created_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  failed_reason: string | null;
  file_expires_at: string | null;
}

export type ExportRequestTone = 'progress' | 'done' | 'failed' | 'neutral';

export interface ExportRequestView {
  id: string;
  label: string;
  tone: ExportRequestTone;
  /** One sentence the subject can act on, or null. */
  detail: string | null;
  requestedAt: string | null;
}

/** True when an export for this subject is still on its way. */
export function hasExportInFlight(rows: readonly ExportRequestRow[]): boolean {
  return rows.some((r) => r.status === 'pending' || r.status === 'processing');
}

/**
 * The reason the queue recorded, in words for the subject. failed_reason is
 * written for operators (a storage error, the sections that could not be
 * read); pasting it verbatim would show "StorageApiError: ..." to an agent.
 */
export function describeExportFailure(reason: string | null): string {
  const text = (reason ?? '').trim();
  if (/^could not read:/i.test(text)) {
    return 'Some of your data could not be read while the export was being built, so we did not send an incomplete file. Please request a new export.';
  }
  if (/no email|email address/i.test(text)) {
    return 'Your account has no email address to send the link to. Add one, then request a new export, or use Download now.';
  }
  return 'We could not build this export. Please request a new one, or contact support if it keeps failing.';
}

/** One request, as a status line for the settings screen. */
export function describeExportRequest(
  row: ExportRequestRow,
  now: Date = new Date()
): ExportRequestView {
  const base = { id: row.id, requestedAt: row.created_at };
  switch (row.status) {
    case 'pending':
      return {
        ...base,
        label: row.failed_reason ? 'Retrying' : 'Queued',
        tone: 'progress',
        detail: row.failed_reason
          ? 'The first attempt did not finish. We will try again automatically and email you when it is ready.'
          : 'We will email you a download link, usually within the hour.',
      };
    case 'processing':
      return {
        ...base,
        label: 'Being prepared',
        tone: 'progress',
        detail: 'We will email you a download link when it is ready.',
      };
    case 'completed': {
      const expires = row.file_expires_at ? new Date(row.file_expires_at) : null;
      if (expires && !Number.isNaN(expires.getTime())) {
        return expires.getTime() > now.getTime()
          ? {
              ...base,
              label: 'Ready',
              tone: 'done',
              detail: `Sent by email. The link works until ${expires.toLocaleDateString()}.`,
            }
          : {
              ...base,
              label: 'Expired',
              tone: 'neutral',
              detail:
                'The link has expired and the file was deleted. Request a new export if you need one.',
            };
      }
      // Closed by an immediate download rather than built by the queue.
      return { ...base, label: 'Completed', tone: 'done', detail: null };
    }
    case 'failed':
      return {
        ...base,
        label: 'Failed',
        tone: 'failed',
        detail: describeExportFailure(row.failed_reason),
      };
    case 'cancelled':
      return { ...base, label: 'Cancelled', tone: 'neutral', detail: null };
    default:
      return { ...base, label: row.status, tone: 'neutral', detail: null };
  }
}

/**
 * Whether a failed immediate download should offer the emailed link instead:
 * the server could not finish it (503 — a section could not be read — or a
 * gateway 502/504), or the browser stopped waiting, or the connection dropped.
 * A 401 or 429 is not helped by queueing.
 */
export function shouldOfferQueuedExport(error: unknown): boolean {
  if (error instanceof EdgeFunctionError) {
    return error.status === 502 || error.status === 503 || error.status === 504;
  }
  if (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  ) {
    return true;
  }
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return true;
  }
  // fetch rejects with a TypeError when the connection itself fails.
  return error instanceof TypeError;
}

/** The message for a failed POST, in words for the subject. */
export function describeQueueError(error: unknown): string {
  if (error instanceof EdgeFunctionError) {
    if (error.status === 409) {
      return 'An export is already on its way. We will email you the link when it is ready.';
    }
    if (error.status === 429) {
      return 'You have requested several exports in the last hour. Please try again later.';
    }
  }
  return 'We could not queue your export. Please try again.';
}
