/**
 * US-485: the database's conversion counts use the same won statuses as the
 * dashboard.
 *
 * lead_stats() feeds the per-source conversion column on Analytics and
 * analytics_summary() feeds the conversion rate. Both once counted
 * status = 'converted' only, so a lead moved to 'closed' (a won status since
 * 20261107000428) stopped counting as a conversion. This test reads whichever
 * migration last defines each function, so a later redefinition is held to the
 * same list.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WON_STATUSES } from './leadStatus';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations');

/** The body of the last top-level migration that (re)creates `fn`. */
function latestDefinition(fn: string): { file: string; body: string } {
  const header = new RegExp(`CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${fn}\\s*\\(`, 'i');
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let found: { file: string; body: string } | null = null;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const match = header.exec(sql);
    if (!match) continue;
    const rest = sql.slice(match.index);
    const open = rest.indexOf('$$');
    const close = rest.indexOf('$$', open + 2);
    found = { file, body: rest.slice(open + 2, close) };
  }
  if (!found) throw new Error(`no migration defines public.${fn}`);
  return found;
}

/** Every quoted list in a `status IN (...)` that includes 'converted'. */
function wonLists(body: string): string[][] {
  const lists: string[][] = [];
  for (const m of body.matchAll(/status\s+IN\s*\(([^)]*)\)/gi)) {
    const values = [...m[1].matchAll(/'([^']+)'/g)].map((v) => v[1]);
    if (values.includes('converted')) lists.push(values.sort());
  }
  return lists;
}

describe.each(['lead_stats', 'analytics_summary'])('%s counts every won status', (fn) => {
  const { file, body } = latestDefinition(fn);

  it('never counts converted alone', () => {
    expect(body, file).not.toMatch(/status\s*=\s*'converted'/i);
  });

  it('uses exactly WON_STATUSES as its conversion filter', () => {
    const lists = wonLists(body);
    expect(lists.length, file).toBeGreaterThan(0);
    for (const list of lists) expect(list).toEqual([...WON_STATUSES].sort());
  });

  it('stays SECURITY INVOKER with the pinned search_path', () => {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const head = sql.slice(sql.search(new RegExp(`FUNCTION\\s+public\\.${fn}\\s*\\(`, 'i')));
    const preamble = head.slice(0, head.indexOf('$$'));
    expect(preamble).toMatch(/SECURITY\s+INVOKER/i);
    expect(preamble).toMatch(/SET\s+search_path\s*=\s*public,\s*extensions,\s*pg_temp/i);
    expect(sql).toMatch(
      new RegExp(
        `REVOKE\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.${fn}\\([^)]*\\)\\s+FROM\\s+PUBLIC,\\s*anon`,
        'i'
      )
    );
  });
});
