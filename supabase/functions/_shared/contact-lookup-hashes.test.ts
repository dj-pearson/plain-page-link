import { describe, it, expect, vi } from 'vitest';
import {
  hashContactBacklog,
  hashUnhashedContacts,
  summarizeContactHashReport,
  type ContactHashDeps,
  type ContactHashes,
  type UnhashedContactRow,
} from './contact-lookup-hashes';
import { emailLookupHash, phoneLookupHash } from './spam-guard';

const SECRET = 'test-secret-at-least-16-chars';
const AGENT = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

interface Row extends UnhashedContactRow {
  user_id: string;
  hashes?: ContactHashes;
}

const enc = (v: string) => `enc:${v}`;

function row(id: string, user_id: string, over: Partial<Row> = {}): Row {
  return {
    id,
    user_id,
    encrypted_email: enc(`${id}@example.com`),
    encrypted_phone: null,
    updated_at: '2026-11-01T00:00:00Z',
    ...over,
  };
}

function setup(rows: Row[], opts: { failSaveFor?: Set<string> } = {}) {
  const deps: ContactHashDeps = {
    hashSecret: SECRET,
    decrypt: vi.fn(async (v: string | null) => (v ? v.replace(/^enc:/, '') : null)),
    loadUnhashedContacts: vi.fn(async (userId: string | null, limit: number) =>
      rows
        .filter((r) => !r.hashes && (userId === null || r.user_id === userId))
        // Most recently updated first, as the real store orders them.
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, limit)
    ),
    saveContactHashes: vi.fn(async (r: UnhashedContactRow, hashes: ContactHashes) => {
      if (opts.failSaveFor?.has(r.id)) throw new Error('write failed');
      const stored = rows.find((x) => x.id === r.id);
      if (stored) stored.hashes = hashes;
    }),
  };
  return deps;
}

describe('hashUnhashedContacts (US-640)', () => {
  it("hashes only the caller's contacts, newest edit first, with lead-compatible fingerprints", async () => {
    const rows = [
      row('old', AGENT, { updated_at: '2026-10-01T00:00:00Z' }),
      row('just-saved', AGENT, {
        updated_at: '2026-11-08T12:00:00Z',
        encrypted_phone: enc('(512) 555-0142'),
      }),
      row('theirs', OTHER),
    ];
    const deps = setup(rows);

    const result = await hashUnhashedContacts(deps, AGENT, 1);

    expect(result).toMatchObject({ hashed: 1, failed: 0, complete: false });
    const saved = rows.find((r) => r.id === 'just-saved')!.hashes!;
    expect(saved.email_hash).toBe(await emailLookupHash('just-saved@example.com', SECRET));
    expect(saved.phone_hash).toBe(await phoneLookupHash('(512) 555-0142', SECRET));
    expect(rows.find((r) => r.id === 'old')!.hashes).toBeUndefined();
    expect(rows.find((r) => r.id === 'theirs')!.hashes).toBeUndefined();
  });

  it('reports complete once nothing is left', async () => {
    const deps = setup([row('a', AGENT), row('b', AGENT)]);
    expect(await hashUnhashedContacts(deps, AGENT, 40)).toMatchObject({
      hashed: 2,
      complete: true,
    });
    expect(await hashUnhashedContacts(deps, AGENT, 40)).toMatchObject({
      hashed: 0,
      complete: true,
    });
  });

  it('still marks a contact with no email or phone as hashed (null fingerprints)', async () => {
    const rows = [row('bare', AGENT, { encrypted_email: null })];
    await hashUnhashedContacts(setup(rows), AGENT, 40);
    expect(rows[0].hashes).toEqual({ email_hash: null, phone_hash: null });
  });

  it('counts a failed save without abandoning the rest of the batch', async () => {
    const rows = [row('a', AGENT), row('b', AGENT), row('c', AGENT)];
    const result = await hashUnhashedContacts(
      setup(rows, { failSaveFor: new Set(['b']) }),
      AGENT,
      40,
      2
    );
    expect(result).toMatchObject({ hashed: 2, failed: 1 });
    expect(result.errors).toEqual([expect.stringContaining('b: write failed')]);
    // The error names the row, never its plaintext.
    expect(result.errors.join(' ')).not.toContain('@example.com');
    expect(rows.find((r) => r.id === 'b')!.hashes).toBeUndefined();
  });
});

describe('hashContactBacklog (US-640, scheduled-maintenance)', () => {
  it("works through every agent's unhashed contacts in batches", async () => {
    const rows = [
      ...Array.from({ length: 7 }, (_, i) => row(`a${i}`, AGENT)),
      ...Array.from({ length: 5 }, (_, i) => row(`o${i}`, OTHER)),
    ];
    const deps = setup(rows);

    const report = await hashContactBacklog(deps, { limit: 100, batch: 4 });

    expect(report).toMatchObject({ hashed: 12, failed: 0, complete: true });
    expect(rows.every((r) => r.hashes)).toBe(true);
    expect(deps.loadUnhashedContacts).toHaveBeenCalledWith(null, expect.any(Number));
  });

  it('stops at the per-run limit and says more remain', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(`a${i}`, AGENT));
    const report = await hashContactBacklog(setup(rows), { limit: 6, batch: 4 });
    expect(report).toMatchObject({ hashed: 6, complete: false });
    expect(rows.filter((r) => r.hashes)).toHaveLength(6);
    expect(summarizeContactHashReport(report)).toBe('hashed 6, failed 0, more remain');
  });

  it('does not spin on rows that keep failing', async () => {
    const rows = [row('a', AGENT), row('b', AGENT)];
    const deps = setup(rows, { failSaveFor: new Set(['a', 'b']) });
    const report = await hashContactBacklog(deps, { limit: 100, batch: 10 });
    expect(report).toMatchObject({ hashed: 0, failed: 2, complete: false });
    expect(deps.loadUnhashedContacts).toHaveBeenCalledTimes(1);
  });
});
