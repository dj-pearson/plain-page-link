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
 * @param action - e.g. 'login', 'logout', 'profile_update', 'listing_create'
 */
export function logAuditEvent(action: string, options: AuditEventOptions = {}): void {
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
