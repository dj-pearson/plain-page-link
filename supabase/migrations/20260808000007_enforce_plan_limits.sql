-- US-080: enforce plan limits server-side. They have been advisory.
--
-- useSubscriptionLimits.canAdd() gates the UI and nothing else:
-- check_subscription_limit() and check_feature_limit() exist but no trigger and
-- no RLS policy calls either. The only constraint on listings, links and
-- testimonials is auth.uid() = user_id, so a free-plan user (3 listings) can
-- POST to /rest/v1/listings with their own JWT and create as many as they like.
--
-- check_subscription_limit() is not reused as the enforcement point, because it
-- gets two cases wrong:
--   * -1 means unlimited everywhere else in the product (see
--     useSubscriptionLimits.canAdd), but `count < -1` is false, so it would
--     block every insert on an unlimited plan;
--   * with no subscriptions row, max_allowed is NULL and `count < NULL` is
--     NULL, not false — a NULL guard would fail open.
-- It is fixed below as well, since other callers may appear, but enforcement
-- goes through a dedicated function.

-- ---------------------------------------------------------------------------
-- Correct the existing helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_subscription_limit(_user_id uuid, _limit_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

  current_count := CASE _limit_type
    WHEN 'listings'     THEN (SELECT COUNT(*) FROM public.listings     WHERE user_id = _user_id)
    WHEN 'links'        THEN (SELECT COUNT(*) FROM public.links        WHERE user_id = _user_id)
    WHEN 'testimonials' THEN (SELECT COUNT(*) FROM public.testimonials WHERE user_id = _user_id)
    ELSE 0
  END;

  RETURN current_count < max_allowed;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Enforcement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  limit_type CONSTANT text := TG_ARGV[0];
BEGIN
  -- Only the owner acting on their own account is metered.
  --
  -- Anonymous inserts are deliberately exempt: a visitor submitting a review
  -- (US-074) or a lead has no way to know or influence the agent's plan, and
  -- silently dropping someone's review because the agent is at their tier
  -- would be a worse failure than the overage. The service role is exempt for
  -- the same reason — backfills and webhooks are not user actions.
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF NOT public.check_subscription_limit(NEW.user_id, limit_type) THEN
    RAISE EXCEPTION
      'Plan limit reached for %. Upgrade your plan to add more.', limit_type
      USING ERRCODE = 'check_violation',
            HINT = 'See /dashboard/subscription';
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.enforce_plan_limit() IS
  'US-080: makes subscription tiers real. Meters only owner-initiated inserts.';

DROP TRIGGER IF EXISTS enforce_listing_limit ON public.listings;
CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('listings');

DROP TRIGGER IF EXISTS enforce_link_limit ON public.links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('links');

DROP TRIGGER IF EXISTS enforce_testimonial_limit ON public.testimonials;
CREATE TRIGGER enforce_testimonial_limit
  BEFORE INSERT ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('testimonials');
