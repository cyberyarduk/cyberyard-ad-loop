-- Fix storage RLS policies for videos bucket to allow authenticated users to upload offer images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos bucket files" ON storage.objects;

-- Allow authenticated users to upload to videos bucket
CREATE POLICY "Authenticated users can upload to videos bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to delete their own files (owner is uuid type)
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND owner = auth.uid());

-- Allow public to view files in videos bucket
CREATE POLICY "Public can view videos bucket files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');