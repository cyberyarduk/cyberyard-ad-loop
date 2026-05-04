
-- 1) Tighten direct_debit_mandates SELECT to company_admin/super_admin only
DROP POLICY IF EXISTS "Company admins view their own DD mandate" ON public.direct_debit_mandates;

CREATE POLICY "Company admins view their own DD mandate"
ON public.direct_debit_mandates
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('company_admin'::user_role, 'super_admin'::user_role)
  )
);

-- 2) Drop overly-permissive videos bucket upload policy if it exists
DROP POLICY IF EXISTS "Authenticated users can upload to videos bucket" ON storage.objects;
