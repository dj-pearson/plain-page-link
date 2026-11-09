-- US-354 (US-344): one row per digest day once a complete, error-free pass
-- has finished.
--
-- scheduled-maintenance runs hourly, and every run in the catch-up window
-- (DIGEST_HOUR_UTC to DIGEST_CATCHUP_HOURS after it, US-331) used to re-read
-- every profile, their digest_log rows, new leads, due tasks and key dates —
-- and on Mondays three count queries per agent — only to find that everyone
-- had been sent or had nothing to send. The first clean pass now writes this
-- row, and later unforced runs that day return before reading any profile.
-- A pass that ended with any error writes nothing, so the next run retries.

CREATE TABLE IF NOT EXISTS public.digest_runs (
  digest_date date PRIMARY KEY,
  completed_at timestamptz NOT NULL DEFAULT now(),
  profiles integer NOT NULL DEFAULT 0 CHECK (profiles >= 0),
  sent integer NOT NULL DEFAULT 0 CHECK (sent >= 0)
);

ALTER TABLE public.digest_runs ENABLE ROW LEVEL SECURITY;

-- Only the scheduled job reads or writes it.
REVOKE ALL ON public.digest_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digest_runs TO service_role;

DROP POLICY IF EXISTS "Service role manages digest runs" ON public.digest_runs;
CREATE POLICY "Service role manages digest runs" ON public.digest_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
