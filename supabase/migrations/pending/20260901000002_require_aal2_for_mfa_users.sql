-- US-085: require aal2 for users who have enrolled a second factor.
--
-- NOT APPLIED YET. See supabase/migrations/pending/README.md — this locks out
-- every enrolled agent if it lands before the native MFA client flow is
-- deployed and users have re-enrolled, because until then nobody holds an
-- aal2 token.
--
-- This is the half of US-085 that does the enforcing. Without it, MFA is a
-- client-side opinion: signInWithPassword issues a real session before any
-- second factor is considered, so someone with the password alone can call
-- PostgREST directly and read everything the account can read. The `aal`
-- claim in the JWT is the only thing an attacker cannot set, so it is the only
-- place the check is worth making.
--
-- Shape of the predicate, on every policy below:
--
--   NOT enrolled                    -> allowed at aal1. There is no second
--                                      factor to demand.
--   enrolled AND aal = 'aal2'       -> allowed. Challenge completed.
--   enrolled AND aal = 'aal1'       -> denied. This is the case the story is
--                                      about.
--
-- auth.jwt() ->> 'aal' is null for tokens minted before AAL existed, which
-- reads as aal1 and so denies — the safe direction.

CREATE OR REPLACE FUNCTION public.mfa_satisfied()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM auth.mfa_factors f
        WHERE f.user_id = auth.uid() AND f.status = 'verified'
      ) THEN true
      ELSE COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    END;
$$;

COMMENT ON FUNCTION public.mfa_satisfied() IS
  'True when the caller has no verified second factor, or has one and this session has completed it (aal2). US-085.';

REVOKE ALL ON FUNCTION public.mfa_satisfied() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated;

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.mfa_satisfied());

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.mfa_satisfied())
  WITH CHECK (auth.uid() = user_id AND public.mfa_satisfied());

DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Users can delete own leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.mfa_satisfied());

-- INSERT is deliberately NOT gated: public capture forms write leads through
-- submit-lead as the anon role, and holding those to aal2 would break every
-- public profile.

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.mfa_satisfied());

DROP POLICY IF EXISTS "Users can view own user_subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own user_subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.mfa_satisfied());
