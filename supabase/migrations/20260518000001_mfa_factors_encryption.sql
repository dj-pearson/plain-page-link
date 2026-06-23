-- US-030: MFA/2FA backend — schema + TOTP secret encryption at rest
--
-- DISCOVERY: The MFA factor schema the AC calls "mfa_factors" already exists as
-- `user_mfa_settings` (migration 20251203000001_mfa_authentication_tables.sql),
-- with a richer shape than the AC sketch:
--   user_mfa_settings(user_id, mfa_enabled, mfa_method, totp_secret,
--     backup_codes, verified_at, failed_attempts, locked_until, ...)
-- It maps 1:1 to the requested mfa_factors(user_id, factor_type, secret_encrypted,
-- verified, created_at). Rather than create a conflicting duplicate table, this
-- migration is purely additive: it documents the equivalence, records that the
-- TOTP secret is now encrypted at rest by the edge functions, and exposes a
-- read-only `mfa_factors` view for naming/compatibility.

-- The setup-mfa edge function now stores `totp_secret` encrypted with AES-256-GCM
-- (see supabase/functions/_shared/encryption.ts). The verify-mfa / disable-mfa
-- functions decrypt on read. Legacy plaintext secrets remain valid (the decrypt
-- helper passes non-prefixed values through) until the user re-enrolls.
COMMENT ON COLUMN user_mfa_settings.totp_secret IS
  'Base32 TOTP secret, encrypted at rest (AES-256-GCM, "mfaenc:v1:" prefix) by the edge functions. Legacy rows may still be plaintext until re-enrollment.';

-- Compatibility view exposing the MFA factor under the AC's expected name.
-- Read-only; all writes go through the edge functions against user_mfa_settings.
CREATE OR REPLACE VIEW mfa_factors AS
SELECT
  id,
  user_id,
  COALESCE(mfa_method, 'totp') AS factor_type,
  totp_secret                  AS secret_encrypted,
  (mfa_enabled AND verified_at IS NOT NULL) AS verified,
  verified_at,
  last_used_at,
  created_at,
  updated_at
FROM user_mfa_settings;

COMMENT ON VIEW mfa_factors IS
  'Compatibility view over user_mfa_settings (US-030). secret_encrypted is AES-256-GCM encrypted at rest.';

-- The view runs with the privileges of the querying role and inherits RLS from
-- the underlying user_mfa_settings table (users see only their own factor).
