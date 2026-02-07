/**
 * Client-Side Encryption Utilities for PII Protection
 *
 * This module provides AES-256-GCM encryption for sensitive data.
 * For highly sensitive data (OAuth tokens, MFA secrets), use server-side encryption via Edge Functions.
 *
 * IMPORTANT SECURITY NOTES:
 * - The encryption key is derived from a user-specific secret
 * - Keys are NEVER sent to the server in plaintext
 * - This is for client-side encryption only; server-side encryption should use Edge Functions
 */

// Type definitions
export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag
  version: number; // Encryption version for migration purposes
}

export interface EncryptionOptions {
  saltLength?: number;
  iterations?: number;
}

const ENCRYPTION_VERSION = 1;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;

/**
 * Generate a random salt for key derivation
 */
function generateSalt(length: number = SALT_LENGTH): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random initialization vector for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = KEY_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt
 * @param userSecret - User-specific secret (derived from user ID + app secret)
 * @returns Encrypted data object
 */
export async function encryptData(
  plaintext: string,
  userSecret: string
): Promise<EncryptedData> {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }

  if (!userSecret || userSecret.length < 16) {
    throw new Error('User secret must be at least 16 characters');
  }

  const encoder = new TextEncoder();
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(userSecret, salt);

  // Encrypt the plaintext
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // The encrypted buffer includes both ciphertext and the auth tag
  // In AES-GCM, the last 16 bytes are the authentication tag
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertextLength = encryptedArray.length - 16;
  const ciphertext = encryptedArray.slice(0, ciphertextLength);
  const tag = encryptedArray.slice(ciphertextLength);

  // Combine salt with IV for storage
  const combinedIV = new Uint8Array(salt.length + iv.length);
  combinedIV.set(salt);
  combinedIV.set(iv, salt.length);

  return {
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    iv: arrayBufferToBase64(combinedIV.buffer),
    tag: arrayBufferToBase64(tag.buffer),
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt encrypted data using AES-256-GCM
 *
 * @param encryptedData - The encrypted data object
 * @param userSecret - User-specific secret (must match the one used for encryption)
 * @returns Decrypted plaintext
 */
export async function decryptData(
  encryptedData: EncryptedData,
  userSecret: string
): Promise<string> {
  if (!encryptedData || !encryptedData.ciphertext) {
    throw new Error('Invalid encrypted data');
  }

  if (!userSecret || userSecret.length < 16) {
    throw new Error('User secret must be at least 16 characters');
  }

  // Handle version migration if needed
  if (encryptedData.version > ENCRYPTION_VERSION) {
    throw new Error('Encrypted data version not supported. Please update the application.');
  }

  const ciphertext = new Uint8Array(base64ToArrayBuffer(encryptedData.ciphertext));
  const combinedIV = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
  const tag = new Uint8Array(base64ToArrayBuffer(encryptedData.tag));

  // Extract salt and IV from combined IV
  const salt = combinedIV.slice(0, SALT_LENGTH);
  const iv = combinedIV.slice(SALT_LENGTH);

  // Derive the key
  const key = await deriveKey(userSecret, salt);

  // Combine ciphertext and tag for decryption
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed. Invalid key or corrupted data.');
  }
}

/**
 * Create a user-specific encryption secret
 * This combines the user ID with an app-level secret for key derivation
 *
 * @param userId - The user's unique identifier
 * @param appSecret - Application-level secret (from environment)
 * @returns A derived secret for encryption
 */
export async function createUserSecret(
  userId: string,
  appSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${userId}:${appSecret}`);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Check if a value is encrypted data
 */
export function isEncryptedData(value: unknown): value is EncryptedData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.ciphertext === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.tag === 'string' &&
    typeof obj.version === 'number'
  );
}

/**
 * Encrypt a JSON object's sensitive fields
 *
 * @param data - Object containing data to encrypt
 * @param sensitiveFields - Array of field names to encrypt
 * @param userSecret - User-specific secret
 * @returns Object with sensitive fields encrypted
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: (keyof T)[],
  userSecret: string
): Promise<T> {
  const result = { ...data };

  for (const field of sensitiveFields) {
    const value = data[field];
    if (value !== null && value !== undefined && typeof value === 'string') {
      const encrypted = await encryptData(value, userSecret);
      (result as Record<string, unknown>)[field as string] = encrypted;
    }
  }

  return result;
}

/**
 * Decrypt a JSON object's encrypted fields
 *
 * @param data - Object containing encrypted fields
 * @param encryptedFields - Array of field names that are encrypted
 * @param userSecret - User-specific secret
 * @returns Object with encrypted fields decrypted
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: (keyof T)[],
  userSecret: string
): Promise<T> {
  const result = { ...data };

  for (const field of encryptedFields) {
    const value = data[field];
    if (isEncryptedData(value)) {
      try {
        const decrypted = await decryptData(value, userSecret);
        (result as Record<string, unknown>)[field as string] = decrypted;
      } catch {
        // If decryption fails, keep the encrypted value
        // This can happen if the user's secret has changed
        console.warn(`Failed to decrypt field: ${String(field)}`);
      }
    }
  }

  return result;
}

/**
 * Hash sensitive data for searching/indexing
 * This creates a deterministic hash that can be used for lookups
 * without exposing the original data
 *
 * @param value - The value to hash
 * @param salt - A consistent salt for the hash (should be stored)
 * @returns Base64 encoded hash
 */
export async function hashForSearch(
  value: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${value.toLowerCase().trim()}`);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

// PII field definitions for different tables
export const PII_FIELDS = {
  profiles: ['phone', 'license_number'] as const,
  leads: ['name', 'email', 'phone', 'property_address'] as const,
  testimonials: ['client_name'] as const,
  listings: ['address'] as const,
  user_sessions: ['ip_address'] as const,
  login_attempts: ['email', 'ip_address'] as const,
} as const;

export type PIIFieldsMap = typeof PII_FIELDS;
