-- US-592: visitors can no longer list the media buckets.
--
-- 20260808000005 gave anon and authenticated SELECT on every object in the
-- three public media buckets:
--
--   CREATE POLICY "Public read of public media buckets" ON storage.objects
--     FOR SELECT TO anon, authenticated
--     USING (bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos'));
--
-- The policy was meant to let profile pages show images. They never needed
-- it. A public bucket serves /storage/v1/object/public/<bucket>/<path> (and
-- the render and HEAD routes) without consulting storage.objects RLS; the
-- bucket's `public` flag is the only gate. What a SELECT policy adds is the
-- list API, which reads storage.objects as the caller. With the anon key from
-- the bundle, anyone could call:
--
--   storage.from('listing-photos').list('')        -> every uploader's user id
--   storage.from('listing-photos').list('<uid>')   -> one folder per listing,
--                                                     drafts included
--   storage.from('listing-photos').list('<uid>/<listing id>')
--                                                  -> every photo's name
--
-- That enumerates the platform's agents and hands over the photos of
-- unpublished pages and unlisted drafts, which US-308 made private everywhere
-- else (an unpublished agent's listings, links and reviews are hidden from
-- visitors). Object names carry a random segment precisely so they cannot be
-- guessed; listing made that moot.
--
-- The browser lists only its own folder (useProfileImageUpload's cleanup of
-- the previous avatar, `list(user.id)`), and upload with upsert reads the
-- caller's own row. So SELECT becomes owner-scoped, on the same first-path-
-- segment rule the write policies already use. Public URLs keep working for
-- everyone, signed in or not. The service role (optimize-image, gdpr export)
-- bypasses RLS and is unaffected. gdpr-exports keeps no policy at all.

DROP POLICY IF EXISTS "Public read of public media buckets" ON storage.objects;

DROP POLICY IF EXISTS "Users read their own media" ON storage.objects;
CREATE POLICY "Users read their own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
