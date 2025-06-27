BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(12);

-- Test function existence
select function_returns('synapse', 'handle_expense_status_change', ARRAY[]::text[], 'trigger',
    'handle_expense_status_change function should exist and return trigger');

-- Test trigger existence
select trigger_is('synapse', 'expenses', 'expense_status_notification_trigger', 'synapse', 'handle_expense_status_change',
    'expense_status_notification_trigger should exist on synapse.expenses table');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Test as authenticated user
select tests.authenticate_as('test1');

-- Create a test expense and capture the ID
SELECT (synapse_tests.create_random_expense('test1@test.com', 'Test Expense for Notifications', 'Test Description')->>'id') as expense1_id \gset

-- Test 1: Verify initial notification count is 1 (EXPENSE_CREATED notification)
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  1,
  'Should have 1 notification initially (EXPENSE_CREATED)'
);

-- Test 2: Update expense status to APPROVED
SELECT public.update_expense_status(:'expense1_id'::uuid, 'APPROVED'::synapse.expense_status);

-- Test 3: Verify notification was created for APPROVED status (should now have 2 total)
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  2,
  'Should have 2 notifications after approving expense (EXPENSE_CREATED + EXPENSE_APPROVED)'
);

-- Test 4: Verify notification details for APPROVED
select is(
  (select type::text from synapse.notifications where user_id = tests.get_supabase_uid('test1') and type = 'EXPENSE_APPROVED' limit 1),
  'EXPENSE_APPROVED',
  'Notification should have correct type for APPROVED status'
);

select is(
  (select title from synapse.notifications where user_id = tests.get_supabase_uid('test1') and type = 'EXPENSE_APPROVED' limit 1),
  'Expense Approved',
  'Notification should have correct title for APPROVED status'
);

-- Test 5: Update expense status to REJECTED
SELECT public.update_expense_status(:'expense1_id'::uuid, 'REJECTED'::synapse.expense_status);

-- Test 6: Verify notification was created for REJECTED status (should now have 3 total)
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  3,
  'Should have 3 notifications after rejecting expense (EXPENSE_CREATED + EXPENSE_APPROVED + EXPENSE_REJECTED)'
);

-- Test 7: Verify notification details for REJECTED
select is(
  (select type::text from synapse.notifications where user_id = tests.get_supabase_uid('test1') and type = 'EXPENSE_REJECTED' limit 1),
  'EXPENSE_REJECTED',
  'Notification should have correct type for REJECTED status'
);

-- Test 8: Verify notification metadata contains expense details
select is(
  (select (metadata->>'expense_id')::text from synapse.notifications where user_id = tests.get_supabase_uid('test1') and type = 'EXPENSE_REJECTED' limit 1),
  :'expense1_id',
  'Notification metadata should contain correct expense_id'
);

-- Test 9: Update expense status to PENDING (should not create notification)
SELECT public.update_expense_status(:'expense1_id'::uuid, 'PENDING'::synapse.expense_status);

-- Test 10: Verify no additional notification was created for PENDING (should still have 3)
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  3,
  'Should still have 3 notifications after setting status to PENDING (no notification for PENDING)'
);

-- Test 11: Verify notifications are isolated to the correct user
select tests.authenticate_as('test2');
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test2')),
  0,
  'User 2 should not see user 1 notifications'
);

-- Test 12: Verify notification message format (use position() instead of like)
select tests.authenticate_as('test1');
select ok(
  (select position('Test Expense for Notifications' in message) from synapse.notifications where type = 'EXPENSE_APPROVED' limit 1) > 0,
  'Notification message should contain expense title'
);

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 