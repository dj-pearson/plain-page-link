-- US-378: one round trip for many agents' contact details.
--
-- _shared/agent-contact.ts getAgentContact makes two calls per agent: a
-- profiles select plus auth.admin.getUserById (the account address lives in
-- auth.users, never in profiles). The morning digest and the overdue-lead
-- chaser each called it once per agent per run, so a run that emails N agents
-- spent 2N sequential HTTP round trips on addresses alone, inside one hourly
-- edge-function invocation that also runs deletions and cleanups.
--
-- This returns the same fields for an array of ids in one query. It reads
-- auth.users, so it must never be reachable from the browser (anyone holding
-- the anon key could otherwise read every agent's sign-in address).
-- Service role only.

CREATE OR REPLACE FUNCTION public.get_agent_contacts(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  notification_preferences jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- The callers page by 200; the cap only stops an accidental whole-table ask.
  IF coalesce(cardinality(p_user_ids), 0) > 1000 THEN
    RAISE EXCEPTION 'get_agent_contacts: at most 1000 ids per call'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  RETURN QUERY
    SELECT p.id,
           u.email::text,
           p.full_name,
           p.notification_preferences
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
     WHERE p.id = ANY (p_user_ids);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_agent_contacts(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_contacts(uuid[]) TO service_role;

COMMENT ON FUNCTION public.get_agent_contacts(uuid[]) IS
  'Service role only. (id, auth.users email, full_name, notification_preferences) for up to 1000 profile ids; ids with no profile are absent. Used by the digest and overdue chaser (US-378) instead of getAgentContact per agent.';
