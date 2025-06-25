/*
===============================================================================
                    EXPENSE AMOUNT TRIGGERS TESTS
===============================================================================
*/

BEGIN;

-- Test setup: Create test user and expense
SELECT plan(11);

-- Create test user (using a different ID to avoid conflicts)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'test-triggers@example.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Insert dummy bucket for bucket_id foreign key
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at)
VALUES (
  'test-bucket',
  'Test Bucket',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  NOW(),
  NOW()
);

-- Insert dummy object for receipt_id foreign key
INSERT INTO storage.objects (id, bucket_id, name, owner_id, created_at, updated_at)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'test-bucket',
  'test-object',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  NOW(),
  NOW()
);

-- Create test expense
INSERT INTO synapse.expenses (id, user_id, account_id, title, description, status, amount)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Test Expense',
  'Test Description',
  'NEW',
  0
);

-- Test 1: Initial expense amount should be 0
SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[0::decimal],
  'Initial expense amount should be 0'
);

-- Test 2: Adding receipt line item should update expense amount
INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Test Item',
  100.00
);

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[100.00::decimal],
  'Adding receipt line item should update expense amount to 100.00'
);

-- Test 3: Adding mileage line item should add to expense amount
INSERT INTO synapse.mileage_line_items (expense_id, from_address, to_address, miles_driven, total_amount)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '123 Main St',
  '456 Oak Ave',
  50.0,
  75.00
);

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[175.00::decimal],
  'Adding mileage line item should update expense amount to 175.00'
);

-- Test 4: Updating receipt line item amount should update expense amount
UPDATE synapse.receipt_line_items 
SET total_amount = 150.00 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[225.00::decimal],
  'Updating receipt line item should update expense amount to 225.00'
);

-- Test 5: Updating mileage line item amount should update expense amount
UPDATE synapse.mileage_line_items 
SET total_amount = 100.00 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[250.00::decimal],
  'Updating mileage line item should update expense amount to 250.00'
);

-- Test 6: Soft deleting receipt line item should exclude it from expense amount
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[100.00::decimal],
  'Soft deleting receipt line item should update expense amount to 100.00'
);

-- Test 7: Deleting mileage line item should update expense amount
DELETE FROM synapse.mileage_line_items 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[0::decimal],
  'Deleting mileage line item should update expense amount to 0'
);

-- Test 8: Deleting receipt line item should update expense amount
DELETE FROM synapse.receipt_line_items 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[0::decimal],
  'Deleting receipt line item should update expense amount to 0'
);

-- Test 9: Adding multiple line items should sum correctly
INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Item 1', 50.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Item 2', 75.00);

INSERT INTO synapse.mileage_line_items (expense_id, from_address, to_address, miles_driven, total_amount)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'A', 'B', 25.0, 37.50),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'C', 'D', 30.0, 45.00);

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[207.50::decimal],
  'Multiple line items should sum correctly to 207.50'
);

-- Test 10: Mixed soft deleted and active items should only count active ones
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE description = 'Item 1';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[157.50::decimal],
  'Mixed soft deleted and active items should only count active ones (157.50)'
);

-- Test 11: All soft deleted items should result in 0 amount
UPDATE synapse.receipt_line_items 
SET is_deleted = true 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

DELETE FROM synapse.mileage_line_items 
WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT amount FROM synapse.expenses WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
  ARRAY[0::decimal],
  'All soft deleted items should result in 0 amount'
);

-- Cleanup
DELETE FROM synapse.receipt_line_items WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM synapse.mileage_line_items WHERE expense_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM synapse.expenses WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM storage.objects WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM storage.buckets WHERE id = 'test-bucket';
-- Clean up any accounts that might have been created for this user
DELETE FROM basejump.account_user WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
DELETE FROM basejump.accounts WHERE primary_owner_user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
DELETE FROM auth.users WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

SELECT * FROM finish();

ROLLBACK; 