-- ============================================
-- SEO MANAGEMENT SYSTEM - AUTOMATED MONITORING
-- ============================================
-- Migration 3 of 6: SEO Automated Monitoring
-- Tables: seo_notification_preferences, seo_alert_rules, seo_alerts, seo_monitoring_schedules, seo_monitoring_log

-- ============================================
-- SEO NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Manages user notification preferences for SEO alerts

CREATE TABLE public.seo_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),

  -- Slack notifications
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  slack_channel TEXT,

  -- In-app notifications
  in_app_enabled BOOLEAN DEFAULT true,

  -- SMS notifications (optional)
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone_number TEXT,

  -- Notification types preferences
  critical_alerts BOOLEAN DEFAULT true,
  ranking_changes BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  broken_links BOOLEAN DEFAULT true,
  content_issues BOOLEAN DEFAULT false,
  technical_issues BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  -- Aggregation settings
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),
  digest_time TIME DEFAULT '09:00:00',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

-- ============================================
-- SEO ALERT RULES TABLE
-- ============================================
-- Defines rules for triggering SEO alerts

CREATE TABLE public.seo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'ranking_drop', 'ranking_increase', 'traffic_drop', 'traffic_increase',
    'page_speed_degradation', 'core_web_vitals_fail', 'broken_links',
    'security_issue', 'mobile_usability', 'crawl_error', 'duplicate_content',
    'missing_meta_tags', 'redirect_chain', 'content_freshness', 'custom'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
  Example conditions structure:
  {
    "metric": "ranking_position",
    "operator": "greater_than",
    "threshold": 10,
    "comparison_period": "7_days",
    "min_change": 3
  }
  */

  -- Scope
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_urls', 'specific_keywords', 'specific_pages')),
  target_urls TEXT[] DEFAULT '{}',
  target_keywords TEXT[] DEFAULT '{}',

  -- Actions
  actions JSONB DEFAULT '[]',
  /*
  Example actions:
  [
    {"type": "email", "recipients": ["admin@example.com"]},
    {"type": "slack", "channel": "#seo-alerts"},
    {"type": "webhook", "url": "https://example.com/webhook"}
  ]
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,

  -- Cooldown to prevent alert spam
  cooldown_minutes INTEGER DEFAULT 60,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO ALERTS TABLE
-- ============================================
-- Stores triggered SEO alerts

CREATE TABLE public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES seo_alert_rules(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Affected resources
  affected_url TEXT,
  affected_keyword TEXT,
  affected_page TEXT,

  -- Metrics
  metric_name TEXT,
  previous_value TEXT,
  current_value TEXT,
  change_percentage NUMERIC(10,2),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Notifications sent
  notifications_sent JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "email", "sent_at": "2025-11-05T10:30:00Z", "status": "delivered"},
    {"type": "slack", "sent_at": "2025-11-05T10:30:01Z", "status": "delivered"}
  ]
  */

  -- Auto-resolution
  auto_resolved BOOLEAN DEFAULT false,
  auto_resolution_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO MONITORING SCHEDULES TABLE
-- ============================================
-- Manages automated SEO monitoring schedules

CREATE TABLE public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Schedule type
  schedule_type TEXT NOT NULL CHECK (schedule_type IN (
    'full_audit', 'quick_scan', 'keyword_check', 'broken_links',
    'core_web_vitals', 'security_scan', 'competitor_check', 'custom'
  )),

  -- Target
  target_url TEXT NOT NULL,
  additional_urls TEXT[] DEFAULT '{}',

  -- Frequency
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- For custom schedules
  time_of_day TIME,
  day_of_week INTEGER, -- 0-6 (Sunday = 0)
  day_of_month INTEGER, -- 1-31
  timezone TEXT DEFAULT 'UTC',

  -- Next run
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  last_run_duration_ms INTEGER,

  -- Configuration
  config JSONB DEFAULT '{}',
  /*
  Example config:
  {
    "max_pages_to_crawl": 100,
    "check_images": true,
    "check_links": true,
    "alert_on_issues": true
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO MONITORING LOG TABLE
-- ============================================
-- Logs all automated monitoring activities

CREATE TABLE public.seo_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_monitoring_schedules(id) ON DELETE CASCADE,

  -- Execution details
  execution_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed', 'cancelled')),

  -- Results
  results_summary JSONB DEFAULT '{}',
  /*
  Example:
  {
    "pages_checked": 50,
    "issues_found": 12,
    "critical_issues": 2,
    "warnings": 10,
    "score": 85
  }
  */

  -- Performance
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- References
  audit_id UUID REFERENCES seo_audit_history(id),
  alerts_generated INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Notification Preferences indexes
CREATE INDEX idx_seo_notif_pref_user_id ON public.seo_notification_preferences(user_id);

-- Alert Rules indexes
CREATE INDEX idx_seo_alert_rules_type ON public.seo_alert_rules(rule_type);
CREATE INDEX idx_seo_alert_rules_active ON public.seo_alert_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_alert_rules_severity ON public.seo_alert_rules(severity);

-- Alerts indexes
CREATE INDEX idx_seo_alerts_rule_id ON public.seo_alerts(alert_rule_id);
CREATE INDEX idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX idx_seo_alerts_created_at ON public.seo_alerts(created_at DESC);
CREATE INDEX idx_seo_alerts_url ON public.seo_alerts(affected_url);
CREATE INDEX idx_seo_alerts_keyword ON public.seo_alerts(affected_keyword);
CREATE INDEX idx_seo_alerts_open ON public.seo_alerts(status) WHERE status = 'open';

-- Monitoring Schedules indexes
CREATE INDEX idx_seo_schedules_active ON public.seo_monitoring_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);
CREATE INDEX idx_seo_schedules_type ON public.seo_monitoring_schedules(schedule_type);
CREATE INDEX idx_seo_schedules_url ON public.seo_monitoring_schedules(target_url);

-- Monitoring Log indexes
CREATE INDEX idx_seo_monitoring_log_schedule_id ON public.seo_monitoring_log(schedule_id);
CREATE INDEX idx_seo_monitoring_log_status ON public.seo_monitoring_log(status);
CREATE INDEX idx_seo_monitoring_log_started_at ON public.seo_monitoring_log(started_at DESC);
CREATE INDEX idx_seo_monitoring_log_audit_id ON public.seo_monitoring_log(audit_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

-- Notification Preferences policies
CREATE POLICY "Users can manage their own notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Alert Rules policies
CREATE POLICY "Admins can manage alert rules"
ON public.seo_alert_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view alert rules"
ON public.seo_alert_rules FOR SELECT
USING (true);

-- Alerts policies
CREATE POLICY "Admins can manage all alerts"
ON public.seo_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view alerts"
ON public.seo_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Schedules policies
CREATE POLICY "Admins can manage monitoring schedules"
ON public.seo_monitoring_schedules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view monitoring schedules"
ON public.seo_monitoring_schedules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Log policies
CREATE POLICY "Admins can manage monitoring logs"
ON public.seo_monitoring_log FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view monitoring logs"
ON public.seo_monitoring_log FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_seo_notif_pref_updated_at
BEFORE UPDATE ON public.seo_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_alert_rules_updated_at
BEFORE UPDATE ON public.seo_alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_alerts_updated_at
BEFORE UPDATE ON public.seo_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_schedules_updated_at
BEFORE UPDATE ON public.seo_monitoring_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get open alerts count
CREATE OR REPLACE FUNCTION public.get_open_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open';
$$;

-- Function to get critical alerts count
CREATE OR REPLACE FUNCTION public.get_critical_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open'
  AND severity = 'critical';
$$;

-- Function to calculate next run time for a schedule
CREATE OR REPLACE FUNCTION public.calculate_next_run_time(
  p_schedule_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_frequency TEXT;
  v_time_of_day TIME;
  v_day_of_week INTEGER;
  v_day_of_month INTEGER;
  v_next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT frequency, time_of_day, day_of_week, day_of_month
  INTO v_frequency, v_time_of_day, v_day_of_week, v_day_of_month
  FROM public.seo_monitoring_schedules
  WHERE id = p_schedule_id;

  CASE v_frequency
    WHEN 'hourly' THEN
      v_next_run := now() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + 1)::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + ((7 + COALESCE(v_day_of_week, 0) - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7))::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'monthly' THEN
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (COALESCE(v_day_of_month, 1) - 1)::TEXT || ' days')::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    ELSE
      v_next_run := now() + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_notification_preferences IS 'User notification preferences for SEO alerts';
COMMENT ON TABLE public.seo_alert_rules IS 'Rules for triggering automated SEO alerts';
COMMENT ON TABLE public.seo_alerts IS 'Triggered SEO alerts and their status';
COMMENT ON TABLE public.seo_monitoring_schedules IS 'Automated SEO monitoring schedules';
COMMENT ON TABLE public.seo_monitoring_log IS 'Log of all automated monitoring executions';

COMMENT ON FUNCTION public.get_open_alerts_count IS 'Get count of open SEO alerts';
COMMENT ON FUNCTION public.get_critical_alerts_count IS 'Get count of critical open SEO alerts';
COMMENT ON FUNCTION public.calculate_next_run_time IS 'Calculate next run time for a monitoring schedule';
