/**
 * The Sentry SDK itself. Only ever reached through `import('./sentry-sdk')`
 * in ./sentry.ts, after the page has loaded (US-255) — never import this file
 * statically, or the SDK lands in the entry chunk again.
 *
 * Session Replay is a further dynamic import (./sentry-replay), so its chunk is
 * fetched only after the core SDK is up.
 */

import {
  addBreadcrumb,
  addIntegration,
  breadcrumbsIntegration,
  browserTracingIntegration,
  init,
  setContext,
  setTag,
  setUser,
  withScope,
} from '@sentry/react';
import type { SentryConfig, SentrySdk } from './sentry';

// Errors that are expected and not actionable.
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
 * Recursively scrub sensitive data from an object
 */
export function scrubSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData);
  }

  if (data && typeof data === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
      scrubbed[key] = isSensitive ? '[REDACTED]' : scrubSensitiveData(value);
    }
    return scrubbed;
  }

  return data;
}

/**
 * scrubSensitiveData for a value already known to be a record.
 *
 * The recursive version has to return `unknown` because it accepts anything,
 * but the object branch always produces a Record. Sentry's breadcrumb `data`
 * and event `extra` are both typed as records, so this keeps that shape rather
 * than making each call site assert it.
 */
function scrubRecord(data: Record<string, unknown>): Record<string, unknown> {
  const scrubbed = scrubSensitiveData(data);
  return scrubbed !== null && typeof scrubbed === 'object' && !Array.isArray(scrubbed)
    ? (scrubbed as Record<string, unknown>)
    : {};
}

export function initSentrySdk(config: SentryConfig): SentrySdk {
  const { deploymentRegion, ...options } = config;

  init({
    ...options,

    integrations: [
      // Browser tracing for performance monitoring (navigation + fetch)
      browserTracingIntegration(),
      // Explicit breadcrumbs for navigation, console, fetch/xhr, and DOM
      breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
      }),
      // Session replay is added by enableReplay(), from its own chunk.
    ],

    // Filter out non-actionable errors
    beforeSend(event, hint) {
      const error = hint.originalException;

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
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          data: breadcrumb.data ? scrubRecord(breadcrumb.data) : undefined,
        }));
      }

      // Scrub sensitive data from extra context
      if (event.extra) {
        event.extra = scrubRecord(event.extra as Record<string, unknown>);
      }

      return event;
    },
  });

  // Explicit tags for filtering/alerting in the Sentry dashboard.
  setTag('environment', config.environment);
  setTag('release', config.release);
  setTag('deployment.region', deploymentRegion);

  return {
    // The facade chose the event id (so it could hand it out before the SDK
    // loaded); a Scope method is the one form that takes both an id and extras.
    captureException(error, eventId, extra) {
      withScope((scope) => {
        if (extra) scope.setExtras(scrubRecord(extra));
        scope.captureException(error, { event_id: eventId });
      });
    },
    captureMessage(message, level, eventId, extra) {
      withScope((scope) => {
        if (extra) scope.setExtras(scrubRecord(extra));
        scope.captureMessage(message, level, { event_id: eventId });
      });
    },
    addBreadcrumb(breadcrumb) {
      addBreadcrumb({
        ...breadcrumb,
        data: breadcrumb.data ? scrubRecord(breadcrumb.data) : undefined,
      });
    },
    setUser(user) {
      setUser(user);
    },
    setContext(name, context) {
      setContext(name, scrubRecord(context));
    },
    setTag(key, value) {
      setTag(key, value);
    },
  };
}

/**
 * Add Session Replay. It reads replaysSessionSampleRate /
 * replaysOnErrorSampleRate from the client options passed to init().
 */
export async function enableReplay(): Promise<void> {
  const { createReplay } = await import('./sentry-replay');
  addIntegration(createReplay());
}
