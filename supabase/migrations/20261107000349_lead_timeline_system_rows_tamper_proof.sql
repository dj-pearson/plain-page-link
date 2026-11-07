-- US-349 (closes US-335 and US-313): a lead's timeline is an audit trail, and
-- the browser could forge, rewrite and delete the system's rows in it.
--
-- lead_activities holds two kinds of row:
--   * agent-authored: note, call, email, sms, meeting, task — what a person
--     did with the lead, written through log_lead_activity / log_lead_call /
--     log_lead_email or the useLeadActivities inserts (meeting, task);
--   * system: status_change (auto_log_lead_status_change) and form_submission
--     (auto_log_lead_creation) — the record of what happened to the lead.
--     Both triggers are SECURITY DEFINER, owned by the table owner, so RLS
--     does not apply to them and nothing below affects them. notify-lead and
--     execute-workflow write with the service role, which bypasses RLS too.
--
-- Before this migration, with the shipped anon key and their own session:
--   1. log_lead_activity inserted whatever _activity_type it was handed, so the
--      owner or assignee could write a 'status_change' or 'form_submission'
--      row that LeadDetailModal renders as a system event (US-335).
--   2. The INSERT policy (20261107000326) checked only who and which lead, so
--      the same forgery worked by inserting into the table directly.
--   3. "Users can delete own activities" (baseline) was USING
--      (auth.uid() = user_id). System rows carry the lead owner's user_id, so
--      the owner could delete the lead's status history and its creation
--      record (US-313). The UI hid the button (canDeleteActivity); the
--      database did not.
--   4. "Users can update activities on their leads" (20260902000006) let the
--      owner or assignee UPDATE any row on the lead — system rows, and rows a
--      teammate wrote — with table-wide UPDATE granted and no WITH CHECK, so
--      a status_change could be rewritten, a note turned into a status_change,
--      or a row re-attributed to someone else.
--
-- After it, all four use one list of agent-authored types. The same list is
-- AGENT_AUTHORED_ACTIVITY_TYPES in src/lib/leadActivityTypes.ts, which
-- canDeleteActivity (LeadDetailModal.tsx) and the useLeadActivities types
-- read; src/lib/leadTimelineIntegrity.test.ts fails if the two drift.
--
-- The only UPDATE the dashboard makes is completing a follow-up
-- (useLeadActivities completeTask: SET task_completed_at). So, as US-322 did
-- for notifications, UPDATE is narrowed to that one column for the browser,
-- and the policy keeps the owner-or-assignee rule (an assignee may complete a
-- follow-up the owner or a workflow created) but only on task rows.

-- 1. log_lead_activity refuses system types. CREATE OR REPLACE keeps its owner
--    and ACL (authenticated only, 20260930000001); search_path stays pinned.
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  _lead_id uuid,
  _activity_type text,
  _content text DEFAULT NULL::text,
  _title text DEFAULT NULL::text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Agent-authored types only; see AGENT_AUTHORED_ACTIVITY_TYPES.
  IF _activity_type IS NULL
     OR _activity_type NOT IN ('note', 'call', 'email', 'sms', 'meeting', 'task') THEN
    RAISE EXCEPTION 'Activity type % cannot be logged by hand', coalesce(_activity_type, 'null')
      USING ERRCODE = 'check_violation';
  END IF;

  IF current_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id
      AND (user_id = current_user_id OR assigned_to = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  INSERT INTO public.lead_activities (
    lead_id, user_id, activity_type, title, content, metadata
  )
  VALUES (
    _lead_id, current_user_id, _activity_type, _title, _content, _metadata
  )
  RETURNING id INTO new_activity_id;

  IF _activity_type IN ('email', 'call', 'meeting', 'sms') THEN
    UPDATE public.leads
    SET contacted_at = COALESCE(contacted_at, NOW()), updated_at = NOW()
    WHERE id = _lead_id;
  END IF;

  RETURN new_activity_id;
END;
$function$;

-- 2. INSERT: the US-326 rule, plus agent-authored types only. Policy names
--    differ between environments, so drop whichever INSERT, UPDATE and DELETE
--    policies exist, as 20261107000326 did, rather than guess a name. SELECT
--    (20260902000006) is untouched.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.lead_activities'::regclass AND polcmd IN ('a', 'w', 'd')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.lead_activities', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Users can create activities on their leads"
  ON public.lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND activity_type IN ('note', 'call', 'email', 'sms', 'meeting', 'task')
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  );

-- 3. DELETE: only rows you wrote, and only agent-authored ones (US-313). The
--    status history and the lead's creation record cannot be removed.
CREATE POLICY "Users can delete activities they wrote"
  ON public.lead_activities FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND activity_type IN ('note', 'call', 'email', 'sms', 'meeting', 'task')
  );

-- 4. UPDATE: completing a follow-up is the only browser update. Column grant
--    first, so no other column (activity_type, user_id, content, new_status…)
--    is writable at all; the service role keeps its full grant.
REVOKE UPDATE ON public.lead_activities FROM PUBLIC, anon, authenticated;
GRANT UPDATE (task_completed_at) ON public.lead_activities TO authenticated;

CREATE POLICY "Users can complete follow-ups on their leads"
  ON public.lead_activities FOR UPDATE
  TO authenticated
  USING (
    activity_type = 'task'
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  )
  WITH CHECK (
    activity_type = 'task'
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  );

COMMENT ON COLUMN public.lead_activities.activity_type IS
  'note, call, email, sms, meeting, task: written by an agent (AGENT_AUTHORED_ACTIVITY_TYPES). status_change, form_submission: written only by the SECURITY DEFINER lead triggers; the browser cannot insert, update or delete them (US-349).';
