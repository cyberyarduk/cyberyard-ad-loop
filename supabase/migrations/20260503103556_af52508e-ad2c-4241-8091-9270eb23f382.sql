ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_media_type_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_media_type_check
  CHECK (media_type = ANY (ARRAY['video'::text, 'image'::text, 'youtube'::text, 'webpage'::text]));

ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_source_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_source_check
  CHECK (source = ANY (ARRAY['manual'::text, 'ai_generated'::text, 'image_upload'::text, 'unsplash'::text, 'document_upload'::text, 'youtube'::text, 'webpage'::text]));