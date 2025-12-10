-- =============================================
-- Lead Activities / Timeline Persistence
-- =============================================
-- This migration creates the infrastructure for:
-- 1. Persistent lead activity timeline
-- 2. Activity logging for CRM interactions
-- 3. Functions for recording and querying activities
-- =============================================

-- =============================================
-- 1. Lead Activities Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity type and content
  activity_type TEXT NOT NULL, -- 'note', 'email', 'call', 'meeting', 'status_change', 'task', 'sms', 'form_submission'
  title TEXT,
  content TEXT,

  -- For status change activities
  previous_status TEXT,
  new_status TEXT,

  -- For email activities
  email_subject TEXT,
  email_recipient TEXT,

  -- For call activities
  call_duration_seconds INTEGER,
  call_outcome TEXT, -- 'answered', 'voicemail', 'no_answer', 'busy'

  -- For meeting activities
  meeting_type TEXT, -- 'in_person', 'video', 'phone'
  meeting_location TEXT,
  meeting_scheduled_at TIMESTAMPTZ,

  -- For task activities
  task_due_date TIMESTAMPTZ,
  task_completed_at TIMESTAMPTZ,
  task_priority TEXT, -- 'low', 'medium', 'high'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT TRUE, -- Internal note vs. external communication

  -- Timestamps
  activity_at TIMESTAMPTZ DEFAULT NOW(), -- When the activity occurred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX idx_lead_activities_activity_at ON public.lead_activities(activity_at DESC);
CREATE INDEX idx_lead_activities_lead_activity_at ON public.lead_activities(lead_id, activity_at DESC);

-- RLS Policies
-- Users can view activities for their own leads
CREATE POLICY "Users can view activities for own leads"
  ON public.lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can create activities for their own leads
CREATE POLICY "Users can create activities for own leads"
  ON public.lead_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can update their own activities
CREATE POLICY "Users can update own activities"
  ON public.lead_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON public.lead_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lead_activities_updated_at
  BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Activity Summary View
-- =============================================
CREATE OR REPLACE VIEW public.lead_activity_summary AS
SELECT
  la.lead_id,
  COUNT(*) AS total_activities,
  COUNT(*) FILTER (WHERE la.activity_type = 'note') AS notes_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'email') AS emails_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'call') AS calls_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'meeting') AS meetings_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'status_change') AS status_changes_count,
  MAX(la.activity_at) AS last_activity_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'email') AS last_email_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'call') AS last_call_at,
  MIN(la.activity_at) AS first_activity_at
FROM public.lead_activities la
GROUP BY la.lead_id;

-- =============================================
-- 3. Helper Functions
-- =============================================

-- Function to log a lead activity
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  _lead_id UUID,
  _activity_type TEXT,
  _content TEXT DEFAULT NULL,
  _title TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    _activity_type,
    _title,
    _content,
    _metadata
  )
  RETURNING id INTO new_activity_id;

  -- Update lead's last_contacted_at for communication activities
  IF _activity_type IN ('email', 'call', 'meeting', 'sms') THEN
    UPDATE public.leads
    SET last_contacted_at = NOW(), updated_at = NOW()
    WHERE id = _lead_id;
  END IF;

  RETURN new_activity_id;
END;
$$;

-- Function to log status change
CREATE OR REPLACE FUNCTION public.log_lead_status_change(
  _lead_id UUID,
  _previous_status TEXT,
  _new_status TEXT,
  _note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the status change activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    previous_status,
    new_status,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'status_change',
    'Status changed to ' || _new_status,
    _note,
    _previous_status,
    _new_status,
    jsonb_build_object('previous_status', _previous_status, 'new_status', _new_status)
  )
  RETURNING id INTO new_activity_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log email activity
CREATE OR REPLACE FUNCTION public.log_lead_email(
  _lead_id UUID,
  _subject TEXT,
  _recipient TEXT,
  _body TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the email activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    email_subject,
    email_recipient,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'email',
    'Email: ' || _subject,
    _body,
    _subject,
    _recipient,
    FALSE,
    jsonb_build_object('subject', _subject, 'recipient', _recipient)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log call activity
CREATE OR REPLACE FUNCTION public.log_lead_call(
  _lead_id UUID,
  _outcome TEXT,
  _duration_seconds INTEGER DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the call activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    call_duration_seconds,
    call_outcome,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'call',
    'Phone call - ' || _outcome,
    _notes,
    _duration_seconds,
    _outcome,
    FALSE,
    jsonb_build_object('outcome', _outcome, 'duration', _duration_seconds)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to get lead timeline
CREATE OR REPLACE FUNCTION public.get_lead_timeline(
  _lead_id UUID,
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = _lead_id AND leads.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    la.id,
    la.activity_type,
    la.title,
    la.content,
    la.metadata,
    la.activity_at,
    la.created_at
  FROM public.lead_activities la
  WHERE la.lead_id = _lead_id
  ORDER BY la.activity_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- =============================================
-- 4. Trigger to auto-log status changes on leads table
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (
      lead_id,
      user_id,
      activity_type,
      title,
      previous_status,
      new_status,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'auto_logged', true)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_status_change();

-- =============================================
-- 5. Auto-log lead creation
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'form_submission',
    'Lead created',
    'New lead captured from ' || COALESCE(NEW.source, 'direct'),
    jsonb_build_object(
      'source', NEW.source,
      'type', NEW.type,
      'auto_logged', true
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_creation();

-- =============================================
-- 6. Comments for documentation
-- =============================================
COMMENT ON TABLE public.lead_activities IS 'Persistent timeline of all lead activities and interactions';
COMMENT ON VIEW public.lead_activity_summary IS 'Aggregated activity metrics per lead';
COMMENT ON FUNCTION public.log_lead_activity IS 'Log a generic activity for a lead';
COMMENT ON FUNCTION public.log_lead_status_change IS 'Log a status change for a lead';
COMMENT ON FUNCTION public.log_lead_email IS 'Log an email sent to a lead';
COMMENT ON FUNCTION public.log_lead_call IS 'Log a phone call with a lead';
COMMENT ON FUNCTION public.get_lead_timeline IS 'Get paginated timeline for a lead';
