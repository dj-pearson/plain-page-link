import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  useProfileManifest,
  profileManifestHref,
  DASHBOARD_APPLE_TITLE,
} from './useProfileManifest';
import { profileManifestPath } from '../../functions/_lib/profile-manifest';

/**
 * US-460 (fixing US-450): on an agent's public page the manifest link names
 * that agent's manifest, and goes back to the dashboard's when they leave.
 */
const manifestHref = () =>
  document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? null;
const appleTitle = () => document.querySelector('meta[name="apple-mobile-web-app-title"]');

beforeEach(() => {
  document.head.innerHTML =
    '<link rel="manifest" href="/manifest.json" />' +
    '<meta name="apple-mobile-web-app-title" content="AgentBio" />';
});

describe('useProfileManifest', () => {
  it("links the agent's manifest while the page is mounted and restores the dashboard's after", () => {
    const { unmount } = renderHook(() => useProfileManifest('jane'));
    expect(manifestHref()).toBe('/jane/manifest.json');
    expect(appleTitle()).toBeNull();

    unmount();
    expect(manifestHref()).toBe('/manifest.json');
    expect(appleTitle()?.getAttribute('content')).toBe('AgentBio');
  });

  it('follows a move from one agent to another', () => {
    const { rerender, unmount } = renderHook(({ u }) => useProfileManifest(u), {
      initialProps: { u: 'jane' },
    });
    rerender({ u: 'dana-rivers' });
    expect(manifestHref()).toBe('/dana-rivers/manifest.json');
    expect(document.querySelectorAll('link[rel="manifest"]')).toHaveLength(1);
    unmount();
    expect(manifestHref()).toBe('/manifest.json');
  });

  it("restores the dashboard's, not the agent's, when the server already linked the agent's (US-553)", () => {
    document.head.innerHTML = '<link rel="manifest" href="/jane/manifest.json" />';
    const { unmount } = renderHook(() => useProfileManifest('jane'));
    expect(manifestHref()).toBe('/jane/manifest.json');
    unmount();
    expect(manifestHref()).toBe('/manifest.json');
  });

  it('copes with the server having already dropped the label, and gives it back on leaving (US-569)', () => {
    document.head.innerHTML = '<link rel="manifest" href="/jane/manifest.json" />';
    const { rerender, unmount } = renderHook(({ u }) => useProfileManifest(u), {
      initialProps: { u: 'jane' },
    });
    expect(appleTitle()).toBeNull();
    rerender({ u: 'dana-rivers' });
    expect(appleTitle()).toBeNull();
    unmount();
    expect(document.querySelectorAll('meta[name="apple-mobile-web-app-title"]')).toHaveLength(1);
    expect(appleTitle()?.getAttribute('content')).toBe('AgentBio');
  });

  it("restores the label index.html carries, which is the dashboard manifest's short_name", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'manifest.json'), 'utf8')
    ) as { short_name: string };
    expect(DASHBOARD_APPLE_TITLE).toBe(manifest.short_name);
    expect(readFileSync(join(process.cwd(), 'index.html'), 'utf8')).toContain(
      `<meta name="apple-mobile-web-app-title" content="${DASHBOARD_APPLE_TITLE}" />`
    );
  });

  it('leaves the dashboard manifest alone without a username', () => {
    renderHook(() => useProfileManifest(''));
    expect(manifestHref()).toBe('/manifest.json');
    expect(appleTitle()).not.toBeNull();
  });

  it('adds a link when the document has none, and removes it again', () => {
    document.head.innerHTML = '';
    const { unmount } = renderHook(() => useProfileManifest('jane'));
    expect(manifestHref()).toBe('/jane/manifest.json');
    unmount();
    expect(document.querySelector('link[rel="manifest"]')).toBeNull();
  });

  it('names the same URL the Pages Function serves', () => {
    for (const u of ['jane', 'dana-rivers', 'josé']) {
      expect(profileManifestHref(u)).toBe(profileManifestPath(u));
    }
  });
});

describe('useProfileManifest on iOS: the apple-touch-icon is the agent (US-481)', () => {
  const AVATAR = 'https://api.example.test/storage/v1/object/public/avatars/u1/avatar-17.jpg';
  const ICON =
    'https://api.example.test/storage/v1/object/public/avatars/u1/avatar-17-app-icon-192.png';
  const touchIcon = () =>
    document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? null;
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();
  const setStandalone = (value: boolean | undefined) => {
    if (value === undefined) {
      Reflect.deleteProperty(navigator, 'standalone');
    } else {
      Object.defineProperty(navigator, 'standalone', { value, configurable: true });
    }
  };

  beforeEach(() => {
    document.head.innerHTML =
      '<link rel="manifest" href="/manifest.json" />' +
      '<link rel="apple-touch-icon" href="/Icon.png" />';
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    setStandalone(false);
  });
  afterEach(() => {
    setStandalone(undefined);
    vi.unstubAllGlobals();
  });

  it('names the photo icon once it is found, and the logo again after', async () => {
    const { unmount } = renderHook(() => useProfileManifest('jane', AVATAR));
    await waitFor(() => expect(touchIcon()).toBe(ICON));
    expect(fetchMock).toHaveBeenCalledWith(ICON, { method: 'HEAD' });

    unmount();
    expect(touchIcon()).toBe('/Icon.png');
  });

  it('keeps the logo when the icon was never made', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    renderHook(() => useProfileManifest('jane', AVATAR));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(touchIcon()).toBe('/Icon.png');
  });

  it('asks nothing outside iOS Safari, inside the installed app, or without a photo', () => {
    setStandalone(undefined);
    renderHook(() => useProfileManifest('jane', AVATAR)).unmount();
    setStandalone(true);
    renderHook(() => useProfileManifest('jane', AVATAR)).unmount();
    setStandalone(false);
    renderHook(() => useProfileManifest('jane', null)).unmount();
    renderHook(() => useProfileManifest('jane', 'https://images.example.com/me.jpg')).unmount();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(touchIcon()).toBe('/Icon.png');
  });
});
