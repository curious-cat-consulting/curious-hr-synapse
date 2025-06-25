BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(13);

-- Test function existence
select function_returns('public', 'get_team_expenses', ARRAY['text'], 'json',
    'get_team_expenses function should exist and return json');

-- Create test users
select tests.create_supabase_user('team_owner', 'owner@test.com');
select tests.create_supabase_user('team_member1', 'member1@test.com');
select tests.create_supabase_user('team_member2', 'member2@test.com');
select tests.create_supabase_user('non_member', 'nonmember@test.com');

-- Setup team account and members
select tests.authenticate_as('team_owner');

-- Create team account
insert into basejump.accounts (id, name, slug, personal_account)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Team', 'test-team-unique', false);

-- Add team members (using postgres role to bypass RLS)
select tests.clear_authentication();
set role postgres;

insert into basejump.account_user (account_id, account_role, user_id)
values 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', tests.get_supabase_uid('team_member1')),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', tests.get_supabase_uid('team_member2'));

-- Create personal accounts for team members
insert into basejump.accounts (id, name, slug, personal_account, primary_owner_user_id)
values 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Member 1 Personal', NULL, true, tests.get_supabase_uid('team_member1')),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Member 2 Personal', NULL, true, tests.get_supabase_uid('team_member2'));

-- Create test expenses for team members
insert into synapse.expenses (user_id, account_id, title, amount, description, status, created_at)
values 
  (tests.get_supabase_uid('team_member1'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Member 1 Expense 1', 100.00, 'Test expense 1', 'NEW', now() - interval '2 days'),
  (tests.get_supabase_uid('team_member1'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Member 1 Expense 2', 200.00, 'Test expense 2', 'PENDING', now() - interval '1 day'),
  (tests.get_supabase_uid('team_member2'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Member 2 Expense 1', 150.00, 'Test expense 3', 'APPROVED', now());

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
select tests.authenticate_as('team_member1');

select throws_ok(
  $$ select public.get_team_expenses('test-team-unique') $$,
  'Only account owners can access this function',
  'Team members should not be able to access get_team_expenses'
);

-- Test as non-member - should NOT be able to access team expenses
select tests.authenticate_as('non_member');

select throws_ok(
  $$ select public.get_team_expenses('test-team-unique') $$,
  'Only account owners can access this function',
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

-- No need to insert owner into account_user; already added by account creation

select is((select public.get_team_expenses('empty-team-unique')::text), '[]', 'Should return empty array when team has no expenses');

SELECT *
FROM finish();

ROLLBACK; 