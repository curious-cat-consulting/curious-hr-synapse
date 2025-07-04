BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(13);

-- Test function existence
select function_returns('public', 'get_team_expenses', ARRAY['text'], 'json',
    'get_team_expenses function should exist and return json');

-- Setup team and create expenses using helpers where possible
-- Note: Users will be created automatically by synapse_tests.create_random_expense()

-- Create team account (manual - no helper exists for this)
-- First, create the team owner user manually since we need to authenticate as them
select tests.create_supabase_user('team_owner', 'owner@test.com');
select tests.create_supabase_user('non_member', 'nonmember@test.com');

select tests.authenticate_as('team_owner');

-- Create team account
insert into basejump.accounts (id, name, slug, personal_account)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Team', 'test-team-unique', false);

-- Create member users first, then add them to team
select tests.create_supabase_user('member1', 'member1@test.com');
select tests.create_supabase_user('member2', 'member2@test.com');

-- Add team members (using postgres role to bypass RLS)
select tests.clear_authentication();
set role postgres;

insert into basejump.account_user (account_id, account_role, user_id)
values 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', tests.get_supabase_uid('member1')),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', tests.get_supabase_uid('member2'));

-- Create personal accounts for team members
insert into basejump.accounts (id, name, slug, personal_account, primary_owner_user_id)
values 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Member 1 Personal', NULL, true, tests.get_supabase_uid('member1')),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Member 2 Personal', NULL, true, tests.get_supabase_uid('member2'));

-- Reset role
reset role;

-- Now create expenses directly for the team account (members can now access it)
select tests.authenticate_as('member1');

-- Create expenses directly for the team account
select public.create_expense('Member 1 Expense 1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 1');
update synapse.expenses set created_at = now() - interval '2 days' where title = 'Member 1 Expense 1' and user_id = tests.get_supabase_uid('member1');

select public.create_expense('Member 1 Expense 2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 2');
update synapse.expenses set created_at = now() - interval '1 day' where title = 'Member 1 Expense 2' and user_id = tests.get_supabase_uid('member1');

select tests.authenticate_as('member2');

select public.create_expense('Member 2 Expense 1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 3');
update synapse.expenses set created_at = now() where title = 'Member 2 Expense 1' and user_id = tests.get_supabase_uid('member2');

-- Test as team owner - should be able to view all member expenses
select tests.authenticate_as('team_owner');

select results_eq(
  $$ select json_array_length(public.get_team_expenses('test-team-unique')) $$,
  $$ values(3) $$,
  'Team owner should be able to view all member expenses'
);

-- Test that expenses are returned in correct order (descending by created_at)
select results_eq(
  $$ select (json_array_elements(public.get_team_expenses('test-team-unique'))->>'title')::text $$,
  ARRAY['Member 2 Expense 1', 'Member 1 Expense 2', 'Member 1 Expense 1'],
  'Team expenses should be returned in descending order by created_at'
);

-- Test that expense data structure is correct
select is(
  (select (public.get_team_expenses('test-team-unique')->0->>'id')::uuid),
  (select id from synapse.expenses where title = 'Member 2 Expense 1'),
  'First expense should have correct ID'
);

select is(
  (select public.get_team_expenses('test-team-unique')->0->>'title'),
  'Member 2 Expense 1',
  'First expense should have correct title'
);

select is(
  (select public.get_team_expenses('test-team-unique')->0->>'user_name'),
  'member2',
  'First expense should have correct user name'
);

-- Test as team member - should NOT be able to access team expenses
select tests.authenticate_as('member1');

select throws_ok(
  $$ select public.get_team_expenses('test-team-unique') $$,
  'Only account owners can access this function',
  'Team members should not be able to access get_team_expenses'
);

-- Test as non-member - should NOT be able to access team expenses
select tests.authenticate_as('non_member');

select throws_ok(
  $$ select public.get_team_expenses('test-team-unique') $$,
  'Account not found',
  'Non-members should not be able to access get_team_expenses'
);

-- Test with non-existent team slug
select tests.authenticate_as('team_owner');

select throws_ok(
  $$ select public.get_team_expenses('non-existent-team') $$,
  'Account not found',
  'Should throw error for non-existent team slug'
);

-- Test with empty team slug
select throws_ok(
  $$ select public.get_team_expenses('') $$,
  'Account not found',
  'Should throw error for empty team slug'
);

-- Test with null team slug
select throws_ok(
  $$ select public.get_team_expenses(null) $$,
  'Account not found',
  'Should throw error for null team slug'
);

-- Test as unauthenticated user
select tests.clear_authentication();

select throws_ok(
  $$ select public.get_team_expenses('test-team-unique') $$,
  'permission denied for function get_team_expenses',
  'Unauthenticated users should not be able to access get_team_expenses'
);

-- Test that function returns empty array when team has no expenses
select tests.authenticate_as('team_owner');

-- Create another team with no expenses
insert into basejump.accounts (id, name, slug, personal_account)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Empty Team', 'empty-team-unique', false);

select is((select public.get_team_expenses('empty-team-unique')::text), '[]', 'Should return empty array when team has no expenses');

SELECT * FROM finish();
ROLLBACK;