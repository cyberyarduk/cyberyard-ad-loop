
-- 1. Add flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true;

-- 2. Update handle_new_user trigger to honor metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, must_change_password)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'company_user'),
    COALESCE((new.raw_user_meta_data->>'must_change_password')::boolean, true)
  );
  RETURN new;
END;
$function$;

-- 3. Wipe everything user-related
DELETE FROM public.profiles;
DELETE FROM public.salespeople;
DELETE FROM auth.users;

-- 4. Create the two super admins
DO $$
DECLARE
  v_id uuid;
  v_emails text[] := ARRAY['debbie@cyberyard.co.uk', 'jason@cyberyard.co.uk'];
  v_names text[]  := ARRAY['Debbie', 'Jason'];
  i int;
BEGIN
  FOR i IN 1..array_length(v_emails, 1) LOOP
    v_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id, 'authenticated', 'authenticated', v_emails[i],
      crypt('password123', gen_salt('bf')), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('full_name', v_names[i], 'role', 'super_admin', 'must_change_password', true),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_emails[i], 'email_verified', true),
      'email', now(), now(), now()
    );
  END LOOP;
END $$;
