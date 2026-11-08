-- US-475 (US-465): leads already assigned to a teammate stay readable by them
-- after they leave or are removed.
--
-- The leads SELECT and UPDATE policies (20260902000006, 20261028000004) and
-- the lead_activities policies (20261107000349) all admit
-- `auth.uid() = assigned_to`. US-454 stopped routing NEW leads to a departed
-- member, but every lead already assigned to them kept that assignment, so
-- the person the team removed could go on reading those leads, their
-- timelines, and updating their status.
--
-- Product call: the leads become UNASSIGNED (assigned_to = NULL), not
-- reassigned to the owner. The owner already owns them (leads.user_id) and
-- sees them in their CRM either way; NULL is what the Leads page shows as
-- unassigned, it sends no "lead assigned to you" notification
-- (notify_lead_assignee returns early on NULL), and it does not pretend the
-- owner chose to take them. The owner reassigns from there.
--
-- Two parts:
--   1. A team_members AFTER DELETE trigger clears assigned_to on every lead
--      assigned to the departed user whose owner no longer shares a team with
--      them, and writes one audit row per departure with the count. The test
--      is "owner still has them as an accepted member of a team they own",
--      not "owner of OLD.team_id", so it also holds when the whole team is
--      deleted (the teams row is gone by the time the cascade fires this).
--   2. Leads that already point at someone off the owner's team are cleared.

-- ---------------------------------------------------------------------------
-- 1. Unassign a departed member's leads.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unassign_leads_for_departed_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_owner_id uuid;
  v_count integer;
BEGIN
  UPDATE public.leads l
     SET assigned_to = NULL
   WHERE l.assigned_to = OLD.user_id
     AND l.user_id <> OLD.user_id
     AND NOT EXISTS (
       SELECT 1
         FROM public.teams t
         JOIN public.team_members m ON m.team_id = t.id
        WHERE t.owner_id = l.user_id
          AND m.user_id = OLD.user_id
          AND m.accepted_at IS NOT NULL
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    SELECT t.owner_id INTO v_owner_id FROM public.teams t WHERE t.id = OLD.team_id;
    PERFORM public.log_audit_event(
      v_owner_id, 'team_member_leads_unassigned', 'success', 'team', OLD.team_id::text,
      NULL, NULL,
      jsonb_build_object('departed_user_id', OLD.user_id, 'leads_unassigned', v_count),
      'low', NULL
    );
  END IF;

  RETURN OLD;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.unassign_leads_for_departed_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_leads_for_departed_member() TO service_role;

DROP TRIGGER IF EXISTS unassign_leads_on_member_delete ON public.team_members;
CREATE TRIGGER unassign_leads_on_member_delete
  AFTER DELETE ON public.team_members
  FOR EACH ROW
  -- A pending invite with no user can hold no assignment.
  WHEN (OLD.user_id IS NOT NULL)
  EXECUTE FUNCTION public.unassign_leads_for_departed_member();

-- ---------------------------------------------------------------------------
-- 2. Clear assignments that already point outside the owner's team.
-- ---------------------------------------------------------------------------
UPDATE public.leads l
   SET assigned_to = NULL
 WHERE l.assigned_to IS NOT NULL
   AND l.assigned_to <> l.user_id
   AND NOT EXISTS (
     SELECT 1
       FROM public.teams t
       JOIN public.team_members m ON m.team_id = t.id
      WHERE t.owner_id = l.user_id
        AND m.user_id = l.assigned_to
        AND m.accepted_at IS NOT NULL
   );
