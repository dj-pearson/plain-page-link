-- US-651 (US-638, slice 2 of US-627): refuse a past open-house start in the
-- database.
--
-- US-628 added the rule to the scheduling form only (pastStartError in
-- src/lib/openHouseSchedule.ts). A direct PostgREST call with the anon key and
-- the agent's JWT could still insert an open house that started yesterday.
-- That burns a slot of open_houses_per_month (the plan trigger counts the
-- month the open house happens in), puts a past date on the public page and
-- opens the /open-house/:id kiosk for a house nobody is standing in.
--
-- The rule, the same as the form's:
--   * a new open house may not start more than 30 minutes ago
--     ("I forgot to schedule it, it's on now" is real; yesterday is not);
--   * an update that moves starts_at is held to the same rule;
--   * an update that leaves starts_at where it was is always allowed, so the
--     agent can fix the notes on, or cancel, one that already happened.
-- Keep the 30 minutes in step with PAST_START_GRACE_MS.
--
-- Refused as check_violation with DETAIL 'open_house:past_start', which
-- openHouseSaveErrorMessage (src/lib/openHouseSchedule.ts) recognises.
--
-- Only client roles are held to it. The function is SECURITY INVOKER so
-- current_user is the caller's role; the service role, migrations and
-- SECURITY DEFINER functions (backfills, admin repair, imports) are exempt,
-- the same split guard_frozen_columns (20261028000004) uses.
--
-- ends_at <= starts_at is already refused by the open_houses_ends_after_start
-- CHECK constraint (20260923000001); the client now words that error too.
--
-- The trigger is named so it fires before enforce_open_house_limit (BEFORE
-- triggers run in name order): a past start is reported as a past start, not
-- as a full month.

CREATE OR REPLACE FUNCTION public.check_open_house_start()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.starts_at IS NOT DISTINCT FROM OLD.starts_at THEN
    RETURN NEW;
  END IF;
  IF NEW.starts_at < now() - interval '30 minutes' THEN
    RAISE EXCEPTION 'That start time has already passed. Choose a date and time that is still ahead.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'open_house:past_start';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.check_open_house_start() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.check_open_house_start() IS
  'US-651: refuses an anon/authenticated open_houses write whose new starts_at is more than 30 minutes in the past.';

DROP TRIGGER IF EXISTS check_open_house_start ON public.open_houses;
CREATE TRIGGER check_open_house_start
  BEFORE INSERT OR UPDATE OF starts_at ON public.open_houses
  FOR EACH ROW EXECUTE FUNCTION public.check_open_house_start();
