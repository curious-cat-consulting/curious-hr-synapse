BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(8);

-- Test function existence
select function_returns('public', 'get_team_analytics', ARRAY['text'], 'json',
    'get_team_analytics function should exist and return json');

-- Create test users
select tests.create_supabase_user('team_owner', 'owner@test.com');
select tests.create_supabase_user('team_member1', 'member1@test.com');
select tests.create_supabase_user('team_member2', 'member2@test.com');
select tests.create_supabase_user('non_member', 'nonmember@test.com');

-- Setup team account and members
select tests.authenticate_as('team_owner');

-- Create team account
insert into basejump.accounts (id, name, slug, personal_account)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Team', 'test-team-analytics', false);

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
select tests.authenticate_as('team_member1');
select public.create_expense('Member 1 Expense 1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 1');
update synapse.expenses set created_at = now() - interval '2 days' where title = 'Member 1 Expense 1' and user_id = tests.get_supabase_uid('team_member1');
select public.create_expense('Member 1 Expense 2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 2');
update synapse.expenses set created_at = now() - interval '1 day' where title = 'Member 1 Expense 2' and user_id = tests.get_supabase_uid('team_member1');

select tests.authenticate_as('team_member2');
select public.create_expense('Member 2 Expense 1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test expense 3');
update synapse.expenses set created_at = now() where title = 'Member 2 Expense 1' and user_id = tests.get_supabase_uid('team_member2');

-- Test as team owner - should be able to view analytics
select tests.authenticate_as('team_owner');

select lives_ok(
  $$ select public.get_team_analytics('test-team-analytics') $$,
  'Team owner should be able to access team analytics'
);

-- Test that analytics data structure is correct
select is(
  json_typeof(public.get_team_analytics('test-team-analytics')),
  'object',
  'Should return JSON object with analytics data'
);

-- Test that overview data is present
select ok(
  (public.get_team_analytics('test-team-analytics'))->'overview' IS NOT NULL,
  'Analytics should include overview data'
);

-- Test that status breakdown is present
select ok(
  (public.get_team_analytics('test-team-analytics'))->'status_breakdown' IS NOT NULL,
  'Analytics should include status breakdown data'
);

-- Test as team member - should NOT be able to access team analytics
select tests.authenticate_as('team_member1');

select throws_ok(
  $$ select public.get_team_analytics('test-team-analytics') $$,
  'Only account owners can access this function',
  'Team members should not be able to access get_team_analytics'
);

-- Test as non-member - should NOT be able to access team analytics
select tests.authenticate_as('non_member');

select throws_ok(
  $$ select public.get_team_analytics('test-team-analytics') $$,
  'Only account owners can access this function',
  'Non-members should not be able to access get_team_analytics'
);

-- Test with non-existent team slug
select tests.authenticate_as('team_owner');

select throws_ok(
  $$ select public.get_team_analytics('non-existent-team') $$,
  'Account not found',
  'Should throw error for non-existent team slug'
);

SELECT *
FROM finish();

ROLLBACK; 