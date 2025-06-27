BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(4);

-- Test 1: Function exists and is callable with empty expense
SELECT synapse_tests.create_random_expense('test_analysis@test.com') as empty_expense \gset

-- Store the expense ID for later use
SELECT set_config('test.empty_expense_id', (:'empty_expense'::json)->>'id', false);

select lives_ok(
  $$ select public.get_receipts_to_process(current_setting('test.empty_expense_id')::uuid) $$,
  'Function get_receipts_to_process should be callable'
);

-- Test 2: Returns empty array when no receipts exist
select is(
  (select json_array_length(public.get_receipts_to_process(current_setting('test.empty_expense_id')::uuid))),
  0,
  'Should return empty array when no receipts exist'
);

-- Test 3: Create expense with unprocessed receipt (storage only, no metadata)
-- Use existing helper and manually add storage object for this specific test case
SELECT synapse_tests.create_random_expense('test_analysis2@test.com', 'Receipt Processing Test') as unprocessed_expense \gset

-- Store the unprocessed expense ID
SELECT set_config('test.unprocessed_expense_id', (:'unprocessed_expense'::json)->>'id', false);

-- Add storage object manually (simulates uploaded but unprocessed receipt)
select tests.authenticate_as('test_analysis2');
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES (
  'receipts', 
  concat(tests.get_supabase_uid('test_analysis2'), '/', current_setting('test.unprocessed_expense_id'), '/receipt1.png'),
  tests.get_supabase_uid('test_analysis2')
);

-- Test 4: Returns receipt when it exists in storage but not in metadata
select is(
  (select json_array_length(public.get_receipts_to_process(current_setting('test.unprocessed_expense_id')::uuid))),
  1,
  'Should return 1 receipt when it exists in storage but not in metadata'
);

-- Test 5: Create fully processed receipt using helper
SELECT synapse_tests.create_expense_with_receipt_metadata(
  'test_analysis3@test.com',
  'Processed Receipt Test',
  'Test Vendor', 
  50.00,
  'processed-receipt.png'
) as processed_expense \gset

-- Store the processed expense ID
SELECT set_config('test.processed_expense_id', (:'processed_expense'::json->'expense'->>'id'), false);

-- Test 6: Returns empty array when receipt exists in both storage and metadata
select is(
  (select json_array_length(public.get_receipts_to_process(current_setting('test.processed_expense_id')::uuid))),
  0,
  'Should return empty array when receipt exists in both storage and metadata'
);

SELECT * FROM finish();
ROLLBACK;