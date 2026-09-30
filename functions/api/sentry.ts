/**
 * Sentry tunnel: POST /api/sentry (US-222).
 *
 * src/lib/sentry.ts initialised Sentry with a DSN and no tunnel, and neither
 * copy of the CSP (public/_headers, index.html) allowed a Sentry ingest host
 * in connect-src — so with VITE_SENTRY_DSN set, every report was blocked by
 * the browser and production errors went nowhere. Sending through our own
 * origin keeps connect-src at 'self' and is not stopped by blockers that drop
 * requests to sentry.io.
 *
 * Forwards only to the project named by the configured DSN, so this cannot be
 * used to relay arbitrary requests to other Sentry projects or hosts.
 */

interface Env {
  SENTRY_DSN?: string;
  VITE_SENTRY_DSN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

/** Replays are the largest envelopes; anything above this is not ours. */
export const MAX_ENVELOPE_BYTES = 5 * 1024 * 1024;

export interface ParsedDsn {
  host: string;
  projectId: string;
}

export function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, '');
    if (url.protocol !== 'https:' || !/^\d+$/.test(projectId)) return null;
    return { host: url.hostname, projectId };
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const allowed = parseDsn(env.SENTRY_DSN ?? env.VITE_SENTRY_DSN);
  if (!allowed) return new Response('Sentry is not configured', { status: 404 });

  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_ENVELOPE_BYTES) return new Response('Envelope too large', { status: 413 });

  const envelope = await request.arrayBuffer();
  if (envelope.byteLength > MAX_ENVELOPE_BYTES) return new Response('Envelope too large', { status: 413 });

  // The envelope's first line is a JSON header naming the DSN it is for.
  const firstLine = new TextDecoder().decode(envelope.slice(0, 4096)).split('\n')[0];
  let target: ParsedDsn | null = null;
  try {
    target = parseDsn((JSON.parse(firstLine) as { dsn?: string }).dsn);
  } catch {
    target = null;
  }
  if (!target || target.host !== allowed.host || target.projectId !== allowed.projectId) {
    return new Response('Unknown project', { status: 403 });
  }

  const upstream = await fetch(`https://${allowed.host}/api/${allowed.projectId}/envelope/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  });
  return new Response(null, { status: upstream.status });
}
