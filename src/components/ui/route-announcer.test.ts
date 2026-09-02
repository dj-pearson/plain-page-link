/**
 * US-120: the announcer named routes the app does not have.
 *
 * "/dashboard/lead-management" was removed by US-081 and
 * "/dashboard/analytics-advanced" was an orphan page nothing linked to, deleted
 * here — while /dashboard/subscription, /team and /api-keys, which do exist and
 * are in the sidebar, had no entry at all and were announced by the fallback.
 *
 * A screen-reader announcement naming a page that does not exist is a small
 * defect, but it is the kind nothing else catches: no type checks it, and it
 * renders fine.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

function announcedRoutes(): string[] {
  const source = readFileSync(join(SRC, 'components/ui/route-announcer.tsx'), 'utf8');
  const block = source.slice(
    source.indexOf('ROUTE_TITLES'),
    source.indexOf('function getPageTitle')
  );
  // Either quote style: prettier rewrites these files, and an assertion that
  // depends on the quote character silently stops matching anything — which is
  // exactly how this test first passed while finding nothing.
  return Array.from(block.matchAll(/['"](\/[^'"]*)['"]\s*:/g)).map((m) => m[1]);
}

function declaredRoutes(): string[] {
  const source = readFileSync(join(SRC, 'App.tsx'), 'utf8');
  const paths = Array.from(source.matchAll(/\bpath=['"]([^'"]*)['"]/g)).map((m) => m[1]);
  // Nested children are relative; join them onto the dashboard/admin prefixes
  // the file uses, which is enough to check membership.
  const absolute = paths.filter((p) => p.startsWith('/'));
  const relative = paths.filter((p) => !p.startsWith('/') && p !== '');
  return [...absolute, ...relative.flatMap((p) => [`/dashboard/${p}`, `/admin/${p}`])];
}

describe('route-announcer', () => {
  it('parses both files', () => {
    expect(announcedRoutes().length).toBeGreaterThan(20);
    expect(declaredRoutes()).toContain('/pricing');
  });

  it('announces only routes the app actually has', () => {
    const declared = new Set(declaredRoutes());
    const orphans = announcedRoutes().filter((route) => !declared.has(route));

    expect(orphans, 'these are announced but are not routes').toEqual([]);
  });
});
