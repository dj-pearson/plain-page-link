-- US-074: make public review submission possible, with moderation.
--
-- /:username/review is a public, unauthenticated page (SubmitReview.tsx, routed
-- at App.tsx:220) that inserts into testimonials with user_id set to the AGENT's
-- id. The only INSERT policy was WITH CHECK (auth.uid() = user_id), so as anon
-- the insert was always rejected — every submission showed "Submission failed".
-- `leads` has an explicit "Anyone can submit leads" policy; testimonials never
-- got the equivalent.
--
-- The obvious fix on its own would be worse than the bug. testimonials.is_published
-- DEFAULTED TO TRUE, so simply adding an anon INSERT policy would let anyone
-- publish arbitrary text — including defamatory text — straight onto any agent's
-- public profile with no review. The default and the policy have to change
-- together, and the policy forces the column rather than trusting the default.

-- ---------------------------------------------------------------------------
-- Moderation by default
-- ---------------------------------------------------------------------------
ALTER TABLE public.testimonials ALTER COLUMN is_published SET DEFAULT false;

-- Existing rows are left as they are: they were created by the agent through
-- the dashboard, where publishing is the agent's own decision.

-- ---------------------------------------------------------------------------
-- Anonymous submission
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can submit a review for a published profile"
  ON public.testimonials FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Pending review, always. Forced here rather than left to the column
    -- default so a caller cannot pass is_published => true explicitly.
    is_published = false
    -- Only for a profile that is actually published; a review cannot be used to
    -- probe for or attach rows to accounts that are not public.
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = testimonials.user_id
        AND p.is_published = true
    )
    -- Cheap sanity bounds. The edge-function path validates properly; this is
    -- the backstop for the direct insert the RLS policy permits.
    AND rating BETWEEN 1 AND 5
    AND length(coalesce(client_name, '')) BETWEEN 1 AND 100
    AND length(coalesce(review, '')) BETWEEN 1 AND 2000
  );

-- The submitting visitor must not be able to read anything back. The existing
-- "Anyone can view published testimonials" policy (is_published = true) already
-- covers the public display case, and a pending review is not published, so no
-- additional SELECT grant is needed — and none should be added: SubmitReview
-- must not use .select().single() after the insert, because the implied
-- RETURNING needs exactly the SELECT policy anon must not have. This is the
-- same trap US-067 hit on the free-tool capture tables.

COMMENT ON POLICY "Anyone can submit a review for a published profile" ON public.testimonials IS
  'US-074: anonymous review capture. Forces is_published = false so submissions await the agent''s approval.';
