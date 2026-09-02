/**
 * PII Encryption Helpers
 *
 * Encrypts/decrypts individual PII string fields (phone numbers, emails) for
 * storage at rest. The serialized form is a string prefixed with `enc:v1:`
 * followed by base64-encoded JSON of the AES-256-GCM envelope. The prefix lets
 * decryptPII() tell encrypted values from legacy plaintext during the gradual
 * migration period (US-016).
 *
 * Key management (US-066): the crypto happens in the `pii-crypto` Edge
 * Function, which holds the master secret as the PII_ENCRYPTION_KEY function
 * secret. It used to happen here, keyed from VITE_PII_ENCRYPTION_KEY — but Vite
 * inlines every VITE_-prefixed value into the production bundle, so that key
 * was publicly downloadable and the ciphertext was obfuscation rather than
 * encryption. Nothing in this module can decrypt anything on its own now, which
 * is the point.
 *
 * The envelope format did not change, so values written under the old scheme
 * still decrypt.
 */

import { supabase } from '@/integrations/supabase/client';

const PII_PREFIX = 'enc:v1:';

type Nullable<T> = T | null | undefined;

function isEmpty(value: Nullable<string>): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/** True if a string looks like an encryptPII() output. */
export function isEncryptedPII(value: Nullable<string>): boolean {
  return typeof value === 'string' && value.startsWith(PII_PREFIX);
}

/**
 * One round trip to pii-crypto. Callers are expected to have filtered out
 * values needing no work — see the batch helpers below.
 */
async function callPiiCrypto(op: 'encrypt', values: (string | null)[]) {
  const { data, error } = await supabase.functions.invoke<{ values: (string | null)[] }>(
    'pii-crypto',
    { body: { op, values } }
  );

  if (error || !data?.values || data.values.length !== values.length) {
    // Fail closed on encrypt (the caller must not silently write plaintext into
    // an encrypted_* column) and open on decrypt (one unreachable call should
    // not blank a list). Both are handled by the callers below.
    throw error ?? new Error('pii-crypto returned an unexpected response');
  }
  return data.values;
}

/**
 * Encrypts a batch of PII strings, preserving positions. Values that need no
 * work (null/undefined/empty) never leave the browser.
 */
export async function encryptPIIBatch(values: Nullable<string>[]): Promise<(string | null)[]> {
  const out: (string | null)[] = values.map((v) => (isEmpty(v) ? (v ?? null) : null));
  const idx: number[] = [];
  const payload: string[] = [];

  values.forEach((v, i) => {
    if (!isEmpty(v)) {
      idx.push(i);
      payload.push(v);
    }
  });
  if (payload.length === 0) return out;

  const encrypted = await callPiiCrypto('encrypt', payload);
  idx.forEach((target, k) => {
    out[target] = encrypted[k];
  });
  return out;
}

/** A lead's contact details, as pii-crypto returns them. */
export interface DecryptedLeadContact {
  id: string;
  email: string | null;
  phone: string | null;
}

/**
 * Decrypts the contact details of leads the caller owns, addressed by id.
 *
 * US-119: this used to be `decryptPIIBatch(values)` — it posted raw ciphertext
 * and got plaintext back, for any valid JWT, with no check that the caller
 * could ever have read those rows. audit_table_change stores to_jsonb(NEW) for
 * `leads`, so audit_logs holds a copy of every ciphertext ever written; a
 * caller who obtained one could bring it here to be opened. Naming rows instead
 * of values removes the primitive: the function reads the rows itself and
 * filters them to the caller.
 *
 * Ids the caller does not own are absent from the result rather than being an
 * error — the caller zips by id, and an absent row reads as "no contact
 * details".
 *
 * Never throws: an unreachable function returns an empty map, and the callers
 * fall back to showing the row without contact details rather than failing the
 * whole list.
 */
export async function decryptLeadContacts(
  leadIds: string[]
): Promise<Map<string, DecryptedLeadContact>> {
  const out = new Map<string, DecryptedLeadContact>();
  const ids = Array.from(new Set(leadIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return out;

  try {
    const { data, error } = await supabase.functions.invoke<{ leads: DecryptedLeadContact[] }>(
      'pii-crypto',
      { body: { op: 'decrypt_leads', leadIds: ids } }
    );
    if (error || !data?.leads) return out;
    for (const lead of data.leads) out.set(lead.id, lead);
  } catch {
    // Leave the map empty rather than failing the list render.
  }
  return out;
}

/**
 * Decrypts the caller's own profile phone number.
 *
 * Takes no argument on purpose: the row is chosen by the JWT, not by the
 * caller, so there is nothing to point at somebody else's data.
 */
export async function decryptOwnProfilePhone(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{ phone: string | null }>(
      'pii-crypto',
      { body: { op: 'decrypt_profile' } }
    );
    if (error) return null;
    return data?.phone ?? null;
  } catch {
    return null;
  }
}

/**
 * Encrypts a single PII string. Returns null/undefined/empty inputs unchanged
 * so callers can pass optional fields through transparently.
 *
 * Prefer encryptPIIBatch when handling more than one value — each call is a
 * network round trip.
 */
export async function encryptPII<T extends Nullable<string>>(plaintext: T): Promise<T | string> {
  if (isEmpty(plaintext)) return plaintext;
  const [result] = await encryptPIIBatch([plaintext]);
  return result as string;
}
