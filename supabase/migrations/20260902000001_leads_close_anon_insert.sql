-- US-097: close the anonymous INSERT path into `leads`, and make lead_count
-- able to fall.
--
-- "Anyone can submit leads" was FOR INSERT WITH CHECK (true) with no TO clause,
-- so it granted PUBLIC — which on a Supabase project means anyone holding the
-- anon key, and the anon key ships in the frontend bundle. It was whitelisted
-- in verify-schema.mjs's PUBLIC_BY_DESIGN as "public lead-capture forms on
-- every profile", but no public form has used it since US-069: leadSubmission.ts
-- and ContactBlock.tsx both call the submit-lead edge function, which runs with
-- the service role and therefore bypasses RLS entirely. The policy protected a
-- caller that no longer exists.
--
-- Reproduced against this schema before the fix. As `anon`:
--
--   INSERT INTO public.leads (user_id, name, lead_type)
--   VALUES ('<any agent id>', 'Spam Bot', 'buyer');
--   -- INSERT 0 1
--
-- One statement, aimed at any agent whose id appears on their public profile,
-- produced: a lead row with encrypted_email NULL (no contact details at all,
-- since the encryption lives in the edge function), profiles.lead_count 0 -> 1,
-- one notifications row, one lead_activities row and three audit_logs rows.
-- Nine triggers fire per insert. At PostgREST speed that is a way to fill any
-- agent's CRM, and their notification feed, with contact-less noise — while
-- skipping the validation, sanitisation and rate limiting submit-lead applies.
--
-- What still works after this migration:
--   - submit-lead inserts with the service role, which is exempt from RLS.
--   - "Users can insert their own leads" (WITH CHECK auth.uid() = user_id) still
--     covers an agent adding a lead by hand from the dashboard.
-- What no longer works: an insert from `anon`, and an insert by a signed-in
-- user into somebody else's CRM — that second one was reachable through the
-- same policy and is not restored by anything here.

DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;

-- ---------------------------------------------------------------------------
-- profiles.lead_count only ever rose.
--
-- on_lead_increment_profile_count is an AFTER INSERT trigger with no DELETE
-- counterpart, so deleting a lead — including the spam this policy allowed —
-- left the count permanently overstated. The column is denormalised and, as of
-- this migration, read by nothing in src/ or supabase/functions/; rather than
-- drop a column the dashboard may yet want, give it the missing half so the
-- value is true whenever something does read it.
--
-- search_path is pinned to public, extensions, pg_temp as verify:schema
-- requires of every SECURITY DEFINER function; pg_temp is named last so it is
-- searched last rather than shadowing a real table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_profile_leads(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET lead_count = GREATEST(COALESCE(lead_count, 0) - 1, 0)
  WHERE id = _profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_lead_count_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  PERFORM public.decrement_profile_leads(OLD.user_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_decrement_profile_count ON public.leads;
CREATE TRIGGER on_lead_decrement_profile_count
  AFTER DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_lead_count_on_delete();

-- Re-derive the column once, so counts inflated by deletions that happened
-- while no DELETE trigger existed start correct rather than merely stopping
-- from getting worse.
UPDATE public.profiles p
SET lead_count = COALESCE(c.n, 0)
FROM (
  SELECT id, (SELECT count(*) FROM public.leads l WHERE l.user_id = p2.id) AS n
  FROM public.profiles p2
) c(id, n)
WHERE p.id = c.id AND COALESCE(p.lead_count, 0) IS DISTINCT FROM COALESCE(c.n, 0);
