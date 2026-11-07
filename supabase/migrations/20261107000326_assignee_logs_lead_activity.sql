-- US-326 (closes US-314): the teammate a lead is routed to can read and update
-- it, but cannot record a single thing they do with it.
--
-- 20260902000006 let the assignee (leads.assigned_to) SELECT and UPDATE a
-- routed lead and its timeline. It left two write paths owner-only:
--
--   * log_lead_activity, log_lead_call and log_lead_email (20260902000004)
--     guard on `leads.user_id = auth.uid()`. Every note, logged call, logged
--     email and contact action (useLeadContactAction) the assignee records
--     raises 'Lead not found or access denied', and the dashboard shows a
--     generic "Failed to log call".
--   * The lead_activities INSERT policy from the baseline ("Users can create
--     activities for own leads") checks `leads.user_id = auth.uid()`, so the
--     follow-ups and meetings useLeadActivities inserts directly are refused
--     by RLS the same way.
--
-- So routing hands a lead to a teammate whose work leaves no trace: no first
-- contact time (contacted_at, which the response-time SLA reads), no follow-up
-- reminders, no record for the owner of what happened.
--
-- Both now accept the lead's owner OR its current assignee. Nothing else
-- widens:
--   * The activity row is still written with user_id = auth.uid(), so it is
--     attributed to the person who did the work, and the RLS check still
--     requires that — nobody can write a row in someone else's name.
--   * A FORMER assignee is refused: the check reads assigned_to as it is now.
--   * DELETE is untouched (auth.uid() = user_id): an assignee can remove only
--     rows they authored.
--
-- CREATE OR REPLACE keeps each function's owner and ACL, so the EXECUTE grants
-- from 20260930000001 (authenticated only) stand; search_path stays pinned.

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

CREATE OR REPLACE FUNCTION public.log_lead_call(
  _lead_id uuid,
  _outcome text,
  _duration_seconds integer DEFAULT NULL::integer,
  _notes text DEFAULT NULL::text
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
  IF current_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id
      AND (user_id = current_user_id OR assigned_to = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  INSERT INTO public.lead_activities (
    lead_id, user_id, activity_type, title, content,
    call_duration_seconds, call_outcome, is_internal, metadata
  )
  VALUES (
    _lead_id, current_user_id, 'call', 'Phone call - ' || _outcome, _notes,
    _duration_seconds, _outcome, FALSE,
    jsonb_build_object('outcome', _outcome, 'duration', _duration_seconds)
  )
  RETURNING id INTO new_activity_id;

  UPDATE public.leads
  SET contacted_at = COALESCE(contacted_at, NOW()), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_lead_email(
  _lead_id uuid,
  _subject text,
  _recipient text,
  _body text DEFAULT NULL::text
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
  IF current_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id
      AND (user_id = current_user_id OR assigned_to = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  INSERT INTO public.lead_activities (
    lead_id, user_id, activity_type, title, content,
    email_subject, email_recipient, is_internal, metadata
  )
  VALUES (
    _lead_id, current_user_id, 'email', 'Email: ' || _subject, _body,
    _subject, _recipient, FALSE,
    jsonb_build_object('subject', _subject, 'recipient', _recipient)
  )
  RETURNING id INTO new_activity_id;

  UPDATE public.leads
  SET contacted_at = COALESCE(contacted_at, NOW()), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$function$;

-- The INSERT policy. Its name differs between environments (the baseline's
-- "Users can create activities for own leads"; older ones may carry another),
-- so drop whichever INSERT policies exist, as 20260902000006 did for
-- SELECT/UPDATE, rather than guess.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.lead_activities'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.lead_activities', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Users can create activities on their leads"
  ON public.lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  );
