-- US-522: a phone-only repeat enquiry is folded like an email one.
--
-- submit-lead folds the same person enquiring again within 24 hours into the
-- lead they already have (US-220, US-513), so a double submit is not stored,
-- notified, auto-replied or charged against the allowance twice. The match is
-- on email_hash, and a lead may be phone-only (US-228), so a visitor who left
-- only a number and pressed submit twice became two leads, two notifications
-- and two units of the agent's leads_per_month.
--
-- phone_hash is HMAC-SHA256 of the number's E.164 digits, keyed from
-- PII_ENCRYPTION_KEY under its own label (_shared/spam-guard.ts
-- phoneLookupHash). submit-lead writes it on every new lead with a phone and
-- folds on it when the enquiry has no email.
--
-- Not browser-readable. leads carries column-level SELECT for authenticated
-- (20261101000016, 20261108000452) and table-wide SELECT is revoked, so a new
-- column has no SELECT grant until one names it — and none does: nothing in
-- the browser needs it. Only the service role (submit-lead) reads it. The
-- REVOKE below restates that, so a later re-grant has to be deliberate.
--
-- Not backfilled: the key is not in the database. Leads captured before this
-- migration simply never match by phone.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_hash text;

REVOKE SELECT (phone_hash) ON public.leads FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS leads_user_phone_hash_created_idx
  ON public.leads (user_id, phone_hash, created_at DESC)
  WHERE phone_hash IS NOT NULL;

COMMENT ON COLUMN public.leads.phone_hash IS
  'HMAC-SHA256 of the phone number''s E.164 digits, keyed from PII_ENCRYPTION_KEY. Written by submit-lead; folds phone-only repeat enquiries (US-522). Service role only.';
