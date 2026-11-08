import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProfileManifest, profileManifestHref } from './useProfileManifest';
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
