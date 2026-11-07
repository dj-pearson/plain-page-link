-- US-377 (US-366): api_keys rows are written by the api-keys edge function only.
--
-- The baseline left three owner write policies on api_keys, none with a TO
-- clause, on a table where Supabase grants INSERT/UPDATE/DELETE to anon and
-- authenticated:
--
--   "Users can create own api_keys"  FOR INSERT WITH CHECK (auth.uid() = user_id)
--   "Users can update own api_keys"  FOR UPDATE USING (auth.uid() = user_id)
--   "Users can delete own api_keys"  FOR DELETE USING (auth.uid() = user_id)
--
-- With the anon key and their own JWT an agent could, straight against
-- PostgREST:
--   * INSERT a row with a key_hash they chose — a key minted outside
--     supabase/functions/api-keys, past its 10-active-key cap and with no
--     api_key_create audit event;
--   * UPDATE a key they had revoked back to revoked_at = NULL (the omitted
--     WITH CHECK defaults to USING, which only looks at user_id), widen its
--     permissions to {"write": true}, push expires_at out, or swap key_hash;
--   * DELETE a key, erasing the record that it existed and when it was used.
--
-- Nothing in the browser writes the table: src/pages/dashboard/ApiKeysPage.tsx
-- lists, creates and revokes through the api-keys edge function, which uses
-- the service role. authenticateApiKey / validateApiKey (_shared) also use a
-- service client. Account erasure removes keys through the auth.users
-- ON DELETE CASCADE, which runs as the table owner.
--
-- So: revoke the browser roles' write grants (TRUNCATE too — it is not subject
-- to RLS) and drop the owner write policies. A key is retired by revoking it
-- (revoked_at), never by deleting it. The owner's SELECT policy is unchanged.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.api_keys FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can create own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own api_keys" ON public.api_keys;

COMMENT ON TABLE public.api_keys IS
  'API keys (SHA-256 hash + 8-char prefix only). System-written only (US-377): the api-keys edge function creates and revokes them with the service role, enforcing the active-key cap and writing the audit event. The owner may SELECT their rows. A key is retired by setting revoked_at (and is_active = false), never by deleting it.';
