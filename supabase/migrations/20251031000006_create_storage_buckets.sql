-- Create storage buckets for images
-- Note: The 'avatars' bucket already exists, so we'll create the others

-- Create listing-photos bucket
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'listing-photos',
    'listing-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create brokerage-logos bucket
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'brokerage-logos',
    'brokerage-logos',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS policies for listing-photos bucket
CREATE POLICY "Listing photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

CREATE POLICY "Users can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own listing photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own listing photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for brokerage-logos bucket
CREATE POLICY "Brokerage logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brokerage-logos');

CREATE POLICY "Users can upload brokerage logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update brokerage logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete brokerage logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

-- Comments
COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Maximum file size in bytes';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS 'Array of allowed MIME types for uploads';

