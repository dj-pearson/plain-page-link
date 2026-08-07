-- ============================================================================
-- Critical fix: auto_log_lead_creation() aborts every INSERT into public.leads
-- ============================================================================
-- The AFTER INSERT trigger `on_lead_created` (added by
-- 20251209000002_create_lead_activities_table.sql) builds its metadata with
-- `NEW.type`. public.leads has no `type` column — the column is `lead_type` —
-- and PL/pgSQL resolves record fields at run time, so the function raises
--
--     ERROR: record "new" has no field "type"
--
-- on every insert. Because the trigger has no exception handler, the error
-- propagates and aborts the whole statement, so NO lead can be created at all:
-- every public lead-capture form, the mortgage calculator's lead capture, and
-- CSV import all fail.
--
-- This was not caught earlier because the trigger is only exercised against a
-- database that actually has the trigger installed, and the repo has no
-- integration test that inserts a lead.
--
-- Every other trigger function on public.leads (auto_assign_lead,
-- notify_new_lead) correctly reads NEW.lead_type, which confirms this is a typo
-- rather than a renamed column. The fix keeps the emitted JSON key as `type` so
-- that any consumer of lead_activities.metadata continues to see the same shape.

CREATE OR REPLACE FUNCTION public.auto_log_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      'type', NEW.lead_type,
      'auto_logged', true
    )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_log_lead_creation IS
  'Logs a form_submission activity when a lead is created. Reads NEW.lead_type '
  '(there is no NEW.type — see migration 20260730000002).';
