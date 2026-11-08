import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveOwnedListing, type ListingLookupClient } from './lead-listing.ts';

const AGENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_AGENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OWN_LISTING = '11111111-1111-4111-8111-111111111111';
const OTHER_LISTING = '22222222-2222-4222-8222-222222222222';
const DELETED_LISTING = '33333333-3333-4333-8333-333333333333';

type Row = { id: string; user_id: string; address: string | null };

/** A listings table behind the same filter chain submit-lead uses. */
function fakeListings(rows: Row[], opts: { error?: string; throws?: boolean } = {}) {
  const calls: Array<{ table: string; columns: string; filters: Record<string, string> }> = [];
  const client: ListingLookupClient = {
    from(table) {
      return {
        select(columns) {
          const filters: Record<string, string> = {};
          const call = { table, columns, filters };
          calls.push(call);
          const chain = {
            eq(column: string, value: string) {
              filters[column] = value;
              return chain;
            },
            maybeSingle() {
              if (opts.throws) return Promise.reject(new Error('network down'));
              if (opts.error) return Promise.resolve({ data: null, error: { message: opts.error } });
              const hit = rows.find((r) =>
                Object.entries(filters).every(([k, v]) => r[k as keyof Row] === v)
              );
              return Promise.resolve({
                data: hit ? { id: hit.id, address: hit.address } : null,
                error: null,
              });
            },
          };
          return chain;
        },
      };
    },
  };
  return { client, calls };
}

const TABLE: Row[] = [
  { id: OWN_LISTING, user_id: AGENT, address: '12 Main St' },
  { id: OTHER_LISTING, user_id: OTHER_AGENT, address: '40 Oak Ave' },
];

describe('resolveOwnedListing (US-555)', () => {
  it('keeps one of the agent\'s own listings, with its address', async () => {
    const { client, calls } = fakeListings(TABLE);
    const result = await resolveOwnedListing(client, AGENT, OWN_LISTING);
    expect(result).toEqual({ listing: { id: OWN_LISTING, address: '12 Main St' }, dropped: null });
    // Scoped by owner, not just by id.
    expect(calls).toEqual([
      { table: 'listings', columns: 'id, address', filters: { id: OWN_LISTING, user_id: AGENT } },
    ]);
  });

  it('drops another agent\'s listing rather than filing the lead against it', async () => {
    const { client } = fakeListings(TABLE);
    const result = await resolveOwnedListing(client, AGENT, OTHER_LISTING);
    expect(result).toEqual({ listing: null, dropped: 'not_owned_or_deleted' });
  });

  it('drops a deleted listing, so the insert cannot fail on the foreign key and lose the lead', async () => {
    const { client } = fakeListings(TABLE);
    const result = await resolveOwnedListing(client, AGENT, DELETED_LISTING);
    expect(result).toEqual({ listing: null, dropped: 'not_owned_or_deleted' });
  });

  it('drops the listing, not the lead, when the read fails or throws', async () => {
    expect(await resolveOwnedListing(fakeListings(TABLE, { error: 'timeout' }).client, AGENT, OWN_LISTING)).toEqual({
      listing: null,
      dropped: 'lookup_failed',
    });
    expect(await resolveOwnedListing(fakeListings(TABLE, { throws: true }).client, AGENT, OWN_LISTING)).toEqual({
      listing: null,
      dropped: 'lookup_failed',
    });
  });

  it('does not query when no listing was sent', async () => {
    for (const none of [undefined, null, '']) {
      const { client, calls } = fakeListings(TABLE);
      expect(await resolveOwnedListing(client, AGENT, none)).toEqual({ listing: null, dropped: null });
      expect(calls).toHaveLength(0);
    }
  });

  it('keeps a listing with no address as a listing', async () => {
    const { client } = fakeListings([{ id: OWN_LISTING, user_id: AGENT, address: null }]);
    expect(await resolveOwnedListing(client, AGENT, OWN_LISTING)).toEqual({
      listing: { id: OWN_LISTING, address: null },
      dropped: null,
    });
  });
});

describe('submit-lead files enquiries only against the agent\'s own listings (US-555)', () => {
  const source = readFileSync(
    resolve(__dirname, '../submit-lead/index.ts'),
    'utf8'
  );

  it('resolves the listing before the lead is stored', () => {
    const resolveAt = source.indexOf('resolveOwnedListing(supabase, leadData.user_id, leadData.listing_id)');
    const insertAt = source.indexOf(".from('leads')\n      .insert(");
    expect(resolveAt).toBeGreaterThan(-1);
    expect(insertAt).toBeGreaterThan(-1);
    expect(resolveAt).toBeLessThan(insertAt);
    expect(source).toContain('leadData.listing_id = ownedListing?.id');
  });

  it('never reads a listing by id alone', () => {
    // Every listing read goes through resolveOwnedListing, which scopes by
    // user_id; a direct read here is how the auto-reply named another
    // agent's address.
    expect(source).not.toMatch(/from\(['"]listings['"]\)/);
  });
});
