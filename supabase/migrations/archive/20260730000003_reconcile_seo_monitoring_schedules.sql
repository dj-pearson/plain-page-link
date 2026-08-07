-- =============================================================================
-- Corrective migration: reconcile public.seo_monitoring_schedules
-- =============================================================================
-- ROOT CAUSE
--   Same divergence pattern already documented in
--   20260525120000_reconcile_leads_columns.sql, on a different table.
--
--   20251105191514_e217a6bc-... created seo_monitoring_schedules with a MINIMAL
--   column set (id, name, schedule_type, target_url, frequency, is_active,
--   next_run_at, last_run_at, created_at).
--
--   The next day, 20251106000002_seo_automated_monitoring.sql declared the
--   authoritative, much richer definition of the same table using a plain
--   CREATE TABLE (no IF NOT EXISTS). Against a database that already had the
--   minimal table that statement raises "relation already exists", so none of
--   the additional columns ever materialised. That file also aborts earlier, at
--   `CREATE TABLE public.seo_notification_preferences`, for the same reason.
--
-- CONSEQUENCES
--   1. Every UPDATE to the table fails outright. 20251106000002 also attaches
--      `update_seo_schedules_updated_at BEFORE UPDATE ... update_updated_at_column()`,
--      and that function assigns NEW.updated_at. With no updated_at column,
--      PL/pgSQL raises `record "new" has no field "updated_at"` and the
--      statement aborts.
--   2. supabase/functions/run-scheduled-audit writes last_run_status and
--      last_run_duration_ms on both its success and failure paths. Those columns
--      exist only in the authoritative definition, so scheduled SEO audits can
--      never record their outcome.
--   3. The minimal CHECK on schedule_type allows only
--      full_audit/keyword_check/broken_links/security_scan, but
--      run-scheduled-audit dispatches on content_optimization, security_headers
--      and image_optimization as well — values neither definition permits.
--
-- FIX
--   Additive and idempotent, mirroring the leads reconcile: ADD COLUMN IF NOT
--   EXISTS for every column the authoritative definition declares, widen the two
--   CHECK constraints to the union of what the definitions and the edge function
--   actually use, and (re)create the updated_at trigger. Safe to run whether or
--   not the richer columns are already present.
-- =============================================================================

ALTER TABLE public.seo_monitoring_schedules
  -- Required by the BEFORE UPDATE trigger; without it no UPDATE can succeed.
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT now(),
  -- Written by run-scheduled-audit on every run.
  ADD COLUMN IF NOT EXISTS last_run_status       TEXT,
  ADD COLUMN IF NOT EXISTS last_run_duration_ms  INTEGER,
  -- Remaining columns from the authoritative 20251106000002 definition.
  ADD COLUMN IF NOT EXISTS description           TEXT,
  ADD COLUMN IF NOT EXISTS additional_urls       TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cron_expression       TEXT,
  ADD COLUMN IF NOT EXISTS time_of_day           TIME,
  ADD COLUMN IF NOT EXISTS day_of_week           INTEGER,
  ADD COLUMN IF NOT EXISTS day_of_month          INTEGER,
  ADD COLUMN IF NOT EXISTS timezone              TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS config                JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS run_count             INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_count         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by            UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.seo_monitoring_schedules.updated_at IS
  'Maintained by update_seo_schedules_updated_at (reconciled from 20251106000002).';
COMMENT ON COLUMN public.seo_monitoring_schedules.last_run_status IS
  'Outcome of the most recent run, written by run-scheduled-audit.';

-- Backfill so the column is meaningful on pre-existing rows.
UPDATE public.seo_monitoring_schedules
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

-- Widen schedule_type to the union of both definitions plus the values
-- run-scheduled-audit actually dispatches on.
ALTER TABLE public.seo_monitoring_schedules
  DROP CONSTRAINT IF EXISTS seo_monitoring_schedules_schedule_type_check;
ALTER TABLE public.seo_monitoring_schedules
  ADD CONSTRAINT seo_monitoring_schedules_schedule_type_check
  CHECK (schedule_type IN (
    'full_audit', 'quick_scan', 'keyword_check', 'broken_links',
    'core_web_vitals', 'security_scan', 'competitor_check', 'custom',
    -- Handled by run-scheduled-audit but absent from both original CHECKs.
    'content_optimization', 'security_headers', 'image_optimization'
  ));

ALTER TABLE public.seo_monitoring_schedules
  DROP CONSTRAINT IF EXISTS seo_monitoring_schedules_frequency_check;
ALTER TABLE public.seo_monitoring_schedules
  ADD CONSTRAINT seo_monitoring_schedules_frequency_check
  CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom'));

ALTER TABLE public.seo_monitoring_schedules
  DROP CONSTRAINT IF EXISTS seo_monitoring_schedules_last_run_status_check;
ALTER TABLE public.seo_monitoring_schedules
  ADD CONSTRAINT seo_monitoring_schedules_last_run_status_check
  CHECK (last_run_status IS NULL OR last_run_status IN ('success', 'failed', 'partial'));

-- Ensure the trigger exists; it is only correct now that updated_at does.
DROP TRIGGER IF EXISTS update_seo_schedules_updated_at ON public.seo_monitoring_schedules;
CREATE TRIGGER update_seo_schedules_updated_at
  BEFORE UPDATE ON public.seo_monitoring_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
