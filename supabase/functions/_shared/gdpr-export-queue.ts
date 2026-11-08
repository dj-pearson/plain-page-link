/**
 * Queued data exports (US-291 slice 1, US-397).
 *
 * gdpr-export's POST created a gdpr_data_requests row and answered 202
 * "Processing will begin shortly", but nothing ever processed it: the row sat
 * at 'pending' for ever, file_url and file_expires_at were never filled, and a
 * subject who asked for their data that way never received it. The GET path
 * builds the whole export inside one browser request, which is the only way an
 * export has actually been delivered.
 *
 * scheduled-maintenance now drains the queue every hour:
 *
 *   pending ──claim──▶ processing ──▶ completed   file in the private
 *      ▲                   │                      gdpr-exports bucket, the
 *      └──── release ──────┤                      subject emailed a signed
 *        (transient error, │                      link that expires
 *         retried next run)└──────▶ failed        failed_reason says why
 *
 * A transient failure (a section that could not be read, a storage or email
 * error) goes back to 'pending' with the reason recorded and is retried on the
 * next run; after GIVE_UP_AFTER_MS it is failed and the subject told. A run
 * that died mid-export leaves a row at 'processing'; it is reclaimed once
 * STALE_PROCESSING_MS has passed. Claims are conditional updates, so two
 * overlapping runs never build the same export twice.
 *
 * file_url holds the object's path inside EXPORT_BUCKET, not a URL: the link
 * is a bearer credential and is only ever put in the email. Files are removed
 * once file_expires_at passes ({@link purgeExpiredExports}).
 *
 * Free of Deno globals and esm.sh runtime imports so vitest can run it.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  buildExportDocument,
  collectSections,
  ExportIncompleteError,
  sectionCounts,
  supabaseExportReader,
  type CollectedSections,
  type Decrypt,
  type ExportSubject,
} from './gdpr-export.ts';
import { escapeHtml, type EmailOptions, type SendEmailResult } from './email.ts';

export const EXPORT_BUCKET = 'gdpr-exports';
/** How long the emailed link, and the file behind it, last. */
export const EXPORT_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
/** Exports built per run, so one run cannot hold the function open for ever. */
export const MAX_EXPORTS_PER_RUN = 3;
/** A 'processing' row older than this belongs to a run that died. */
export const STALE_PROCESSING_MS = 60 * 60 * 1000;
/** Stop retrying a request this long after it was made. */
export const GIVE_UP_AFTER_MS = 24 * 60 * 60 * 1000;

export interface QueuedExport {
  id: string;
  userId: string;
  status: 'pending' | 'processing';
  createdAt: string;
  processedAt: string | null;
}

/** The reads and writes this module needs; supabaseExportQueueStore() is the real one. */
export interface ExportQueueStore {
  /** Pending export requests, and 'processing' ones claimed before staleBefore; oldest first. */
  listQueued(staleBefore: string, limit: number): Promise<QueuedExport[]>;
  /** Moves the request to 'processing' only if it is still as listed. False when another run took it. */
  claim(request: QueuedExport, now: string): Promise<boolean>;
  /** The auth user, or null when the account no longer exists. */
  getSubject(userId: string): Promise<ExportSubject | null>;
  collect(userId: string): Promise<CollectedSections>;
  decrypt: Decrypt;
  upload(path: string, json: string): Promise<void>;
  signedUrl(path: string, expiresInSeconds: number): Promise<string>;
  complete(id: string, path: string, expiresAt: string, now: string): Promise<void>;
  /** Back to 'pending' for the next run, with the reason it did not finish. */
  release(id: string, reason: string): Promise<void>;
  fail(id: string, reason: string, now: string): Promise<void>;
  audit(userId: string, status: 'success' | 'failure', details: Record<string, unknown>): Promise<void>;
  sendEmail(email: EmailOptions): Promise<SendEmailResult>;
  /** Completed exports whose file is still held after file_expires_at. */
  listExpired(now: string, limit: number): Promise<{ id: string; path: string }[]>;
  removeFiles(paths: string[]): Promise<void>;
  clearFiles(ids: string[]): Promise<void>;
}

export interface ExportQueueOptions {
  now: Date;
  siteUrl: string;
  maxPerRun?: number;
}

export interface ExportQueueReport {
  completed: number;
  retried: number;
  failed: number;
  /** Requests another run claimed first. */
  skipped: number;
  errors: string[];
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Thrown for a request that can never succeed, so it is failed rather than retried. */
class PermanentExportError extends Error {}

export function exportObjectPath(request: Pick<QueuedExport, 'id' | 'userId'>): string {
  return `${request.userId}/${request.id}.json`;
}

export function exportReadyEmail(to: string, link: string, expiresAt: Date, siteUrl: string): EmailOptions {
  const expires = expiresAt.toUTCString();
  const settingsUrl = `${siteUrl}/dashboard/settings`;
  return {
    to,
    subject: 'Your AgentBio data export is ready',
    body:
      'The copy of your AgentBio data you asked for is ready to download:\n\n' +
      `${link}\n\n` +
      `The link works until ${expires}, after which the file is deleted. It contains your ` +
      'leads, clients and account details, so do not forward it.\n\n' +
      `If you did not ask for this export, change your password at ${settingsUrl}.`,
    html:
      '<p>The copy of your AgentBio data you asked for is ready to download.</p>' +
      `<p><a href="${escapeHtml(link)}">Download your data (JSON)</a></p>` +
      `<p>The link works until ${escapeHtml(expires)}, after which the file is deleted. ` +
      'It contains your leads, clients and account details, so do not forward it.</p>' +
      `<p>If you did not ask for this export, <a href="${escapeHtml(settingsUrl)}">change your password</a>.</p>`,
  };
}

export function exportFailedEmail(to: string, siteUrl: string): EmailOptions {
  const settingsUrl = `${siteUrl}/dashboard/settings`;
  return {
    to,
    subject: 'We could not prepare your AgentBio data export',
    body:
      'We tried for a day to prepare the copy of your AgentBio data you asked for, and could not. ' +
      `Nothing was sent. Please request it again from ${settingsUrl}, or reply to support@agentbio.net ` +
      'and we will send it to you.',
    html:
      '<p>We tried for a day to prepare the copy of your AgentBio data you asked for, and could not. ' +
      'Nothing was sent.</p>' +
      `<p>Please <a href="${escapeHtml(settingsUrl)}">request it again</a>, or write to ` +
      'support@agentbio.net and we will send it to you.</p>',
  };
}

async function buildAndDeliver(
  store: ExportQueueStore,
  request: QueuedExport,
  opts: ExportQueueOptions
): Promise<Record<string, number>> {
  const subject = await store.getSubject(request.userId);
  if (!subject) throw new PermanentExportError('The account no longer exists.');
  if (!subject.email) throw new PermanentExportError('The account has no email address to send the link to.');

  const collected = await store.collect(request.userId);
  const document = await buildExportDocument(subject, collected, store.decrypt, opts.now);
  const path = exportObjectPath(request);
  await store.upload(path, JSON.stringify(document, null, 2));

  const link = await store.signedUrl(path, EXPORT_LINK_TTL_SECONDS);
  const expiresAt = new Date(opts.now.getTime() + EXPORT_LINK_TTL_SECONDS * 1000);
  const sent = await store.sendEmail(exportReadyEmail(subject.email, link, expiresAt, opts.siteUrl));
  // Retried: an export the subject is never told about has not been delivered.
  if (!sent.ok) throw new Error(`email not sent: ${sent.error ?? 'unknown error'}`);

  await store.complete(request.id, path, expiresAt.toISOString(), opts.now.toISOString());
  return sectionCounts(collected);
}

/** Builds, stores and emails queued exports. Never throws; failures are in the report. */
export async function processExportQueue(
  store: ExportQueueStore,
  opts: ExportQueueOptions
): Promise<ExportQueueReport> {
  const report: ExportQueueReport = { completed: 0, retried: 0, failed: 0, skipped: 0, errors: [] };
  const nowMs = opts.now.getTime();
  const nowIso = opts.now.toISOString();
  const staleBefore = new Date(nowMs - STALE_PROCESSING_MS).toISOString();

  let queued: QueuedExport[];
  try {
    queued = await store.listQueued(staleBefore, opts.maxPerRun ?? MAX_EXPORTS_PER_RUN);
  } catch (error) {
    report.errors.push(`listing queued exports: ${errorText(error)}`);
    return report;
  }

  for (const request of queued) {
    try {
      if (!(await store.claim(request, nowIso))) {
        report.skipped += 1;
        continue;
      }
    } catch (error) {
      report.errors.push(`${request.id}: claiming: ${errorText(error)}`);
      continue;
    }

    try {
      const counts = await buildAndDeliver(store, request, opts);
      report.completed += 1;
      await store
        .audit(request.userId, 'success', { request_id: request.id, queued: true, records_exported: counts })
        .catch((error) => report.errors.push(`${request.id}: audit: ${errorText(error)}`));
    } catch (error) {
      const reason =
        error instanceof ExportIncompleteError
          ? `Could not read: ${error.failed.map((f) => f.section).join(', ')}`
          : errorText(error);
      const expired = nowMs - new Date(request.createdAt).getTime() >= GIVE_UP_AFTER_MS;
      const permanent = error instanceof PermanentExportError;
      try {
        if (permanent || expired) {
          await store.fail(request.id, reason.slice(0, 500), nowIso);
          report.failed += 1;
          await store.audit(request.userId, 'failure', { request_id: request.id, queued: true, reason });
          if (!permanent) {
            const subject = await store.getSubject(request.userId);
            if (subject?.email) await store.sendEmail(exportFailedEmail(subject.email, opts.siteUrl));
          }
        } else {
          await store.release(request.id, reason.slice(0, 500));
          report.retried += 1;
        }
      } catch (writeError) {
        // Left at 'processing'; reclaimed as stale by a later run.
        report.errors.push(`${request.id}: recording the outcome: ${errorText(writeError)}`);
      }
      report.errors.push(`${request.id}: ${reason}`);
    }
  }
  return report;
}

/** Deletes export files whose link has expired, and forgets their path. */
export async function purgeExpiredExports(store: ExportQueueStore, now: Date, limit = 100): Promise<number> {
  const expired = await store.listExpired(now.toISOString(), limit);
  if (expired.length === 0) return 0;
  await store.removeFiles(expired.map((e) => e.path));
  await store.clearFiles(expired.map((e) => e.id));
  return expired.length;
}

export function summarizeExportQueueReport(report: ExportQueueReport, purged: number): string {
  return (
    `completed ${report.completed}, retrying ${report.retried}, failed ${report.failed}, ` +
    `skipped ${report.skipped}, expired files removed ${purged}`
  );
}

/**
 * Re-sending the link for an export that is still held (US-404).
 *
 * The link is a bearer credential that exists only in the email, so a subject
 * whose email went astray had to request, and wait for, a whole new export.
 * This signs a fresh link to the same file and emails it again. It never
 * returns the link to the caller: the email stays the only place it goes, so
 * holding a session is still not the same as holding the data.
 *
 * The new link expires when the file does (file_expires_at), so the email's
 * "after which the file is deleted" stays true and no link outlives its file.
 */

/** The file behind an export request, as findOwnExport reads it. */
export interface HeldExport {
  id: string;
  userId: string;
  status: string;
  /** Object path in EXPORT_BUCKET, or null once purged. */
  path: string | null;
  expiresAt: string | null;
}

export interface ExportResendStore
  extends Pick<ExportQueueStore, 'getSubject' | 'signedUrl' | 'sendEmail' | 'audit'> {
  /** The export request with this id, only if it belongs to userId; null otherwise. */
  findOwnExport(requestId: string, userId: string): Promise<HeldExport | null>;
}

/** A link with less than this left is not worth sending. */
export const MIN_RESEND_LINK_SECONDS = 5 * 60;

export type ResendOutcome =
  | { ok: true; expiresAt: string }
  | { ok: false; status: 404 | 409 | 410 | 422 | 502; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Signs and emails a fresh link to the caller's own completed export.
 * Returns a refusal (never throws) for anything the caller can be told about;
 * a store error is thrown.
 */
export async function resendExportLink(
  store: ExportResendStore,
  input: { requestId: unknown; userId: string; now: Date; siteUrl: string }
): Promise<ResendOutcome> {
  const notFound = { ok: false as const, status: 404 as const, error: 'That export was not found.' };
  if (typeof input.requestId !== 'string' || !UUID_RE.test(input.requestId)) return notFound;

  const held = await store.findOwnExport(input.requestId, input.userId);
  // Someone else's request reads exactly like one that does not exist.
  if (!held || held.userId !== input.userId) return notFound;
  if (held.status !== 'completed') {
    return {
      ok: false,
      status: 409,
      error: 'That export has not been sent yet. We will email you the link when it is ready.',
    };
  }
  const expiresMs = held.expiresAt ? new Date(held.expiresAt).getTime() : Number.NaN;
  const remainingSeconds = Math.floor((expiresMs - input.now.getTime()) / 1000);
  if (!held.path || Number.isNaN(expiresMs) || remainingSeconds < MIN_RESEND_LINK_SECONDS) {
    return {
      ok: false,
      status: 410,
      error: 'That export has expired and its file was deleted. Please request a new export.',
    };
  }

  const subject = await store.getSubject(input.userId);
  if (!subject?.email) {
    return { ok: false, status: 422, error: 'Your account has no email address to send the link to.' };
  }

  const link = await store.signedUrl(held.path, remainingSeconds);
  const expiresAt = new Date(expiresMs);
  const sent = await store.sendEmail(exportReadyEmail(subject.email, link, expiresAt, input.siteUrl));
  if (!sent.ok) {
    return { ok: false, status: 502, error: 'We could not send the email. Please try again in a few minutes.' };
  }

  // The email went; a failed audit write must not report it as unsent.
  await store
    .audit(input.userId, 'success', { request_id: held.id, link_resent: true })
    .catch(() => undefined);
  return { ok: true, expiresAt: expiresAt.toISOString() };
}

/** The resend store over a service-role client. */
export function supabaseExportResendStore(
  supabase: SupabaseClient,
  deps: { decrypt: Decrypt; sendEmail: (email: EmailOptions) => Promise<SendEmailResult> }
): ExportResendStore {
  const base = supabaseExportQueueStore(supabase, deps);
  return {
    getSubject: base.getSubject,
    signedUrl: base.signedUrl,
    sendEmail: base.sendEmail,
    audit: base.audit,
    async findOwnExport(requestId, userId) {
      const { data, error } = await supabase
        .from('gdpr_data_requests')
        .select('id, user_id, status, file_url, file_expires_at')
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('request_type', 'export')
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return {
        id: data.id as string,
        userId: data.user_id as string,
        status: data.status as string,
        path: (data.file_url as string | null) ?? null,
        expiresAt: (data.file_expires_at as string | null) ?? null,
      };
    },
  };
}

/** The store over a service-role client. */
export function supabaseExportQueueStore(
  supabase: SupabaseClient,
  deps: { decrypt: Decrypt; sendEmail: (email: EmailOptions) => Promise<SendEmailResult> }
): ExportQueueStore {
  const requests = () => supabase.from('gdpr_data_requests');
  // Spelled out (= EXPORT_BUCKET) so verify-schema's bucket check sees it.
  const bucket = () => supabase.storage.from('gdpr-exports');
  return {
    async listQueued(staleBefore, limit) {
      const { data, error } = await requests()
        .select('id, user_id, status, created_at, processed_at')
        .eq('request_type', 'export')
        .or(`status.eq.pending,and(status.eq.processing,processed_at.lt.${staleBefore})`)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        status: row.status as QueuedExport['status'],
        createdAt: row.created_at as string,
        processedAt: (row.processed_at as string | null) ?? null,
      }));
    },
    async claim(request, now) {
      let query = requests()
        .update({ status: 'processing', processed_at: now })
        .eq('id', request.id)
        .eq('status', request.status);
      // A stale claim is taken over only if no other run re-claimed it since.
      if (request.status === 'processing' && request.processedAt) {
        query = query.eq('processed_at', request.processedAt);
      }
      const { data, error } = await query.select('id');
      if (error) throw new Error(error.message);
      return (data ?? []).length === 1;
    },
    async getSubject(userId) {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error) {
        if (error.status === 404 || /not found/i.test(error.message)) return null;
        throw new Error(error.message);
      }
      return data.user ?? null;
    },
    collect: (userId) => collectSections(supabaseExportReader(supabase), userId),
    decrypt: deps.decrypt,
    async upload(path, json) {
      const { error } = await bucket().upload(path, new Blob([json], { type: 'application/json' }), {
        contentType: 'application/json',
        upsert: true,
      });
      if (error) throw new Error(`storing the export: ${error.message}`);
    },
    async signedUrl(path, expiresInSeconds) {
      const filename = `agentbio-data-export-${path.split('/').pop()}`;
      const { data, error } = await bucket().createSignedUrl(path, expiresInSeconds, { download: filename });
      if (error || !data?.signedUrl) throw new Error(`signing the link: ${error?.message ?? 'no URL returned'}`);
      return data.signedUrl;
    },
    async complete(id, path, expiresAt, now) {
      const { error } = await requests()
        .update({
          status: 'completed',
          completed_at: now,
          file_url: path,
          file_expires_at: expiresAt,
          failed_reason: null,
        })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    async release(id, reason) {
      const { error } = await requests().update({ status: 'pending', failed_reason: reason }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    async fail(id, reason, now) {
      const { error } = await requests()
        .update({ status: 'failed', failed_reason: reason, completed_at: now })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    async audit(userId, status, details) {
      const { error } = await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_action: 'gdpr_data_export',
        p_status: status,
        p_resource_type: 'gdpr',
        p_resource_id: typeof details.request_id === 'string' ? details.request_id : undefined,
        p_details: details,
        p_risk_level: 'medium',
      });
      if (error) throw new Error(error.message);
    },
    sendEmail: deps.sendEmail,
    async listExpired(now, limit) {
      const { data, error } = await requests()
        .select('id, file_url')
        .eq('request_type', 'export')
        .eq('status', 'completed')
        .not('file_url', 'is', null)
        .lt('file_expires_at', now)
        .order('file_expires_at', { ascending: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({ id: row.id as string, path: row.file_url as string }));
    },
    async removeFiles(paths) {
      const { error } = await bucket().remove(paths);
      if (error) throw new Error(`removing expired exports: ${error.message}`);
    },
    async clearFiles(ids) {
      const { error } = await requests().update({ file_url: null }).in('id', ids);
      if (error) throw new Error(error.message);
    },
  };
}
