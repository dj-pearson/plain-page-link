-- Create the listings storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true);

-- Allow public read access to all files in the listings bucket
CREATE POLICY "Public read access for listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

-- Allow authenticated users to upload listing images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listings' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own listing images
CREATE POLICY "Users can update listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listings'
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own listing images
CREATE POLICY "Users can delete listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listings'
  AND auth.uid() IS NOT NULL
);