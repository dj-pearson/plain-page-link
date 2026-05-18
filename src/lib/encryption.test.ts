import { describe, it, expect } from 'vitest';
import {
  encryptData,
  decryptData,
  createUserSecret,
  isEncryptedData,
  encryptSensitiveFields,
  decryptSensitiveFields,
  hashForSearch,
} from './encryption';

const SECRET = 'a-sufficiently-long-secret-key';

describe('encryption - encrypt/decrypt round-trip', () => {
  it('decrypts what it encrypts', async () => {
    const plaintext = 'Sensitive PII: 555-123-4567';
    const encrypted = await encryptData(plaintext, SECRET);
    const decrypted = await decryptData(encrypted, SECRET);
    expect(decrypted).toBe(plaintext);
  });

  it('handles unicode and special characters', async () => {
    const plaintext = 'café ☕ — naïve "quotes" \n newline 日本語';
    const encrypted = await encryptData(plaintext, SECRET);
    expect(await decryptData(encrypted, SECRET)).toBe(plaintext);
  });

  it('produces different ciphertext for the same plaintext (random IV/salt)', async () => {
    const a = await encryptData('same', SECRET);
    const b = await encryptData('same', SECRET);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('fails to decrypt with the wrong secret', async () => {
    const encrypted = await encryptData('secret data', SECRET);
    await expect(decryptData(encrypted, 'a-different-but-long-enough-secret')).rejects.toThrow(
      /Decryption failed/
    );
  });

  it('rejects empty plaintext', async () => {
    await expect(encryptData('', SECRET)).rejects.toThrow(/Cannot encrypt empty data/);
  });

  it('rejects too-short secrets', async () => {
    await expect(encryptData('data', 'short')).rejects.toThrow(/at least 16 characters/);
  });

  it('rejects invalid encrypted data on decrypt', async () => {
    await expect(
      decryptData({ ciphertext: '', iv: '', tag: '', version: 1 }, SECRET)
    ).rejects.toThrow(/Invalid encrypted data/);
  });

  it('rejects unsupported future versions', async () => {
    const encrypted = await encryptData('data', SECRET);
    await expect(decryptData({ ...encrypted, version: 99 }, SECRET)).rejects.toThrow(
      /version not supported/
    );
  });
});

describe('encryption - isEncryptedData', () => {
  it('recognizes valid encrypted data shape', async () => {
    const encrypted = await encryptData('data', SECRET);
    expect(isEncryptedData(encrypted)).toBe(true);
  });

  it('rejects non-encrypted values', () => {
    expect(isEncryptedData(null)).toBe(false);
    expect(isEncryptedData('string')).toBe(false);
    expect(isEncryptedData({ ciphertext: 'x' })).toBe(false);
  });
});

describe('encryption - field helpers', () => {
  it('encrypts and decrypts only the specified fields', async () => {
    const record = { name: 'Jane', phone: '555-0100', age: 30 };
    const encrypted = await encryptSensitiveFields(record, ['name', 'phone'], SECRET);
    expect(encrypted.age).toBe(30);
    expect(isEncryptedData(encrypted.name)).toBe(true);

    const decrypted = await decryptSensitiveFields(encrypted, ['name', 'phone'], SECRET);
    expect(decrypted.name).toBe('Jane');
    expect(decrypted.phone).toBe('555-0100');
    expect(decrypted.age).toBe(30);
  });
});

describe('encryption - helpers', () => {
  it('createUserSecret is deterministic', async () => {
    const s1 = await createUserSecret('user-1', 'app-secret');
    const s2 = await createUserSecret('user-1', 'app-secret');
    const s3 = await createUserSecret('user-2', 'app-secret');
    expect(s1).toBe(s2);
    expect(s1).not.toBe(s3);
  });

  it('hashForSearch is deterministic and case-insensitive', async () => {
    const h1 = await hashForSearch('Jane@Example.com', 'salt');
    const h2 = await hashForSearch('jane@example.com ', 'salt');
    expect(h1).toBe(h2);
  });
});
