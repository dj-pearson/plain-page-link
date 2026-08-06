-- Visual Workflow Builder & Multi-Step Orchestration Tables
-- Supports visual workflow design, execution, and monitoring

-- =============================================
-- WORKFLOWS (Main workflow definitions)
-- =============================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('lead_management', 'listing_automation', 'marketing', 'notifications', 'integrations', 'general')),

  -- Visual Builder Data
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,

  -- Workflow Settings
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Trigger configuration

  -- Versioning
  version INTEGER DEFAULT 1,
  published_version INTEGER,
  last_published_at TIMESTAMPTZ,

  -- Stats
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX idx_workflows_published ON workflows(is_published) WHERE is_published = true;

-- Updated_at trigger
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workflows IS 'User-created automation workflows with visual builder data';

-- =============================================
-- WORKFLOW VERSIONS (Version history)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, version)
);

-- Indexes
CREATE INDEX idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);

COMMENT ON TABLE workflow_versions IS 'Version history for workflows';

-- =============================================
-- WORKFLOW NODE TEMPLATES (Pre-built nodes)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_node_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('trigger', 'action', 'condition', 'delay', 'loop', 'transform')),
  subtype TEXT NOT NULL, -- e.g., 'new_lead', 'send_email', 'update_status'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,

  -- Configuration Schema
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb, -- JSON Schema for node config
  default_config JSONB DEFAULT '{}'::jsonb,

  -- Display
  color TEXT DEFAULT '#4F46E5',
  documentation_url TEXT,

  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, subtype)
);

-- Indexes
CREATE INDEX idx_workflow_node_templates_type ON workflow_node_templates(type);
CREATE INDEX idx_workflow_node_templates_category ON workflow_node_templates(category);

COMMENT ON TABLE workflow_node_templates IS 'Pre-built workflow node templates';

-- =============================================
-- WORKFLOW EXECUTIONS (Runtime instances)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled', 'timeout')),

  -- Execution Context
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb, -- Data that triggered the workflow
  context JSONB DEFAULT '{}'::jsonb, -- Shared context between steps
  variables JSONB DEFAULT '{}'::jsonb, -- User-defined variables

  -- Progress
  current_node_id TEXT,
  completed_nodes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,

  -- Result
  result JSONB,
  error_message TEXT,
  error_node_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_executions_running ON workflow_executions(status) WHERE status = 'running';

COMMENT ON TABLE workflow_executions IS 'Running and completed workflow instances';

-- =============================================
-- WORKFLOW EXECUTION STEPS (Per-node tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  node_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting')),

  -- Data
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_execution_steps_execution_id ON workflow_execution_steps(execution_id);
CREATE INDEX idx_workflow_execution_steps_status ON workflow_execution_steps(status);
CREATE INDEX idx_workflow_execution_steps_node_id ON workflow_execution_steps(node_id);

COMMENT ON TABLE workflow_execution_steps IS 'Individual step execution records within a workflow';

-- =============================================
-- WORKFLOW EXECUTION QUEUE (Async processing)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,

  -- Queue Settings
  priority INTEGER DEFAULT 50, -- Higher = sooner
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Processing
  locked_at TIMESTAMPTZ,
  locked_by TEXT, -- Worker ID
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,

  -- Error handling
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_execution_queue_scheduled ON workflow_execution_queue(scheduled_for, priority DESC) WHERE locked_at IS NULL;
CREATE INDEX idx_workflow_execution_queue_execution_id ON workflow_execution_queue(execution_id);
CREATE INDEX idx_workflow_execution_queue_locked ON workflow_execution_queue(locked_at) WHERE locked_at IS NOT NULL;

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
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(trigger_type) WHERE is_active = true;
CREATE INDEX idx_workflow_triggers_schedule ON workflow_triggers(next_run_at) WHERE trigger_type = 'schedule' AND is_active = true;

-- Updated_at trigger
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
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category) WHERE is_public = true;
CREATE INDEX idx_workflow_templates_rating ON workflow_templates(rating DESC) WHERE is_public = true;

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
CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL
  USING (auth.uid() = user_id);

-- Workflow versions - same as workflows
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
CREATE POLICY "Everyone can read node templates"
  ON workflow_node_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
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
CREATE POLICY "Users can view own workflow executions"
  ON workflow_executions FOR SELECT
  USING (user_id = auth.uid());

-- Service role manages executions
CREATE POLICY "Service role manages executions"
  ON workflow_executions FOR ALL
  USING (true);

-- Execution steps - users can view their own
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
CREATE POLICY "Service role manages queue"
  ON workflow_execution_queue FOR ALL
  USING (true);

-- Triggers - users can manage their own
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
CREATE POLICY "Public can read templates"
  ON workflow_templates FOR SELECT
  USING (is_public = true);

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
