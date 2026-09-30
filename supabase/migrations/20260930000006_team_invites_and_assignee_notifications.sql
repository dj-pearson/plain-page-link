-- US-226: team invites that can be accepted, and assignees who hear about it.
--
-- The Team plan's invite inserted a team_members row with user_id NULL and sent
-- nothing; an 'accept' action existed in the teams function but no page called
-- it. Lead routing only picks members with accepted_at and user_id set, so no
-- rule could ever assign anyone, and an assigned teammate would not have been
-- told.
--
-- Invites now carry a one-time token, emailed as a link. Only its SHA-256 is
-- stored: the roster is readable by every member (policy "Members read
-- roster"), and a raw token there would let any member accept someone else's
-- invite.

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS invite_token_hash text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS team_members_invite_token_hash_key
  ON public.team_members (invite_token_hash) WHERE invite_token_hash IS NOT NULL;

-- Tell a teammate when a lead is assigned to them, whether by a routing rule,
-- round robin, or by hand.
CREATE OR REPLACE FUNCTION public.notify_lead_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.assigned_to,
    'lead_assigned',
    'New lead assigned to you',
    coalesce(NEW.name, 'A lead') || ' (' || coalesce(NEW.lead_type, 'lead') || ') was assigned to you.',
    jsonb_build_object('lead_id', NEW.id, 'owner_id', NEW.user_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification must never cost the lead.
  RAISE WARNING 'notify_lead_assignee failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_lead_assignee() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_lead_assignee() TO service_role;

DROP TRIGGER IF EXISTS trg_notify_lead_assignee ON public.leads;
CREATE TRIGGER trg_notify_lead_assignee
  AFTER INSERT OR UPDATE OF assigned_to ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_lead_assignee();
