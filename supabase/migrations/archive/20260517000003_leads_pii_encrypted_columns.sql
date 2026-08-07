-- =============================================================================
-- Leads PII Encryption: add encrypted columns (transition phase)
-- =============================================================================
-- Adds nullable encrypted_phone / encrypted_email columns alongside the
-- existing plaintext phone / email columns. The application layer
-- (src/hooks/useLeads.ts via src/lib/pii.ts) now dual-writes: it stores
-- the AES-256-GCM ciphertext in the encrypted_* columns while continuing
-- to write the plaintext columns so nothing breaks during rollout.
--
-- Transition strategy (intentionally gradual — do NOT drop plaintext here):
--   1. THIS migration: add encrypted_* columns (nullable).
--   2. App change (same PR): new/updated leads dual-write encrypted_*;
--      reads prefer encrypted_* and fall back to plaintext.
--   3. Separate backfill job: encrypt existing rows' phone/email into
--      encrypted_* (run out-of-band, idempotent, batched).
--   4. Verification window: confirm 100% of rows have encrypted_* and
--      reads no longer use the plaintext fallback.
--   5. Separate later migration: drop the plaintext phone/email columns
--      (and update NOT NULL constraints / dependent views) once the
--      backfill is verified complete.
--
-- Keeping both columns during the window means a rollback is safe: the
-- plaintext data is still authoritative until step 5.
-- =============================================================================

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS encrypted_phone TEXT,
    ADD COLUMN IF NOT EXISTS encrypted_email TEXT;

COMMENT ON COLUMN public.leads.encrypted_phone IS
    'AES-256-GCM ciphertext of phone (enc:v1: prefixed). Plaintext phone column remains authoritative until backfill is verified.';
COMMENT ON COLUMN public.leads.encrypted_email IS
    'AES-256-GCM ciphertext of email (enc:v1: prefixed). Plaintext email column remains authoritative until backfill is verified.';
