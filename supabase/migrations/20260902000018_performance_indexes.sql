-- US-122: the indexes production runs on were unknowable from the repository.
--
-- database/performance-indexes.sql said "Run these in Supabase SQL Editor" and
-- was referenced by nothing. Whether any of them exist in production depended
-- on whether somebody had pasted the file into a console, and 18 of its 23
-- appeared in no migration — so the schema this repository describes and the
-- schema queries actually run against could differ in every index.
--
-- They are migrations now. IF NOT EXISTS throughout, so this is a no-op against
-- a database where they were pasted in by hand.
--
-- Three of the file's statements are NOT carried over, because they cannot run:
--
--   * idx_articles_user_published indexed articles(user_id). There is no
--     user_id column on articles — it is author_id. Recreated correctly below.
--   * idx_analytics_views_recent and idx_leads_recent had the predicate
--     `WHERE viewed_at >= NOW() - INTERVAL '90 days'`. A partial index
--     predicate must be immutable and NOW() is not, so Postgres rejects them
--     with "functions in index predicate must be marked IMMUTABLE". They are
--     dropped rather than fixed: the unpartitioned (user_id, <date> DESC)
--     indexes below already serve the same queries, and a rolling window in a
--     predicate would need periodic rebuilding to stay useful anyway.

-- ---------------------------------------------------------------------------
-- profiles — public profile lookup by username
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles (username);

CREATE INDEX IF NOT EXISTS idx_profiles_username_published
  ON public.profiles (username, is_published)
  WHERE is_published = true;

-- ---------------------------------------------------------------------------
-- listings — the public gallery and the dashboard list
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_user_status
  ON public.listings (user_id, status, sort_order)
  WHERE status IN ('active', 'pending', 'under_contract', 'sold');

CREATE INDEX IF NOT EXISTS idx_listings_active
  ON public.listings (user_id, sort_order)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_sold
  ON public.listings (user_id, sort_order)
  WHERE status = 'sold';

-- ---------------------------------------------------------------------------
-- testimonials, links, user_settings — the rest of a public profile fetch
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_testimonials_user_published
  ON public.testimonials (user_id, is_published, sort_order)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_links_user_active
  ON public.links (user_id, is_active, position)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_settings_user
  ON public.user_settings (user_id);

CREATE INDEX IF NOT EXISTS idx_custom_pages_user_active
  ON public.custom_pages (user_id, is_active, published)
  WHERE is_active = true AND published = true;

-- ---------------------------------------------------------------------------
-- analytics_views — the dashboard's charts, and the per-visitor throttle
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_analytics_views_user_date
  ON public.analytics_views (user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_views_visitor
  ON public.analytics_views (user_id, visitor_id, viewed_at DESC);

-- ---------------------------------------------------------------------------
-- leads — the list, and the by-type breakdown
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_user_date
  ON public.leads (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_user_type_date
  ON public.leads (user_id, lead_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- articles — the blog index, and an author's own posts
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_articles_published
  ON public.articles (created_at DESC)
  WHERE status = 'published';

-- author_id, not user_id. `articles` has never had a user_id column.
CREATE INDEX IF NOT EXISTS idx_articles_author_published
  ON public.articles (author_id, created_at DESC)
  WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- unified_search_analytics — the admin search dashboard
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_unified_search_user_date
  ON public.unified_search_analytics (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_unified_search_platform
  ON public.unified_search_analytics (user_id, source_platform, date DESC);
