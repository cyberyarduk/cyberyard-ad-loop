-- Tighten new SECURITY DEFINER functions
ALTER FUNCTION public.is_salesperson(uuid) SET search_path = public;
ALTER FUNCTION public.current_salesperson_id() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_salesperson(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_salesperson_id() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_salesperson(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_salesperson_id() TO authenticated;