/**
 * US-629 (US-620 slice 1): which of the caller's contacts a lead already is.
 *
 * "Add to clients" used to look for an existing contact by contacts.lead_id
 * only, so a past client's new enquiry — or a lead whose person the agent had
 * typed in by hand — became a second client record. Contact details are
 * ciphertext with a random IV, so the match goes through the keyed lookup
 * fingerprints instead: contacts.email_hash / phone_hash, computed here under
 * the same key labels as leads' (_shared/spam-guard.ts), so equal hashes mean
 * equal addresses or numbers.
 *
 * There is no SQL backfill (the key is not in the database). Before matching,
 * this hashes a bounded batch of the caller's contacts that have never been
 * hashed, and says whether any remain, so the client can ask again until the
 * whole sphere is covered. A contact's fingerprints are cleared by trigger
 * whenever its ciphertext changes (20261108000629), so edited contacts come
 * back through here too.
 *
 * A locked lead (past the plan's allowance) is never matched: telling the
 * agent "this locked lead is your client Dana" would identify it without the
 * upgrade.
 *
 * No Deno globals, so vitest covers it (contactMatch.test.ts).
 */
import { emailLookupHash, phoneLookupHash } from '../_shared/spam-guard.ts';

/** Contacts hashed per call: up to two 100k-iteration PBKDF2 decrypts each. */
export const HASH_BATCH = 40;

/** At most this many candidates are returned; more is a data problem, not a choice. */
export const MAX_MATCHES = 5;

export interface MatchLeadRow {
  id: string;
  user_id: string;
  assigned_to: string | null;
  encrypted_email: string | null;
  encrypted_phone: string | null;
}

export interface UnhashedContactRow {
  id: string;
  encrypted_email: string | null;
  encrypted_phone: string | null;
  updated_at: string;
}

export interface ContactHashes {
  email_hash: string | null;
  phone_hash: string | null;
}

export interface CandidateRow extends ContactHashes {
  id: string;
  first_name: string;
  last_name: string | null;
  lead_id: string | null;
}

export interface ContactMatch {
  id: string;
  first_name: string;
  last_name: string | null;
  /** The lead this contact is already linked to, if any. */
  lead_id: string | null;
  matched_on: 'email' | 'phone' | 'email_and_phone';
}

export type MatchResult =
  | { status: 'not_found' }
  | { status: 'locked' }
  | { status: 'ok'; matches: ContactMatch[]; complete: boolean };

export interface ContactMatchDeps {
  hashSecret: string;
  /** Plaintext, or null when the value is empty or will not decrypt. */
  decrypt(value: string | null): Promise<string | null>;
  loadLead(leadId: string): Promise<MatchLeadRow | null>;
  isLeadLocked(ownerId: string, leadId: string): Promise<boolean>;
  /** Up to `limit` of the user's contacts with no lookup_hashed_at. */
  loadUnhashedContacts(userId: string, limit: number): Promise<UnhashedContactRow[]>;
  /** Stores the fingerprints, unless the row changed since it was read. */
  saveContactHashes(row: UnhashedContactRow, hashes: ContactHashes): Promise<void>;
  findCandidates(userId: string, hashes: ContactHashes): Promise<CandidateRow[]>;
}

/** Both fingerprints of a plaintext email/phone pair. */
export async function lookupHashes(
  email: string | null,
  phone: string | null,
  secret: string
): Promise<ContactHashes> {
  const [emailHash, phoneHash] = await Promise.all([
    email ? emailLookupHash(email, secret) : Promise.resolve(null),
    phone ? phoneLookupHash(phone, secret) : Promise.resolve(null),
  ]);
  return { email_hash: emailHash, phone_hash: phoneHash };
}

export async function matchContactsForLead(
  deps: ContactMatchDeps,
  callerId: string,
  leadId: string,
  batch = HASH_BATCH
): Promise<MatchResult> {
  const lead = await deps.loadLead(leadId);
  // The lead's owner, or the teammate it is assigned to (US-226) — the same
  // rows decrypt_leads opens. Anything else reads as absent.
  if (!lead || (lead.user_id !== callerId && lead.assigned_to !== callerId)) {
    return { status: 'not_found' };
  }
  if (await deps.isLeadLocked(lead.user_id, lead.id)) {
    return { status: 'locked' };
  }

  const [email, phone] = await Promise.all([
    deps.decrypt(lead.encrypted_email),
    deps.decrypt(lead.encrypted_phone),
  ]);
  const leadHashes = await lookupHashes(email, phone, deps.hashSecret);
  if (!leadHashes.email_hash && !leadHashes.phone_hash) {
    // Nothing to match on; no point hashing the sphere for it.
    return { status: 'ok', matches: [], complete: true };
  }

  // One more than the batch tells us whether any remain after this call.
  const unhashed = await deps.loadUnhashedContacts(callerId, batch + 1);
  const toHash = unhashed.slice(0, batch);
  await Promise.all(
    toHash.map(async (row) => {
      const [contactEmail, contactPhone] = await Promise.all([
        deps.decrypt(row.encrypted_email),
        deps.decrypt(row.encrypted_phone),
      ]);
      await deps.saveContactHashes(
        row,
        await lookupHashes(contactEmail, contactPhone, deps.hashSecret)
      );
    })
  );

  const candidates = await deps.findCandidates(callerId, leadHashes);
  const matches: ContactMatch[] = [];
  for (const c of candidates) {
    const byEmail = !!leadHashes.email_hash && c.email_hash === leadHashes.email_hash;
    const byPhone = !!leadHashes.phone_hash && c.phone_hash === leadHashes.phone_hash;
    if (!byEmail && !byPhone) continue;
    matches.push({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      lead_id: c.lead_id,
      matched_on: byEmail && byPhone ? 'email_and_phone' : byEmail ? 'email' : 'phone',
    });
  }
  // An email match is stronger than a shared household number.
  const rank = { email_and_phone: 0, email: 1, phone: 2 } as const;
  matches.sort((a, b) => rank[a.matched_on] - rank[b.matched_on]);

  return {
    status: 'ok',
    matches: matches.slice(0, MAX_MATCHES),
    complete: unhashed.length <= batch,
  };
}
