BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(23);

-- Test schema and table existence
select has_schema('synapse', 'Synapse schema should exist');
select has_table('synapse', 'expenses', 'Synapse expenses table should exist');

-- Test enum type
select has_type('synapse', 'expense_status', 'Expense status enum should exist');
select enum_has_labels('synapse', 'expense_status', 
    ARRAY['ANALYZED', 'APPROVED', 'NEW', 'PENDING', 'REJECTED'],
    'Expense status enum should have correct labels');

-- Test table columns
select columns_are('synapse', 'expenses',
    ARRAY['id', 'user_id', 'title', 'amount', 'description', 'status', 'created_at', 'updated_at'],
    'Expenses table should have the correct columns');

-- Test function existence
select function_returns('public', 'get_expenses', ARRAY[]::text[], 'json',
    'get_expenses function should exist and return json');

-- Test RLS is enabled
select tests.rls_enabled('synapse', 'expenses');

-- Test that RLS policies exist
select policies_are('synapse', 'expenses', 
    ARRAY['Users can view their own expenses', 'Users can insert their own expenses', 'Users can update their own expenses'],
    'Should have the correct RLS policies');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Test as authenticated user (test1)
select tests.authenticate_as('test1');

-- Test INSERT policy - should be able to insert own expense
select lives_ok(
    $$ insert into synapse.expenses (user_id, title, amount, description, status)
       values (tests.get_supabase_uid('test1'), 'Test Expense', 100.00, 'Test Description', 'NEW') $$,
    'User should be able to insert their own expense'
);

-- Test SELECT policy - should be able to see own expense
select is(
    (select count(*)::int from synapse.expenses),
    1,
    'User should be able to see their own expense'
);

-- Test UPDATE policy - should be able to update own expense
select lives_ok(
    $$ update synapse.expenses set title = 'Updated Expense' where user_id = tests.get_supabase_uid('test1') $$,
    'User should be able to update their own expense'
);

-- Verify update worked
select is(
    (select title from synapse.expenses where user_id = tests.get_supabase_uid('test1')),
    'Updated Expense',
    'Expense title should be updated'
);

-- Test that user cannot insert expense for another user
select throws_ok(
    $$ insert into synapse.expenses (user_id, title, amount, description, status)
       values (tests.get_supabase_uid('test2'), 'Malicious Expense', 50.00, 'Should fail', 'NEW') $$,
    'new row violates row-level security policy for table "expenses"',
    'User should not be able to insert expense for another user'
);

-- Test as different authenticated user (test2)
select tests.authenticate_as('test2');

-- Should not see other user's expense (SELECT policy test)
select is(
    (select count(*)::int from synapse.expenses),
    0,
    'User should not see other users expenses'
);

-- Should not be able to update other user's expense (UPDATE policy test)
select is(
    (select count(*)::int from synapse.expenses where title = 'Unauthorized Update'),
    0,
    'User should not be able to update other users expenses'
);

-- Verify original expense title is unchanged
select tests.authenticate_as('test1');
select is(
    (select title from synapse.expenses where user_id = tests.get_supabase_uid('test1')),
    'Updated Expense',
    'Original expense title should be unchanged after attempted unauthorized update'
);

-- Test as anonymous user
select tests.clear_authentication();

-- Should not be able to access expenses table when not authenticated
select throws_ok(
    'select * from synapse.expenses',
    'permission denied for schema synapse',
    'Anonymous users should not have access to synapse schema'
);

-- Should not be able to insert as anonymous user
select throws_ok(
    $$ insert into synapse.expenses (user_id, title, amount, description, status)
       values ('11111111-1111-1111-1111-111111111111'::uuid, 'Anonymous Expense', 25.00, 'Should fail', 'NEW') $$,
    'permission denied for schema synapse',
    'Anonymous users should not be able to insert expenses'
);

-- Clean up test data before order-by and function tests
select tests.authenticate_as('test1');

-- Test get_expenses returns expenses in descending order by created_at
insert into synapse.expenses (user_id, title, amount, description, status, created_at)
values
  (tests.get_supabase_uid('test1'), 'Expense 1', 10.00, 'Desc 1', 'NEW', now() - interval '2 days'),
  (tests.get_supabase_uid('test1'), 'Expense 2', 20.00, 'Desc 2', 'NEW', now() - interval '1 day'),
  (tests.get_supabase_uid('test1'), 'Expense 3', 30.00, 'Desc 3', 'NEW', now());

select results_eq(
  $$ select (json_array_elements(public.get_expenses())->>'title')::text $$,
  ARRAY['Updated Expense', 'Expense 3', 'Expense 2', 'Expense 1'],
  'get_expenses should return expenses in descending order by created_at'
);

-- Test create_expense function: success
select tests.authenticate_as('test1');
select lives_ok(
  $$ select public.create_expense('API Expense', 'Created via API') $$,
  'create_expense should succeed with valid input'
);
select is(
  (select (public.create_expense('API Expense 2', null))->>'title'),
  'API Expense 2',
  'create_expense should use title if description is null'
);

-- Test create_expense function: validation
select throws_ok(
  $$ select public.create_expense('', 'No title') $$,
  'Title is required',
  'create_expense should fail if title is empty'
);

-- Test create_expense function: RLS (should not allow unauthenticated)
select tests.clear_authentication();
select throws_ok(
  $$ select public.create_expense('Should Fail', 'No auth') $$,
  'permission denied for function create_expense',
  'create_expense should not allow unauthenticated users'
);

-- (Receipts storage and policy tests moved to 02-receipts.sql)

SELECT *
FROM finish();

ROLLBACK;