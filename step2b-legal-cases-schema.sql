-- STEP 2B: LEGAL CASES TABLE AND RELATED COMPONENTS
-- This continues the clean schema with the complex legal_cases table

-- =====================================================
-- 5. LEGAL CASES TABLE (Eviction cases)
-- =====================================================

CREATE TABLE public.legal_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  law_firm_id uuid REFERENCES public.law_firms(id),
  contractor_id uuid REFERENCES public.profiles(id), -- Can be assigned to a contractor
  
  -- Case basic info
  case_type text DEFAULT 'FTPR' CHECK (case_type IN ('FTPR', 'HOLDOVER', 'OTHER')), -- Match original values
  date_initiated date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Financial details (match original field names)
  rent_owed_at_filing numeric(10,2) DEFAULT 0,
  current_rent_owed numeric(10,2) DEFAULT 0,
  late_fees_charged numeric(10,2),
  
  -- Case status (match original values)  
  status text DEFAULT 'NOTICE_DRAFT' CHECK (status IN ('NOTICE_DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED')),
  payment_status text DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL')),
  price numeric(10,2) NOT NULL,
  no_right_of_redemption boolean DEFAULT false,
  
  -- Payment tracking (from Stripe integration)
  payments_made jsonb DEFAULT '[]',
  
  -- Document and notice tracking
  thirty_day_notice_file_name text,
  notice_mailed_date date,
  generated_documents jsonb DEFAULT '{}',
  
  -- Court case tracking
  court_case_number text,
  trial_date date,
  court_hearing_date date,
  court_outcome_notes text,
  district_court_case_number text,
  
  -- Eviction timeline
  warrant_order_date date,
  initial_eviction_date date,
  
  -- Contractor tracking (for future contractor feature)
  contractor_status text DEFAULT 'UNASSIGNED' CHECK (contractor_status IN ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  contractor_assigned_date timestamp with time zone,
  contractor_completed_date timestamp with time zone,
  contractor_notes text,
  
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_legal_cases_landlord_id ON public.legal_cases(landlord_id);
CREATE INDEX idx_legal_cases_contractor_id ON public.legal_cases(contractor_id);
CREATE INDEX idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX idx_legal_cases_contractor_status ON public.legal_cases(contractor_status);
CREATE INDEX idx_legal_cases_payment_status ON public.legal_cases(payment_status);
CREATE INDEX idx_legal_cases_court_case_number ON public.legal_cases(court_case_number);

-- =====================================================
-- 6. UPDATE TRIGGERS (for updated_at timestamps)
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION private.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_law_firms_updated_at
  BEFORE UPDATE ON public.law_firms
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_legal_cases_updated_at
  BEFORE UPDATE ON public.legal_cases
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- =====================================================
-- 7. USEFUL VIEWS FOR CONTRACTORS
-- =====================================================

-- View for available contractor jobs
CREATE VIEW public.contractor_available_jobs AS
SELECT 
  lc.id,
  lc.case_type,
  lc.rent_owed_at_filing as amount_owed, -- Map to expected field name
  lc.price as total_amount, -- Map to expected field name
  lc.date_initiated,
  lc.court_hearing_date as court_date, -- Map to expected field name
  lc.court_outcome_notes as notes, -- Map to expected field name
  lc.created_at as created_at,
  lc.updated_at as updated_at,
  -- Property details
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.county,
  -- Tenant details
  t.tenant_names,
  t.phone,
  -- Landlord contact
  pr.name as landlord_name,
  pr.phone as landlord_phone,
  pr.email as landlord_email
FROM public.legal_cases lc
JOIN public.properties p ON lc.property_id = p.id
JOIN public.tenants t ON lc.tenant_id = t.id
JOIN public.profiles pr ON lc.landlord_id = pr.id
WHERE lc.status = 'SUBMITTED'
  AND lc.payment_status = 'PAID'
  AND lc.contractor_status = 'UNASSIGNED'
  AND lc.contractor_id IS NULL;

-- View for contractor's assigned jobs
CREATE VIEW public.contractor_assigned_jobs AS
SELECT 
  lc.id,
  lc.case_type,
  lc.rent_owed_at_filing as amount_owed, -- Map to expected field name
  lc.price as total_amount, -- Map to expected field name
  lc.date_initiated,
  lc.court_hearing_date as court_date, -- Map to expected field name
  lc.contractor_status,
  lc.contractor_assigned_date,
  lc.contractor_completed_date,
  lc.contractor_notes,
  lc.court_outcome_notes as notes, -- Map to expected field name
  -- Property details
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.county,
  -- Tenant details
  t.tenant_names,
  t.phone,
  -- Landlord contact
  pr.name as landlord_name,
  pr.phone as landlord_phone,
  pr.email as landlord_email
FROM public.legal_cases lc
JOIN public.properties p ON lc.property_id = p.id
JOIN public.tenants t ON lc.tenant_id = t.id
JOIN public.profiles pr ON lc.landlord_id = pr.id
WHERE lc.contractor_id = (SELECT auth.uid())
  AND lc.contractor_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- =====================================================
-- 7B. ADMIN AUDIT LOG TABLE
-- =====================================================

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  target_user_id uuid,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- =====================================================
-- 8. PROFILE MANAGEMENT TRIGGER
-- =====================================================

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'landlord')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Schema creation complete
SELECT 'Legal cases schema created successfully!' as status;
