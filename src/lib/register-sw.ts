/**
 * Service worker registration with update detection (US-027).
 *
 * Registers the auth-safe app SW (public/sw.js) via workbox-window only
 * in production builds. When a new SW is waiting, the user is prompted to
 * refresh; accepting activates the new SW and reloads once.
 *
 * Dev builds intentionally skip registration so the SW never interferes
 * with hot-reload or local debugging. sw-cleanup.ts allowlists this SW.
 */
import { Workbox } from 'workbox-window';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const wb = new Workbox('/sw.js');
  let reloading = false;

  wb.addEventListener('controlling', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  // A new SW is installed and waiting to take over.
  wb.addEventListener('waiting', () => {
    toast('A new version is available', {
      description: 'Refresh to get the latest improvements.',
      duration: Infinity,
      action: {
        label: 'Refresh',
        onClick: () => {
          wb.messageSkipWaiting();
        },
      },
    });
  });

  wb.register().catch((error) => {
    logger.error('Service worker registration failed', error as Error);
  });
}
