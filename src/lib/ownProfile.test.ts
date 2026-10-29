import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const single = vi.fn(() => Promise.resolve({ data: { id: 'u1' }, error: null }));
const rpc = vi.fn((_fn: string) => ({ single }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (fn: string) => rpc(fn) },
}));

import { fetchOwnProfile } from './ownProfile';

/**
 * US-235: authenticated holds SELECT on the public columns of profiles only
 * (20261028000003). A browser read of profiles that asks for '*', for a bare
 * `.select()` after an update, or for a private column is refused by Postgres
 * for every caller — including the owner, because column grants are not
 * row-aware. These are the columns the migration withholds.
 */
const PRIVATE_COLUMNS = [
  'updated_at',
  'custom_css',
  'custom_domain',
  'view_count',
  'lead_count',
  'link_click_count',
  'zapier_webhook_url',
  'notification_preferences',
  'onboarding_completed_at',
  'referred_by',
  'signup_source',
];

const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (
      /\.tsx?$/.test(p) &&
      !/\.test\.tsx?$/.test(p) &&
      !p.includes('integrations/supabase/types')
    )
      out.push(p);
  }
  return out;
}

/** Prose that mentions a refused shape (this file's own docs) is not a call. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

/** Each `.from('profiles')` chain, up to the end of its statement. */
function profileChains(source: string): string[] {
  const text = stripComments(source);
  const chains: string[] = [];
  const re = /\.from\(\s*['"]profiles['"]\s*\)/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const rest = text.slice(m.index);
    const end = rest.search(/;\s*(\n|$)/);
    chains.push(end === -1 ? rest.slice(0, 600) : rest.slice(0, end));
  }
  return chains;
}

/** The select list(s) a chain asks for; '' for a bare .select(). */
function selectLists(chain: string): string[] {
  return [...chain.matchAll(/\.select\(\s*(?:(['"`])([\s\S]*?)\1)?\s*[,)]/g)].map(
    (m) => m[2] ?? ''
  );
}

describe('fetchOwnProfile (US-235)', () => {
  it("reads the caller's own row through get_own_profile", async () => {
    const result = await fetchOwnProfile();
    expect(rpc).toHaveBeenCalledWith('get_own_profile');
    expect(single).toHaveBeenCalled();
    expect(result.data).toEqual({ id: 'u1' });
  });
});

describe('browser reads of profiles ask for public columns only (US-235)', () => {
  it('the helpers detect each refused shape', () => {
    const lists = (src: string) => profileChains(src).flatMap(selectLists);
    expect(lists(`supabase.from('profiles').select('*').eq('id', id).single();`)).toEqual(['*']);
    expect(lists(`supabase.from('profiles').update(u).eq('id', id).select().single();`)).toEqual([
      '',
    ]);
    expect(
      lists(`supabase\n  .from('profiles')\n  .select('referred_by, signup_source');`)
    ).toEqual(['referred_by, signup_source']);
    expect(lists(`supabase.from('profiles').update(u).eq('id', id);`)).toEqual([]);
  });

  it('no src file selects *, a bare .select() or a private column from profiles', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      for (const chain of profileChains(readFileSync(file, 'utf8'))) {
        for (const list of selectLists(chain)) {
          const columns = list.split(',').map((c) => c.trim());
          const bad =
            list === '' ||
            columns.includes('*') ||
            columns.some((c) => PRIVATE_COLUMNS.includes(c));
          if (bad) offenders.push(`${relative(SRC, file)}: select(${list ? `'${list}'` : ''})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
