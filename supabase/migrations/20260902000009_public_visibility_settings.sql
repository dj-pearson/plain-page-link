-- US-110: the agent's visibility toggles did nothing for actual visitors.
--
-- usePublicProfile reads user_settings with the ANON client, and the only
-- SELECT policy is `auth.uid() = user_id`. So maybeSingle() returned null for
-- every real visitor and the hook fell back to all-true. An agent switched
-- "Show sold properties" off, saw it work — because they are logged in — and
-- every visitor went on seeing them. The toggle appeared to function for the
-- one person it did not apply to.
--
-- Reproduced against this schema: with show_sold_properties = false stored,
-- `SET ROLE anon; SELECT count(*) FROM user_settings WHERE user_id = …` returns
-- 0 rows.
--
-- The fix is a SECOND, additive policy rather than a change to the existing
-- one: the owner keeps full access to their row, and anon gains read access
-- ONLY for profiles that are published.
--
-- Why this is not an information leak. user_settings also holds
-- email_leads / sms_leads / weekly_report / marketing_emails, which are the
-- agent's private notification choices and none of a visitor's business. RLS
-- is row-level, not column-level, so a policy alone cannot hand over five
-- columns and withhold four. Column privileges can, so anon is granted SELECT
-- on exactly the five show_* columns and nothing else — a SELECT naming
-- email_leads as anon is refused by the grant even though the row is visible.

-- ---------------------------------------------------------------------------
-- 1. Anon may see the row, but only for a published profile.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visibility settings are readable for published profiles" ON public.user_settings;
CREATE POLICY "Visibility settings are readable for published profiles"
  ON public.user_settings FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_settings.user_id
        AND p.is_published = true
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Column privileges decide WHAT of the row anon can read.
--
--    Revoke the blanket table grant Supabase hands to anon, then grant back
--    only the five visibility flags plus user_id (needed to filter).
--    `authenticated` keeps the full grant — the owner's policy is what scopes
--    them to their own row.
-- ---------------------------------------------------------------------------
REVOKE SELECT ON public.user_settings FROM anon;
GRANT SELECT (
  user_id,
  show_listings,
  show_sold_properties,
  show_testimonials,
  show_social_proof,
  show_contact_buttons
) ON public.user_settings TO anon;
