BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(15);

-- make sure we're setup for enabling team accounts
update basejump.config
set enable_team_accounts = true;

-- Create test users
select tests.create_supabase_user('test_user_1');
select tests.create_supabase_user('test_user_2');
select tests.create_supabase_user('test_user_3');

------------
--- Test 1: Team Creation Trigger - User with no posting team creates a team
------------
select tests.authenticate_as('test_user_1');

-- Create a new team
SELECT row_eq(
  $$ insert into basejump.accounts (id, name, slug, personal_account) 
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Team 1', 'test-team-1', false) 
     returning 1 $$,
  ROW (1),
  'Should be able to create a new team account'
);

-- Check that the team was set as posting team
SELECT row_eq(
  $$ select (public_metadata->>'posting_team_id')::uuid 
     from basejump.accounts 
     where primary_owner_user_id = tests.get_supabase_uid('test_user_1') 
       and personal_account = true $$,
  ROW ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  'New team should be set as posting team when user has no posting team'
);

-- Check that team creation notification was created
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_1') 
       and account_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid 
       and type = 'TEAM_MEMBER_ADDED' $$,
  ROW (1),
  'Should create team creation notification'
);

-- Check that posting team update notification was created (via the second trigger)
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_1') 
       and account_id = (select id from basejump.accounts where primary_owner_user_id = tests.get_supabase_uid('test_user_1') and personal_account = true)
       and type = 'POSTING_TEAM_UPDATED' $$,
  ROW (1),
  'Should create posting team update notification when posting team is set'
);

------------
--- Test 2: Team Creation Trigger - User with existing posting team creates another team
------------
select tests.authenticate_as('test_user_2');

-- Create first team (should become posting team)
SELECT row_eq(
  $$ insert into basejump.accounts (id, name, slug, personal_account) 
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Team 2', 'test-team-2', false) 
     returning 1 $$,
  ROW (1),
  'Should be able to create first team account'
);

-- Create second team (should NOT become posting team)
SELECT row_eq(
  $$ insert into basejump.accounts (id, name, slug, personal_account) 
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Team 3', 'test-team-3', false) 
     returning 1 $$,
  ROW (1),
  'Should be able to create second team account'
);

-- Check that first team is still the posting team
SELECT row_eq(
  $$ select (public_metadata->>'posting_team_id')::uuid 
     from basejump.accounts 
     where primary_owner_user_id = tests.get_supabase_uid('test_user_2') 
       and personal_account = true $$,
  ROW ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  'First team should remain as posting team when second team is created'
);

-- Check that both teams have creation notifications
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_2') 
       and type = 'TEAM_MEMBER_ADDED' $$,
  ROW (2),
  'Should create team creation notifications for both teams'
);

-- Check that only one posting team update notification was created (for first team)
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_2') 
       and type = 'POSTING_TEAM_UPDATED' $$,
  ROW (1),
  'Should only create posting team update notification for first team'
);

------------
--- Test 3: Posting Team Change Trigger - Manual posting team update
------------
select tests.authenticate_as('test_user_3');

-- Create two teams first
SELECT row_eq(
  $$ insert into basejump.accounts (id, name, slug, personal_account) 
     values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Test Team 4', 'test-team-4', false) 
     returning 1 $$,
  ROW (1),
  'Should be able to create first team account'
);

SELECT row_eq(
  $$ insert into basejump.accounts (id, name, slug, personal_account) 
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Test Team 5', 'test-team-5', false) 
     returning 1 $$,
  ROW (1),
  'Should be able to create second team account'
);

-- Get personal account ID
SELECT set_config('test.personal_account_id', 
  (select id::text from basejump.accounts where primary_owner_user_id = tests.get_supabase_uid('test_user_3') and personal_account = true), 
  false);

-- Count notifications before manual update
SELECT set_config('test.notifications_before', 
  (select count(*)::text from synapse.notifications where user_id = tests.get_supabase_uid('test_user_3') and type = 'POSTING_TEAM_UPDATED'), 
  false);

-- Manually update posting team to second team
SELECT row_eq(
  $$ update basejump.accounts 
     set public_metadata = jsonb_build_object('posting_team_id', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid)
     where id = current_setting('test.personal_account_id')::uuid 
     returning 1 $$,
  ROW (1),
  'Should be able to manually update posting team'
);

-- Check that posting team change notification was created
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_3') 
       and account_id = current_setting('test.personal_account_id')::uuid
       and type = 'POSTING_TEAM_UPDATED' $$,
  ROW ((current_setting('test.notifications_before')::integer + 1)),
  'Should create posting team update notification when manually changed'
);

-- DEBUG: Print all posting team update notifications for test_user_3's personal account
SELECT * FROM synapse.notifications 
WHERE user_id = tests.get_supabase_uid('test_user_3') 
  AND type = 'POSTING_TEAM_UPDATED' 
  AND account_id = current_setting('test.personal_account_id')::uuid
ORDER BY created_at;

-- DEBUG: Print all TEAM_MEMBER_ADDED notifications for test_user_1 and the new team
SELECT * FROM synapse.notifications 
WHERE user_id = tests.get_supabase_uid('test_user_1') 
  AND type = 'TEAM_MEMBER_ADDED' 
  AND account_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
ORDER BY created_at;

------------
--- Test 4: Posting Team Change Trigger - No notification when metadata doesn't change
------------
-- Count notifications before update
SELECT set_config('test.notifications_before_other', 
  (select count(*)::text from synapse.notifications where user_id = tests.get_supabase_uid('test_user_3') and type = 'POSTING_TEAM_UPDATED'), 
  false);

-- Update something else in metadata (not posting_team_id)
SELECT row_eq(
  $$ update basejump.accounts 
     set public_metadata = public_metadata || '{"other_field": "test_value"}'::jsonb
     where id = current_setting('test.personal_account_id')::uuid 
     returning 1 $$,
  ROW (1),
  'Should be able to update other metadata fields'
);

-- Check that no additional posting team notification was created
SELECT row_eq(
  $$ select count(*)::integer 
     from synapse.notifications 
     where user_id = tests.get_supabase_uid('test_user_3') 
       and type = 'POSTING_TEAM_UPDATED' $$,
  ROW (current_setting('test.notifications_before_other')::integer),
  'Should not create posting team notification when posting_team_id does not change'
);

SELECT * FROM finish();
ROLLBACK; 