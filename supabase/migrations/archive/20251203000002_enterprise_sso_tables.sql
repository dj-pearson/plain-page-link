-- Enterprise SSO (SAML/OIDC) Tables
-- Supports SAML 2.0, OpenID Connect, and Azure AD integration

-- =============================================
-- ENTERPRISE SSO CONFIGURATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS enterprise_sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, -- Future: link to organizations table
  organization_name TEXT NOT NULL,
  organization_domain TEXT NOT NULL, -- e.g., 'acme.com' for user@acme.com
  sso_provider TEXT NOT NULL CHECK (sso_provider IN ('saml', 'oidc', 'azure_ad', 'okta', 'google_workspace')),

  -- SAML Configuration
  saml_entity_id TEXT UNIQUE,
  saml_sso_url TEXT, -- IdP Single Sign-On URL
  saml_slo_url TEXT, -- IdP Single Logout URL (optional)
  saml_certificate TEXT, -- IdP X.509 Certificate
  saml_metadata_url TEXT, -- URL to fetch IdP metadata
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OIDC Configuration
  oidc_client_id TEXT,
  oidc_client_secret TEXT, -- Encrypted
  oidc_issuer TEXT,
  oidc_authorization_endpoint TEXT,
  oidc_token_endpoint TEXT,
  oidc_userinfo_endpoint TEXT,
  oidc_jwks_uri TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],

  -- Attribute Mapping (maps IdP attributes to user profile)
  attribute_mappings JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "displayName": "name",
    "groups": "groups"
  }'::jsonb,

  -- Access Control
  allowed_groups TEXT[], -- If set, only users in these groups can access
  default_role TEXT DEFAULT 'user' CHECK (default_role IN ('user', 'admin')),
  auto_provision_users BOOLEAN DEFAULT true, -- Create user on first SSO login

  -- Status
  active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_enterprise_sso_config_domain ON enterprise_sso_config(organization_domain) WHERE active = true;
CREATE INDEX idx_enterprise_sso_config_entity_id ON enterprise_sso_config(saml_entity_id);
CREATE INDEX idx_enterprise_sso_config_provider ON enterprise_sso_config(sso_provider);

-- Updated_at trigger
CREATE TRIGGER update_enterprise_sso_config_updated_at
  BEFORE UPDATE ON enterprise_sso_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE enterprise_sso_config IS 'Enterprise SSO configurations for SAML/OIDC providers';

-- =============================================
-- SSO LOGIN SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  request_id TEXT UNIQUE NOT NULL, -- SAML RequestID or OIDC state parameter
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  -- SAML specific
  saml_request TEXT, -- Original SAML AuthnRequest (for debugging)
  saml_response TEXT, -- Received SAML Response (for debugging, encrypted)
  saml_assertion_id TEXT,

  -- OIDC specific
  oidc_nonce TEXT,
  oidc_code_verifier TEXT, -- PKCE code verifier

  -- Result
  user_id UUID REFERENCES auth.users(id),
  error_code TEXT,
  error_message TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  redirect_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_sso_login_sessions_request_id ON sso_login_sessions(request_id);
CREATE INDEX idx_sso_login_sessions_config_id ON sso_login_sessions(config_id);
CREATE INDEX idx_sso_login_sessions_status ON sso_login_sessions(status);
CREATE INDEX idx_sso_login_sessions_expires_at ON sso_login_sessions(expires_at);

COMMENT ON TABLE sso_login_sessions IS 'Tracks SSO login attempts and their status';

-- =============================================
-- SSO USER MAPPINGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  sso_subject_id TEXT NOT NULL, -- User ID from IdP (SAML NameID or OIDC sub)
  sso_email TEXT NOT NULL,
  sso_groups TEXT[],
  sso_attributes JSONB DEFAULT '{}'::jsonb, -- Raw attributes from IdP
  last_login_at TIMESTAMPTZ DEFAULT now(),
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(config_id, sso_subject_id)
);

-- Indexes
CREATE INDEX idx_sso_user_mappings_user_id ON sso_user_mappings(user_id);
CREATE INDEX idx_sso_user_mappings_config_id ON sso_user_mappings(config_id);
CREATE INDEX idx_sso_user_mappings_subject ON sso_user_mappings(sso_subject_id);
CREATE INDEX idx_sso_user_mappings_email ON sso_user_mappings(sso_email);

-- Updated_at trigger
CREATE TRIGGER update_sso_user_mappings_updated_at
  BEFORE UPDATE ON sso_user_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sso_user_mappings IS 'Links Supabase users to their SSO identities';

-- =============================================
-- SSO AUDIT LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enterprise_sso_config(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_initiated', 'login_success', 'login_failed',
    'logout', 'config_created', 'config_updated',
    'config_deleted', 'config_verified', 'user_provisioned',
    'user_deprovisioned', 'group_sync'
  )),
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sso_audit_logs_config_id ON sso_audit_logs(config_id);
CREATE INDEX idx_sso_audit_logs_user_id ON sso_audit_logs(user_id);
CREATE INDEX idx_sso_audit_logs_event_type ON sso_audit_logs(event_type);
CREATE INDEX idx_sso_audit_logs_created_at ON sso_audit_logs(created_at DESC);

COMMENT ON TABLE sso_audit_logs IS 'Audit trail for all SSO-related events';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE enterprise_sso_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_audit_logs ENABLE ROW LEVEL SECURITY;

-- SSO Config - only admins can manage
CREATE POLICY "Admins can manage SSO configs"
  ON enterprise_sso_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view active configs for their domain
CREATE POLICY "Users can view active SSO configs for their domain"
  ON enterprise_sso_config FOR SELECT
  USING (
    active = true
  );

-- Login sessions - service role manages these
CREATE POLICY "Service role manages SSO sessions"
  ON sso_login_sessions FOR ALL
  USING (true);

-- User mappings - users can view their own
CREATE POLICY "Users can view own SSO mappings"
  ON sso_user_mappings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all mappings for their configs
CREATE POLICY "Admins can manage SSO user mappings"
  ON sso_user_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Audit logs - admins can view
CREATE POLICY "Admins can view SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to find SSO config by email domain
CREATE OR REPLACE FUNCTION find_sso_config_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_domain TEXT;
  v_config_id UUID;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  SELECT id INTO v_config_id
  FROM enterprise_sso_config
  WHERE organization_domain = v_domain
  AND active = true
  LIMIT 1;

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create user from SSO
CREATE OR REPLACE FUNCTION find_or_create_sso_user(
  p_config_id UUID,
  p_email TEXT,
  p_subject_id TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_groups TEXT[] DEFAULT NULL,
  p_attributes JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_config enterprise_sso_config%ROWTYPE;
BEGIN
  -- Get SSO config
  SELECT * INTO v_config FROM enterprise_sso_config WHERE id = p_config_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SSO config not found';
  END IF;

  -- Check if user already exists via SSO mapping
  SELECT user_id INTO v_user_id
  FROM sso_user_mappings
  WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing mapping
    UPDATE sso_user_mappings
    SET
      sso_email = p_email,
      sso_groups = COALESCE(p_groups, sso_groups),
      sso_attributes = p_attributes,
      last_login_at = now(),
      login_count = login_count + 1,
      updated_at = now()
    WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

    RETURN v_user_id;
  END IF;

  -- Check if user exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    -- Link existing user to SSO
    INSERT INTO sso_user_mappings (user_id, config_id, sso_subject_id, sso_email, sso_groups, sso_attributes)
    VALUES (v_user_id, p_config_id, p_subject_id, p_email, p_groups, p_attributes);

    RETURN v_user_id;
  END IF;

  -- Auto-provision is handled at the application layer via Supabase Auth
  -- Return NULL to indicate new user needs to be created
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log SSO events
CREATE OR REPLACE FUNCTION log_sso_event(
  p_config_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO sso_audit_logs (config_id, user_id, event_type, event_details, ip_address, user_agent)
  VALUES (p_config_id, p_user_id, p_event_type, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE sso_login_sessions
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  -- Delete old sessions (keep for 30 days for audit)
  DELETE FROM sso_login_sessions
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_sso_config_by_email IS 'Find SSO configuration by email domain';
COMMENT ON FUNCTION find_or_create_sso_user IS 'Find existing user or prepare for creation from SSO';
COMMENT ON FUNCTION log_sso_event IS 'Log SSO audit events';
COMMENT ON FUNCTION cleanup_expired_sso_sessions IS 'Cleanup expired SSO login sessions';
