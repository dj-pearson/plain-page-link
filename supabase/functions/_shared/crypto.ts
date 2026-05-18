/**
 * Server-side (Deno) AES-256-GCM encryption for secrets at rest.
 *
 * Mirrors the semantics of src/lib/pii.ts: ciphertext is serialized as
 * `enc:v1:<base64(json)>` so callers can distinguish encrypted values
 * from legacy plaintext during a gradual migration (decrypt() returns
 * non-prefixed input unchanged).
 *
 * Key: PII_ENCRYPTION_KEY edge-function secret (>= 16 chars). This is the
 * AES-256-GCM master key referenced by the PII encryption migration.
 */

const PREFIX = 'enc:v1:';
const SALT_LEN = 16;
const IV_LEN = 12;
const ITERATIONS = 100000;

function getKey(): string {
  const key = Deno.env.get('PII_ENCRYPTION_KEY');
  if (!key || key.length < 16) {
    throw new Error(
      'PII_ENCRYPTION_KEY is missing or too short (min 16 chars).'
    );
  }
  return key;
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(getKey(), salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const envelope = {
    s: toB64(salt.buffer),
    i: toB64(iv.buffer),
    c: toB64(ciphertext),
  };
  return PREFIX + btoa(JSON.stringify(envelope));
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export async function decryptSecret(
  value: string | null | undefined
): Promise<string | null | undefined> {
  if (!value || !value.startsWith(PREFIX)) return value; // legacy plaintext
  try {
    const env = JSON.parse(atob(value.slice(PREFIX.length))) as {
      s: string;
      i: string;
      c: string;
    };
    const key = await deriveKey(getKey(), fromB64(env.s));
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(env.i) },
      key,
      fromB64(env.c)
    );
    return new TextDecoder().decode(plain);
  } catch {
    // Undecryptable — surface as-is so callers can decide (do not throw
    // and block the whole verification flow).
    return value;
  }
}
