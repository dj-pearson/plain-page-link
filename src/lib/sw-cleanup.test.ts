import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { logger } from '@/lib/logger';
import { cleanupAndReload, cleanupNeedsReload, cleanupServiceWorkers } from './sw-cleanup';

function stubBrowser(scripts: string[], cacheNames: string[], controllerURL?: string) {
  const registrations = scripts.map((scriptURL) => ({
    active: { scriptURL },
    unregister: vi.fn(async () => true),
  }));
  const deleted: string[] = [];
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: controllerURL ? { scriptURL: controllerURL } : null,
      getRegistrations: vi.fn(async () => registrations),
    },
  });
  vi.stubGlobal('caches', {
    keys: vi.fn(async () => cacheNames),
    delete: vi.fn(async (name: string) => {
      deleted.push(name);
      return true;
    }),
  });
  return { registrations, deleted };
}

function stubLocation() {
  const replace = vi.fn();
  vi.stubGlobal('location', { href: 'https://agentbio.net/auth/login', replace });
  return replace;
}

const APP_SW = 'https://agentbio.net/sw.js';
const LEGACY_SW = 'https://agentbio.net/firebase-messaging-sw.js';

describe('cleanupServiceWorkers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('keeps the app worker and its caches, removes legacy ones, and logs through logger', async () => {
    const consoleLog = vi.spyOn(console, 'log');
    const { registrations, deleted } = stubBrowser(
      [APP_SW, LEGACY_SW],
      ['agentbio-sw-runtime-v1', 'agentbio-sw-pages-v1', 'workbox-precache-v2'],
      APP_SW
    );

    expect(await cleanupServiceWorkers()).toEqual({
      unregisteredWorkers: 1,
      controlledByLegacyWorker: false,
      deletedCaches: 1,
    });
    expect(registrations[0].unregister).not.toHaveBeenCalled();
    expect(registrations[1].unregister).toHaveBeenCalledTimes(1);
    expect(deleted).toEqual(['workbox-precache-v2']);
    expect(logger.info).toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it('reports a deleted foreign cache separately from unregistered workers', async () => {
    const { deleted } = stubBrowser(
      [APP_SW],
      ['agentbio-sw-runtime-v1', 'third-party-cache'],
      APP_SW
    );
    const result = await cleanupServiceWorkers();
    expect(result).toEqual({
      unregisteredWorkers: 0,
      controlledByLegacyWorker: false,
      deletedCaches: 1,
    });
    expect(deleted).toEqual(['third-party-cache']);
    expect(cleanupNeedsReload(result)).toBe(false);
  });

  it('flags a page still controlled by a legacy worker that was already unregistered', async () => {
    stubBrowser([APP_SW], [], LEGACY_SW);
    const result = await cleanupServiceWorkers();
    expect(result.unregisteredWorkers).toBe(0);
    expect(result.controlledByLegacyWorker).toBe(true);
    expect(cleanupNeedsReload(result)).toBe(true);
  });

  it('reports a failure through logger.error and does nothing', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        getRegistrations: vi.fn(async () => Promise.reject(new Error('denied'))),
      },
    });
    expect(await cleanupServiceWorkers()).toEqual({
      unregisteredWorkers: 0,
      controlledByLegacyWorker: false,
      deletedCaches: 0,
    });
    expect(logger.error).toHaveBeenCalledWith(
      '[SW Cleanup] Failed to cleanup service workers',
      expect.any(Error)
    );
  });
});

// US-357: Login calls cleanupAndReload after every sign-in network error. It
// used to reload whenever any cache not owned by the app existed, wiping the
// form on a flaky connection.
describe('cleanupAndReload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('does not reload when it only deleted a foreign cache', async () => {
    stubBrowser([APP_SW], ['third-party-cache'], APP_SW);
    const replace = stubLocation();
    expect(await cleanupAndReload()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not reload when there is nothing to clean', async () => {
    stubBrowser([APP_SW], ['agentbio-sw-runtime-v1'], APP_SW);
    const replace = stubLocation();
    expect(await cleanupAndReload()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('reloads after unregistering a legacy worker', async () => {
    stubBrowser([APP_SW, LEGACY_SW], [], APP_SW);
    const replace = stubLocation();
    expect(await cleanupAndReload()).toBe(true);
    expect(replace).toHaveBeenCalledWith('https://agentbio.net/auth/login');
  });

  it('reloads when a legacy worker still controls the page', async () => {
    stubBrowser([], [], LEGACY_SW);
    const replace = stubLocation();
    expect(await cleanupAndReload()).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
