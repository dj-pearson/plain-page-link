-- =============================================================================
-- Teams / organizations for multi-seat billing (US-045)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT,
  stripe_subscription_id TEXT,
  max_seats INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,                      -- invited email (before the user exists/accepts)
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members (lower(email));

-- Recursion-safe membership/role checks (SECURITY DEFINER bypasses RLS).
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND accepted_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t WHERE t.id = p_team_id AND t.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members m
    WHERE m.team_id = p_team_id AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin') AND m.accepted_at IS NOT NULL
  );
$$;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams: members can read; only the owner can modify (creation via edge function).
DROP POLICY IF EXISTS "Team members read team" ON public.teams;
CREATE POLICY "Team members read team"
  ON public.teams FOR SELECT
  USING (owner_id = auth.uid() OR is_team_member(id, auth.uid()));

DROP POLICY IF EXISTS "Owner modifies team" ON public.teams;
CREATE POLICY "Owner modifies team"
  ON public.teams FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Team members: members can read the roster; owners/admins (or service role)
-- manage it. Users can see their own membership row (e.g. pending invites).
DROP POLICY IF EXISTS "Members read roster" ON public.team_members;
CREATE POLICY "Members read roster"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid() OR is_team_member(team_id, auth.uid()) OR is_team_admin(team_id, auth.uid()));

DROP POLICY IF EXISTS "Admins manage roster" ON public.team_members;
CREATE POLICY "Admins manage roster"
  ON public.team_members FOR ALL
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));
