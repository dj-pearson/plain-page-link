/**
 * Proof that a canonical no longer depends on which host served the page
 * (US-172).
 *
 * The state this prevents: getBaseUrl() was getSafeOrigin(), which in a browser
 * returns window.location.origin. Every canonical, og:url and JSON-LD url on
 * every site-owned page was therefore the visitor's host. On agentbio.net that
 * is right by coincidence; on the *.pages.dev preview URL Cloudflare Pages
 * gives every branch, it is the whole site telling Google that the preview is
 * the original — as soon as the bundle hydrates and react-helmet-async
 * overwrites the prerendered canonical. Googlebot renders JavaScript.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { getBaseUrl, getCanonicalUrl, getOgImageUrl } from './seo.config';

const PREVIEW = 'https://feature-branch.agentbio-net.pages.dev';

/** Put the page on a host that is not the site, as a preview deploy does. */
function servedFrom(origin: string) {
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    origin,
    href: `${origin}/pricing`,
  } as Location);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the canonical origin', () => {
  it('is the configured app URL, not the host that served the page', () => {
    servedFrom(PREVIEW);
    expect(getBaseUrl()).not.toContain('pages.dev');
    expect(getCanonicalUrl('/pricing')).not.toContain('pages.dev');
  });

  it('is unchanged by the host', () => {
    servedFrom(PREVIEW);
    const fromPreview = getCanonicalUrl('/vs/linktree');
    servedFrom('https://agentbio.net');
    expect(getCanonicalUrl('/vs/linktree')).toBe(fromPreview);
  });

  it('normalises a path without a leading slash', () => {
    expect(getCanonicalUrl('pricing')).toBe(getCanonicalUrl('/pricing'));
  });

  it('does not double the slash on the homepage', () => {
    expect(getCanonicalUrl('/')).toMatch(/^https?:\/\/[^/]+\/$/);
  });

  it('builds og:image against the same origin', () => {
    servedFrom(PREVIEW);
    expect(getOgImageUrl()).not.toContain('pages.dev');
    expect(getOgImageUrl().startsWith(getBaseUrl())).toBe(true);
  });

  it('leaves an already-absolute og:image alone', () => {
    expect(getOgImageUrl('https://cdn.example.com/x.png')).toBe('https://cdn.example.com/x.png');
  });
});
