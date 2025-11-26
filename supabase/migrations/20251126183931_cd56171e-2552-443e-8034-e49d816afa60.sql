-- Create enum types for company and user management
CREATE TYPE public.plan_type AS ENUM ('wifi', 'anywhere');
CREATE TYPE public.company_status AS ENUM ('pending', 'active', 'expired', 'suspended');
CREATE TYPE public.connectivity_type AS ENUM ('wifi', 'cyberyard_anywhere');
CREATE TYPE public.user_role AS ENUM ('super_admin', 'company_admin', 'company_user');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  billing_email TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL,
  plan_type plan_type NOT NULL,
  price_per_device DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  device_limit INTEGER,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status company_status NOT NULL DEFAULT 'pending',
  connectivity_type connectivity_type NOT NULL,
  notes TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'company_user',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
$$;

-- RLS Policies for companies
CREATE POLICY "Super admins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company users can view their own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create trigger function for profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'company_user')
  );
  RETURN new;
END;
$$;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at on companies
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tables to reference companies
ALTER TABLE public.devices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.playlists ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.videos ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.venues ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update RLS policies for existing tables to be company-scoped
DROP POLICY IF EXISTS "Users can view their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can create their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON public.devices;

CREATE POLICY "Company users can view their company devices"
  ON public.devices FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company users can create devices for their company"
  ON public.devices FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their company devices"
  ON public.devices FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company users can delete their company devices"
  ON public.devices FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );