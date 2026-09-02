/**
 * US-121: the repository root had 179 entries, 121 of them markdown.
 *
 * Among them: four PDFs that src/lib/exportUtils.test.ts wrote there on every
 * `npm run test:run` (jsPDF's doc.save takes its Node path under jsdom), a
 * 13 MB test-reports/ directory with a 9.5 MB JSON and 31 screenshots, a 9.9 MB
 * db-backup/ of cluster backups and article rows, a 2.7 MB logo.psd, an empty
 * INSTALLING file, and a .styleci.yml preset for Laravel.
 *
 * These hold the root to its shape. A repository root is the first thing anyone
 * sees, and nothing else in the toolchain has an opinion about it.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** The only markdown allowed in the root. */
const ROOT_MARKDOWN = [
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE.md',
];

describe('repository root', () => {
  const entries = readdirSync(ROOT);

  it('keeps only the six documents that belong there', () => {
    const markdown = entries.filter((name) => name.endsWith('.md'));
    const unexpected = markdown.filter((name) => !ROOT_MARKDOWN.includes(name));

    expect(unexpected, 'these belong under docs/').toEqual([]);
  });

  it('holds no build artifacts, dumps or platform leftovers', () => {
    const banned = [
      'test-reports',
      'db-backup',
      'migrations.zip',
      'INSTALLING',
      '.styleci.yml',
      '.lovable-rebuild',
      'Keywords.csv',
      'keywords-template.csv',
    ];
    const present = banned.filter((name) => entries.includes(name));

    expect(present).toEqual([]);
  });

  it('holds no generated PDFs or CSVs', () => {
    // The four that were committed were written by the test suite itself.
    const generated = entries.filter((name) => /\.(pdf|csv)$/i.test(name));
    expect(generated).toEqual([]);
  });

  it('holds no loose shell or PowerShell scripts', () => {
    const scripts = entries.filter((name) => /\.(ps1|sh)$/i.test(name));
    expect(scripts, 'scripts belong in scripts/').toEqual([]);
  });

  it('holds no loose SQL — migrations live in supabase/migrations', () => {
    expect(entries.filter((name) => name.endsWith('.sql'))).toEqual([]);
  });

  it('has the docs directories the guide describes', () => {
    for (const dir of ['setup', 'deploy', 'architecture', 'product', 'seo', 'reviews', 'archive']) {
      expect(existsSync(join(ROOT, 'docs', dir)), `docs/${dir}`).toBe(true);
    }
  });

  it('has one CODE_REVIEW_2026-08, not two that have diverged', () => {
    expect(existsSync(join(ROOT, 'docs/CODE_REVIEW_2026-08.md'))).toBe(false);
    expect(existsSync(join(ROOT, 'docs/reviews/CODE_REVIEW_2026-08.md'))).toBe(true);
  });
});

describe('.gitignore', () => {
  const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');

  it('excludes what the test suite and the database can leave behind', () => {
    for (const pattern of ['*.pdf', 'test-reports/', 'db-backup/', '.claude/settings.local.json']) {
      expect(gitignore, pattern).toContain(pattern);
    }
  });

  it('no longer carries the PHP project it was copied from', () => {
    // /vendor, Homestead.*, /public/hot and .phpunit.result.cache are Laravel.
    for (const pattern of ['/vendor', 'Homestead', '/public/hot', 'phpunit']) {
      expect(gitignore, pattern).not.toContain(pattern);
    }
  });
});

describe('earlier platforms', () => {
  it('has no LinkStack or Lovable remnants', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.devDependencies ?? {})).not.toContain('lovable-tagger');

    expect(readFileSync(join(ROOT, 'vite.config.ts'), 'utf8')).not.toContain('lovable');
    expect(readFileSync(join(ROOT, 'src/main.tsx'), 'utf8')).not.toContain('[Lovable]');

    expect(existsSync(join(ROOT, 'src/types/linkstack.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/components/profile/LinkStackBlocks.tsx'))).toBe(false);
  });
});
