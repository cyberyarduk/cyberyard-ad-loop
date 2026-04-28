-- 1. Add 'salesperson' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'salesperson';

-- 2. Salespeople table
CREATE TABLE public.salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  monthly_target INTEGER NOT NULL DEFAULT 100,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_salespeople_updated_at
  BEFORE UPDATE ON public.salespeople
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Security definer helpers
CREATE OR REPLACE FUNCTION public.is_salesperson(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE user_id = _user_id AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_salesperson_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.salespeople WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4. Salespeople RLS
CREATE POLICY "Super admins manage all salespeople"
  ON public.salespeople FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Salespeople can view own record"
  ON public.salespeople FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Add subscription + sales attribution to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS screen_count INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_price_pence INTEGER,
  ADD COLUMN IF NOT EXISTS billing_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'monthly_rolling',
  ADD COLUMN IF NOT EXISTS signed_up_by_salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_signed_up_by ON public.companies(signed_up_by_salesperson_id);

-- 6. Allow salespeople to create + view companies
CREATE POLICY "Salespeople can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_salesperson(auth.uid()));

CREATE POLICY "Salespeople can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_salesperson(auth.uid()));

CREATE POLICY "Salespeople can update their own clients"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (signed_up_by_salesperson_id = public.current_salesperson_id());

-- Salespeople need to insert profiles when creating a company admin (via edge fn uses service role, but allow direct create too)
CREATE POLICY "Salespeople can create company profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_salesperson(auth.uid()) AND role = 'company_admin');

-- 7. Direct debit mandates table (mock GoCardless)
CREATE TABLE public.direct_debit_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  sort_code TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'mocked',
  gocardless_mandate_id TEXT,
  gocardless_customer_id TEXT,
  is_mock BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_debit_mandates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_dd_mandates_updated_at
  BEFORE UPDATE ON public.direct_debit_mandates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dd_mandates_company ON public.direct_debit_mandates(company_id);

CREATE POLICY "Super admins manage all DD mandates"
  ON public.direct_debit_mandates FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Salespeople create DD mandates"
  ON public.direct_debit_mandates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_salesperson(auth.uid()));

CREATE POLICY "Salespeople view DD mandates for their clients"
  ON public.direct_debit_mandates FOR SELECT
  TO authenticated
  USING (
    public.is_salesperson(auth.uid())
    AND company_id IN (
      SELECT id FROM public.companies WHERE signed_up_by_salesperson_id = public.current_salesperson_id()
    )
  );

CREATE POLICY "Company admins view their own DD mandate"
  ON public.direct_debit_mandates FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );