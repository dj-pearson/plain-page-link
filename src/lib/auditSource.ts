/**
 * Who wrote an audit_logs row (US-675).
 *
 * The audit-log edge function is the only path a browser has into audit_logs
 * (there is no INSERT policy for anon/authenticated), and since US-657 it tags
 * every row it stores with `details.client_reported = true`, set last so the
 * client cannot clear it. Everything else is written by service-role code that
 * did the work (MFA, sessions, deletion, export, admin actions). The viewers
 * use this to mark the browser's rows and to let an admin read the
 * server-verified trail on its own.
 */
import type { Json } from '@/integrations/supabase/types';

export type AuditSourceFilter = 'all' | 'server' | 'client';

export const AUDIT_SOURCE_OPTIONS: ReadonlyArray<{ value: AuditSourceFilter; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'server', label: 'Server-written only' },
  { value: 'client', label: 'Reported by browser only' },
];

/** The marker's text and its explanation, shared by both viewers. */
export const CLIENT_REPORTED_LABEL = 'Reported by browser';
export const CLIENT_REPORTED_HINT =
  'Sent by the app in the browser. The server checked the action and set the risk level, but could not verify the event happened.';

/**
 * Rows the function stored before it began tagging them cannot be told apart
 * from server rows (US-668), so the server-only view says so.
 */
export const SERVER_FILTER_CAVEAT =
  'Browser reports stored before they were tagged (November 2026) still count as server-written.';

export function isAuditSourceFilter(value: string): value is AuditSourceFilter {
  return value === 'all' || value === 'server' || value === 'client';
}

/** True when the row came through the audit-log function (the browser). */
export function isClientReported(details: Json | null | undefined): boolean {
  return (
    typeof details === 'object' &&
    details !== null &&
    !Array.isArray(details) &&
    details.client_reported === true
  );
}

/**
 * The PostgREST filter for a source. A server row has no details, or details
 * without the tag; `neq` alone would drop rows whose details are null, because
 * NULL <> 'true' is not true in SQL.
 */
export type AuditSourceQuery =
  | { kind: 'none' }
  | { kind: 'eq'; column: string; value: string }
  | { kind: 'or'; filter: string };

export function auditSourceQuery(source: AuditSourceFilter): AuditSourceQuery {
  switch (source) {
    case 'client':
      return { kind: 'eq', column: 'details->>client_reported', value: 'true' };
    case 'server':
      return {
        kind: 'or',
        filter:
          'details.is.null,details->>client_reported.is.null,details->>client_reported.neq.true',
      };
    default:
      return { kind: 'none' };
  }
}
