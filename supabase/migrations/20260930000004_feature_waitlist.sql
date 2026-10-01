-- US-224: measure demand for add-ons before building them.
--
-- The pricing page sold MLS Integration ($25/mo), CRM Connectors ($20/mo each),
-- SMS Notifications ($15/mo) and Premium Themes ($15 one-time). None of them
-- exists — there is no MLS code, no SMS provider, and one-time payments were
-- removed from the webhook in US-059. The cards are now "Notify me" buttons,
-- and each press is a row here.
--
-- Visitors may add a row (signed in or not) but nobody reads through the API:
-- the numbers are for the operator, via the service role.

CREATE TABLE IF NOT EXISTS public.feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL CHECK (feature IN ('mls_integration', 'crm_connectors', 'sms_notifications', 'premium_themes')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feature_waitlist_feature_idx ON public.feature_waitlist (feature, created_at DESC);

ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can register interest" ON public.feature_waitlist;
CREATE POLICY "Anyone can register interest" ON public.feature_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages the waitlist" ON public.feature_waitlist;
CREATE POLICY "Service role manages the waitlist" ON public.feature_waitlist
  FOR ALL TO service_role USING (true) WITH CHECK (true);
