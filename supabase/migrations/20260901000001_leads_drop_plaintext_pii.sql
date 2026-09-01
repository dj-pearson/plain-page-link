-- US-086: drop the plaintext PII columns on `leads`.
--
-- `encrypted_email` and `encrypted_phone` were dual-written alongside the
-- plaintext `email` and `phone` on the same row under the same RLS policies.
-- Ciphertext sitting beside its own plaintext protects nothing an attacker
-- could not already read, so the feature was defence-in-depth theatre. Coverage
-- was inconsistent too: useLeads dual-wrote both, and submit-lead — the path
-- every public capture form uses — wrote no ciphertext at all.
--
-- Dropping the plaintext is the only version of this that provides real
-- protection, and the cost turned out to be low: nothing filters or sorts on
-- these columns in SQL. The one search over lead email (dashboard/Leads.tsx)
-- runs client-side over rows useLeads has already decrypted, and there is no
-- `.ilike`/`.eq` against leads.email or leads.phone anywhere in src/ or
-- supabase/functions/.
--
-- The readers and writers were updated in the same change:
--   useLeads          - encrypted-only on insert and update; already decrypted
--                       on read (encrypted_* preferred, plaintext passed through)
--   submit-lead       - now encrypts before insert
--   gdpr-export       - now decrypts for the subject's own copy
--   sample-data       - now encrypts
--   useSecureLeads    - deleted; it had no callers and never decrypted

-- ---------------------------------------------------------------------------
-- Guard: refuse to run if any row would lose data.
--
-- The backfill (supabase/functions/backfill-lead-pii) has to run first, because
-- the AES-256-GCM key lives only in the Edge Function secrets — no SQL here can
-- encrypt. Applying this migration against un-backfilled rows would destroy
-- every affected lead's contact details irreversibly, so it fails loudly
-- instead. Re-run the backfill, then re-apply.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  unbackfilled bigint;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'email'
  ) THEN
    EXECUTE $q$
      SELECT count(*) FROM public.leads
      WHERE (email IS NOT NULL AND email <> '' AND encrypted_email IS NULL)
         OR (phone IS NOT NULL AND phone <> '' AND encrypted_phone IS NULL)
    $q$ INTO unbackfilled;

    IF unbackfilled > 0 THEN
      RAISE EXCEPTION
        'US-086: % lead row(s) still hold plaintext with no ciphertext. Run the backfill-lead-pii function before applying this migration; dropping now would destroy that contact data.',
        unbackfilled;
    END IF;
  END IF;
END
$$;

ALTER TABLE public.leads
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone;

COMMENT ON COLUMN public.leads.encrypted_email IS
  'AES-256-GCM ciphertext (enc:v1: envelope). The only store for a lead''s email since US-086; decrypt through the pii-crypto Edge Function. There is deliberately no plaintext column.';

COMMENT ON COLUMN public.leads.encrypted_phone IS
  'AES-256-GCM ciphertext (enc:v1: envelope). The only store for a lead''s phone since US-086; decrypt through the pii-crypto Edge Function. There is deliberately no plaintext column.';
