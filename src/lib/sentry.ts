/**
 * Sentry Error Monitoring Configuration
 *
 * This module initializes Sentry for error tracking and performance monitoring.
 * It integrates with the existing errorHandler for consistent error management.
 */

import * as Sentry from '@sentry/react';

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

// List of URLs to ignore (internal/expected errors)
const IGNORED_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'The user aborted a request',
  'AbortError',
];

// Sensitive data patterns to scrub
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /session/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
];

/**
 * Initialize Sentry error monitoring
 * Should be called as early as possible in the app lifecycle
 */
export function initSentry(): void {
  // Only initialize if DSN is configured
  if (!sentryDsn) {
    if (isDevelopment) {
      console.log('[Sentry] DSN not configured - error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: isDevelopment ? 'development' : 'production',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Only enable in production by default, but allow override
    enabled: isProduction || import.meta.env.VITE_SENTRY_ENABLED === 'true',

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

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Session replay for error debugging
      Sentry.replayIntegration({
        // Mask all text for privacy
        maskAllText: true,
        // Block all media for privacy
        blockAllMedia: true,
      }),
    ],

    // Filter out non-actionable errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out ignored errors
      if (error instanceof Error) {
        for (const pattern of IGNORED_ERRORS) {
          if (error.message.includes(pattern)) {
            return null;
          }
        }
      }

      // Scrub sensitive data from event
      if (event.request?.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }

      // Scrub sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          data: breadcrumb.data ? scrubSensitiveData(breadcrumb.data) : undefined,
        }));
      }

      // Scrub sensitive data from extra context
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }

      return event;
    },

    // Limit breadcrumbs for performance
    maxBreadcrumbs: 50,

    // Attach stack traces to messages
    attachStacktrace: true,

    // Normalize paths for source maps
    normalizeDepth: 5,
  });

  if (isDevelopment) {
    console.log('[Sentry] Initialized successfully');
  }
}

/**
 * Recursively scrub sensitive data from an object
 */
function scrubSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData);
  }

  if (data && typeof data === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key contains sensitive pattern
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      scrubbed[key] = isSensitive ? '[REDACTED]' : scrubSensitiveData(value);
    }
    return scrubbed;
  }

  return data;
}

/**
 * Capture an exception with Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string | undefined {
  if (!Sentry.getClient()) {
    return undefined;
  }

  return Sentry.captureException(error, {
    extra: context ? scrubSensitiveData(context) as Record<string, unknown> : undefined,
  });
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string | undefined {
  if (!Sentry.getClient()) {
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context ? scrubSensitiveData(context) as Record<string, unknown> : undefined,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    // Only include email if it's provided and we're in production
    // (helps with debugging but is optional for privacy)
    email: isProduction ? undefined : user.email,
    username: user.username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.addBreadcrumb({
    ...breadcrumb,
    data: breadcrumb.data ? scrubSensitiveData(breadcrumb.data) as Record<string, unknown> : undefined,
  });
}

/**
 * Set extra context for the next error
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.setContext(name, scrubSensitiveData(context) as Record<string, unknown>);
}

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): Sentry.Span | undefined {
  if (!Sentry.getClient()) {
    return undefined;
  }

  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Create a Sentry-aware error boundary wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Sentry profiler for React components
 */
export const SentryProfiler = Sentry.withProfiler;

// Export Sentry for direct access if needed
export { Sentry };
