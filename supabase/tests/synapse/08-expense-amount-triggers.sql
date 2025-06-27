/*
===============================================================================
                    EXPENSE AMOUNT TRIGGERS TESTS
===============================================================================
*/

BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

SELECT plan(11);

-- Setup: Create expense with receipt metadata using helper
SELECT synapse_tests.create_expense_with_receipt_metadata(
  'triggertest@example.com',
  'Trigger Test Expense',
  'Test Vendor',
  0.00,  -- Start with 0 total
  'trigger-test-receipt.png'
) as test_setup \gset

-- Store the IDs for easy reference
SELECT set_config('test.expense_id', (:'test_setup'::json)->'expense'->>'id', false);
SELECT set_config('test.receipt_id', (:'test_setup'::json)->>'receipt_id', false);

-- Test 1: Initial expense amount should be 0
SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[0::decimal],
  'Initial expense amount should be 0'
);

-- Test 2: Adding receipt line item should update expense amount
SELECT synapse_tests.create_line_item_for_testing(
  current_setting('test.expense_id')::uuid,
  current_setting('test.receipt_id')::uuid,
  'Test Item',
  1,
  100.00,
  'Office Supplies',
  false
) as receipt_item_id \gset

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[100.00::decimal],
  'Adding receipt line item should update expense amount to 100.00'
);

-- Test 3: Adding mileage line item should add to expense amount
INSERT INTO synapse.mileage_line_items (expense_id, from_address, to_address, miles_driven, mileage_rate, total_amount)
VALUES (
  current_setting('test.expense_id')::uuid,
  '123 Main St',
  '456 Oak Ave',
  50.0,
  0.655,
  32.75
);

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[132.75::decimal],
  'Adding mileage line item should update expense amount to 132.75'
);

-- Test 4: Updating receipt line item amount should update expense amount
UPDATE synapse.receipt_line_items 
SET total_amount = 150.00 
WHERE id = (:'receipt_item_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[182.75::decimal],
  'Updating receipt line item should update expense amount to 182.75'
);

-- Test 5: Updating mileage line item amount should update expense amount
UPDATE synapse.mileage_line_items 
SET total_amount = 100.00 
WHERE expense_id = current_setting('test.expense_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[250.00::decimal],
  'Updating mileage line item should update expense amount to 250.00'
);

-- Test 6: Soft deleting receipt line item should exclude it from expense amount
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE id = (:'receipt_item_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[100.00::decimal],
  'Soft deleting receipt line item should update expense amount to 100.00'
);

-- Test 7: Deleting mileage line item should update expense amount
DELETE FROM synapse.mileage_line_items 
WHERE expense_id = current_setting('test.expense_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[0::decimal],
  'Deleting mileage line item should update expense amount to 0'
);

-- Test 8: Deleting receipt line item should update expense amount
DELETE FROM synapse.receipt_line_items 
WHERE expense_id = current_setting('test.expense_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[0::decimal],
  'Deleting receipt line item should update expense amount to 0'
);

-- Test 9: Adding multiple line items should sum correctly
SELECT synapse_tests.create_line_item_for_testing(
  current_setting('test.expense_id')::uuid,
  current_setting('test.receipt_id')::uuid,
  'Item 1',
  1,
  50.00,
  'Office Supplies',
  false
) as item1_id \gset

SELECT synapse_tests.create_line_item_for_testing(
  current_setting('test.expense_id')::uuid,
  current_setting('test.receipt_id')::uuid,
  'Item 2',
  1,
  75.00,
  'Meals',
  false
) as item2_id \gset

-- Add mileage items
INSERT INTO synapse.mileage_line_items (expense_id, from_address, to_address, miles_driven, mileage_rate, total_amount)
VALUES 
  (current_setting('test.expense_id')::uuid, 'A', 'B', 25.0, 0.655, 16.38),
  (current_setting('test.expense_id')::uuid, 'C', 'D', 30.0, 0.655, 19.65);

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[161.03::decimal],
  'Multiple line items should sum correctly to 161.03'
);

-- Test 10: Mixed soft deleted and active items should only count active ones
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE id = (:'item1_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[111.03::decimal],
  'Mixed soft deleted and active items should only count active ones (111.03)'
);

-- Test 11: All soft deleted items should result in 0 amount
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE expense_id = current_setting('test.expense_id')::uuid;

DELETE FROM synapse.mileage_line_items 
WHERE expense_id = current_setting('test.expense_id')::uuid;

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[0::decimal],
  'All soft deleted items should result in 0 amount'
);

SELECT * FROM finish();

ROLLBACK;