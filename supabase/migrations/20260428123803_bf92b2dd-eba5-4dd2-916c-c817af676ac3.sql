-- Add image support to playlist media
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_url_landscape text;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_media_type_check
  CHECK (media_type IN ('video', 'image'));

-- Allow image-only rows to omit video_url
ALTER TABLE public.videos
  ALTER COLUMN video_url DROP NOT NULL;

-- Public images bucket for playlist images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);