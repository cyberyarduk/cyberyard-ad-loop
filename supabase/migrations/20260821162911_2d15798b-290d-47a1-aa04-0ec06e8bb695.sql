do $$
declare
  v_company uuid;
  v_user uuid := gen_random_uuid();
begin
  select id into v_company from public.companies where slug = 'test-company' limit 1;
  if v_company is null then
    insert into public.companies (
      name, slug, primary_contact_name, primary_contact_email, billing_email,
      address_line1, city, postcode, country, plan_type, price_per_device,
      billing_cycle, term_months, start_date, end_date, status, connectivity_type,
      created_by_user_id, device_limit, screen_count
    ) values (
      'Test Company', 'test-company', 'Test User', 'test@test.co.uk', 'test@test.co.uk',
      '1 Test Street', 'Testville', 'TE1 1ST', 'United Kingdom', 'wifi', 35,
      'monthly', 1, current_date, current_date + interval '1 year', 'active', 'wifi',
      '43012786-1dbd-438d-b119-54971929e1e6', 5, 1
    ) returning id into v_company;
  end if;

  if not exists (select 1 from auth.users where email = 'test@test.co.uk') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated',
      'test@test.co.uk', crypt('test123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test User"}'::jsonb, now(), now()
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_user, v_user::text,
      format('{"sub":"%s","email":"test@test.co.uk","email_verified":true,"phone_verified":false}', v_user)::jsonb,
      'email', now(), now(), now());
  else
    select id into v_user from auth.users where email = 'test@test.co.uk';
  end if;

  insert into public.profiles (id, email, full_name, role, company_id, is_active, must_change_password)
  values (v_user, 'test@test.co.uk', 'Test User', 'company_admin', v_company, true, false)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        company_id = excluded.company_id,
        is_active = true,
        must_change_password = false,
        tutorial_completed_at = null;
end $$;