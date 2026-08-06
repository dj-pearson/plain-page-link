-- US-064: Stop anonymous visitors rewriting any user's public profile links.
--
-- The policy
--
--   CREATE POLICY "Anyone can increment link clicks"
--   ON links FOR UPDATE USING (true) WITH CHECK (true);
--
-- was written to let a visitor bump click_count. What it granted was UPDATE on
-- every column of every row, to everyone -- and `anon` holds the key that ships
-- in the frontend bundle. Reproduced against a rebuilt schema before this
-- migration:
--
--   SET ROLE anon;
--   UPDATE links SET url='https://evil.example/steal' WHERE title='My Listings';
--   -> UPDATE 1
--
-- Link-in-bio is the product's core surface, so this was a live traffic-hijack
-- and phishing vector against every published profile.
--
-- The policy is redundant as well as dangerous: public.increment_link_clicks()
-- already exists, is SECURITY DEFINER, and already pins search_path, so it
-- updates click_count with the owner's privileges and needs no policy at all.
-- The only caller the policy was actually serving was a "fallback: try direct
-- update" branch in src/hooks/useProfileTracking.ts, removed alongside this
-- migration.
--
-- Dropping it leaves `links` with:
--   ALL    "Users can manage their own links"  USING (auth.uid() = user_id)
--   SELECT "Anyone can view active links"      USING (is_active = true)
-- which is the intended access model: public read of active links, owner-only
-- writes, click counting through the SECURITY DEFINER function.

DROP POLICY IF EXISTS "Anyone can increment link clicks" ON public.links;

-- Make the intent explicit for the next reader: the function is the only
-- supported write path for click_count, and it is callable without a session.
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.increment_link_clicks(uuid) IS
  'Increments links.click_count for the given link. SECURITY DEFINER so public '
  'profile visitors can count a click without any UPDATE grant on links -- see '
  'migration 20260806000002. Do not re-add a permissive UPDATE policy to links.';
