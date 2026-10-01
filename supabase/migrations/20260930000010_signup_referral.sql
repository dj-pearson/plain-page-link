-- US-232: which profile, and which campaign, brought each signup.
--
-- Every free profile carries "Powered by AgentBio", and the link was a bare
-- https://agentbio.net: signups from it could be neither counted nor rewarded.
-- The badge now links with ?ref=<username>; the app keeps it through
-- registration (src/lib/signupIntent.ts) and passes it in the signup metadata,
-- and handle_new_user records it here — only if it names a real profile.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_signup_source_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_signup_source_length
  CHECK (signup_source IS NULL OR length(signup_source) <= 100);

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (referred_by) WHERE referred_by IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  resolved_username text;
  referrer text;
BEGIN
  resolved_username := public.derive_available_username(
    new.raw_user_meta_data ->> 'username',
    new.email,
    new.id
  );

  -- Only a username that exists counts as a referral.
  SELECT p.username INTO referrer
    FROM public.profiles p
   WHERE lower(p.username) = lower(nullif(btrim(new.raw_user_meta_data ->> 'ref'), ''))
   LIMIT 1;

  INSERT INTO public.profiles (id, username, full_name, referred_by, signup_source)
  VALUES (
    new.id,
    resolved_username,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    referrer,
    left(nullif(btrim(new.raw_user_meta_data ->> 'signup_source'), ''), 100)
  );

  -- ON CONFLICT so re-running against a partially-provisioned account (or a
  -- database where the trigger fired once already) is not fatal.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$function$;

-- Attribution is set once, at signup. An agent editing their own profile row
-- (RLS allows it) must not be able to rewrite who referred them, or rewards
-- built on this column later could be claimed by anyone.
CREATE OR REPLACE FUNCTION public.guard_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.referred_by IS DISTINCT FROM OLD.referred_by OR NEW.signup_source IS DISTINCT FROM OLD.signup_source) THEN
    NEW.referred_by := OLD.referred_by;
    NEW.signup_source := OLD.signup_source;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_profile_referral ON public.profiles;
CREATE TRIGGER guard_profile_referral
  BEFORE UPDATE OF referred_by, signup_source ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_referral();
