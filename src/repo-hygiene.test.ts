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

describe('one deployment path (US-122)', () => {
  const entries = readdirSync(ROOT);

  it('has no competing edge-function build configurations', () => {
    // US-198. This used to ban six files on the reasoning that a router listing
    // 15 of 86 functions "cannot be what serves production". ce75af6 settled
    // that by measurement rather than inference: functions.agentbio.net is
    // Traefik-routed to the Coolify application that runs the root Dockerfile
    // and edge-functions-server.ts, and the Supabase edge runtime named as its
    // replacement holds only main/ and hello/ and answers everything else with
    // 500 InvalidWorkerCreation. The router was production; deleting it failed
    // the deploy that was meant to carry the 2026-09-10 key rotation.
    //
    // So those two are the deploy path and stay. The other four were genuinely
    // four more ways to build the same image, and those are what this bans.
    // The 15-of-86 problem was real and is fixed at the router — see
    // src/edge-function-routing.test.ts (US-199) — not by deleting it again.
    const banned = [
      'Dockerfile.gitclone',
      'edge-functions.Dockerfile',
      'docker-compose.edge-functions.yml',
      'nixpacks.toml',
    ];
    expect(banned.filter((name) => entries.includes(name))).toEqual([]);
  });

  it('keeps the deployment path that ce75af6 measured', () => {
    // The mirror of the above: a future cleanup that deletes these again
    // repeats the outage rather than discovering it.
    expect(entries).toContain('Dockerfile');
    expect(entries).toContain('edge-functions-server.ts');
  });

  it('documents the one path that is real', () => {
    expect(existsSync(join(ROOT, 'docs/deploy/edge-functions.md'))).toBe(true);
  });

  it('has one migration tree and one CI directory', () => {
    // supabase/ held all_migrations_combined.sql, all_migrations_safe.sql and
    // migration_part_1..9.sql, referenced by nothing; database/ held an index
    // script to paste into a console; github-actions/ held six workflows GitHub
    // never runs, since only .github/workflows/ executes.
    expect(existsSync(join(ROOT, 'github-actions'))).toBe(false);
    expect(existsSync(join(ROOT, 'database'))).toBe(false);
    expect(existsSync(join(ROOT, 'supabase/all_migrations_combined.sql'))).toBe(false);
    expect(existsSync(join(ROOT, 'supabase/all_migrations_safe.sql'))).toBe(false);

    const strays = readdirSync(join(ROOT, 'supabase')).filter((name) =>
      /^(all_migrations|migration_part)/.test(name)
    );
    expect(strays).toEqual([]);
  });

  it('carries no unbuilt subprojects, and says where they went', () => {
    expect(existsSync(join(ROOT, 'mobile-native-js'))).toBe(false);
    expect(existsSync(join(ROOT, 'tools/automated-testing'))).toBe(false);
    expect(existsSync(join(ROOT, 'docs/archive/REMOVED_SUBPROJECTS.md'))).toBe(true);
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
