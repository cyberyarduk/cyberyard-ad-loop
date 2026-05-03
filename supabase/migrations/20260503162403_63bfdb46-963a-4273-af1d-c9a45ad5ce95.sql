CREATE POLICY "Company admins can update their own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('company_admin','super_admin')))
WITH CHECK (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('company_admin','super_admin')));