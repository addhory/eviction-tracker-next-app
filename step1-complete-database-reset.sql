-- STEP 1: COMPLETE DATABASE RESET
-- This script safely drops all existing tables, views, policies, and functions
-- to prepare for a clean schema rebuild

-- Disable RLS before dropping tables to avoid dependency issues
SET session_replication_role = 'replica';

-- Drop all existing views first (they depend on tables)
DROP VIEW IF EXISTS contractor_available_jobs CASCADE;
DROP VIEW IF EXISTS contractor_assigned_jobs CASCADE;

-- Drop all RLS policies (to avoid conflicts)
DROP POLICY IF EXISTS "landlords_own_data" ON profiles CASCADE;
DROP POLICY IF EXISTS "contractors_can_read_profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "admins_full_access" ON profiles CASCADE;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "public_profiles_viewable" ON profiles CASCADE;

-- Drop policies on other tables
DROP POLICY IF EXISTS "landlords_own_properties" ON properties CASCADE;
DROP POLICY IF EXISTS "contractors_assigned_properties" ON properties CASCADE;
DROP POLICY IF EXISTS "admins_all_properties" ON properties CASCADE;

DROP POLICY IF EXISTS "landlords_own_tenants" ON tenants CASCADE;
DROP POLICY IF EXISTS "contractors_assigned_tenants" ON tenants CASCADE;
DROP POLICY IF EXISTS "admins_all_tenants" ON tenants CASCADE;

DROP POLICY IF EXISTS "landlords_own_cases" ON legal_cases CASCADE;
DROP POLICY IF EXISTS "contractors_assigned_cases" ON legal_cases CASCADE;
DROP POLICY IF EXISTS "admins_all_cases" ON legal_cases CASCADE;

DROP POLICY IF EXISTS "all_can_read_law_firms" ON law_firms CASCADE;
DROP POLICY IF EXISTS "admins_manage_law_firms" ON law_firms CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS private.is_admin_safe() CASCADE;
DROP FUNCTION IF EXISTS private.is_contractor_safe() CASCADE;
DROP FUNCTION IF EXISTS private.get_user_role_safe() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS claim_contractor_job(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS unclaim_contractor_job(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS update_contractor_job_status(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_deletion() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users CASCADE;

-- Drop all main tables (in dependency order)
DROP TABLE IF EXISTS legal_cases CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS law_firms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop the private schema if it exists
DROP SCHEMA IF EXISTS private CASCADE;

-- Re-enable replication role
SET session_replication_role = 'origin';

-- Verify cleanup
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'properties', 'tenants', 'legal_cases', 'law_firms');

-- Should return empty result if cleanup was successful

COMMENT ON DATABASE postgres IS 'Database reset completed - ready for clean schema deployment';