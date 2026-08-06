-- =============================================================================
-- Centralized API Rate Limiting
-- =============================================================================
-- Replaces the per-instance in-memory limiter with a database-backed
-- fixed-window counter so limits are enforced consistently across all
-- edge function instances.
--
-- Strategy: one counter row per (ip_address, endpoint, window_start).
-- The check_rate_limit() function atomically upserts/increments the
-- counter and reports whether the request is allowed.
--
-- Partitioning note: rate_limits is high-churn but short-lived. When the
-- table grows, partition BY RANGE (window_start) per day and drop old
-- partitions instead of DELETE. For now a scheduled cleanup of rows older
-- than 1 day is sufficient (see cleanup_rate_limits()).
-- =============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ip_address, endpoint, window_start)
);

-- Fast lookups for the (ip, endpoint, window) counter and for cleanup.
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
    ON rate_limits (ip_address, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
    ON rate_limits (window_start);

-- RLS: this table is only ever touched by edge functions using the
-- service role key (which bypasses RLS). No client access is allowed.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- check_rate_limit: atomic fixed-window counter
-- =============================================================================
-- Returns a single row: allowed (bool), remaining (int), reset_at (timestamptz).
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_ip_address TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    -- Bucket the current time into a fixed window.
    v_window_start := to_timestamp(
        floor(extract(epoch FROM NOW()) / p_window_seconds) * p_window_seconds
    );

    INSERT INTO rate_limits (ip_address, endpoint, window_start, request_count)
    VALUES (p_ip_address, p_endpoint, v_window_start, 1)
    ON CONFLICT (ip_address, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_count;

    RETURN QUERY SELECT
        v_count <= p_max_requests,
        GREATEST(p_max_requests - v_count, 0),
        v_window_start + make_interval(secs => p_window_seconds);
END;
$$;

-- =============================================================================
-- cleanup_rate_limits: delete stale counter rows (call from a cron job)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
$$;
