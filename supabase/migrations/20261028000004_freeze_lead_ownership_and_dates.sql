-- US-236: leads could be backdated to unlock them, and assignees could take them.
--
-- 1. Backdating. locked_lead_ids() (20260923000003) ranks a month's leads by
--    created_at, and plan_usage() counts leads_per_month by it. created_at was
--    an ordinary column the owner could UPDATE, so
--      UPDATE leads SET created_at = now() - interval '45 days' WHERE id = <locked>
--    moved a locked lead into a month with room and unlocked it — the lead
--    allowance had an off-switch the agent held. contacts and open_houses carry
--    created_at too and are metered alongside; none of the three is the
--    agent's to rewrite.
--
-- 2. Assignee takeover. 20260902000006 let the assignee UPDATE a lead
--    (USING auth.uid() = user_id OR auth.uid() = assigned_to) with no WITH
--    CHECK, so the new row was checked against USING — which the assignee
--    satisfies — and `SET user_id = auth.uid()` moved the lead out of the
--    owner's CRM into the assignee's. `SET assigned_to = <anyone>` handed it
--    to a stranger the same way.
--
--    The policy gains a WITH CHECK, and user_id is frozen for client roles.
--    The WITH CHECK keeps the assignee in it (auth.uid() = user_id OR
--    auth.uid() = assigned_to) rather than owner-only: an owner-only check
--    would refuse the assignee's every status update, which is the point of
--    assigning a lead. With user_id frozen, the assignee cannot become the
--    owner; with the check, the assignee cannot reassign the lead away (the new
--    row would be neither theirs nor assigned to them). The owner reassigns
--    freely, as before.
--
-- 3. The anon testimonial INSERT policy (20260808000004) was the backstop for
--    a direct insert from SubmitReview.tsx. That page now calls the
--    submit-review edge function, which validates, inserts with the service
--    role and notifies the agent. The policy was left behind and let anyone —
--    anon or any signed-in user — post a pending review onto any published
--    profile past that validation and with no notification. Dropped.
--
-- Service role and SECURITY DEFINER functions (current_user is not a client
-- role) are not bound by the freeze, so backfills and admin repair still work.

-- ---------------------------------------------------------------------------
-- Frozen columns
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_frozen_columns()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_col text;
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    -- The column names are the trigger's arguments. Compared through jsonb so
    -- one function serves every table without naming NEW.<col> statically.
    FOREACH v_col IN ARRAY TG_ARGV LOOP
      IF (to_jsonb(NEW) -> v_col) IS DISTINCT FROM (to_jsonb(OLD) -> v_col) THEN
        RAISE EXCEPTION '%.% cannot be changed', TG_TABLE_NAME, v_col
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guard_frozen_columns() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.guard_frozen_columns() IS
  'US-236: refuses anon/authenticated UPDATEs that change the columns named in the trigger arguments.';

DROP TRIGGER IF EXISTS guard_frozen_columns ON public.leads;
CREATE TRIGGER guard_frozen_columns
  BEFORE UPDATE OF user_id, created_at ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.guard_frozen_columns('user_id', 'created_at');

DROP TRIGGER IF EXISTS guard_frozen_columns ON public.contacts;
CREATE TRIGGER guard_frozen_columns
  BEFORE UPDATE OF created_at ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.guard_frozen_columns('created_at');

DROP TRIGGER IF EXISTS guard_frozen_columns ON public.open_houses;
CREATE TRIGGER guard_frozen_columns
  BEFORE UPDATE OF created_at ON public.open_houses
  FOR EACH ROW EXECUTE FUNCTION public.guard_frozen_columns('created_at');

-- ---------------------------------------------------------------------------
-- Lead UPDATE policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

-- ---------------------------------------------------------------------------
-- Testimonials: submit-review is the only public path
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a review for a published profile" ON public.testimonials;
