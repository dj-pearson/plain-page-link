import { describe, it, expect, vi } from 'vitest';
import { contactsCopiedFromLockedLeads, type LockedCiphertextDb } from './contactLock';

const OWNER = '11111111-1111-4111-8111-111111111111';

/** A db whose locked_lead_ciphertexts answers from a fixed set. */
function db(locked: string[], error: unknown = null): LockedCiphertextDb & { rpc: ReturnType<typeof vi.fn> } {
  return {
    rpc: vi.fn(async (_fn: string, args: { _user_id: string; _values: string[] }) => ({
      data: error ? null : args._values.filter((v) => locked.includes(v)),
      error,
    })),
  };
}

describe('contactsCopiedFromLockedLeads (US-254)', () => {
  it("refuses a contact whose email ciphertext is one of the owner's locked leads'", async () => {
    const d = db(['enc:v1:locked-email']);
    const locked = await contactsCopiedFromLockedLeads(d, OWNER, [
      { id: 'c1', encrypted_email: 'enc:v1:locked-email', encrypted_phone: null },
      { id: 'c2', encrypted_email: 'enc:v1:own-entry', encrypted_phone: 'enc:v1:own-phone' },
    ]);
    expect([...locked]).toEqual(['c1']);
  });

  it('refuses on a copied phone ciphertext alone', async () => {
    const d = db(['enc:v1:locked-phone']);
    const locked = await contactsCopiedFromLockedLeads(d, OWNER, [
      { id: 'c1', encrypted_email: 'enc:v1:typed', encrypted_phone: 'enc:v1:locked-phone' },
    ]);
    expect(locked.has('c1')).toBe(true);
  });

  it("asks about the caller's own leads, once, with each ciphertext once", async () => {
    const d = db([]);
    await contactsCopiedFromLockedLeads(d, OWNER, [
      { id: 'c1', encrypted_email: 'enc:v1:a', encrypted_phone: 'enc:v1:b' },
      { id: 'c2', encrypted_email: 'enc:v1:a', encrypted_phone: '' },
    ]);
    expect(d.rpc).toHaveBeenCalledTimes(1);
    expect(d.rpc).toHaveBeenCalledWith('locked_lead_ciphertexts', {
      _user_id: OWNER,
      _values: ['enc:v1:a', 'enc:v1:b'],
    });
  });

  it('makes no call when no contact holds ciphertext', async () => {
    const d = db([]);
    const locked = await contactsCopiedFromLockedLeads(d, OWNER, [
      { id: 'c1', encrypted_email: null, encrypted_phone: null },
    ]);
    expect(locked.size).toBe(0);
    expect(d.rpc).not.toHaveBeenCalled();
  });

  it('fails open on a database error, as the lead lock does', async () => {
    const d = db(['enc:v1:x'], { message: 'boom' });
    const onError = vi.fn();
    const locked = await contactsCopiedFromLockedLeads(
      d,
      OWNER,
      [{ id: 'c1', encrypted_email: 'enc:v1:x', encrypted_phone: null }],
      onError
    );
    expect(locked.size).toBe(0);
    expect(onError).toHaveBeenCalled();
  });
});
