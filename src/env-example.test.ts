/**
 * US-123: both .env.example files documented variables nothing read and
 * omitted variables the code required.
 *
 * The frontend template declared seven VITE_FIREBASE_* names (push was removed
 * in US-059), VITE_STRIPE_PUBLISHABLE_KEY (@stripe/stripe-js is unused) and
 * PII_ENCRYPTION_KEY — a server secret in a file whose whole point is that
 * everything in it ships to the browser. Eight names that src/ actually read
 * were missing, so anyone setting up the project found out at run time.
 *
 * There was no supabase/functions/.env.example at all: 40 Deno.env.get names
 * with no list anywhere, which is how four spellings of the site URL survived.
 *
 * These assertions read the source rather than a snapshot, so adding a new
 * variable and forgetting to document it fails here.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

function walk(dir: string, filter: (p: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/** Names on the left of `=` at the start of a line, comments ignored. */
function declaredNames(relPath: string): Set<string> {
  const text = readFileSync(join(ROOT, relPath), 'utf8');
  const names = new Set<string>();
  for (const line of text.split('\n')) {
    const m = /^([A-Z][A-Z0-9_]*)=/.exec(line);
    if (m) names.add(m[1]);
  }
  return names;
}

describe('.env.example (frontend)', () => {
  const declared = declaredNames('.env.example');
  const read = new Set<string>();
  for (const file of walk(join(ROOT, 'src'), (p) => /\.(ts|tsx)$/.test(p))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/import\.meta\.env[?.]*\.(VITE_[A-Z0-9_]+)/g)) {
      read.add(m[1]);
    }
  }

  it('declares every VITE_ variable src/ reads', () => {
    expect([...read].filter((n) => !declared.has(n)).sort()).toEqual([]);
  });

  it('declares no VITE_ variable nothing reads', () => {
    // The build reads some outside src/: index.html's %VITE_…% substitutions,
    // and vite.config.ts, which fills the GA measurement id into a meta tag
    // (public/scripts/analytics.js is a static asset with no import.meta.env).
    const fromBuild = new Set<string>();
    for (const file of ['index.html', 'vite.config.ts']) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      for (const m of text.matchAll(/(?:%|env\.|process\.env\.)(VITE_[A-Z0-9_]+)/g)) {
        fromBuild.add(m[1]);
      }
    }
    const unread = [...declared].filter((n) => !read.has(n) && !fromBuild.has(n)).sort();
    expect(unread).toEqual([]);
  });

  it('contains no server-only secret', () => {
    // PII_ENCRYPTION_KEY was in here. Everything in this file is a build-time
    // substitution that ends up in the shipped bundle.
    for (const name of declared) {
      expect(name.startsWith('VITE_')).toBe(true);
    }
  });
});

describe('supabase/functions/.env.example', () => {
  const declared = declaredNames('supabase/functions/.env.example');
  const read = new Set<string>(['SITE_URL', 'FUNCTIONS_URL', 'PAGESPEED_API_KEY']);
  for (const file of walk(join(ROOT, 'supabase/functions'), (p) => p.endsWith('.ts'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)) {
      read.add(m[1]);
    }
  }

  it('declares every Deno.env.get name the functions read', () => {
    expect([...read].filter((n) => !declared.has(n)).sort()).toEqual([]);
  });

  it('declares no name the functions no longer read', () => {
    expect([...declared].filter((n) => !read.has(n)).sort()).toEqual([]);
  });

  it('gives every name a one-line purpose', () => {
    const text = readFileSync(join(ROOT, 'supabase/functions/.env.example'), 'utf8');
    const undocumented = text
      .split('\n')
      .filter((l) => /^[A-Z][A-Z0-9_]*=/.test(l))
      .filter((l) => !/#\s*\S/.test(l))
      .map((l) => l.split('=')[0]);
    expect(undocumented).toEqual([]);
  });

  it('does not reintroduce a retired alias', () => {
    for (const alias of [
      'APP_URL',
      'FRONTEND_URL',
      'PUBLIC_SITE_URL',
      'EDGE_FUNCTIONS_URL',
      'PAGESPEED_INSIGHTS_API_KEY',
      'ENCRYPTION_MASTER_KEY',
      'AGENT_EMAIL',
    ]) {
      expect({ alias, declared: declared.has(alias), read: read.has(alias) }).toEqual({
        alias,
        declared: false,
        read: false,
      });
    }
  });
});
