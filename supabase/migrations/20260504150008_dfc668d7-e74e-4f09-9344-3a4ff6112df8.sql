
-- 1) Prevent role escalation via profile self-update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
  AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2) Restrict company_user access to companies table - drop broad row-level policy
-- and provide a safe view exposing only non-sensitive columns
DROP POLICY IF EXISTS "Company users can view limited company info" ON public.companies;

CREATE OR REPLACE VIEW public.company_basic_info
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  slug,
  status,
  start_date,
  end_date,
  plan_type,
  business_type,
  emergency_active,
  emergency_message,
  emergency_started_at,
  offline_fallback_image_url
FROM public.companies
WHERE id IN (
  SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
);

GRANT SELECT ON public.company_basic_info TO authenticated;
