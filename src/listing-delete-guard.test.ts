/**
 * US-494: one browser path deletes a listing, and it cleans up after itself.
 *
 * useListings.deleteListing scopes the delete to the caller's user_id, asks for
 * the removed rows back (RLS turns a refused delete into zero rows, not an
 * error) and only then removes the listing's photos and their WebP variants
 * from the public listing-photos bucket (US-451). Two other deletes existed,
 * both unreachable but both ready to copy: src/lib/sync-manager.ts (an offline
 * delete with no user_id filter and no photo cleanup, US-482) and
 * src/hooks/useSecureListings.ts (an admin-wide delete, also without cleanup,
 * US-483). A listing deleted through either left its photos public for good.
 *
 * Both are gone. This holds the line: a new `.from('listings') … .delete()` in
 * the browser bundle has to go through deleteListing instead, and
 * deleteListing itself must stay owner-scoped and row-checked.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = __dirname;
const OWNER = join('hooks', 'useListings.ts');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.(ts|tsx)$/.test(name) || /\.test\.(ts|tsx)$/.test(name)) return [];
    return [full];
  });
}

/**
 * Every `.delete(` whose query starts at `.from('listings')`, as the text from
 * that `.from(` to the end of the statement.
 */
function listingDeletes(source: string): string[] {
  const out: string[] = [];
  const deleteCall = /\.delete\(/g;
  let match: RegExpExecArray | null;
  while ((match = deleteCall.exec(source))) {
    const fromAt = source.lastIndexOf('.from(', match.index);
    if (fromAt === -1) continue;
    const table = /^\.from\(\s*['"`]([^'"`]+)['"`]/.exec(source.slice(fromAt));
    if (table?.[1] !== 'listings') continue;
    const end = source.indexOf(';', match.index);
    out.push(source.slice(fromAt, end === -1 ? undefined : end));
  }
  return out;
}

describe('listing deletes (US-494)', () => {
  const files = sourceFiles(SRC);

  it('found the source tree', () => {
    expect(files.some((f) => f.endsWith(OWNER))).toBe(true);
  });

  it('deletes listings only through useListings.deleteListing', () => {
    const offenders = files
      .filter((f) => !f.endsWith(OWNER))
      .filter((f) => listingDeletes(readFileSync(f, 'utf8')).length > 0)
      .map((f) => relative(SRC, f).split(sep).join('/'));
    expect(offenders).toEqual([]);
  });

  it('keeps deleteListing owner-scoped and row-checked', () => {
    const deletes = listingDeletes(readFileSync(join(SRC, OWNER), 'utf8'));
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toMatch(/\.eq\(\s*['"]user_id['"]/);
    expect(deletes[0]).toMatch(/\.select\(\s*['"]id['"]\s*\)/);
  });

  it('recognises an unscoped delete as a listing delete', () => {
    // The shape sync-manager used. If the matcher stopped matching it, the
    // guard above would pass on anything.
    const found = listingDeletes(
      "const { error } = await supabase.from('listings').delete().eq('id', id);"
    );
    expect(found).toHaveLength(1);
    expect(found[0]).not.toMatch(/user_id/);
    expect(listingDeletes("await supabase.from('links').delete().eq('id', id);")).toEqual([]);
  });
});
