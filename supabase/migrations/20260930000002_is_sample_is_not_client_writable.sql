-- US-215: the is_sample flag switched off the paywall, and the client could set it.
--
-- Plan-limit triggers and locked_lead_ids() exempt sample rows, and plan_usage()
-- does not count them — rightly, for the demo content the admin
-- SampleDataManager seeds. But nothing stopped an agent writing is_sample
-- themselves. Reproduced on a free plan (5 links, 3 listings, 10 leads/month):
--   * 40 links, each inserted with is_sample = true (then left, or flipped);
--   * 30 listings inserted as samples — and the public listings policy did not
--     filter samples, so all 30 showed on the public profile;
--   * UPDATE leads SET is_sample = true unlocked every locked lead.
--
-- Now only the service role or an admin may set or change is_sample, and sample
-- rows are never shown to visitors: they are fabricated content, the same harm
-- US-109 removed for testimonials.

CREATE OR REPLACE FUNCTION public.guard_is_sample()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_sample)
     OR (TG_OP = 'UPDATE' AND NEW.is_sample IS DISTINCT FROM OLD.is_sample) THEN
    IF current_user IN ('anon', 'authenticated')
       AND NOT coalesce(public.has_role(auth.uid(), 'admin'::app_role), false) THEN
      RAISE EXCEPTION 'is_sample can only be set by an administrator'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads', 'links', 'listings', 'testimonials'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS guard_is_sample ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER guard_is_sample BEFORE INSERT OR UPDATE OF is_sample ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.guard_is_sample()', t);
  END LOOP;
END;
$$;

-- An admin turning a sample row into a real one is metered like an insert.
DROP TRIGGER IF EXISTS enforce_link_limit ON public.links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT OR UPDATE OF is_sample ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();

DROP TRIGGER IF EXISTS enforce_testimonial_limit ON public.testimonials;
CREATE TRIGGER enforce_testimonial_limit
  BEFORE INSERT OR UPDATE OF is_sample ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();

-- Visitors never see sample rows.
DROP POLICY IF EXISTS "Public can view active listings without user tracking" ON public.listings;
CREATE POLICY "Public can view active listings without user tracking" ON public.listings
  FOR SELECT
  USING (status = ANY (ARRAY['active'::text, 'pending'::text, 'under_contract'::text, 'sold'::text])
         AND NOT is_sample);

DROP POLICY IF EXISTS "Anyone can view active links" ON public.links;
CREATE POLICY "Anyone can view active links" ON public.links
  FOR SELECT
  USING (is_active = true AND NOT is_sample);

DROP POLICY IF EXISTS "Anyone can view published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view published testimonials" ON public.testimonials
  FOR SELECT
  USING (is_published = true AND NOT is_sample);
