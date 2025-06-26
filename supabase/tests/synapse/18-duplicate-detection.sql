BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(6);

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Create test expense
select tests.authenticate_as('test1');
DO $$
DECLARE
  exp json;
BEGIN
  SELECT public.create_expense('Test Expense 1', tests.get_supabase_uid('test1'), 'Test Description') INTO exp;
  PERFORM set_config('test.expense_id1', (exp->>'id')::text, false);
END $$;

-- Create second test expense
DO $$
DECLARE
  exp json;
BEGIN
  SELECT public.create_expense('Test Expense 2', tests.get_supabase_uid('test1'), 'Test Description 2') INTO exp;
  PERFORM set_config('test.expense_id2', (exp->>'id')::text, false);
END $$;

-- Create test receipts in storage
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES 
  ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id1'), '/receipt1.png'), tests.get_supabase_uid('test1')),
  ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id2'), '/receipt2.png'), tests.get_supabase_uid('test1'));

-- Get the storage object IDs for the receipts
DO $$
DECLARE
    receipt_obj_id1 uuid;
    receipt_obj_id2 uuid;
BEGIN
    SELECT id INTO receipt_obj_id1 FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id1'), '/receipt1.png')
    LIMIT 1;
    
    SELECT id INTO receipt_obj_id2 FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id2'), '/receipt2.png')
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.receipt_obj_id1', receipt_obj_id1::text, false);
    PERFORM set_config('test.receipt_obj_id2', receipt_obj_id2::text, false);
END $$;

-- Test 1: Function exists and is callable
select lives_ok(
  $$ select public.detect_receipt_duplicates(current_setting('test.expense_id1')::uuid) $$,
  'Function detect_receipt_duplicates should be callable'
);

-- Test 2: Returns empty array when no receipts exist
select is(
  (select json_array_length(public.detect_receipt_duplicates(current_setting('test.expense_id1')::uuid))),
  0,
  'Should return empty array when no receipts exist'
);

-- Test 3: Insert receipt metadata for first expense (no duplicates yet)
INSERT INTO synapse.receipt_metadata (expense_id, receipt_id, vendor_name, receipt_date, receipt_total, confidence_score, currency_code)
VALUES (
  current_setting('test.expense_id1')::uuid,
  current_setting('test.receipt_obj_id1')::uuid,
  'Test Vendor 1',
  '2024-01-01',
  50.00,
  0.95,
  'USD'
);
select is(
  (select count(*) from synapse.receipt_metadata where expense_id = current_setting('test.expense_id1')::uuid),
  1::bigint,
  'Should have 1 receipt metadata row for expense 1 after insert'
);

-- Test 4: Still no duplicates
select is(
  (select json_array_length(public.detect_receipt_duplicates(current_setting('test.expense_id1')::uuid))),
  0,
  'Should return empty array when only one receipt exists'
);

-- Test 5: Insert similar receipt metadata for second expense (potential duplicate)
INSERT INTO synapse.receipt_metadata (expense_id, receipt_id, vendor_name, receipt_date, receipt_total, confidence_score, currency_code)
VALUES (
  current_setting('test.expense_id2')::uuid,
  current_setting('test.receipt_obj_id2')::uuid,
  'Test Vendor 1',
  '2024-01-01',
  50.00,
  0.95,
  'USD'
);
select is(
  (select count(*) from synapse.receipt_metadata where expense_id = current_setting('test.expense_id2')::uuid),
  1::bigint,
  'Should have 1 receipt metadata row for expense 2 after insert'
);

-- Test 6: Now should detect duplicates
select is(
  (select json_array_length(public.detect_receipt_duplicates(current_setting('test.expense_id1')::uuid))),
  1,
  'Should detect 1 duplicate when similar receipt exists'
);

SELECT * FROM finish();
ROLLBACK; 