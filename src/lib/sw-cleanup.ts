/**
 * Service Worker Cleanup Utility
 *
 * This clears any old or interfering service workers that might be caching
 * authentication requests or causing fetch errors.
 */

import { logger } from '@/lib/logger';

/** Service workers that are intentionally kept. */
const KEEP_SW = ['/sw.js'];
/** Cache names owned by the app SW (public/sw.js) - never wiped here. */
const APP_CACHE_PREFIX = 'agentbio-sw-';

export interface ServiceWorkerCleanupResult {
  /** Legacy/unknown service workers unregistered by this call. */
  unregisteredWorkers: number;
  /**
   * True when the page is still controlled by a worker that is not the app
   * SW. Unregistering does not release a page its worker already controls,
   * so the page keeps going through it until it reloads - even when an
   * earlier call (App.tsx runs one on every load) did the unregistering.
   */
  controlledByLegacyWorker: boolean;
  /** Caches not owned by the app SW that were deleted. */
  deletedCaches: number;
}

function nothingDone(): ServiceWorkerCleanupResult {
  return { unregisteredWorkers: 0, controlledByLegacyWorker: false, deletedCaches: 0 };
}

function isKept(scriptURL: string): boolean {
  return KEEP_SW.some((keep) => scriptURL.includes(keep));
}

export async function cleanupServiceWorkers(): Promise<ServiceWorkerCleanupResult> {
  const result = nothingDone();
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return result;
  }

  try {
    // The app SW (sw.js) is auth-safe by design (never caches auth/Supabase -
    // see public/sw.js); legacy/unknown SWs are still purged because the
    // original auth-caching incident was caused by an unscoped SW. Push was
    // removed, so a leftover firebase-messaging-sw.js on a device is legacy
    // too and is unregistered here.
    const controllerURL = navigator.serviceWorker.controller?.scriptURL ?? '';
    result.controlledByLegacyWorker = controllerURL !== '' && !isKept(controllerURL);

    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        '';
      if (isKept(scriptURL)) {
        logger.debug('[SW Cleanup] Keeping known SW', { scriptURL });
        continue;
      }

      logger.info('[SW Cleanup] Unregistering old service worker', { scriptURL });
      if (await registration.unregister()) {
        result.unregisteredWorkers += 1;
      }
    }

    // Clear stale caches, but preserve the app SW's own caches. Deleting a
    // cache never calls for a reload: the app SW does not read a cache it
    // does not own, and a legacy worker's caches go with the worker.
    if (typeof caches !== 'undefined') {
      const cacheNames = await caches.keys();
      const stale = cacheNames.filter((name) => !name.startsWith(APP_CACHE_PREFIX));
      const deleted = await Promise.all(
        stale.map((cacheName) => {
          logger.info('[SW Cleanup] Deleting cache', { cacheName });
          return caches.delete(cacheName);
        })
      );
      result.deletedCaches = deleted.filter(Boolean).length;
    }

    if (result.unregisteredWorkers > 0 || result.deletedCaches > 0) {
      logger.info('[SW Cleanup] Service worker cleanup complete', { ...result });
    }

    return result;
  } catch (error) {
    logger.error('[SW Cleanup] Failed to cleanup service workers', error);
    return result;
  }
}

/** Whether a cleanup left the page needing a reload to drop a legacy worker. */
export function cleanupNeedsReload(result: ServiceWorkerCleanupResult): boolean {
  return result.unregisteredWorkers > 0 || result.controlledByLegacyWorker;
}

/**
 * Clean up, then reload the page only if a legacy service worker was
 * unregistered or still controls it. A reload wipes whatever the visitor had
 * typed, so deleting a stray cache - or finding nothing to do - never
 * triggers one (US-357).
 *
 * @returns whether a reload was started
 */
export async function cleanupAndReload(): Promise<boolean> {
  const result = await cleanupServiceWorkers();
  if (!cleanupNeedsReload(result)) {
    return false;
  }
  logger.info('[SW Cleanup] Reloading to drop a legacy service worker');
  // Use replace to prevent back button issues
  window.location.replace(window.location.href);
  return true;
}
