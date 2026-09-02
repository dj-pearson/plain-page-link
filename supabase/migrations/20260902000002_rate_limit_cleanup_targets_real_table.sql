-- US-098: cleanup_rate_limits() deleted from a table nothing writes.
--
-- check_rate_limit() reads and writes public.rate_limit_entries (identifier,
-- limit_type, window_start, window_end). cleanup_rate_limits() deleted from
-- public.rate_limits (ip_address, endpoint, window_start) — a different table,
-- left over from an earlier design, that no code has written to since. So the
-- cleanup ran successfully, removed nothing, and rate_limit_entries grew
-- without bound while its counters expired.
--
-- That orphan table is also where this story's headline bug came from: the
-- edge-function limiter called check_rate_limit with p_ip_address/p_endpoint,
-- which are rate_limits' column names, not the function's parameter names. The
-- table is left in place here rather than dropped — it holds no data anything
-- reads, and removing it belongs with the dead-code sweep (US-124) — but
-- nothing should reference it again.
--
-- Deleting on window_end rather than window_start: an entry is stale once its
-- window has closed, and window_end is the column check_rate_limit maintains.
-- The one-day grace is kept from the original.

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  DELETE FROM public.rate_limit_entries
  WHERE window_end < now() - INTERVAL '1 day';
$$;
