/*
===============================================================================
                              TEAM REMOVAL TRIGGER TESTS
===============================================================================
*/

BEGIN;

-- Test setup
SELECT plan(8);

-- Test 1: Verify the trigger function exists
SELECT has_function('synapse', 'handle_account_user_removal', 'Trigger function should exist');

-- Test 2: Verify the trigger exists
SELECT trigger_is('basejump', 'account_user', 'synapse_account_user_removal_trigger', 'synapse', 'handle_account_user_removal');

-- Test 3: Test removing a user from a team (not their posting team)
SELECT lives_ok(
  $$
    -- Insert user into auth.users first
    INSERT INTO auth.users (id, email) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'testusera@example.com');
    
    -- Create test data with different UUIDs to avoid conflicts
    INSERT INTO basejump.accounts (id, name, personal_account, primary_owner_user_id)
    VALUES 
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Test User A', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
    
    INSERT INTO basejump.accounts (id, name, slug, personal_account, primary_owner_user_id)
    VALUES 
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Team A', 'team-a-test', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Team B', 'team-b-test', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);
    
    -- Set posting team to Team B
    UPDATE basejump.accounts 
    SET public_metadata = jsonb_build_object('posting_team_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid)
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
    
    -- Add user to Team A
    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member');
    
    -- Remove user from Team A (not their posting team)
    DELETE FROM basejump.account_user 
    WHERE account_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid 
    AND user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  $$,
  'Should successfully remove user from team that is not their posting team'
);

-- Test 4: Verify posting team was not affected
SELECT results_eq(
  $$
    SELECT (public_metadata->>'posting_team_id')::uuid
    FROM basejump.accounts
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  $$,
  $$ SELECT 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid $$,
  'Posting team should remain unchanged when removing from non-posting team'
);

-- Test 5: Test removing a user from their posting team
SELECT lives_ok(
  $$
    -- Remove user from Team B (their posting team)
    DELETE FROM basejump.account_user 
    WHERE account_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid 
    AND user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  $$,
  'Should successfully remove user from their posting team'
);

-- Test 6: Verify posting team was cleared
SELECT results_eq(
  $$
    SELECT public_metadata->>'posting_team_id'
    FROM basejump.accounts
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  $$,
  $$ SELECT NULL $$,
  'Posting team should be cleared when removing from posting team'
);

-- Test 7: Verify notification was created for team removal
SELECT results_eq(
  $$
    SELECT COUNT(*)::integer
    FROM synapse.notifications 
    WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid 
    AND type = 'TEAM_MEMBER_REMOVED'::synapse.notification_type
  $$,
  $$ SELECT 2 $$,
  'Should create notifications for both team removals'
);

-- Test 8: Verify notification metadata includes posting team info
SELECT results_eq(
  $$
    SELECT metadata->>'was_posting_team'
    FROM synapse.notifications 
    WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid 
    AND type = 'TEAM_MEMBER_REMOVED'::synapse.notification_type
    AND metadata->>'team_id' = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  $$,
  $$ SELECT 'true' $$,
  'Notification should indicate when removed team was the posting team'
);

-- Cleanup
DELETE FROM synapse.notifications WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
DELETE FROM basejump.accounts WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
);
DELETE FROM auth.users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

SELECT * FROM finish();

ROLLBACK; 