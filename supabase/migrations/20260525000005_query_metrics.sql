-- =============================================================================
-- Query performance monitoring (US-047)
-- =============================================================================
-- Stores timing for slow queries (>500ms) captured by the db-monitor wrapper
-- in edge functions. Supabase manages connection pooling (PgBouncer/Supavisor);
-- this focuses on slow-query identification.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.query_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL,      -- stable label/hash of the query
  duration_ms INTEGER NOT NULL,
  endpoint TEXT,                  -- edge function / call site
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.query_metrics IS
  'Slow-query timings (>500ms) recorded by edge functions for performance monitoring.';

CREATE INDEX IF NOT EXISTS idx_query_metrics_created_at
  ON public.query_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_metrics_duration
  ON public.query_metrics (duration_ms DESC);

ALTER TABLE public.query_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can read metrics; writes come from the service role (edge functions).
DROP POLICY IF EXISTS "Admins read query metrics" ON public.query_metrics;
CREATE POLICY "Admins read query metrics"
  ON public.query_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role writes query metrics" ON public.query_metrics;
CREATE POLICY "Service role writes query metrics"
  ON public.query_metrics FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup: delete metrics older than 30 days (call from a cron schedule).
CREATE OR REPLACE FUNCTION public.cleanup_query_metrics()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.query_metrics WHERE created_at < now() - INTERVAL '30 days';
$$;

-- Top slowest queries in the last 24h (used by the admin widget).
CREATE OR REPLACE FUNCTION public.top_slow_queries(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (query_hash TEXT, endpoint TEXT, max_ms INTEGER, avg_ms NUMERIC, calls BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT query_hash,
         endpoint,
         MAX(duration_ms) AS max_ms,
         ROUND(AVG(duration_ms), 0) AS avg_ms,
         COUNT(*) AS calls
  FROM public.query_metrics
  WHERE created_at >= now() - INTERVAL '24 hours'
  GROUP BY query_hash, endpoint
  ORDER BY max_ms DESC
  LIMIT p_limit;
$$;
