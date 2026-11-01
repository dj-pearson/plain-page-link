-- US-259: a team owner could lift their own seat cap, and a team admin could
-- seat anyone without an invitation.
--
-- "Owner modifies team" was FOR ALL USING/WITH CHECK (owner_id = auth.uid()),
-- with no TO clause, so with Supabase's default table grants an owner could
-- PATCH /rest/v1/teams?id=eq.<id> {"max_seats": 1000} from the browser and the
-- teams function's seat check (which reads max_seats) would wave every invite
-- through. They could also INSERT any number of teams with any max_seats.
--
-- "Admins manage roster" was FOR ALL on team_members, so an owner/admin could
-- INSERT a row with user_id and accepted_at already set — a member nobody
-- invited and nobody accepted, past the seat cap — or UPDATE a pending invite
-- to accepted, or a member's role.
--
-- Nothing in the app writes either table with a user's JWT: TeamPage reads
-- them, and create / invite / accept / remove / updateRole all go through the
-- teams edge function with the service role, which bypasses RLS. So the client
-- write path is closed outright rather than narrowed column by column. The two
-- SELECT policies ("Team members read team", "Members read roster") are kept.

DROP POLICY IF EXISTS "Owner modifies team" ON public.teams;
DROP POLICY IF EXISTS "Admins manage roster" ON public.team_members;

-- Belt and braces: even if a permissive write policy is added back later,
-- browser roles hold no write privilege on these tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.teams FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.team_members FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO service_role;
