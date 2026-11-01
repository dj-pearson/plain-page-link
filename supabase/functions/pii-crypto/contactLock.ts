/**
 * US-254: a contact must not open a locked lead's ciphertext.
 *
 * Leads past the plan's monthly allowance come back from decrypt_leads with no
 * email or phone. But contacts have the same two encrypted columns under the
 * same key, decrypt_contacts never checked the allowance (contacts are the
 * agent's own entries), and the owner could read the locked lead's
 * encrypted_email straight off the row and write it into a contact they own —
 * after which decrypt_contacts opened it.
 *
 * The primary fix is that the browser can no longer read leads.encrypted_* at
 * all (20261101000016). This is the second wall: a contact whose ciphertext is
 * byte-identical to one of the owner's locked leads' is refused. Every
 * encryption draws a fresh salt and IV, so identical ciphertext means a copy,
 * never a coincidence; an agent who types the address in themselves produces
 * different ciphertext and is unaffected.
 *
 * No Deno globals, so vitest covers it (contactLock.test.ts).
 */

export interface ContactCiphertextRow {
  id: string;
  encrypted_email: string | null;
  encrypted_phone: string | null;
}

/** The slice of a supabase client this needs. */
export interface LockedCiphertextDb {
  rpc(
    fn: 'locked_lead_ciphertexts',
    args: { _user_id: string; _values: string[] }
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * The ids of the rows whose email or phone ciphertext belongs to one of
 * `ownerId`'s locked leads. One RPC for the whole batch.
 *
 * Fails open on a database error, like the lead lock in pii-crypto: the
 * allowance is a paywall, and a transient error must not blank every contact.
 */
export async function contactsCopiedFromLockedLeads(
  db: LockedCiphertextDb,
  ownerId: string,
  rows: ContactCiphertextRow[],
  onError: (error: unknown) => void = () => {}
): Promise<Set<string>> {
  const values = [
    ...new Set(
      rows.flatMap((row) => [row.encrypted_email, row.encrypted_phone]).filter((v): v is string => !!v)
    ),
  ];
  const out = new Set<string>();
  if (values.length === 0) return out;

  const { data, error } = await db.rpc('locked_lead_ciphertexts', { _user_id: ownerId, _values: values });
  if (error) {
    onError(error);
    return out;
  }

  const locked = new Set(Array.isArray(data) ? (data as unknown[]).filter((v): v is string => typeof v === 'string') : []);
  for (const row of rows) {
    if ((row.encrypted_email && locked.has(row.encrypted_email)) || (row.encrypted_phone && locked.has(row.encrypted_phone))) {
      out.add(row.id);
    }
  }
  return out;
}
