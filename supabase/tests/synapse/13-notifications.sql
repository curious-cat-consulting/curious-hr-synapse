BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(32);

-- Test schema and table existence
select has_schema('synapse', 'Synapse schema should exist');
select has_table('synapse', 'notifications', 'Synapse notifications table should exist');

-- Test enum types
select has_type('synapse', 'notification_type', 'Notification type enum should exist');
select has_type('synapse', 'notification_status', 'Notification status enum should exist');

select enum_has_labels('synapse', 'notification_type', 
    ARRAY['EXPENSE_CREATED', 'EXPENSE_ANALYZED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'RECEIPT_PROCESSED', 'TEAM_INVITATION', 'TEAM_MEMBER_ADDED', 'TEAM_MEMBER_REMOVED', 'POSTING_TEAM_UPDATED', 'GENERAL'],
    'Notification type enum should have correct labels');

select enum_has_labels('synapse', 'notification_status', 
    ARRAY['UNREAD', 'READ'],
    'Notification status enum should have correct labels');

-- Test function existence
select function_returns('synapse', 'create_notification', ARRAY['synapse.notification_type', 'text', 'text', 'uuid', 'jsonb']::text[], 'json',
    'create_notification function should exist and return json');

select function_returns('public', 'get_notifications', ARRAY['integer', 'integer']::text[], 'json',
    'get_notifications function should exist and return json');

select function_returns('public', 'get_unread_notification_count', ARRAY[]::text[], 'integer',
    'get_unread_notification_count function should exist and return integer');

-- Test RLS is enabled
select tests.rls_enabled('synapse', 'notifications');

-- Test that RLS policies exist
select policies_are('synapse', 'notifications', 
    ARRAY['Users can view their own notifications', 'Users can insert their own notifications', 'Users can update their own notifications', 'Users can delete their own notifications'],
    'Should have the correct RLS policies');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Test as authenticated user
select tests.authenticate_as('test1');

-- Test 1: Create notification
select lives_ok(
  $$ select synapse.create_notification(
    'EXPENSE_ANALYZED'::synapse.notification_type,
    'Test Notification',
    'This is a test notification',
    tests.get_supabase_uid('test1'),
    '{"expense_id": "123e4567-e89b-12d3-a456-426614174000"}'::jsonb
  ) $$,
  'Should be able to create a notification'
);

-- Test 2: Verify notification was created
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  1,
  'Should have created one notification'
);

-- Test 3: Verify notification details
select is(
  (select title from synapse.notifications where user_id = tests.get_supabase_uid('test1') limit 1),
  'Test Notification',
  'Notification should have correct title'
);

-- Test 4: Get notifications
select lives_ok(
  $$ select public.get_notifications(10, 0) $$,
  'Should be able to get notifications'
);

-- Test 5: Get unread count
select is(
  (select public.get_unread_notification_count()),
  1,
  'Should have 1 unread notification'
);

-- Test 6: Mark notification as read
select lives_ok(
  $$ select public.mark_notification_read(
    (select id from synapse.notifications where user_id = tests.get_supabase_uid('test1') limit 1)
  ) $$,
  'Should be able to mark notification as read'
);

-- Test 7: Verify unread count is 0
select is(
  (select public.get_unread_notification_count()),
  0,
  'Should have 0 unread notifications after marking as read'
);

-- Test 8: Create another notification
select lives_ok(
  $$ select synapse.create_notification(
    'EXPENSE_CREATED'::synapse.notification_type,
    'Another Test',
    'Another test notification',
    tests.get_supabase_uid('test1'),
    '{}'::jsonb
  ) $$,
  'Should be able to create another notification'
);

-- Test 9: Mark all as read
select lives_ok(
  $$ select public.mark_all_notifications_read() $$,
  'Should be able to mark all notifications as read'
);

-- Test 10: Verify all are read
select is(
  (select public.get_unread_notification_count()),
  0,
  'Should have 0 unread notifications after marking all as read'
);

-- Test 11: Delete notification
select lives_ok(
  $$ select public.delete_notification(
    (select id from synapse.notifications where user_id = tests.get_supabase_uid('test1') limit 1)
  ) $$,
  'Should be able to delete a notification'
);

-- Test 12: Verify notification was deleted
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  1,
  'Should have 1 notification remaining after deletion'
);

-- Test 13: Test cross-user isolation
select tests.authenticate_as('test2');

select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test2')),
  0,
  'User 2 should not see user 1 notifications'
);

-- Test 14: Create notification for user 2
select lives_ok(
  $$ select synapse.create_notification(
    'GENERAL'::synapse.notification_type,
    'User 2 Notification',
    'This is for user 2',
    tests.get_supabase_uid('test2'),
    '{}'::jsonb
  ) $$,
  'Should be able to create notification for user 2'
);

-- Test 15: Verify user 2 has their own notification
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test2')),
  1,
  'User 2 should have their own notification'
);

-- Test 16: Create multiple notifications for user 2
select lives_ok(
  $$ select synapse.create_notification(
    'EXPENSE_APPROVED'::synapse.notification_type,
    'User 2 Notification 2',
    'This is another notification for user 2',
    tests.get_supabase_uid('test2'),
    '{}'::jsonb
  ) $$,
  'Should be able to create another notification for user 2'
);

select lives_ok(
  $$ select synapse.create_notification(
    'EXPENSE_REJECTED'::synapse.notification_type,
    'User 2 Notification 3',
    'This is a third notification for user 2',
    tests.get_supabase_uid('test2'),
    '{}'::jsonb
  ) $$,
  'Should be able to create a third notification for user 2'
);

-- Test 17: Verify user 2 has 3 notifications
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test2')),
  3,
  'User 2 should have 3 notifications before delete all'
);

-- Test 18: Delete all notifications for user 2
select lives_ok(
  $$ select public.delete_all_notifications() $$,
  'Should be able to delete all notifications for user 2'
);

-- Test 19: Verify all notifications were deleted for user 2
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test2')),
  0,
  'User 2 should have 0 notifications after delete all'
);

-- Test 20: Verify user 1 notifications are unaffected
select tests.authenticate_as('test1');
select is(
  (select count(*)::int from synapse.notifications where user_id = tests.get_supabase_uid('test1')),
  1,
  'User 1 should still have their notification after user 2 deleted all'
);

SELECT *
FROM finish();

ROLLBACK; 