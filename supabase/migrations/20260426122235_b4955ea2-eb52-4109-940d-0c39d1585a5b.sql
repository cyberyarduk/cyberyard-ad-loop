
-- Table to track credits per company
CREATE TABLE public.company_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  monthly_credits INTEGER NOT NULL DEFAULT 50,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction history
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'monthly_reset', 'purchase', 'admin_adjustment')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_company ON public.credit_transactions(company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.company_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for company_credits
CREATE POLICY "Company users can view their company credits"
  ON public.company_credits FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can view all credits"
  ON public.company_credits FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all credits"
  ON public.company_credits FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- RLS for credit_transactions
CREATE POLICY "Company users can view their transactions"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage transactions"
  ON public.credit_transactions FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_credits_updated_at
  BEFORE UPDATE ON public.company_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create credit row when a company is created
CREATE OR REPLACE FUNCTION public.create_company_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_credits (company_id, monthly_credits, purchased_credits)
  VALUES (NEW.id, 50, 0)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created_add_credits
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_credits();

-- Backfill existing companies
INSERT INTO public.company_credits (company_id, monthly_credits, purchased_credits)
SELECT id, 50, 0 FROM public.companies
ON CONFLICT (company_id) DO NOTHING;

-- Function to deduct credits atomically (handles monthly reset + deduction)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  _company_id UUID,
  _amount INTEGER,
  _user_id UUID,
  _description TEXT DEFAULT 'Video generation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _credits RECORD;
  _total_available INTEGER;
  _from_monthly INTEGER;
  _from_purchased INTEGER;
BEGIN
  -- Lock and fetch
  SELECT * INTO _credits FROM public.company_credits
    WHERE company_id = _company_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create if missing
    INSERT INTO public.company_credits (company_id, monthly_credits, purchased_credits)
      VALUES (_company_id, 50, 0)
      RETURNING * INTO _credits;
  END IF;

  -- Reset monthly credits if past reset date
  IF now() >= _credits.monthly_reset_at THEN
    UPDATE public.company_credits
      SET monthly_credits = 50,
          monthly_reset_at = date_trunc('month', now()) + interval '1 month'
      WHERE company_id = _company_id
      RETURNING * INTO _credits;

    INSERT INTO public.credit_transactions (company_id, amount, transaction_type, description)
      VALUES (_company_id, 50, 'monthly_reset', 'Monthly credit reset');
  END IF;

  _total_available := _credits.monthly_credits + _credits.purchased_credits;

  IF _total_available < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'available', _total_available);
  END IF;

  -- Deduct from monthly first, then purchased
  IF _credits.monthly_credits >= _amount THEN
    _from_monthly := _amount;
    _from_purchased := 0;
  ELSE
    _from_monthly := _credits.monthly_credits;
    _from_purchased := _amount - _from_monthly;
  END IF;

  UPDATE public.company_credits
    SET monthly_credits = monthly_credits - _from_monthly,
        purchased_credits = purchased_credits - _from_purchased
    WHERE company_id = _company_id;

  INSERT INTO public.credit_transactions (company_id, user_id, amount, transaction_type, description)
    VALUES (_company_id, _user_id, -_amount, 'deduction', _description);

  RETURN jsonb_build_object(
    'success', true,
    'remaining', _total_available - _amount
  );
END;
$$;
