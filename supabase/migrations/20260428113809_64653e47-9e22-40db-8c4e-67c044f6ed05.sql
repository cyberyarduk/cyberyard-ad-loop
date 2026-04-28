-- 1. Business type on companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS business_type text;

-- 2. Research leads (separate from real paying clients)
CREATE TABLE IF NOT EXISTS public.research_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text,
  business_type text,
  address text,
  city text,
  email text,
  phone text,
  notes text,
  status text NOT NULL DEFAULT 'new_lead',
  is_trial_lead boolean NOT NULL DEFAULT false,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_leads_status ON public.research_leads(status);
CREATE INDEX IF NOT EXISTS idx_research_leads_created_by ON public.research_leads(created_by_user_id);

ALTER TABLE public.research_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage research leads"
  ON public.research_leads FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. Research responses (one row per survey submission, JSONB answers)
CREATE TABLE IF NOT EXISTS public.research_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.research_leads(id) ON DELETE CASCADE,
  survey_version text NOT NULL DEFAULT 'v1',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_responses_lead ON public.research_responses(lead_id);

ALTER TABLE public.research_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage research responses"
  ON public.research_responses FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 4. Updated_at trigger
CREATE TRIGGER trg_research_leads_updated
  BEFORE UPDATE ON public.research_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();