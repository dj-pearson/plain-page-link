-- =============================================================================
-- Lead notification system (US-035)
-- =============================================================================
-- 1. Adds profiles.notification_preferences (jsonb) so agents can choose how
--    they are notified of new leads: 'instant' | 'daily_digest' | 'off'.
-- 2. Adds an AFTER INSERT trigger on leads that calls the notify-lead Edge
--    Function via pg_net, so every captured lead (regardless of code path)
--    can trigger a notification.
--
-- Operator setup required for the trigger to actually fire (it no-ops safely
-- until then):
--   create extension if not exists pg_net;
--   alter database postgres set "app.settings.functions_url" = 'https://<ref>.functions.supabase.co';
--   alter database postgres set "app.settings.service_role_key" = '<service_role_key>';
-- =============================================================================

-- 1. Notification preferences -------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"leads": "instant"}'::jsonb;

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'Per-agent notification settings. Keys: leads = instant | daily_digest | off.';

-- 2. Lead INSERT → notify-lead Edge Function ---------------------------------
-- Requires pg_net. Reads the function URL + service-role key from database
-- settings so no secrets are hard-coded in the migration. If either setting is
-- missing (e.g. local dev), the trigger function exits quietly without error.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_lead_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_functions_url TEXT := current_setting('app.settings.functions_url', true);
  v_service_key   TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  -- No-op when not configured (keeps local/dev inserts working).
  IF v_functions_url IS NULL OR v_service_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_functions_url || '/notify-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let notification failure block lead capture.
    RAISE WARNING 'notify_lead_on_insert failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_lead_on_insert ON public.leads;
CREATE TRIGGER trg_notify_lead_on_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_on_insert();
