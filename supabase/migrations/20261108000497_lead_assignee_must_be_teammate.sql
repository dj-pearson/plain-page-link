-- US-497 (US-489): a lead can be handed only to an accepted teammate.
--
-- The Leads dashboard now lets the owner choose who holds a lead. The leads
-- UPDATE policy (20261028000004) lets the owner set assigned_to to ANY uuid,
-- and whoever assigned_to names can then read and update the lead (the
-- assignee policies on leads and lead_activities) and decrypt its email and
-- phone (pii-crypto decrypt_leads filters user_id OR assigned_to), and is sent
-- a "lead assigned to you" notification (notify_lead_assignee). So a stale
-- dialog naming someone who has since left, or a hand-written request, could
-- give a lead's contact details to a person outside the team.
--
-- This trigger holds a browser caller to the same set the dialog offers and
-- that routing already uses (auto_assign_lead, US-454): nobody (NULL), the
-- lead's owner, or an accepted member of a team the owner owns.
--
-- SECURITY INVOKER on purpose: current_user must be the caller's role, so
-- service role and SECURITY DEFINER functions (auto_assign_lead, the US-475
-- departure trigger, admin repair) are not bound by it. The lookup runs under
-- the caller's RLS: the owner reads their own teams row ("Team members read
-- team") and its roster ("Members read roster" via is_team_admin). A caller who
-- is not the lead's owner cannot change assigned_to at all — the policy's
-- WITH CHECK refuses it — so the RLS-scoped lookup is never the deciding gate
-- for them.

CREATE OR REPLACE FUNCTION public.guard_lead_assignee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.teams t
      JOIN public.team_members m ON m.team_id = t.id
     WHERE t.owner_id = NEW.user_id
       AND m.user_id = NEW.assigned_to
       AND m.accepted_at IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'A lead can only be assigned to an accepted member of your team'
    USING ERRCODE = 'check_violation', DETAIL = 'lead_assignee_not_teammate';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guard_lead_assignee() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.guard_lead_assignee() IS
  'US-497: refuses a browser write that sets leads.assigned_to to anyone but NULL, the owner, or an accepted member of a team the owner owns.';

DROP TRIGGER IF EXISTS guard_lead_assignee ON public.leads;
CREATE TRIGGER guard_lead_assignee
  BEFORE INSERT OR UPDATE OF assigned_to ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.guard_lead_assignee();
