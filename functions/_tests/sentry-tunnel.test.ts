/**
 * US-222: the tunnel forwards the configured project's envelopes and nothing else.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost, parseDsn } from '../api/sentry';

const DSN = 'https://abc123@o42.ingest.sentry.io/4507';
const envelope = (dsn: string) =>
  `${JSON.stringify({ dsn, sent_at: '2026-09-30T00:00:00Z' })}\n{"type":"event"}\n{"message":"boom"}`;
const post = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://agentbio.test/api/sentry', { method: 'POST', body, headers });

afterEach(() => vi.unstubAllGlobals());

describe('parseDsn', () => {
  it('reads host and numeric project id', () => {
    expect(parseDsn(DSN)).toEqual({ host: 'o42.ingest.sentry.io', projectId: '4507' });
    expect(parseDsn('http://x@o42.ingest.sentry.io/4507')).toBeNull();
    expect(parseDsn('not a url')).toBeNull();
  });
});

describe('POST /api/sentry', () => {
  it("forwards the configured project's envelope to its ingest endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await onRequestPost({ request: post(envelope(DSN)), env: { VITE_SENTRY_DSN: DSN } });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://o42.ingest.sentry.io/api/4507/envelope/',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('refuses an envelope for another project or host', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const other of ['https://k@o42.ingest.sentry.io/9999', 'https://k@evil.example/4507']) {
      const res = await onRequestPost({ request: post(envelope(other)), env: { VITE_SENTRY_DSN: DSN } });
      expect(res.status).toBe(403);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is off when no DSN is configured, and refuses oversized bodies', async () => {
    expect((await onRequestPost({ request: post(envelope(DSN)), env: {} })).status).toBe(404);
    const big = await onRequestPost({
      request: post('x', { 'content-length': String(6 * 1024 * 1024) }),
      env: { SENTRY_DSN: DSN },
    });
    expect(big.status).toBe(413);
  });
});
