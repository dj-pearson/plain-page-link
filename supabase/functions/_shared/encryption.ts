/**
 * Server-Side Encryption Utilities (Deno / Edge Functions)
 *
 * Provides AES-256-GCM encryption for highly sensitive secrets that must be
 * protected at rest in the database — most notably TOTP/MFA shared secrets.
 *
 * SECURITY MODEL
 * - The master key is supplied via the `MFA_ENCRYPTION_KEY` environment secret
 *   (falls back to `PII_ENCRYPTION_KEY`). It is NEVER stored in the database.
 * - A 256-bit AES-GCM key is derived from the master key with PBKDF2-SHA256.
 * - Each value uses a fresh random 16-byte salt and 12-byte IV; both are stored
 *   alongside the ciphertext, so every encryption is unique.
 * - Output is a single self-describing string: `mfaenc:v1:<base64(salt|iv|ct)>`.
 *
 * MIGRATION SAFETY
 * - `decryptSecret()` transparently passes through legacy plaintext values (any
 *   string that does not carry the `mfaenc:v1:` prefix), so existing rows keep
 *   working until they are re-encrypted on the next setup.
 * - If no master key is configured, `encryptSecret()` returns the plaintext
 *   unchanged (and logs a warning) rather than failing the request — encryption
 *   is a hardening layer, not a hard dependency for the feature to function.
 */

const PREFIX = 'mfaenc:v1:';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;

function getMasterKey(): string | null {
  return (
    Deno.env.get('MFA_ENCRYPTION_KEY') ||
    Deno.env.get('PII_ENCRYPTION_KEY') ||
    null
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: KEY_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Returns true if the value is an encrypted secret produced by encryptSecret().
 */
export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Encrypt a sensitive secret (e.g. a base32 TOTP secret) for storage at rest.
 * Returns a `mfaenc:v1:...` string, or the original plaintext if no master key
 * is configured.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  if (isEncryptedSecret(plaintext)) return plaintext; // already encrypted

  const masterKey = getMasterKey();
  if (!masterKey) {
    console.warn(
      'MFA_ENCRYPTION_KEY is not configured — storing MFA secret without encryption at rest.',
    );
    return plaintext;
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(masterKey, salt);

  const encoder = new TextEncoder();
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext)),
  );

  // Pack salt | iv | ciphertext into a single buffer.
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ciphertext, salt.length + iv.length);

  return PREFIX + toBase64(packed);
}

/**
 * Decrypt a secret produced by encryptSecret(). Legacy plaintext values (no
 * prefix) are returned unchanged so existing rows keep working during the
 * migration window.
 */
export async function decryptSecret(value: string | null | undefined): Promise<string> {
  if (!value) return value ?? '';
  if (!isEncryptedSecret(value)) return value; // legacy plaintext passthrough

  const masterKey = getMasterKey();
  if (!masterKey) {
    throw new Error('MFA_ENCRYPTION_KEY is not configured — cannot decrypt MFA secret.');
  }

  const packed = fromBase64(value.slice(PREFIX.length));
  const salt = packed.slice(0, SALT_LENGTH);
  const iv = packed.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = packed.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(masterKey, salt);
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintextBuffer);
}
