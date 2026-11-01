/**
 * Sentry Session Replay, in a chunk of its own (US-255). Reached only through
 * `import('./sentry-replay')` in ./sentry-sdk.ts, after the core SDK is up.
 */
import { replayIntegration } from '@sentry/react';

export function createReplay() {
  return replayIntegration({
    // Mask all text for privacy
    maskAllText: true,
    // Block all media for privacy
    blockAllMedia: true,
  });
}
