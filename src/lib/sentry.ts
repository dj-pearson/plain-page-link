/**
 * Sentry error monitoring — the facade every caller imports.
 *
 * US-255: this file must not import @sentry/* statically. It used to, and with
 * VITE_SENTRY_DSN set the SDK plus Session Replay added ~81 KB gzip to the
 * entry chunk of every page — the visitor opening an agent's profile from
 * Instagram downloaded an error reporter before the page could render. Now:
 *
 *   - initSentry() (called from main.tsx) only installs two tiny window
 *     listeners and schedules loadSentry() for after `load`, when idle.
 *   - loadSentry() dynamic-imports ./sentry-sdk, which holds the SDK, the
 *     integrations and the scrubbing; Session Replay is a further dynamic
 *     import from there (./sentry-replay), in a chunk of its own.
 *   - Everything called before the SDK arrives — exceptions, messages,
 *     breadcrumbs, user/tag/context — is buffered (capped) and replayed.
 *
 * scripts/check-bundle-size.mjs builds with a dummy DSN in CI and fails if any
 * Sentry code reaches the first-paint graph.
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const sentryDsn: string = import.meta.env.VITE_SENTRY_DSN || '';
const sentryEnabled = isProduction || import.meta.env.VITE_SENTRY_ENABLED === 'true';

/**
 * Whether anything is ever sent. Without a DSN, or outside production without
 * the explicit override, the SDK is never downloaded and every call is a no-op
 * (the old code initialised a client with `enabled: false`, which sent nothing
 * either).
 */
const active = Boolean(sentryDsn) && sentryEnabled;

/** Same-origin path served by functions/api/sentry.ts. */
export const SENTRY_TUNNEL = '/api/sentry';

/** Events (exceptions, messages, breadcrumbs) held before the SDK loads. */
export const MAX_BUFFERED_EVENTS = 50;

export type SentrySeverity = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export interface SentryBreadcrumb {
  type?: string;
  category?: string;
  message?: string;
  level?: SentrySeverity;
  data?: Record<string, unknown>;
  /** Seconds since the epoch, as Sentry expects. */
  timestamp?: number;
}

export interface SentryUser {
  id: string;
  email?: string;
  username?: string;
}

/** Plain options; ./sentry-sdk adds integrations and beforeSend. */
export interface SentryConfig {
  dsn: string;
  tunnel: string;
  environment: string;
  release: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  tracePropagationTargets: (string | RegExp)[];
  maxBreadcrumbs: number;
  attachStacktrace: boolean;
  normalizeDepth: number;
  deploymentRegion: string;
}

/** What ./sentry-sdk hands back once the SDK is initialised. */
export interface SentrySdk {
  captureException(error: unknown, eventId: string, extra?: Record<string, unknown>): void;
  captureMessage(
    message: string,
    level: SentrySeverity,
    eventId: string,
    extra?: Record<string, unknown>
  ): void;
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void;
  setUser(user: SentryUser | null): void;
  setContext(name: string, context: Record<string, unknown>): void;
  setTag(key: string, value: string): void;
}

export function buildSentryConfig(dsn: string): SentryConfig {
  return {
    dsn,
    // US-222: through our own origin (functions/api/sentry.ts). The CSP's
    // connect-src has no Sentry host, so reports sent straight to sentry.io
    // were blocked by the browser and production errors went nowhere.
    tunnel: SENTRY_TUNNEL,
    environment: isDevelopment ? 'development' : 'production',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enabled: sentryEnabled,
    // Performance monitoring - sample 10% of transactions in production
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    // Session replay for debugging user issues (sample 1% in production)
    replaysSessionSampleRate: isProduction ? 0.01 : 0.1,
    replaysOnErrorSampleRate: isProduction ? 0.1 : 1.0,
    // Trace propagation targets for distributed tracing
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/api\.agentbio\.net/,
      /^https:\/\/functions\.agentbio\.net/,
      /^https:\/\/.*\.supabase\.co/,
    ],
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    normalizeDepth: 5,
    deploymentRegion: (import.meta.env.VITE_DEPLOYMENT_REGION as string | undefined) || 'unknown',
  };
}

// --------------------------------------------------------------------------
// Buffer
// --------------------------------------------------------------------------

type BufferedEvent =
  | { kind: 'exception'; error: unknown; eventId: string; extra?: Record<string, unknown> }
  | {
      kind: 'message';
      message: string;
      level: SentrySeverity;
      eventId: string;
      extra?: Record<string, unknown>;
    }
  | { kind: 'breadcrumb'; breadcrumb: SentryBreadcrumb };

let sdk: SentrySdk | null = null;
let loading: Promise<void> | null = null;
let events: BufferedEvent[] = [];
let dropped = 0;
// Scope state is last-write-wins, so it is kept as values rather than queued:
// it can never be what overflows the cap. `undefined` = never set.
let pendingUser: SentryUser | null | undefined;
const pendingTags = new Map<string, string>();
const pendingContexts = new Map<string, Record<string, unknown>>();

function enqueue(event: BufferedEvent): void {
  // Keep the earliest: the first error is usually the cause of the rest.
  if (events.length >= MAX_BUFFERED_EVENTS) {
    dropped++;
    return;
  }
  events.push(event);
}

/** 32 lowercase hex characters — the shape of a Sentry event id. */
function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  let id = '';
  for (let i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}

function flush(target: SentrySdk): void {
  if (pendingUser !== undefined) target.setUser(pendingUser);
  for (const [key, value] of pendingTags) target.setTag(key, value);
  for (const [name, context] of pendingContexts) target.setContext(name, context);

  for (const event of events) {
    if (event.kind === 'exception') {
      target.captureException(event.error, event.eventId, event.extra);
    } else if (event.kind === 'message') {
      target.captureMessage(event.message, event.level, event.eventId, event.extra);
    } else {
      target.addBreadcrumb(event.breadcrumb);
    }
  }
  if (dropped > 0) {
    target.addBreadcrumb({
      category: 'sentry',
      level: 'warning',
      message: `${dropped} event(s) raised before error monitoring loaded were dropped`,
    });
  }

  events = [];
  dropped = 0;
  pendingUser = undefined;
  pendingTags.clear();
  pendingContexts.clear();
}

function discardBuffer(): void {
  events = [];
  dropped = 0;
  pendingUser = undefined;
  pendingTags.clear();
  pendingContexts.clear();
}

// --------------------------------------------------------------------------
// Early global handlers — until the SDK's own GlobalHandlers take over
// --------------------------------------------------------------------------

let earlyHandlersInstalled = false;

function onEarlyError(event: ErrorEvent): void {
  const error: unknown =
    event.error ?? new Error(event.message || 'Script error before monitoring loaded');
  enqueue({ kind: 'exception', error, eventId: newEventId(), extra: { mechanism: 'onerror' } });
}

function onEarlyRejection(event: PromiseRejectionEvent): void {
  const reason: unknown = event.reason;
  const error =
    reason instanceof Error ? reason : new Error(`Unhandled promise rejection: ${String(reason)}`);
  enqueue({
    kind: 'exception',
    error,
    eventId: newEventId(),
    extra: { mechanism: 'onunhandledrejection' },
  });
}

function installEarlyHandlers(): void {
  if (earlyHandlersInstalled || typeof window === 'undefined') return;
  window.addEventListener('error', onEarlyError);
  window.addEventListener('unhandledrejection', onEarlyRejection);
  earlyHandlersInstalled = true;
}

function removeEarlyHandlers(): void {
  if (!earlyHandlersInstalled) return;
  window.removeEventListener('error', onEarlyError);
  window.removeEventListener('unhandledrejection', onEarlyRejection);
  earlyHandlersInstalled = false;
}

// --------------------------------------------------------------------------
// Loading
// --------------------------------------------------------------------------

/**
 * Download and initialise the SDK now. Idempotent. Resolves once the buffer
 * has been replayed; Session Replay follows in the background.
 */
export function loadSentry(): Promise<void> {
  if (!active) return Promise.resolve();
  if (loading) return loading;

  loading = import('./sentry-sdk')
    .then((mod) => {
      const config = buildSentryConfig(sentryDsn);
      const instance = mod.initSentrySdk(config);
      removeEarlyHandlers();
      sdk = instance;
      flush(instance);
      if (config.replaysSessionSampleRate > 0 || config.replaysOnErrorSampleRate > 0) {
        void mod.enableReplay().catch(() => {
          // Replay is a debugging aid; failing to fetch it must not matter.
        });
      }
      if (isDevelopment) {
        console.log('[Sentry] Initialized successfully');
      }
    })
    .catch(() => {
      // The chunk could not be fetched (offline, a deploy replaced it). Stop
      // buffering so the queue does not grow for the rest of the session.
      removeEarlyHandlers();
      discardBuffer();
    });

  return loading;
}

function whenIdle(callback: () => void): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(callback, { timeout: 5000 });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Initialize Sentry error monitoring. Cheap: it schedules the SDK download for
 * after the page has loaded, and holds anything that goes wrong until then.
 */
export function initSentry(): void {
  if (!sentryDsn) {
    if (isDevelopment) {
      console.log('[Sentry] DSN not configured - error monitoring disabled');
    }
    return;
  }
  if (!active || typeof window === 'undefined') return;

  installEarlyHandlers();

  const schedule = () => whenIdle(() => void loadSentry());
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Critical business events. These are surfaced as Sentry messages (info
 * level) so product/ops can alert on revenue and high-value-lead signals
 * alongside error monitoring. See MONITORING.md for alert thresholds.
 */
export function trackSubscriptionCreated(plan: string, userId: string): void {
  captureMessage(`Subscription created: ${plan}`, 'info', {
    event: 'subscription_created',
    plan,
    userId,
  });
}

export function trackSubscriptionCancelled(plan: string, userId: string): void {
  captureMessage(`Subscription cancelled: ${plan}`, 'warning', {
    event: 'subscription_cancelled',
    plan,
    userId,
  });
}

export function trackHighValueLead(score: number, userId: string): void {
  if (score <= 90) return;
  captureMessage(`High-value lead scored ${score}`, 'info', {
    event: 'lead_scored_high',
    score,
    userId,
  });
}

/**
 * Capture an exception. Returns the event id it is (or will be) sent under,
 * so an error screen can show it even before the SDK has loaded.
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string | undefined {
  if (!active) return undefined;
  const eventId = newEventId();
  if (sdk) sdk.captureException(error, eventId, context);
  else enqueue({ kind: 'exception', error, eventId, extra: context });
  return eventId;
}

/**
 * Capture a message.
 */
export function captureMessage(
  message: string,
  level: SentrySeverity = 'info',
  context?: Record<string, unknown>
): string | undefined {
  if (!active) return undefined;
  const eventId = newEventId();
  if (sdk) sdk.captureMessage(message, level, eventId, context);
  else enqueue({ kind: 'message', message, level, eventId, extra: context });
  return eventId;
}

/**
 * Set user context for error tracking
 */
export function setUser(user: SentryUser): void {
  if (!active) return;
  const scoped: SentryUser = {
    id: user.id,
    // Only include email outside production (helps with debugging but is
    // optional for privacy)
    email: isProduction ? undefined : user.email,
    username: user.username,
  };
  if (sdk) sdk.setUser(scoped);
  else pendingUser = scoped;
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  if (!active) return;
  if (sdk) sdk.setUser(null);
  else pendingUser = null;
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!active) return;
  if (sdk) {
    sdk.addBreadcrumb(breadcrumb);
    return;
  }
  // Stamp it now; replayed later it would otherwise carry the load time.
  enqueue({
    kind: 'breadcrumb',
    breadcrumb: { ...breadcrumb, timestamp: breadcrumb.timestamp ?? Date.now() / 1000 },
  });
}

/**
 * Set extra context for the next error
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!active) return;
  if (sdk) sdk.setContext(name, context);
  else pendingContexts.set(name, context);
}

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string): void {
  if (!active) return;
  if (sdk) sdk.setTag(key, value);
  else pendingTags.set(key, value);
}
