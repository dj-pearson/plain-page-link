/**
 * Every internal link must resolve to a route (US-118).
 *
 * The pricing page's Free CTA linked /register, which does not exist — it fell
 * through to /:slug and rendered "profile not found" to someone who had just
 * decided to sign up. VsLater linked /get-started and /demo, neither routed.
 * Nothing catches a link like that: it type-checks, it renders, and it only
 * fails when a person clicks it.
 *
 * This reads App.tsx's route table and every literal `to=` / `href=` in src/,
 * so it fails on the next one too rather than only on the three that were
 * found by hand.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

/**
 * Full route paths declared in App.tsx, including nested children.
 *
 * A line-based scan is not enough: several routes are written across multiple
 * lines, with `path=` and the closing `>` on lines of their own, and the
 * `element={…}` expression contains `>` characters of its own. So this walks
 * the source, finds the end of each opening tag by tracking brace depth, and
 * keeps a stack of the containers that are still open.
 */
function collectRoutes(): string[] {
  const source = readFileSync(join(SRC, 'App.tsx'), 'utf8');
  const routes: string[] = [];
  const stack: string[] = [];

  let i = 0;
  while (i < source.length) {
    const nextOpen = source.indexOf('<Route', i);
    const nextClose = source.indexOf('</Route>', i);

    if (nextOpen === -1 && nextClose === -1) break;

    if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
      stack.pop();
      i = nextClose + '</Route>'.length;
      continue;
    }

    // Find the end of this opening tag: the first '>' at brace depth 0.
    let j = nextOpen + '<Route'.length;
    let depth = 0;
    let tagEnd = -1;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) {
        tagEnd = j;
        break;
      }
      j++;
    }
    if (tagEnd === -1) break;

    const tag = source.slice(nextOpen, tagEnd + 1);
    const selfClosing = /\/\s*>$/.test(tag);
    const pathMatch = tag.match(/\bpath="([^"]*)"/);
    const isIndex = /\bindex\b/.test(tag) && !pathMatch;

    const parent = stack.length ? stack[stack.length - 1] : '';

    if (pathMatch) {
      const raw = pathMatch[1];
      const full = raw.startsWith('/')
        ? raw
        : `${parent.replace(/\/$/, '')}/${raw}`.replace(/\/+/g, '/');
      routes.push(full);
      if (!selfClosing) stack.push(full);
    } else {
      // An index route resolves to its parent's own path.
      if (isIndex && parent) routes.push(parent);
      if (!selfClosing) stack.push(parent);
    }

    i = tagEnd + 1;
  }

  return routes;
}

/** Turns a route path into a matcher, honouring :params and splats. */
function routeMatcher(route: string): RegExp {
  const pattern = route
    .split('/')
    .map((segment) => {
      if (segment === '*') return '.*';
      if (segment.startsWith(':')) return '[^/]+';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return new RegExp(`^${pattern}/?$`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'test' || entry === '__tests__') continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

interface FoundLink {
  file: string;
  target: string;
}

/**
 * Internal link targets written as literals.
 *
 * Template literals are skipped on purpose: `/${profile.username}` cannot be
 * resolved statically, and guessing at it would produce false failures.
 */
function collectLinks(): FoundLink[] {
  const found: FoundLink[] = [];

  for (const file of walk(SRC)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\b(?:to|href)="(\/[^"]*)"/g)) {
      const target = match[1];
      // Anchors and query strings do not change which route answers.
      const path = target.split('#')[0].split('?')[0];
      if (!path || path === '/') continue;
      // Protocol-relative URLs are external.
      if (path.startsWith('//')) continue;
      found.push({ file: file.replace(`${SRC}/`, ''), target: path });
    }
  }

  return found;
}

describe('internal links resolve to routes', () => {
  const routes = collectRoutes();

  it('finds the route table', () => {
    // A parsing failure would make every assertion below vacuous.
    expect(routes.length).toBeGreaterThan(40);
    expect(routes).toContain('/pricing');
    expect(routes).toContain('/auth/register');
    expect(routes).toContain('/dashboard/settings');
  });

  it('finds links to check', () => {
    expect(collectLinks().length).toBeGreaterThan(20);
  });

  it('has no link pointing at a route that does not exist', () => {
    const links = collectLinks();

    // Two routes have to be excluded or nothing can ever fail here.
    //
    // /:slug is the public profile catch-all and matches ANY single segment,
    // which is exactly how /register reached "profile not found" instead of a
    // 404. /* is the NotFound route and matches everything. A link that only
    // these two answer is a broken link.
    const CATCH_ALLS = new Set(['/:slug', '/*', '*']);
    const realMatchers = routes.filter((route) => !CATCH_ALLS.has(route)).map(routeMatcher);

    const broken = links.filter(({ target }) => !realMatchers.some((re) => re.test(target)));

    expect(
      broken.map(({ file, target }) => `${target}  (${file})`),
      'these links do not resolve to any route in App.tsx'
    ).toEqual([]);
  });
});
