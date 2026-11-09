-- US-531 (US-276 slice 1): a lead remembers which browser sent it.
--
-- The public page has recorded a listing_view in analytics_events, keyed by
-- the visitor's client-generated id (getVisitorId in src/lib/analyticsEvents.ts),
-- since US-263. The lead that visitor then submits carried no such id, so the
-- two could never be joined: an agent could not see that a buyer opened five
-- homes before asking about the sixth, and lead-scoring's listingViews /
-- hasViewedMultipleListings (src/lib/lead-scoring.ts) were never measured.
--
-- Every day the column is missing is a day of leads that can never be joined
-- back to their browsing, so it lands first, on its own:
--   1. leads.visitor_id (uuid, nullable). Written only by submit-lead (service
--      role; the browser roles hold no INSERT on leads since 20260902000001),
--      which drops anything that is not a uuid and never stores one for an
--      open house kiosk sign-in (one shared tablet, many visitors).
--   2. An index for the join the lead detail will make: this agent's
--      listing_view events for this visitor.
--   3. The browser's column grant on leads, restated with visitor_id so the
--      owner can read it (LEAD_COLUMNS in src/lib/leadColumns.ts; RLS still
--      limits rows to the agent's own leads).
--
-- The id is indicative, not an identity: it lives in the visitor's
-- localStorage and is trivially rotated. The lead detail must say so, as the
-- Analytics page does.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS visitor_id uuid;

COMMENT ON COLUMN public.leads.visitor_id IS
  'US-531: the client-generated visitor id (analytics_events.visitor_id) of the browser that submitted the lead. Indicative only; NULL for kiosk sign-ins, older leads and visitors without storage.';

CREATE INDEX IF NOT EXISTS idx_leads_user_visitor
  ON public.leads (user_id, visitor_id)
  WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_visitor_listing_view
  ON public.analytics_events (user_id, visitor_id, occurred_at DESC)
  WHERE event_type = 'listing_view' AND visitor_id IS NOT NULL;

-- The browser's readable columns: 20261108000452's list, plus visitor_id.
REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (
  id, user_id, lead_type, name, message, status, source, form_data,
  created_at, updated_at, first_responded_at, assigned_to, contacted_at,
  closed_at, listing_id, price_range, timeline, property_address, preapproved,
  referrer_url, utm_source, utm_medium, utm_campaign, device, is_sample,
  open_house_id, email_hash, update_token_hash, update_token_expires_at,
  visitor_id
) ON public.leads TO authenticated;
