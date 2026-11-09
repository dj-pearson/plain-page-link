/**
 * Point the page's web app manifest at the agent's own while their public page
 * is open (US-460, fixing US-450).
 *
 * index.html links /manifest.json, the agent's dashboard app (start_url
 * /dashboard since US-436). On agentbio.net/jane that meant a homebuyer's Add
 * to Home Screen produced an icon that opened the AgentBio login. While a
 * profile or listing route is mounted the link names
 * /:username/manifest.json instead — functions/[username]/manifest.json.ts,
 * whose start_url and scope are the agent's page — and goes back to the
 * dashboard manifest when the visitor navigates elsewhere in the app.
 *
 * Chrome and Edge re-read the manifest when the link's href changes. Safari
 * reads it when Add to Home Screen is tapped, which is after this has run.
 *
 * The apple-mobile-web-app-title meta ("AgentBio") is lifted for the same
 * span: Safari prefers it over everything else as the icon's label, and the
 * label on a buyer's home screen should be the agent, which the manifest's
 * name supplies.
 *
 * iOS ignores the manifest's icons and uses the apple-touch-icon link, which
 * index.html points at the AgentBio logo. On iOS Safari, once a HEAD request
 * finds the square render of the agent's photo (US-481, avatarAppIcon.ts),
 * the link names it instead. Only there: no other browser reads the link for
 * Add to Home Screen, so no other visitor pays for the request.
 */
import { useEffect } from 'react';
import { avatarAppIconUrls } from '@/lib/avatarAppIcon';

const DASHBOARD_MANIFEST = '/manifest.json';
/** index.html's apple-mobile-web-app-title; must equal public/manifest.json short_name. */
export const DASHBOARD_APPLE_TITLE = 'AgentBio';
/** Any agent's manifest: /<one segment>/manifest.json. */
const PROFILE_MANIFEST_HREF = /^\/[^/]+\/manifest\.json$/;

/** Must match profileManifestPath in functions/_lib/profile-manifest.ts. */
export function profileManifestHref(username: string): string {
  return `/${encodeURIComponent(username)}/manifest.json`;
}

/** iOS Safari, in a tab: the only browser whose Add to Home Screen reads apple-touch-icon. */
function isIosSafariTab(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return 'standalone' in nav && nav.standalone !== true;
}

export function useProfileManifest(username: string, avatarUrl: string | null = null): void {
  useEffect(() => {
    if (!username || typeof document === 'undefined' || !isIosSafariTab()) return;
    const icon = avatarAppIconUrls(avatarUrl)?.[192];
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!icon || !link) return;

    const previousHref = link.getAttribute('href');
    let cancelled = false;
    let swapped = false;
    fetch(icon, { method: 'HEAD' })
      .then((response) => {
        if (cancelled || !response.ok) return;
        link.setAttribute('href', icon);
        swapped = true;
      })
      .catch(() => {
        // No icon, or no network: the logo stays, which is still an icon.
      });

    return () => {
      cancelled = true;
      if (swapped && previousHref !== null) link.setAttribute('href', previousHref);
    };
  }, [username, avatarUrl]);

  useEffect(() => {
    if (!username || typeof document === 'undefined') return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const created = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    // The server already names the agent's manifest in the document a person
    // first loads (US-553), so the href found here can be this page's own.
    // Leaving for the dashboard must not restore that: anything that is not
    // the dashboard manifest goes back to it.
    const currentHref = link.getAttribute('href');
    const previousHref =
      currentHref && !PROFILE_MANIFEST_HREF.test(currentHref) ? currentHref : DASHBOARD_MANIFEST;
    link.setAttribute('href', profileManifestHref(username));

    // The server drops this meta from an agent's page too (US-569), so it may
    // already be gone. Either way the dashboard gets its label back on leaving.
    const foundAppleTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    const appleTitleParent = foundAppleTitle?.parentNode ?? document.head;
    const appleTitleNext = foundAppleTitle?.nextSibling ?? null;
    let appleTitle = foundAppleTitle;
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      appleTitle.content = DASHBOARD_APPLE_TITLE;
    }
    foundAppleTitle?.remove();

    return () => {
      if (created) {
        link?.remove();
      } else {
        link?.setAttribute('href', previousHref);
      }
      if (appleTitleNext && appleTitleNext.parentNode !== appleTitleParent) {
        appleTitleParent.appendChild(appleTitle);
      } else {
        appleTitleParent.insertBefore(appleTitle, appleTitleNext);
      }
    };
  }, [username]);
}
