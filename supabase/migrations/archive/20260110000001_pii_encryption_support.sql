-- =============================================================================
-- PII Encryption Support Migration
-- =============================================================================
-- This migration sets up infrastructure for PII encryption at rest:
-- 1. Creates encrypted_pii_config table to track encrypted fields
-- 2. Adds helper functions for encryption status management
-- 3. Creates audit logging for encryption operations
--
-- IMPORTANT: The actual encryption is performed by the Edge Function
-- using AES-256-GCM with a master key stored in environment secrets.
-- =============================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. Encrypted PII Configuration Table
-- =============================================================================
-- Tracks which fields in which tables are encrypted
CREATE TABLE IF NOT EXISTS encrypted_pii_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    encryption_type TEXT NOT NULL DEFAULT 'aes-256-gcm',
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(table_name, field_name)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_config_table
ON encrypted_pii_config(table_name);

-- Enable RLS
ALTER TABLE encrypted_pii_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify encryption config
CREATE POLICY "Admins can manage encryption config"
ON encrypted_pii_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 2. PII Encryption Audit Log
-- =============================================================================
-- Tracks all encryption/decryption operations for compliance
CREATE TABLE IF NOT EXISTS pii_encryption_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operation TEXT NOT NULL CHECK (operation IN ('encrypt', 'decrypt', 'key_rotation', 'config_change')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    fields_affected TEXT[],
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_user
ON pii_encryption_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_table
ON pii_encryption_audit(table_name);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_operation
ON pii_encryption_audit(operation);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_created
ON pii_encryption_audit(created_at DESC);

-- Enable RLS
ALTER TABLE pii_encryption_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view encryption audit"
ON pii_encryption_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert encryption audit"
ON pii_encryption_audit
FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- 3. Encryption Key Metadata Table
-- =============================================================================
-- Stores metadata about encryption keys (NOT the keys themselves)
-- Used for key rotation tracking
CREATE TABLE IF NOT EXISTS encryption_key_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT NOT NULL UNIQUE,
    key_version INTEGER NOT NULL DEFAULT 1,
    algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE encryption_key_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can manage key metadata
CREATE POLICY "Admins can manage encryption keys"
ON encryption_key_metadata
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 4. Insert Default PII Field Configurations
-- =============================================================================
-- These are the fields that should be encrypted based on the analysis

-- Profiles table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('profiles', 'phone', 'aes-256-gcm'),
    ('profiles', 'license_number', 'aes-256-gcm'),
    ('profiles', 'email_display', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Leads table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('leads', 'name', 'aes-256-gcm'),
    ('leads', 'email', 'aes-256-gcm'),
    ('leads', 'phone', 'aes-256-gcm'),
    ('leads', 'property_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Testimonials table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('testimonials', 'client_name', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Listings table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('listings', 'address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- OAuth credentials (highly sensitive)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('bing_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('bing_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- MFA secrets (critical)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_mfa_settings', 'totp_secret', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Session and login data
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_sessions', 'ip_address', 'aes-256-gcm'),
    ('login_attempts', 'ip_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- =============================================================================
-- 5. Helper Functions
-- =============================================================================

-- Function to check if a field is encrypted
CREATE OR REPLACE FUNCTION is_field_encrypted(
    p_table_name TEXT,
    p_field_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM encrypted_pii_config
        WHERE table_name = p_table_name
        AND field_name = p_field_name
        AND is_encrypted = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all encrypted fields for a table
CREATE OR REPLACE FUNCTION get_encrypted_fields(
    p_table_name TEXT
) RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
BEGIN
    SELECT array_agg(field_name)
    INTO result
    FROM encrypted_pii_config
    WHERE table_name = p_table_name
    AND is_encrypted = true;

    RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log encryption operation
CREATE OR REPLACE FUNCTION log_encryption_operation(
    p_user_id UUID,
    p_operation TEXT,
    p_table_name TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_fields TEXT[] DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO pii_encryption_audit (
        user_id,
        operation,
        table_name,
        record_id,
        fields_affected,
        success,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_operation,
        p_table_name,
        p_record_id,
        p_fields,
        p_success,
        p_error,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a secure encryption key (for key rotation)
-- Note: This generates the key but does NOT store it in the database
-- The key should be securely transferred to environment secrets
CREATE OR REPLACE FUNCTION generate_encryption_key()
RETURNS TEXT AS $$
BEGIN
    -- Generate 32 random bytes (256 bits) and encode as base64
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_field_encrypted(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_encrypted_fields(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_encryption_operation(UUID, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_encryption_key() TO service_role;

-- =============================================================================
-- 6. Update timestamp trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_encrypted_pii_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_encrypted_pii_config_timestamp
    BEFORE UPDATE ON encrypted_pii_config
    FOR EACH ROW
    EXECUTE FUNCTION update_encrypted_pii_config_timestamp();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE encrypted_pii_config IS 'Tracks which database fields contain encrypted PII data';
COMMENT ON TABLE pii_encryption_audit IS 'Audit log for all PII encryption/decryption operations';
COMMENT ON TABLE encryption_key_metadata IS 'Metadata for encryption keys (keys stored in environment secrets)';
COMMENT ON FUNCTION is_field_encrypted IS 'Check if a specific field is configured for encryption';
COMMENT ON FUNCTION get_encrypted_fields IS 'Get all encrypted fields for a given table';
COMMENT ON FUNCTION log_encryption_operation IS 'Log an encryption operation to the audit table';
COMMENT ON FUNCTION generate_encryption_key IS 'Generate a new 256-bit encryption key (admin use only)';
