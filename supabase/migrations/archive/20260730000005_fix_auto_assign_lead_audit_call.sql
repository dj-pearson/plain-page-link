-- ============================================================================
-- Critical fix: auto_assign_lead() never actually round-robins
-- ============================================================================
-- public.auto_assign_lead() calls log_audit_event() passing
--
--     jsonb_build_object(...)::text
--
-- for the 8th argument. That parameter is `p_details jsonb`, and Postgres has no
-- implicit text -> jsonb cast, so overload resolution fails at run time:
--
--     function log_audit_event(uuid, unknown, unknown, unknown, text, unknown,
--                              unknown, text, unknown, unknown) does not exist
--
-- The function's `EXCEPTION WHEN OTHERS THEN RAISE WARNING ... RETURN NEW`
-- handler swallows this, so leads still save and nothing surfaces in the app.
-- What breaks is subtler than a hard failure:
--
--   * NEW.assigned_to is a PL/pgSQL variable, so the assignment made just before
--     the failing call survives into the returned row.
--   * The round-robin cursor increment is a database write inside the aborted
--     block, so it is rolled back every time. team_round_robin therefore stays
--     empty and the cursor is recomputed as 0 on every insert.
--
-- Net effect: every lead is assigned to the SAME (first) team member forever,
-- round-robin never rotates, and no lead_auto_assign audit event is ever
-- written. Verified on the rebuilt schema — three consecutive leads all landed
-- on the same member with team_round_robin left at 0 rows.
--
-- Fix: pass jsonb, which is what the parameter has always expected. Body is
-- otherwise unchanged from 20260525000010_lead_routing.sql.

CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_rule RECORD;
  v_price NUMERIC;
  v_members UUID[];
  v_idx INTEGER;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find the team owned by the lead's owner (the team the lead belongs to).
  SELECT id INTO v_team_id FROM public.teams WHERE owner_id = NEW.user_id LIMIT 1;
  IF v_team_id IS NULL THEN
    RETURN NEW; -- solo agent, no routing
  END IF;

  v_price := NULLIF(regexp_replace(COALESCE(NEW.price_range, ''), '[^0-9.]', '', 'g'), '')::NUMERIC;

  -- Evaluate active rules in priority order; first match wins.
  FOR v_rule IN
    SELECT * FROM public.lead_routing_rules
    WHERE team_id = v_team_id AND is_active = true
    ORDER BY priority ASC, created_at ASC
  LOOP
    IF (v_rule.criteria->>'lead_type' IS NULL OR v_rule.criteria->>'lead_type' = NEW.lead_type)
       AND (v_rule.criteria->>'source' IS NULL OR v_rule.criteria->>'source' = NEW.source)
       AND (v_rule.criteria->>'zip' IS NULL OR v_rule.criteria->>'zip' = NEW.property_address)
       AND (v_rule.criteria->>'price_min' IS NULL OR (v_price IS NOT NULL AND v_price >= (v_rule.criteria->>'price_min')::NUMERIC))
       AND (v_rule.criteria->>'price_max' IS NULL OR (v_price IS NOT NULL AND v_price <= (v_rule.criteria->>'price_max')::NUMERIC))
    THEN
      IF v_rule.assigned_to IS NOT NULL THEN
        NEW.assigned_to := v_rule.assigned_to;
        -- p_details is jsonb: do NOT cast to text (see header).
        PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
          NULL, NULL, jsonb_build_object('rule_id', v_rule.id, 'rule_name', v_rule.name), 'low', NULL);
        RETURN NEW;
      END IF;
    END IF;
  END LOOP;

  -- Fallback: round-robin among accepted members.
  SELECT array_agg(user_id ORDER BY invited_at) INTO v_members
  FROM public.team_members
  WHERE team_id = v_team_id AND accepted_at IS NOT NULL AND user_id IS NOT NULL;

  IF v_members IS NOT NULL AND array_length(v_members, 1) > 0 THEN
    INSERT INTO public.team_round_robin (team_id, last_index)
    VALUES (v_team_id, 0)
    ON CONFLICT (team_id) DO UPDATE
      SET last_index = (public.team_round_robin.last_index + 1) % array_length(v_members, 1)
    RETURNING last_index INTO v_idx;

    NEW.assigned_to := v_members[v_idx + 1]; -- arrays are 1-indexed
    PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
      NULL, NULL, jsonb_build_object('method', 'round_robin'), 'low', NULL);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_assign_lead failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_assign_lead IS
  'Assigns an incoming lead by routing rule, falling back to round-robin across '
  'accepted team members. Passes jsonb (not text) to log_audit_event — see '
  'migration 20260730000005.';
