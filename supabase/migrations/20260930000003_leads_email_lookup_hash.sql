-- US-220: find the same person's earlier lead without decrypting anything.
--
-- Lead email is stored only as ciphertext (US-086) with a random IV, so two
-- enquiries from one address cannot be matched in SQL. submit-lead now writes
-- email_hash — HMAC-SHA256 of the lower-cased address, keyed from
-- PII_ENCRYPTION_KEY (_shared/spam-guard.ts) — and uses it to fold a repeat
-- enquiry within 24 hours into the existing lead instead of storing, notifying
-- and auto-replying again. The same column can later back search-by-email.
--
-- Not backfilled: the key is not in the database. Leads captured before this
-- migration simply never match.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_hash text;

CREATE INDEX IF NOT EXISTS leads_user_email_hash_created_idx
  ON public.leads (user_id, email_hash, created_at DESC)
  WHERE email_hash IS NOT NULL;

COMMENT ON COLUMN public.leads.email_hash IS
  'HMAC-SHA256 of lower(email), keyed from PII_ENCRYPTION_KEY. Written by submit-lead; used for duplicate detection (US-220).';
