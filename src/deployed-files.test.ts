/**
 * Everything under public/ is deployed. Nothing else should be there (US-183).
 *
 * Vite copies public/ into dist/ verbatim, so a file put there for a developer
 * is a file published at the site's origin. Two were:
 *
 *     https://agentbio.net/icons/generate-icons.sh
 *     https://agentbio.net/icons/README.md
 *
 * The shell script is a build tool. The README opens "This directory should
 * contain the following PWA icon files" — a document telling anyone who found
 * it that the site's icons might be missing. Neither is harmful in content;
 * both are fetchable, crawlable and not part of the site. It is the same shape
 * as US-160, which found 17 MB of source maps being deployed for a reason that
 * had stopped being true.
 *
 * The rule: a file in public/ is either something a browser requests as part of
 * the site, or it does not belong there.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');

/** Extensions a browser fetches as part of this site. */
const SERVED = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.txt',
  '.xml',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.avif',
  '.webmanifest',
]);

/** Files with no extension that Cloudflare Pages reads rather than serves. */
const PAGES_CONTROL_FILES = new Set(['_headers', '_redirects', '_routes.json']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(relative(PUBLIC, full).split(sep).join('/'));
  }
  return out;
}

describe('public/', () => {
  const files = walk(PUBLIC);

  it('is not empty, so the rest of this suite means something', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain('robots.txt');
    expect(files).toContain('llms.txt');
  });

  it('holds nothing a browser would not request', () => {
    const strays = files.filter((file) => {
      const name = file.split('/').pop() ?? '';
      if (PAGES_CONTROL_FILES.has(name)) return false;
      const dot = name.lastIndexOf('.');
      const extension = dot === -1 ? '' : name.slice(dot).toLowerCase();
      return !SERVED.has(extension);
    });

    expect(
      strays,
      'everything in public/ is copied into dist/ and deployed. A build script ' +
        'or a note to developers put here is published at the site origin. Move ' +
        'it to scripts/ or docs/.'
    ).toEqual([]);
  });

  it('holds no README, which is a document about the site rather than part of it', () => {
    expect(files.filter((f) => /readme/i.test(f))).toEqual([]);
  });
});

describe('_headers', () => {
  const source = readFileSync(join(PUBLIC, '_headers'), 'utf8');
  const rules = source
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('/'))
    .map((line) => line.trim());

  const deployed = walk(PUBLIC);
  /** Extensions the build itself emits, beyond what sits in public/. */
  const BUILT = new Set(['.js', '.html', '.css']);

  it('sets a cache policy for everything, as a floor', () => {
    expect(rules[0], 'the first rule should be the catch-all').toBe('/*');
    const firstBlock = source.slice(source.indexOf('\n/*\n'), source.indexOf('/auth/*'));
    expect(firstBlock).toMatch(/Cache-Control:/);
  });

  it('does not let the immutable rule reach a service worker', () => {
    const swIndex = rules.indexOf('/sw.js');
    const jsIndex = rules.indexOf('/*.js');
    expect(swIndex, '/sw.js needs its own rule').toBeGreaterThan(-1);
    expect(
      swIndex,
      'a later rule wins for a repeated header, so /sw.js must come after /*.js'
    ).toBeGreaterThan(jsIndex);
  });

  it('never declares source code to be executable script', () => {
    // The narrow property, rather than "every rule matches something today".
    // A rule for /*.jpg that nothing currently matches costs nothing and is
    // right the day an image lands. A rule declaring /*.ts to be
    // application/javascript is wrong whether or not anything matches it, and
    // both /*.ts and /*.tsx were in this file.
    const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.jsx', '.map', '.env', '.md', '.sh', '.py'];
    const declared = rules.filter((rule) => rule.startsWith('/*.')).map((r) => r.slice(2));

    const offenders = declared.filter((extension) =>
      SOURCE_EXTENSIONS.includes(extension.toLowerCase())
    );
    expect(offenders, 'source files are not assets and must not be typed as script').toEqual([]);
  });

  it('covers every asset type the build actually emits', () => {
    const present = new Set([
      ...deployed.map((f) => {
        const dot = f.lastIndexOf('.');
        return dot === -1 ? '' : f.slice(dot).toLowerCase();
      }),
      ...BUILT,
    ]);
    // Types that benefit from an explicit long cache. .txt, .xml and .json are
    // deliberately left on the /* floor: robots.txt, sitemap.xml and
    // manifest.json all change without their URLs changing.
    const wantsLongCache = ['.png', '.webp', '.svg', '.js', '.css'].filter((e) => present.has(e));
    const declared = new Set(
      rules.filter((rule) => rule.startsWith('/*.')).map((r) => r.slice(2).toLowerCase())
    );
    const uncovered = wantsLongCache.filter((extension) => !declared.has(extension));
    expect(uncovered, 'these ship on every page and revalidate on every visit').toEqual([]);
  });
});

/**
 * US-221: the production CSP allowed neither Calendly's script nor its iframe,
 * so "Schedule a Showing" opened an empty box for every agent with Calendly
 * connected, and video blocks rendered blank. The policy is set twice — the
 * _headers response header and the index.html meta tag — and a browser
 * enforces both, so both must allow what the profile embeds.
 */
describe('Content-Security-Policy allows what the public profile embeds', () => {
  const directives = (policy: string) =>
    Object.fromEntries(
      policy
        .split(';')
        .map((d) => d.trim().split(/\s+/))
        .filter((parts) => parts[0])
        .map(([name, ...sources]) => [name, sources])
    ) as Record<string, string[]>;

  const headerPolicy = (() => {
    const line = readFileSync(join(PUBLIC, '_headers'), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('Content-Security-Policy:'));
    return directives(line?.split('Content-Security-Policy:')[1] ?? '');
  })();
  const metaPolicy = (() => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const m = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
    return directives(m?.[1] ?? '');
  })();

  const required: Record<string, string[]> = {
    'script-src': ['https://assets.calendly.com'],
    'style-src': ['https://assets.calendly.com'],
    'frame-src': ['https://calendly.com', 'https://www.youtube.com', 'https://player.vimeo.com'],
  };

  for (const [name, policy] of [
    ['_headers', headerPolicy],
    ['index.html', metaPolicy],
  ] as const) {
    it(`${name} allows Calendly and video embeds`, () => {
      for (const [directive, sources] of Object.entries(required)) {
        for (const source of sources) expect(policy[directive] ?? [], `${directive} ${source}`).toContain(source);
      }
    });
  }
});
