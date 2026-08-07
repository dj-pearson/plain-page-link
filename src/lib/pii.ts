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
async function callPiiCrypto(op: 'encrypt' | 'decrypt', values: (string | null)[]) {
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

/**
 * Decrypts a batch, preserving positions. Values that are empty or lack the
 * `enc:v1:` prefix (legacy plaintext) are passed through locally, so a page of
 * not-yet-backfilled rows makes no request at all.
 *
 * Never throws: if the call fails, the input is returned unchanged, matching
 * the old behaviour where an undecryptable value fell through rather than
 * breaking the list render.
 */
export async function decryptPIIBatch(values: Nullable<string>[]): Promise<(string | null)[]> {
  const out: (string | null)[] = values.map((v) => v ?? null);
  const idx: number[] = [];
  const payload: string[] = [];

  values.forEach((v, i) => {
    if (isEncryptedPII(v)) {
      idx.push(i);
      payload.push(v as string);
    }
  });
  if (payload.length === 0) return out;

  try {
    const decrypted = await callPiiCrypto('decrypt', payload);
    idx.forEach((target, k) => {
      out[target] = decrypted[k];
    });
  } catch {
    // Leave the ciphertext in place rather than blanking the field.
  }
  return out;
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

/**
 * Decrypts a value produced by encryptPII. Inputs that are null/undefined/empty,
 * or that lack the encryption prefix (legacy plaintext), are returned unchanged
 * so the same code path works during migration.
 *
 * Prefer decryptPIIBatch when handling more than one value.
 */
export async function decryptPII<T extends Nullable<string>>(ciphertext: T): Promise<T | string> {
  if (isEmpty(ciphertext)) return ciphertext;
  if (!isEncryptedPII(ciphertext)) return ciphertext;
  const [result] = await decryptPIIBatch([ciphertext]);
  return (result ?? ciphertext) as string;
}
