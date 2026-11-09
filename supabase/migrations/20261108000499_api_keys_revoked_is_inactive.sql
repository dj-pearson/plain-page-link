-- US-499 (US-384): a revoked API key is never is_active.
--
-- api_keys carries two revocation columns. Before US-377 the api-keys edge
-- function revoked a key by setting revoked_at only, so every key revoked
-- before then still reads is_active = true. validateApiKey / resolveApiKey
-- (supabase/functions/_shared/api-auth.ts isApiKeyUsable) refuse a key when
-- revoked_at is set OR is_active is false, so those rows do not authenticate,
-- but the columns disagree:
--
--   * the partial indexes idx_api_keys_key_hash and idx_api_keys_expires_at
--     (WHERE is_active = true) still index revoked keys;
--   * the GDPR export (_shared/gdpr-export.ts) hands the data subject
--     is_active = true for a key they revoked;
--   * any future reader that checks only one column (webhook-auth.ts once did,
--     see the US-377 note in api-auth.ts) would accept a revoked key.
--
-- Two parts:
--   1. Backfill: every row with revoked_at set becomes is_active = false.
--   2. A CHECK constraint so the two can never disagree again. The only
--      writer (the api-keys function's revoke action) already sets both; the
--      browser roles hold no write grant on the table (US-377).
--
-- revoked_at stays the authority for "when"; is_active = false with no
-- revoked_at is still allowed (a key switched off without a revocation time).

UPDATE public.api_keys
   SET is_active = false
 WHERE revoked_at IS NOT NULL
   AND is_active IS TRUE;

ALTER TABLE public.api_keys
  DROP CONSTRAINT IF EXISTS api_keys_revoked_is_inactive;

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_revoked_is_inactive
  CHECK (revoked_at IS NULL OR is_active = false);

COMMENT ON CONSTRAINT api_keys_revoked_is_inactive ON public.api_keys IS
  'US-499 (US-384): a key with revoked_at set must have is_active = false, so the partial indexes on is_active, the GDPR export and any single-column reader agree with revocation.';
