-- US-100: log_lead_activity, log_lead_call and log_lead_email each end with
--   UPDATE public.leads SET last_contacted_at = NOW()
-- and `leads` has no last_contacted_at column. It has contacted_at.
--
-- plpgsql resolves the name when the statement first executes, not when the
-- function is created, so this passed CREATE FUNCTION and every structural
-- lint. Reproduced against the applied schema:
--
--   SELECT log_lead_call('<lead>', 'connected', 120, 'Talked through budget');
--   ERROR: column "last_contacted_at" of relation "leads" does not exist
--   CONTEXT: PL/pgSQL function log_lead_call(uuid,text,integer,text) line 40
--
-- The activity row is inserted before that UPDATE, so the exception rolls the
-- whole transaction back: the agent logs a call and both the call and the
-- contact timestamp are lost, with a database error surfacing to the UI. It is
-- latent only because nothing in src/ calls these yet — US-102 is the story
-- that starts to, which is why this lands first.
--
-- contacted_at is set with COALESCE(contacted_at, NOW()) rather than NOW():
-- the column records FIRST contact (Leads.tsx measures response time from it
-- and the SLA card keys off it), so overwriting it on every later call would
-- make an agent look faster the more often they followed up.

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
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
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
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
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
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
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
