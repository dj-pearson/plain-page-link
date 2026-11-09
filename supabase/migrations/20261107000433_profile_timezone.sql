-- US-433: agents get a time zone (owner decision 2026-11-07).
--
-- Every scheduled email ran on UTC: the morning digest went out at
-- DIGEST_HOUR_UTC, which is 05:00 in Los Angeles in winter and the next
-- afternoon in Sydney (US-343), and the overdue-lead chaser emails at any hour
-- (US-318). Both need to know where the agent is.
--
-- profiles.timezone holds an IANA zone name ('America/Los_Angeles'). NULL means
-- the agent has not set one, and the jobs keep their UTC behaviour for them.
-- The dashboard fills it from the browser the first time the agent saves their
-- notification settings, and Settings lets them change it.
--
-- It is a private column, like notification_preferences: no column grant to
-- anon or authenticated is added (20261028000003), so the owner reads it
-- through get_own_profile() and writes it under the existing "own profile"
-- UPDATE policies. The scheduled job reads it as service_role.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.profiles.timezone IS
  'US-433: the agent''s IANA time zone, e.g. America/Los_Angeles. NULL = not set (scheduled emails fall back to UTC). Validated by validate_profile_timezone.';

-- A CHECK constraint cannot consult pg_timezone_names, so a trigger validates.
-- Trimmed, '' becomes NULL, and the name must be one Postgres knows. The
-- posix/ and right/ trees are refused: they are aliases the browser's Intl
-- (and Deno's) does not accept, and the job would silently fall back to UTC.
CREATE OR REPLACE FUNCTION public.validate_profile_timezone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.timezone IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.timezone IS NOT DISTINCT FROM OLD.timezone THEN
    RETURN NEW;
  END IF;

  NEW.timezone := btrim(NEW.timezone);
  IF NEW.timezone = '' THEN
    NEW.timezone := NULL;
    RETURN NEW;
  END IF;

  IF length(NEW.timezone) > 64
     OR NEW.timezone LIKE 'posix/%'
     OR NEW.timezone LIKE 'right/%'
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'That is not a time zone we recognise. Pick one from the list.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'invalid_timezone';
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.validate_profile_timezone() IS
  'US-433: BEFORE INSERT/UPDATE trigger on profiles; refuses a timezone that is not an IANA name Postgres knows.';

-- Only ever called as a trigger.
REVOKE EXECUTE ON FUNCTION public.validate_profile_timezone() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validate_profile_timezone ON public.profiles;
CREATE TRIGGER validate_profile_timezone
  BEFORE INSERT OR UPDATE OF timezone ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_timezone();

-- get_own_profile() returns SETOF profiles, so the new column is part of its
-- row already; restated so the owner's read path is visible next to the column.
CREATE OR REPLACE FUNCTION public.get_own_profile()
 RETURNS SETOF public.profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$function$;

REVOKE EXECUTE ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated, service_role;

-- The digest's per-day run marker (US-354) was keyed by the UTC date alone.
-- Agents with a time zone get their edition at their own local hour, so each
-- (local date, scheduled instant) is its own edition with its own marker.
-- slot = '' is the UTC edition for agents with no time zone, which keeps the
-- rows already written meaning what they meant.
ALTER TABLE public.digest_runs ADD COLUMN IF NOT EXISTS slot text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.digest_runs'::regclass
       AND conname = 'digest_runs_pkey'
       AND array_length(conkey, 1) = 1
  ) THEN
    ALTER TABLE public.digest_runs DROP CONSTRAINT digest_runs_pkey;
    ALTER TABLE public.digest_runs ADD CONSTRAINT digest_runs_pkey PRIMARY KEY (digest_date, slot);
  END IF;
END;
$$;
