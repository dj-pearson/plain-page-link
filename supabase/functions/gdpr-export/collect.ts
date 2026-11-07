/**
 * What a data export contains, and how it is read (US-269).
 *
 * The export used to be seventeen bare queries whose `error` was never looked
 * at, each coalesced with `|| []`. A failed query therefore exported as an
 * empty section — the subject was told "you have no leads" rather than "we
 * could not read your leads" — and the request was still marked completed.
 * Every list was also a single request, so PostgREST's row cap (1,000 on
 * Supabase) silently truncated anything larger, and analytics, login attempts
 * and the audit log were cut further by hand-written limits. Lead activity,
 * pages, workflows, invoices, notifications, API keys and team memberships
 * were not exported at all.
 *
 * This module has no Deno globals and no URL imports so the unit suite can
 * run it. index.ts adapts the service-role client to {@link ExportReader}.
 */

export const PAGE_SIZE = 1000;

/**
 * A ceiling per section so one runaway table cannot hold the function open
 * forever. A section that reaches it is reported in `meta.truncated`, never
 * cut silently.
 */
export const MAX_ROWS_PER_SECTION = 100_000;

export type Row = Record<string, unknown>;

export interface ReadError {
  message: string;
  code?: string;
}

export interface ReadResult<T> {
  data: T | null;
  error: ReadError | null;
}

/** The two reads an export needs, so tests can supply a fake. */
export interface ExportReader {
  /** Rows `from..to` (inclusive) of `table` where `ownerColumn = userId`, ordered by id. */
  page(spec: SectionSpec, userId: string, from: number, to: number): PromiseLike<ReadResult<Row[]>>;
  /** At most one row; no row is `data: null` without an error. */
  one(spec: SectionSpec, userId: string): PromiseLike<ReadResult<Row>>;
}

export interface SectionSpec {
  /** Key in the export document. */
  key: string;
  table: string;
  /**
   * Explicit columns wherever the table holds a secret the subject should not
   * receive back (token hashes, TOTP seeds, API key hashes). `*` elsewhere:
   * the subject is entitled to the whole row.
   */
  columns: string;
  ownerColumn: string;
  single?: boolean;
}

export const SECTIONS: readonly SectionSpec[] = [
  { key: 'profile', table: 'profiles', columns: '*', ownerColumn: 'id', single: true },
  { key: 'settings', table: 'user_settings', columns: '*', ownerColumn: 'user_id', single: true },
  { key: 'listings', table: 'listings', columns: '*', ownerColumn: 'user_id' },
  { key: 'openHouses', table: 'open_houses', columns: '*', ownerColumn: 'user_id' },
  { key: 'leads', table: 'leads', columns: '*', ownerColumn: 'user_id' },
  { key: 'leadActivities', table: 'lead_activities', columns: '*', ownerColumn: 'user_id' },
  { key: 'contacts', table: 'contacts', columns: '*', ownerColumn: 'user_id' },
  { key: 'contactKeyDates', table: 'contact_key_dates', columns: '*', ownerColumn: 'user_id' },
  { key: 'contactInteractions', table: 'contact_interactions', columns: '*', ownerColumn: 'user_id' },
  { key: 'testimonials', table: 'testimonials', columns: '*', ownerColumn: 'user_id' },
  { key: 'links', table: 'links', columns: '*', ownerColumn: 'user_id' },
  { key: 'customPages', table: 'custom_pages', columns: '*', ownerColumn: 'user_id' },
  { key: 'blogPosts', table: 'articles', columns: '*', ownerColumn: 'author_id' },
  { key: 'workflows', table: 'workflows', columns: '*', ownerColumn: 'user_id' },
  { key: 'notifications', table: 'notifications', columns: '*', ownerColumn: 'user_id' },
  { key: 'subscriptions', table: 'user_subscriptions', columns: '*', ownerColumn: 'user_id' },
  { key: 'invoices', table: 'invoices', columns: '*', ownerColumn: 'user_id' },
  { key: 'teamMemberships', table: 'team_members',
    columns: 'id, team_id, user_id, email, role, invited_at, invite_sent_at, accepted_at',
    ownerColumn: 'user_id' },
  { key: 'roles', table: 'user_roles', columns: 'id, role', ownerColumn: 'user_id' },
  { key: 'profileViews', table: 'analytics_views', columns: '*', ownerColumn: 'user_id' },
  { key: 'analyticsEvents', table: 'analytics_events', columns: '*', ownerColumn: 'user_id' },
  { key: 'sessions', table: 'user_sessions',
    columns: 'id, created_at, last_activity_at, expires_at, ip_address, user_agent, browser, os, device_type, location_city, location_country, is_current, revoked, revoked_at, revoked_reason',
    ownerColumn: 'user_id' },
  { key: 'loginAttempts', table: 'login_attempts',
    columns: 'id, created_at, email, success, failure_reason, ip_address, user_agent, device_fingerprint',
    ownerColumn: 'user_id' },
  { key: 'mfaSettings', table: 'user_mfa_settings',
    columns: 'id, mfa_enabled, mfa_method, verified_at, last_used_at, backup_codes_generated_at, created_at, updated_at',
    ownerColumn: 'user_id', single: true },
  { key: 'apiKeys', table: 'api_keys',
    columns: 'id, name, description, key_prefix, scopes, permissions, is_active, created_at, last_used_at, expires_at, revoked_at',
    ownerColumn: 'user_id' },
  { key: 'auditLogs', table: 'audit_logs', columns: '*', ownerColumn: 'user_id' },
  { key: 'gdprRequests', table: 'gdpr_data_requests',
    columns: 'id, request_type, status, created_at, processed_at, completed_at, scheduled_deletion_at, failed_reason, ip_address, user_agent',
    ownerColumn: 'user_id' },
];

export interface CollectedSections {
  rows: Record<string, Row[]>;
  singles: Record<string, Row | null>;
  /** Sections that reached {@link MAX_ROWS_PER_SECTION}. */
  truncated: string[];
}

/** One or more sections could not be read; nothing should be handed out. */
export class ExportIncompleteError extends Error {
  readonly failed: { section: string; message: string }[];
  constructor(failed: { section: string; message: string }[]) {
    super(
      `We could not read part of your data (${failed.map((f) => f.section).join(', ')}). ` +
        'Nothing was downloaded. Please try again in a few minutes.'
    );
    this.name = 'ExportIncompleteError';
    this.failed = failed;
  }
}

/** Every row of one section, page by page, until a short page. */
export async function readAllRows(
  reader: ExportReader,
  spec: SectionSpec,
  userId: string,
  pageSize = PAGE_SIZE,
  maxRows = MAX_ROWS_PER_SECTION
): Promise<{ rows: Row[]; truncated: boolean }> {
  const rows: Row[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const to = Math.min(from + pageSize, maxRows) - 1;
    const { data, error } = await reader.page(spec, userId, from, to);
    if (error) throw new Error(error.message || 'query failed');
    const page = data ?? [];
    rows.push(...page);
    if (page.length < to - from + 1) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

/**
 * Reads every section. Sections are independent and read concurrently, but a
 * failure in any one fails the whole export with the list of what failed —
 * an export missing a section is worse than none, because it reads as
 * complete.
 */
export async function collectSections(
  reader: ExportReader,
  userId: string,
  sections: readonly SectionSpec[] = SECTIONS,
  pageSize = PAGE_SIZE,
  maxRows = MAX_ROWS_PER_SECTION
): Promise<CollectedSections> {
  const result: CollectedSections = { rows: {}, singles: {}, truncated: [] };
  const failed: { section: string; message: string }[] = [];

  await Promise.all(
    sections.map(async (spec) => {
      try {
        if (spec.single) {
          const { data, error } = await reader.one(spec, userId);
          if (error) throw new Error(error.message || 'query failed');
          result.singles[spec.key] = data ?? null;
        } else {
          const { rows, truncated } = await readAllRows(reader, spec, userId, pageSize, maxRows);
          result.rows[spec.key] = rows;
          if (truncated) result.truncated.push(spec.key);
        }
      } catch (err) {
        failed.push({ section: spec.key, message: err instanceof Error ? err.message : String(err) });
      }
    })
  );

  if (failed.length > 0) {
    // Report in SECTIONS order, not completion order, so the message is stable.
    const order = sections.map((s) => s.key);
    failed.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));
    throw new ExportIncompleteError(failed);
  }
  result.truncated.sort();
  return result;
}

/** Row counts per section, for the audit entry. */
export function sectionCounts(collected: CollectedSections): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, rows] of Object.entries(collected.rows)) counts[key] = rows.length;
  for (const [key, row] of Object.entries(collected.singles)) counts[key] = row ? 1 : 0;
  return counts;
}

/** A login attempt's device fingerprint is reported as present, not handed back. */
export function maskLoginAttempt(attempt: Row): Row {
  return { ...attempt, device_fingerprint: attempt.device_fingerprint ? '[PRESENT]' : null };
}
