BEGIN;
  create extension "basejump-supabase_test_helpers" version '0.0.6';
  
  -- Plan the tests
  SELECT plan(12);

  -- Create test users
  SELECT tests.create_supabase_user('test1', 'test1@test.com');
  SELECT tests.create_supabase_user('test2', 'test2@test.com');

  -- Create test expenses
  SELECT tests.authenticate_as('test1');
  INSERT INTO synapse.expenses (user_id, title, amount, description, status)
  VALUES (tests.get_supabase_uid('test1'), 'Test Expense 1', 100.00, 'Test Description 1', 'NEW');

  SELECT tests.authenticate_as('test2');
  INSERT INTO synapse.expenses (user_id, title, amount, description, status)
  VALUES (tests.get_supabase_uid('test2'), 'Test Expense 2', 200.00, 'Test Description 2', 'NEW');

  -- Get expense IDs
  SELECT tests.authenticate_as('test1');
  SELECT set_config('test.expense1_id', (SELECT id::text FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') LIMIT 1), false);
  
  SELECT tests.authenticate_as('test2');
  SELECT set_config('test.expense2_id', (SELECT id::text FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test2') LIMIT 1), false);

  -- Test 1: Function should exist
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
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'REJECTED'::synapse.expense_status))->>'status' $$,
    $$ SELECT 'REJECTED' $$,
    'Expense owner should be able to reject their own expense'
  );

  -- Test 4: Should allow expense owner to set status back to PENDING
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'PENDING'::synapse.expense_status))->>'status' $$,
    $$ SELECT 'PENDING' $$,
    'Expense owner should be able to set status back to PENDING'
  );

  -- Test 5: Should return error for non-existent expense
  SELECT throws_ok(
    $$ SELECT public.update_expense_status('11111111-1111-1111-1111-111111111111'::uuid, 'APPROVED'::synapse.expense_status) $$,
    'Expense not found',
    'Should return error for non-existent expense'
  );

  -- Test 6: Should return error when user tries to update another user's expense (not team member)
  SELECT throws_ok(
    $$ SELECT public.update_expense_status(current_setting('test.expense2_id')::uuid, 'APPROVED'::synapse.expense_status) $$,
    'Access denied: you can only update your own expenses or expenses of team members',
    'Should return error when user tries to update another user expense (not team member)'
  );

  -- Test 7: Should return error for unauthenticated users
  SELECT tests.clear_authentication();
  SELECT throws_ok(
    $$ SELECT public.update_expense_status(current_setting('test.expense1_id')::uuid, 'APPROVED'::synapse.expense_status) $$,
    'Authentication required',
    'Should return error for unauthenticated users'
  );

  -- Test 8: Should return error for invalid status
  SELECT tests.authenticate_as('test1');
  SELECT throws_ok(
    $$ SELECT public.update_expense_status(current_setting('test.expense1_id')::uuid, 'INVALID_STATUS'::synapse.expense_status) $$,
    'invalid input value for enum synapse.expense_status',
    'Should return error for invalid status'
  );

  -- Test 9: Should update the updated_at timestamp
  SELECT results_ne(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'ANALYZED'::synapse.expense_status))->>'updated_at' $$,
    $$ SELECT (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'created_at' $$,
    'Should update the updated_at timestamp when status changes'
  );

  -- Test 10: Should return correct expense data structure
  SELECT results_eq(
    $$ SELECT json_typeof(public.update_expense_status(current_setting('test.expense1_id')::uuid, 'PENDING'::synapse.expense_status)) $$,
    $$ SELECT 'object' $$,
    'Should return JSON object with expense data'
  );

  -- Test 11: Should include all required fields in response
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'NEW'::synapse.expense_status))->>'id' IS NOT NULL $$,
    $$ SELECT true $$,
    'Should include id field in response'
  );

  -- Test 12: Should include title field in response
  SELECT results_eq(
    $$ SELECT (public.update_expense_status(current_setting('test.expense1_id')::uuid, 'PENDING'::synapse.expense_status))->>'title' IS NOT NULL $$,
    $$ SELECT true $$,
    'Should include title field in response'
  );

  -- Finish the tests
  SELECT * FROM finish();
ROLLBACK; 