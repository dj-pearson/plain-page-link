-- Authentication Security Features Migration
-- Implements: Session Management, Brute Force Protection, Distributed Rate Limiting,
-- Audit Logging, GDPR Data Export, and GDPR Account Deletion

-- =============================================
-- 1. USER SESSIONS TABLE
-- Track active sessions for session management UI
-- =============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL, -- SHA-256 hash of session token for validation
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  location_city TEXT,
  location_country TEXT,
  is_current BOOLEAN DEFAULT false, -- Mark current session
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at) WHERE revoked = false;
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, revoked, expires_at)
  WHERE revoked = false;

COMMENT ON TABLE user_sessions IS 'Tracks user sessions for session management UI with view/revoke capability';

-- =============================================
-- 2. LOGIN ATTEMPTS TABLE
-- Brute force protection and login throttling
-- =============================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL, -- Email attempted (not necessarily valid)
  ip_address INET NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- May be null for non-existent accounts
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT, -- 'invalid_email', 'wrong_password', 'account_locked', 'mfa_failed'
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for rate limiting queries
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_email_ip_recent ON login_attempts(email, ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(email, created_at DESC) WHERE success = false;

COMMENT ON TABLE login_attempts IS 'Records all login attempts for brute force protection and security analysis';

-- =============================================
-- 3. RATE LIMIT ENTRIES TABLE
-- Distributed rate limiting (fallback for Redis)
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- Can be IP, user_id, or composite key
  limit_type TEXT NOT NULL, -- 'login', 'api', 'password_reset', 'mfa', etc.
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ, -- If rate limit exceeded, blocked until this time
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, limit_type)
);

-- Indexes for fast lookups
CREATE INDEX idx_rate_limit_identifier ON rate_limit_entries(identifier);
CREATE INDEX idx_rate_limit_type ON rate_limit_entries(limit_type);
CREATE INDEX idx_rate_limit_window ON rate_limit_entries(window_end);
CREATE INDEX idx_rate_limit_blocked ON rate_limit_entries(blocked_until) WHERE blocked_until IS NOT NULL;

-- Auto-cleanup expired entries
CREATE INDEX idx_rate_limit_cleanup ON rate_limit_entries(window_end) WHERE window_end < now();

COMMENT ON TABLE rate_limit_entries IS 'Distributed rate limiting entries with configurable windows';

-- =============================================
-- 4. AUDIT LOGS TABLE
-- General security audit logging
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action (for admin actions)
  action TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'profile_update', 'session_revoke', etc.
  resource_type TEXT, -- 'profile', 'listing', 'lead', 'session', 'subscription', etc.
  resource_id TEXT, -- ID of the affected resource
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
  ip_address INET,
  user_agent TEXT,
  details JSONB, -- Additional context about the action
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for security analysis and querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_risk ON audit_logs(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address);

-- Composite index for user activity queries
CREATE INDEX idx_audit_logs_user_activity ON audit_logs(user_id, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all security-relevant actions';

-- =============================================
-- 5. GDPR DATA REQUESTS TABLE
-- Data export and deletion requests
-- =============================================

CREATE TABLE IF NOT EXISTS gdpr_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'access')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  email_verified BOOLEAN DEFAULT false, -- Verified ownership before processing
  verification_token_hash TEXT, -- For email verification
  verification_expires_at TIMESTAMPTZ,
  file_url TEXT, -- Signed URL for data export file
  file_expires_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ, -- 30-day grace period for deletion
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_gdpr_requests_user_id ON gdpr_data_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_data_requests(status);
CREATE INDEX idx_gdpr_requests_type ON gdpr_data_requests(request_type);
CREATE INDEX idx_gdpr_requests_scheduled_deletion ON gdpr_data_requests(scheduled_deletion_at)
  WHERE request_type = 'deletion' AND status = 'pending';

-- Updated_at trigger
CREATE TRIGGER update_gdpr_data_requests_updated_at
  BEFORE UPDATE ON gdpr_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gdpr_data_requests IS 'GDPR data export and deletion requests with audit trail';

-- =============================================
-- 6. ACCOUNT DELETION SCHEDULED TABLE
-- Soft deletion with recovery period
-- =============================================

CREATE TABLE IF NOT EXISTS account_deletion_scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gdpr_request_id UUID REFERENCES gdpr_data_requests(id),
  reason TEXT, -- Optional reason for deletion
  scheduled_for TIMESTAMPTZ NOT NULL, -- Actual deletion date (30 days from request)
  cancelled BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ,
  anonymization_completed BOOLEAN DEFAULT false,
  data_backup_url TEXT, -- Final backup before deletion
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_account_deletion_scheduled_for ON account_deletion_scheduled(scheduled_for)
  WHERE cancelled = false AND executed = false;
CREATE INDEX idx_account_deletion_user ON account_deletion_scheduled(user_id);

COMMENT ON TABLE account_deletion_scheduled IS 'Scheduled account deletions with 30-day recovery period';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_scheduled ENABLE ROW LEVEL SECURITY;

-- User Sessions Policies
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON user_sessions FOR ALL
  USING (true);

-- Login Attempts - service role only for writing, users can view own
CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage login attempts"
  ON login_attempts FOR ALL
  USING (true);

-- Rate Limit - service role only
CREATE POLICY "Service role manages rate limits"
  ON rate_limit_entries FOR ALL
  USING (true);

-- Audit Logs - users can view own logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (true);

-- GDPR Requests - users can view and create own requests
CREATE POLICY "Users can view own GDPR requests"
  ON gdpr_data_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own GDPR requests"
  ON gdpr_data_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own pending GDPR requests"
  ON gdpr_data_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Service role can manage GDPR requests"
  ON gdpr_data_requests FOR ALL
  USING (true);

-- Account Deletion Schedule - users can view and cancel own
CREATE POLICY "Users can view own deletion schedule"
  ON account_deletion_scheduled FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own deletion"
  ON account_deletion_scheduled FOR UPDATE
  USING (auth.uid() = user_id AND cancelled = false AND executed = false);

CREATE POLICY "Service role can manage deletion schedule"
  ON account_deletion_scheduled FOR ALL
  USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check login throttling
CREATE OR REPLACE FUNCTION check_login_throttle(
  p_email TEXT,
  p_ip_address INET,
  p_window_minutes INTEGER DEFAULT 15,
  p_max_attempts INTEGER DEFAULT 5
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  attempts_remaining INTEGER,
  blocked_until TIMESTAMPTZ,
  reason TEXT
) AS $$
DECLARE
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count failed attempts by email
  SELECT COUNT(*) INTO v_email_attempts
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > v_window_start;

  -- Count failed attempts by IP
  SELECT COUNT(*) INTO v_ip_attempts
  FROM login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > v_window_start;

  -- Check if blocked by email attempts (stricter limit)
  IF v_email_attempts >= p_max_attempts THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes * 2 || ' minutes')::INTERVAL,
      'Too many failed attempts for this email';
    RETURN;
  END IF;

  -- Check if blocked by IP attempts (higher limit)
  IF v_ip_attempts >= p_max_attempts * 3 THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'Too many failed attempts from this IP address';
    RETURN;
  END IF;

  -- Not blocked
  RETURN QUERY SELECT
    false,
    LEAST(p_max_attempts - v_email_attempts, (p_max_attempts * 3) - v_ip_attempts),
    NULL::TIMESTAMPTZ,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_ip_address INET,
  p_user_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_failure_reason TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (
    email, ip_address, user_id, success, failure_reason,
    user_agent, device_fingerprint
  )
  VALUES (
    p_email, p_ip_address, p_user_id, p_success, p_failure_reason,
    p_user_agent, p_device_fingerprint
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_limit_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_end := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to get existing entry
  SELECT * INTO v_entry
  FROM rate_limit_entries
  WHERE identifier = p_identifier
    AND limit_type = p_limit_type
    AND window_end > now()
  FOR UPDATE;

  IF v_entry.id IS NULL THEN
    -- Create new entry
    INSERT INTO rate_limit_entries (identifier, limit_type, request_count, window_end)
    VALUES (p_identifier, p_limit_type, 1, v_window_end)
    ON CONFLICT (identifier, limit_type) DO UPDATE
    SET
      request_count = CASE
        WHEN rate_limit_entries.window_end < now() THEN 1
        ELSE rate_limit_entries.request_count + 1
      END,
      window_end = CASE
        WHEN rate_limit_entries.window_end < now() THEN v_window_end
        ELSE rate_limit_entries.window_end
      END,
      updated_at = now()
    RETURNING * INTO v_entry;
  ELSE
    -- Update existing entry
    UPDATE rate_limit_entries
    SET request_count = request_count + 1, updated_at = now()
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;
  END IF;

  -- Return result
  IF v_entry.request_count > p_max_requests THEN
    RETURN QUERY SELECT false, 0, v_entry.window_end;
  ELSE
    RETURN QUERY SELECT true, p_max_requests - v_entry.request_count, v_entry.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_status TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, actor_id, action, resource_type, resource_id,
    status, ip_address, user_agent, details, risk_level
  )
  VALUES (
    p_user_id, COALESCE(p_actor_id, p_user_id), p_action, p_resource_type, p_resource_id,
    p_status, p_ip_address, p_user_agent, p_details, p_risk_level
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active sessions
CREATE OR REPLACE FUNCTION get_user_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location_city TEXT,
  location_country TEXT,
  is_current BOOLEAN,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.ip_address, s.user_agent, s.device_type,
    s.browser, s.os, s.location_city, s.location_country,
    s.is_current, s.last_activity_at, s.created_at
  FROM user_sessions s
  WHERE s.user_id = p_user_id
    AND s.revoked = false
    AND s.expires_at > now()
  ORDER BY s.is_current DESC, s.last_activity_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a session
CREATE OR REPLACE FUNCTION revoke_user_session(
  p_session_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'user_revoked'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = p_reason
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND revoked = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the session revocation
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'session_revoke',
      'success',
      'session',
      p_session_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('reason', p_reason),
      'medium'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all user sessions except current
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(
  p_user_id UUID,
  p_current_session_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = 'revoke_all_by_user'
  WHERE user_id = p_user_id
    AND revoked = false
    AND (p_current_session_id IS NULL OR id != p_current_session_id);

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the action
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'revoke_all_sessions',
      'success',
      'session',
      NULL,
      NULL,
      NULL,
      jsonb_build_object('sessions_revoked', v_affected, 'preserved_session', p_current_session_id),
      'high'
    );
  END IF;

  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create GDPR data export request
CREATE OR REPLACE FUNCTION request_gdpr_data_export(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_pending_count INTEGER;
BEGIN
  -- Check for existing pending request
  SELECT COUNT(*) INTO v_pending_count
  FROM gdpr_data_requests
  WHERE user_id = p_user_id
    AND request_type = 'export'
    AND status IN ('pending', 'processing')
    AND created_at > now() - interval '24 hours';

  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'A data export request is already pending. Please wait for it to complete.';
  END IF;

  -- Create the request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'export', 'pending', p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log the audit event
  PERFORM log_audit_event(
    p_user_id,
    'gdpr_export_request',
    'success',
    'gdpr_request',
    v_request_id::TEXT,
    p_ip_address,
    p_user_agent,
    NULL,
    'medium'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request account deletion
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_grace_period_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_deletion UUID;
BEGIN
  v_scheduled_for := now() + (p_grace_period_days || ' days')::INTERVAL;

  -- Check for existing deletion request
  SELECT id INTO v_existing_deletion
  FROM account_deletion_scheduled
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  IF v_existing_deletion IS NOT NULL THEN
    RAISE EXCEPTION 'An account deletion is already scheduled. Cancel it first to create a new request.';
  END IF;

  -- Create GDPR request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, scheduled_deletion_at, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'deletion', 'pending', v_scheduled_for, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Create deletion schedule
  INSERT INTO account_deletion_scheduled (
    user_id, gdpr_request_id, reason, scheduled_for, ip_address
  )
  VALUES (
    p_user_id, v_request_id, p_reason, v_scheduled_for, p_ip_address
  );

  -- Log the audit event
  PERFORM log_audit_event(
    p_user_id,
    'account_deletion_request',
    'success',
    'account',
    p_user_id::TEXT,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'reason', p_reason,
      'scheduled_for', v_scheduled_for,
      'grace_period_days', p_grace_period_days
    ),
    'critical'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION cancel_account_deletion(
  p_user_id UUID,
  p_cancel_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Cancel the scheduled deletion
  UPDATE account_deletion_scheduled
  SET
    cancelled = true,
    cancelled_at = now(),
    cancelled_reason = p_cancel_reason
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Update the GDPR request
  UPDATE gdpr_data_requests
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE user_id = p_user_id
    AND request_type = 'deletion'
    AND status = 'pending';

  -- Log the audit event
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'account_deletion_cancelled',
      'success',
      'account',
      p_user_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('cancel_reason', p_cancel_reason),
      'high'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION cleanup_security_tables()
RETURNS TABLE (
  sessions_cleaned INTEGER,
  rate_limits_cleaned INTEGER,
  login_attempts_cleaned INTEGER
) AS $$
DECLARE
  v_sessions INTEGER;
  v_rate_limits INTEGER;
  v_login_attempts INTEGER;
BEGIN
  -- Clean expired sessions
  DELETE FROM user_sessions
  WHERE (expires_at < now() AND revoked = false)
    OR (revoked = true AND revoked_at < now() - interval '30 days');
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  -- Clean expired rate limit entries
  DELETE FROM rate_limit_entries
  WHERE window_end < now() - interval '1 hour';
  GET DIAGNOSTICS v_rate_limits = ROW_COUNT;

  -- Clean old login attempts (keep 90 days)
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_login_attempts = ROW_COUNT;

  RETURN QUERY SELECT v_sessions, v_rate_limits, v_login_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_login_throttle IS 'Check if login should be throttled for brute force protection';
COMMENT ON FUNCTION record_login_attempt IS 'Record a login attempt for security tracking';
COMMENT ON FUNCTION check_rate_limit IS 'Check and update rate limit for distributed rate limiting';
COMMENT ON FUNCTION log_audit_event IS 'Log a security-relevant action to the audit log';
COMMENT ON FUNCTION get_user_sessions IS 'Get all active sessions for a user';
COMMENT ON FUNCTION revoke_user_session IS 'Revoke a specific session';
COMMENT ON FUNCTION revoke_all_other_sessions IS 'Revoke all sessions except the current one';
COMMENT ON FUNCTION request_gdpr_data_export IS 'Create a GDPR data export request';
COMMENT ON FUNCTION request_account_deletion IS 'Schedule account deletion with grace period';
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancel a scheduled account deletion';
COMMENT ON FUNCTION cleanup_security_tables IS 'Cleanup expired security-related entries';
