import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptPII,
  isEncryptedPII,
  encryptPIIBatch,
  decryptLeadContacts,
  decryptOwnProfilePhone,
} from './pii';

/**
 * Since US-066 the crypto lives in the `pii-crypto` Edge Function and the key
 * never reaches the browser, so these tests exercise the client half: the local
 * short-circuits, position preservation across an encrypt batch, and the
 * failure behaviour.
 *
 * US-119 changed the decrypt contract. It used to post raw ciphertext and get
 * plaintext back, for any valid JWT, with no check that the caller could ever
 * have read those rows — and audit_table_change stores to_jsonb(NEW) for
 * `leads`, so audit_logs held a copy of every ciphertext ever written. Decrypt
 * is addressed by row id now, and the function filters to rows the caller owns.
 * The invariant these protect is that the client never sends a ciphertext to be
 * opened.
 */

const PREFIX = 'enc:v1:';
let invocations: { op: string; body: Record<string, unknown> }[] = [];
let failNextCall = false;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async (_name: string, opts: { body: Record<string, unknown> }) => {
        const body = opts.body;
        invocations.push({ op: String(body.op), body });

        if (failNextCall) {
          failNextCall = false;
          return { data: null, error: new Error('edge function unreachable') };
        }

        if (body.op === 'encrypt') {
          const values = body.values as string[];
          return {
            data: { values: values.map((v) => PREFIX + btoa(unescape(encodeURIComponent(v)))) },
            error: null,
          };
        }

        if (body.op === 'decrypt_leads') {
          const ids = body.leadIds as string[];
          // The real function returns only rows the caller owns; 'not-mine'
          // stands in for one they do not.
          return {
            data: {
              leads: ids
                .filter((id) => id !== 'not-mine')
                .map((id) => ({ id, email: `${id}@example.com`, phone: `phone-${id}` })),
            },
            error: null,
          };
        }

        if (body.op === 'decrypt_profile') {
          return { data: { phone: '+1 555 000 1111' }, error: null };
        }

        return { data: null, error: new Error(`unexpected op ${String(body.op)}`) };
      }),
    },
  },
}));

beforeEach(() => {
  invocations = [];
  failNextCall = false;
});

describe('isEncryptedPII', () => {
  it('recognises the envelope and nothing else', () => {
    expect(isEncryptedPII(`${PREFIX}abc`)).toBe(true);
    expect(isEncryptedPII('+1 555 000 1111')).toBe(false);
    expect(isEncryptedPII(null)).toBe(false);
    expect(isEncryptedPII(undefined)).toBe(false);
    expect(isEncryptedPII('')).toBe(false);
  });
});

describe('encryptPIIBatch', () => {
  it('preserves positions and only sends what needs work', async () => {
    const result = await encryptPIIBatch(['one', null, '', 'two']);

    expect(result[1]).toBeNull();
    expect(result[2]).toBe('');
    expect(isEncryptedPII(result[0] as string)).toBe(true);
    expect(isEncryptedPII(result[3] as string)).toBe(true);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].body.values).toEqual(['one', 'two']);
  });

  it('makes no request when nothing needs encrypting', async () => {
    await encryptPIIBatch([null, undefined, '']);
    expect(invocations).toHaveLength(0);
  });

  it('fails closed, so plaintext is never written into an encrypted column', async () => {
    failNextCall = true;
    await expect(encryptPIIBatch(['secret'])).rejects.toThrow();
  });
});

describe('encryptPII', () => {
  it('passes empty values through without a request', async () => {
    expect(await encryptPII(null)).toBeNull();
    expect(await encryptPII(undefined)).toBeUndefined();
    expect(await encryptPII('')).toBe('');
    expect(invocations).toHaveLength(0);
  });
});

describe('decryptLeadContacts', () => {
  it('sends ids, never ciphertext', async () => {
    await decryptLeadContacts(['lead-1', 'lead-2']);

    expect(invocations).toHaveLength(1);
    expect(invocations[0].op).toBe('decrypt_leads');
    expect(invocations[0].body.leadIds).toEqual(['lead-1', 'lead-2']);
    // The whole point: no ciphertext leaves the browser to be opened.
    expect(invocations[0].body).not.toHaveProperty('values');
  });

  it('returns a map keyed by id', async () => {
    const map = await decryptLeadContacts(['lead-1']);
    expect(map.get('lead-1')).toEqual({
      id: 'lead-1',
      email: 'lead-1@example.com',
      phone: 'phone-lead-1',
    });
  });

  it('omits a row the caller does not own rather than erroring', async () => {
    const map = await decryptLeadContacts(['lead-1', 'not-mine']);
    expect(map.has('lead-1')).toBe(true);
    expect(map.has('not-mine')).toBe(false);
  });

  it('de-duplicates and skips empty ids', async () => {
    await decryptLeadContacts(['lead-1', 'lead-1', '']);
    expect(invocations[0].body.leadIds).toEqual(['lead-1']);
  });

  it('makes no request for an empty list', async () => {
    const map = await decryptLeadContacts([]);
    expect(map.size).toBe(0);
    expect(invocations).toHaveLength(0);
  });

  it('fails open: an unreachable function empties the map rather than throwing', async () => {
    failNextCall = true;
    const map = await decryptLeadContacts(['lead-1']);
    expect(map.size).toBe(0);
  });
});

describe('decryptOwnProfilePhone', () => {
  it('names no row — the function picks it from the JWT', async () => {
    const phone = await decryptOwnProfilePhone();

    expect(phone).toBe('+1 555 000 1111');
    expect(invocations[0].op).toBe('decrypt_profile');
    expect(Object.keys(invocations[0].body)).toEqual(['op']);
  });

  it('returns null when the call fails, so the stored value can stand in', async () => {
    failNextCall = true;
    expect(await decryptOwnProfilePhone()).toBeNull();
  });
});
