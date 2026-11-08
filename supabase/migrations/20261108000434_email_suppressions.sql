-- US-425 / US-434: an opt-out list for marketing email.
--
-- The free-tool drips (listing description generator, Instagram bio analyzer)
-- had no working unsubscribe: the listing drip linked /unsubscribe, a route
-- the app never had, the bio drip linked nothing, and neither checked for an
-- opt-out before sending.
--
-- email_suppressions holds one row per address that has opted out, keyed by
-- the same keyed HMAC of lower(trim(email)) that leads.email_hash uses
-- (emailLookupHash in supabase/functions/_shared/spam-guard.ts), so the list
-- stores no address in plaintext and can later be matched against leads and
-- contacts (US-135) without decrypting anything.
--
-- Written and read only by edge functions with the service role
-- (email-unsubscribe writes, the drip senders read). The browser has no
-- business here: no policy for anon/authenticated, and their table grants are
-- revoked so a later permissive policy could not expose it either.

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email_hash text PRIMARY KEY,
  -- Which list the person was on when they opted out ('listing' | 'bio').
  source text NOT NULL CHECK (source IN ('listing', 'bio')),
  -- 'link' = the /unsubscribe page, 'one_click' = the mail client's
  -- List-Unsubscribe button (RFC 8058).
  method text NOT NULL CHECK (method IN ('link', 'one_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_suppressions IS
  'Addresses that opted out of marketing email, by keyed hash (emailLookupHash). Service role only. US-425.';

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_suppressions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_suppressions TO service_role;

DROP POLICY IF EXISTS "Service role manages email suppressions" ON public.email_suppressions;
CREATE POLICY "Service role manages email suppressions"
  ON public.email_suppressions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
