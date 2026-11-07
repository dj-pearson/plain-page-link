/**
 * US-397 (US-291 slice 1): a POSTed data export is built, stored privately,
 * emailed as an expiring link, and closed — or retried, or failed with a reason.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  exportObjectPath,
  exportReadyEmail,
  EXPORT_BUCKET,
  EXPORT_LINK_TTL_SECONDS,
  GIVE_UP_AFTER_MS,
  processExportQueue,
  purgeExpiredExports,
  STALE_PROCESSING_MS,
  type ExportQueueStore,
  type QueuedExport,
} from './gdpr-export-queue.ts';
import { ExportIncompleteError, type CollectedSections } from './gdpr-export.ts';

const NOW = new Date('2026-11-07T12:00:00.000Z');
const SITE = 'https://agentbio.net';

function request(overrides: Partial<QueuedExport> = {}): QueuedExport {
  return {
    id: 'req-1',
    userId: 'user-1',
    status: 'pending',
    createdAt: new Date(NOW.getTime() - 60_000).toISOString(),
    processedAt: null,
    ...overrides,
  };
}

const COLLECTED: CollectedSections = {
  rows: {
    leads: [{ id: 'l1', name: 'Ann', encrypted_email: 'enc:v1:ann', encrypted_phone: null }],
    contacts: [],
    listings: [{ id: 'x1' }],
  },
  singles: { profile: { id: 'user-1', username: 'ann' } },
  truncated: [],
};

function fakeStore(queued: QueuedExport[], overrides: Partial<ExportQueueStore> = {}) {
  const uploads = new Map<string, string>();
  const store = {
    listQueued: vi.fn(async () => queued),
    claim: vi.fn(async () => true),
    getSubject: vi.fn(async (id: string) => ({ id, email: 'ann@example.com', created_at: '2026-01-01T00:00:00Z' })),
    collect: vi.fn(async () => COLLECTED),
    decrypt: vi.fn(async (v: string | null) => (v ? v.replace('enc:v1:', 'plain:') : v)),
    upload: vi.fn(async (path: string, json: string) => void uploads.set(path, json)),
    signedUrl: vi.fn(async (path: string) => `https://api.example/storage/v1/object/sign/gdpr-exports/${path}?token=t`),
    complete: vi.fn(async () => undefined),
    release: vi.fn(async () => undefined),
    fail: vi.fn(async () => undefined),
    audit: vi.fn(async () => undefined),
    sendEmail: vi.fn(async () => ({ ok: true })),
    listExpired: vi.fn(async () => []),
    removeFiles: vi.fn(async () => undefined),
    clearFiles: vi.fn(async () => undefined),
    ...overrides,
  };
  return { store: store as ExportQueueStore & typeof store, uploads };
}

describe('processExportQueue', () => {
  it('builds the export into private storage, emails an expiring link, and completes the request', async () => {
    const { store, uploads } = fakeStore([request()]);
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });

    expect(report).toMatchObject({ completed: 1, retried: 0, failed: 0, errors: [] });
    const path = 'user-1/req-1.json';
    const doc = JSON.parse(uploads.get(path) as string);
    // The same document as the GET download, PII decrypted for the subject.
    expect(doc.user).toMatchObject({ id: 'user-1', email: 'ann@example.com' });
    expect(doc.leads[0]).toMatchObject({ name: 'Ann', email: 'plain:ann', phone: null });
    expect(doc.leads[0]).not.toHaveProperty('encrypted_email');
    expect(doc.listings).toEqual([{ id: 'x1' }]);

    expect(store.signedUrl).toHaveBeenCalledWith(path, EXPORT_LINK_TTL_SECONDS);
    const email = vi.mocked(store.sendEmail).mock.calls[0]?.[0];
    expect(email?.to).toBe('ann@example.com');
    expect(email?.body).toContain(`/gdpr-exports/${path}?token=t`);

    const expiresAt = new Date(NOW.getTime() + EXPORT_LINK_TTL_SECONDS * 1000).toISOString();
    // file_url holds the path, never the signed link.
    expect(store.complete).toHaveBeenCalledWith('req-1', path, expiresAt, NOW.toISOString());
    expect(store.audit).toHaveBeenCalledWith('user-1', 'success', expect.objectContaining({ request_id: 'req-1' }));
  });

  it('asks only for pending requests and processing ones claimed before the stale cutoff', async () => {
    const { store } = fakeStore([]);
    await processExportQueue(store, { now: NOW, siteUrl: SITE, maxPerRun: 2 });
    expect(store.listQueued).toHaveBeenCalledWith(new Date(NOW.getTime() - STALE_PROCESSING_MS).toISOString(), 2);
  });

  it('skips a request another run claimed first', async () => {
    const { store } = fakeStore([request()], { claim: vi.fn(async () => false) });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report.skipped).toBe(1);
    expect(store.collect).not.toHaveBeenCalled();
    expect(store.complete).not.toHaveBeenCalled();
  });

  it('puts a request back in the queue, with the reason, when a section cannot be read', async () => {
    const { store } = fakeStore([request()], {
      collect: vi.fn(async () => {
        throw new ExportIncompleteError([{ section: 'leads', message: 'timeout' }]);
      }),
    });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report).toMatchObject({ completed: 0, retried: 1, failed: 0 });
    expect(store.release).toHaveBeenCalledWith('req-1', 'Could not read: leads');
    expect(store.upload).not.toHaveBeenCalled();
    expect(store.sendEmail).not.toHaveBeenCalled();
  });

  it('does not complete a request whose email was not sent', async () => {
    const { store } = fakeStore([request()], { sendEmail: vi.fn(async () => ({ ok: false, error: 'resend 500' })) });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report.retried).toBe(1);
    expect(store.complete).not.toHaveBeenCalled();
    expect(store.release).toHaveBeenCalledWith('req-1', 'email not sent: resend 500');
  });

  it('fails a request after a day of retries, and tells the subject', async () => {
    const old = request({ createdAt: new Date(NOW.getTime() - GIVE_UP_AFTER_MS).toISOString() });
    const { store } = fakeStore([old], {
      upload: vi.fn(async () => {
        throw new Error('storing the export: 413');
      }),
    });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report).toMatchObject({ retried: 0, failed: 1 });
    expect(store.fail).toHaveBeenCalledWith('req-1', 'storing the export: 413', NOW.toISOString());
    expect(store.release).not.toHaveBeenCalled();
    expect(store.sendEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(store.sendEmail).mock.calls[0]?.[0]?.subject).toMatch(/could not prepare/i);
  });

  it('fails at once, without retrying, when the account no longer exists', async () => {
    const { store } = fakeStore([request()], { getSubject: vi.fn(async () => null) });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report.failed).toBe(1);
    expect(store.fail).toHaveBeenCalledWith('req-1', 'The account no longer exists.', NOW.toISOString());
    expect(store.collect).not.toHaveBeenCalled();
  });

  it('keeps going after one request fails', async () => {
    let calls = 0;
    const { store } = fakeStore([request(), request({ id: 'req-2', userId: 'user-2' })], {
      collect: vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new Error('boom');
        return COLLECTED;
      }),
    });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report).toMatchObject({ completed: 1, retried: 1 });
    expect(store.complete).toHaveBeenCalledWith('req-2', 'user-2/req-2.json', expect.any(String), expect.any(String));
  });

  it('reports, rather than throws, when the queue cannot be read', async () => {
    const { store } = fakeStore([], {
      listQueued: vi.fn(async () => {
        throw new Error('db down');
      }),
    });
    const report = await processExportQueue(store, { now: NOW, siteUrl: SITE });
    expect(report.errors).toEqual(['listing queued exports: db down']);
  });
});

describe('purgeExpiredExports', () => {
  it('deletes expired files and forgets their path', async () => {
    const { store } = fakeStore([], {
      listExpired: vi.fn(async () => [{ id: 'req-1', path: 'user-1/req-1.json' }]),
    });
    expect(await purgeExpiredExports(store, NOW)).toBe(1);
    expect(store.listExpired).toHaveBeenCalledWith(NOW.toISOString(), 100);
    expect(store.removeFiles).toHaveBeenCalledWith(['user-1/req-1.json']);
    expect(store.clearFiles).toHaveBeenCalledWith(['req-1']);
  });

  it('does nothing when no file has expired', async () => {
    const { store } = fakeStore([]);
    expect(await purgeExpiredExports(store, NOW)).toBe(0);
    expect(store.removeFiles).not.toHaveBeenCalled();
  });
});

describe('export email and storage', () => {
  it('keys each file under the subject id, one per request', () => {
    expect(exportObjectPath({ id: 'r', userId: 'u' })).toBe('u/r.json');
  });

  it('escapes the link in the HTML body', () => {
    const email = exportReadyEmail('a@b.c', 'https://x/y?a=1&b="2"', NOW, SITE);
    expect(email.html).toContain('href="https://x/y?a=1&amp;b=&quot;2&quot;"');
    expect(email.body).toContain(NOW.toUTCString());
  });

  it('the bucket is created private by a migration and no storage policy opens it', () => {
    const dir = join(process.cwd(), 'supabase/migrations');
    const sql = readFileSync(join(dir, '20261107000397_gdpr_exports_bucket.sql'), 'utf8');
    expect(sql).toMatch(new RegExp(`\\('${EXPORT_BUCKET}', '${EXPORT_BUCKET}', false,`));
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});
