-- Add screen dimension fields to devices table
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS screen_width integer,
ADD COLUMN IF NOT EXISTS screen_height integer,
ADD COLUMN IF NOT EXISTS aspect_ratio text;

-- Add landscape video URL to videos table for dual-format support
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS video_url_landscape text;