-- =============================================================================
-- Database performance indexes (US-041)
-- =============================================================================
-- Adds composite + partial indexes for the hottest query patterns in the
-- dashboard, public profiles, and listing pages. Single-column indexes on
-- user_id / status / created_at already exist from earlier migrations; these
-- composites serve the common "filter by owner + status, newest first" and
-- "owner's active items in order" access patterns that single-column indexes
-- cover less efficiently. All use IF NOT EXISTS so re-runs are safe and no
-- existing functionality is affected (indexes are additive).
-- =============================================================================

-- Listings: dashboard list ("my listings, newest first", optionally by status)
-- and public profile ("this agent's active listings").
-- EXPLAIN ANALYZE (expected): Index Scan using idx_listings_user_status_created
--   SELECT id,title,price,status FROM listings
--   WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC;
CREATE INDEX IF NOT EXISTS idx_listings_user_status_created
  ON public.listings (user_id, status, created_at DESC);

-- Partial: public profile renders active listings only — smaller, hotter index.
-- EXPLAIN ANALYZE (expected): Index Scan using idx_listings_active_by_user
--   SELECT ... FROM listings WHERE user_id = $1 AND status = 'active'
--   ORDER BY created_at DESC;
CREATE INDEX IF NOT EXISTS idx_listings_active_by_user
  ON public.listings (user_id, created_at DESC)
  WHERE status = 'active';

-- Leads: dashboard leads table ("my leads, newest first", filter by status).
-- EXPLAIN ANALYZE (expected): Index Scan using idx_leads_user_status_created
--   SELECT ... FROM leads WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC;
CREATE INDEX IF NOT EXISTS idx_leads_user_status_created
  ON public.leads (user_id, status, created_at DESC);

-- Partial: the "new leads" inbox view is the most frequent lead query.
-- EXPLAIN ANALYZE (expected): Index Scan using idx_leads_new_by_user
--   SELECT ... FROM leads WHERE user_id = $1 AND status = 'new' ORDER BY created_at DESC;
CREATE INDEX IF NOT EXISTS idx_leads_new_by_user
  ON public.leads (user_id, created_at DESC)
  WHERE status = 'new';

-- Links: public profile + dashboard render the agent's active links in order.
-- EXPLAIN ANALYZE (expected): Index Scan using idx_links_user_active_position
--   SELECT ... FROM links WHERE user_id = $1 AND is_active = true ORDER BY position;
CREATE INDEX IF NOT EXISTS idx_links_user_active_position
  ON public.links (user_id, is_active, position);

-- Analytics: dashboard analytics aggregates a user's views over a time range.
-- EXPLAIN ANALYZE (expected): Index Scan using idx_analytics_views_user_viewed
--   SELECT ... FROM analytics_views WHERE user_id = $1 AND viewed_at >= $2;
CREATE INDEX IF NOT EXISTS idx_analytics_views_user_viewed
  ON public.analytics_views (user_id, viewed_at DESC);
