-- =============================================================================
-- Lead auto-assignment and routing rules for teams (US-055)
-- =============================================================================
-- Adds routing rules + leads.assigned_to, and a trigger that, on lead insert,
-- evaluates active rules (by priority) for the owner's team and assigns the
-- lead — falling back to round-robin among accepted team members.
-- =============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads (assigned_to);

CREATE TABLE IF NOT EXISTS public.lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {lead_type, source, zip, price_min, price_max}
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,        -- lower = evaluated first
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_team_priority
  ON public.lead_routing_rules (team_id, priority) WHERE is_active = true;

ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team reads routing rules" ON public.lead_routing_rules;
CREATE POLICY "Team reads routing rules"
  ON public.lead_routing_rules FOR SELECT
  USING (is_team_member(team_id, auth.uid()) OR is_team_admin(team_id, auth.uid()));

DROP POLICY IF EXISTS "Admins manage routing rules" ON public.lead_routing_rules;
CREATE POLICY "Admins manage routing rules"
  ON public.lead_routing_rules FOR ALL
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));

-- Round-robin cursor per team (which member got the last fallback assignment).
CREATE TABLE IF NOT EXISTS public.team_round_robin (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  last_index INTEGER NOT NULL DEFAULT -1
);

-- Auto-assign on lead insert.
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
        PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
          NULL, NULL, jsonb_build_object('rule_id', v_rule.id, 'rule_name', v_rule.name)::text, 'low', NULL);
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
      NULL, NULL, jsonb_build_object('method', 'round_robin')::text, 'low', NULL);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_assign_lead failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_lead ON public.leads;
CREATE TRIGGER trg_auto_assign_lead
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_lead();
