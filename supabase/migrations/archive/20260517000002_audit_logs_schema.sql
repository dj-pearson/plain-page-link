-- =============================================================================
-- Audit Logging: Admin Read Policy + Change Triggers
-- =============================================================================
-- The audit_logs table, its indexes, RLS, and the log_audit_event()
-- function already exist (migration 20251204000001_auth_security_features).
-- That migration provides:
--   * audit_logs(user_id, actor_id, action, resource_type, resource_id,
--     status, ip_address, user_agent, details, risk_level, created_at)
--   * indexes incl. (user_id, created_at DESC) and (resource_type, resource_id)
--   * RLS: "Users can view own audit logs", "Service role can manage..."
--   * log_audit_event(p_user_id, p_action, p_status, p_resource_type,
--     p_resource_id, p_ip_address, p_user_agent, p_details, p_risk_level,
--     p_actor_id)
--
-- This migration is purely additive and completes US-013:
--   1. Adds the missing admin "read all" RLS policy.
--   2. Adds INSERT/UPDATE/DELETE triggers on profiles, listings, leads
--      that record changes via the existing log_audit_event().
--
-- Partitioning strategy:
--   audit_logs is append-only and grows unbounded. When volume warrants,
--   convert to a partitioned table BY RANGE (created_at) with one
--   partition per month (e.g. audit_logs_2026_05) plus a default
--   partition. Detach + archive old partitions to cold storage instead
--   of DELETE so the active table stays small and queries stay fast.
-- =============================================================================

-- 1. Admins can read every audit log entry (users already restricted to
--    their own rows by the pre-existing policy).
DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;
CREATE POLICY "Admins can read all audit logs"
    ON audit_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- 2. Generic change-auditing trigger function
-- =============================================================================
-- Captures INSERT/UPDATE/DELETE on audited tables. For UPDATE it records
-- old and new row snapshots so changes can be reconstructed. Uses jsonb
-- extraction for the owner so tables without a user_id column (profiles,
-- whose id IS the user id) do not raise.
CREATE OR REPLACE FUNCTION audit_table_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_resource_id TEXT;
    v_details JSONB;
    v_row JSONB;
BEGIN
    v_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        v_row := to_jsonb(OLD);
        v_resource_id := OLD.id::text;
        v_details := jsonb_build_object('old', v_row);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_row := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', v_row);
    ELSE -- INSERT
        v_row := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('new', v_row);
    END IF;

    -- Best-effort subject: authenticated user, else the row's owner.
    IF v_user_id IS NULL THEN
        v_user_id := COALESCE(
            (v_row->>'user_id')::uuid,
            (v_row->>'id')::uuid
        );
    END IF;

    PERFORM log_audit_event(
        p_user_id        => v_user_id,
        p_action         => lower(TG_OP) || '_' || TG_TABLE_NAME,
        p_status         => 'success',
        p_resource_type  => TG_TABLE_NAME,
        p_resource_id    => v_resource_id,
        p_ip_address     => NULL,
        p_user_agent     => NULL,
        p_details        => v_details,
        p_risk_level     => 'low',
        p_actor_id       => auth.uid()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. Attach triggers to audited tables
-- =============================================================================
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_table_change();

DROP TRIGGER IF EXISTS audit_listings_changes ON listings;
CREATE TRIGGER audit_listings_changes
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW EXECUTE FUNCTION audit_table_change();

DROP TRIGGER IF EXISTS audit_leads_changes ON leads;
CREATE TRIGGER audit_leads_changes
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION audit_table_change();
