-- ============================================================================
-- Enable RLS on public.team_round_robin
-- ============================================================================
-- team_round_robin is the only table in the public schema with row level
-- security switched off. 20260525000010_lead_routing.sql enables RLS on
-- lead_routing_rules but never does so for team_round_robin, which it creates in
-- the same file — an oversight rather than a decision.
--
-- Hosted Supabase grants ALL on public tables to anon and authenticated by
-- default, and the anon key is shipped in the frontend bundle, so with RLS off
-- any visitor can read and write this table. It holds no personal data, but
-- last_index decides which team member the next lead is assigned to, so an
-- unauthenticated caller can skew or monopolise lead routing for any team, or
-- delete rows to reset it.
--
-- No policies are added on purpose. The only legitimate writer is
-- public.auto_assign_lead(), which is SECURITY DEFINER and therefore runs as the
-- function owner and is unaffected by RLS; the service role likewise bypasses
-- it. No client code queries this table — it is internal routing bookkeeping.
-- This "RLS on, zero policies" shape is how the codebase already treats
-- rate_limits and account_deletion_log.

ALTER TABLE public.team_round_robin ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.team_round_robin IS
  'Internal round-robin cursor per team, maintained only by auto_assign_lead() '
  '(SECURITY DEFINER). RLS is enabled with no policies so no API caller can '
  'read or write it directly.';
