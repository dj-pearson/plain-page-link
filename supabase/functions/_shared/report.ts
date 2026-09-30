/**
 * Error reporting for edge functions (US-222).
 *
 * The functions logged ~230 console.error calls into Coolify container stdout,
 * where nothing alerts on them; a failure was found when an agent reported it.
 * This sends unexpected errors to the same Sentry project as the browser, by
 * posting an envelope to the DSN's ingest endpoint — no SDK, so it adds no
 * import to 80-odd functions and cannot break their boot.
 *
 * A no-op when SENTRY_DSN is unset. Never throws and never waits more than a
 * couple of seconds: reporting a failure must not become a second one.
 */

export interface ReportContext {
  functionName?: string;
  status?: number;
  method?: string;
  /** Path only; the query string can carry tokens and is dropped. */
  path?: string;
}

interface Dsn {
  raw: string;
  host: string;
  projectId: string;
}

function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, '');
    if (url.protocol !== 'https:' || !/^\d+$/.test(projectId)) return null;
    return { raw: dsn, host: url.hostname, projectId };
  } catch {
    return null;
  }
}

function readDsn(): Dsn | null {
  if (typeof Deno === 'undefined') return null;
  return parseDsn(Deno.env.get('SENTRY_DSN'));
}

function environment(): string {
  if (typeof Deno === 'undefined') return 'test';
  return Deno.env.get('ENVIRONMENT') || 'production';
}

/** The envelope Sentry's /envelope/ endpoint accepts. Exported for test. */
export function buildEnvelope(
  dsn: string,
  error: unknown,
  context: ReportContext,
  now: Date = new Date(),
  eventId: string = crypto.randomUUID().replace(/-/g, '')
): string {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');
  const event = {
    event_id: eventId,
    timestamp: now.toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'edge-functions',
    server_name: 'edge-functions',
    environment: environment(),
    transaction: context.functionName,
    tags: {
      runtime: 'deno',
      function: context.functionName ?? 'unknown',
      ...(context.status ? { status: String(context.status) } : {}),
    },
    request: context.method || context.path ? { method: context.method, url: context.path } : undefined,
    exception: {
      values: [
        {
          type: err.name || 'Error',
          value: err.message,
          ...(err.stack ? { stacktrace: { frames: stackFrames(err.stack) } } : {}),
        },
      ],
    },
  };
  return [
    JSON.stringify({ event_id: eventId, sent_at: now.toISOString(), dsn }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
}

/** Sentry wants frames oldest-first. Enough for a readable trace, no more. */
function stackFrames(stack: string): { function?: string; filename?: string; lineno?: number }[] {
  return stack
    .split('\n')
    .slice(1, 30)
    .map((line) => {
      const m = /at (?:(.+?) \()?(.+?):(\d+):\d+\)?$/.exec(line.trim());
      return m ? { function: m[1], filename: m[2], lineno: Number(m[3]) } : { function: line.trim() };
    })
    .reverse();
}

/** Sends one error to Sentry. Resolves whether or not it got there. */
export async function reportError(error: unknown, context: ReportContext = {}): Promise<void> {
  const dsn = readDsn();
  if (!dsn) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch(`https://${dsn.host}/api/${dsn.projectId}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: buildEnvelope(dsn.raw, error, context),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (e) {
    console.error('[report] could not reach Sentry:', e instanceof Error ? e.message : e);
  }
}
