BEGIN;
  create extension "basejump-supabase_test_helpers" version '0.0.6';
  
  -- Plan the tests
  SELECT plan(7);

  -- Create test users
  SELECT tests.create_supabase_user('test1', 'test1@test.com');
  SELECT tests.create_supabase_user('test2', 'test2@test.com');

  -- Create test expenses
  SELECT tests.authenticate_as('test1');
  select public.create_expense('Test Expense 1', tests.get_supabase_uid('test1'), 'Test Description 1');

  SELECT tests.authenticate_as('test2');
  select public.create_expense('Test Expense 2', tests.get_supabase_uid('test2'), 'Test Description 2');

  -- Get expense IDs
  SELECT tests.authenticate_as('test1');
  SELECT set_config('test.expense1_id', (SELECT id::text FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') LIMIT 1), false);
  
  SELECT tests.authenticate_as('test2');
  SELECT set_config('test.expense2_id', (SELECT id::text FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test2') LIMIT 1), false);

  -- Test 1: Function should exist
  SELECT tests.authenticate_as('test1');
  SELECT function_returns('public', 'update_expense_status', ARRAY['uuid', 'synapse.expense_status'], 'json',
    'update_expense_status function should exist and return json');

  -- Test 2: Should allow expense owner to update their own expense
  SELECT tests.authenticate_as('test1');
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'APPROVED'::synapse.expense_status))->>'status' $$,
    $$ SELECT 'APPROVED' $$,
    'Expense owner should be able to approve their own expense'
  );

  -- Test 3: Should allow expense owner to reject their own expense
  SELECT tests.authenticate_as('test1');
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'REJECTED'::synapse.expense_status))->>'status' $$,
    $$ SELECT 'REJECTED' $$,
    'Expense owner should be able to reject their own expense'
  );

  -- Test 4: Should allow expense owner to set status back to PENDING
  SELECT tests.authenticate_as('test1');
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'PENDING'::synapse.expense_status))->>'status' $$,
    $$ SELECT 'PENDING' $$,
    'Expense owner should be able to set status back to PENDING'
  );

  -- Test 5: Should return error for non-existent expense
  SELECT tests.authenticate_as('test1');
  SELECT throws_ok(
    $$ SELECT public.update_expense_status('11111111-1111-1111-1111-111111111111'::uuid, 'APPROVED'::synapse.expense_status) $$,
    'Expense not found',
    'Should return error for non-existent expense'
  );

  -- Test 6: Should return error when user tries to update another user's expense (not team member)
  SELECT tests.authenticate_as('test1');
  SELECT throws_ok(
    $$ SELECT public.update_expense_status(current_setting('test.expense2_id')::uuid, 'APPROVED'::synapse.expense_status) $$,
    'Expense not found',
    'Should return error when user tries to update another user expense (not team member)'
  );

  -- Test 7: Should return correct expense data structure
  SELECT tests.authenticate_as('test1');
  SELECT results_eq(
    $$ SELECT json_typeof(public.update_expense_status(current_setting('test.expense1_id')::uuid, 'PENDING'::synapse.expense_status)) $$,
    $$ SELECT 'object' $$,
    'Should return JSON object with expense data'
  );

  -- Finish the tests
  SELECT * FROM finish();
ROLLBACK; 