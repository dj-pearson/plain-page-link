/**
 * US-225: export pages through every matching lead, not the 50 on screen.
 */
import { describe, it, expect, vi } from 'vitest';

const ranges: [number, number][] = [];
const TOTAL = 120;

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    or: () => builder,
    ilike: () => builder,
    order: () => builder,
    range: async (from: number, to: number) => {
      ranges.push([from, to]);
      const rows = Array.from({ length: Math.max(0, Math.min(to, TOTAL - 1) - from + 1) }, (_, i) => ({
        id: `lead-${from + i}`,
        name: `Lead ${from + i}`,
        encrypted_email: 'enc',
        encrypted_phone: null,
      }));
      return { data: rows, error: null };
    },
  };
  return { supabase: { from: () => builder } };
});
vi.mock('@/lib/pii', () => ({
  encryptPIIBatch: vi.fn(),
  decryptLeadContacts: async (ids: string[]) =>
    new Map(ids.map((id) => [id, { id, email: `${id}@example.com`, phone: null }])),
}));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: () => ({ user: { id: 'agent-1' } }) }));

import { fetchAllLeads } from './useLeads';

describe('fetchAllLeads', () => {
  it('returns all 120 leads, decrypted, in batches pii-crypto accepts', async () => {
    const { leads, truncated } = await fetchAllLeads('agent-1', { status: 'all' });
    expect(leads).toHaveLength(120);
    expect(truncated).toBe(false);
    expect(leads[119].email).toBe('lead-119@example.com');
    expect(ranges).toEqual([
      [0, 99],
      [100, 199],
    ]);
  });
});
