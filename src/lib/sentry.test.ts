import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * US-255: src/lib/sentry.ts is a facade. The SDK (and Session Replay) is
 * fetched with a dynamic import after the page has loaded, so every call made
 * before then has to be held and replayed rather than lost.
 */

const sdk = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
};
const initSentrySdk = vi.fn(() => sdk);
const enableReplay = vi.fn(() => Promise.resolve());

vi.mock('./sentry-sdk', () => ({ initSentrySdk, enableReplay }));

type SentryModule = typeof import('./sentry');

async function loadFacade(env: Record<string, string>): Promise<SentryModule> {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('./sentry');
}

const ACTIVE = {
  VITE_SENTRY_DSN: 'https://public@o0.ingest.sentry.io/0',
  VITE_SENTRY_ENABLED: 'true',
};

function rejection(reason: unknown): Event {
  return Object.assign(new Event('unhandledrejection'), { reason, promise: Promise.resolve() });
}

describe('sentry facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('has no static @sentry import, so the SDK cannot reach the entry chunk', () => {
    const src = readFileSync(join(__dirname, 'sentry.ts'), 'utf8');
    expect(src).not.toMatch(/from\s+['"]@sentry/);
    expect(src).not.toMatch(/import\s*\(\s*['"]@sentry/);
    // Replay lives behind a second dynamic import of its own.
    const sdkSrc = readFileSync(join(__dirname, 'sentry-sdk.ts'), 'utf8');
    expect(sdkSrc).not.toMatch(/\breplayIntegration\b/);
    expect(sdkSrc).toMatch(/import\(\s*['"]\.\/sentry-replay['"]\s*\)/);
  });

  it('buffers calls made before the SDK loads and replays them in order', async () => {
    const sentry = await loadFacade(ACTIVE);

    sentry.setUser({ id: 'user-1', username: 'jane' });
    sentry.setTag('plan', 'pro');
    sentry.setContext('page', { route: '/jane' });
    sentry.addBreadcrumb({ category: 'nav', message: 'opened profile' });
    const eventId = sentry.captureException(new Error('early boom'), { action: 'load' });
    sentry.captureMessage('early note', 'warning');

    // Nothing has been imported yet.
    expect(initSentrySdk).not.toHaveBeenCalled();
    expect(eventId).toMatch(/^[0-9a-f]{32}$/);

    await sentry.loadSentry();

    expect(initSentrySdk).toHaveBeenCalledTimes(1);
    expect(sdk.setUser).toHaveBeenCalledWith({ id: 'user-1', email: undefined, username: 'jane' });
    expect(sdk.setTag).toHaveBeenCalledWith('plan', 'pro');
    expect(sdk.setContext).toHaveBeenCalledWith('page', { route: '/jane' });
    expect(sdk.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'nav',
        message: 'opened profile',
        timestamp: expect.any(Number),
      })
    );
    // The id handed out before load is the id the event is sent under, so the
    // "Error ID" an ErrorBoundary shows matches what is in Sentry.
    expect(sdk.captureException).toHaveBeenCalledWith(expect.any(Error), eventId, {
      action: 'load',
    });
    expect(sdk.captureMessage).toHaveBeenCalledWith(
      'early note',
      'warning',
      expect.stringMatching(/^[0-9a-f]{32}$/),
      undefined
    );

    // The breadcrumb was recorded before the exception, and arrives before it.
    const crumbOrder = sdk.addBreadcrumb.mock.invocationCallOrder[0];
    const errorOrder = sdk.captureException.mock.invocationCallOrder[0];
    expect(crumbOrder).toBeLessThan(errorOrder);

    // Replay is requested once the core SDK is up.
    expect(enableReplay).toHaveBeenCalledTimes(1);

    // After load, calls go straight through.
    sentry.captureException(new Error('later'));
    expect(sdk.captureException).toHaveBeenCalledTimes(2);
  });

  it('a clearUser before load wins over an earlier setUser', async () => {
    const sentry = await loadFacade(ACTIVE);
    sentry.setUser({ id: 'user-1' });
    sentry.clearUser();
    await sentry.loadSentry();
    expect(sdk.setUser).toHaveBeenCalledTimes(1);
    expect(sdk.setUser).toHaveBeenCalledWith(null);
  });

  it('holds early window errors and unhandled rejections, then hands over to the SDK', async () => {
    const sentry = await loadFacade(ACTIVE);
    sentry.initSentry();

    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('thrown during boot'),
        message: 'thrown during boot',
      })
    );
    window.dispatchEvent(rejection('chunk failed'));

    await sentry.loadSentry();

    const errors = sdk.captureException.mock.calls.map((call) => (call[0] as Error).message);
    expect(errors).toContain('thrown during boot');
    expect(errors.some((m) => m.includes('chunk failed'))).toBe(true);

    // The SDK's own global handlers take over: ours are gone, so nothing is
    // reported twice.
    sdk.captureException.mockClear();
    // (A listener of the test's own, so the dispatched error is not reported
    // to vitest as uncaught once the facade's listener is gone.)
    const swallow = (event: Event) => event.preventDefault();
    window.addEventListener('error', swallow);
    try {
      window.dispatchEvent(
        new ErrorEvent('error', { error: new Error('after load'), message: 'after load' })
      );
    } finally {
      window.removeEventListener('error', swallow);
    }
    expect(sdk.captureException).not.toHaveBeenCalled();
  });

  it('caps the buffer, keeping the earliest events', async () => {
    const sentry = await loadFacade(ACTIVE);
    for (let i = 0; i < sentry.MAX_BUFFERED_EVENTS + 25; i++) {
      sentry.captureException(new Error(`e${i}`));
    }
    await sentry.loadSentry();

    expect(sdk.captureException).toHaveBeenCalledTimes(sentry.MAX_BUFFERED_EVENTS);
    expect((sdk.captureException.mock.calls[0][0] as Error).message).toBe('e0');
    // The loss is recorded rather than silent.
    expect(sdk.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('25') })
    );
  });

  it('loads the SDK only once however often it is asked', async () => {
    const sentry = await loadFacade(ACTIVE);
    await Promise.all([sentry.loadSentry(), sentry.loadSentry()]);
    await sentry.loadSentry();
    expect(initSentrySdk).toHaveBeenCalledTimes(1);
  });

  it('passes the tunnel and sample rates to the SDK', async () => {
    const sentry = await loadFacade(ACTIVE);
    await sentry.loadSentry();
    expect(initSentrySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: ACTIVE.VITE_SENTRY_DSN,
        tunnel: sentry.SENTRY_TUNNEL,
        enabled: true,
      })
    );
  });

  it('does nothing at all without a DSN', async () => {
    const sentry = await loadFacade({ VITE_SENTRY_DSN: '', VITE_SENTRY_ENABLED: 'true' });
    sentry.initSentry();
    expect(sentry.captureException(new Error('x'))).toBeUndefined();
    await sentry.loadSentry();
    expect(initSentrySdk).not.toHaveBeenCalled();
  });

  it('initSentry defers the import until the page has loaded and is idle', async () => {
    vi.useFakeTimers();
    try {
      const sentry = await loadFacade(ACTIVE);
      sentry.initSentry();
      expect(initSentrySdk).not.toHaveBeenCalled();
      // jsdom's readyState is already 'complete'; the idle fallback is a timer.
      await vi.runAllTimersAsync();
      expect(initSentrySdk).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
