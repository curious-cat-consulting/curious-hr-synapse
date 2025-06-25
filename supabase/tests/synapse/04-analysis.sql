BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(5);

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');

-- Create test expense
select tests.authenticate_as('test1');
INSERT INTO synapse.expenses (id, user_id, account_id, title, description, amount)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  tests.get_supabase_uid('test1'),
  tests.get_supabase_uid('test1'),
  'Test Expense',
  'Test Description',
  100.00
);

-- Test 1: Function exists and is callable
select lives_ok(
  $$ select public.get_receipts_to_process('550e8400-e29b-41d4-a716-446655440000'::uuid) $$,
  'Function get_receipts_to_process should be callable'
);

-- Test 2: Returns empty array when no receipts exist
select is(
  (select json_array_length(public.get_receipts_to_process('550e8400-e29b-41d4-a716-446655440000'::uuid))),
  0,
  'Should return empty array when no receipts exist'
);

-- Test 3: Insert a receipt in storage
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('receipts', concat(tests.get_supabase_uid('test1'), '/550e8400-e29b-41d4-a716-446655440000/receipt1.png'), tests.get_supabase_uid('test1')) $$,
  'Should be able to insert receipt into storage'
);

-- Get the storage object ID for the receipt
DO $$
DECLARE
    receipt_obj_id uuid;
BEGIN
    SELECT id INTO receipt_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/550e8400-e29b-41d4-a716-446655440000/receipt1.png')
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.receipt_obj_id', receipt_obj_id::text, false);
END $$;

-- Test 4: Returns receipt when it exists in storage but not in metadata
select is(
  (select json_array_length(public.get_receipts_to_process('550e8400-e29b-41d4-a716-446655440000'::uuid))),
  1,
  'Should return 1 receipt when it exists in storage but not in metadata'
);

-- Test 5: Insert receipt metadata
INSERT INTO synapse.receipt_metadata (expense_id, receipt_id, vendor_name, receipt_date, receipt_total, confidence_score, currency_code)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  current_setting('test.receipt_obj_id')::uuid,
  'Test Vendor',
  '2024-01-01',
  50.00,
  0.95,
  'USD'
);

-- Test 6: Returns empty array when receipt exists in both storage and metadata
select is(
  (select json_array_length(public.get_receipts_to_process('550e8400-e29b-41d4-a716-446655440000'::uuid))),
  0,
  'Should return empty array when receipt exists in both storage and metadata'
);

SELECT *
FROM finish();

ROLLBACK; 