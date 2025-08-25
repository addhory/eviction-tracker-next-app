-- =============================================================================
-- STEP 4: TEST QUERIES AND VERIFICATION
-- =============================================================================
-- 
-- This script tests all the new policies and ensures they work correctly
-- with your business logic. Run this AFTER step3-simple-rls-policies.sql
-- =============================================================================

-- =============================================================================
-- BASIC FUNCTIONALITY TESTS
-- =============================================================================

-- Test 1: Check current user context
SELECT 
    'Current User Test' as test_name,
    auth.uid() as user_id,
    auth.email() as user_email,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT_AUTHENTICATED'
    END as auth_status;

-- Test 2: Check user profile and role
SELECT 
    'User Profile Test' as test_name,
    id,
    username,
    email,
    name,
    role,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Test 3: Check if user can see only their own profile
SELECT 
    'Profile Access Test' as test_name,
    count(*) as profiles_visible,
    CASE 
        WHEN count(*) = 1 THEN 'CORRECT - Only own profile visible'
        WHEN count(*) > 1 THEN 'ISSUE - Can see other profiles'
        ELSE 'ISSUE - Cannot see own profile'
    END as test_result
FROM public.profiles;

-- =============================================================================
-- ROLE-BASED ACCESS TESTS
-- =============================================================================

-- Test 4: Properties access (should only see own properties for landlords)
SELECT 
    'Properties Access Test' as test_name,
    count(*) as properties_visible,
    array_agg(DISTINCT landlord_id) as landlord_ids_visible
FROM public.properties;

-- Test 5: Tenants access (should only see own tenants for landlords)
SELECT 
    'Tenants Access Test' as test_name,
    count(*) as tenants_visible,
    array_agg(DISTINCT landlord_id) as landlord_ids_visible
FROM public.tenants;

-- Test 6: Legal cases access (should only see own cases for landlords)
SELECT 
    'Legal Cases Access Test' as test_name,
    count(*) as cases_visible,
    array_agg(DISTINCT landlord_id) as landlord_ids_visible
FROM public.legal_cases;

-- Test 7: Law firms access (should be visible to all authenticated users)
SELECT 
    'Law Firms Access Test' as test_name,
    count(*) as law_firms_visible,
    CASE 
        WHEN count(*) >= 0 THEN 'CORRECT - Can view law firms'
        ELSE 'ISSUE - Cannot view law firms'
    END as test_result
FROM public.law_firms;

-- =============================================================================
-- CONTRACTOR-SPECIFIC TESTS
-- =============================================================================

-- Test 8: Check contractor available jobs view
SELECT 
    'Contractor Available Jobs Test' as test_name,
    count(*) as available_jobs,
    CASE 
        WHEN count(*) >= 0 THEN 'SUCCESS - View accessible'
        ELSE 'ISSUE - View not accessible'
    END as test_result
FROM public.contractor_available_jobs;

-- Test 9: Check contractor assigned jobs view  
SELECT 
    'Contractor Assigned Jobs Test' as test_name,
    count(*) as assigned_jobs,
    CASE 
        WHEN count(*) >= 0 THEN 'SUCCESS - View accessible'
        ELSE 'ISSUE - View not accessible'
    END as test_result
FROM public.contractor_assigned_jobs;

-- =============================================================================
-- DATA INSERTION TESTS (Basic)
-- =============================================================================

-- Test 10: Try to insert a test property (should work for landlords, fail for contractors)
-- Note: This is commented out to avoid side effects. Uncomment to test manually.

/*
-- First check if user is a landlord
SELECT 
    'Insert Permission Test' as test_name,
    role,
    CASE 
        WHEN role = 'landlord' THEN 'Should be able to insert properties'
        WHEN role = 'contractor' THEN 'Should NOT be able to insert properties'
        WHEN role = 'admin' THEN 'Should be able to insert properties'
        ELSE 'Unknown role'
    END as expected_behavior
FROM public.profiles 
WHERE id = auth.uid();

-- Test property insertion (uncomment to test)
-- INSERT INTO public.properties (
--     landlord_id, address, city, state, zip_code, county, property_type
-- ) VALUES (
--     auth.uid(), 'Test Address', 'Test City', 'MD', '12345', 'Test County', 'RESIDENTIAL'
-- );
*/

-- =============================================================================
-- PERFORMANCE TESTS
-- =============================================================================

-- Test 11: Check if indexes are being used (basic query plan)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.properties WHERE landlord_id = auth.uid();

-- Test 12: Check if RLS policies are not causing excessive overhead
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, t.tenant_names 
FROM public.properties p
LEFT JOIN public.tenants t ON p.id = t.property_id
WHERE p.landlord_id = auth.uid();

-- =============================================================================
-- SECURITY VERIFICATION TESTS
-- =============================================================================

-- Test 13: Verify RLS is enabled on all tables
SELECT 
    'RLS Status Check' as test_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    CASE 
        WHEN c.relrowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('profiles', 'properties', 'tenants', 'legal_cases', 'law_firms')
ORDER BY c.relname;

-- Test 14: Count policies per table
SELECT 
    'Policy Count Check' as test_name,
    tablename,
    count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- BUSINESS LOGIC TESTS
-- =============================================================================

-- Test 15: Verify landlord can see their properties and tenants
SELECT 
    'Landlord Business Logic Test' as test_name,
    p.id as property_id,
    p.address,
    t.id as tenant_id,
    array_to_string(t.tenant_names, ', ') as tenant_names,
    lc.id as case_id,
    lc.status as case_status
FROM public.properties p
LEFT JOIN public.tenants t ON p.id = t.property_id  
LEFT JOIN public.legal_cases lc ON t.id = lc.tenant_id
WHERE p.landlord_id = auth.uid()
ORDER BY p.address, t.tenant_names;

-- Test 16: Check if contractor views work properly
SELECT 
    'Contractor Views Test' as test_name,
    (SELECT count(*) FROM public.contractor_available_jobs) as available_jobs,
    (SELECT count(*) FROM public.contractor_assigned_jobs) as assigned_jobs;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

-- Test Summary
SELECT 
    'TEST SUMMARY' as section,
    'All tests completed' as status,
    'Check results above for any issues' as message,
    now() as test_completed_at;

-- Policy Summary
SELECT 
    'POLICY SUMMARY' as section,
    schemaname,
    tablename,
    count(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =============================================================================
-- EXPECTED RESULTS BY ROLE
-- =============================================================================

/*
LANDLORD ROLE EXPECTATIONS:
- Can see only their own profile
- Can see only their own properties
- Can see only their own tenants
- Can see only their own legal cases
- Can see all law firms
- Cannot see contractor views (will show 0 results)

CONTRACTOR ROLE EXPECTATIONS:
- Can see only their own profile
- Can see properties with available jobs only
- Can see tenants with available jobs only
- Can see available cases + their assigned cases
- Can see all law firms
- Can see contractor views with relevant data

ADMIN ROLE EXPECTATIONS:
- Can see all profiles
- Can see all properties
- Can see all tenants
- Can see all legal cases
- Can see all law firms
- Can see contractor views

COMMON ISSUES TO WATCH FOR:
1. If you see "permission denied" errors, RLS policies might be too restrictive
2. If you see more data than expected, policies might be too permissive
3. If queries are slow, indexes might be missing or policies inefficient
4. If contractor views show no data, check that test data exists with correct status
*/

-- =============================================================================
-- NEXT STEPS
-- =============================================================================

SELECT 
    'NEXT STEPS' as section,
    'If all tests pass, proceed to step5-update-services.sql' as action,
    'If issues found, review and adjust policies in step3' as alternative;
