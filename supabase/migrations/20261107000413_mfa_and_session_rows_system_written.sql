-- US-413 (US-367): user_mfa_settings and user_sessions are written by edge
-- functions only, and the browser can no longer read the MFA secrets.
--
-- The baseline left owner write policies with no TO clause, on tables where
-- Supabase grants INSERT/UPDATE/DELETE to anon and authenticated:
--
--   user_mfa_settings  "Users can insert own MFA settings"
--                        FOR INSERT WITH CHECK (auth.uid() = user_id)
--   user_mfa_settings  "Users can update own MFA settings"
--                        FOR UPDATE USING (auth.uid() = user_id)
--   user_sessions      "Users can revoke own sessions"
--                        FOR UPDATE USING/WITH CHECK (auth.uid() = user_id)
--
-- An aal1 JWT is all signInWithPassword hands out, so someone holding only an
-- agent's password could, straight against PostgREST with the anon key:
--   * set user_mfa_settings.mfa_enabled = false. For an agent still on the
--     legacy (pre-US-085) factor that row IS the second factor: useAuthStore,
--     useNativeMFA and lib/security/authentication read mfa_enabled and
--     verified_at to decide whether to challenge. Turning it off skips MFA.
--   * write backup_codes with hashes of codes they chose and redeem one at
--     verify-mfa, or reset failed_attempts / locked_until between guesses to
--     brute-force the TOTP code past verify-mfa's lockout;
--   * un-revoke a session (revoked = false, revoked_at = NULL) or rewrite its
--     ip_address / location / user_agent, so the session list an agent checks
--     after a scare shows what the attacker wants it to show.
--
-- Nothing in the browser writes either table. setup-mfa, verify-mfa,
-- disable-mfa and regenerate-backup-codes write user_mfa_settings with the
-- service role; login-security records sessions and revoke-session revokes
-- them through revoke_user_session / revoke_all_other_sessions, both with the
-- service role. Account erasure removes the rows through the auth.users
-- ON DELETE CASCADE, which runs as the table owner.
--
-- Reads: the owner SELECT policies stay, but the grant becomes column-level.
-- The browser reads user_mfa_settings for (mfa_enabled, verified_at) only, and
-- user_sessions not at all (get-sessions calls get_user_sessions). So:
--   * totp_secret (encrypted, but an XSS that exfiltrates it has the ciphertext
--     for good), backup_codes (hashes of 10 short codes — offline-guessable),
--     phone_number, failed_attempts and locked_until are no longer selectable
--     by the browser;
--   * user_sessions.session_token_hash is no longer selectable.
-- anon gets nothing: no policy on either table can be satisfied without
-- auth.uid(), so anon never saw a row; the grant was Supabase's default.
-- gdpr-export reads both tables with the service role and is unaffected.

-- ---------------------------------------------------------------------------
-- user_mfa_settings
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update own MFA settings" ON public.user_mfa_settings;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_mfa_settings FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON public.user_mfa_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, user_id, mfa_enabled, mfa_method, verified_at, last_used_at,
  backup_codes_generated_at, email_verified_for_mfa, created_at, updated_at
) ON public.user_mfa_settings TO authenticated;

COMMENT ON TABLE public.user_mfa_settings IS
  'Legacy (pre-US-085) MFA enrolment. Written only by the setup-mfa, verify-mfa, disable-mfa and regenerate-backup-codes edge functions (service role). The owner may SELECT only the non-secret columns (US-413); totp_secret, backup_codes, phone_number, failed_attempts and locked_until are server-only.';

-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can revoke own sessions" ON public.user_sessions;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_sessions FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON public.user_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, user_id, ip_address, user_agent, device_type, browser, os,
  location_city, location_country, is_current, last_activity_at, expires_at,
  revoked, revoked_at, revoked_reason, created_at
) ON public.user_sessions TO authenticated;

COMMENT ON TABLE public.user_sessions IS
  'Sessions recorded by login-security and revoked by revoke-session (both service role). The browser lists them through get_user_sessions and cannot write rows (US-413); session_token_hash is not selectable by the browser.';
