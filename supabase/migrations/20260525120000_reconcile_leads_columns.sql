-- =============================================================================
-- Corrective migration: reconcile public.leads column set (schema divergence)
-- =============================================================================
-- ROOT CAUSE
--   The live `leads` table was created by the Lovable-era migration
--   20251030162551_914e9b92-...sql with a MINIMAL column set
--   (id, user_id, lead_type, name, email, phone, message, status, source,
--    form_data, created_at, updated_at).
--   The later authoritative migration 20251031000002_create_leads_table.sql --
--   which defines the richer column set including `contacted_at` -- used
--   CREATE TABLE IF NOT EXISTS, so it ran as a NO-OP against the already-existing
--   table and never added its extra columns. The migration tracker recorded it
--   as applied, but the columns never materialized (hub verify: partial 21/34).
--
--   As a result 20260525000004_lead_response_time.sql failed on:
--       ERROR: column "contacted_at" does not exist
--   That migration is CORRECT; the dependency it relies on was never applied.
--
-- FIX
--   Additively add the columns that 20251031000002 was supposed to create but
--   never did. Every statement is ADD COLUMN IF NOT EXISTS and nullable, so this
--   is fully idempotent and safe against existing rows. Columns already present
--   are skipped. This must be applied BEFORE re-running 20260525000004.
--
--   This does NOT touch 20260525000004 (the failing migration is left intact and
--   should be re-run after this corrective).
-- =============================================================================

ALTER TABLE public.leads
  -- Direct dependency of 20260525000004_lead_response_time.sql:
  ADD COLUMN IF NOT EXISTS contacted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at           TIMESTAMPTZ,
  -- Remaining columns from the authoritative 20251031000002 create migration
  -- that never landed on the live table:
  ADD COLUMN IF NOT EXISTS listing_id          UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_range         TEXT,
  ADD COLUMN IF NOT EXISTS timeline            TEXT,
  ADD COLUMN IF NOT EXISTS property_address    TEXT,
  ADD COLUMN IF NOT EXISTS preapproved         BOOLEAN,
  ADD COLUMN IF NOT EXISTS notes               TEXT,
  ADD COLUMN IF NOT EXISTS referrer_url        TEXT,
  ADD COLUMN IF NOT EXISTS utm_source          TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium          TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign        TEXT,
  ADD COLUMN IF NOT EXISTS device              TEXT;

COMMENT ON COLUMN public.leads.contacted_at IS 'When agent first contacted lead (reconciled from 20251031000002).';
COMMENT ON COLUMN public.leads.closed_at    IS 'When deal closed or lead lost (reconciled from 20251031000002).';
