-- =============================================================================
-- Lead response-time tracking (US-052)
-- =============================================================================
-- Adds leads.first_responded_at and auto-populates it the first time a lead
-- moves out of 'new' status. Response time = first_responded_at - created_at.
-- =============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS first_responded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.leads.first_responded_at IS
  'Timestamp of the first response (when status first left ''new''). Used for response-time SLA tracking.';

-- Auto-populate on the first transition out of 'new'.
CREATE OR REPLACE FUNCTION public.set_lead_first_responded_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.first_responded_at IS NULL
     AND OLD.status = 'new'
     AND NEW.status IS DISTINCT FROM 'new' THEN
    NEW.first_responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_first_responded_at ON public.leads;
CREATE TRIGGER trg_lead_first_responded_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_first_responded_at();

-- Backfill: for leads already responded to, use contacted_at when present.
UPDATE public.leads
SET first_responded_at = contacted_at
WHERE first_responded_at IS NULL
  AND status IS DISTINCT FROM 'new'
  AND contacted_at IS NOT NULL;

-- Index supporting the "needs attention" (still-new) and response-time queries.
CREATE INDEX IF NOT EXISTS idx_leads_user_responded
  ON public.leads (user_id, first_responded_at);
