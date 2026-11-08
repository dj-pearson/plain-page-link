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
  // US-248: took the webhook URL from the body, fetched it bare, and spent
  // Claude credit for any caller. The webhook is now looked up by id.
  'generate-marketing-post': {
    gate: 'requireAdmin',
    bareFetch: [/^fetch\('https:\/\/api\.anthropic\.com\//],
  },
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

  it('generate-marketing-post rate-limits per admin, takes no URL from the body, and never echoes the upstream body', () => {
    const src = source('generate-marketing-post');
    const gate = src.indexOf('await requireAdmin(req, supabase)');
    const limit = src.indexOf('await checkRateLimitDb(');
    const claude = src.indexOf("fetch('https://api.anthropic.com/");
    expect(limit).toBeGreaterThan(gate);
    expect(claude).toBeGreaterThan(limit);
    expect(src).toMatch(/`generate-marketing-post:\$\{admin\.id\}`/);
    expect(src).not.toMatch(/\bwebhookUrl\b/);
    expect(src).toMatch(/\.from\('social_media_webhooks'\)/);
    expect(src).not.toMatch(/\.text\(\)/);
  });

  it('requireAdminOrServiceRole admits the service-role key and otherwise is requireAdmin', () => {
    const auth = readFileSync(join(__dirname, 'auth.ts'), 'utf8');
    const fn = auth.slice(auth.indexOf('export async function requireAdminOrServiceRole'));
    const bodyEnd = fn.indexOf('\n}');
    const body = fn.slice(0, bodyEnd);
    expect(body).toMatch(/if \(isServiceRoleRequest\(req\)\) return null;\s*return await requireAdmin\(req, supabase\);/);
  });
});

// run-scheduled-audit also calls these with the service-role key. US-078 gated
// them with plain requireAdmin, so every scheduled run got a 401 from them.
describe('functions run-scheduled-audit calls admit the service role', () => {
  for (const name of ['check-core-web-vitals', 'check-broken-links', 'check-security-headers', 'analyze-images']) {
    it(name, () => {
      expect(source(name)).toMatch(/await requireAdminOrServiceRole\(req, supabase\)/);
      expect(source(name)).not.toMatch(/await requireAdmin\(req, supabase\)/);
    });
  }
});

// US-614: two functions that act as the company accepted any signed-in account.
// generate-article inserts a 'published' row on the company blog (and steers
// the model with the caller's `customInstructions`); google-indexing submits
// URLs, URL_DELETED included, under the company's Google service account.
// Their helpers hold bare fetch() calls above the handler, so the generic
// source-order check above does not fit; this one measures from the handler.
describe('functions that publish as the company refuse non-admin accounts (US-614)', () => {
  const CASES = [
    {
      name: 'generate-article',
      gate: 'requireAdminOrServiceRole',
      handler: 'export default async (req: Request) =>',
      bodyRead: 'await req.text()',
      work: ["from('content_suggestions')", 'aiResponse = await fetchWithTimeout(', ".from('articles')"],
    },
    {
      name: 'google-indexing',
      gate: 'requireAdmin',
      handler: 'Deno.serve(async (req) =>',
      bodyRead: 'await req.json()',
      work: ['await getAccessToken(credentials)', 'submitUrl(url, action, accessToken)'],
    },
  ] as const;

  for (const { name, gate, handler, bodyRead, work } of CASES) {
    describe(name, () => {
      const src = source(name);
      const start = src.indexOf(handler);
      const call = src.indexOf(`await ${gate}(req, supabase)`);

      it(`imports ${gate} and no weaker check`, () => {
        expect(src).toMatch(new RegExp(`import \\{ ${gate} \\} from '\\.\\./_shared/auth\\.ts'`));
        expect(src).not.toMatch(/\brequireAuth\b|\bgetAuthenticatedUser\b|\bisServiceRoleRequest\b/);
      });

      it('awaits the gate in the handler before the body is read and before any work', () => {
        expect(start).toBeGreaterThan(-1);
        expect(call).toBeGreaterThan(start);
        expect(call).toBeLessThan(src.indexOf(bodyRead));
        for (const marker of work) {
          const at = src.indexOf(marker, start);
          expect(at, marker).toBeGreaterThan(-1);
          expect(call, marker).toBeLessThan(at);
        }
        // Not swallowed: the handler's catch answers with the HttpError's status.
        expect(src).toMatch(/return handleUnexpectedError\(error, req\);|return handleError\(error, req\);/);
      });
    });
  }

  it('google-indexing checks the role with a client that can read user_roles', () => {
    const src = source('google-indexing');
    const client = src.slice(src.indexOf('const supabase = createClient('), src.indexOf('await requireAdmin('));
    expect(client).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(client).not.toContain('SUPABASE_ANON_KEY');
  });

  it('generate-article checks the Claude key only after the gate', () => {
    const src = source('generate-article');
    expect(src.indexOf('if (!CLAUDE_API_KEY)')).toBeGreaterThan(
      src.indexOf('await requireAdminOrServiceRole(req, supabase)')
    );
  });
});
