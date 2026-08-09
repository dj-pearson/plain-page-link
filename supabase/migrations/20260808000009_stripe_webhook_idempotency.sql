-- US-084: durable Stripe webhook idempotency.
--
-- stripe-webhook kept processed event ids in a module-level Map. Edge function
-- isolates are ephemeral and horizontally scaled, so Stripe's retries land on
-- cold instances with an empty map and reprocess the event. The comment in the
-- function said as much ("In production, consider using Redis or a database
-- table") and it was never done.
--
-- The unique constraint IS the check: an insert that conflicts means the event
-- has already been handled, which is race-free in a way a read-then-write is
-- not.

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id     text PRIMARY KEY,
  event_type   text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

-- Only the webhook touches this, and it uses the service role.
DROP POLICY IF EXISTS "Service role manages processed stripe events" ON public.stripe_processed_events;
CREATE POLICY "Service role manages processed stripe events"
  ON public.stripe_processed_events
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Stripe retries for at most a few days; keep a fortnight and let a cleanup job
-- trim the rest.
CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events (processed_at);

COMMENT ON TABLE public.stripe_processed_events IS
  'US-084: durable idempotency for stripe-webhook. Replaces an in-memory Map that reset on every cold start.';
