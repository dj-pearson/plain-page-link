-- US-105: zip routing rules never match, and the teammate a lead is routed to
-- cannot read it.
--
-- ---------------------------------------------------------------------------
-- 1. auto_assign_lead compared criteria->>'zip' to NEW.property_address.
-- ---------------------------------------------------------------------------
-- property_address is a full street address ("1234 N Canyon Rd, Provo, UT
-- 84604"), so equality against a five-digit zip is never true. Every zip rule
-- silently fell through to the round-robin fallback, which looks like routing
-- working — the lead IS assigned, just to the wrong person. Reproduced against
-- this schema: a rule routing 84604 to one teammate, with the address above,
-- assigned the lead to the OTHER teammate by round robin.
--
-- The match is now a word-boundary regex against property_address, so "84604"
-- matches the address above but not "846040" and not a house number that
-- happens to share the digits. ZIP+4 ("84604-1234") matches too, because the
-- boundary falls at the hyphen.
--
-- A dedicated zip column would be better still, and nothing populates one
-- today — the public forms collect a street address, not a postcode. Matching
-- inside the address is the honest fix for the data that exists; extracting a
-- zip at capture time belongs with the form work.

-- Some databases predate the baseline's assignee column. The trigger and RLS
-- policies below both require it, so establish that schema prerequisite here.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads (assigned_to);

CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
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

  SELECT id INTO v_team_id FROM public.teams WHERE owner_id = NEW.user_id LIMIT 1;
  IF v_team_id IS NULL THEN
    RETURN NEW; -- solo agent, no routing
  END IF;

  v_price := NULLIF(regexp_replace(COALESCE(NEW.price_range, ''), '[^0-9.]', '', 'g'), '')::NUMERIC;

  FOR v_rule IN
    SELECT * FROM public.lead_routing_rules
    WHERE team_id = v_team_id AND is_active = true
    ORDER BY priority ASC, created_at ASC
  LOOP
    IF (v_rule.criteria->>'lead_type' IS NULL OR v_rule.criteria->>'lead_type' = NEW.lead_type)
       AND (v_rule.criteria->>'source' IS NULL OR v_rule.criteria->>'source' = NEW.source)
       AND (
         v_rule.criteria->>'zip' IS NULL
         OR (
           NEW.property_address IS NOT NULL
           -- \m and \M are Postgres word boundaries. Anchoring both ends stops
           -- '8460' matching '84604' and '84604' matching '846041'.
           AND NEW.property_address ~ ('\m' || regexp_replace(v_rule.criteria->>'zip', '[^0-9]', '', 'g') || '\M')
         )
       )
       AND (v_rule.criteria->>'price_min' IS NULL OR (v_price IS NOT NULL AND v_price >= (v_rule.criteria->>'price_min')::NUMERIC))
       AND (v_rule.criteria->>'price_max' IS NULL OR (v_price IS NOT NULL AND v_price <= (v_rule.criteria->>'price_max')::NUMERIC))
    THEN
      IF v_rule.assigned_to IS NOT NULL THEN
        NEW.assigned_to := v_rule.assigned_to;
        PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
          NULL, NULL, jsonb_build_object('rule_id', v_rule.id, 'rule_name', v_rule.name), 'low', NULL);
        RETURN NEW;
      END IF;
    END IF;
  END LOOP;

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
$function$;

-- ---------------------------------------------------------------------------
-- 2. The assignee could not read the lead they were assigned.
-- ---------------------------------------------------------------------------
-- Every policy on leads and lead_activities keyed on user_id alone — the team
-- OWNER. So routing assigned a lead to a teammate who then got an empty CRM:
-- the whole routing feature was unreachable for the person it routed to.
--
-- SELECT and UPDATE gain `OR auth.uid() = assigned_to`. Not DELETE: an
-- assignee working a lead should not be able to destroy the team's record of
-- it, and the owner still can.
--
-- lead_notes is not included — US-102 migrated it into lead_activities and
-- dropped the table.

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- lead_activities' policy names differ between environments, so rebuild
  -- whichever SELECT/UPDATE policies exist rather than guessing at a name.
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.lead_activities'::regclass AND polcmd IN ('r', 'w')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.lead_activities', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Users can view activities on their leads"
  ON public.lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can update activities on their leads"
  ON public.lead_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activities.lead_id
        AND (l.user_id = auth.uid() OR l.assigned_to = auth.uid())
    )
  );
