
-- Tenant-scope salesperson inserts
DROP POLICY IF EXISTS "Salespeople can create companies" ON public.companies;
CREATE POLICY "Salespeople can create companies"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (
  public.is_salesperson(auth.uid())
  AND signed_up_by_salesperson_id = public.current_salesperson_id()
);

DROP POLICY IF EXISTS "Salespeople create DD mandates" ON public.direct_debit_mandates;
CREATE POLICY "Salespeople create DD mandates"
ON public.direct_debit_mandates FOR INSERT TO authenticated
WITH CHECK (
  public.is_salesperson(auth.uid())
  AND company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.signed_up_by_salesperson_id = public.current_salesperson_id()
  )
);

-- Restrict SECURITY DEFINER role-lookup functions to the caller's own identity
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles
  WHERE id = user_id AND user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'
      AND (user_id = auth.uid() OR auth.uid() IS NULL)
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_salesperson(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE user_id = _user_id AND active = true
      AND (_user_id = auth.uid() OR auth.uid() IS NULL)
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_salesperson(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_salesperson_id() FROM anon;
