/*
===============================================================================
                    EXPENSE AMOUNT TRIGGERS TESTS
===============================================================================
*/

BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

SELECT plan(12);

-- Test setup: Create test user and expense
select tests.create_supabase_user('testuser', 'testuser@example.com');
select tests.authenticate_as('testuser');
DO $$
DECLARE
  exp json;
BEGIN
  SELECT public.create_expense('Trigger Test Expense', tests.get_supabase_uid('testuser'), 'Trigger test') INTO exp;
  PERFORM set_config('test.expense_id', (exp->>'id')::text, false);
END $$;

-- Insert dummy object for receipt_id foreign key
select lives_ok(
  $$ insert into storage.objects (id, bucket_id, name, owner_id, created_at, updated_at)
     values (
       'cccccccc-cccc-cccc-cccc-cccccccccccc',
       'receipts',
       concat(tests.get_supabase_uid('testuser'), '/', current_setting('test.expense_id'), '/test-object'),
       tests.get_supabase_uid('testuser'),
       NOW(),
       NOW()
     ) $$,
  'User should be able to create storage object for receipt foreign key'
);

-- Test 1: Initial expense amount should be 0
SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = current_setting(''test.expense_id'')::uuid',
  ARRAY[0::decimal],
  'Initial expense amount should be 0'
);

-- Test 2: Adding receipt line item should update expense amount
INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
VALUES (
  current_setting('test.expense_id')::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Test Item',
  100.00
);

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
WHERE expense_id = current_setting('test.expense_id')::uuid;

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
WHERE expense_id = current_setting('test.expense_id')::uuid;

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
INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
VALUES 
  (current_setting('test.expense_id')::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Item 1', 50.00),
  (current_setting('test.expense_id')::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Item 2', 75.00);

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
WHERE description = 'Item 1';

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

-- Cleanup
-- DELETE FROM synapse.receipt_line_items WHERE expense_id = current_setting('test.expense_id')::uuid;
-- DELETE FROM synapse.mileage_line_items WHERE expense_id = current_setting('test.expense_id')::uuid;
-- DELETE FROM synapse.expenses WHERE id = current_setting('test.expense_id')::uuid;
-- DELETE FROM storage.objects WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- DELETE FROM storage.buckets WHERE id = 'test-bucket';
-- Clean up any accounts that might have been created for this user
-- DELETE FROM basejump.account_user WHERE user_id = tests.get_supabase_uid('testuser');
-- DELETE FROM basejump.accounts WHERE primary_owner_user_id = tests.get_supabase_uid('testuser');
-- DELETE FROM auth.users WHERE id = tests.get_supabase_uid('testuser');

SELECT * FROM finish();

ROLLBACK; 