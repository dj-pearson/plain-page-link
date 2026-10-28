/**
 * The app's private routes are noindex, and robots.txt lets crawlers see that
 * (US-242).
 *
 * _redirects answers /dashboard/*, /admin/*, /onboarding/* and /team/* with
 * index.html under a 200, and dist/index.html is the prerendered homepage — so
 * each of those URLs was another copy of the homepage. The header fixes that
 * only if robots.txt does not Disallow the path: a crawler that may not fetch
 * a URL never reads its headers, and indexes it from links anyway.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(__dirname, '..', '..', 'public');

/** _headers as { path: [header lines] }, in file order. */
function headerRules(): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of readFileSync(join(PUBLIC, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\S/.test(line)) {
      current = rules.get(line.trim()) ?? [];
      rules.set(line.trim(), current);
    } else {
      current?.push(line.trim());
    }
  }
  return rules;
}

const PRIVATE_PATHS = [
  '/dashboard',
  '/dashboard/*',
  '/admin',
  '/admin/*',
  '/onboarding/*',
  '/team/*',
];

describe('crawl directives for the signed-in app', () => {
  const rules = headerRules();

  it.each(PRIVATE_PATHS)('%s carries X-Robots-Tag: noindex', (path) => {
    const robots = (rules.get(path) ?? []).find((h) => h.startsWith('X-Robots-Tag:'));
    expect(robots).toMatch(/noindex/);
  });

  it('does not use a prefix splat that would also catch a username', () => {
    expect(rules.has('/dashboard*')).toBe(false);
    expect(rules.has('/admin*')).toBe(false);
  });

  it('robots.txt does not hide those headers behind a Disallow', () => {
    const disallowed = readFileSync(join(PUBLIC, 'robots.txt'), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^disallow:/i.test(l))
      .map((l) => l.slice('disallow:'.length).trim())
      .filter((p) => p !== '/'); // the per-bot blanket blocks for training crawlers
    for (const path of ['/dashboard', '/admin', '/onboarding/', '/team/', '/auth/']) {
      for (const prefix of disallowed) {
        expect(path.startsWith(prefix) || prefix.startsWith(path), `${prefix} hides ${path}`).toBe(
          false
        );
      }
    }
  });
});
