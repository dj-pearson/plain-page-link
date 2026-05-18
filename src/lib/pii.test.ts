import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { encryptPII, decryptPII, isEncryptedPII } from './pii';

beforeAll(() => {
  vi.stubEnv('VITE_PII_ENCRYPTION_KEY', 'test-master-key-0123456789abcdef');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('pii - encrypt/decrypt round-trip', () => {
  it('decrypts what it encrypts', async () => {
    const phone = '+1 (555) 123-4567';
    const enc = await encryptPII(phone);
    expect(enc).not.toBe(phone);
    expect(isEncryptedPII(enc as string)).toBe(true);
    expect(await decryptPII(enc as string)).toBe(phone);
  });

  it('handles unicode and special characters', async () => {
    const value = '123 Café St., Naïve—Town 日本 "Apt #4"';
    const enc = await encryptPII(value);
    expect(await decryptPII(enc as string)).toBe(value);
  });

  it('handles numeric-looking strings', async () => {
    const enc = await encryptPII('42');
    expect(await decryptPII(enc as string)).toBe('42');
  });

  it('produces different ciphertext for the same input', async () => {
    const a = await encryptPII('same-value');
    const b = await encryptPII('same-value');
    expect(a).not.toBe(b);
  });
});

describe('pii - edge cases', () => {
  it('returns null/undefined/empty unchanged from encryptPII', async () => {
    expect(await encryptPII(null)).toBeNull();
    expect(await encryptPII(undefined)).toBeUndefined();
    expect(await encryptPII('')).toBe('');
  });

  it('returns null/undefined/empty unchanged from decryptPII', async () => {
    expect(await decryptPII(null)).toBeNull();
    expect(await decryptPII(undefined)).toBeUndefined();
    expect(await decryptPII('')).toBe('');
  });

  it('passes legacy plaintext (no prefix) through decryptPII unchanged', async () => {
    expect(await decryptPII('555-0100')).toBe('555-0100');
  });

  it('returns corrupt ciphertext as-is instead of throwing', async () => {
    const corrupt = 'enc:v1:not-valid-base64-$$$';
    expect(await decryptPII(corrupt)).toBe(corrupt);
  });
});

describe('pii - isEncryptedPII', () => {
  it('detects encrypted values', async () => {
    const enc = await encryptPII('detect-me');
    expect(isEncryptedPII(enc as string)).toBe(true);
  });

  it('rejects plaintext and nullish values', () => {
    expect(isEncryptedPII('plain text')).toBe(false);
    expect(isEncryptedPII(null)).toBe(false);
    expect(isEncryptedPII(undefined)).toBe(false);
    expect(isEncryptedPII('')).toBe(false);
  });
});

describe('pii - missing key', () => {
  it('throws a clear error when the master key is absent', async () => {
    vi.stubEnv('VITE_PII_ENCRYPTION_KEY', '');
    await expect(encryptPII('data')).rejects.toThrow(/VITE_PII_ENCRYPTION_KEY/);
    vi.stubEnv('VITE_PII_ENCRYPTION_KEY', 'test-master-key-0123456789abcdef');
  });
});
