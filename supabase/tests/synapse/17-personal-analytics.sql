BEGIN;
  SELECT plan(8);

  -- Test that the function exists
  SELECT function_returns('public', 'get_personal_analytics', ARRAY[]::text[], 'json',
    'get_personal_analytics function should exist and return json');

  -- Test function structure
  SELECT has_function('public', 'get_personal_analytics', ARRAY[]::text[],
    'get_personal_analytics function should exist');

  -- Test function permissions
  SELECT has_function_privilege('authenticated', 'get_personal_analytics()', 'execute',
    'Authenticated users should be able to execute get_personal_analytics');

  -- Test function returns expected structure
  SELECT json_typeof(public.get_personal_analytics()),
    'get_personal_analytics should return valid JSON';

  -- Test that all required fields are present
  SELECT (public.get_personal_analytics())->'overview' IS NOT NULL,
    'get_personal_analytics should return overview data';

  SELECT (public.get_personal_analytics())->'status_breakdown' IS NOT NULL,
    'get_personal_analytics should return status breakdown data';

  SELECT (public.get_personal_analytics())->'ai_analytics' IS NOT NULL,
    'get_personal_analytics should return AI analytics data';

  SELECT (public.get_personal_analytics())->'monthly_trends' IS NOT NULL,
    'get_personal_analytics should return monthly trends data';

  SELECT * FROM finish();
ROLLBACK; 