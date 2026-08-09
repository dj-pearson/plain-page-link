-- US-088: the keywords write policies error for everyone, including admins.
--
-- All three were written as:
--
--   EXISTS (SELECT 1 FROM auth.users
--           WHERE users.id = auth.uid()
--             AND users.raw_user_meta_data->>'role' = 'admin')
--
-- Two things are wrong with that.
--
-- First, it does not work. An RLS policy is evaluated with the privileges of
-- the calling role, and `authenticated` has no grant on auth.users, so the
-- subquery raises `permission denied for table users` and the statement aborts.
-- Keyword management has therefore been broken for admins too, not just closed
-- to non-admins.
--
-- Second, if that grant ever appeared the policy would be an escalation:
-- raw_user_meta_data is writable by the user it belongs to, via
-- supabase.auth.updateUser({ data: { role: 'admin' } }). A user could simply
-- declare themselves an admin.
--
-- has_role() is the pattern the other ~270 policies use: a SECURITY DEFINER
-- function over public.user_roles, which no user can write to (US-063).

DROP POLICY IF EXISTS "Only admins can insert keywords" ON public.keywords;
DROP POLICY IF EXISTS "Only admins can update keywords" ON public.keywords;
DROP POLICY IF EXISTS "Only admins can delete keywords" ON public.keywords;

CREATE POLICY "Only admins can insert keywords"
  ON public.keywords FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update keywords"
  ON public.keywords FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete keywords"
  ON public.keywords FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
