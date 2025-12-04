-- Multi-Factor Authentication (MFA/2FA) Tables
-- Supports TOTP, Email, and SMS-based authentication

-- =============================================
-- USER MFA SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT CHECK (mfa_method IN ('totp', 'email', 'sms')),
  totp_secret TEXT, -- Base32 encoded secret (encrypted via application layer)
  backup_codes TEXT[], -- Array of hashed backup codes
  backup_codes_generated_at TIMESTAMPTZ,
  phone_number TEXT, -- For SMS-based MFA
  email_verified_for_mfa BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX idx_user_mfa_settings_enabled ON user_mfa_settings(mfa_enabled) WHERE mfa_enabled = true;

-- Updated_at trigger
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_mfa_settings IS 'Stores MFA configuration and secrets for users';

-- =============================================
-- MFA VERIFICATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('totp', 'email', 'sms', 'backup_code')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'expired', 'blocked')),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for security analysis
CREATE INDEX idx_mfa_verification_logs_user_id ON mfa_verification_logs(user_id);
CREATE INDEX idx_mfa_verification_logs_status ON mfa_verification_logs(status);
CREATE INDEX idx_mfa_verification_logs_created_at ON mfa_verification_logs(created_at DESC);
CREATE INDEX idx_mfa_verification_logs_ip ON mfa_verification_logs(ip_address);

COMMENT ON TABLE mfa_verification_logs IS 'Audit trail of all MFA verification attempts';

-- =============================================
-- TRUSTED DEVICES
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  trusted_until TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes
CREATE INDEX idx_mfa_trusted_devices_user_id ON mfa_trusted_devices(user_id);
CREATE INDEX idx_mfa_trusted_devices_fingerprint ON mfa_trusted_devices(device_fingerprint);
CREATE INDEX idx_mfa_trusted_devices_trusted_until ON mfa_trusted_devices(trusted_until) WHERE revoked = false;

COMMENT ON TABLE mfa_trusted_devices IS 'Devices marked as trusted to skip MFA for a period';

-- =============================================
-- TEMPORARY MFA CODES (for email/SMS)
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_temp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- Hashed verification code
  code_type TEXT NOT NULL CHECK (code_type IN ('email', 'sms', 'setup_verification')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mfa_temp_codes_user_id ON mfa_temp_codes(user_id);
CREATE INDEX idx_mfa_temp_codes_expires_at ON mfa_temp_codes(expires_at);
CREATE INDEX idx_mfa_temp_codes_used ON mfa_temp_codes(used);

COMMENT ON TABLE mfa_temp_codes IS 'Temporary verification codes for email/SMS MFA';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_temp_codes ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own MFA settings
CREATE POLICY "Users can view own MFA settings"
  ON user_mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings"
  ON user_mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA settings"
  ON user_mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verification logs - users can only view their own
CREATE POLICY "Users can view own MFA verification logs"
  ON mfa_verification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert verification logs
CREATE POLICY "Service role can insert verification logs"
  ON mfa_verification_logs FOR INSERT
  WITH CHECK (true);

-- Trusted devices - users can manage their own
CREATE POLICY "Users can view own trusted devices"
  ON mfa_trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
  ON mfa_trusted_devices FOR ALL
  USING (auth.uid() = user_id);

-- Temp codes - service role only for security
CREATE POLICY "Service role manages temp codes"
  ON mfa_temp_codes FOR ALL
  USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has MFA enabled
CREATE OR REPLACE FUNCTION check_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND mfa_enabled = true
    AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(p_user_id UUID, p_device_fingerprint TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mfa_trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND revoked = false
    AND trusted_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed MFA attempts
CREATE OR REPLACE FUNCTION increment_mfa_failed_attempts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = failed_attempts + 1,
    locked_until = CASE
      WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
      ELSE locked_until
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING failed_attempts INTO v_attempts;

  RETURN COALESCE(v_attempts, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed attempts on successful verification
CREATE OR REPLACE FUNCTION reset_mfa_failed_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = 0,
    locked_until = NULL,
    last_used_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if MFA is locked
CREATE OR REPLACE FUNCTION is_mfa_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND locked_until IS NOT NULL
    AND locked_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired temp codes
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_temp_codes
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 day');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_mfa_enabled IS 'Check if a user has MFA enabled and verified';
COMMENT ON FUNCTION is_device_trusted IS 'Check if a device is trusted for a user';
COMMENT ON FUNCTION increment_mfa_failed_attempts IS 'Increment failed MFA attempts and lock if necessary';
COMMENT ON FUNCTION reset_mfa_failed_attempts IS 'Reset failed attempts after successful verification';
COMMENT ON FUNCTION is_mfa_locked IS 'Check if MFA is temporarily locked due to failed attempts';
COMMENT ON FUNCTION cleanup_expired_mfa_codes IS 'Cleanup expired temporary MFA codes';
