
ALTER TABLE public.research_leads ALTER COLUMN created_by_user_id DROP NOT NULL;
ALTER TABLE public.research_responses ALTER COLUMN submitted_by_user_id DROP NOT NULL;
ALTER TABLE public.research_leads ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'in_person';
