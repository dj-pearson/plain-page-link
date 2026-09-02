-- US-109: make demo content identifiable, unpublishable and free of the quota.
--
-- generateSampleData inserted 4 listings against a free limit of 3, so the
-- agent's FIRST REAL listing was refused with "Upgrade required"; 4
-- testimonials with is_published = true, putting fabricated five-star reviews
-- ("Robert & Lisa Thompson… Highly recommend!") on a real licensed agent's
-- public page under their name; and 5 fake leads in their CRM. Nothing could
-- tell those rows from real ones afterwards, and deleteSampleData had no
-- caller.
--
-- The signup call is removed in the same change. This makes what remains — the
-- admin SampleDataManager — safe: tagged, excluded from limits, and removable.

ALTER TABLE public.listings     ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads        ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE public.links        ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.listings.is_sample IS
  'Demo content from SampleDataManager. Excluded from plan limits (US-109).';

-- Partial indexes: the predicate is `NOT is_sample`, which is almost every row,
-- so index the rare case instead and let the planner use it for cleanup.
CREATE INDEX IF NOT EXISTS idx_listings_sample     ON public.listings     (user_id) WHERE is_sample;
CREATE INDEX IF NOT EXISTS idx_testimonials_sample ON public.testimonials (user_id) WHERE is_sample;
CREATE INDEX IF NOT EXISTS idx_leads_sample        ON public.leads        (user_id) WHERE is_sample;
CREATE INDEX IF NOT EXISTS idx_links_sample        ON public.links        (user_id) WHERE is_sample;

-- ---------------------------------------------------------------------------
-- Demo rows must never count against what the agent is paying for.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_subscription_limit(_user_id uuid, _limit_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  current_count INTEGER;
  max_allowed   INTEGER;
BEGIN
  SELECT
    CASE
      WHEN _limit_type = 'listings'     THEN max_listings
      WHEN _limit_type = 'links'        THEN max_links
      WHEN _limit_type = 'testimonials' THEN max_testimonials
    END
  INTO max_allowed
  FROM public.subscriptions
  WHERE user_id = _user_id;

  -- No subscription row: treat as the free plan rather than as unlimited.
  -- Until US-068 restored the signup trigger this was every new account.
  IF max_allowed IS NULL THEN
    max_allowed := CASE _limit_type
      WHEN 'listings' THEN 3
      WHEN 'links' THEN 5
      WHEN 'testimonials' THEN 3
      ELSE 0
    END;
  END IF;

  -- -1 is unlimited, consistent with useSubscriptionLimits.canAdd().
  IF max_allowed = -1 THEN
    RETURN true;
  END IF;

  -- `AND NOT is_sample` is the change: demo content the platform inserted must
  -- not consume a quota the agent pays for (US-109).
  current_count := CASE _limit_type
    WHEN 'listings'     THEN (SELECT COUNT(*) FROM public.listings     WHERE user_id = _user_id AND NOT is_sample)
    WHEN 'links'        THEN (SELECT COUNT(*) FROM public.links        WHERE user_id = _user_id AND NOT is_sample)
    WHEN 'testimonials' THEN (SELECT COUNT(*) FROM public.testimonials WHERE user_id = _user_id AND NOT is_sample)
    ELSE 0
  END;

  RETURN current_count < max_allowed;
END;
$function$;

-- ---------------------------------------------------------------------------
-- A sample testimonial can never be published.
--
-- Belt and braces alongside the client writing is_published = false: this is a
-- fabricated review attributed by name to a real agent, so the database should
-- refuse it however it is inserted or later updated.
-- ---------------------------------------------------------------------------
ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_sample_not_published
  CHECK (NOT (is_sample AND is_published));
