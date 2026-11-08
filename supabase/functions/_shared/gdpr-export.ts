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
 * This module has no Deno globals and no URL runtime imports so the unit
 * suite can run it. It is shared by gdpr-export (the immediate GET download)
 * and scheduled-maintenance (queued exports, US-397), so both hand out the
 * same document.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

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

/**
 * Hands each page of one section to `onPage` as it is read, until a short
 * page, and keeps none of them. Throws on the first page that fails.
 */
export async function forEachPage(
  reader: ExportReader,
  spec: SectionSpec,
  userId: string,
  onPage: (rows: Row[]) => void | Promise<void>,
  pageSize = PAGE_SIZE,
  maxRows = MAX_ROWS_PER_SECTION
): Promise<{ count: number; truncated: boolean }> {
  let count = 0;
  for (let from = 0; from < maxRows; from += pageSize) {
    const to = Math.min(from + pageSize, maxRows) - 1;
    const { data, error } = await reader.page(spec, userId, from, to);
    if (error) throw new Error(error.message || 'query failed');
    const page = data ?? [];
    count += page.length;
    if (page.length > 0) await onPage(page);
    if (page.length < to - from + 1) return { count, truncated: false };
  }
  return { count, truncated: true };
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
  const { truncated } = await forEachPage(reader, spec, userId, (page) => void rows.push(...page), pageSize, maxRows);
  return { rows, truncated };
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

/** {@link ExportReader} over a service-role client. */
export function supabaseExportReader(supabase: SupabaseClient): ExportReader {
  return {
    page: (spec, userId, from, to) =>
      supabase
        .from(spec.table)
        .select(spec.columns)
        .eq(spec.ownerColumn, userId)
        .order('id', { ascending: true })
        .range(from, to) as unknown as PromiseLike<ReadResult<Row[]>>,
    one: (spec, userId) =>
      supabase
        .from(spec.table)
        .select(spec.columns)
        .eq(spec.ownerColumn, userId)
        .maybeSingle() as unknown as PromiseLike<ReadResult<Row>>,
  };
}

/** The auth.users fields the export reports. */
export interface ExportSubject {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
}

/** decryptSecret, injected so this module stays free of Deno globals. */
export type Decrypt = (value: string | null) => Promise<string | null | undefined>;

/** Lead and contact rows with encrypted_email / encrypted_phone swapped for the plaintext. */
export function decryptPiiRows(list: Row[], decrypt: Decrypt): Promise<Row[]> {
  return Promise.all(
    list.map(async (row) => {
      const { encrypted_phone, encrypted_email, ...rest } = row;
      const [email, phone] = await Promise.all([
        decrypt((encrypted_email as string | null) ?? null),
        decrypt((encrypted_phone as string | null) ?? null),
      ]);
      return { ...rest, email: email ?? null, phone: phone ?? null };
    })
  );
}

function exportUser(subject: ExportSubject) {
  return {
    id: subject.id,
    email: subject.email || '',
    createdAt: subject.created_at || '',
    lastSignIn: subject.last_sign_in_at || null,
  };
}

/**
 * The export document. Lead and contact PII is decrypted for the subject's own
 * copy: encrypted_* are the only store since US-086, so an export that handed
 * back ciphertext would not be an export at all.
 */
export async function buildExportDocument(
  subject: ExportSubject,
  collected: CollectedSections,
  decrypt: Decrypt,
  now: Date = new Date()
): Promise<Record<string, unknown>> {
  const { rows, singles } = collected;
  const [leads, contacts] = await Promise.all([
    decryptPiiRows(rows.leads ?? [], decrypt),
    decryptPiiRows(rows.contacts ?? [], decrypt),
  ]);

  return {
    exportedAt: now.toISOString(),
    user: exportUser(subject),
    profile: singles.profile ?? null,
    settings: singles.settings ?? null,
    listings: rows.listings ?? [],
    openHouses: rows.openHouses ?? [],
    leads,
    leadActivities: rows.leadActivities ?? [],
    contacts,
    contactKeyDates: rows.contactKeyDates ?? [],
    contactInteractions: rows.contactInteractions ?? [],
    testimonials: rows.testimonials ?? [],
    links: rows.links ?? [],
    customPages: rows.customPages ?? [],
    blogPosts: rows.blogPosts ?? [],
    workflows: rows.workflows ?? [],
    notifications: rows.notifications ?? [],
    billing: {
      subscriptions: rows.subscriptions ?? [],
      invoices: rows.invoices ?? [],
    },
    teams: {
      memberships: rows.teamMemberships ?? [],
      roles: rows.roles ?? [],
    },
    analytics: {
      profileViews: rows.profileViews ?? [],
      events: rows.analyticsEvents ?? [],
    },
    security: {
      sessions: rows.sessions ?? [],
      loginAttempts: (rows.loginAttempts ?? []).map(maskLoginAttempt),
      mfaSettings: singles.mfaSettings ?? null,
      apiKeys: rows.apiKeys ?? [],
      auditLogs: rows.auditLogs ?? [],
    },
    gdprRequests: rows.gdprRequests ?? [],
    meta: {
      counts: sectionCounts(collected),
      // Sections that hit the per-section ceiling. Named so a partial
      // section is never mistaken for a complete one.
      truncated: collected.truncated,
    },
  };
}

/*
 * Writing the export a page at a time (US-576, US-405 slice 1).
 *
 * buildExportDocument needs every section in memory at once: up to 100,000
 * rows in each of 27 sections, then a decrypted copy of leads and contacts,
 * then JSON.stringify of the whole document into one string. The queued job
 * held all three together, so the largest accounts were the ones whose export
 * could exhaust the function's memory.
 *
 * writeExportDocument produces the same bytes as
 * JSON.stringify(buildExportDocument(...), null, 2) (the tests hold the two
 * together), but reads one page of one section at a time, decrypts and
 * serialises that page, and lets the rows go. Peak memory is the serialised
 * file plus a single page, not every section's row objects plus their copies.
 *
 * Sections are read one after another rather than concurrently: this runs in
 * the hourly job with nobody waiting on it, and concurrent reads would hold a
 * page of every section at once again.
 */

type LayoutNode =
  | { section: string }
  | { computed: 'exportedAt' | 'user' | 'meta' }
  | { group: readonly (readonly [string, LayoutNode])[] };

const section = (key: string): LayoutNode => ({ section: key });

/** The export document's shape, in buildExportDocument's key order. */
const DOCUMENT_LAYOUT: LayoutNode = {
  group: [
    ['exportedAt', { computed: 'exportedAt' }],
    ['user', { computed: 'user' }],
    ['profile', section('profile')],
    ['settings', section('settings')],
    ['listings', section('listings')],
    ['openHouses', section('openHouses')],
    ['leads', section('leads')],
    ['leadActivities', section('leadActivities')],
    ['contacts', section('contacts')],
    ['contactKeyDates', section('contactKeyDates')],
    ['contactInteractions', section('contactInteractions')],
    ['testimonials', section('testimonials')],
    ['links', section('links')],
    ['customPages', section('customPages')],
    ['blogPosts', section('blogPosts')],
    ['workflows', section('workflows')],
    ['notifications', section('notifications')],
    ['billing', { group: [['subscriptions', section('subscriptions')], ['invoices', section('invoices')]] }],
    ['teams', { group: [['memberships', section('teamMemberships')], ['roles', section('roles')]] }],
    ['analytics', { group: [['profileViews', section('profileViews')], ['events', section('analyticsEvents')]] }],
    [
      'security',
      {
        group: [
          ['sessions', section('sessions')],
          ['loginAttempts', section('loginAttempts')],
          ['mfaSettings', section('mfaSettings')],
          ['apiKeys', section('apiKeys')],
          ['auditLogs', section('auditLogs')],
        ],
      },
    ],
    ['gdprRequests', section('gdprRequests')],
    ['meta', { computed: 'meta' }],
  ],
};

/** Section keys the written document contains, in the order it writes them. */
export function layoutSectionKeys(node: LayoutNode = DOCUMENT_LAYOUT): string[] {
  if ('section' in node) return [node.section];
  if ('group' in node) return node.group.flatMap(([, child]) => layoutSectionKeys(child));
  return [];
}

/** How a section's rows are changed on their way into the export. */
const ROW_TRANSFORMS: Record<string, (rows: Row[], decrypt: Decrypt) => Row[] | Promise<Row[]>> = {
  leads: decryptPiiRows,
  contacts: decryptPiiRows,
  loginAttempts: (rows) => rows.map(maskLoginAttempt),
};

/** JSON.stringify(value, null, 2) for a value nested at `indent`. */
function pretty(value: unknown, indent: string): string {
  // Newlines in JSON.stringify output are only ever structural: a newline
  // inside a string value is escaped.
  return JSON.stringify(value, null, 2).replace(/\n/g, `\n${indent}`);
}

export interface WrittenExport {
  /** The document's text, in order; join them, or hand them to a Blob, for the file. */
  chunks: string[];
  /** Row counts per section, as {@link sectionCounts} reports them. */
  counts: Record<string, number>;
  /** Sections that reached the per-section ceiling. */
  truncated: string[];
}

/**
 * The export document as text, read and written one page at a time. Throws
 * {@link ExportIncompleteError}, naming every section that could not be read,
 * rather than returning a document missing one.
 */
export async function writeExportDocument(
  reader: ExportReader,
  subject: ExportSubject,
  decrypt: Decrypt,
  now: Date = new Date(),
  pageSize = PAGE_SIZE,
  maxRows = MAX_ROWS_PER_SECTION
): Promise<WrittenExport> {
  const specs = new Map(SECTIONS.map((spec) => [spec.key, spec]));
  const chunks: string[] = [];
  const rowCounts: Record<string, number> = {};
  const singleCounts: Record<string, number> = {};
  const truncated: string[] = [];
  const failed: { section: string; message: string }[] = [];
  const out = (text: string) => void chunks.push(text);
  const recordFailure = (key: string, err: unknown) =>
    failed.push({ section: key, message: err instanceof Error ? err.message : String(err) });

  // sectionCounts' order: list sections, then single-row ones.
  const counts = () => {
    const ordered: Record<string, number> = {};
    for (const spec of SECTIONS) if (!spec.single && spec.key in rowCounts) ordered[spec.key] = rowCounts[spec.key];
    for (const spec of SECTIONS) if (spec.single && spec.key in singleCounts) ordered[spec.key] = singleCounts[spec.key];
    return ordered;
  };

  const writeSection = async (key: string, indent: string) => {
    const spec = specs.get(key);
    if (!spec) throw new Error(`export layout names unknown section ${key}`);
    if (spec.single) {
      try {
        const { data, error } = await reader.one(spec, subject.id);
        if (error) throw new Error(error.message || 'query failed');
        singleCounts[key] = data ? 1 : 0;
        out(pretty(data ?? null, indent));
      } catch (err) {
        recordFailure(key, err);
        out('null');
      }
      return;
    }

    const inner = `${indent}  `;
    const transform = ROW_TRANSFORMS[key];
    let written = 0;
    out('[');
    try {
      const result = await forEachPage(
        reader,
        spec,
        subject.id,
        async (page) => {
          const rows = transform ? await transform(page, decrypt) : page;
          let text = '';
          for (const row of rows) {
            text += `${written > 0 ? ',' : ''}\n${inner}${pretty(row, inner)}`;
            written += 1;
          }
          out(text);
        },
        pageSize,
        maxRows
      );
      rowCounts[key] = result.count;
      if (result.truncated) truncated.push(key);
    } catch (err) {
      recordFailure(key, err);
    }
    out(written > 0 ? `\n${indent}]` : ']');
  };

  const writeNode = async (node: LayoutNode, indent: string): Promise<void> => {
    if ('section' in node) return writeSection(node.section, indent);
    if ('computed' in node) {
      const value =
        node.computed === 'exportedAt'
          ? now.toISOString()
          : node.computed === 'user'
            ? exportUser(subject)
            : { counts: counts(), truncated: [...truncated].sort() };
      out(pretty(value, indent));
      return;
    }
    const inner = `${indent}  `;
    out('{');
    let first = true;
    for (const [name, child] of node.group) {
      out(`${first ? '' : ','}\n${inner}${JSON.stringify(name)}: `);
      first = false;
      await writeNode(child, inner);
    }
    out(`\n${indent}}`);
  };

  await writeNode(DOCUMENT_LAYOUT, '');

  if (failed.length > 0) {
    // Reported in SECTIONS order, as collectSections does.
    const order = SECTIONS.map((s) => s.key);
    failed.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));
    throw new ExportIncompleteError(failed);
  }
  return { chunks, counts: counts(), truncated: [...truncated].sort() };
}
