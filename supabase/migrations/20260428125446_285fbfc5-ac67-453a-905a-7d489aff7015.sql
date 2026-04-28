ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_source_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_source_check
  CHECK (source = ANY (ARRAY['manual'::text, 'ai_generated'::text, 'image_upload'::text]));