/**
 * US-234: five SEO functions, apply-seo-fixes and trigger-rebuild ran for anyone.
 *
 * The SEO functions called requireAuth inside a try/catch that logged the
 * failure and carried on, then fetched the caller's URL with the service role
 * (SSRF) — optimize-page-content also spent LLM credit on it. trigger-rebuild
 * accepted any header that began with "Bearer ", the anon key included.
 *
 * These are Deno modules importing from esm.sh, which vitest cannot load, so
 * (like client-ip.test.ts) this reads the source. What it holds: the admin gate
 * is awaited at the top level of the handler before the body is read and
 * before anything is fetched, nothing swallows it, and every outbound fetch
 * that is not a fixed vendor URL goes through safeFetch.
 * scripts/smoke-edge-functions.mjs makes the matching runtime assertion
 * (anonymous POST -> 401/403) against the real router.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const source = (name: string) => readFileSync(join(root, name, 'index.ts'), 'utf8');

/** Each function, the gate it must use, and the bare fetch() calls it may keep. */
const GATED: Record<string, { gate: 'requireAdmin' | 'requireAdminOrServiceRole'; bareFetch: RegExp[] }> = {
  // run-scheduled-audit calls these two with the service-role key.
  'seo-audit': { gate: 'requireAdminOrServiceRole', bareFetch: [] },
  'analyze-content': { gate: 'requireAdminOrServiceRole', bareFetch: [] },
  'analyze-internal-links': { gate: 'requireAdmin', bareFetch: [] },
  'analyze-semantic-keywords': { gate: 'requireAdmin', bareFetch: [] },
  'optimize-page-content': {
    gate: 'requireAdmin',
    bareFetch: [/^fetch\('https:\/\/api\.openai\.com\//, /^fetch\('https:\/\/api\.anthropic\.com\//],
  },
  'apply-seo-fixes': { gate: 'requireAdmin', bareFetch: [] },
  // The deploy hook comes from the function's own environment, not the caller.
  'trigger-rebuild': { gate: 'requireAdmin', bareFetch: [/^fetch\(hookUrl,/] },
};

/** Offsets of `fetch(` not preceded by an identifier character (so not safeFetch). */
function bareFetches(src: string): string[] {
  const out: string[] = [];
  const re = /(?<![\w.])fetch\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push(src.slice(m.index, m.index + 60));
  return out;
}

describe('admin-only edge functions refuse anyone but an admin (US-234)', () => {
  for (const [name, { gate, bareFetch }] of Object.entries(GATED)) {
    describe(name, () => {
      const src = source(name);

      it(`imports ${gate} and no longer uses requireAuth`, () => {
        expect(src).toMatch(new RegExp(`import \\{ ${gate} \\} from '\\.\\./_shared/auth\\.ts'`));
        expect(src).not.toMatch(/\brequireAuth\(|import \{[^}]*\brequireAuth\b/);
      });

      it('awaits the gate outside any catch, before the body is read or anything fetched', () => {
        const call = src.indexOf(`await ${gate}(req, supabase)`);
        expect(call).toBeGreaterThan(-1);
        // Not swallowed: the old shape was `try { await requireAuth } catch (e) { console.error(...) }`.
        expect(src).not.toContain('Failed to authenticate user');
        const body = src.indexOf('await req.json()');
        if (body > -1) expect(call).toBeLessThan(body);
        const firstFetch = src.search(/(?<![\w.])(safeFetch|fetch)\((?!\s*\))/);
        if (firstFetch > -1) expect(call).toBeLessThan(firstFetch);
        // The only enclosing try is the handler's own, whose catch answers with
        // the HttpError's status (401/403), not a 200 or a 500.
        expect(src).toMatch(/handleUnexpectedError\(error, req\)|status: errorStatus\(error\)/);
      });

      it('fetches every caller-supplied URL through safeFetch', () => {
        const stray = bareFetches(src).filter((call) => !bareFetch.some((ok) => ok.test(call)));
        expect(stray).toEqual([]);
      });
    });
  }

  it('trigger-rebuild verifies an admin, not a "Bearer " prefix, and is rate-limited', () => {
    const src = source('trigger-rebuild');
    expect(src).not.toMatch(/startsWith\('bearer '\)/i);
    const gate = src.indexOf('await requireAdmin(req, supabase)');
    const limit = src.indexOf('await checkRateLimitDb(');
    const hook = src.indexOf('fetch(hookUrl');
    expect(gate).toBeGreaterThan(-1);
    expect(limit).toBeGreaterThan(gate);
    expect(hook).toBeGreaterThan(limit);
    expect(src).toMatch(/if \(!rate\.allowed\) \{\s*return rateLimitResponse\(/);
  });

  it('requireAdminOrServiceRole admits the service-role key and otherwise is requireAdmin', () => {
    const auth = readFileSync(join(__dirname, 'auth.ts'), 'utf8');
    const fn = auth.slice(auth.indexOf('export async function requireAdminOrServiceRole'));
    const bodyEnd = fn.indexOf('\n}');
    const body = fn.slice(0, bodyEnd);
    expect(body).toMatch(/if \(isServiceRoleRequest\(req\)\) return null;\s*return await requireAdmin\(req, supabase\);/);
  });
});
