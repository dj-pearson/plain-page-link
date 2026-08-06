-- =============================================================================
-- Feature flags (US-042)
-- =============================================================================
-- Supports safe rollouts: global enable/disable, percentage rollout, and
-- targeted user lists. Readable by any authenticated user (so the client can
-- evaluate flags); writable only by admins.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feature_flags IS
  'Feature flags for gradual rollouts and kill switches. Evaluated client-side via useFeatureFlag.';

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read flags to evaluate them.
DROP POLICY IF EXISTS "Authenticated can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can create/update/delete flags.
DROP POLICY IF EXISTS "Admins manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Keep updated_at fresh (reuses the shared trigger function).
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial flags (no-op if they already exist).
INSERT INTO public.feature_flags (name, description, enabled, rollout_percentage)
VALUES
  ('mfa_enabled', 'Multi-factor authentication enrollment', true, 100),
  ('new_dashboard', 'Redesigned dashboard experience', false, 0),
  ('ai_lead_scoring', 'AI-powered lead scoring', true, 100),
  ('stripe_billing', 'Stripe subscription billing', true, 100)
ON CONFLICT (name) DO NOTHING;
