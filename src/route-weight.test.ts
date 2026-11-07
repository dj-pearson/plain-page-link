/**
 * US-212: the route-weight budget reads its cache policy from public/_headers.
 *
 * That is the part worth testing. A weight measured without `immutable` on the
 * hashed assets is fiction, and quietly so — the first run of the throwaway
 * harness that found US-211 reported /pricing at 1914 KB purely because its own
 * server sent no Cache-Control, which is nearly the size of the real defect. A
 * matcher that silently stopped matching would put the budget back in that
 * state while still printing confident numbers.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHeaders, matches, headersFor } from '../scripts/check-route-weight.mjs';

const rules = await parseHeaders();

describe('route-weight header policy (US-212)', () => {
  it('parsed public/_headers at all', () => {
    expect(rules.length).toBeGreaterThan(3);
    expect(rules.map((r: { pattern: string }) => r.pattern)).toContain('/*');
  });

  it('matches the patterns Cloudflare Pages uses', () => {
    expect(matches('/*', '/anything/at/all')).toBe(true);
    expect(matches('/*.js', '/assets/index-abc123.js')).toBe(true);
    expect(matches('/*.js', '/assets/index-abc123.css')).toBe(false);
    expect(matches('/sw.js', '/sw.js')).toBe(true);
    expect(matches('/sw.js', '/assets/sw.js')).toBe(false);
  });

  it('gives hashed assets an immutable year, and documents none of it', () => {
    // The measurement depends on exactly this: without it the browser refetches
    // chunks a real visitor would have cached, and the budget measures the
    // harness rather than the site.
    expect(headersFor(rules, '/assets/index-abc123.js')['Cache-Control']).toMatch(/immutable/);
    expect(headersFor(rules, '/assets/index-abc123.css')['Cache-Control']).toMatch(/immutable/);
    expect(headersFor(rules, '/')['Cache-Control']).toMatch(/max-age=0/);
  });

  it('resolves the deployed file to one clean policy per path (US-381)', () => {
    expect(headersFor(rules, '/assets/x.js')['Cache-Control']).toBe(
      'public, max-age=31536000, immutable'
    );
    expect(headersFor(rules, '/index.html')['Cache-Control']).toBe(
      'public, max-age=0, must-revalidate'
    );
    // The security headers from /* still apply to an asset.
    expect(headersFor(rules, '/assets/x.js')['X-Content-Type-Options']).toBe('nosniff');
  });

  describe('Cloudflare Pages semantics (US-381)', () => {
    // developers.cloudflare.com/pages/configuration/headers, and workers-sdk
    // pages-shared/asset-server/handler.ts: every matching rule applies in file
    // order, a repeated header is appended, and `! Name` detaches.
    it('joins a header two matching rules both set, rather than letting the later win', async () => {
      const joined = await parseHeaders(
        '/*\n  Cache-Control: max-age=0\n\n/*.js\n  Cache-Control: max-age=31536000\n'
      );
      expect(headersFor(joined, '/a.js')['Cache-Control']).toBe('max-age=0, max-age=31536000');
      expect(headersFor(joined, '/a.css')['Cache-Control']).toBe('max-age=0');
    });

    it('lets a later rule replace a header only by detaching it first', async () => {
      const detached = await parseHeaders(
        '/*\n  Cache-Control: max-age=0\n  X-A: 1\n\n/assets/*\n  ! Cache-Control\n  Cache-Control: immutable\n'
      );
      expect(headersFor(detached, '/assets/a.js')).toEqual({
        'Cache-Control': 'immutable',
        'X-A': '1',
      });
      expect(headersFor(detached, '/other.js')['Cache-Control']).toBe('max-age=0');
    });

    it('matches a :placeholder to exactly one path segment', () => {
      expect(matches('/:username/review', '/jane/review')).toBe(true);
      expect(matches('/:username/review', '/a/b/review')).toBe(false);
    });
  });

  it('is wired into CI', () => {
    // A budget nobody runs is a file. US-205 is the whole story of that.
    const workflow = join(process.cwd(), '.github/workflows/ci.yml');
    expect(readFileSync(workflow, 'utf-8')).toContain('npm run route-weight');
  });
});
