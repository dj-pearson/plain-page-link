-- US-373 (closes US-336): a logged meeting did not count as first contact.
--
-- leads.contacted_at is the lead's FIRST contact time. The Leads page measures
-- response time from it and the "uncontacted" views read it as NULL. Every
-- contact path sets it once with COALESCE(contacted_at, NOW()):
-- log_lead_call, log_lead_email and log_lead_activity for
-- email/call/meeting/sms (20261107000326, 20261107000349).
--
-- The dashboard's "Log meeting" form (LeadDetailModal -> useLeadActivities
-- logMeeting) did not use any of them. It inserted into lead_activities
-- directly, because log_lead_activity has no meeting_type, meeting_location
-- or meeting_scheduled_at parameters. The row reached the timeline, but
-- contacted_at stayed NULL. An agent whose first contact was a meeting still
-- showed the lead as never contacted, and the response-time numbers counted
-- it as unanswered.
--
-- log_lead_meeting is the meeting version of log_lead_call. It applies the
-- same rule as the other three RPCs:
--   * the caller must be the lead's owner or its CURRENT assignee (US-326);
--   * the row is written under auth.uid(), so it is attributed to the person
--     who held the meeting;
--   * contacted_at is set once and never moved.
-- meeting_type is checked against the three types the form offers
-- (MeetingType in useLeadActivities.ts). The column has no CHECK constraint,
-- so this is the only guard on it for this path.
--
-- New public function: Supabase grants EXECUTE to anon and authenticated by
-- default, so revoke it all and grant authenticated only, like the other
-- log_lead_* RPCs (20260930000001). It is listed in DEFINER_CALLABLE in
-- scripts/verify-schema.mjs.

CREATE OR REPLACE FUNCTION public.log_lead_meeting(
  _lead_id uuid,
  _meeting_type text,
  _location text DEFAULT NULL::text,
  _scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
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
  IF _meeting_type IS NULL OR _meeting_type NOT IN ('in_person', 'video', 'phone') THEN
    RAISE EXCEPTION 'Unknown meeting type %', coalesce(_meeting_type, 'null')
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
    lead_id, user_id, activity_type, title, content,
    meeting_type, meeting_location, meeting_scheduled_at, is_internal, metadata
  )
  VALUES (
    _lead_id, current_user_id, 'meeting',
    CASE _meeting_type
      WHEN 'in_person' THEN 'In-person meeting'
      WHEN 'video' THEN 'Video meeting'
      ELSE 'Phone meeting'
    END,
    _notes,
    _meeting_type, _location, _scheduled_at, FALSE,
    jsonb_build_object('meeting_type', _meeting_type, 'scheduled_at', _scheduled_at)
  )
  RETURNING id INTO new_activity_id;

  UPDATE public.leads
  SET contacted_at = COALESCE(contacted_at, NOW()), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_lead_meeting(uuid, text, text, timestamp with time zone, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_lead_meeting(uuid, text, text, timestamp with time zone, text)
  TO authenticated, service_role;
