import type { Database } from '@/integrations/supabase/types';

/** A row from `leads`, exactly as stored — contact details as ciphertext. */
export type LeadRow = Database['public']['Tables']['leads']['Row'];

/**
 * The columns the browser may read (US-254). authenticated holds SELECT on
 * every column of `leads` except the two ciphertexts and the lookup columns
 * only submit-lead reads (phone_hash, US-522; email_hash and the step-two
 * token, US-559) — select LEAD_COLUMNS (src/lib/leadColumns.ts)
 * and decrypt through pii-crypto by lead id.
 */
export type LeadReadRow = Omit<
  LeadRow,
  | 'encrypted_email'
  | 'encrypted_phone'
  | 'phone_hash'
  | 'email_hash'
  | 'update_token_hash'
  | 'update_token_expires_at'
>;

/**
 * A lead as the app consumes it: the row, with the contact details decrypted.
 *
 * US-086 dropped the plaintext `email` and `phone` columns, so the row itself
 * carries only `encrypted_email` / `encrypted_phone`. Every reader wants the
 * readable values, and every reader gets them from a decrypting boundary
 * (useLeads.decryptLeadRows, useAnalytics.decryptRecentLeads) rather than from
 * the row — so the encrypted fields are swapped out here for the plaintext
 * ones. Nothing downstream can read ciphertext by accident, and nothing can
 * write plaintext to a column that no longer exists.
 */
export type Lead = LeadReadRow & {
  email: string | null;
  phone: string | null;
  /**
   * Past the plan's monthly lead allowance (20260923000003). pii-crypto
   * returned no email or phone for it; the UI blurs the lead's details and
   * offers the upgrade that unlocks them.
   */
  contact_locked?: boolean;
};
