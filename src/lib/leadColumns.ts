import type { LeadReadRow } from '@/types/lead';

/**
 * The columns of `leads` the browser may select (US-254).
 *
 * Every column except encrypted_email and encrypted_phone. Migration
 * 20261101000016 grants anon/authenticated SELECT on exactly these, so a
 * `select('*')` — or a bare `.select()` after an insert or update, which asks
 * for `*` — is refused. Read with this list and decrypt through pii-crypto by
 * lead id (decryptLeadContacts), which is where the plan's lead allowance is
 * applied: while the ciphertext was readable, an agent over the allowance
 * could copy a locked lead's into a contact and have decrypt_contacts open it.
 *
 * A literal string, not a join of LEAD_COLUMN_SET's keys, so supabase-js can
 * type the rows it returns. leadColumns.test.ts holds the string, the set and
 * the migration's grant together.
 */
export const LEAD_COLUMNS =
  'id, user_id, lead_type, name, message, status, source, form_data, created_at, updated_at, first_responded_at, assigned_to, contacted_at, closed_at, listing_id, price_range, timeline, property_address, preapproved, notes, referrer_url, utm_source, utm_medium, utm_campaign, device, is_sample, open_house_id, email_hash, update_token_hash, update_token_expires_at';

/**
 * Every readable column, keyed so the compiler fails when `leads` gains or
 * loses one in types.ts and this list is not brought along.
 */
export const LEAD_COLUMN_SET: Record<keyof LeadReadRow, true> = {
  id: true,
  user_id: true,
  lead_type: true,
  name: true,
  message: true,
  status: true,
  source: true,
  form_data: true,
  created_at: true,
  updated_at: true,
  first_responded_at: true,
  assigned_to: true,
  contacted_at: true,
  closed_at: true,
  listing_id: true,
  price_range: true,
  timeline: true,
  property_address: true,
  preapproved: true,
  notes: true,
  referrer_url: true,
  utm_source: true,
  utm_medium: true,
  utm_campaign: true,
  device: true,
  is_sample: true,
  open_house_id: true,
  email_hash: true,
  update_token_hash: true,
  update_token_expires_at: true,
};
