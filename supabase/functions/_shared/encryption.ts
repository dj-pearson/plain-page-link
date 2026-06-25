/**
 * Server-side PII / secret encryption for Edge Functions (Deno).
 *
 * Mirrors the algorithm and serialized envelope used by the frontend
 * `src/lib/encryption.ts` + `src/lib/pii.ts`: AES-256-GCM with a key
 * derived via PBKDF2-SHA256 (100k iterations). The serialized form is a
 * string prefixed with `enc:v1:` followed by base64-encoded JSON of the
 * envelope, so encryptSecret/decryptSecret are migration-aware — legacy
 * plaintext values (no prefix) are returned unchanged on decrypt.
 *
 * Highly sensitive secrets (TOTP/MFA seeds, OAuth tokens) MUST be encrypted
 * at rest with this module rather than stored as plaintext.
 *
 * Key management: the master secret comes from the PII_ENCRYPTION_KEY
 * (falls back to ENCRYPTION_KEY) Edge Function secret. Set it via
 * `supabase secrets set PII_ENCRYPTION_KEY=...`. In production this should
 * live in a secrets manager / Supabase Vault.
 */

const PREFIX = 'enc:v1:';
const ENCRYPTION_VERSION = 1;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;
const TAG_LENGTH = 16;

interface EncryptedEnvelope {
  ciphertext: string; // base64
  iv: string; // base64(salt || iv)
  tag: string; // base64
  version: number;
}

function getMasterKey(): string {
  const key = Deno.env.get('PII_ENCRYPTION_KEY') ?? Deno.env.get('ENCRYPTION_KEY');
  if (!key || key.length < 16) {
    throw new Error(
      'PII_ENCRYPTION_KEY is missing or too short (min 16 chars); cannot encrypt secrets at rest.'
    );
  }
  return key;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: KEY_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a secret string and returns the serialized `enc:v1:` form.
 * Empty/nullish inputs are returned unchanged.
 */
export async function encryptSecret(plaintext: string | null | undefined): Promise<string | null | undefined> {
  if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext;

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(getMasterKey(), salt);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  );
  const ciphertext = encrypted.slice(0, encrypted.length - TAG_LENGTH);
  const tag = encrypted.slice(encrypted.length - TAG_LENGTH);

  const combinedIV = new Uint8Array(salt.length + iv.length);
  combinedIV.set(salt);
  combinedIV.set(iv, salt.length);

  const envelope: EncryptedEnvelope = {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(combinedIV),
    tag: bytesToBase64(tag),
    version: ENCRYPTION_VERSION,
  };
  return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(envelope))));
}

/**
 * Decrypts a value produced by encryptSecret. Legacy plaintext (no prefix)
 * is returned unchanged so reads work transparently during migration.
 */
export async function decryptSecret(value: string | null | undefined): Promise<string | null | undefined> {
  if (value === null || value === undefined || value === '') return value;
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext

  const json = decodeURIComponent(escape(atob(value.slice(PREFIX.length))));
  const envelope = JSON.parse(json) as EncryptedEnvelope;

  const combinedIV = base64ToBytes(envelope.iv);
  const salt = combinedIV.slice(0, SALT_LENGTH);
  const iv = combinedIV.slice(SALT_LENGTH);
  const key = await deriveKey(getMasterKey(), salt);

  const ciphertext = base64ToBytes(envelope.ciphertext);
  const tag = base64ToBytes(envelope.tag);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}

/** True if a value looks like encryptSecret() output. */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}
