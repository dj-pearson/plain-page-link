-- SEO Automation System
-- Automated audit scheduling, auto-fix rules, competitor tracking, and performance monitoring

-- =============================================
-- SEO AUDIT SCHEDULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_audit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  audit_config JSONB DEFAULT '{}'::jsonb, -- Which checks to run (all, performance, accessibility, seo, etc.)
  notification_channels TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['email', 'slack', 'in_app']
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  last_run_results JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_seo_audit_schedules_next_run ON seo_audit_schedules(next_run_at) WHERE active = true;
CREATE INDEX idx_seo_audit_schedules_created_by ON seo_audit_schedules(created_by);

-- Updated_at trigger
CREATE TRIGGER update_seo_audit_schedules_updated_at
  BEFORE UPDATE ON seo_audit_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_audit_schedules IS 'Scheduled automated SEO audits';

-- =============================================
-- SEO AUTO-FIX RULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  issue_type TEXT NOT NULL, -- 'missing_meta_description', 'broken_link', 'missing_alt_text', etc.
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for when to apply the fix
  fix_action JSONB NOT NULL, -- What action to take
  requires_approval BOOLEAN DEFAULT true,
  auto_apply BOOLEAN DEFAULT false, -- If true, apply without approval
  priority INTEGER DEFAULT 50, -- Higher priority rules run first
  applied_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_autofix_rules_issue_type ON seo_autofix_rules(issue_type) WHERE active = true;
CREATE INDEX idx_seo_autofix_rules_priority ON seo_autofix_rules(priority DESC) WHERE active = true;

-- Updated_at trigger
CREATE TRIGGER update_seo_autofix_rules_updated_at
  BEFORE UPDATE ON seo_autofix_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_autofix_rules IS 'Rules for automatically fixing SEO issues';

-- =============================================
-- SEO AUTO-FIX HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES seo_autofix_rules(id) ON DELETE SET NULL,
  issue_id UUID, -- Reference to specific issue (could be from various tables)
  issue_type TEXT NOT NULL,
  fix_applied JSONB NOT NULL, -- Details of what was changed
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'rolled_back', 'pending_approval')),
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id),
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT
);

-- Indexes
CREATE INDEX idx_seo_autofix_history_rule_id ON seo_autofix_history(rule_id);
CREATE INDEX idx_seo_autofix_history_applied_at ON seo_autofix_history(applied_at DESC);
CREATE INDEX idx_seo_autofix_history_result ON seo_autofix_history(result);

COMMENT ON TABLE seo_autofix_history IS 'History of all auto-applied SEO fixes';

-- =============================================
-- SEO COMPETITOR TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS seo_competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords to track for this competitor
  check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  alert_on_rank_change BOOLEAN DEFAULT true,
  alert_on_new_backlinks BOOLEAN DEFAULT true,
  alert_on_content_updates BOOLEAN DEFAULT false,
  rank_change_threshold INTEGER DEFAULT 5, -- Alert if rank changes by more than N positions
  notification_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional tracking metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_competitor_tracking_next_check ON seo_competitor_tracking(next_check_at) WHERE active = true;
CREATE INDEX idx_seo_competitor_tracking_domain ON seo_competitor_tracking(competitor_domain);

-- Updated_at trigger
CREATE TRIGGER update_seo_competitor_tracking_updated_at
  BEFORE UPDATE ON seo_competitor_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_competitor_tracking IS 'Automated competitor monitoring and tracking';

-- =============================================
-- SEO AUTOMATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL CHECK (automation_type IN ('audit', 'autofix', 'competitor_check', 'report_generation')),
  automation_id UUID, -- ID of the schedule/rule/tracker
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed')),
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER, -- Execution time in milliseconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_automation_logs_type ON seo_automation_logs(automation_type);
CREATE INDEX idx_seo_automation_logs_created_at ON seo_automation_logs(created_at DESC);
CREATE INDEX idx_seo_automation_logs_status ON seo_automation_logs(status);

COMMENT ON TABLE seo_automation_logs IS 'Logs of all SEO automation executions';

-- =============================================
-- SEO NOTIFICATION QUEUE
-- =============================================

CREATE TABLE IF NOT EXISTS seo_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('critical_issue', 'warning', 'opportunity', 'competitor_alert', 'report_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'in_app']
  recipients TEXT[] NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Additional notification data
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_notification_queue_status ON seo_notification_queue(status) WHERE status = 'pending';
CREATE INDEX idx_seo_notification_queue_created_at ON seo_notification_queue(created_at DESC);

COMMENT ON TABLE seo_notification_queue IS 'Queue for SEO-related notifications';

-- =============================================
-- SEO SCHEDULED REPORTS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('comprehensive', 'executive_summary', 'keyword_performance', 'competitor_analysis', 'technical_seo')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  report_config JSONB DEFAULT '{}'::jsonb, -- What to include in the report
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json')),
  recipients TEXT[] NOT NULL,
  delivery_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_scheduled_reports_next_gen ON seo_scheduled_reports(next_generation_at) WHERE active = true;

-- Updated_at trigger
CREATE TRIGGER update_seo_scheduled_reports_updated_at
  BEFORE UPDATE ON seo_scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_scheduled_reports IS 'Scheduled automated SEO reports';

-- =============================================
-- SEO REPORT HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL, -- Full report data
  file_url TEXT, -- If stored as file
  generated_at TIMESTAMPTZ DEFAULT now(),
  sent_to TEXT[], -- Who received it
  generation_time_ms INTEGER
);

-- Indexes
CREATE INDEX idx_seo_report_history_schedule_id ON seo_report_history(schedule_id);
CREATE INDEX idx_seo_report_history_generated_at ON seo_report_history(generated_at DESC);

COMMENT ON TABLE seo_report_history IS 'History of generated SEO reports';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE seo_audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_report_history ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for all tables
CREATE POLICY "Admin full access to seo_audit_schedules" ON seo_audit_schedules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_autofix_rules" ON seo_autofix_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_autofix_history" ON seo_autofix_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_competitor_tracking" ON seo_competitor_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_automation_logs" ON seo_automation_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_notification_queue" ON seo_notification_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_scheduled_reports" ON seo_scheduled_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to seo_report_history" ON seo_report_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate next run time based on schedule type
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_schedule_type TEXT,
  p_cron_expression TEXT DEFAULT NULL,
  p_current_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_schedule_type
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    WHEN 'cron' THEN
      -- For cron, we'll calculate in the edge function
      -- This is a placeholder - actual cron parsing would be more complex
      RETURN p_current_time + INTERVAL '1 hour';
    ELSE
      RETURN p_current_time + INTERVAL '1 day';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to log automation execution
CREATE OR REPLACE FUNCTION log_automation_execution(
  p_automation_type TEXT,
  p_automation_id UUID,
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO seo_automation_logs (
    automation_type,
    automation_id,
    status,
    message,
    details,
    duration_ms
  ) VALUES (
    p_automation_type,
    p_automation_id,
    p_status,
    p_message,
    p_details,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue SEO notification
CREATE OR REPLACE FUNCTION queue_seo_notification(
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_channels TEXT[],
  p_recipients TEXT[],
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO seo_notification_queue (
    notification_type,
    title,
    message,
    severity,
    channels,
    recipients,
    data
  ) VALUES (
    p_notification_type,
    p_title,
    p_message,
    p_severity,
    p_channels,
    p_recipients,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update rule statistics
CREATE OR REPLACE FUNCTION update_autofix_rule_stats(
  p_rule_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE seo_autofix_rules
  SET
    applied_count = applied_count + 1,
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END,
    updated_at = now()
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DEFAULT DATA / EXAMPLES
-- =============================================

-- Insert example audit schedule (daily comprehensive audit)
INSERT INTO seo_audit_schedules (name, description, schedule_type, audit_config, notification_channels, active)
VALUES (
  'Daily Comprehensive SEO Audit',
  'Runs a full SEO audit every day at 6:00 AM',
  'daily',
  '{"checks": ["all"], "include_performance": true, "include_accessibility": true}'::jsonb,
  ARRAY['in_app', 'email']::TEXT[],
  false -- Disabled by default, admin can enable
)
ON CONFLICT DO NOTHING;

-- Insert example auto-fix rules
INSERT INTO seo_autofix_rules (name, description, issue_type, conditions, fix_action, requires_approval, auto_apply, priority)
VALUES
  (
    'Auto-add missing alt text to images',
    'Automatically generates descriptive alt text for images missing alt attributes',
    'missing_alt_text',
    '{"image_type": "content", "exclude_decorative": true}'::jsonb,
    '{"action": "generate_alt_text", "use_ai": true}'::jsonb,
    true,
    false,
    80
  ),
  (
    'Fix broken internal links',
    'Automatically updates broken internal links to correct URLs',
    'broken_link',
    '{"link_type": "internal", "status_code": 404}'::jsonb,
    '{"action": "update_link", "find_similar": true}'::jsonb,
    true,
    false,
    90
  ),
  (
    'Add missing meta descriptions',
    'Generates meta descriptions for pages missing them',
    'missing_meta_description',
    '{"page_type": "article", "min_content_length": 200}'::jsonb,
    '{"action": "generate_meta_description", "use_ai": true, "max_length": 160}'::jsonb,
    true,
    false,
    70
  )
ON CONFLICT DO NOTHING;

-- Insert example scheduled report
INSERT INTO seo_scheduled_reports (name, description, report_type, schedule_type, format, recipients, active)
VALUES (
  'Weekly SEO Executive Summary',
  'High-level overview of SEO performance sent every Monday',
  'executive_summary',
  'weekly',
  'pdf',
  ARRAY['admin@example.com']::TEXT[],
  false -- Disabled by default
)
ON CONFLICT DO NOTHING;
