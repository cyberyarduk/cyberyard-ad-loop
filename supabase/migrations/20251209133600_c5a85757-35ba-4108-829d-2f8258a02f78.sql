-- Add columns to store AI generation parameters for regeneration
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_style TEXT,
ADD COLUMN IF NOT EXISTS ai_duration TEXT,
ADD COLUMN IF NOT EXISTS ai_image_url TEXT;