-- US-249: find a sign-in's existing account by email, at any size.
--
-- oauth-proxy (Google/Apple) and sso-callback looked for an existing account
-- with auth.admin.listUsers() and searched the result. listUsers() returns the
-- first page only (50 users by default), so once the project had more than 50
-- accounts a returning user beyond that page was "not found": oauth-proxy then
-- called createUser, which failed with email_exists, and the agent was bounced
-- to /auth/login?error=create_user_failed on every social sign-in.
--
-- This is a single indexed lookup instead. It reads auth.users, so it must
-- never be reachable from the browser: anyone holding the anon key could
-- otherwise test which addresses have accounts. Service role only.

CREATE OR REPLACE FUNCTION public.auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT u.id
    FROM auth.users u
   WHERE p_email IS NOT NULL
     AND lower(u.email) = lower(btrim(p_email))
     AND u.deleted_at IS NULL
   ORDER BY u.created_at
   LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_id_by_email(text) TO service_role;

COMMENT ON FUNCTION public.auth_user_id_by_email(text) IS
  'Service role only. The auth.users id for an email (case-insensitive), or NULL. Used by oauth-proxy and sso-callback (US-249) instead of the first page of auth.admin.listUsers().';
