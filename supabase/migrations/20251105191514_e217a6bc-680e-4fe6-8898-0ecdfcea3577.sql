-- Migration 3: SEO Automated Monitoring
-- Tables: seo_notification_preferences, seo_alert_rules, seo_alerts, seo_monitoring_schedules, seo_monitoring_log

CREATE TABLE public.seo_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  in_app_enabled BOOLEAN DEFAULT true,
  critical_alerts BOOLEAN DEFAULT true,
  ranking_changes BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  broken_links BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

CREATE TABLE public.seo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ranking_drop', 'ranking_increase', 'traffic_drop', 'broken_links', 'security_issue', 'mobile_usability', 'crawl_error', 'duplicate_content', 'missing_meta_tags', 'custom')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES seo_alert_rules(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affected_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('full_audit', 'keyword_check', 'broken_links', 'security_scan')),
  target_url TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.seo_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_monitoring_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  results_summary JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX idx_seo_alerts_user_id ON public.seo_alerts(user_id);
CREATE INDEX idx_seo_schedules_active ON public.seo_monitoring_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);

-- RLS
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage alert rules"
ON public.seo_alert_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all alerts"
ON public.seo_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own alerts"
ON public.seo_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage monitoring schedules"
ON public.seo_monitoring_schedules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view monitoring logs"
ON public.seo_monitoring_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_seo_notif_pref_updated_at
BEFORE UPDATE ON public.seo_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_alert_rules_updated_at
BEFORE UPDATE ON public.seo_alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_alerts_updated_at
BEFORE UPDATE ON public.seo_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();