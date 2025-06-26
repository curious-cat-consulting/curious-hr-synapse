BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

  SELECT plan(8);

  -- Create test user (this automatically creates a personal account)
  SELECT tests.create_supabase_user('test_user', 'test@test.com');

  -- Test that the function exists
  SELECT function_returns('public', 'get_personal_analytics', ARRAY[]::text[], 'json',
    'get_personal_analytics function should exist and return json');

  -- Test function structure
  SELECT has_function('public', 'get_personal_analytics', ARRAY[]::text[],
    'get_personal_analytics function should exist');

  -- Authenticate as the test user and test that they can execute the function
  SELECT tests.authenticate_as('test_user');
  SELECT lives_ok(
    $$ SELECT public.get_personal_analytics() $$,
    'Authenticated users should be able to execute get_personal_analytics'
  );

  -- Test function returns expected structure
  SELECT is(json_typeof(public.get_personal_analytics()), 'object', 'get_personal_analytics should return valid JSON');

  -- Test that all required fields are present
  SELECT ok((public.get_personal_analytics())->'overview' IS NOT NULL, 'get_personal_analytics should return overview data');

  SELECT ok((public.get_personal_analytics())->'status_breakdown' IS NOT NULL, 'get_personal_analytics should return status breakdown data');

  SELECT ok((public.get_personal_analytics())->'ai_analytics' IS NOT NULL, 'get_personal_analytics should return AI analytics data');

  SELECT ok((public.get_personal_analytics())->'monthly_trends' IS NOT NULL, 'get_personal_analytics should return monthly trends data');

  SELECT * FROM finish();
ROLLBACK; 