/**
 * What a browser may write to audit_logs through the audit-log function.
 *
 * Before this, any signed-in user could POST any `action` with any
 * `riskLevel` and it was stored under their user id exactly as sent, so a row
 * reading `admin_action` / critical or `mfa_disable` / high was
 * indistinguishable from one the server wrote. An audit trail the subject can
 * write to freely is not evidence of anything (SOC 2, GDPR accountability).
 *
 * Now the browser may report only the actions the app itself reports
 * (`CLIENT_AUDIT_ACTIONS`, from src/lib/audit.ts callers). Risk is decided
 * here and never above `medium`, because the server cannot verify a
 * client-reported event; the high and critical events (MFA, sessions,
 * deletion, export, admin) are written server-side by the functions that do
 * the work. Every stored row is tagged `details.client_reported = true` so the
 * audit viewers and any export can tell the two apart.
 *
 * Pure (no Deno globals) so vitest can import it.
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

export const AUDIT_STATUSES = ['success', 'failure', 'blocked'] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

/** Serialised size above which `details` is replaced by a truncation marker. */
export const MAX_DETAILS_BYTES = 64 * 1024;
export const MAX_RESOURCE_ID_LENGTH = 128;
const RESOURCE_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

/** Rows per GET page: bounded so one request cannot read the whole history. */
export const MAX_LOG_PAGE = 100;
export const DEFAULT_LOG_PAGE = 50;

export interface ClientAuditEvent {
  action: ClientAuditAction;
  status: AuditStatus;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium';
}

export type ClientAuditResult =
  | { ok: true; event: ClientAuditEvent }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate a POST body and turn it into the row to store. Anything the client
 * sends as `riskLevel` is ignored.
 */
export function parseClientAuditEvent(body: unknown): ClientAuditResult {
  if (!isPlainObject(body)) return { ok: false, error: 'Request body must be a JSON object' };

  const { action, status, resourceType, resourceId, details } = body;

  if (typeof action !== 'string' || !(CLIENT_AUDIT_ACTIONS as readonly string[]).includes(action)) {
    return { ok: false, error: 'action is not one a client may report' };
  }
  if (typeof status !== 'string' || !(AUDIT_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'status must be success, failure or blocked' };
  }
  if (resourceType != null && (typeof resourceType !== 'string' || !RESOURCE_TYPE_PATTERN.test(resourceType))) {
    return { ok: false, error: 'resourceType is invalid' };
  }
  if (
    resourceId != null &&
    (typeof resourceId !== 'string' || resourceId.length === 0 || resourceId.length > MAX_RESOURCE_ID_LENGTH)
  ) {
    return { ok: false, error: 'resourceId is invalid' };
  }
  if (details != null && !isPlainObject(details)) {
    return { ok: false, error: 'details must be an object' };
  }

  let stored: Record<string, unknown> = details ? { ...details } : {};
  const size = new TextEncoder().encode(JSON.stringify(stored)).length;
  if (size > MAX_DETAILS_BYTES) stored = { details_truncated: true, details_bytes: size };
  // Set last, so a client cannot pass client_reported: false.
  stored.client_reported = true;

  return {
    ok: true,
    event: {
      action: action as ClientAuditAction,
      status: status as AuditStatus,
      resourceType: (resourceType as string | null | undefined) ?? null,
      resourceId: (resourceId as string | null | undefined) ?? null,
      details: stored,
      riskLevel: status === 'success' ? 'low' : 'medium',
    },
  };
}

/** limit/offset from the query string, clamped to sane bounds. */
export function parseLogPage(limitParam: string | null, offsetParam: string | null): {
  limit: number;
  offset: number;
} {
  const limit = Number.parseInt(limitParam ?? '', 10);
  const offset = Number.parseInt(offsetParam ?? '', 10);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, MAX_LOG_PAGE) : DEFAULT_LOG_PAGE,
    offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
  };
}
