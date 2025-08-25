-- =============================================================================
-- COMPLETE EVICTION TRACKER DATABASE SCHEMA
-- =============================================================================
-- This is a comprehensive schema file that includes all tables, policies, 
-- functions, and admin features for the Eviction Tracker application.
-- 
-- Run this ONCE in your Supabase SQL Editor to set up the entire database.
-- This file consolidates and replaces:
-- - supabase-schema.sql
-- - database-update.sql  
-- - admin-contractor-policies.sql
-- =============================================================================

-- =============================================================================
-- CORE DATABASE TABLES
-- =============================================================================

-- Create profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'landlord' CHECK (role IN ('admin', 'landlord', 'contractor')),
    phone VARCHAR(20),
    address TEXT,
    business_name VARCHAR(100),
    referral_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    price_overrides JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    unit VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100) NOT NULL,
    property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('RESIDENTIAL', 'COMMERCIAL')),
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_feet INTEGER,
    year_built INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_names TEXT[] NOT NULL, -- Array of tenant names
    email VARCHAR(255),
    phone VARCHAR(20),
    lease_start_date DATE,
    lease_end_date DATE,
    rent_amount DECIMAL(10,2),
    is_subsidized BOOLEAN DEFAULT FALSE,
    subsidy_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legal cases table
CREATE TABLE IF NOT EXISTS public.legal_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    case_type VARCHAR(20) NOT NULL CHECK (case_type IN ('FTPR', 'HOLDOVER', 'OTHER')),
    date_initiated DATE NOT NULL,
    rent_owed_at_filing DECIMAL(10,2) DEFAULT 0,
    current_rent_owed DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL CHECK (status IN ('NOTICE_DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL')),
    price DECIMAL(10,2) NOT NULL,
    no_right_of_redemption BOOLEAN DEFAULT FALSE,
    late_fees_charged DECIMAL(10,2),
    thirty_day_notice_file_name VARCHAR(255),
    payments_made JSONB DEFAULT '[]',
    notice_mailed_date DATE,
    court_case_number VARCHAR(100),
    trial_date DATE,
    court_hearing_date DATE,
    court_outcome_notes TEXT,
    generated_documents JSONB DEFAULT '{}',
    district_court_case_number VARCHAR(100),
    warrant_order_date DATE,
    initial_eviction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create law firms table
CREATE TABLE IF NOT EXISTS public.law_firms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    contact_person VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    target_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_county ON public.properties(county);
CREATE INDEX IF NOT EXISTS idx_tenants_landlord_id ON public.tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_landlord_id ON public.legal_cases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_payment_status ON public.legal_cases(payment_status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- Function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, name, role, phone, address, business_name, referral_code, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'landlord'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'referral_code',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_name TEXT,
    action_details JSONB DEFAULT '{}',
    target_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admins to log actions
    IF NOT public.is_admin() THEN
        RETURN;
    END IF;

    INSERT INTO public.admin_audit_log (
        admin_id,
        action,
        details,
        target_user_id,
        created_at
    ) VALUES (
        auth.uid(),
        action_name,
        action_details,
        target_user_id,
        NOW()
    );
END;
$$;

-- =============================================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow login queries" ON public.profiles;
DROP POLICY IF EXISTS "Allow user registration" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete all profiles" ON public.profiles;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- PROFILES TABLE POLICIES
-- ========================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admin to insert new profiles (for contractor creation)
CREATE POLICY "Admin can insert profiles" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Allow admin to create profiles for others
        public.is_admin()
        -- OR allow users to create their own profile during signup
        OR auth.uid() = id
    );

-- Allow login queries (needed for authentication flow)
CREATE POLICY "Allow login queries" ON public.profiles
    FOR SELECT USING (true);

-- Admin super user policies for profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admin can update all profiles" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admin can delete all profiles" ON public.profiles
    FOR DELETE 
    TO authenticated
    USING (public.is_admin());

-- Service role bypass (for Supabase Admin API)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- PROPERTIES TABLE POLICIES
-- ==========================

-- Landlords can only see their own properties
CREATE POLICY "Landlords can view own properties" ON public.properties
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own properties" ON public.properties
    FOR ALL USING (landlord_id = auth.uid());

-- Admin can view all properties
CREATE POLICY "Admin can view all properties" ON public.properties
    FOR SELECT 
    TO authenticated
    USING (public.is_admin());

-- Admin can manage all properties
CREATE POLICY "Admin can manage all properties" ON public.properties
    FOR ALL 
    TO authenticated
    USING (public.is_admin());

-- TENANTS TABLE POLICIES
-- =======================

-- Landlords can only see their own tenants
CREATE POLICY "Landlords can view own tenants" ON public.tenants
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own tenants" ON public.tenants
    FOR ALL USING (landlord_id = auth.uid());

-- Admin can view all tenants
CREATE POLICY "Admin can view all tenants" ON public.tenants
    FOR SELECT 
    TO authenticated
    USING (public.is_admin());

-- Admin can manage all tenants
CREATE POLICY "Admin can manage all tenants" ON public.tenants
    FOR ALL 
    TO authenticated
    USING (public.is_admin());

-- LEGAL CASES TABLE POLICIES
-- ===========================

-- Landlords can only see their own cases
CREATE POLICY "Landlords can view own cases" ON public.legal_cases
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own cases" ON public.legal_cases
    FOR ALL USING (landlord_id = auth.uid());

-- Admin can view all legal cases
CREATE POLICY "Admin can view all cases" ON public.legal_cases
    FOR SELECT 
    TO authenticated
    USING (public.is_admin());

-- Admin can manage all legal cases
CREATE POLICY "Admin can manage all cases" ON public.legal_cases
    FOR ALL 
    TO authenticated
    USING (public.is_admin());

-- LAW FIRMS TABLE POLICIES
-- =========================

-- Everyone can view law firms
CREATE POLICY "Everyone can view law firms" ON public.law_firms
    FOR SELECT USING (true);

-- Admin can manage law firms
CREATE POLICY "Admin can manage law firms" ON public.law_firms
    FOR ALL 
    TO authenticated
    USING (public.is_admin());

-- AUDIT LOG TABLE POLICIES
-- =========================

-- Only admins can view audit logs
CREATE POLICY "Admin can view audit logs" ON public.admin_audit_log
    FOR SELECT 
    TO authenticated
    USING (public.is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Admin can insert audit logs" ON public.admin_audit_log
    FOR INSERT 
    TO authenticated
    WITH CHECK (public.is_admin());

-- =============================================================================
-- USER CREATION TRIGGER
-- =============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ADMIN USER MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function for admin to create contractor users
CREATE OR REPLACE FUNCTION public.admin_create_contractor(
    contractor_email TEXT,
    contractor_password TEXT,
    contractor_name TEXT,
    contractor_username TEXT,
    contractor_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    new_user_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied. Admin privileges required.'
        );
    END IF;

    -- Check if user already exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = contractor_email
    ) INTO user_exists;

    IF user_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User with this email already exists.'
        );
    END IF;

    -- Check if username is already taken
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE username = contractor_username
    ) INTO user_exists;

    IF user_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Username is already taken.'
        );
    END IF;

    -- Note: Actual user creation should be done via Supabase Admin API
    -- This function returns instructions for proper user creation
    
    -- Log the action
    PERFORM public.log_admin_action(
        'contractor_creation_requested',
        jsonb_build_object(
            'contractor_email', contractor_email,
            'contractor_name', contractor_name,
            'contractor_username', contractor_username
        )
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Use Supabase Admin API to create the contractor user',
        'instructions', 'Call supabase.auth.admin.createUser() with the provided details and role: contractor',
        'user_metadata', jsonb_build_object(
            'name', contractor_name,
            'username', contractor_username,
            'role', 'contractor',
            'phone', contractor_phone
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Failed to process contractor creation: ' || SQLERRM
        );
END;
$$;

-- Function for admin to create any type of user
CREATE OR REPLACE FUNCTION public.admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied. Admin privileges required.'
        );
    END IF;

    -- Log the user creation attempt
    PERFORM public.log_admin_action(
        'user_create_attempt',
        jsonb_build_object(
            'email', user_email,
            'metadata', user_metadata
        )
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Use Supabase Admin API for user creation',
        'action', 'create_user_via_admin_api',
        'instructions', 'Call supabase.auth.admin.createUser() from server-side code'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to trigger password reset for users (admin action)
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    user_email TEXT;
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied. Admin privileges required.'
        );
    END IF;

    -- Get user email
    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = target_user_id;

    IF user_email IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found.'
        );
    END IF;

    -- Log the password reset
    PERFORM public.log_admin_action(
        'password_reset_initiated',
        jsonb_build_object(
            'user_email', user_email,
            'message', 'Password reset initiated by admin'
        ),
        target_user_id
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Password reset will be handled via auth flow',
        'user_email', user_email,
        'action', 'send_password_reset'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS FOR ADMIN OPERATIONS
-- =============================================================================

-- Grant usage on auth schema to authenticated users (needed for admin operations)
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant select on auth.users to authenticated users (for admin functions)
GRANT SELECT ON auth.users TO authenticated;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.is_admin() IS 'Helper function to check if current user has admin role';
COMMENT ON FUNCTION public.log_admin_action(TEXT, JSONB, UUID) IS 'Logs admin actions for audit trail';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile when new user signs up';
COMMENT ON FUNCTION public.admin_create_contractor(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Admin function to initiate contractor user creation';
COMMENT ON TABLE public.admin_audit_log IS 'Audit log for admin actions including user creation';
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.properties IS 'Property information for landlords';
COMMENT ON TABLE public.tenants IS 'Tenant information linked to properties';
COMMENT ON TABLE public.legal_cases IS 'Eviction cases and legal proceedings';
COMMENT ON TABLE public.law_firms IS 'Law firm directory for referrals';

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- After running this script:
-- 1. Make sure your admin user has role = 'admin' in the profiles table
-- 2. Use the service_role key for admin operations from your application
-- 3. New users will automatically get profiles created when they sign up
-- 4. Admin users can manage all data and create new users via the admin API

-- To verify admin status, run:
-- SELECT public.is_admin();

-- To check user role:
-- SELECT role FROM public.profiles WHERE id = auth.uid();

-- Schema setup is now complete! 🎉
