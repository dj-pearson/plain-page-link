-- US-227: the funnel an agent can act on — views, form opens, submissions and
-- taps, by the campaign that brought the visitor.
--
-- What was recorded before:
--   * Form submissions went to `window.analytics`, which nothing defines, and
--     to the visitor's own localStorage — never to the agent.
--   * The sticky bar's Schedule, Home Value and Contact taps were dropped,
--     because analytics_events' CHECK allowed only four types.
--   * Social icons and listing opens were not tracked at all.
--   * Profile views stored document.referrer and no UTM, while leads have
--     carried utm_* since US-188 — so views-to-leads per campaign could not be
--     computed, and in-app browsers (Instagram, TikTok) send no referrer.

ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_type_check;
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_type_check CHECK (
  event_type IN (
    'link_click', 'contact_call', 'contact_email', 'contact_text',
    'form_open', 'form_submit', 'cta_click', 'social_click', 'listing_view'
  )
);

ALTER TABLE public.analytics_views ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.analytics_views ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.analytics_views ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Visitor-supplied strings: bounded, like everything else a visitor writes.
ALTER TABLE public.analytics_views DROP CONSTRAINT IF EXISTS analytics_views_utm_length;
ALTER TABLE public.analytics_views ADD CONSTRAINT analytics_views_utm_length CHECK (
  coalesce(length(utm_source), 0) <= 100 AND coalesce(length(utm_medium), 0) <= 100
  AND coalesce(length(utm_campaign), 0) <= 200
);
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_utm_length;
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_utm_length CHECK (
  coalesce(length(utm_source), 0) <= 100 AND coalesce(length(utm_campaign), 0) <= 200
);

CREATE INDEX IF NOT EXISTS idx_analytics_views_user_utm
  ON public.analytics_views (user_id, utm_source, viewed_at DESC);

-- Views → leads by campaign source for the caller, since a date. SECURITY
-- INVOKER, so the plan's analytics history window (RLS on analytics_views,
-- 20260923000002) applies exactly as it does to the charts.
CREATE OR REPLACE FUNCTION public.campaign_conversion(p_since timestamptz DEFAULT NULL)
RETURNS TABLE (source text, views bigint, form_opens bigint, leads bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH v AS (
    SELECT coalesce(nullif(lower(utm_source), ''), 'direct') AS source, count(*) AS n
      FROM public.analytics_views
     WHERE user_id = auth.uid() AND (p_since IS NULL OR viewed_at >= p_since)
     GROUP BY 1
  ), f AS (
    SELECT coalesce(nullif(lower(utm_source), ''), 'direct') AS source, count(*) AS n
      FROM public.analytics_events
     WHERE user_id = auth.uid() AND event_type = 'form_open' AND (p_since IS NULL OR occurred_at >= p_since)
     GROUP BY 1
  ), l AS (
    SELECT coalesce(nullif(lower(utm_source), ''), 'direct') AS source, count(*) AS n
      FROM public.leads
     WHERE user_id = auth.uid() AND (p_since IS NULL OR created_at >= p_since)
     GROUP BY 1
  )
  SELECT s.source,
         coalesce(v.n, 0) AS views,
         coalesce(f.n, 0) AS form_opens,
         coalesce(l.n, 0) AS leads
    FROM (SELECT source FROM v UNION SELECT source FROM f UNION SELECT source FROM l) s
    LEFT JOIN v USING (source)
    LEFT JOIN f USING (source)
    LEFT JOIN l USING (source)
   ORDER BY coalesce(v.n, 0) DESC, coalesce(l.n, 0) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.campaign_conversion(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campaign_conversion(timestamptz) TO authenticated, service_role;
