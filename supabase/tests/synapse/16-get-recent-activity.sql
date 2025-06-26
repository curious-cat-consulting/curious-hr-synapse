BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(7);

-- make sure we're setup for the test correctly
update basejump.config
set enable_team_accounts = true;

--- we insert a user into auth.users and return the id into user_id to use
select tests.create_supabase_user('test1');
select tests.create_supabase_user('test2');

------------
--- Test 1: Function exists and has correct signature
------------
select has_function('public', 'get_recent_activity', ARRAY['uuid'], 'get_recent_activity function should exist');

------------
--- Test 2: Personal account test - no account_id provided
------------
select tests.authenticate_as('test1');

-- Create some test expenses for the user using the proper function
insert into synapse.expenses (id, title, description, amount, status, user_id, account_id, account_expense_id)
values 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Expense 1', 'Test Description 1', 100.00, 'NEW'::synapse.expense_status, tests.get_supabase_uid('test1'), tests.get_supabase_uid('test1'), 1),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Test Expense 2', 'Test Description 2', 200.00, 'PENDING'::synapse.expense_status, tests.get_supabase_uid('test1'), tests.get_supabase_uid('test1'), 2),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Test Expense 3', 'Test Description 3', 300.00, 'APPROVED'::synapse.expense_status, tests.get_supabase_uid('test1'), tests.get_supabase_uid('test1'), 3);

-- Test function call without account_id (should return user's expenses)
select results_eq(
  $$ SELECT COUNT(*) FROM get_recent_activity(NULL) $$,
  $$ VALUES (3::bigint) $$,
  'get_recent_activity should return user expenses when account_id is NULL'
);

------------
--- Test 3: Team account test - with account_id provided
------------
-- Create a team account
select create_account('test-team', 'Test Team');

-- Get the team account ID
DO $$
BEGIN
  PERFORM set_config('test.team_account_id', (select id::text from basejump.accounts where slug = 'test-team'), false);
END $$;

-- Re-authenticate as test1
select tests.authenticate_as('test1');

-- Create team expenses
insert into synapse.expenses (id, title, description, amount, status, user_id, account_id, account_expense_id, created_at)
values 
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Team Expense 1', 'Team Description 1', 150.00, 'NEW'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 1, now() - interval '1 hour'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Team Expense 2', 'Team Description 2', 250.00, 'PENDING'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 2, now());

-- Test function call with account_id (should return team expenses)
select results_eq(
  $$ SELECT COUNT(*) FROM get_recent_activity(current_setting('test.team_account_id')::uuid) $$,
  $$ VALUES (2::bigint) $$,
  'get_recent_activity should return team expenses when account_id is provided'
);

------------
--- Test 4: Verify ordering (most recent first)
------------
select results_eq(
  $$ SELECT title FROM get_recent_activity(current_setting('test.team_account_id')::uuid) LIMIT 1 $$,
  $$ VALUES ('Team Expense 2'::text) $$,
  'get_recent_activity should return expenses ordered by created_at DESC'
);

------------
--- Test 5: Verify limit (max 5 results)
------------
-- Create more than 5 expenses
insert into synapse.expenses (id, title, description, amount, status, user_id, account_id, account_expense_id, created_at)
values 
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Team Expense 3', 'Team Description 3', 350.00, 'APPROVED'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 3, now() - interval '30 minutes'),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'Team Expense 4', 'Team Description 4', 450.00, 'REJECTED'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 4, now() - interval '15 minutes'),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'Team Expense 5', 'Team Description 5', 550.00, 'ANALYZED'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 5, now() - interval '5 minutes'),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'Team Expense 6', 'Team Description 6', 650.00, 'NEW'::synapse.expense_status, tests.get_supabase_uid('test1'), current_setting('test.team_account_id')::uuid, 6, now() - interval '1 minute');

select results_eq(
  $$ SELECT COUNT(*) FROM get_recent_activity(current_setting('test.team_account_id')::uuid) $$,
  $$ VALUES (5::bigint) $$,
  'get_recent_activity should limit results to 5'
);

------------
--- Test 6: Verify status is returned as text
------------
select results_eq(
  $$ SELECT status FROM get_recent_activity(current_setting('test.team_account_id')::uuid) WHERE title = 'Team Expense 3' $$,
  $$ VALUES ('APPROVED'::text) $$,
  'get_recent_activity should return status as text'
);

------------
--- Test 7: Test access control - user without access to team
------------
select tests.authenticate_as('test2');

select results_eq(
  $$ SELECT COUNT(*) FROM get_recent_activity(current_setting('test.team_account_id')::uuid) $$,
  $$ VALUES (0::bigint) $$,
  'get_recent_activity should return no results for users without access to team'
);

SELECT * FROM finish();
ROLLBACK; 