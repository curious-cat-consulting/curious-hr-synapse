BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(9);

-- Create test expense with unprocessed receipt (storage only)
SELECT synapse_tests.create_random_expense('test1@test.com', 'Receipt Analysis Test') as test_expense \gset
SELECT set_config('test.expense_id', (:'test_expense'::json)->>'id', false);

-- Add storage object manually (simulates uploaded but unprocessed receipt)
select tests.authenticate_as('test1');
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/receipt1.png'), tests.get_supabase_uid('test1'));

-- Store the receipt object ID for later use
DO $$
DECLARE
    receipt_obj_id uuid;
BEGIN
    SELECT id INTO receipt_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/receipt1.png')
    LIMIT 1;
    PERFORM set_config('test.receipt_obj_id', receipt_obj_id::text, false);
END $$;

-- Test 1: Function exists and is callable
select lives_ok(
  $$ select public.store_receipt_analyses(current_setting('test.expense_id')::uuid, '[]'::jsonb) $$,
  'Function store_receipt_analyses should be callable with empty array'
);

-- Test 2: Store single receipt analysis
select lives_ok(
  $$ select public.store_receipt_analyses(
    current_setting('test.expense_id')::uuid,
    jsonb_build_array(
      jsonb_build_object(
        'receiptId', current_setting('test.receipt_obj_id')::uuid,
        'analysis', jsonb_build_object(
          'vendor_name', 'Test Restaurant',
          'receipt_date', '2024-01-15',
          'receipt_total', 75.50,
          'tax_amount', 6.50,
          'currency', 'USD',
          'confidence_score', 0.92,
          'line_items', jsonb_build_array(
            jsonb_build_object(
              'description', 'Burger and Fries',
              'quantity', 1,
              'unit_price', 15.00,
              'total_amount', 15.00,
              'category', 'Food'
            ),
            jsonb_build_object(
              'description', 'Soft Drink',
              'quantity', 2,
              'unit_price', 3.50,
              'total_amount', 7.00,
              'category', 'Beverages'
            )
          )
        )
      )
    )
  ) $$,
  'Should be able to store single receipt analysis'
);

-- Test 3: Verify receipt metadata was created
select is(
  (select count(*)::int from synapse.receipt_metadata where expense_id = current_setting('test.expense_id')::uuid),
  1,
  'Should have created one receipt metadata record'
);

-- Test 4: Verify receipt metadata details
select is(
  (select vendor_name from synapse.receipt_metadata where expense_id = current_setting('test.expense_id')::uuid limit 1),
  'Test Restaurant',
  'Receipt metadata should have correct vendor name'
);

-- Test 5: Verify line items were created
select is(
  (select count(*)::int from synapse.receipt_line_items where expense_id = current_setting('test.expense_id')::uuid),
  2,
  'Should have created two line items'
);

-- Test 6: Verify line item details
select is(
  (select description from synapse.receipt_line_items where expense_id = current_setting('test.expense_id')::uuid and description = 'Burger and Fries'),
  'Burger and Fries',
  'First line item should have correct description'
);

-- Test 7: Verify expense status was updated
select is(
  (select status from synapse.expenses where id = current_setting('test.expense_id')::uuid),
  'ANALYZED'::synapse.expense_status,
  'Expense status should be updated to ANALYZED'
);

-- Test 8: Test multiple receipt analyses - add second storage object
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/receipt2.png'), tests.get_supabase_uid('test1'));

-- Store the second receipt object ID
DO $$
DECLARE
    receipt_obj_id2 uuid;
BEGIN
    SELECT id INTO receipt_obj_id2 FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/receipt2.png')
    LIMIT 1;
    PERFORM set_config('test.receipt_obj_id2', receipt_obj_id2::text, false);
END $$;

select lives_ok(
  $$ select public.store_receipt_analyses(
    current_setting('test.expense_id')::uuid,
    jsonb_build_array(
      jsonb_build_object(
        'receiptId', current_setting('test.receipt_obj_id2')::uuid,
        'analysis', jsonb_build_object(
          'vendor_name', 'Coffee Shop',
          'receipt_date', '2024-01-16',
          'receipt_total', 12.75,
          'tax_amount', 1.25,
          'currency', 'USD',
          'confidence_score', 0.88,
          'line_items', jsonb_build_array(
            jsonb_build_object(
              'description', 'Latte',
              'quantity', 1,
              'unit_price', 5.50,
              'total_amount', 5.50,
              'category', 'Beverages'
            )
          )
        )
      )
    )
  ) $$,
  'Should be able to store multiple receipt analyses'
);

-- Test 9: Test handling empty receipt dates - add third storage object
INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/test-receipt.png'), tests.get_supabase_uid('test1'));

-- Store the test receipt object ID
DO $$
DECLARE
    test_receipt_obj_id uuid;
BEGIN
    SELECT id INTO test_receipt_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.test_receipt_obj_id', test_receipt_obj_id::text, false);
END $$;

SELECT lives_ok(
  $$ select public.store_receipt_analyses(
    current_setting('test.expense_id')::uuid,
    jsonb_build_array(
      jsonb_build_object(
        'receiptId', current_setting('test.test_receipt_obj_id')::uuid,
        'analysis', jsonb_build_object(
          'vendor_name', 'Test Vendor',
          'receipt_date', '',
          'receipt_total', 25.50,
          'currency', 'USD',
          'line_items', jsonb_build_array(
            jsonb_build_object(
              'description', 'Test Item',
              'total_amount', 25.50,
              'date', ''
            )
          ),
          'confidence_score', 0.9
        )
      )
    )
  ) $$,
  'Function should handle empty receipt dates without error'
);

SELECT * FROM finish();
ROLLBACK;