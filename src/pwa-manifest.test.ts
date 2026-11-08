/**
 * The installed app opens to the agent's dashboard (US-436).
 *
 * public/manifest.json names the app "AgentBio Admin" ("Manage your real estate
 * link-in-bio profile on the go"), and since the owner's 2026-11-07 decision the
 * installed PWA is the only phone app agents get. Its start_url was "/", which
 * is the prerendered marketing homepage: an agent who tapped the home-screen
 * icon got the hero, the pricing pitch and a "Get Started" button, and had to
 * find "Log In" or type /dashboard to reach their leads. Landing.tsx does not
 * redirect signed-in visitors, so this happened on every launch.
 *
 * It also locked the installed app to portrait, which on a tablet propped up at
 * an open house turned the visitor sign-in kiosk sideways.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
}

interface Manifest {
  id?: string;
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  orientation?: string;
  icons: ManifestIcon[];
  shortcuts?: { name: string; short_name?: string; url: string; icons?: ManifestIcon[] }[];
}

const manifest = JSON.parse(
  readFileSync(join(ROOT, 'public', 'manifest.json'), 'utf8')
) as Manifest;
const app = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
const redirects = readFileSync(join(ROOT, 'public', '_redirects'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(/\s+/));

/** The children of the <Route path="/dashboard"> element, as relative paths. */
function dashboardChildren(): Set<string> {
  const start = app.indexOf('path="/dashboard"');
  expect(start, 'App.tsx defines /dashboard').toBeGreaterThan(-1);
  const end = app.indexOf('</Route>', start);
  const block = app.slice(start, end);
  return new Set([...block.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]));
}

/** Whether _redirects serves the SPA shell (200 /index.html) for a path. */
function servedAsApp(path: string): boolean {
  return redirects.some(([from, to, status]) => {
    if (to !== '/index.html' || status !== '200') return false;
    if (from === path) return true;
    return from.endsWith('/*') && path.startsWith(from.slice(0, -1));
  });
}

/** Whether a manifest URL is an existing dashboard page the host serves. */
function isDashboardPage(url: string): boolean {
  const { pathname } = new URL(url, 'https://agentbio.net');
  if (pathname === '/dashboard') return servedAsApp(pathname);
  const child = pathname.replace(/^\/dashboard\//, '');
  return child !== pathname && dashboardChildren().has(child) && servedAsApp(pathname);
}

describe('PWA manifest (US-436)', () => {
  it('opens the installed app on the dashboard, not the marketing homepage', () => {
    expect(manifest.start_url).toBe('/dashboard');
    expect(isDashboardPage(manifest.start_url)).toBe(true);
    // RequireAuth sends a signed-out launch to /auth/login and remembers the
    // route, so the dashboard is the right door either way.
    expect(app).toMatch(/<Route element={<RequireAuth[^>]*>}>[\s\S]*path="\/dashboard"/);
  });

  it('keeps the identity existing installs already have', () => {
    // Without `id`, browsers derive the app's identity from start_url. Moving
    // start_url would then register a second, different app for everyone who
    // installed it under "/". Pinning id to the old start_url prevents that.
    expect(manifest.id).toBe('/');
  });

  it('keeps start_url and every shortcut inside the scope', () => {
    expect(manifest.scope).toBe('/');
    for (const url of [manifest.start_url, ...(manifest.shortcuts ?? []).map((s) => s.url)]) {
      expect(url.startsWith(manifest.scope), url).toBe(true);
    }
  });

  it('offers long-press shortcuts to the pages an agent opens from the phone', () => {
    const shortcuts = manifest.shortcuts ?? [];
    expect(shortcuts.map((s) => s.url)).toEqual(
      expect.arrayContaining(['/dashboard/leads', '/dashboard/open-houses'])
    );
    // Android shows at most four; more are silently dropped.
    expect(shortcuts.length).toBeLessThanOrEqual(4);
    for (const shortcut of shortcuts) {
      expect(isDashboardPage(shortcut.url), shortcut.url).toBe(true);
      expect(shortcut.name.length, shortcut.name).toBeGreaterThan(0);
      for (const icon of shortcut.icons ?? []) {
        expect(existsSync(join(ROOT, 'public', icon.src)), icon.src).toBe(true);
      }
    }
  });

  it('does not lock the installed app to portrait', () => {
    // The open-house kiosk runs on tablets in landscape.
    expect(manifest.orientation === undefined || manifest.orientation === 'any').toBe(true);
  });

  it('ships every icon it names', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(join(ROOT, 'public', icon.src)), icon.src).toBe(true);
    }
  });

  it('gives iOS a short home-screen label', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(html).toContain(
      `<meta name="apple-mobile-web-app-title" content="${manifest.short_name}" />`
    );
  });
});
