/**
 * PII encrypt/decrypt for the frontend (US-066).
 *
 * The browser used to do this itself, deriving its key from
 * VITE_PII_ENCRYPTION_KEY. Vite inlines every VITE_-prefixed value into the
 * production bundle, so the AES-256-GCM key protecting leads.encrypted_email
 * and leads.encrypted_phone was publicly downloadable — the ciphertext was
 * obfuscation, not encryption. The key now lives only here, as the
 * PII_ENCRYPTION_KEY function secret.
 *
 * The envelope is unchanged. _shared/encryption.ts and the old src/lib/pii.ts
 * produce byte-identical `enc:v1:` values — same PBKDF2-SHA256 at 100k
 * iterations, same 16-byte salt prepended to the 12-byte IV, same
 * base64-of-JSON serialization — so every value written under the old scheme
 * decrypts here unchanged, provided PII_ENCRYPTION_KEY is set to what
 * VITE_PII_ENCRYPTION_KEY used to hold. See docs/deploy/DEPLOYMENT.md.
 *
 * Batched deliberately: the leads list decrypts two fields per row, and a
 * request per field would make the dashboard unusable. The client also
 * short-circuits locally on values that need no work (empty, or lacking the
 * `enc:v1:` prefix), so a page of not-yet-backfilled plaintext rows makes no
 * request at all.
 *
 * US-119: it WAS an oracle. `decrypt` took up to 200 arbitrary ciphertexts from
 * the request body and returned their plaintext to any valid JWT — no check
 * that the caller had ever been able to read those rows. That mattered because
 * audit_table_change stores to_jsonb(NEW) for `leads`, so audit_logs holds a
 * copy of every ciphertext ever written; anything that could obtain one could
 * bring it here to be opened.
 *
 * Decryption is now addressed by row id, not by value: the caller names lead
 * ids (or asks for their own profile), the function reads those rows with the
 * service role, filters to the ones the caller owns, and decrypts what it read.
 * A ciphertext the caller cannot select is a ciphertext this function will not
 * open, and there is no longer any way to hand it one.
 *
 * Encryption still accepts values, which is not an oracle: it produces
 * ciphertext for the caller's own data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  successResponse,
  errorResponse,
  handleUnexpectedError,
  rateLimitResponse,
  unauthorizedResponse,
  methodNotAllowedResponse,
} from '../_shared/response.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { encryptSecret, decryptSecret } from '../_shared/encryption.ts';
import { contactsCopiedFromLockedLeads } from './contactLock.ts';
import {
  matchContactsForLead,
  matchContactsForDetails,
  parseDetailsBody,
  HASH_BATCH,
} from './contactMatch.ts';
import {
  hashUnhashedContacts,
  supabaseContactHashStore,
} from '../_shared/contact-lookup-hashes.ts';

// One page of leads decrypts 2 fields x 50 rows. 200 leaves headroom without
// letting a single request pin a worker on PBKDF2 — each value is a separate
// 100k-iteration derivation.
const MAX_VALUES = 200;

/** One page of leads is 50 rows; 100 leaves headroom for a wider view. */
const MAX_ROWS = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Op =
  | 'encrypt'
  | 'decrypt_leads'
  | 'decrypt_contacts'
  | 'decrypt_profile'
  | 'match_contacts_for_lead'
  | 'match_contacts_for_details'
  | 'index_contacts';

export default async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return methodNotAllowedResponse(req, ['POST']);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return unauthorizedResponse(req, 'Authentication required');
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return unauthorizedResponse(req, 'Authentication required');
    }

    // Keyed on the user rather than the IP: this is an authenticated endpoint,
    // and several agents behind one office NAT should not share a budget.
    const rateLimit = await checkRateLimitDb(
      supabase,
      `user:${user.id}`,
      'pii-crypto',
      RATE_LIMITS.general
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds, req, 'Too many requests.');
    }

    const body = (await req.json()) as {
      op?: Op;
      values?: unknown;
      leadIds?: unknown;
      contactIds?: unknown;
      leadId?: unknown;
      email?: unknown;
      phone?: unknown;
      excludeContactId?: unknown;
    };
    const op = body.op;

    if (
      op !== 'encrypt' &&
      op !== 'decrypt_leads' &&
      op !== 'decrypt_contacts' &&
      op !== 'decrypt_profile' &&
      op !== 'match_contacts_for_lead' &&
      op !== 'match_contacts_for_details' &&
      op !== 'index_contacts'
    ) {
      return errorResponse(
        "op must be 'encrypt', 'decrypt_leads', 'decrypt_contacts', 'decrypt_profile', 'match_contacts_for_lead', 'match_contacts_for_details' or 'index_contacts'",
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }

    // ---------------------------------------------------------------------
    // decrypt_profile — the caller's own row, nothing else.
    // ---------------------------------------------------------------------
    if (op === 'decrypt_profile') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return errorResponse('Could not read the profile', 'PROFILE_READ_FAILED', req, 502);
      }

      let phone: string | null = profile?.phone ?? null;
      try {
        phone = (await decryptSecret(phone)) ?? null;
      } catch {
        // A value that will not decrypt (corrupt, or written under a rotated
        // key) comes back untouched, matching what the old client did.
      }

      return successResponse({ phone }, req);
    }

    // Shared by match_contacts_for_lead and index_contacts: the fingerprint
    // key, a decrypt that turns anything unopenable into "nothing to hash",
    // and the service-role reads/writes of contacts' lookup columns.
    const hashSecret = Deno.env.get('PII_ENCRYPTION_KEY') ?? Deno.env.get('ENCRYPTION_KEY');
    const decryptForHash = async (value: string | null): Promise<string | null> => {
      if (!value) return null;
      try {
        const plain = (await decryptSecret(value)) ?? null;
        // A value that will not open (corrupt, rotated key) has nothing to
        // fingerprint.
        return plain && !plain.startsWith('enc:v1:') ? plain : null;
      } catch {
        return null;
      }
    };
    const hashStore = supabaseContactHashStore(supabase);

    // ---------------------------------------------------------------------
    // index_contacts — fingerprint the caller's contacts that have none yet
    // (US-640), newest edits first, so the contact the dashboard just
    // created or edited is hashed within that one request.
    // scheduled-maintenance covers the rest of the sphere in the background.
    // `complete: false` means more remain; the client need not wait for them.
    // ---------------------------------------------------------------------
    if (op === 'index_contacts') {
      if (!hashSecret) {
        return errorResponse('Indexing is not configured', 'MATCH_UNAVAILABLE', req, 503);
      }
      const result = await hashUnhashedContacts(
        { hashSecret, decrypt: decryptForHash, ...hashStore },
        user.id,
        HASH_BATCH
      );
      if (result.failed > 0) {
        console.error(
          `[pii-crypto] index_contacts: ${result.failed} not saved: ${result.errors.slice(0, 3).join('; ')}`
        );
      }
      return successResponse(
        { hashed: result.hashed, failed: result.failed, complete: result.complete },
        req
      );
    }

    // ---------------------------------------------------------------------
    // match_contacts_for_details — which of the caller's contacts already
    // have the email or phone the agent is typing into the client form
    // (US-670), so a second record for one person is caught before it is
    // saved. The caller's own plaintext, compared only with the caller's own
    // contacts; see matchContactsForDetails for why that is not an oracle.
    // ---------------------------------------------------------------------
    if (op === 'match_contacts_for_details') {
      const parsed = parseDetailsBody(body);
      if (!parsed.ok) {
        return errorResponse(parsed.message, 'REQUEST_VALIDATION_FAILED', req, 400);
      }
      if (!hashSecret) {
        return errorResponse('Matching is not configured', 'MATCH_UNAVAILABLE', req, 503);
      }
      const result = await matchContactsForDetails(
        {
          hashSecret,
          decrypt: decryptForHash,
          ...hashStore,
          findCandidates: async (userId, hashes) => {
            const clauses = [
              hashes.email_hash ? `email_hash.eq.${hashes.email_hash}` : null,
              hashes.phone_hash ? `phone_hash.eq.${hashes.phone_hash}` : null,
            ].filter(Boolean);
            const { data, error } = await supabase
              .from('contacts')
              .select(
                'id, first_name, last_name, lead_id, email_hash, phone_hash, encrypted_email, encrypted_phone'
              )
              .eq('user_id', userId)
              .or(clauses.join(','))
              .limit(20);
            if (error) throw error;
            return data ?? [];
          },
          copiedFromLockedLeads: (userId, rows) =>
            contactsCopiedFromLockedLeads(
              { rpc: (fn, args) => supabase.rpc(fn, args) },
              userId,
              rows,
              // Fail closed: matchContactsForDetails then reports nothing.
              (lockError) => {
                throw lockError;
              }
            ),
        },
        user.id,
        parsed.input
      );
      return successResponse({ matches: result.matches, complete: result.complete }, req);
    }

    // ---------------------------------------------------------------------
    // match_contacts_for_lead — which of the caller's contacts this lead
    // already is (US-629), by keyed fingerprint. Hashes a batch of the
    // caller's not-yet-hashed contacts first; `complete: false` asks the
    // client to call again. See contactMatch.ts.
    // ---------------------------------------------------------------------
    if (op === 'match_contacts_for_lead') {
      const leadId = body.leadId;
      if (typeof leadId !== 'string' || !UUID_RE.test(leadId)) {
        return errorResponse('leadId must be a uuid', 'REQUEST_VALIDATION_FAILED', req, 400);
      }
      if (!hashSecret) {
        return errorResponse('Matching is not configured', 'MATCH_UNAVAILABLE', req, 503);
      }

      const result = await matchContactsForLead(
        {
          hashSecret,
          decrypt: decryptForHash,
          loadLead: async (id) => {
            const { data, error } = await supabase
              .from('leads')
              .select('id, user_id, assigned_to, encrypted_email, encrypted_phone')
              .eq('id', id)
              .maybeSingle();
            if (error) throw error;
            return data;
          },
          isLeadLocked: async (ownerId, id) => {
            const { data, error } = await supabase.rpc('locked_lead_ids', {
              _user_id: ownerId,
              _lead_ids: [id],
            });
            // Fail closed here, unlike decrypt_leads: a missed match only
            // means the agent sees "Add to clients" without the suggestion.
            if (error) return true;
            return ((data ?? []) as string[]).includes(id);
          },
          ...hashStore,
          findCandidates: async (userId, hashes) => {
            const clauses = [
              hashes.email_hash ? `email_hash.eq.${hashes.email_hash}` : null,
              hashes.phone_hash ? `phone_hash.eq.${hashes.phone_hash}` : null,
            ].filter(Boolean);
            const { data, error } = await supabase
              .from('contacts')
              .select('id, first_name, last_name, lead_id, email_hash, phone_hash')
              .eq('user_id', userId)
              .or(clauses.join(','))
              .limit(20);
            if (error) throw error;
            return data ?? [];
          },
        },
        user.id,
        leadId
      );

      if (result.status === 'not_found') {
        return errorResponse('Lead not found', 'LEAD_NOT_FOUND', req, 404);
      }
      if (result.status === 'locked') {
        return successResponse({ matches: [], complete: true, locked: true }, req);
      }
      return successResponse({ matches: result.matches, complete: result.complete }, req);
    }

    // ---------------------------------------------------------------------
    // decrypt_leads / decrypt_contacts — by id, filtered to rows the caller
    // owns. Contacts (the agent's sphere) follow the leads model exactly: the
    // same two encrypted columns, the same ownership filter.
    // ---------------------------------------------------------------------
    if (op === 'decrypt_leads' || op === 'decrypt_contacts') {
      const idsField = op === 'decrypt_leads' ? 'leadIds' : 'contactIds';
      const table = op === 'decrypt_leads' ? 'leads' : 'contacts';
      const resultKey = op === 'decrypt_leads' ? 'leads' : 'contacts';
      const requested = op === 'decrypt_leads' ? body.leadIds : body.contactIds;

      if (!Array.isArray(requested)) {
        return errorResponse(`${idsField} must be an array`, 'REQUEST_VALIDATION_FAILED', req, 400);
      }
      if (requested.length > MAX_ROWS) {
        return errorResponse(
          `${idsField} may contain at most ${MAX_ROWS} entries`,
          'REQUEST_VALIDATION_FAILED',
          req,
          400
        );
      }
      if (!requested.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
        return errorResponse(`${idsField} must be uuids`, 'REQUEST_VALIDATION_FAILED', req, 400);
      }

      const rowIds = requested as string[];
      if (rowIds.length === 0) {
        return successResponse({ [resultKey]: [] }, req);
      }

      // The ownership filter is the control. The service-role client bypasses
      // RLS, so without `.eq('user_id', user.id)` this would open any row whose
      // id the caller could guess or read from an audit entry.
      //
      // US-226: a lead also opens for the teammate it is assigned to — RLS
      // lets them read the row, and routing assigns it so they can call. The
      // id comes from the verified JWT, so it is safe in the filter string.
      const ownership =
        op === 'decrypt_leads' ? `user_id.eq.${user.id},assigned_to.eq.${user.id}` : `user_id.eq.${user.id}`;
      const { data: rows, error } = await supabase
        .from(table)
        .select('id, user_id, encrypted_email, encrypted_phone')
        .in('id', rowIds)
        .or(ownership);

      if (error) {
        return errorResponse(`Could not read those ${table}`, 'LEAD_READ_FAILED', req, 502);
      }

      const decryptOne = async (value: string | null) => {
        try {
          return (await decryptSecret(value)) ?? null;
        } catch {
          return value ?? null;
        }
      };

      // Leads past the plan's monthly allowance are captured but not opened
      // (20260923000003): their contact details stay sealed until the agent
      // upgrades or the month turns. This is the gate — the dashboard only
      // draws the blur. Contacts are the agent's own entries and never lock —
      // unless they carry a locked lead's ciphertext (US-254, below).
      // The allowance is the lead OWNER's, so assigned leads are checked
      // against their owner's plan, one call per owner.
      const locked = new Set<string>();
      if (op === 'decrypt_leads' && (rows ?? []).length > 0) {
        const byOwner = new Map<string, string[]>();
        for (const row of rows ?? []) {
          const owner = row.user_id as string;
          byOwner.set(owner, [...(byOwner.get(owner) ?? []), row.id as string]);
        }
        for (const [owner, ids] of byOwner) {
          const { data: lockedIds, error: lockError } = await supabase.rpc('locked_lead_ids', {
            _user_id: owner,
            _lead_ids: ids,
          });
          if (lockError) {
            // Fail open: a transient database error must not blank every lead
            // an agent has. The allowance is a paywall, not a security boundary.
            console.error('[pii-crypto] locked_lead_ids failed; returning details unlocked', lockError);
          } else {
            for (const id of (lockedIds ?? []) as string[]) locked.add(id);
          }
        }
      }

      // US-254: contacts do not lock on their own, but a contact holding a
      // locked lead's ciphertext — copied across by the owner — would open
      // that lead's details here. Refuse those. Contacts are filtered to the
      // caller's rows above, so the owner is the caller.
      if (op === 'decrypt_contacts' && (rows ?? []).length > 0) {
        const copied = await contactsCopiedFromLockedLeads(
          { rpc: (fn, args) => supabase.rpc(fn, args) },
          user.id,
          (rows ?? []).map((row) => ({
            id: row.id as string,
            encrypted_email: row.encrypted_email as string | null,
            encrypted_phone: row.encrypted_phone as string | null,
          })),
          (lockError) =>
            console.error('[pii-crypto] locked_lead_ciphertexts failed; returning contacts unchecked', lockError)
        );
        for (const id of copied) locked.add(id);
      }

      const decrypted = await Promise.all(
        (rows ?? []).map(async (row) => {
          const id = row.id as string;
          if (locked.has(id)) {
            return { id, email: null, phone: null, locked: true };
          }
          return {
            id,
            email: await decryptOne(row.encrypted_email as string | null),
            phone: await decryptOne(row.encrypted_phone as string | null),
          };
        })
      );

      // Ids the caller does not own are simply absent from the result. The
      // client zips by id, so a missing row reads as "no contact details"
      // rather than shifting anything.
      return successResponse({ [resultKey]: decrypted }, req);
    }

    // ---------------------------------------------------------------------
    // encrypt — values, because the caller is encrypting their own data.
    // ---------------------------------------------------------------------
    if (!Array.isArray(body.values)) {
      return errorResponse('values must be an array', 'REQUEST_VALIDATION_FAILED', req, 400);
    }
    if (body.values.length > MAX_VALUES) {
      return errorResponse(
        `values may contain at most ${MAX_VALUES} entries`,
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }
    if (body.values.some((v) => v !== null && v !== undefined && typeof v !== 'string')) {
      return errorResponse(
        'values must contain only strings or null',
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }

    const values = body.values as (string | null)[];

    // Positions are load-bearing: the client zips the result back onto the rows
    // it sent, so a failed value must hold its slot rather than shift the array.
    const out = await Promise.all(
      values.map(async (v) => {
        try {
          return (await encryptSecret(v)) ?? null;
        } catch {
          return v ?? null;
        }
      })
    );

    return successResponse({ values: out }, req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
};
