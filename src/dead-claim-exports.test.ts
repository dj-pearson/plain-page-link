/**
 * Marketing-claim modules may not carry dead exports (US-369, US-577).
 *
 * The claims tests (features-claims, landing-claims, marketing-claims,
 * comparison-claims) read the copy that pages render. An export nobody imports
 * is copy nobody renders, so nothing reads it either, and it drifts: src/lib/
 * geo.ts went on saying "Paid plans start at $39/month with unlimited
 * listings" for months after every rendered page stopped, seo.config.ts kept an
 * AgentBio "rating: '4.8'" with no reviews behind it, and faq-schema.ts kept
 * three unrendered FAQ sets. One import would have published any of them as
 * JSON-LD. This test holds each module to exports that something actually
 * uses, outside tests: another file, or another export of the same module. A
 * dead claim is then deleted rather than left for someone to revive.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { COMPETITORS_VERIFIED_LABEL, COMPETITORS_VERIFIED_ON } from '@/config/competitors';

const ROOT = join(__dirname, '..');

/** Modules whose exports are marketing or plan claims, or render them. */
const CLAIM_MODULES = [
  'src/config/seo.config.ts',
  'src/lib/faq-schema.ts',
  'src/config/competitors.ts',
  'src/config/marketing-claims.ts',
  'src/lib/planCardCopy.ts',
];

/** Deleted claim modules that must stay deleted. */
const DELETED = ['src/lib/geo.ts'];

const SEARCH_DIRS = ['src', 'functions', 'scripts'];
const SOURCE = /\.(ts|tsx|mts|mjs|js)$/;
const TEST = /\.test\.(ts|tsx|mts|mjs|js)$|\/test\//;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE.test(name)) out.push(full);
  }
  return out;
}

const sources = SEARCH_DIRS.flatMap((d) => walk(join(ROOT, d)))
  .map((full) => ({ path: relative(ROOT, full).replace(/\\/g, '/'), full }))
  .filter(({ path }) => !TEST.test(path))
  .map(({ path, full }) => ({ path, text: readFileSync(full, 'utf8') }));

/** Value exports: `export const|let|function|class NAME`. */
function valueExports(text: string): string[] {
  return [
    ...text.matchAll(/^export\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm),
  ].map((m) => m[1]);
}

function wordRe(name: string, flags = ''): RegExp {
  return new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, flags);
}

function usedOutside(name: string, self: string): boolean {
  const word = wordRe(name);
  return sources.some(({ path, text }) => path !== self && word.test(text));
}

const stripComments = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/**
 * Used by another export of the same module (so it reaches a page through
 * that one). A mention in a comment does not count.
 */
function usedInside(name: string, text: string): boolean {
  return (stripComments(text).match(wordRe(name, 'g')) ?? []).length > 1;
}

describe('marketing-claim modules carry no dead exports', () => {
  for (const file of CLAIM_MODULES) {
    it(`every value export of ${file} is used outside it`, () => {
      const text = readFileSync(join(ROOT, file), 'utf8');
      const exports = valueExports(text);
      expect(exports.length).toBeGreaterThan(0);
      const dead = exports.filter((name) => !usedOutside(name, file) && !usedInside(name, text));
      expect(dead, `delete these, or render them and bring them under a claims test`).toEqual([]);
    });
  }

  it('every FEATURE_FAQS set is rendered by a page', () => {
    const text = readFileSync(join(ROOT, 'src/lib/faq-schema.ts'), 'utf8');
    const body = text.slice(text.indexOf('export const FEATURE_FAQS'));
    const keys = [...body.matchAll(/^ {2}([A-Za-z]\w*): \[/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    const unrendered = keys.filter(
      (key) =>
        !sources.some(
          ({ path, text: src }) =>
            path.startsWith('src/pages/') && src.includes(`FEATURE_FAQS.${key}`)
        )
    );
    expect(unrendered).toEqual([]);
  });

  for (const file of DELETED) {
    it(`${file} stays deleted`, () => {
      expect(existsSync(join(ROOT, file))).toBe(false);
    });
  }

  it('the comparison pages show the date in COMPETITORS_VERIFIED_ON', () => {
    const [y, m, d] = COMPETITORS_VERIFIED_ON.split('-').map(Number);
    const month = new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-GB', {
      month: 'long',
      timeZone: 'UTC',
    });
    expect(COMPETITORS_VERIFIED_LABEL).toBe(`${d} ${month} ${y}`);
    expect(COMPETITORS_VERIFIED_ON).toBe('2026-09-08');
    expect(COMPETITORS_VERIFIED_LABEL).toBe('8 September 2026');
  });

  it('detects an unused export', () => {
    expect(valueExports('export const A = 1;\nexport function b() {}\nconst c = 2;')).toEqual([
      'A',
      'b',
    ]);
    expect(usedOutside('NO_SUCH_EXPORT_ANYWHERE_US577', 'src/x.ts')).toBe(false);
    expect(usedOutside('PRICING_PLANS', 'src/config/pricing-plans.ts')).toBe(true);
    expect(usedInside('A', 'export const A = 1;\nexport const B = A + 1;')).toBe(true);
    expect(usedInside('A', 'export const A = 1;\n/** see {@link A} */\n// A again')).toBe(false);
  });
});
