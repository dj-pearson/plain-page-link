import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptPII, decryptPII, isEncryptedPII, encryptPIIBatch, decryptPIIBatch } from './pii';

/**
 * Since US-066 the crypto lives in the `pii-crypto` Edge Function and the key
 * never reaches the browser, so these tests exercise the client half: the
 * local short-circuits, position preservation across a batch, and the failure
 * behaviour. The function is stood in for by a stub that applies the same
 * `enc:v1:` envelope shape the real one does.
 *
 * The invariant most worth protecting here is that values needing no work never
 * leave the browser — that is what keeps a page of not-yet-backfilled plaintext
 * rows from making a request at all.
 */

const PREFIX = 'enc:v1:';
let invocations: { op: string; values: (string | null)[] }[] = [];
let failNextCall = false;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async (_name: string, opts: { body: { op: string; values: string[] } }) => {
        const { op, values } = opts.body;
        invocations.push({ op, values });
        if (failNextCall) {
          failNextCall = false;
          return { data: null, error: new Error('edge function unreachable') };
        }
        const out = values.map((v) =>
          op === 'encrypt'
            ? PREFIX + btoa(unescape(encodeURIComponent(v)))
            : decodeURIComponent(escape(atob(v.slice(PREFIX.length))))
        );
        return { data: { values: out }, error: null };
      }),
    },
  },
}));

beforeEach(() => {
  invocations = [];
  failNextCall = false;
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
});

describe('pii - edge cases', () => {
  it('returns null/undefined/empty unchanged from encryptPII', async () => {
    expect(await encryptPII(null)).toBe(null);
    expect(await encryptPII(undefined)).toBe(undefined);
    expect(await encryptPII('')).toBe('');
  });

  it('returns null/undefined/empty unchanged from decryptPII', async () => {
    expect(await decryptPII(null)).toBe(null);
    expect(await decryptPII(undefined)).toBe(undefined);
    expect(await decryptPII('')).toBe('');
  });

  it('passes legacy plaintext (no prefix) through decryptPII unchanged', async () => {
    expect(await decryptPII('+1 555 000 1111')).toBe('+1 555 000 1111');
  });

  it('never calls the edge function for values needing no work', async () => {
    await decryptPII(null);
    await decryptPII('');
    await decryptPII('legacy plaintext');
    await encryptPII(null);
    await encryptPII('');
    expect(invocations).toHaveLength(0);
  });

  it('leaves ciphertext in place when the edge function is unreachable', async () => {
    const enc = (await encryptPII('secret')) as string;
    failNextCall = true;
    expect(await decryptPII(enc)).toBe(enc);
  });

  it('propagates an encrypt failure rather than writing plaintext', async () => {
    failNextCall = true;
    await expect(encryptPII('secret')).rejects.toThrow();
  });
});

describe('pii - batching', () => {
  it('preserves positions across a mixed batch', async () => {
    const a = (await encryptPII('alpha')) as string;
    const b = (await encryptPII('beta')) as string;
    invocations = [];

    const result = await decryptPIIBatch([a, null, 'legacy', b, '']);
    expect(result).toEqual(['alpha', null, 'legacy', 'beta', '']);
  });

  it('sends only the values that need work, in one call', async () => {
    const a = (await encryptPII('alpha')) as string;
    invocations = [];

    await decryptPIIBatch([a, null, 'legacy', '']);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].values).toEqual([a]);
  });

  it('encrypts a batch in a single call and preserves positions', async () => {
    const result = await encryptPIIBatch(['one', null, 'two', '']);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].values).toEqual(['one', 'two']);
    expect(result[1]).toBe(null);
    expect(result[3]).toBe('');
    expect(await decryptPII(result[0] as string)).toBe('one');
    expect(await decryptPII(result[2] as string)).toBe('two');
  });

  it('makes no call for an all-plaintext page', async () => {
    await decryptPIIBatch(['a@b.com', 'c@d.com', null]);
    expect(invocations).toHaveLength(0);
  });
});

describe('pii - isEncryptedPII', () => {
  it('recognises encrypted values and rejects everything else', async () => {
    const enc = (await encryptPII('x')) as string;
    expect(isEncryptedPII(enc)).toBe(true);
    expect(isEncryptedPII('plaintext')).toBe(false);
    expect(isEncryptedPII(null)).toBe(false);
    expect(isEncryptedPII(undefined)).toBe(false);
    expect(isEncryptedPII('')).toBe(false);
  });
});
