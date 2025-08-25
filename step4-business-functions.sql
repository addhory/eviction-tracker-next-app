-- STEP 4: BUSINESS FUNCTIONS AND OPERATIONS
-- This script creates security definer functions to support business operations
-- All functions are designed to avoid RLS recursion issues

-- =====================================================
-- 0. CREATE PRIVATE SCHEMA FOR HELPER FUNCTIONS
-- =====================================================

-- Create private schema for security definer functions
CREATE SCHEMA IF NOT EXISTS private;

-- =====================================================
-- 1. HELPER FUNCTIONS (Security Definer to bypass RLS)
-- =====================================================

-- Get current user's role safely (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION private.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'admin'
  );
$$;

-- Check if current user is contractor
CREATE OR REPLACE FUNCTION private.is_contractor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'contractor'
  );
$$;

-- =====================================================
-- 2. CONTRACTOR JOB MANAGEMENT FUNCTIONS
-- =====================================================

-- Function for contractors to claim a job
CREATE OR REPLACE FUNCTION public.claim_contractor_job(case_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result json;
  user_role text;
BEGIN
  -- Check if user is a contractor
  user_role := private.get_current_user_role();
  
  IF user_role != 'contractor' THEN
    RETURN json_build_object('success', false, 'error', 'Only contractors can claim jobs');
  END IF;

  -- Update the case to assign it to the contractor
  UPDATE public.legal_cases 
  SET 
    contractor_id = (SELECT auth.uid()),
    contractor_status = 'ASSIGNED',
    contractor_assigned_date = NOW()
  WHERE 
    id = case_id
    AND contractor_id IS NULL
    AND contractor_status = 'UNASSIGNED'
    AND status = 'SUBMITTED'
    AND payment_status = 'PAID';

  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Job claimed successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Job not available or already claimed');
  END IF;

  RETURN result;
END;
$$;

-- Function for contractors to unclaim a job
CREATE OR REPLACE FUNCTION public.unclaim_contractor_job(case_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result json;
  user_role text;
BEGIN
  -- Check if user is a contractor
  user_role := private.get_current_user_role();
  
  IF user_role != 'contractor' THEN
    RETURN json_build_object('success', false, 'error', 'Only contractors can unclaim jobs');
  END IF;

  -- Update the case to unassign it from the contractor
  UPDATE public.legal_cases 
  SET 
    contractor_id = NULL,
    contractor_status = 'UNASSIGNED',
    contractor_assigned_date = NULL,
    contractor_notes = NULL
  WHERE 
    id = case_id
    AND contractor_id = (SELECT auth.uid())
    AND contractor_status IN ('ASSIGNED', 'IN_PROGRESS');

  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Job unclaimed successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Job not found or cannot be unclaimed');
  END IF;

  RETURN result;
END;
$$;

-- Function for contractors to update job status
CREATE OR REPLACE FUNCTION public.update_contractor_job_status(
  case_id uuid,
  new_status text,
  notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result json;
  user_role text;
BEGIN
  -- Check if user is a contractor
  user_role := private.get_current_user_role();
  
  IF user_role != 'contractor' THEN
    RETURN json_build_object('success', false, 'error', 'Only contractors can update job status');
  END IF;

  -- Validate status
  IF new_status NOT IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status');
  END IF;

  -- Update the case status
  UPDATE public.legal_cases 
  SET 
    contractor_status = new_status,
    contractor_notes = COALESCE(notes, contractor_notes),
    contractor_completed_date = CASE 
      WHEN new_status = 'COMPLETED' THEN NOW() 
      ELSE contractor_completed_date 
    END
  WHERE 
    id = case_id
    AND contractor_id = (SELECT auth.uid());

  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Job status updated successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Job not found or not assigned to you');
  END IF;

  RETURN result;
END;
$$;

-- =====================================================
-- 3. ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function for admins to assign contractor to case
CREATE OR REPLACE FUNCTION public.admin_assign_contractor(
  case_id uuid,
  contractor_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT private.is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Verify contractor exists and has contractor role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = contractor_id AND role = 'contractor'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid contractor');
  END IF;

  -- Update the case
  UPDATE public.legal_cases 
  SET 
    contractor_id = admin_assign_contractor.contractor_id,
    contractor_status = 'ASSIGNED',
    contractor_assigned_date = NOW()
  WHERE id = case_id;

  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Contractor assigned successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Case not found');
  END IF;

  RETURN result;
END;
$$;

-- Function for admins to update user roles
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  user_id uuid,
  new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT private.is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'landlord', 'contractor') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Update the user role
  UPDATE public.profiles 
  SET role = new_role
  WHERE id = user_id;

  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'User role updated successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN result;
END;
$$;

-- =====================================================
-- 4. UTILITY FUNCTIONS
-- =====================================================

-- Generate unique case number
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
BEGIN
  -- Generate case number: YEAR-MONTH-RANDOM
  new_number := to_char(NOW(), 'YYYY-MM') || '-' || 
                upper(substring(gen_random_uuid()::text from 1 for 8));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.legal_cases WHERE case_number = new_number) LOOP
    new_number := to_char(NOW(), 'YYYY-MM') || '-' || 
                  upper(substring(gen_random_uuid()::text from 1 for 8));
  END LOOP;

  RETURN new_number;
END;
$$;

-- =====================================================
-- 5. STATISTICS FUNCTIONS (for dashboards)
-- =====================================================

-- Get dashboard stats for landlords
CREATE OR REPLACE FUNCTION public.get_landlord_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT json_build_object(
    'total_properties', COUNT(DISTINCT p.id),
    'total_tenants', COUNT(DISTINCT t.id),
    'active_cases', COUNT(DISTINCT CASE WHEN lc.status IN ('NOTICE_DRAFT', 'SUBMITTED', 'IN_PROGRESS') THEN lc.id END),
    'completed_cases', COUNT(DISTINCT CASE WHEN lc.status = 'COMPLETE' THEN lc.id END),
    'total_revenue', COALESCE(SUM(CASE WHEN lc.payment_status = 'PAID' THEN lc.price END), 0)
  )
  FROM public.properties p
  LEFT JOIN public.tenants t ON p.id = t.property_id
  LEFT JOIN public.legal_cases lc ON p.id = lc.property_id
  WHERE p.landlord_id = (SELECT auth.uid());
$$;

-- Get dashboard stats for contractors
CREATE OR REPLACE FUNCTION public.get_contractor_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT json_build_object(
    'available_jobs', (
      SELECT COUNT(*) FROM public.contractor_available_jobs
    ),
    'assigned_jobs', COUNT(DISTINCT CASE WHEN contractor_status = 'ASSIGNED' THEN id END),
    'in_progress_jobs', COUNT(DISTINCT CASE WHEN contractor_status = 'IN_PROGRESS' THEN id END),
    'completed_jobs', COUNT(DISTINCT CASE WHEN contractor_status = 'COMPLETED' THEN id END),
    'total_earnings', COALESCE(SUM(CASE WHEN contractor_status = 'COMPLETED' THEN price * 0.1 END), 0) -- 10% commission
  )
  FROM public.legal_cases
  WHERE contractor_id = (SELECT auth.uid());
$$;

-- Get dashboard stats for admins
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_landlords', (SELECT COUNT(*) FROM public.profiles WHERE role = 'landlord'),
    'total_contractors', (SELECT COUNT(*) FROM public.profiles WHERE role = 'contractor'),
    'total_properties', (SELECT COUNT(*) FROM public.properties),
    'total_cases', (SELECT COUNT(*) FROM public.legal_cases),
    'active_cases', (SELECT COUNT(*) FROM public.legal_cases WHERE status IN ('NOTICE_DRAFT', 'SUBMITTED', 'IN_PROGRESS')),
    'total_revenue', (
      SELECT COALESCE(SUM(price), 0) 
      FROM public.legal_cases 
      WHERE payment_status = 'PAID'
    )
  );
$$;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_contractor_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unclaim_contractor_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contractor_job_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_contractor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_case_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_landlord_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contractor_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- =====================================================
-- 7. FUNCTION VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Business functions created successfully!';
  RAISE NOTICE 'Contractor functions: claim_job, unclaim_job, update_status';
  RAISE NOTICE 'Admin functions: assign_contractor, update_user_role';
  RAISE NOTICE 'Utility functions: generate_case_number, stats functions';
  RAISE NOTICE 'All functions use SECURITY DEFINER to avoid RLS recursion';
END $$;

SELECT 'Business functions created successfully!' as status;
