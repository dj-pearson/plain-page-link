/**
 * Warm the auth route chunks in idle time.
 *
 * US-195 made Login and Register lazy. They had been static imports, commented
 * "eager load for better UX", which put them and the whole form stack they pull
 * in — react-hook-form, zod, @hookform/resolvers, 22.6 kB gzipped — into the
 * entry graph that every visitor downloads. Including the visitor to
 * agentbio.net/janedoe, which is the product: a link in an Instagram bio,
 * opened on a phone, by someone who will never sign in.
 *
 * The UX intent was real, though, and this is how it is kept. Any page that
 * shows a Sign in link starts the download once the page has settled, so by the
 * time the visitor clicks, the chunk is in the HTTP cache. A public profile
 * shows no such link and never calls this.
 */

let warmed = false;

export function prefetchAuthPages(): void {
  if (warmed || typeof window === 'undefined') return;
  warmed = true;

  const warm = () => {
    // Failures are silent on purpose: this is an optimisation, and the real
    // navigation will retry through Suspense.
    void import('@/pages/auth/Login').catch(() => undefined);
    void import('@/pages/auth/Register').catch(() => undefined);
  };

  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  // Safari has no requestIdleCallback. A timeout is not the same thing, but
  // "after the page has settled" is all this needs to mean.
  if (idle) idle(warm);
  else window.setTimeout(warm, 2000);
}

/** Test seam. */
export function resetAuthPrefetch(): void {
  warmed = false;
}
