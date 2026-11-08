-- US-559: the lead lookup hashes and the enrichment token leave the browser's
-- column grant on leads.
--
-- 20261101000016 replaced table-wide SELECT on leads with a column grant that
-- named every column except the ciphertext, and each later restatement
-- (20261108000452, 20261108000531) carried three service-role-only columns
-- along with it:
--
--   email_hash              keyed HMAC of lower(email), written and read only
--                           by submit-lead (_shared/spam-guard.ts) to fold a
--                           repeat enquiry (US-220).
--   update_token_hash       SHA-256 of the single-use step-two token, matched
--   update_token_expires_at only by submit-lead (US-228).
--
-- Nothing in the browser reads any of them (LEAD_COLUMNS was the only reader,
-- and only because it mirrored the grant). Leaving email_hash readable is a
-- way round the lead allowance: a lead past the plan's monthly allowance is
-- locked (20260923000003) — pii-crypto returns no email or phone for it — but
-- its email_hash still sat in the row. Equal hashes mean equal addresses, so an
-- agent could match a locked lead to an unlocked lead or contact they already
-- hold and learn who it is without upgrading. It is also the identifier the
-- unsubscribe list is keyed on (email_suppressions, 20261108000434). phone_hash
-- was kept out of the grant for the same reason (20261108000532); this gives
-- email_hash the same treatment, and drops the token columns because a
-- credential's hash has no business in the client either.
--
-- The grant is restated from 20261108000531 without the three columns, so
-- LEAD_COLUMNS (src/lib/leadColumns.ts) and leadColumns.test.ts keep one list
-- to hold together. The explicit REVOKE of each column makes a later re-grant
-- deliberate. The service role is unaffected: it holds table-wide privileges.

REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (
  id, user_id, lead_type, name, message, status, source, form_data,
  created_at, updated_at, first_responded_at, assigned_to, contacted_at,
  closed_at, listing_id, price_range, timeline, property_address, preapproved,
  referrer_url, utm_source, utm_medium, utm_campaign, device, is_sample,
  open_house_id, visitor_id
) ON public.leads TO authenticated;

REVOKE SELECT (email_hash, update_token_hash, update_token_expires_at)
  ON public.leads FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN public.leads.email_hash IS
  'HMAC-SHA256 of lower(trim(email)), keyed from PII_ENCRYPTION_KEY. Written and read by submit-lead to fold repeat enquiries (US-220). Service role only (US-559): readable, it would identify a locked lead.';
