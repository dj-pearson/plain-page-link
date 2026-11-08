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
 */
import { useEffect } from 'react';

const DASHBOARD_MANIFEST = '/manifest.json';

/** Must match profileManifestPath in functions/_lib/profile-manifest.ts. */
export function profileManifestHref(username: string): string {
  return `/${encodeURIComponent(username)}/manifest.json`;
}

export function useProfileManifest(username: string): void {
  useEffect(() => {
    if (!username || typeof document === 'undefined') return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const created = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    const previousHref = link.getAttribute('href') ?? DASHBOARD_MANIFEST;
    link.setAttribute('href', profileManifestHref(username));

    const appleTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    const appleTitleParent = appleTitle?.parentNode ?? null;
    const appleTitleNext = appleTitle?.nextSibling ?? null;
    appleTitle?.remove();

    return () => {
      if (created) {
        link?.remove();
      } else {
        link?.setAttribute('href', previousHref);
      }
      if (appleTitle && appleTitleParent) {
        appleTitleParent.insertBefore(appleTitle, appleTitleNext);
      }
    };
  }, [username]);
}
