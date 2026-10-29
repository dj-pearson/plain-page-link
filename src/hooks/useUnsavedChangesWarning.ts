import { useEffect } from 'react';

const DEFAULT_MESSAGE = 'You have unsaved changes. Leave this page and lose them?';

/**
 * Warns before leaving a page with unsaved changes (US-237).
 *
 * The app mounts <BrowserRouter> (main.tsx), not a data router, so React
 * Router's useBlocker is unavailable. Two listeners stand in for it while
 * `when` is true:
 *
 *   - beforeunload, for a reload, a closed tab or an external link;
 *   - a capture-phase click listener on the document, for in-app links (the
 *     dashboard nav). It runs before React Router's <Link> handler, which is
 *     attached at the React root, so cancelling here stops the navigation.
 *
 * Browser back/forward is not covered; without a data router there is no
 * supported way to hold a popstate.
 */
export function useUnsavedChangesWarning(when: boolean, message: string = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!when) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome before 119 needs returnValue set to show the prompt.
      event.returnValue = '';
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      // A different origin unloads the page, and beforeunload asks.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [when, message]);
}
