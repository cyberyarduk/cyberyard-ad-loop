ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS display_duration integer;

COMMENT ON COLUMN public.videos.display_duration IS 'Optional override (in seconds) for how long this video should remain on screen during playlist playback. Useful for static images such as menus.';
