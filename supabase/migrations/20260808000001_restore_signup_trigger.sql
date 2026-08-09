-- US-068: restore the signup trigger, and stop discarding the chosen username.
--
-- public.handle_new_user() survived the US-060 squash but the trigger that
-- invokes it did not: the squashed baseline was produced from a `public`-schema
-- dump, and `on_auth_user_created` lives on `auth.users`, which is not part of
-- the public schema. On any database built from supabase/migrations/, inserting
-- into auth.users therefore creates 0 profiles and 0 user_roles, which in turn
-- means no default subscription (create_default_subscription fires on a
-- profiles INSERT that never happens).
--
-- The function body regressed at the same time. It set username to the first 9
-- hex characters of the user's UUID, discarding the username Register.tsx
-- validates, checks for availability, and passes in raw_user_meta_data — on a
-- link-in-bio product, where the username is the address the whole account is
-- reachable at.
--
-- This migration is safe to apply to a database that already carries the
-- trigger (production probably does, from before the squash).

-- ---------------------------------------------------------------------------
-- Username derivation
-- ---------------------------------------------------------------------------
-- Kept as a separate function so it can be tested directly and reused if a
-- username-change endpoint is added later.
--
-- Rules mirror usernameSchema in src/utils/validation.ts (3-30 chars,
-- [a-zA-Z0-9_-]) and RESERVED_USERNAMES in src/lib/usernameValidation.ts.
-- Everything is normalised to lower case: profiles_username_key is a
-- case-sensitive unique index but check_username_available() compares with
-- LOWER(), so mixed-case signups would otherwise be able to create two profiles
-- the availability check considers the same. Normalising at creation closes
-- that for new rows. (Making profiles_username_key itself case-insensitive is
-- deliberately out of scope here — it can fail on existing data.)
CREATE OR REPLACE FUNCTION public.derive_available_username(
  p_requested text,
  p_email text,
  p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  reserved CONSTANT text[] := ARRAY[
    'admin','administrator','root','support','help','api','www',
    'mail','smtp','ftp','blog','dev','test','staging','prod',
    'dashboard','settings','profile','login','logout','signup',
    'register','auth','pricing','about','contact','terms','privacy',
    'agentbio','agent','bio','realtor','realestate'
  ];
  base      text;
  candidate text;
  suffix    int := 1;
BEGIN
  -- Prefer what the user chose; fall back to the local part of their email.
  base := COALESCE(NULLIF(trim(p_requested), ''), split_part(COALESCE(p_email, ''), '@', 1));
  base := lower(base);

  -- Drop anything usernameSchema would reject.
  base := regexp_replace(base, '[^a-z0-9_-]', '', 'g');
  base := left(base, 30);

  -- Too short (or emptied out entirely) and reserved names both fall back to a
  -- stable, collision-resistant value derived from the user id.
  IF length(base) < 3 OR base = ANY (reserved) THEN
    base := 'user-' || left(replace(p_user_id::text, '-', ''), 8);
  END IF;

  candidate := base;

  -- Deterministic suffixing on collision. Bounded so a pathological case cannot
  -- spin: after 50 tries fall back to the user id, which is unique by
  -- construction.
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
    suffix := suffix + 1;
    IF suffix > 50 THEN
      RETURN left(replace(p_user_id::text, '-', ''), 20);
    END IF;
    -- Keep room for the suffix inside the 30-char limit.
    candidate := left(base, 30 - (length(suffix::text) + 1)) || '-' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$function$;

COMMENT ON FUNCTION public.derive_available_username(text, text, uuid) IS
  'US-068: normalises a requested username to the app''s rules and resolves collisions deterministically.';

-- ---------------------------------------------------------------------------
-- handle_new_user
-- ---------------------------------------------------------------------------
-- Errors are deliberately NOT swallowed. A signup that cannot create its
-- profile must fail loudly rather than leave the user in the state this
-- migration exists to fix — an account with no profile, no role and no
-- subscription, which the frontend then papers over with a 3.1-second retry
-- loop. The username path above is written so that a collision cannot be the
-- cause of such a failure.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  resolved_username text;
BEGIN
  resolved_username := public.derive_available_username(
    new.raw_user_meta_data ->> 'username',
    new.email,
    new.id
  );

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    resolved_username,
    COALESCE(new.raw_user_meta_data ->> 'full_name', '')
  );

  -- ON CONFLICT so re-running against a partially-provisioned account (or a
  -- database where the trigger fired once already) is not fatal.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'US-068: provisions profile + default role on signup. Invoked by on_auth_user_created.';

-- ---------------------------------------------------------------------------
-- The trigger the squash dropped
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
