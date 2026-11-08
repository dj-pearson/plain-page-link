/**
 * US-342 / US-575: the dashboard and the page-builder block read `listings`
 * with named columns, never `*`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LISTINGS_BLOCK_COLUMNS, OWNER_LISTING_COLUMNS, selectedColumns } from './listingColumns';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

/** The column names of `listings` Row in the generated types. */
function listingsRowColumns(): string[] {
  const types = read('src/integrations/supabase/types.ts');
  const start = types.indexOf('      listings: {');
  expect(start).toBeGreaterThan(-1);
  const rowStart = types.indexOf('Row: {', start);
  const rowEnd = types.indexOf('\n        };', rowStart);
  const body = types.slice(rowStart, rowEnd);
  return [...body.matchAll(/^\s{10}(\w+):/gm)].map((m) => m[1]);
}

describe('listing column lists', () => {
  const real = new Set(listingsRowColumns());

  it.each([
    ['OWNER_LISTING_COLUMNS', OWNER_LISTING_COLUMNS],
    ['LISTINGS_BLOCK_COLUMNS', LISTINGS_BLOCK_COLUMNS],
  ])('%s names only real columns, once each, and no wildcard', (_name, list) => {
    const cols = selectedColumns(list);
    expect(cols).not.toContain('*');
    expect(new Set(cols).size).toBe(cols.length);
    expect(cols.filter((c) => !real.has(c))).toEqual([]);
  });

  it('the block list is exactly what its cards render', () => {
    expect(selectedColumns(LISTINGS_BLOCK_COLUMNS).sort()).toEqual(
      [
        'address',
        'bathrooms',
        'bedrooms',
        'city',
        'id',
        'image',
        'photos',
        'price',
        'square_feet',
        'state',
        'status',
      ].sort()
    );
  });

  it('the owner list keeps the fields the dashboard edits and orders by', () => {
    const cols = selectedColumns(OWNER_LISTING_COLUMNS);
    for (const c of [
      'id',
      'user_id',
      'photos',
      'highlights',
      'sort_order',
      'created_at',
      'virtual_tour_url',
    ]) {
      expect(cols).toContain(c);
    }
  });
});

describe('no select("*") on listings in the files US-342 named', () => {
  it.each(['src/hooks/useListings.ts', 'src/components/pageBuilder/blocks/ListingsBlock.tsx'])(
    '%s',
    (file) => {
      const src = read(file);
      expect(src).not.toMatch(
        /\.from\(['"]listings['"]\)\s*(\/\/[^\n]*\s*)*\.select\(\s*['"]\*['"]/
      );
      expect(src).not.toMatch(/\.from\(['"]listings['"]\)\s*(\/\/[^\n]*\s*)*\.select\(\s*\)/);
    }
  );
});
