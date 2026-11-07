import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { logger } from '@/lib/logger';
import { cleanupServiceWorkers } from './sw-cleanup';

function stubBrowser(scripts: string[], cacheNames: string[]) {
  const registrations = scripts.map((scriptURL) => ({
    active: { scriptURL },
    unregister: vi.fn(async () => true),
  }));
  const deleted: string[] = [];
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistrations: vi.fn(async () => registrations) },
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

describe('cleanupServiceWorkers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('keeps the app worker and its caches, removes legacy ones, and logs through logger', async () => {
    const consoleLog = vi.spyOn(console, 'log');
    const { registrations, deleted } = stubBrowser(
      ['https://agentbio.net/sw.js', 'https://agentbio.net/firebase-messaging-sw.js'],
      ['agentbio-sw-runtime-v1', 'agentbio-sw-pages-v1', 'workbox-precache-v2']
    );

    expect(await cleanupServiceWorkers()).toBe(true);
    expect(registrations[0].unregister).not.toHaveBeenCalled();
    expect(registrations[1].unregister).toHaveBeenCalledTimes(1);
    expect(deleted).toEqual(['workbox-precache-v2']);
    expect(logger.info).toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it('reports a failure through logger.error and returns false', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: vi.fn(async () => Promise.reject(new Error('denied'))) },
    });
    expect(await cleanupServiceWorkers()).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[SW Cleanup] Failed to cleanup service workers',
      expect.any(Error)
    );
  });
});
