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

-- Test table columns (now includes account_id and account_expense_id)
select columns_are('synapse', 'expenses',
    ARRAY['id', 'account_expense_id', 'user_id', 'account_id', 'title', 'amount', 'description', 'status', 'created_at', 'updated_at'],
    'Expenses table should have the correct columns');

-- Test function existence
select function_returns('public', 'get_expenses', ARRAY[]::text[], 'json',
    'get_expenses function should exist and return json');

-- Test RLS is enabled
select tests.rls_enabled('synapse', 'expenses');

-- Test that RLS policies exist (updated for account-based policies)
select policies_are('synapse', 'expenses', 
    ARRAY['Users can view their own expenses', 'Users can insert expenses for their account', 'Users can update their account expenses', 'Team owners can view member expenses'],
    'Should have the correct RLS policies');

-- === CRUD TESTS USING HELPERS ===

-- Test CREATE policy using helper
SELECT synapse_tests.create_random_expense('test1@test.com', 'Test Expense', 'Test Description') as expense1 \gset

select ok((:'expense1'::json->>'id') IS NOT NULL, 'User should be able to create their own expense');
select is((:'expense1'::json->>'title')::text, 'Test Expense', 'Expense should have correct title');

-- Test READ policy - should see own expense
select tests.authenticate_as('test1');
select is(
    (select count(*)::int from synapse.expenses),
    1,
    'User should be able to see their own expense'
);

-- Test UPDATE policy using helper
SELECT (:'expense1'::json->>'id')::uuid as expense_id \gset
update synapse.expenses set title = 'Updated Expense' where id = :'expense_id';
select ok(true, 'User should be able to update their own expense');

select is(
    (select title from synapse.expenses where id = :'expense_id'),
    'Updated Expense',
    'Expense title should be updated'
);

-- === MULTI-USER SECURITY TESTS USING HELPER ===

-- Setup multi-user scenario for RLS testing
SELECT synapse_tests.setup_multi_user_scenario() as users \gset

-- Test cross-user access restrictions
select tests.authenticate_as('user1');
select is(
    (select count(*)::int from synapse.expenses WHERE id = current_setting('test.user2_expense_id')::uuid),
    0,
    'User1 should not see User2 expenses'
);

select tests.authenticate_as('user2');
select is(
    (select count(*)::int from synapse.expenses WHERE id = current_setting('test.user1_expense_id')::uuid),
    0,
    'User2 should not see User1 expenses'
);

-- Test unauthorized account insertion
select tests.authenticate_as('user1');
select throws_ok(
    $$ insert into synapse.expenses (user_id, account_id, account_expense_id, title, amount, description, status)
       values (current_setting('test.user1_id')::uuid, current_setting('test.user2_id')::uuid, 1, 'Malicious Expense', 50.00, 'Should fail', 'NEW') $$,
    'new row violates row-level security policy for table "expenses"',
    'User should not be able to insert expense for another user account'
);

-- === ANONYMOUS ACCESS TESTS ===

select tests.clear_authentication();

select throws_ok(
    'select * from synapse.expenses',
    'permission denied for schema synapse',
    'Anonymous users should not have access to synapse schema'
);

select throws_ok(
    $$ insert into synapse.expenses (user_id, account_id, account_expense_id, title, amount, description, status)
       values ('11111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 1, 'Anonymous Expense', 25.00, 'Should fail', 'NEW') $$,
    'permission denied for schema synapse',
    'Anonymous users should not be able to insert expenses'
);

-- === ORDER BY TESTS USING HELPERS ===

-- Create a single user for the ordering test
select tests.create_supabase_user('ordertest', 'ordertest@test.com');
select tests.authenticate_as('ordertest');

-- Create multiple expenses with different timestamps for ordering test
INSERT INTO synapse.expenses (user_id, account_id, account_expense_id, title, description, status, amount, created_at)
VALUES 
  (tests.get_supabase_uid('ordertest'), tests.get_supabase_uid('ordertest'), 10, 'Expense 1', 'First expense', 'NEW', 100.00, now() - interval '2 days'),
  (tests.get_supabase_uid('ordertest'), tests.get_supabase_uid('ordertest'), 11, 'Expense 2', 'Second expense', 'NEW', 200.00, now() - interval '1 day'),
  (tests.get_supabase_uid('ordertest'), tests.get_supabase_uid('ordertest'), 12, 'Expense 3', 'Third expense', 'NEW', 300.00, now());

select results_eq(
  $$ select (json_array_elements(public.get_expenses())->>'title')::text $$,
  ARRAY['Expense 3', 'Expense 2', 'Expense 1'],
  'get_expenses should return expenses in descending order by created_at'
);

-- === FUNCTION VALIDATION TESTS ===

select tests.authenticate_as('ordertest');

-- Test create_expense function: success
select lives_ok(
  $$ select public.create_expense('API Expense', tests.get_supabase_uid('ordertest'), 'Created via API') $$,
  'create_expense should succeed with valid input'
);

select is(
  (select (public.create_expense('API Expense 2', tests.get_supabase_uid('ordertest'), null))->>'title'),
  'API Expense 2',
  'create_expense should use title if description is null'
);

-- Test create_expense function: validation
select throws_ok(
  $$ select public.create_expense('', tests.get_supabase_uid('ordertest'), 'No title') $$,
  'Title is required',
  'create_expense should fail if title is empty'
);

-- Test create_expense function: RLS (should not allow unauthenticated)
select tests.clear_authentication();
select throws_ok(
  $$ select public.create_expense('Should Fail', tests.get_supabase_uid('ordertest'), 'No auth') $$,
  'permission denied for function create_expense',
  'create_expense should not allow unauthenticated users'
);

SELECT *
FROM finish();

ROLLBACK;