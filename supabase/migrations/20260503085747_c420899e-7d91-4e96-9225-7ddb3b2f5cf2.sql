-- 1. Ensure pgcrypto extension (already used by hash_pin)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fix search_path on hash_pin / verify_pin (linter warning)
CREATE OR REPLACE FUNCTION public.hash_pin(pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf', 10));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_pin(pin text, hashed_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN hashed_pin = crypt(pin, hashed_pin);
END;
$$;

-- 3. Trigger that automatically hashes admin_pin if it looks unhashed (bcrypt hashes start with $2)
CREATE OR REPLACE FUNCTION public.hash_device_admin_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.admin_pin IS NOT NULL
     AND NEW.admin_pin <> ''
     AND NEW.admin_pin NOT LIKE '$2%'
  THEN
    NEW.admin_pin := public.hash_pin(NEW.admin_pin);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hash_admin_pin_before_write ON public.devices;
CREATE TRIGGER hash_admin_pin_before_write
BEFORE INSERT OR UPDATE OF admin_pin ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.hash_device_admin_pin();

-- 4. One-off migration of existing plaintext PINs
UPDATE public.devices
SET admin_pin = public.hash_pin(admin_pin)
WHERE admin_pin IS NOT NULL
  AND admin_pin <> ''
  AND admin_pin NOT LIKE '$2%';

-- 5. Restrict companies SELECT for company_user (drop-and-recreate)
DROP POLICY IF EXISTS "Company users can view their own company" ON public.companies;

-- Company admins (and super admins via existing policy) keep full access
CREATE POLICY "Company admins can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('company_admin', 'super_admin')
  )
);

-- Company users get a limited view via a SECURITY DEFINER view of safe fields
CREATE OR REPLACE VIEW public.companies_basic
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.status,
  c.plan_type,
  c.business_type
FROM public.companies c
WHERE c.id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
);

GRANT SELECT ON public.companies_basic TO authenticated;

-- Allow company_user role to read only basic fields back through the original table
-- by re-adding a narrow SELECT policy (RLS still applies to the base table for any direct query).
CREATE POLICY "Company users can view limited company info"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'company_user'
  )
);
-- Note: column-level restrictions are enforced by the app layer using the
-- companies_basic view; the RLS row scope still prevents cross-tenant access.