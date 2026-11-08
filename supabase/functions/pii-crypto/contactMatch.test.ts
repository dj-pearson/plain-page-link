import { describe, it, expect, vi } from 'vitest';
import {
  lookupHashes,
  matchContactsForLead,
  type CandidateRow,
  type ContactHashes,
  type ContactMatchDeps,
  type MatchLeadRow,
  type UnhashedContactRow,
} from './contactMatch';
import { emailLookupHash, phoneLookupHash } from '../_shared/spam-guard';

const SECRET = 'test-secret-at-least-16-chars';
const AGENT = '11111111-1111-4111-8111-111111111111';
const TEAMMATE = '22222222-2222-4222-8222-222222222222';
const STRANGER = '33333333-3333-4333-8333-333333333333';
const LEAD = '44444444-4444-4444-8444-444444444444';

/** "Ciphertext" is the plaintext behind a prefix, so decrypt is a strip. */
const enc = (v: string) => `enc:${v}`;

interface StoredContact extends ContactHashes {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  lead_id: string | null;
  encrypted_email: string | null;
  encrypted_phone: string | null;
  updated_at: string;
  hashed: boolean;
}

function contact(
  id: string,
  over: Partial<StoredContact> & { email?: string; phone?: string } = {}
): StoredContact {
  const { email, phone, ...rest } = over;
  return {
    id,
    user_id: AGENT,
    first_name: id,
    last_name: null,
    lead_id: null,
    encrypted_email: email ? enc(email) : null,
    encrypted_phone: phone ? enc(phone) : null,
    updated_at: '2026-11-01T00:00:00Z',
    email_hash: null,
    phone_hash: null,
    hashed: false,
    ...rest,
  };
}

function setup(opts: {
  lead?: Partial<MatchLeadRow> | null;
  locked?: boolean;
  contacts?: StoredContact[];
}) {
  const contacts = opts.contacts ?? [];
  const lead: MatchLeadRow | null =
    opts.lead === null
      ? null
      : {
          id: LEAD,
          user_id: AGENT,
          assigned_to: null,
          encrypted_email: enc('dana@example.com'),
          encrypted_phone: enc('(512) 555-0142'),
          ...opts.lead,
        };
  const deps: ContactMatchDeps = {
    hashSecret: SECRET,
    decrypt: vi.fn(async (v: string | null) => (v ? v.replace(/^enc:/, '') : null)),
    loadLead: vi.fn(async () => lead),
    isLeadLocked: vi.fn(async () => !!opts.locked),
    loadUnhashedContacts: vi.fn(async (userId: string, limit: number) =>
      contacts
        .filter((c) => c.user_id === userId && !c.hashed)
        .slice(0, limit)
        .map(
          (c): UnhashedContactRow => ({
            id: c.id,
            encrypted_email: c.encrypted_email,
            encrypted_phone: c.encrypted_phone,
            updated_at: c.updated_at,
          })
        )
    ),
    saveContactHashes: vi.fn(async (row: UnhashedContactRow, hashes: ContactHashes) => {
      const c = contacts.find((x) => x.id === row.id && x.updated_at === row.updated_at);
      if (!c) return;
      Object.assign(c, hashes, { hashed: true });
    }),
    findCandidates: vi.fn(async (userId: string, hashes: ContactHashes) =>
      contacts
        .filter(
          (c) =>
            c.user_id === userId &&
            ((hashes.email_hash && c.email_hash === hashes.email_hash) ||
              (hashes.phone_hash && c.phone_hash === hashes.phone_hash))
        )
        .map(
          (c): CandidateRow => ({
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            lead_id: c.lead_id,
            email_hash: c.email_hash,
            phone_hash: c.phone_hash,
          })
        )
    ),
  };
  return { deps, contacts };
}

describe('lookupHashes (US-629)', () => {
  it("uses the leads' key labels, so a contact hash equals a lead hash for the same details", async () => {
    const h = await lookupHashes('Dana@Example.com ', '512.555.0142', SECRET);
    expect(h.email_hash).toBe(await emailLookupHash('dana@example.com', SECRET));
    expect(h.phone_hash).toBe(await phoneLookupHash('(512) 555-0142', SECRET));
  });

  it('is null for a missing or unusable detail', async () => {
    expect(await lookupHashes(null, '12', SECRET)).toEqual({ email_hash: null, phone_hash: null });
  });
});

describe('matchContactsForLead (US-629)', () => {
  it('finds a contact the agent typed in by hand with the same email, however it was cased', async () => {
    const { deps } = setup({
      contacts: [contact('dana', { email: 'DANA@example.com' }), contact('other', { email: 'x@y.z' })],
    });
    const result = await matchContactsForLead(deps, AGENT, LEAD);
    expect(result).toEqual({
      status: 'ok',
      complete: true,
      matches: [
        { id: 'dana', first_name: 'dana', last_name: null, lead_id: null, matched_on: 'email' },
      ],
    });
  });

  it('matches on phone however the number was written, and ranks email matches first', async () => {
    const { deps } = setup({
      contacts: [
        contact('spouse', { phone: '+1 512 555 0142' }),
        contact('dana', { email: 'dana@example.com', phone: '5125550142' }),
        contact('past', { email: 'dana@example.com', lead_id: 'older-lead' }),
      ],
    });
    const result = await matchContactsForLead(deps, AGENT, LEAD);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.matches.map((m) => [m.id, m.matched_on])).toEqual([
      ['dana', 'email_and_phone'],
      ['past', 'email'],
      ['spouse', 'phone'],
    ]);
    expect(result.matches[1].lead_id).toBe('older-lead');
  });

  it("never matches another agent's contacts", async () => {
    const { deps } = setup({
      contacts: [contact('theirs', { email: 'dana@example.com', user_id: STRANGER })],
    });
    const result = await matchContactsForLead(deps, AGENT, LEAD);
    expect(result).toMatchObject({ status: 'ok', matches: [] });
    expect(deps.loadUnhashedContacts).toHaveBeenCalledWith(AGENT, expect.any(Number));
  });

  it('hashes a bounded batch per call and reports when more remain', async () => {
    const many = Array.from({ length: 5 }, (_, i) => contact(`c${i}`, { email: `p${i}@x.io` }));
    many.push(contact('dana', { email: 'dana@example.com' }));
    const { deps, contacts } = setup({ contacts: many });

    const first = await matchContactsForLead(deps, AGENT, LEAD, 4);
    expect(first).toMatchObject({ status: 'ok', complete: false, matches: [] });
    expect(contacts.filter((c) => c.hashed)).toHaveLength(4);

    const second = await matchContactsForLead(deps, AGENT, LEAD, 4);
    expect(second).toMatchObject({ status: 'ok', complete: true });
    if (second.status === 'ok') expect(second.matches.map((m) => m.id)).toEqual(['dana']);
    expect(contacts.every((c) => c.hashed)).toBe(true);
  });

  it('hashes nothing when the lead has no detail to match on', async () => {
    const { deps } = setup({
      lead: { encrypted_email: null, encrypted_phone: null },
      contacts: [contact('dana', { email: 'dana@example.com' })],
    });
    expect(await matchContactsForLead(deps, AGENT, LEAD)).toEqual({
      status: 'ok',
      matches: [],
      complete: true,
    });
    expect(deps.loadUnhashedContacts).not.toHaveBeenCalled();
  });

  it('refuses a locked lead before decrypting or matching anything', async () => {
    const { deps } = setup({ locked: true, contacts: [contact('dana', { email: 'dana@example.com' })] });
    expect(await matchContactsForLead(deps, AGENT, LEAD)).toEqual({ status: 'locked' });
    expect(deps.decrypt).not.toHaveBeenCalled();
    expect(deps.findCandidates).not.toHaveBeenCalled();
  });

  it("checks the lock against the lead owner's plan when a teammate converts", async () => {
    const { deps } = setup({ lead: { assigned_to: TEAMMATE } });
    await matchContactsForLead(deps, TEAMMATE, LEAD);
    expect(deps.isLeadLocked).toHaveBeenCalledWith(AGENT, LEAD);
    expect(deps.loadUnhashedContacts).toHaveBeenCalledWith(TEAMMATE, expect.any(Number));
  });

  it('treats a lead the caller neither owns nor is assigned as absent', async () => {
    const { deps } = setup({});
    expect(await matchContactsForLead(deps, STRANGER, LEAD)).toEqual({ status: 'not_found' });
    expect(deps.isLeadLocked).not.toHaveBeenCalled();

    const missing = setup({ lead: null });
    expect(await matchContactsForLead(missing.deps, AGENT, LEAD)).toEqual({ status: 'not_found' });
  });
});
