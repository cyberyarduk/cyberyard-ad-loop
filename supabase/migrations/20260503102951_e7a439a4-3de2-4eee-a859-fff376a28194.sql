ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_url text;

CREATE INDEX IF NOT EXISTS idx_videos_expires_at ON public.videos(expires_at) WHERE expires_at IS NOT NULL;