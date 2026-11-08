import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * US-592: the public media buckets are served by public URL, which never reads
 * storage.objects RLS. A SELECT policy on them only adds the list API, and one
 * reaching anon let any visitor enumerate every agent's user id and every
 * photo of an unpublished page or draft listing.
 *
 * verify:schema proves the behaviour against a real Postgres. This replays the
 * storage.objects policy statements in migration order without one, so a later
 * migration that re-creates a visitor-wide read fails here first.
 */

const dir = join(__dirname, '../../supabase/migrations');
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const stripComments = (sql: string) => sql.replace(/--[^\n]*/g, '');

/** The storage.objects policies left standing after every migration, by name. */
function standingStoragePolicies(): Map<string, string> {
  const live = new Map<string, string>();
  const statement =
    /(DROP POLICY IF EXISTS|DROP POLICY|CREATE POLICY)\s+"([^"]+)"\s+ON\s+storage\.objects\b([^;]*);/g;
  for (const file of files) {
    const sql = stripComments(readFileSync(join(dir, file), 'utf8'));
    for (const m of sql.matchAll(statement)) {
      const [, verb, name, rest] = m;
      if (verb.startsWith('DROP')) live.delete(name);
      else live.set(name, rest.replace(/\s+/g, ' ').trim());
    }
  }
  return live;
}

describe('media buckets are not listable by visitors (US-592)', () => {
  const policies = standingStoragePolicies();
  const selects = [...policies].filter(([, body]) => /\bFOR SELECT\b/i.test(body));

  it('drops the visitor-wide read', () => {
    expect(policies.has('Public read of public media buckets')).toBe(false);
  });

  it('no SELECT policy on storage.objects reaches anon', () => {
    for (const [name, body] of selects) {
      const roles = body.match(/\bTO\s+([a-z_,\s]+?)\s+USING\b/i)?.[1];
      // An omitted TO clause defaults to PUBLIC, which includes anon.
      expect(roles, `${name} has no TO clause`).toBeDefined();
      expect(roles, name).not.toMatch(/\b(anon|public)\b/i);
    }
  });

  it('every SELECT policy on storage.objects is scoped to the owner folder', () => {
    expect(selects.length).toBeGreaterThan(0);
    for (const [name, body] of selects) {
      expect(body, name).toMatch(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
    }
  });

  it('the owner can still list their own folder in each media bucket', () => {
    const own = policies.get('Users read their own media');
    expect(own).toBeDefined();
    for (const bucket of ['avatars', 'listing-photos', 'brokerage-logos']) {
      expect(own).toContain(`'${bucket}'`);
    }
    expect(own).toMatch(/TO authenticated/);
  });
});
