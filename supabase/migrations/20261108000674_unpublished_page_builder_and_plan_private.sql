-- US-674: two reads that US-308 missed still served an unpublished agent's page
-- to anyone holding the anon key.
--
-- 1. custom_pages — the page builder's blocks.
--
--    "Anyone can view published pages" checks only the row's own `published`
--    flag. It has no TO clause, so Postgres reads it as TO PUBLIC, and it never
--    looks at the owning profile. US-308 (20261107000308) closed exactly this
--    for listings, links and testimonials, but custom_pages was not in its
--    list. An agent who switched their page off ("Page is live", US-265) to
--    take it down while changing brokerages still had every block of their
--    page-builder page readable with
--      GET /rest/v1/custom_pages?user_id=eq.<id>&select=*
--    blocks carries the page's text, links, embedded listings and contact
--    details; seo carries its titles. The user id is not secret: it is in
--    every lead, analytics beacon and shared listing URL.
--
--    The policy now also requires the owning profile to be published, with the
--    same `is_published IS TRUE` predicate as the profile policy and the three
--    US-308 policies, and is scoped TO anon, authenticated. The owner keeps
--    every row through "Users can view their own pages", which RLS ORs with
--    this one, so the US-265 preview and the editor are unchanged.
--    get_public_profile_page is SECURITY INVOKER and reads custom_pages as the
--    caller, so it picks this up with no change.
--
-- 2. profile_shows_branding(_user_id) — SECURITY DEFINER, anon-callable.
--
--    It answered for any user id, published or not, and its answer is a direct
--    read of the agent's plan: false means they pay for removeBranding. So
--    anyone could enumerate which agents are on a paid plan, including agents
--    who never published a page. CLAUDE.md (US-308): a SECURITY DEFINER
--    function serving an agent's page applies the published check, owner
--    exempt. It now returns NULL unless the page is published or the caller is
--    its owner. The browser already treats anything but `false` as "show the
--    footer" (profileShowsBrandingQueryOptions), and an unpublished page is not
--    rendered to a visitor at all, so nothing visible changes.

-- ---------------------------------------------------------------------------
-- 1. custom_pages visitor policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.custom_pages;
CREATE POLICY "Anyone can view published pages" ON public.custom_pages
  FOR SELECT
  TO anon, authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = custom_pages.user_id
         AND p.is_published IS TRUE
    )
  );

COMMENT ON POLICY "Anyone can view published pages" ON public.custom_pages IS
  'US-674 (US-308): visitors see a published page-builder page only while the agent''s page is published. The owner reads their own pages through "Users can view their own pages".';

-- ---------------------------------------------------------------------------
-- 2. profile_shows_branding: published-or-owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_shows_branding(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
  SELECT NOT COALESCE((public.resolve_user_plan(p.id) -> 'features' ->> 'removeBranding')::boolean, false)
    FROM public.profiles p
   WHERE p.id = _user_id
     AND (p.is_published IS TRUE OR p.id = auth.uid());
$function$;

COMMENT ON FUNCTION public.profile_shows_branding(uuid) IS
  'US-674: whether the agent''s public page shows "Powered by AgentBio" (their plan lacks removeBranding). NULL unless the page is published or the caller owns it, so a visitor cannot read the plan of an agent whose page is off.';

-- CREATE OR REPLACE keeps existing grants; restated so this file stands alone.
REVOKE ALL ON FUNCTION public.profile_shows_branding(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_shows_branding(uuid) TO anon, authenticated, service_role;
