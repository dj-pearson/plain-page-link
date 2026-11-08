-- US-454 (US-440): a lead routing rule keeps sending leads to a teammate who
-- left or was removed.
--
-- lead_routing_rules.assigned_to names a user, not a team_members row, and
-- neither the teams function's 'remove' nor its 'leave' touched the rules. So
-- after a member was removed, auto_assign_lead still matched their rule and
-- set leads.assigned_to to them, and the assignee policies on leads
-- (20260902000006: `auth.uid() = assigned_to`) let them read and update every
-- new lead it routed: the person the team removed kept receiving its leads.
--
-- Three parts:
--   1. A team_members AFTER DELETE trigger pauses (is_active = false) the
--      departed user's rules in that team. assigned_to is kept so the routing
--      screen can say whose rule it was and that they have left; the rule
--      matches nothing until an admin deletes or reassigns it. This covers
--      'remove', 'leave' and the account-deletion cascade alike.
--   2. auto_assign_lead honours a rule's assignee only while they are the
--      team owner or an accepted member, so a rule that is switched back on,
--      or was written by hand, still cannot route to an outsider. The lead
--      falls through to later rules and then round robin, as for a rule with
--      no assignee.
--   3. Rules that already point at someone no longer on the team are paused.

-- ---------------------------------------------------------------------------
-- 1. Pause a departed member's rules.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pause_routing_rules_for_departed_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  UPDATE public.lead_routing_rules r
     SET is_active = false
   WHERE r.team_id = OLD.team_id
     AND r.assigned_to = OLD.user_id
     AND r.is_active
     -- The owner is never removed, but if their row goes some other way they
     -- still own the team and the leads; their rules stay as they are.
     AND NOT EXISTS (
       SELECT 1 FROM public.teams t WHERE t.id = OLD.team_id AND t.owner_id = OLD.user_id
     );
  RETURN OLD;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.pause_routing_rules_for_departed_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pause_routing_rules_for_departed_member() TO service_role;

DROP TRIGGER IF EXISTS pause_routing_rules_on_member_delete ON public.team_members;
CREATE TRIGGER pause_routing_rules_on_member_delete
  AFTER DELETE ON public.team_members
  FOR EACH ROW
  -- A pending invite has no user yet, so it can have no rule.
  WHEN (OLD.user_id IS NOT NULL)
  EXECUTE FUNCTION public.pause_routing_rules_for_departed_member();

-- ---------------------------------------------------------------------------
-- 2. auto_assign_lead: only route to someone still on the team.
-- ---------------------------------------------------------------------------
-- Identical to 20260902000006 except for the membership condition on the
-- rule's assignee.
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_team_id UUID;
  v_owner_id UUID;
  v_rule RECORD;
  v_price NUMERIC;
  v_members UUID[];
  v_idx INTEGER;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, owner_id INTO v_team_id, v_owner_id
  FROM public.teams WHERE owner_id = NEW.user_id LIMIT 1;
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
      -- US-454: the assignee must still be on the team. Assigning a lead
      -- grants read and update on it, so a stale rule would hand the team's
      -- leads to someone it removed.
      IF v_rule.assigned_to IS NOT NULL
         AND (
           v_rule.assigned_to = v_owner_id
           OR EXISTS (
             SELECT 1 FROM public.team_members m
             WHERE m.team_id = v_team_id
               AND m.user_id = v_rule.assigned_to
               AND m.accepted_at IS NOT NULL
           )
         )
      THEN
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
-- 3. Pause rules that already name someone who has left.
-- ---------------------------------------------------------------------------
UPDATE public.lead_routing_rules r
   SET is_active = false
 WHERE r.is_active
   AND r.assigned_to IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.teams t WHERE t.id = r.team_id AND t.owner_id = r.assigned_to
   )
   AND NOT EXISTS (
     SELECT 1 FROM public.team_members m
     WHERE m.team_id = r.team_id
       AND m.user_id = r.assigned_to
       AND m.accepted_at IS NOT NULL
   );
