/**
 * US-535: the dashboard route budget (scripts/check-dashboard-weight.mjs).
 *
 * The script runs in CI against a real build. What is tested here is the part
 * that could go wrong quietly: finding a route whose chunk Rollup re-keyed,
 * subtracting what the layout already loaded, and every dashboard route in
 * App.tsx actually having a budget.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  DASHBOARD_ROUTES,
  ROUTE_MUST_NOT_INCLUDE,
  entryKey,
  resolveKey,
  staticClosure,
  weighBeyond,
  bannedIn,
  type Manifest,
} from '../scripts/check-dashboard-weight.mjs';

const ROOT = join(__dirname, '..');

/** A trimmed copy of the shape Vite 7 writes, including the `_Leads-<hash>` case. */
const manifest: Manifest = {
  'index.html': {
    file: 'assets/index-e.js',
    isEntry: true,
    imports: ['_react-vendor-r.js'],
    dynamicImports: [
      'src/components/layout/DashboardLayout.tsx',
      'src/pages/dashboard/Overview.tsx',
      '_Leads-h1.js',
    ],
  },
  '_react-vendor-r.js': { file: 'assets/react-vendor-r.js', name: 'react-vendor' },
  '_ui-vendor-u.js': { file: 'assets/ui-vendor-u.js', name: 'ui-vendor' },
  '_date-vendor-d.js': { file: 'assets/date-vendor-d.js', name: 'date-vendor' },
  '_form-vendor-f.js': { file: 'assets/form-vendor-f.js', name: 'form-vendor' },
  'src/components/layout/DashboardLayout.tsx': {
    file: 'assets/DashboardLayout-l.js',
    src: 'src/components/layout/DashboardLayout.tsx',
    isDynamicEntry: true,
    imports: ['_react-vendor-r.js', '_ui-vendor-u.js'],
  },
  'src/pages/dashboard/Overview.tsx': {
    file: 'assets/Overview-o.js',
    src: 'src/pages/dashboard/Overview.tsx',
    isDynamicEntry: true,
    imports: ['_react-vendor-r.js', '_ui-vendor-u.js', '_date-vendor-d.js'],
  },
  // Rollup hoisted shared code into the route chunk: no `src`, `_`-prefixed key.
  '_Leads-h1.js': {
    file: 'assets/Leads-h1.js',
    name: 'Leads',
    isDynamicEntry: true,
    imports: ['_react-vendor-r.js', 'index.html'],
    dynamicImports: ['src/components/leads/LeadDetailModal.tsx'],
  },
  'src/components/leads/LeadDetailModal.tsx': {
    file: 'assets/LeadDetailModal-m.js',
    src: 'src/components/leads/LeadDetailModal.tsx',
    isDynamicEntry: true,
    imports: ['_Leads-h1.js', '_date-vendor-d.js', '_form-vendor-f.js'],
  },
};

const sizes: Record<string, number> = {
  'assets/index-e.js': 1000,
  'assets/react-vendor-r.js': 900,
  'assets/ui-vendor-u.js': 800,
  'assets/date-vendor-d.js': 60,
  'assets/form-vendor-f.js': 230,
  'assets/DashboardLayout-l.js': 100,
  'assets/Overview-o.js': 40,
  'assets/Leads-h1.js': 50,
  'assets/LeadDetailModal-m.js': 70,
};
const sizeOf = (file: string) => sizes[file];

describe('dashboard-weight manifest helpers (US-535)', () => {
  it('finds the entry', () => {
    expect(entryKey(manifest)).toBe('index.html');
    expect(() => entryKey({})).toThrow(/isEntry/);
  });

  it('resolves a route by its source path, or by name when Rollup re-keyed it', () => {
    expect(resolveKey(manifest, 'src/pages/dashboard/Overview.tsx')).toBe(
      'src/pages/dashboard/Overview.tsx'
    );
    expect(resolveKey(manifest, 'src/pages/dashboard/Leads.tsx')).toBe('_Leads-h1.js');
    expect(() => resolveKey(manifest, 'src/pages/dashboard/Missing.tsx')).toThrow(/Missing/);
  });

  it('refuses to guess between two re-keyed chunks with the same name', () => {
    const twoLeads: Manifest = {
      ...manifest,
      'index.html': {
        ...manifest['index.html'],
        dynamicImports: ['_Leads-h1.js', '_Leads-h2.js'],
      },
      '_Leads-h2.js': { file: 'assets/Leads-h2.js', name: 'Leads', isDynamicEntry: true },
    };
    expect(() => resolveKey(twoLeads, 'src/pages/dashboard/Leads.tsx')).toThrow(/2 dynamic chunks/);
  });

  it('follows static imports only, and survives a cycle back to the entry', () => {
    const closure = staticClosure(manifest, '_Leads-h1.js');
    expect([...closure].sort()).toEqual(['_Leads-h1.js', '_react-vendor-r.js', 'index.html']);
    // LeadDetailModal is a dynamic import of Leads, so it is not in the closure.
    expect(closure.has('src/components/leads/LeadDetailModal.tsx')).toBe(false);
  });

  it('weighs only what the layout and entry did not already load', () => {
    const base = ['index.html', 'src/components/layout/DashboardLayout.tsx'];
    const files = weighBeyond(manifest, 'src/pages/dashboard/Overview.tsx', base, sizeOf);
    // ui-vendor came with the layout, react-vendor with the entry.
    expect(files).toEqual([
      { file: 'assets/date-vendor-d.js', bytes: 60 },
      { file: 'assets/Overview-o.js', bytes: 40 },
    ]);
  });

  it('weighs a dialog beyond the route it opens from', () => {
    const base = ['index.html', 'src/components/layout/DashboardLayout.tsx', '_Leads-h1.js'];
    const files = weighBeyond(manifest, 'src/components/leads/LeadDetailModal.tsx', base, sizeOf);
    expect(files.map((f) => f.file)).toEqual([
      'assets/form-vendor-f.js',
      'assets/LeadDetailModal-m.js',
      'assets/date-vendor-d.js',
    ]);
  });

  it('flags a banned vendor chunk unless the route is allowed it', () => {
    const files = ['assets/Leads-h1.js', 'assets/form-vendor-f.js'];
    const banned = { 'form-vendor': { why: 'forms', allow: ['src/pages/dashboard/Profile.tsx'] } };
    expect(bannedIn(files, banned, 'src/pages/dashboard/Leads.tsx')).toEqual([
      { prefix: 'form-vendor', file: 'assets/form-vendor-f.js', why: 'forms' },
    ]);
    expect(bannedIn(files, banned, 'src/pages/dashboard/Profile.tsx')).toEqual([]);
  });
});

describe('dashboard-weight budgets cover the real routes (US-535)', () => {
  it('budgets every dashboard page App.tsx lazy-loads', () => {
    const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');
    const lazyPages = [...app.matchAll(/import\('\.\/(pages\/dashboard\/[^']+)'\)/g)].map(
      (m) => `src/${m[1]}.tsx`
    );
    expect(lazyPages.length).toBeGreaterThan(10);
    const budgeted = new Set(DASHBOARD_ROUTES.map((r) => r.src));
    expect(lazyPages.filter((src) => !budgeted.has(src))).toEqual([]);
  });

  it('names only source files that exist, with positive budgets', () => {
    for (const route of DASHBOARD_ROUTES) {
      expect(existsSync(join(ROOT, route.src)), route.src).toBe(true);
      expect(route.maxKb).toBeGreaterThan(0);
      for (const src of route.beyond ?? []) expect(existsSync(join(ROOT, src)), src).toBe(true);
    }
    expect(DASHBOARD_ROUTES.filter((r) => r.isLayout)).toHaveLength(1);
  });

  it('keeps form-vendor and charts-vendor off every dashboard route', () => {
    expect(ROUTE_MUST_NOT_INCLUDE['form-vendor'].allow).toEqual([]);
    expect(ROUTE_MUST_NOT_INCLUDE['charts-vendor'].allow).toEqual([]);
  });
});
