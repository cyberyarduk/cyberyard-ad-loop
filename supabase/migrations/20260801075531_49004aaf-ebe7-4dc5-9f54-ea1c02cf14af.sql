-- 1. Fix mutable search_path on remaining functions
ALTER FUNCTION public.auto_generate_device_credentials() SET search_path = public;
ALTER FUNCTION public.generate_device_code() SET search_path = public;
ALTER FUNCTION public.generate_secure_token() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- 2. Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions
--    that are not required for RLS policy evaluation or client use.
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hash_pin(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_pin(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_company_credits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hash_device_admin_pin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_generate_device_credentials() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_device_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_secure_token() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;

-- Role-check helpers stay executable for RLS evaluation by signed-in users only
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_salesperson(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_salesperson_id() FROM anon;

-- 3. Public buckets: remove broad SELECT policies that permit listing.
--    Public buckets still serve individual objects via their public URLs.
DROP POLICY IF EXISTS "Videos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can view videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public read email assets" ON storage.objects;

-- 4. contact_messages: replace WITH CHECK (true) with validated insert
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a valid contact message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 100
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(message)) BETWEEN 1 AND 5000
  AND (company IS NULL OR length(company) <= 200)
  AND (phone IS NULL OR length(phone) <= 50)
  AND (source IS NULL OR length(source) <= 100)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND status = 'new'
);

-- 5. Devices: drop unused header-token RLS policies (device traffic goes
--    through service-role edge functions instead).
DROP POLICY IF EXISTS "Devices can access their own data via auth_token" ON public.devices;
DROP POLICY IF EXISTS "Devices can update their own last_seen via auth_token" ON public.devices;