BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(5);

-- Test bucket existence
select is(
  (select count(*)::int from storage.buckets where id = 'receipts'),
  1::int,
  'Receipts storage bucket should exist'
);

-- Setup multi-user scenario for cross-user testing
SELECT synapse_tests.setup_multi_user_scenario() as users \gset

-- Test: User can upload receipt for their own expense
select tests.authenticate_as('user1');

select lives_ok(
  format($$ insert into storage.objects (bucket_id, name, owner_id)
     values ('receipts', concat('%s/', '%s', '/receipt1.png'), '%s') $$,
     current_setting('test.user1_id'),
     current_setting('test.user1_expense_id'),
     current_setting('test.user1_id')),
  'User can upload receipt for their own expense'
);

-- Test: User cannot upload receipt with another user as owner
select throws_ok(
  format($$ insert into storage.objects (bucket_id, name, owner_id)
     values ('receipts', concat('%s/', '%s', '/receipt2.png'), '%s') $$,
     current_setting('test.user2_id'),
     current_setting('test.user1_expense_id'),
     current_setting('test.user1_id')),
  'new row violates row-level security policy for table "objects"',
  'User cannot upload receipt for another user'
);

-- Test: User can view their own receipts
select is(
  (select count(*)::int from storage.objects where name like concat(current_setting('test.user1_id'), '/%')),
  1::int,
  'User can view their own receipts'
);

-- Test: User cannot view another user's receipts
select tests.authenticate_as('user2');
select is(
  (select count(*)::int from storage.objects where name like concat(current_setting('test.user1_id'), '/%')),
  0::int,
  'User cannot view receipts belonging to another user'
);

SELECT *
FROM finish();

ROLLBACK;