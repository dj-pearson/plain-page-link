/**
 * The SEO layer must not read the host the visitor is on (US-172).
 *
 * The unit test next door proves getCanonicalUrl() is host-independent. This
 * one proves nothing routes around it, because the original defect was not a
 * broken helper — it was thirty call sites that never used one. A grep is a
 * blunt instrument and it is the right one here: the property being asserted is
 * "this identifier does not appear in these files".
 *
 * The exceptions are listed with the reason each is allowed, so that adding one
 * is a decision somebody writes down rather than a line somebody types.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');

/** Files whose whole job is emitting tags and schema a crawler reads. */
const SEO_LAYER = [
  'src/components/SEOHead.tsx',
  'src/components/Breadcrumbs.tsx',
  'src/components/blog/ArticleSEO.tsx',
  'src/components/blog/BlogListSEO.tsx',
  'src/components/blog/Breadcrumbs.tsx',
  'src/components/seo',
  'src/config/seo.config.ts',
  'src/pages/Blog.tsx',
  'src/pages/BlogArticle.tsx',
  'src/pages/BlogCategory.tsx',
  'src/pages/features',
  'src/pages/landing',
  'src/pages/public/Landing.tsx',
  'src/pages/tools',
];

/**
 * Deliberately NOT in the list above: src/pages/Pricing.tsx. Its canonical goes
 * through getCanonicalUrl() like everything else, but it also builds Stripe's
 * successUrl and cancelUrl, which must send the user back to the host they were
 * actually on. Listing it would mean granting it a blanket exception below, and
 * a blanket exception on a page with a canonical is worse than no coverage:
 * it reads as checked.
 */

/**
 * Where the visitor's host is the right answer.
 *
 * A tenant's page-builder page and public profile may be served from that
 * agent's own custom_domain, and there a self-referencing canonical on the
 * visitor's host is correct rather than wrong.
 */
const ALLOWED = new Map([
  ['src/lib/seo.ts', 'the /p/{slug} builders: a tenant page can live on a custom domain'],
  ['src/lib/utils.ts', 'defines getSafeOrigin itself'],
  ['src/pages/public/FullProfilePage.tsx', 'a profile can live on a custom domain'],
]);

function walk(target: string, files: string[] = []): string[] {
  const full = join(ROOT, target);
  if (!statSync(full).isDirectory()) {
    files.push(target);
    return files;
  }
  for (const entry of readdirSync(full)) {
    walk(join(target, entry), files);
  }
  return files;
}

describe('the SEO layer', () => {
  const files = SEO_LAYER.flatMap((target) => walk(target)).filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.endsWith('.test.ts') &&
      !f.endsWith('.test.tsx')
  );

  it('covers a meaningful number of files', () => {
    // Guards against a refactor silently emptying the list and the suite
    // continuing to pass while checking nothing.
    expect(files.length).toBeGreaterThan(20);
  });

  it('never builds a URL from window.location.origin', () => {
    const offenders = files.filter((file) => {
      if (ALLOWED.has(file)) return false;
      const source = readFileSync(join(ROOT, file), 'utf8');
      // Only real uses, not the comments explaining why they are gone.
      return /(?<!\/\/[^\n]{0,200})\bwindow\.location\.origin\b/.test(
        source
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      );
    });

    expect(offenders, 'use getCanonicalUrl() from @/config/seo.config instead').toEqual([]);
  });

  it('never calls getSafeOrigin, which is the same thing one level down', () => {
    const offenders = files.filter((file) => {
      if (ALLOWED.has(file)) return false;
      const source = readFileSync(join(ROOT, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      return /\bgetSafeOrigin\s*\(/.test(source);
    });

    expect(offenders, 'use getBaseUrl() from @/config/seo.config instead').toEqual([]);
  });
});

describe('the exception list', () => {
  it('names files that exist', () => {
    for (const file of ALLOWED.keys()) {
      expect(() => statSync(join(ROOT, file)), `${file} is listed but missing`).not.toThrow();
    }
  });

  it('is only for files that actually need the visitor host', () => {
    for (const [file, reason] of ALLOWED) {
      const source = readFileSync(join(ROOT, file), 'utf8');
      expect(
        /window\.location\.origin|getSafeOrigin/.test(source),
        `${file} no longer needs its exception (${reason})`
      ).toBe(true);
    }
  });
});
