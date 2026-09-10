/**
 * Every route the app defines must be served by something (US-176).
 *
 * public/_redirects used to end in `/* /index.html 200`, so this was never a
 * question: everything answered 200 with the homepage, including URLs that did
 * not exist. Removing that catch-all is what lets Cloudflare Pages return a
 * real 404 from dist/404.html — and it means a route in App.tsx that is neither
 * prerendered to a file nor listed in _redirects is now a broken page rather
 * than a working one.
 *
 * Cloudflare Pages routing cannot be exercised here, so this test is the thing
 * standing in for a deploy. It reads App.tsx and _redirects and asserts they
 * agree, in both directions: no route without a way to serve it, and no rule
 * for a route that does not exist.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, locationRoutes } from './config/prerender-routes';

const ROOT = join(__dirname, '..');

/** Every `path` React Router is given, including the nested dashboard children. */
function appRoutes(): string[] {
  const source = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
  const paths = new Set<string>();
  for (const match of source.matchAll(/<Route\b[^>]*?\bpath=\s*["']([^"']+)["']/gs)) {
    paths.add(match[1]);
  }
  // Multi-line <Route> elements put path= on its own line.
  for (const match of source.matchAll(/^\s*path=\s*["']([^"']+)["']/gm)) {
    paths.add(match[1]);
  }
  return [...paths];
}

/** Rule sources from _redirects, ignoring comments and blank lines. */
function redirectRules(): { from: string; to: string; status: string }[] {
  return readFileSync(join(ROOT, 'public', '_redirects'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from, to, status };
    });
}

/** Whether a rule source matches a concrete path, using Pages' own semantics. */
function ruleMatches(from: string, path: string): boolean {
  if (from === path) return true;
  if (from.endsWith('/*')) {
    const prefix = from.slice(0, -2);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  if (from === '/*') return true;
  // `/:name` matches exactly one segment; `/:name/review` one segment plus a
  // literal. Turn the placeholder into a single-segment matcher.
  if (from.includes('/:')) {
    const pattern = new RegExp(
      `^${from.replace(/\/:([A-Za-z0-9_]+)/g, '/[^/]+').replace(/[.]/g, '\\.')}$`
    );
    return pattern.test(path);
  }
  return false;
}

/** A concrete URL that exercises a route pattern. */
function sample(routePath: string): string {
  return routePath.replace(/:[A-Za-z0-9_]+/g, 'sample');
}

const PRERENDERED = new Set([
  ...STATIC_ROUTES.map((r) => r.path),
  ...locationRoutes().map((r) => r.path),
]);

/**
 * Route patterns whose concrete URLs are prerendered per row rather than as a
 * fixed list, so PRERENDERED cannot name them.
 *
 * A real /blog/{slug} is written to a file by the prerender; a made-up one is
 * meant to 404, which is the point of removing the catch-all.
 */
const PRERENDERED_PER_ROW = ['/blog/:slug', '/blog/category/:category', '/for/:slug'];

describe('every route the app defines', () => {
  const routes = appRoutes().filter(
    (p) =>
      p.startsWith('/') &&
      p !== '*' &&
      // Nested dashboard children are relative and covered by /dashboard/*.
      !PRERENDERED_PER_ROW.includes(p)
  );
  const rules = redirectRules();

  it('finds the routes at all', () => {
    // If the parse breaks, everything below passes vacuously.
    expect(routes.length).toBeGreaterThan(30);
    expect(routes).toContain('/pricing');
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/:slug');
  });

  it('is either prerendered to a file or covered by a rule', () => {
    const stranded = routes.filter((route) => {
      if (PRERENDERED.has(route)) return false;
      const url = sample(route);
      return !rules.some((rule) => rule.status === '200' && ruleMatches(rule.from, url));
    });

    expect(
      stranded,
      'these routes are in App.tsx, are not prerendered, and no _redirects rule ' +
        'serves them. Without the old /* catch-all they now return 404. Add a ' +
        'rule, or prerender them.'
    ).toEqual([]);
  });
});

describe('the redirect rules', () => {
  const rules = redirectRules();

  it('no longer contain the catch-all that made every URL a 200', () => {
    expect(rules.some((rule) => rule.from === '/*')).toBe(false);
  });

  it('do not shadow a path the build prerenders', () => {
    const overlapping = rules.filter((rule) => PRERENDERED.has(rule.from));
    expect(overlapping.map((r) => r.from)).toEqual([]);
  });

  it('serve nothing that App.tsx does not route', () => {
    const routes = appRoutes();
    const unroutable = rules
      .filter((rule) => rule.status === '200')
      .filter((rule) => !routes.some((route) => ruleMatches(rule.from, sample(route))));

    expect(
      unroutable.map((r) => r.from),
      'a 200 rewrite for a path with no route behind it recreates the soft 404 ' +
        'this story removed'
    ).toEqual([]);
  });
});

describe('the 404 document', () => {
  it('is a route App.tsx serves, so the prerender can write it', () => {
    expect(appRoutes()).toContain('/404');
  });

  it('is registered for prerendering and kept out of the sitemap', () => {
    const route = STATIC_ROUTES.find((r) => r.path === '/404');
    expect(route, '/404 must be prerendered — Pages needs dist/404.html').toBeDefined();
    expect(route?.sitemap).toBe(false);
  });

  it('is not reachable through a redirect rule, which would make it a 200', () => {
    expect(redirectRules().some((rule) => rule.to === '/404.html')).toBe(false);
  });
});

describe('the built output', () => {
  const dist = join(ROOT, 'dist', '404.html');

  it.skipIf(!existsSync(dist))('has 404.html at the root, not only /404/index.html', () => {
    const html = readFileSync(dist, 'utf8');
    expect(html).toContain('Page not found');
    expect(html).toMatch(/<meta[^>]*name="robots"[^>]*noindex/i);
  });
});
