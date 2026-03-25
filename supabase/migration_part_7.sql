
-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_scheduled ON workflow_execution_queue(scheduled_for, priority DESC) WHERE locked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_execution_id ON workflow_execution_queue(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_locked ON workflow_execution_queue(locked_at) WHERE locked_at IS NOT NULL;

COMMENT ON TABLE workflow_execution_queue IS 'Queue for async workflow node processing';

-- =============================================
-- WORKFLOW TRIGGERS (Event subscriptions)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Trigger Type
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'manual', 'schedule', 'webhook',
    'lead_created', 'lead_updated', 'lead_status_changed',
    'listing_created', 'listing_updated', 'listing_sold',
    'form_submitted', 'page_viewed', 'link_clicked',
    'email_opened', 'email_clicked'
  )),

  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,

  -- Schedule (for cron triggers)
  cron_expression TEXT,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Webhook (for webhook triggers)
  webhook_secret TEXT,
  webhook_url TEXT GENERATED ALWAYS AS (
    CASE WHEN trigger_type = 'webhook'
    THEN 'https://api.agentbio.net/webhooks/workflow/' || id::text
    ELSE NULL END
  ) STORED,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON workflow_triggers(trigger_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_schedule ON workflow_triggers(next_run_at) WHERE trigger_type = 'schedule' AND is_active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_workflow_triggers_updated_at ON workflow_triggers;
CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workflow_triggers IS 'Event triggers that start workflow executions';

-- =============================================
-- WORKFLOW SHARED TEMPLATES (Community/Admin)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Template Data
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,

  -- Display
  icon TEXT,
  preview_image_url TEXT,

  -- Stats
  use_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Access
  is_public BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_rating ON workflow_templates(rating DESC) WHERE is_public = true;

COMMENT ON TABLE workflow_templates IS 'Shareable workflow templates';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_node_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflows - users own their workflows
DROP POLICY IF EXISTS "Users can manage own workflows" ON workflows;
CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL
  USING (auth.uid() = user_id);

-- Workflow versions - same as workflows
DROP POLICY IF EXISTS "Users can manage own workflow versions" ON workflow_versions;
CREATE POLICY "Users can manage own workflow versions"
  ON workflow_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_versions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Node templates - everyone can read
DROP POLICY IF EXISTS "Everyone can read node templates" ON workflow_node_templates;
CREATE POLICY "Everyone can read node templates"
  ON workflow_node_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
DROP POLICY IF EXISTS "Admins can manage node templates" ON workflow_node_templates;
CREATE POLICY "Admins can manage node templates"
  ON workflow_node_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Executions - users can view their own
DROP POLICY IF EXISTS "Users can view own workflow executions" ON workflow_executions;
CREATE POLICY "Users can view own workflow executions"
  ON workflow_executions FOR SELECT
  USING (user_id = auth.uid());

-- Service role manages executions
DROP POLICY IF EXISTS "Service role manages executions" ON workflow_executions;
CREATE POLICY "Service role manages executions"
  ON workflow_executions FOR ALL
  USING (true);

-- Execution steps - users can view their own
DROP POLICY IF EXISTS "Users can view own execution steps" ON workflow_execution_steps;
CREATE POLICY "Users can view own execution steps"
  ON workflow_execution_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE workflow_executions.id = workflow_execution_steps.execution_id
      AND workflow_executions.user_id = auth.uid()
    )
  );

-- Queue - service role only
DROP POLICY IF EXISTS "Service role manages queue" ON workflow_execution_queue;
CREATE POLICY "Service role manages queue"
  ON workflow_execution_queue FOR ALL
  USING (true);

-- Triggers - users can manage their own
DROP POLICY IF EXISTS "Users can manage own triggers" ON workflow_triggers;
CREATE POLICY "Users can manage own triggers"
  ON workflow_triggers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_triggers.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Templates - public can read, admins can manage
DROP POLICY IF EXISTS "Public can read templates" ON workflow_templates;
CREATE POLICY "Public can read templates"
  ON workflow_templates FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON workflow_templates;
CREATE POLICY "Admins can manage templates"
  ON workflow_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to start a workflow execution
CREATE OR REPLACE FUNCTION start_workflow_execution(
  p_workflow_id UUID,
  p_trigger_type TEXT,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_workflow workflows%ROWTYPE;
  v_execution_id UUID;
BEGIN
  -- Get workflow
  SELECT * INTO v_workflow FROM workflows WHERE id = p_workflow_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not active';
  END IF;

  -- Create execution
  INSERT INTO workflow_executions (
    workflow_id, user_id, workflow_version,
    status, trigger_type, trigger_data,
    started_at, timeout_at
  )
  VALUES (
    p_workflow_id, v_workflow.user_id, v_workflow.version,
    'running', p_trigger_type, p_trigger_data,
    now(), now() + interval '1 hour'
  )
  RETURNING id INTO v_execution_id;

  -- Update workflow stats
  UPDATE workflows
  SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a workflow execution
CREATE OR REPLACE FUNCTION complete_workflow_execution(
  p_execution_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_error_node_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_execution workflow_executions%ROWTYPE;
BEGIN
  -- Get execution
  SELECT * INTO v_execution FROM workflow_executions WHERE id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution not found';
  END IF;

  -- Update execution
  UPDATE workflow_executions
  SET
    status = p_status,
    completed_at = now(),
    result = p_result,
    error_message = p_error_message,
    error_node_id = p_error_node_id
  WHERE id = p_execution_id;

  -- Update workflow stats
  IF p_status = 'completed' THEN
    UPDATE workflows
    SET success_count = success_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  ELSIF p_status = 'failed' THEN
    UPDATE workflows
    SET failure_count = failure_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next scheduled workflows
CREATE OR REPLACE FUNCTION get_scheduled_workflows(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  trigger_id UUID,
  workflow_id UUID,
  user_id UUID,
  trigger_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id as trigger_id,
    wt.workflow_id,
    w.user_id,
    wt.config as trigger_config
  FROM workflow_triggers wt
  JOIN workflows w ON w.id = wt.workflow_id
  WHERE wt.trigger_type = 'schedule'
  AND wt.is_active = true
  AND w.is_active = true
  AND wt.next_run_at <= now()
  ORDER BY wt.next_run_at
  LIMIT p_limit
  FOR UPDATE OF wt SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION start_workflow_execution IS 'Start a new workflow execution';
COMMENT ON FUNCTION complete_workflow_execution IS 'Complete a workflow execution with status and result';
COMMENT ON FUNCTION get_scheduled_workflows IS 'Get workflows that are due for scheduled execution';

-- =============================================
-- SEED DATA: Default Node Templates
-- =============================================

INSERT INTO workflow_node_templates (type, subtype, name, description, icon, category, config_schema, default_config, color) VALUES
-- Triggers
('trigger', 'manual', 'Manual Trigger', 'Start workflow manually', 'play', 'triggers',
  '{"type": "object", "properties": {"name": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'schedule', 'Schedule', 'Run on a schedule', 'clock', 'triggers',
  '{"type": "object", "properties": {"cron": {"type": "string"}, "timezone": {"type": "string"}}}',
  '{"cron": "0 9 * * *", "timezone": "America/New_York"}', '#10B981'),
('trigger', 'lead_created', 'New Lead', 'When a new lead is created', 'user-plus', 'triggers',
  '{"type": "object", "properties": {"source": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'listing_created', 'New Listing', 'When a new listing is created', 'home', 'triggers',
  '{"type": "object", "properties": {"status": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'webhook', 'Webhook', 'Triggered by external webhook', 'link', 'triggers',
  '{"type": "object", "properties": {}}',
  '{}', '#10B981'),

-- Actions
('action', 'send_email', 'Send Email', 'Send an email to a recipient', 'mail', 'communication',
  '{"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}',
  '{}', '#6366F1'),
('action', 'send_sms', 'Send SMS', 'Send an SMS message', 'message-square', 'communication',
  '{"type": "object", "properties": {"to": {"type": "string"}, "message": {"type": "string"}}, "required": ["to", "message"]}',
  '{}', '#6366F1'),
('action', 'update_lead', 'Update Lead', 'Update lead properties', 'edit', 'crm',
  '{"type": "object", "properties": {"leadId": {"type": "string"}, "updates": {"type": "object"}}}',
  '{}', '#6366F1'),
('action', 'create_task', 'Create Task', 'Create a follow-up task', 'check-square', 'productivity',
  '{"type": "object", "properties": {"title": {"type": "string"}, "dueDate": {"type": "string"}, "assignee": {"type": "string"}}}',
  '{}', '#6366F1'),
('action', 'webhook_call', 'HTTP Request', 'Make an HTTP request', 'globe', 'integrations',
  '{"type": "object", "properties": {"url": {"type": "string"}, "method": {"type": "string"}, "headers": {"type": "object"}, "body": {"type": "object"}}}',
  '{"method": "POST"}', '#6366F1'),
('action', 'add_tag', 'Add Tag', 'Add a tag to a record', 'tag', 'organization',
  '{"type": "object", "properties": {"recordType": {"type": "string"}, "recordId": {"type": "string"}, "tag": {"type": "string"}}}',
  '{}', '#6366F1'),

-- Conditions
('condition', 'if_else', 'If/Else', 'Branch based on a condition', 'git-branch', 'logic',
  '{"type": "object", "properties": {"field": {"type": "string"}, "operator": {"type": "string"}, "value": {"type": "string"}}}',
  '{}', '#F59E0B'),
('condition', 'switch', 'Switch', 'Multiple branches based on value', 'git-merge', 'logic',
  '{"type": "object", "properties": {"field": {"type": "string"}, "cases": {"type": "array"}}}',
  '{}', '#F59E0B'),
('condition', 'filter', 'Filter', 'Filter records based on criteria', 'filter', 'logic',
  '{"type": "object", "properties": {"conditions": {"type": "array"}}}',
  '{}', '#F59E0B'),

-- Delays
('delay', 'wait', 'Wait', 'Wait for a specified duration', 'clock', 'timing',
  '{"type": "object", "properties": {"duration": {"type": "number"}, "unit": {"type": "string"}}}',
  '{"duration": 1, "unit": "hours"}', '#8B5CF6'),
('delay', 'wait_until', 'Wait Until', 'Wait until a specific time', 'calendar', 'timing',
  '{"type": "object", "properties": {"datetime": {"type": "string"}}}',
  '{}', '#8B5CF6'),

-- Transform
('transform', 'set_variable', 'Set Variable', 'Set a workflow variable', 'variable', 'data',
  '{"type": "object", "properties": {"name": {"type": "string"}, "value": {"type": "string"}}}',
  '{}', '#EC4899'),
('transform', 'format_data', 'Format Data', 'Transform data format', 'code', 'data',
  '{"type": "object", "properties": {"template": {"type": "string"}}}',
  '{}', '#EC4899'),

-- Loops
('loop', 'for_each', 'For Each', 'Loop over array items', 'repeat', 'iteration',
  '{"type": "object", "properties": {"array": {"type": "string"}, "itemVariable": {"type": "string"}}}',
  '{"itemVariable": "item"}', '#14B8A6')
ON CONFLICT (type, subtype) DO NOTHING;
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked, expires_at);

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
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip_recent ON login_attempts(email, ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(email, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_entries(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_type ON rate_limit_entries(limit_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_entries(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON rate_limit_entries(blocked_until);

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
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_activity ON audit_logs(user_id, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_data_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_scheduled_deletion ON gdpr_data_requests(scheduled_deletion_at);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_gdpr_data_requests_updated_at ON gdpr_data_requests;
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
CREATE INDEX IF NOT EXISTS idx_account_deletion_scheduled_for ON account_deletion_scheduled(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_account_deletion_cancelled ON account_deletion_scheduled(cancelled);
CREATE INDEX IF NOT EXISTS idx_account_deletion_executed ON account_deletion_scheduled(executed);
CREATE INDEX IF NOT EXISTS idx_account_deletion_user ON account_deletion_scheduled(user_id);

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
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can revoke own sessions" ON user_sessions;
CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage sessions" ON user_sessions;
CREATE POLICY "Service role can manage sessions"
  ON user_sessions FOR ALL
  USING (true);

-- Login Attempts - service role only for writing, users can view own
DROP POLICY IF EXISTS "Users can view own login attempts" ON login_attempts;
CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage login attempts" ON login_attempts;
CREATE POLICY "Service role can manage login attempts"
  ON login_attempts FOR ALL
  USING (true);

-- Rate Limit - service role only
DROP POLICY IF EXISTS "Service role manages rate limits" ON rate_limit_entries;
CREATE POLICY "Service role manages rate limits"
  ON rate_limit_entries FOR ALL
  USING (true);

-- Audit Logs - users can view own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage audit logs" ON audit_logs;
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (true);

-- GDPR Requests - users can view and create own requests
DROP POLICY IF EXISTS "Users can view own GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can view own GDPR requests"
  ON gdpr_data_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can create own GDPR requests"
  ON gdpr_data_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own pending GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can cancel own pending GDPR requests"
  ON gdpr_data_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Service role can manage GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Service role can manage GDPR requests"
  ON gdpr_data_requests FOR ALL
  USING (true);

-- Account Deletion Schedule - users can view and cancel own
DROP POLICY IF EXISTS "Users can view own deletion schedule" ON account_deletion_scheduled;
CREATE POLICY "Users can view own deletion schedule"
  ON account_deletion_scheduled FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own deletion" ON account_deletion_scheduled;
CREATE POLICY "Users can cancel own deletion"
  ON account_deletion_scheduled FOR UPDATE
  USING (auth.uid() = user_id AND cancelled = false AND executed = false);

DROP POLICY IF EXISTS "Service role can manage deletion schedule" ON account_deletion_scheduled;
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
-- =============================================
-- Billing Schema Consolidation Migration
-- =============================================
-- This migration consolidates the billing infrastructure by:
-- 1. Creating missing tables referenced in code (feature_usage, feature_catalog, etc.)
-- 2. Adding usage-based billing support
-- 3. Creating unified views for subscription data
-- 4. Adding helper functions for billing operations
-- =============================================

-- =============================================
-- 1. Feature Catalog - defines all billable features
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE, -- e.g., 'ai_listing_description', 'market_report'
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing configuration
  pricing_type TEXT NOT NULL DEFAULT 'included', -- 'included', 'metered', 'tiered'
  unit_price DECIMAL(10,4), -- Price per unit (for metered features)
  unit_name TEXT DEFAULT 'use', -- e.g., 'use', 'photo', 'report'

  -- Limits for included features
  free_limit INTEGER DEFAULT 0, -- Number included in free plan
  starter_limit INTEGER DEFAULT 0,
  professional_limit INTEGER DEFAULT 0,
  team_limit INTEGER DEFAULT 0,
  enterprise_limit INTEGER, -- NULL means unlimited

  -- Feature flags
  is_active BOOLEAN DEFAULT TRUE,
  requires_subscription BOOLEAN DEFAULT FALSE,

  -- Metadata
  category TEXT, -- 'ai', 'reports', 'integrations', 'storage'
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read the feature catalog
DROP POLICY IF EXISTS "Anyone can read feature catalog" ON public.feature_catalog;
CREATE POLICY "Anyone can read feature catalog"
  ON public.feature_catalog FOR SELECT
  USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can modify feature catalog" ON public.feature_catalog;
CREATE POLICY "Admins can modify feature catalog"
  ON public.feature_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default features
INSERT INTO public.feature_catalog (feature_key, name, description, pricing_type, unit_price, unit_name, free_limit, starter_limit, professional_limit, team_limit, category)
VALUES
  ('listings', 'Property Listings', 'Active property listings', 'included', NULL, 'listing', 3, 10, 25, 100, 'core'),
  ('links', 'Bio Links', 'Custom links on profile', 'included', NULL, 'link', 5, 15, 50, 200, 'core'),
  ('testimonials', 'Testimonials', 'Client testimonials', 'included', NULL, 'testimonial', 3, 10, 25, 100, 'core'),
  ('analytics_days', 'Analytics History', 'Days of analytics data retention', 'included', NULL, 'day', 7, 30, 90, 365, 'analytics'),
  ('ai_listing_description', 'AI Listing Description', 'AI-generated property descriptions', 'metered', 2.00, 'use', 0, 3, 10, 50, 'ai'),
  ('market_report', 'Market Report', 'Local market analysis report', 'metered', 10.00, 'report', 0, 0, 2, 10, 'reports'),
  ('virtual_staging', 'Virtual Staging', 'AI virtual staging for photos', 'metered', 5.00, 'photo', 0, 0, 5, 25, 'ai'),
  ('video_tour', 'Video Tour', 'Automated video tour creation', 'metered', 15.00, 'tour', 0, 0, 2, 10, 'media'),
  ('cma_report', 'CMA Report', 'Comparative market analysis', 'metered', 19.99, 'report', 0, 0, 1, 5, 'reports'),
  ('custom_domain', 'Custom Domain', 'Use your own domain', 'included', NULL, 'domain', 0, 0, 1, 5, 'branding'),
  ('remove_branding', 'Remove Branding', 'Remove AgentBio branding', 'included', NULL, 'feature', 0, 0, 1, 1, 'branding'),
  ('priority_support', 'Priority Support', 'Priority customer support', 'included', NULL, 'feature', 0, 0, 1, 1, 'support'),
  ('team_members', 'Team Members', 'Additional team member seats', 'included', NULL, 'seat', 0, 0, 1, 10, 'team')
ON CONFLICT (feature_key) DO NOTHING;

-- =============================================
-- 2. Feature Usage Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.feature_catalog(feature_key),

  -- Usage tracking
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  usage_period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),

  -- Billing status
  billed_count INTEGER DEFAULT 0, -- Count already billed to Stripe
  pending_count INTEGER GENERATED ALWAYS AS (usage_count - billed_count) STORED,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user per feature per billing period
  UNIQUE(user_id, feature_key, usage_period_start)
);

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_key ON public.feature_usage(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON public.feature_usage(usage_period_start, usage_period_end);

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.feature_usage;
CREATE POLICY "Users can view own usage"
  ON public.feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage
DROP POLICY IF EXISTS "Service role can manage usage" ON public.feature_usage;
CREATE POLICY "Service role can manage usage"
  ON public.feature_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON public.feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. Stripe Customer Mapping
-- =============================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,

  -- Customer metadata
  email TEXT,
  name TEXT,
  default_payment_method TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

-- Users can view their own customer record
DROP POLICY IF EXISTS "Users can view own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages customer records
DROP POLICY IF EXISTS "Service role can manage stripe customers" ON public.stripe_customers;
CREATE POLICY "Service role can manage stripe customers"
  ON public.stripe_customers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 4. Monthly Usage Summary (for billing)
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  -- Summary data
  total_usage_amount DECIMAL(10,2) DEFAULT 0,
  features_used JSONB DEFAULT '{}', -- { feature_key: { count, amount } }

  -- Billing status
  billing_status TEXT DEFAULT 'pending', -- 'pending', 'invoiced', 'paid', 'failed'
  stripe_invoice_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.monthly_usage_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summaries
DROP POLICY IF EXISTS "Users can view own usage summary" ON public.monthly_usage_summary;
CREATE POLICY "Users can view own usage summary"
  ON public.monthly_usage_summary FOR SELECT
  USING (auth.uid() = user_id);