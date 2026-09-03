/**
 * US-109: deleteSampleData deleted EVERY listing, lead, testimonial and link
 * belonging to the user — real ones included. It had no caller, which is the
 * only reason it never destroyed an agent's data; the story asks for it to be
 * reachable from the UI, which would have made it destructive.
 *
 * These pin the scoping, because that is what makes putting it behind a button
 * safe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface RecordedDelete {
  table: string;
  filters: [string, unknown][];
}

const { fromMock, recorded } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  recorded: [] as RecordedDelete[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
  supabaseConfig: {
    url: 'http://localhost:54321',
    anonKey: 'test-anon-key',
    functionsUrl: 'http://localhost:54321/functions/v1',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { deleteSampleData, generateSampleData } from './sample-data-service';

describe('deleteSampleData', () => {
  beforeEach(() => {
    recorded.length = 0;
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      const entry: RecordedDelete = { table, filters: [] };
      const builder: Record<string, unknown> = {};
      builder.delete = vi.fn(() => builder);
      builder.eq = vi.fn((column: string, value: unknown) => {
        entry.filters.push([column, value]);
        return builder;
      });
      builder.select = vi.fn(() => {
        recorded.push(entry);
        return Promise.resolve({ data: [{ id: '1' }], error: null });
      });
      return builder;
    });
  });

  it('only ever deletes rows flagged as sample data', async () => {
    await deleteSampleData('user-1');

    expect(recorded.length).toBe(4);
    for (const entry of recorded) {
      // Both filters, every time. Without the second this wipes real content.
      expect(entry.filters).toContainEqual(['user_id', 'user-1']);
      expect(entry.filters).toContainEqual(['is_sample', true]);
    }
  });

  it('covers every table the generator writes to', async () => {
    await deleteSampleData('user-1');

    expect(recorded.map((r) => r.table).sort()).toEqual([
      'leads',
      'links',
      'listings',
      'testimonials',
    ]);
  });

  it('reports what it removed rather than returning void', async () => {
    // The admin UI can then say "Removed: 1 listings, 1 leads, …" instead of
    // claiming success blindly.
    await expect(deleteSampleData('user-1')).resolves.toEqual({
      listings: 1,
      leads: 1,
      testimonials: 1,
      links: 1,
    });
  });

  it('surfaces a failure instead of reporting a partial delete as success', async () => {
    fromMock.mockImplementation(() => {
      const builder: Record<string, unknown> = {};
      builder.delete = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.select = vi.fn(() =>
        Promise.resolve({ data: null, error: { message: 'permission denied' } })
      );
      return builder;
    });

    await expect(deleteSampleData('user-1')).rejects.toMatchObject({
      message: 'permission denied',
    });
  });
});

/**
 * The jsonb columns take a value, not a serialisation of one.
 *
 * `photos` was written as JSON.stringify([...]), so the column held a JSON
 * string rather than a JSON array and toStringList - which every listing
 * surface reads through - returned []. Four seeded listings in production had
 * photos nobody could see, on the dashboard and on the public profile alike.
 */
describe('generateSampleData', () => {
  it('writes listing photos as an array, not a JSON string', async () => {
    const inserted: Record<string, unknown>[] = [];

    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      builder.insert = vi.fn((rows: Record<string, unknown>[]) => {
        if (table === 'listings') inserted.push(...rows);
        return {
          select: vi.fn(() => Promise.resolve({ data: rows, error: null })),
        };
      });
      return builder;
    });

    await generateSampleData('user-1', {
      skipDuplicateCheck: true,
      includeListings: true,
      includeLeads: false,
      includeTestimonials: false,
      includeLinks: false,
    });

    expect(inserted.length).toBeGreaterThan(0);
    for (const listing of inserted) {
      expect(Array.isArray(listing.photos)).toBe(true);
      for (const url of listing.photos as unknown[]) {
        expect(typeof url).toBe('string');
      }
    }
  });
});
