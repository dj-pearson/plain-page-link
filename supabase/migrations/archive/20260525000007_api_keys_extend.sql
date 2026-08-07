-- =============================================================================
-- API keys — extend schema for programmatic access (US-044)
-- =============================================================================
-- The api_keys table already exists (20260129). Add the columns this story
-- needs: key_prefix (first chars for identification), permissions (jsonb),
-- and revoked_at. All additive / idempotent.
-- =============================================================================

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS key_prefix TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 8 chars of the key for identification (the full key is shown only once).';
COMMENT ON COLUMN public.api_keys.permissions IS 'Scope flags, e.g. {"read":true,"write":false}.';
COMMENT ON COLUMN public.api_keys.revoked_at IS 'When the key was revoked (NULL = active).';

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys (key_prefix);
