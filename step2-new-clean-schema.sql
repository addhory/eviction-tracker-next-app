-- STEP 2: NEW CLEAN SCHEMA
-- This script creates a clean, optimized schema with proper relationships
-- and no circular dependencies for the eviction tracker application

-- Create private schema for helper functions
CREATE SCHEMA IF NOT EXISTS private;

-- =====================================================
-- 1. PROFILES TABLE (Users: Landlords, Contractors, Admins)
-- =====================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'landlord' CHECK (role IN ('admin', 'landlord', 'contractor')),
  phone text,
  address text,
  business_name text,
  referral_code text,
  city text,
  state text DEFAULT 'MD',
  zip_code text,
  price_overrides jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- =====================================================
-- 2. LAW FIRMS TABLE (Directory of law firms)
-- =====================================================

CREATE TABLE public.law_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'MD',
  zip_code text NOT NULL,
  phone text,
  email text,
  contact_person text,
  counties text[] DEFAULT '{}',
  pricing jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_law_firms_active ON public.law_firms(active);
CREATE INDEX idx_law_firms_counties ON public.law_firms USING GIN(counties);

-- =====================================================
-- 3. PROPERTIES TABLE (Rental properties)
-- =====================================================

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL,
  unit text, -- Added missing unit field
  city text NOT NULL,
  state text NOT NULL DEFAULT 'MD',
  zip_code text NOT NULL,
  county text NOT NULL,
  property_type text DEFAULT 'RESIDENTIAL' CHECK (property_type IN ('RESIDENTIAL', 'COMMERCIAL')), -- Match original values
  bedrooms integer, -- Added missing field
  bathrooms integer, -- Added missing field
  square_feet integer, -- Added missing field
  year_built integer, -- Added missing field
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_properties_county ON public.properties(county);

-- =====================================================
-- 4. TENANTS TABLE (Tenant information)
-- =====================================================

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_names text[] NOT NULL, -- Array of tenant names (compatibility with existing app)
  email text,
  phone text,
  lease_start_date date,
  lease_end_date date,
  rent_amount numeric(10,2), -- Match original field name
  is_subsidized boolean DEFAULT false, -- Added missing field
  subsidy_type text, -- Added missing field
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_tenants_landlord_id ON public.tenants(landlord_id);
CREATE INDEX idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX idx_tenants_names ON public.tenants USING GIN(tenant_names);

-- Schema creation complete
SELECT 'Clean schema part 1 created successfully!' as status;