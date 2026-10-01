-- US-230: one morning email per agent per day, however often the job runs.
--
-- scheduled-maintenance runs hourly. It claims (user, day, kind) here before
-- sending — the primary key is the check — and releases the claim if the send
-- fails, so a retry can send and a re-run cannot double-send.

CREATE TABLE IF NOT EXISTS public.digest_log (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('daily', 'weekly')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, digest_date, kind)
);

ALTER TABLE public.digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages digests" ON public.digest_log;
CREATE POLICY "Service role manages digests" ON public.digest_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
