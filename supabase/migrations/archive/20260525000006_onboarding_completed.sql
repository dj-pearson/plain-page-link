-- =============================================================================
-- Onboarding completion tracking (US-048)
-- =============================================================================
-- Records when a user finished the onboarding wizard so new users can be
-- routed into onboarding after their first login.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'Timestamp the user completed the onboarding wizard. NULL = not yet onboarded.';
