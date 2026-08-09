-- US-075: put the storage buckets and their policies under migration control.
--
-- The applied schema contains zero storage.buckets rows and zero
-- storage.objects policies. Bucket creation survives only in
-- supabase/migrations/archive/20251031000006_create_storage_buckets.sql, which
-- is deliberately never applied — the same US-060 squash casualty as the signup
-- trigger (US-068). Every access rule for uploaded avatars, listing photos and
-- brokerage logos has therefore been configured out of band: unversioned,
-- unreviewable, and invisible to verify:schema.
--
-- It also left three names in use for the same thing:
--   useListingImageUpload.ts   -> 'listings'
--   OnboardingWizardPage.tsx   -> 'listing-images'
--   the archived migration     -> 'listing-photos'
-- At most one of those exists, so at least one upload path was writing to a
-- bucket that is not there. This migration standardises on 'listing-photos'
-- (the archived name, and so the one production most likely holds) and the two
-- call sites are repointed in the same commit.
--
-- The archived policies are NOT carried over as written. They scoped writes with
-- `auth.role() = 'authenticated'`, which lets any signed-in user update or
-- delete any other user's photos — an IDOR across every tenant. The policies
-- below key on the object's first path segment being the owner's uid, which is
-- the layout the upload paths use.

-- Real Supabase ships storage.objects with RLS already on; this is a no-op
-- there and required on a from-scratch rebuild.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- 5 MB, matching MAX_FILE_SIZE in src/hooks/useAvatarUpload.ts.
  ('avatars', 'avatars', true, 5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('listing-photos', 'listing-photos', true, 10485760,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']),
  -- SVG is deliberately excluded: these buckets are public, and an SVG served
  -- from the platform's own storage origin is a script-execution surface. See
  -- US-076. The archived brokerage-logos definition allowed image/svg+xml.
  ('brokerage-logos', 'brokerage-logos', true, 2097152,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public             = EXCLUDED.public;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
-- Public read: these buckets back public profile pages, so the objects are
-- meant to be fetchable without a session.
DROP POLICY IF EXISTS "Public read of public media buckets" ON storage.objects;
CREATE POLICY "Public read of public media buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos'));

-- Writes are owner-scoped. `(storage.foldername(name))[1]` is the first path
-- segment, which every upload path sets to the uploader's user id — that is why
-- OnboardingWizardPage's `avatars/<uid>-<ts>.ext` layout had to change: its
-- first segment was the literal string 'avatars', so an owner-scoped policy
-- would have rejected it.
DROP POLICY IF EXISTS "Users write their own media" ON storage.objects;
CREATE POLICY "Users write their own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update their own media" ON storage.objects;
CREATE POLICY "Users update their own media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete their own media" ON storage.objects;
CREATE POLICY "Users delete their own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'listing-photos', 'brokerage-logos')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
