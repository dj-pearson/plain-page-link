/**
 * PII Encryption Helpers
 *
 * Thin wrapper around src/lib/encryption.ts (AES-256-GCM + PBKDF2) that
 * encrypts/decrypts individual PII string fields (phone numbers,
 * addresses, emails) for storage at rest.
 *
 * The serialized ciphertext is a string prefixed with `enc:v1:` followed
 * by base64-encoded JSON of the EncryptedData envelope. The prefix lets
 * decryptPII() distinguish encrypted values from legacy plaintext during
 * the gradual migration period (US-016).
 *
 * Key management: the master secret comes from VITE_PII_ENCRYPTION_KEY.
 * In production this should move to Supabase Vault / a secrets manager.
 */

import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption';

const PII_PREFIX = 'enc:v1:';

type Nullable<T> = T | null | undefined;

function getMasterKey(): string {
  const key = import.meta.env.VITE_PII_ENCRYPTION_KEY as string | undefined;
  if (!key || key.length < 16) {
    throw new Error(
      'VITE_PII_ENCRYPTION_KEY is missing or too short (min 16 chars). ' +
        'PII encryption cannot proceed.'
    );
  }
  return key;
}

function isEmpty(value: Nullable<string>): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/**
 * Encrypts a PII string. Returns null/undefined/empty inputs unchanged so
 * callers can pass optional fields through transparently.
 */
export async function encryptPII<T extends Nullable<string>>(plaintext: T): Promise<T | string> {
  if (isEmpty(plaintext)) return plaintext;

  const encrypted = await encryptData(plaintext, getMasterKey());
  const json = JSON.stringify(encrypted);
  return PII_PREFIX + btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decrypts a value produced by encryptPII. Inputs that are null/undefined/
 * empty, or that lack the encryption prefix (legacy plaintext), are
 * returned unchanged so the same code path works during migration.
 */
export async function decryptPII<T extends Nullable<string>>(ciphertext: T): Promise<T | string> {
  if (isEmpty(ciphertext)) return ciphertext;
  if (!ciphertext.startsWith(PII_PREFIX)) return ciphertext;

  try {
    const json = decodeURIComponent(escape(atob(ciphertext.slice(PII_PREFIX.length))));
    const envelope = JSON.parse(json) as EncryptedData;
    return await decryptData(envelope, getMasterKey());
  } catch {
    // Corrupt or undecryptable — return as-is rather than throwing so a
    // single bad row does not break a list render.
    return ciphertext;
  }
}

/** True if a string looks like an encryptPII() output. */
export function isEncryptedPII(value: Nullable<string>): boolean {
  return typeof value === 'string' && value.startsWith(PII_PREFIX);
}
