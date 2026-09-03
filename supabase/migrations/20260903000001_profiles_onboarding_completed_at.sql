-- =============================================================================
-- profiles.onboarding_completed_at: add it to databases that never got it
-- =============================================================================
-- The column was added by archive/20260525000006_onboarding_completed.sql
-- (US-048) and it is present in the squashed baseline, so a database built from
-- supabase/migrations/*.sql has it and CI has always been green. Production
-- does not have it: `select onboarding_completed_at from profiles` there
-- returns 42703, and `profiles` is one column short of the baseline.
--
-- What that cost, once RequireAuth started gating on it (US-108/US-120):
--
--   * `select('*')` returns a row with no such key, so `profile` in
--     useAuthStore has no `onboarding_completed_at` and
--     `!profile.onboarding_completed_at` is true for EVERY user. Every
--     authenticated agent was redirected to /onboarding/wizard on every visit,
--     which is why /auth/login and /auth/register both landed there.
--   * The wizard could not clear it either. buildOnboardingProfileUpdate always
--     sets onboarding_completed_at, PostgREST rejects an update naming an
--     unknown column, and the whole statement fails, so the agent got "Failed
--     to save your information" and stayed trapped in the wizard.
--
-- Idempotent, so it is a no-op on a database built from the baseline.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'Timestamp the user completed the onboarding wizard. NULL = not yet onboarded.';

-- Backfill. Every profile that exists at this point predates the gate, so its
-- owner is an established user, not a first-run signup: marking them onboarded
-- is what keeps the fix from marching the entire user base through the wizard
-- on their next login. New rows still default to NULL and still see it once.
UPDATE public.profiles
SET onboarding_completed_at = COALESCE(created_at, now())
WHERE onboarding_completed_at IS NULL;
