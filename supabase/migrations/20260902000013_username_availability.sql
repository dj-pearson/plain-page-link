-- US-117: "available" was answered by a query that could not see the rows that
-- matter.
--
-- useUsernameCheck asked PostgREST directly:
--
--   supabase.from('profiles').select('id').eq('username', name).maybeSingle()
--
-- as the anon (or a logged-in) user. Since 20260808000002 the public SELECT
-- policy on `profiles` is scoped to published rows, so a username held by an
-- unpublished profile — every account that has not published yet, which
-- includes every account mid-signup — came back as no row, and the field said
-- "Username is available". The insert then failed on the unique index, and the
-- agent saw a generic failure with no idea which field caused it.
--
-- check_username_available() already exists and is SECURITY DEFINER, so it sees
-- every row. It was simply never called from the client. Two changes make it
-- usable everywhere the question is asked:
--
--   1. _current_user_id gets a default. At signup there is no current user, and
--      the parameter was required — which is part of why the client went round
--      it. NULL now means "nobody to exclude".
--
--   2. The search_path is pinned in full. It read `SET search_path TO 'public'`,
--      which leaves pg_temp searched FIRST inside a SECURITY DEFINER function:
--      a caller can create a temp table named `profiles` and the function will
--      read theirs instead. Naming pg_temp last is what closes that.

CREATE OR REPLACE FUNCTION public.check_username_available(
  _username text,
  _current_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  -- An empty or absent name is not "available" — it is not a username.
  IF _username IS NULL OR btrim(_username) = '' THEN
    RETURN false;
  END IF;

  -- IS DISTINCT FROM, not !=: with a NULL _current_user_id (the signup case)
  -- `id != NULL` is NULL for every row, so the EXISTS found nothing and every
  -- username read as available.
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(username) = lower(btrim(_username))
      AND id IS DISTINCT FROM _current_user_id
  );
END;
$function$;

COMMENT ON FUNCTION public.check_username_available(text, uuid) IS
  'US-117: the only correct way to ask whether a username is free. A direct profiles query sees published rows only and reports taken names as available.';

GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO anon, authenticated;
