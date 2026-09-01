import type { Lead, LeadRow } from '@/types/lead';

/**
 * Every field on the app's Lead shape, not a convenient subset.
 *
 * `Lead` is the `leads` row with `encrypted_email`/`encrypted_phone` swapped
 * for the decrypted `email`/`phone` the readers produce (US-086), so a fixture
 * that omits a column is now a compile error rather than a test exercising a
 * shape production never returns.
 */
export const mockLead: Lead = {
  id: '33333333-3333-3333-3333-333333333333',
  user_id: '11111111-1111-1111-1111-111111111111',
  lead_type: 'buyer_inquiry',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1-555-0142',
  message: "I'm interested in the Maple Avenue listing. Is it still available?",
  status: 'new',
  source: 'public_profile',
  notes: null,
  form_data: { listing_id: 1, budget: '400000-450000' },

  assigned_to: null,
  listing_id: null,
  price_range: '400000-450000',
  timeline: '3_months',
  property_address: null,
  preapproved: false,

  contacted_at: null,
  first_responded_at: null,
  closed_at: null,

  referrer_url: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  device: 'desktop',

  created_at: '2026-03-01T12:00:00.000Z',
  updated_at: '2026-03-01T12:00:00.000Z',
};

export const mockContactedLead: Lead = {
  ...mockLead,
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Sarah Lee',
  email: 'sarah.lee@example.com',
  status: 'contacted',
  contacted_at: '2026-03-01T13:00:00.000Z',
  first_responded_at: '2026-03-01T13:00:00.000Z',
};

export const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  ...mockLead,
  ...overrides,
});

/**
 * The same lead as it is actually stored: contact details as ciphertext, no
 * plaintext columns.
 *
 * Use this wherever a `leads` query result is being faked. `mockLead` is the
 * app-facing shape that comes back *after* decryption, so feeding it to a
 * query mock exercises a row the database cannot produce.
 *
 * The values here are not real ciphertext — they lack the `enc:v1:` prefix, so
 * decryptPIIBatch passes them through unchanged, which is exactly the
 * pre-backfill path.
 */
export const mockLeadRow: LeadRow = (() => {
  const { email, phone, ...rest } = mockLead;
  return { ...rest, encrypted_email: email, encrypted_phone: phone };
})();
