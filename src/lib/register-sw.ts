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
  // Whether WE asked the waiting worker to take over, via the Refresh action.
  let updateRequested = false;

  /**
   * US-211: this reloaded on every `controlling` event.
   *
   * `controlling` fires whenever a service worker takes control of the page —
   * and that includes the FIRST registration on a first visit, not only an
   * update the visitor asked for. So every first-time visitor loaded the page,
   * registered the worker, and then immediately reloaded the whole thing.
   *
   * Measured on a production build served with real cache headers: with the
   * service worker blocked the landing page is 1232 KB over 36 requests; with
   * it allowed, 2109 KB over 57, with the document, the stylesheet and every
   * entry chunk — index, react-vendor, supabase, state-vendor, ui-vendor —
   * fetched twice. The public profile went 1397 KB -> 2274 KB. That is the
   * page opened from an Instagram bio on a phone, paying for the application
   * twice before it can be read.
   *
   * Reloading is right for the one case it was written for: the visitor pressed
   * Refresh on the update toast, so a reload is what they asked for. That is
   * what `updateRequested` distinguishes.
   */
  wb.addEventListener('controlling', () => {
    if (!updateRequested || reloading) return;
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
          updateRequested = true;
          wb.messageSkipWaiting();
        },
      },
    });
  });

  wb.register().catch((error) => {
    logger.error('Service worker registration failed', error as Error);
  });
}
