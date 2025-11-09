-- Admin Operations Hub Database Schema
-- Centralized error logging, system monitoring, and admin audit trail

-- =============================================
-- ERROR LOGS (Centralized)
-- =============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_context JSONB DEFAULT '{}'::jsonb, -- Browser, route, user data, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'error_logs' AND column_name = 'severity') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity) WHERE NOT resolved;
    CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
  END IF;
END $$;

COMMENT ON TABLE error_logs IS 'Centralized error logging for the entire application';

-- =============================================
-- SYSTEM METRICS (Real-time monitoring)
-- =============================================

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'edge_function', 'database', 'webhook', 'api'
  metric_name TEXT NOT NULL, -- Specific function/table/endpoint name
  value NUMERIC NOT NULL,
  unit TEXT, -- 'ms', 'count', 'percentage', 'bytes'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'metric_type') THEN
    CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type_name ON system_metrics(metric_type, metric_name);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
  END IF;
END $$;

-- Partitioning hint: Consider partitioning by recorded_at for large datasets
COMMENT ON TABLE system_metrics IS 'Real-time system health and performance metrics';

-- =============================================
-- ADMIN AUDIT LOG (Track all admin actions)
-- =============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'role_change', 'user_delete', 'seo_audit', 'impersonate', etc.
  target_type TEXT, -- 'user', 'article', 'seo_rule', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb, -- Full context of the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_audit_log' AND column_name = 'admin_id') THEN
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
  END IF;
END $$;

COMMENT ON TABLE admin_audit_log IS 'Complete audit trail of all admin operations';

-- =============================================
-- USER ACTIVITY LOG (Track user actions for support)
-- =============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'login', 'article_view', 'profile_update', etc.
  activity_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_log' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
  END IF;
END $$;

COMMENT ON TABLE user_activity_log IS 'User activity tracking for debugging and support';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for error logs
CREATE POLICY "Admin full access to error_logs" ON error_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for system metrics
CREATE POLICY "Admin full access to system_metrics" ON system_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for admin audit log
CREATE POLICY "Admin full access to admin_audit_log" ON admin_audit_log
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin can see all user activity, users can see their own
CREATE POLICY "Admin or own user activity" ON user_activity_log
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );

CREATE POLICY "Admin insert user activity" ON user_activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_context JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_message,
    stack_trace,
    user_context,
    severity
  ) VALUES (
    p_user_id,
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_user_context,
    p_severity
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    page_url
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_data,
    p_page_url
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_value NUMERIC,
  p_unit TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_type,
    metric_name,
    value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_value,
    p_unit,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE (
  metric_type TEXT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.metric_type,
    AVG(sm.value)::NUMERIC,
    MIN(sm.value)::NUMERIC,
    MAX(sm.value)::NUMERIC,
    COUNT(*)::BIGINT
  FROM system_metrics sm
  WHERE sm.recorded_at > NOW() - INTERVAL '1 hour'
  GROUP BY sm.metric_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users_24h BIGINT,
  active_users_7d BIGINT,
  admin_count BIGINT,
  users_with_subscriptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATA RETENTION POLICIES (Optional - commented out)
-- =============================================

-- Uncomment to enable automatic cleanup of old data

-- DELETE old error logs (keep 90 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM error_logs
--   WHERE created_at < NOW() - INTERVAL '90 days'
--   AND resolved = true;
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old system metrics (keep 30 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_metrics()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM system_metrics
--   WHERE recorded_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old user activity logs (keep 180 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_activity()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM user_activity_log
--   WHERE created_at < NOW() - INTERVAL '180 days';
-- END;
-- $$ LANGUAGE plpgsql;
