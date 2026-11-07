/**
 * Service Worker Cleanup Utility
 *
 * This clears any old or interfering service workers that might be caching
 * authentication requests or causing fetch errors.
 */

export async function cleanupServiceWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  let cleanedUp = false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    // Service workers that are intentionally kept. The app SW (sw.js)
    // is auth-safe by design (never caches auth/Supabase — see
    // public/sw.js); legacy/unknown SWs are still purged because the
    // original auth-caching incident was caused by an unscoped SW.
    // Push was removed, so a leftover firebase-messaging-sw.js on a device is
    // legacy too and is unregistered here.
    const KEEP_SW = ['/sw.js'];
    // Cache names owned by the app SW — must NOT be wiped here.
    const APP_CACHE_PREFIX = 'agentbio-sw-';

    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || '';
      if (KEEP_SW.some((keep) => scriptURL.includes(keep))) {
        console.log('[SW Cleanup] Keeping known SW:', scriptURL);
        continue;
      }

      // Unregister any other (legacy/unknown) service workers
      console.log('[SW Cleanup] Unregistering old service worker:', scriptURL);
      await registration.unregister();
      cleanedUp = true;
    }

    // Clear stale caches, but preserve the app SW's own caches.
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const stale = cacheNames.filter((name) => !name.startsWith(APP_CACHE_PREFIX));
      if (stale.length > 0) {
        await Promise.all(
          stale.map((cacheName) => {
            console.log('[SW Cleanup] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        cleanedUp = true;
      }
    }

    if (cleanedUp) {
      console.log('[SW Cleanup] Service worker cleanup complete');
    }

    return cleanedUp;
  } catch (error) {
    console.error('[SW Cleanup] Failed to cleanup service workers:', error);
    return false;
  }
}

/**
 * Force reload the page if service workers were cleaned up
 * This ensures the app runs with a fresh state
 */
export async function cleanupAndReload(): Promise<void> {
  const cleaned = await cleanupServiceWorkers();

  // Reload only if we actually removed something
  if (cleaned) {
    console.log('[SW Cleanup] Reloading to apply changes...');
    // Use replace to prevent back button issues
    window.location.replace(window.location.href);
  }
}
