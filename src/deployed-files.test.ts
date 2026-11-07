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
import { headersFor, parseHeaders } from '../scripts/check-route-weight.mjs';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');

/** public/_headers resolved with Cloudflare Pages' semantics (US-381). */
const resolved = await parseHeaders();

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

  // What Cloudflare Pages actually sends, resolved the way Pages resolves it:
  // every matching rule, repeated headers joined with a comma, `! Name`
  // detaching (US-381). The earlier checks here compared rule positions on the
  // belief that a later rule wins, which is not how Pages works.
  const REVALIDATE = 'public, max-age=0, must-revalidate';
  const YEAR = 'public, max-age=31536000, immutable';
  const cacheControl = (path: string): string | undefined =>
    headersFor(resolved, path)['Cache-Control'];

  it('never sends a path two cache policies at once (US-381)', () => {
    const paths = [
      ...deployed.map((f) => `/${f}`),
      '/',
      '/pricing',
      '/jane-agent',
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
      '/assets/hero-abc123.webp',
      '/assets/inter-abc123.woff2',
    ];
    for (const path of paths) {
      const policy = cacheControl(path) ?? '';
      expect(policy.match(/max-age=/g)?.length, `${path}: ${policy}`).toBe(1);
      const type = headersFor(resolved, path)['Content-Type'] ?? '';
      expect(type.includes(','), `${path} Content-Type sent twice: ${type}`).toBe(false);
    }
  });

  it('gives content-hashed /assets/ files, and only those, an immutable year', () => {
    for (const path of [
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
      '/assets/hero-abc123.png',
      '/assets/hero-abc123.webp',
      '/assets/inter-abc123.woff2',
    ]) {
      expect(cacheControl(path), path).toBe(YEAR);
    }
    for (const file of deployed) {
      expect(cacheControl(`/${file}`) ?? '', file).not.toMatch(/immutable/);
    }
  });

  it('lets a new icon or social image reach returning visitors and installed apps (US-301)', () => {
    const images = deployed.filter((f) => /\.(?:png|webp|jpe?g|svg)$/i.test(f));
    expect(images, 'the manifest icons are in public/icons').toContain('icons/icon-192.png');
    expect(images).toContain('Icon.png');
    expect(images).toContain('Cover.png');
    for (const image of images) {
      const policy = cacheControl(`/${image}`) ?? '';
      const maxAge = Number(/max-age=(\d+)/.exec(policy)?.[1]);
      expect(maxAge, `${image}: ${policy}`).toBeLessThanOrEqual(86400);
    }
  });

  it('revalidates the service worker and the unhashed scripts on every load (US-183, US-272)', () => {
    expect(rules, '/sw.js needs its own rule').toContain('/sw.js');
    expect(rules, '/scripts/* needs its own rule').toContain('/scripts/*');
    expect(cacheControl('/sw.js')).toBe(REVALIDATE);
    expect(cacheControl('/scripts/analytics.js')).toBe(REVALIDATE);
    expect(headersFor(resolved, '/sw.js')['Content-Type']).toBe('application/javascript');
  });

  it('revalidates documents and the manifest on every load', () => {
    for (const path of ['/', '/pricing', '/index.html', '/offline.html', '/manifest.json']) {
      expect(cacheControl(path), path).toBe(REVALIDATE);
    }
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

  it('declares a rule for every asset type the build actually emits', () => {
    const present = new Set([
      ...deployed.map((f) => {
        const dot = f.lastIndexOf('.');
        return dot === -1 ? '' : f.slice(dot).toLowerCase();
      }),
      ...BUILT,
    ]);
    // Types that get an explicit rule (a Content-Type, and for images the
    // short cache of US-301; the year comes from /assets/*). .txt, .xml and
    // .json are deliberately left on the /* floor: robots.txt, sitemap.xml and
    // manifest.json all change without their URLs changing.
    const wantsLongCache = ['.png', '.webp', '.svg', '.js', '.css'].filter((e) => present.has(e));
    const declared = new Set(
      rules.filter((rule) => rule.startsWith('/*.')).map((r) => r.slice(2).toLowerCase())
    );
    const uncovered = wantsLongCache.filter((extension) => !declared.has(extension));
    expect(uncovered, 'these ship on every page and need an explicit rule').toEqual([]);
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
        for (const source of sources)
          expect(policy[directive] ?? [], `${directive} ${source}`).toContain(source);
      }
    });

    // US-268: script-src listed https://esm.sh, which nothing in the frontend
    // loads. esm.sh serves any npm package as a script, so allowing it let an
    // injected <script src> run arbitrary code from a third party despite the
    // policy. A package CDN, inline script or eval must not come back.
    it(`${name} script-src allows no package CDN, inline script or eval`, () => {
      const scriptSrc = policy['script-src'] ?? [];
      expect(scriptSrc.length).toBeGreaterThan(0);
      for (const banned of [
        'https://esm.sh',
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        "'unsafe-inline'",
        "'unsafe-eval'",
        '*',
        'https:',
        'data:',
      ]) {
        expect(scriptSrc, banned).not.toContain(banned);
      }
    });
  }
});

/**
 * US-222: Sentry must report through the same-origin tunnel, because the CSP
 * deliberately has no Sentry host in connect-src.
 */
describe('Sentry reaches production', () => {
  it('src/lib/sentry.ts sends through the tunnel that functions/api/sentry.ts serves', () => {
    const src = readFileSync(join(ROOT, 'src/lib/sentry.ts'), 'utf8');
    expect(src).toMatch(/tunnel:\s*SENTRY_TUNNEL/);
    expect(src).toMatch(/SENTRY_TUNNEL\s*=\s*'\/api\/sentry'/);
    expect(readFileSync(join(ROOT, 'functions/api/sentry.ts'), 'utf8')).toMatch(
      /export async function onRequestPost/
    );
  });
});
