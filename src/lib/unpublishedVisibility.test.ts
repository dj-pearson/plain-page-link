import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * US-308: unpublishing a page hides its listings, links, reviews and open
 * houses from visitors, not just the profile row. verify:schema proves the
 * behaviour against a real Postgres; this holds the migrations to it without
 * one, so a later migration that recreates one of these policies or functions
 * from an older copy (the way 20260930000002 recreated the visitor policies to
 * add is_sample) fails here first.
 */

const dir = join(__dirname, '../../supabase/migrations');
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const stripComments = (sql: string) => sql.replace(/--[^\n]*/g, '');

/** The body of the newest CREATE POLICY "<name>" ON public.<table>, up to its semicolon. */
function newestPolicy(name: string, table: string): string {
  let last: string | null = null;
  const head = `CREATE POLICY "${name}" ON public.${table}`;
  for (const file of files) {
    const sql = stripComments(readFileSync(join(dir, file), 'utf8'));
    let at = sql.indexOf(head);
    while (at !== -1) {
      last = sql.slice(at, sql.indexOf(';', at));
      at = sql.indexOf(head, at + head.length);
    }
  }
  if (!last) throw new Error(`no ${head} in supabase/migrations`);
  return last;
}

/** The body of the newest CREATE OR REPLACE FUNCTION public.<name>, up to its closing dollar quote. */
function newestFunction(name: string): string {
  let last: string | null = null;
  const head = `CREATE OR REPLACE FUNCTION public.${name}(`;
  for (const file of files) {
    const sql = stripComments(readFileSync(join(dir, file), 'utf8'));
    let at = sql.indexOf(head);
    while (at !== -1) {
      const open = sql.indexOf('AS $', at);
      const tag = sql.slice(open + 3, sql.indexOf('$', open + 4) + 1);
      const end = sql.indexOf(tag, open + 3 + tag.length);
      last = sql.slice(at, end + tag.length);
      at = sql.indexOf(head, at + head.length);
    }
  }
  if (!last) throw new Error(`no ${head} in supabase/migrations`);
  return last;
}

const PUBLISHED = /p\.is_published IS TRUE/;

describe('an unpublished agent is hidden from visitors (US-308)', () => {
  it.each([
    ['Public can view active listings without user tracking', 'listings'],
    ['Anyone can view active links', 'links'],
    ['Anyone can view published testimonials', 'testimonials'],
  ])('the visitor policy "%s" on %s requires a published profile', (name, table) => {
    const policy = newestPolicy(name, table);
    expect(policy).toMatch(PUBLISHED);
    expect(policy).toMatch(new RegExp(`p\\.id = ${table}\\.user_id`));
    expect(policy).toMatch(/NOT is_sample/);
    expect(policy).toMatch(/TO anon, authenticated/);
  });

  it.each(['list_public_open_houses', 'get_public_open_house'])(
    '%s serves a published agent, or the agent themselves',
    (fn) => {
      const body = newestFunction(fn);
      expect(body).not.toMatch(/is_published IS NOT FALSE/);
      expect(body).toMatch(/\(p\.is_published IS TRUE OR o\.user_id = auth\.uid\(\)\)/);
      expect(body).not.toMatch(/private_notes/);
    }
  );

  it('public_agent_response_hours answers only for a published agent, or the agent', () => {
    const body = newestFunction('public_agent_response_hours');
    expect(body).toMatch(/\(p\.is_published IS TRUE OR p\.id = auth\.uid\(\)\)/);
  });

  // US-396 (US-317): the click counter is SECURITY DEFINER, so it bypasses the
  // links policy above and has to apply the same rule itself.
  it("increment_link_clicks counts only a link a visitor can see, or the agent's own", () => {
    const body = newestFunction('increment_link_clicks');
    expect(body).toMatch(/l\.user_id = auth\.uid\(\)/);
    expect(body).toMatch(/l\.is_active IS TRUE AND NOT l\.is_sample AND p\.is_published IS TRUE/);
    // The visibility test runs before the rate-limit bucket is written, so a
    // made-up link id costs nothing.
    expect(body.indexOf('IF NOT COALESCE(v_countable, false)')).toBeGreaterThan(-1);
    expect(body.indexOf('IF NOT COALESCE(v_countable, false)')).toBeLessThan(
      body.indexOf('check_rate_limit')
    );
    expect(body).toMatch(/SET search_path = public, extensions, pg_temp/);
  });
});
