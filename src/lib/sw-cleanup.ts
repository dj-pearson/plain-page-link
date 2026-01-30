/**
 * Service Worker Cleanup Utility
 * 
 * This clears any old or interfering service workers that might be caching
 * authentication requests or causing fetch errors.
 */

/**
 * Check if there are any service workers that should be removed
 */
export async function hasInterferingServiceWorkers(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        // Check if there are any SWs other than our Firebase messaging SW
        return registrations.some(reg => 
            !reg.active?.scriptURL.includes('firebase-messaging-sw.js')
        );
    } catch (error) {
        console.error('[SW Cleanup] Failed to check service workers:', error);
        return false;
    }
}

export async function cleanupServiceWorkers(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    let cleanedUp = false;

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
            // Keep only the Firebase messaging service worker
            if (registration.active?.scriptURL.includes('firebase-messaging-sw.js')) {
                console.log('[SW Cleanup] Keeping Firebase messaging SW:', registration.active.scriptURL);
                continue;
            }
            
            // Unregister any other service workers
            console.log('[SW Cleanup] Unregistering old service worker:', registration.active?.scriptURL);
            await registration.unregister();
            cleanedUp = true;
        }
        
        // Clear all caches to ensure fresh data
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            if (cacheNames.length > 0) {
                await Promise.all(
                    cacheNames.map(cacheName => {
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
