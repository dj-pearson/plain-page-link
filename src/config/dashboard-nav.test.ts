/**
 * US-120: the sidebar and the mobile nav were two hand-maintained lists, and
 * they had drifted. /dashboard/subscription, /team and /api-keys were in the
 * sidebar and absent from MobileNav entirely — so an agent on a phone could not
 * reach their own billing. /dashboard/settings/delete-account had no link
 * anywhere in the app. And the sidebar carried fifteen entries for a
 * link-in-bio product aimed at people who are not technical.
 *
 * Both navs render from src/config/dashboard-nav.ts now. These hold that file
 * to the route table, and hold both navs to that file.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRIMARY_NAV, SETTINGS_TOOLS, ALL_NAV_DESTINATIONS } from './dashboard-nav';

const SRC = join(process.cwd(), 'src');
const read = (path: string) => readFileSync(join(SRC, path), 'utf8');

/** Full dashboard route paths declared in App.tsx. */
function dashboardRoutes(): string[] {
  const source = read('App.tsx');
  const block = source.slice(
    source.indexOf('path="/dashboard"'),
    source.indexOf('Admin — the platform')
  );
  const children = Array.from(block.matchAll(/path="([^"/][^"]*)"/g)).map(
    (m) => `/dashboard/${m[1]}`
  );
  return ['/dashboard', ...children];
}

describe('dashboard navigation', () => {
  it('parses the route table', () => {
    const routes = dashboardRoutes();
    expect(routes).toContain('/dashboard/settings');
    expect(routes).toContain('/dashboard/settings/delete-account');
    expect(routes.length).toBeGreaterThan(10);
  });

  it('offers seven primary destinations, in the order the story sets', () => {
    expect(PRIMARY_NAV.map((item) => item.label)).toEqual([
      'Overview',
      'Profile',
      'Links',
      'Listings',
      'Leads',
      'Analytics',
      'Settings',
    ]);
  });

  it('every destination is a route that exists', () => {
    const routes = new Set(dashboardRoutes());
    const missing = ALL_NAV_DESTINATIONS.filter((item) => !routes.has(item.href));
    expect(missing.map((item) => `${item.label} → ${item.href}`)).toEqual([]);
  });

  it('every dashboard route is reachable from a nav', () => {
    const linked = new Set(ALL_NAV_DESTINATIONS.map((item) => item.href));
    const orphans = dashboardRoutes().filter((route) => !linked.has(route));
    expect(orphans, 'these routes exist but nothing links to them').toEqual([]);
  });

  it('billing, team, API keys, workflows and theme are reachable from Settings', () => {
    const fromSettings = new Set(SETTINGS_TOOLS.map((item) => item.href));
    for (const href of [
      '/dashboard/subscription',
      '/dashboard/team',
      '/dashboard/api-keys',
      '/dashboard/workflows',
      '/dashboard/theme',
    ]) {
      expect(fromSettings.has(href), href).toBe(true);
    }
  });

  it('both navs render from this file rather than their own lists', () => {
    const sidebar = read('components/layout/DashboardLayout.tsx');
    const mobile = read('components/mobile/MobileNav.tsx');

    expect(sidebar).toContain("from '@/config/dashboard-nav'");
    expect(mobile).toContain('from "@/config/dashboard-nav"');
    // A hard-coded /dashboard/… link in either file is a list starting to drift
    // again. The sidebar's /admin entry is not a dashboard destination.
    expect(sidebar.match(/to="\/dashboard\/[^"]*"/g) ?? []).toEqual([]);
    expect(mobile.match(/href: "\/dashboard\/[^"]*"/g) ?? []).toEqual([]);
  });

  it('the Settings page links the tools', () => {
    expect(read('pages/dashboard/Settings.tsx')).toContain('SETTINGS_TOOLS');
  });
});
