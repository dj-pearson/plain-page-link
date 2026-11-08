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
  return {
    status: 'ok',
    matches: rankMatches(candidates, leadHashes),
    complete: hashing.complete,
  };
}

/**
 * The candidates that really share the email or phone in `hashes`, strongest
 * match first, at most MAX_MATCHES. Shared by both match ops.
 */
export function rankMatches(candidates: CandidateRow[], hashes: ContactHashes): ContactMatch[] {
  const matches: ContactMatch[] = [];
  for (const c of candidates) {
    const byEmail = !!hashes.email_hash && c.email_hash === hashes.email_hash;
    const byPhone = !!hashes.phone_hash && c.phone_hash === hashes.phone_hash;
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
  return matches.slice(0, MAX_MATCHES);
}

// ---------------------------------------------------------------------------
// US-670 (US-641): the same check for details the agent types in by hand.
// ---------------------------------------------------------------------------

/** Longest email (RFC 5321) and a generous phone; anything longer is refused. */
export const MAX_EMAIL_LENGTH = 320;
export const MAX_PHONE_LENGTH = 40;

export interface DetailsCandidateRow extends CandidateRow {
  encrypted_email: string | null;
  encrypted_phone: string | null;
}

export interface DetailsMatchDeps extends ContactHashDeps {
  findCandidates(userId: string, hashes: ContactHashes): Promise<DetailsCandidateRow[]>;
  /**
   * Ids of the rows holding a copy of one of the caller's locked leads'
   * ciphertext (contactLock.ts). Throws when it cannot tell.
   */
  copiedFromLockedLeads(userId: string, rows: DetailsCandidateRow[]): Promise<Set<string>>;
}

export interface DetailsInput {
  email: string | null;
  phone: string | null;
  /** The contact being edited, which trivially matches itself. */
  excludeContactId: string | null;
}

export interface DetailsMatchResult {
  matches: ContactMatch[];
  complete: boolean;
}

/**
 * Which of the caller's own contacts already have this email or phone.
 *
 * Not an oracle: the plaintext is the caller's own typing, and only the
 * caller's contacts are compared, which they can already open with
 * decrypt_contacts. The exception is a contact holding a copy of a locked
 * lead's ciphertext (US-254), which decrypt_contacts refuses; it is never
 * reported here either, or typing guesses would confirm the locked lead's
 * details. If that check cannot be made, nothing is reported: a missed
 * duplicate warning costs less than a leak.
 */
export async function matchContactsForDetails(
  deps: DetailsMatchDeps,
  callerId: string,
  input: DetailsInput,
  batch = HASH_BATCH
): Promise<DetailsMatchResult> {
  const hashes = await lookupHashes(input.email, input.phone, deps.hashSecret);
  if (!hashes.email_hash && !hashes.phone_hash) {
    return { matches: [], complete: true };
  }

  // The contact just saved elsewhere, or one never hashed, is fingerprinted
  // here first, a bounded batch per call, as for a lead.
  const hashing = await hashUnhashedContacts(deps, callerId, batch);
  const candidates = (await deps.findCandidates(callerId, hashes)).filter(
    (c) => c.id !== input.excludeContactId
  );
  if (candidates.length === 0) {
    return { matches: [], complete: hashing.complete };
  }

  let copied: Set<string>;
  try {
    copied = await deps.copiedFromLockedLeads(callerId, candidates);
  } catch {
    return { matches: [], complete: true };
  }
  return {
    matches: rankMatches(
      candidates.filter((c) => !copied.has(c.id)),
      hashes
    ),
    complete: hashing.complete,
  };
}

export type DetailsBodyResult = { ok: true; input: DetailsInput } | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalText(value: unknown, max: number, name: string): string | null | Error {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return new Error(`${name} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) return new Error(`${name} is too long`);
  return trimmed || null;
}

/** Validates the request body of match_contacts_for_details. */
export function parseDetailsBody(body: {
  email?: unknown;
  phone?: unknown;
  excludeContactId?: unknown;
}): DetailsBodyResult {
  const email = optionalText(body.email, MAX_EMAIL_LENGTH, 'email');
  if (email instanceof Error) return { ok: false, message: email.message };
  const phone = optionalText(body.phone, MAX_PHONE_LENGTH, 'phone');
  if (phone instanceof Error) return { ok: false, message: phone.message };
  if (!email && !phone) return { ok: false, message: 'email or phone is required' };

  const exclude = body.excludeContactId;
  if (exclude === undefined || exclude === null) {
    return { ok: true, input: { email, phone, excludeContactId: null } };
  }
  if (typeof exclude !== 'string' || !UUID_RE.test(exclude)) {
    return { ok: false, message: 'excludeContactId must be a uuid' };
  }
  return { ok: true, input: { email, phone, excludeContactId: exclude } };
}
