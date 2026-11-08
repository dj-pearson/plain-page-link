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
 * There is no SQL backfill (the key is not in the database). Contacts are
 * hashed when they are written (pii-crypto index_contacts) and by
 * scheduled-maintenance (US-640); as a last resort this still hashes a bounded
 * batch of the caller's never-hashed contacts before matching, and says
 * whether any remain, so the client can ask again. A contact's fingerprints are cleared by trigger
 * whenever its ciphertext changes (20261108000629), so edited contacts come
 * back through here too.
 *
 * A locked lead (past the plan's allowance) is never matched: telling the
 * agent "this locked lead is your client Dana" would identify it without the
 * upgrade.
 *
 * No Deno globals, so vitest covers it (contactMatch.test.ts).
 */
import {
  hashUnhashedContacts,
  lookupHashes,
  type ContactHashDeps,
  type ContactHashes,
  type UnhashedContactRow,
} from '../_shared/contact-lookup-hashes.ts';

export { lookupHashes };
export type { ContactHashes, UnhashedContactRow };

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

export interface ContactMatchDeps extends ContactHashDeps {
  loadLead(leadId: string): Promise<MatchLeadRow | null>;
  isLeadLocked(ownerId: string, leadId: string): Promise<boolean>;
  findCandidates(userId: string, hashes: ContactHashes): Promise<CandidateRow[]>;
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

  // A row that fails to hash stays unhashed and is retried next call (or by
  // scheduled-maintenance); it does not stop the match.
  const hashing = await hashUnhashedContacts(deps, callerId, batch);

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
    complete: hashing.complete,
  };
}
