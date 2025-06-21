BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(5);

-- Bucket existence
select is(
  (select count(*)::int from storage.buckets where id = 'receipts'),
  1::int,
  'Receipts storage bucket should exist'
);

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Authenticated user can insert into receipts bucket for their own user id
select tests.authenticate_as('test1');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('receipts', concat(tests.get_supabase_uid('test1'), '/expenseid/receipt1.png'), tests.get_supabase_uid('test1')) $$,
  'User can upload receipt for their own expense'
);

-- Authenticated user cannot insert into receipts bucket for another user
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('receipts', concat(tests.get_supabase_uid('test2'), '/expenseid/receipt2.png'), tests.get_supabase_uid('test1')) $$,
  'new row violates row-level security policy for table "objects"',
  'User cannot upload receipt for another user'
);

-- Authenticated user can select their own receipt
select is(
  (select count(*)::int from storage.objects where name like concat(tests.get_supabase_uid('test1'), '/%')),
  1::int,
  'User can view their own receipts'
);

-- Authenticated user cannot select another user''s receipt
select tests.authenticate_as('test2');
select is(
  (select count(*)::int from storage.objects where name like concat(tests.get_supabase_uid('test1'), '/%')),
  0::int,
  'User cannot view receipts belonging to another user'
);

SELECT *
FROM finish();

ROLLBACK; 