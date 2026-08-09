-- US-089: narrow the SEO tables that anon and every authenticated user can read.
--
-- Two shapes, both too wide:
--   * `USING (true)` with no TO clause on seo_core_web_vitals and
--     seo_keyword_history — Postgres defaults that to TO PUBLIC, so anon reads
--     them, and the anon key ships in the frontend bundle.
--   * `USING (auth.uid() IS NOT NULL)` on eight more, so any registered user
--     reads the entire SEO programme — including seo_security_analysis, which
--     is a list of the site's own security findings.
--
-- Access model matches the one US-063 and US-067 established: anon nothing,
-- authenticated nothing unless it owns the row, admin via has_role,
-- service_role everything. Each table already carries an
-- "Admins can manage ..." ALL policy, so dropping the broad SELECT is
-- sufficient — no replacement admin policy is needed.
--
-- seo_settings is deliberately NOT touched: it holds the site-wide title,
-- description, robots.txt and verification tags that are emitted into every
-- page head, so a public read is the point. It is declared in
-- PUBLIC_BY_DESIGN in scripts/verify-schema.mjs for the same reason.

-- Anon-readable (USING (true), no TO clause).
DROP POLICY IF EXISTS "Public can view core web vitals" ON public.seo_core_web_vitals;
DROP POLICY IF EXISTS "Public can view keyword history" ON public.seo_keyword_history;

-- Readable by any signed-in user.
DROP POLICY IF EXISTS "All authenticated users can view alerts" ON public.seo_alerts;
DROP POLICY IF EXISTS "Authenticated users can view competitor analysis" ON public.seo_competitor_analysis;
DROP POLICY IF EXISTS "Authenticated users can view crawl results" ON public.seo_crawl_results;
DROP POLICY IF EXISTS "Authenticated users can view mobile analysis" ON public.seo_mobile_analysis;
DROP POLICY IF EXISTS "Users can view monitoring logs" ON public.seo_monitoring_log;
DROP POLICY IF EXISTS "Users can view monitoring schedules" ON public.seo_monitoring_schedules;
DROP POLICY IF EXISTS "Authenticated users can view page scores" ON public.seo_page_scores;
DROP POLICY IF EXISTS "Authenticated users can view security analysis" ON public.seo_security_analysis;

-- seo_alerts keeps its per-user policy ("Users can view their own alerts",
-- auth.uid() = user_id), so an agent still sees alerts raised for them.

-- The two formerly-public tables were declared PUBLIC_BY_DESIGN in
-- scripts/verify-schema.mjs on the grounds that they hold aggregates only.
-- They are no longer public, so those entries must go — verify:schema emits a
-- stale-entry note otherwise.
