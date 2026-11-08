/**
 * Keyed lookup fingerprints for contacts (US-629, US-640).
 *
 * contacts.email_hash / phone_hash let pii-crypto find the client a lead
 * already is without decrypting the agent's sphere into the browser. They are
 * computed under the same key labels as leads' (spam-guard.ts), so equal
 * hashes mean equal addresses or numbers.
 *
 * The key is not in the database, so nothing in SQL can compute them. US-629
 * hashed contacts only when a lead was converted, a bounded batch per call, so
 * an agent with a few hundred never-hashed contacts could get an incomplete
 * duplicate check. US-640 hashes them from three places, all through this
 * module:
 *
 *   - pii-crypto `index_contacts`, which the dashboard calls right after it
 *     creates or edits a contact (newest edits first, so the row it just wrote
 *     is in the first batch);
 *   - pii-crypto `match_contacts_for_lead`, as before;
 *   - scheduled-maintenance, which works through every agent's unhashed
 *     contacts each run, so the whole sphere is covered without anyone
 *     converting a lead.
 *
 * 20261108000629's trigger clears the three columns whenever a contact's
 * ciphertext changes, so an edited contact comes back through here, and a
 * save is conditional on updated_at so it never overwrites an edit made
 * between the read and the write.
 *
 * Free of Deno globals and esm.sh runtime imports so vitest can run it.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { emailLookupHash, phoneLookupHash } from './spam-guard.ts';

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

export interface ContactHashDeps {
  hashSecret: string;
  /** Plaintext, or null when the value is empty or will not decrypt. */
  decrypt(value: string | null): Promise<string | null>;
  /**
   * Up to `limit` contacts with no lookup_hashed_at, most recently updated
   * first; one agent's when `userId` is given, anyone's when it is null.
   */
  loadUnhashedContacts(userId: string | null, limit: number): Promise<UnhashedContactRow[]>;
  /** Stores the fingerprints, unless the row changed since it was read. */
  saveContactHashes(row: UnhashedContactRow, hashes: ContactHashes): Promise<void>;
}

export interface HashBatchResult {
  /** Rows whose fingerprints were computed and saved. */
  hashed: number;
  /** Rows that could not be saved (the error is in `errors`). */
  failed: number;
  /** False when more unhashed contacts remain after this batch. */
  complete: boolean;
  errors: string[];
}

/** Rows decrypted at once: each is up to two 100k-iteration PBKDF2 derivations. */
export const HASH_CONCURRENCY = 20;

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

/**
 * Hashes up to `batch` unhashed contacts (one agent's, or anyone's when
 * `userId` is null). A row that fails is counted and reported rather than
 * failing the rest; it stays unhashed and is picked up again next time.
 */
export async function hashUnhashedContacts(
  deps: ContactHashDeps,
  userId: string | null,
  batch: number,
  concurrency = HASH_CONCURRENCY
): Promise<HashBatchResult> {
  // One more than the batch tells us whether any remain after this call.
  const unhashed = await deps.loadUnhashedContacts(userId, batch + 1);
  const toHash = unhashed.slice(0, batch);
  const result: HashBatchResult = {
    hashed: 0,
    failed: 0,
    complete: unhashed.length <= batch,
    errors: [],
  };

  for (let i = 0; i < toHash.length; i += concurrency) {
    await Promise.all(
      toHash.slice(i, i + concurrency).map(async (row) => {
        try {
          const [email, phone] = await Promise.all([
            deps.decrypt(row.encrypted_email),
            deps.decrypt(row.encrypted_phone),
          ]);
          await deps.saveContactHashes(row, await lookupHashes(email, phone, deps.hashSecret));
          result.hashed += 1;
        } catch (error) {
          result.failed += 1;
          result.errors.push(`${row.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
    );
  }
  return result;
}

/** Contacts scheduled-maintenance hashes per run, across every agent. */
export const MAINTENANCE_HASH_LIMIT = 200;

/**
 * scheduled-maintenance's pass: batches of anyone's unhashed contacts until
 * none remain or `limit` rows have been attempted. Stops early when a batch
 * saves nothing, so rows that keep failing cannot spin the loop.
 */
export async function hashContactBacklog(
  deps: ContactHashDeps,
  opts: { limit?: number; batch?: number } = {}
): Promise<HashBatchResult> {
  const limit = opts.limit ?? MAINTENANCE_HASH_LIMIT;
  const batch = opts.batch ?? 50;
  const total: HashBatchResult = { hashed: 0, failed: 0, complete: false, errors: [] };
  while (total.hashed + total.failed < limit) {
    const step = await hashUnhashedContacts(
      deps,
      null,
      Math.min(batch, limit - total.hashed - total.failed)
    );
    total.hashed += step.hashed;
    total.failed += step.failed;
    total.errors.push(...step.errors);
    if (step.complete && step.failed === 0) {
      total.complete = true;
      break;
    }
    if (step.hashed === 0) break;
  }
  return total;
}

export function summarizeContactHashReport(report: HashBatchResult): string {
  return `hashed ${report.hashed}, failed ${report.failed}, ${report.complete ? 'none left' : 'more remain'}`;
}

/** The reads and writes above, against the real contacts table (service role). */
export function supabaseContactHashStore(
  db: SupabaseClient
): Pick<ContactHashDeps, 'loadUnhashedContacts' | 'saveContactHashes'> {
  return {
    loadUnhashedContacts: async (userId, limit) => {
      let query = db
        .from('contacts')
        .select('id, encrypted_email, encrypted_phone, updated_at')
        .is('lookup_hashed_at', null);
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as UnhashedContactRow[];
    },
    saveContactHashes: async (row, hashes) => {
      // Only if the contact is as it was read: an edit in between clears the
      // hashes by trigger and must not be overwritten.
      const { error } = await db
        .from('contacts')
        .update({ ...hashes, lookup_hashed_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('updated_at', row.updated_at);
      if (error) throw new Error(error.message);
    },
  };
}
