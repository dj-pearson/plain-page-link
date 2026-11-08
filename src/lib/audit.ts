/**
 * Client-side audit logging.
 *
 * Records security-relevant user actions to the audit_logs table via the
 * audit-log edge function. All calls are fire-and-forget: a failure to
 * log must never block or break the UI flow that triggered it.
 */

import { callEdgeFunction } from '@/lib/edgeFunctions';
import { logger } from '@/lib/logger';

export type AuditStatus = 'success' | 'failure' | 'blocked';

/**
 * The only actions the browser may report (US-657). The audit-log function
 * refuses any other with a 400, so a new one must be added to
 * CLIENT_AUDIT_ACTIONS in supabase/functions/audit-log/policy.ts too (a test
 * holds the two lists together). Security-relevant events (MFA, sessions,
 * deletion, export, admin actions) are written server-side, never from here.
 */
export const CLIENT_AUDIT_ACTIONS = [
  'login',
  'logout',
  'profile_update',
  'listing_create',
  'listing_update',
  'listing_reorder',
  'listing_import',
  'listing_delete',
] as const;

export type ClientAuditAction = (typeof CLIENT_AUDIT_ACTIONS)[number];

export interface AuditEventOptions {
  status?: AuditStatus;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an audit event. Never throws — errors are swallowed and logged at
 * debug level so audit logging cannot degrade the user experience.
 *
 * @param action - one of CLIENT_AUDIT_ACTIONS
 */
export function logAuditEvent(action: ClientAuditAction, options: AuditEventOptions = {}): void {
  const { status = 'success', resourceType, resourceId, details } = options;

  // Intentionally not awaited: fire-and-forget.
  void callEdgeFunction('audit-log', {
    method: 'POST',
    auth: true,
    body: {
      action,
      status,
      resourceType,
      resourceId,
      details,
    },
  }).catch((error) => {
    logger.debug('Audit log failed (non-blocking)', {
      action,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
