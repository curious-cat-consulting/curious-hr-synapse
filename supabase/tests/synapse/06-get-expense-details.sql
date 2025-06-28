BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(33);

-- Test function existence
select function_returns('public', 'get_expense_details', ARRAY['uuid'], 'json',
    'get_expense_details function should exist and return json');

-- Create test scenarios using helpers
-- Scenario 1: Basic expense with no line items (test1 user)
SELECT synapse_tests.create_random_expense('test1@test.com', 'Test Expense 1', 'Test Description 1') as expense1 \gset
SELECT set_config('test.expense1_id', (:'expense1'::json)->>'id', false);

-- Scenario 2: Second basic expense for same user
SELECT synapse_tests.create_random_expense('test1@test.com', 'Test Expense 2', 'Test Description 2') as expense2 \gset
SELECT set_config('test.expense2_id', (:'expense2'::json)->>'id', false);

-- Scenario 3: Cross-user expense (test2 user)
SELECT synapse_tests.create_random_expense('test2@test.com', 'Test Expense 3', 'Test Description 3') as expense3 \gset
SELECT set_config('test.expense3_id', (:'expense3'::json)->>'id', false);

-- Test basic expense details retrieval
select tests.authenticate_as('test1');

-- Test successful retrieval with all basic fields
select results_eq(
  $$ select 
       (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'title',
       (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'description',
       (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'amount',
       (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'status',
       (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'currency_code' $$,
  $$ select 'Test Expense 1', 'Test Description 1', '0.00', 'NEW', 'USD' $$,
  'get_expense_details should return correct basic expense data'
);

-- Test that all required fields are present
select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'id' IS NOT NULL,
  'get_expense_details should include id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'created_at' IS NOT NULL,
  'get_expense_details should include created_at field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'updated_at' IS NOT NULL,
  'get_expense_details should include updated_at field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'receipt_line_items' IS NOT NULL,
  'get_expense_details should include receipt_line_items field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'mileage_line_items' IS NOT NULL,
  'get_expense_details should include mileage_line_items field'
);

-- Test empty line items arrays for new expense
select is(
  json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'receipt_line_items'),
  0,
  'get_expense_details should return empty receipt_line_items array for expense without line items'
);

select is(
  json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items'),
  0,
  'get_expense_details should return empty mileage_line_items array for expense without line items'
);

-- Test non-existent expense
select ok(
  public.get_expense_details('11111111-1111-1111-1111-111111111111'::uuid) IS NULL,
  'get_expense_details should return null for non-existent expense'
);

-- Test cross-user access (should be denied)
select tests.authenticate_as('test2');
select ok(
  public.get_expense_details(current_setting('test.expense1_id')::uuid) IS NULL,
  'get_expense_details should return null when accessing another user expense'
);

-- Test unauthenticated access
select tests.clear_authentication();
select throws_ok(
  $$ select public.get_expense_details('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'permission denied for function get_expense_details',
  'get_expense_details should not allow unauthenticated users'
);

-- Test with receipt line items using helper
select tests.authenticate_as('test1');

-- Create expense with receipt and line items using helper
SELECT synapse_tests.create_expense_with_line_items(
  'test1@test.com',
  'Expense with Receipt Items',
  '[
    {"description": "Office Supplies", "quantity": 2, "unit_price": 25.00, "category": "Office"},
    {"description": "Coffee", "quantity": 1, "unit_price": 5.00, "category": "Meals"}
  ]'::jsonb
) as expense_with_items \gset

-- Store the expense ID for testing
SELECT set_config('test.expense_with_items_id', (:'expense_with_items'::json)->'expense'->>'id', false);

-- Test that receipt line items are included in response
select is(
  (json_array_length((public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'receipt_line_items'))::text,
  '2',
  'get_expense_details should include receipt line items in response'
);

-- Test receipt line item structure
select ok(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'receipt_line_items'->0->>'id' IS NOT NULL,
  'Receipt line items should have id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'receipt_line_items'->0->>'_type' IS NOT NULL,
  'Receipt line items should have _type field'
);

select is(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'receipt_line_items'->0->>'_type',
  'regular',
  'Receipt line items should have _type set to regular'
);

-- Test with mileage line items - add manually to existing expense
select lives_ok(
    $$ insert into synapse.mileage_line_items (expense_id, from_address, to_address, category, miles_driven, mileage_rate, total_amount, line_item_date)
       values 
         (current_setting('test.expense_with_items_id')::uuid, '123 Main St', '456 Oak Ave', 'Business Travel', 25.5, 0.655, 16.70, '2024-01-15'),
         (current_setting('test.expense_with_items_id')::uuid, '456 Oak Ave', '789 Pine St', 'Client Meeting', 15.2, 0.75, 11.40, '2024-01-16') $$,
    'User should be able to insert mileage line items'
);

-- Test that mileage line items are included in response
select is(
  (json_array_length((public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'mileage_line_items'))::text,
  '2',
  'get_expense_details should include mileage line items in response'
);

-- Test mileage line item structure
select ok(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'mileage_line_items'->0->>'id' IS NOT NULL,
  'Mileage line items should have id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'mileage_line_items'->0->>'_type' IS NOT NULL,
  'Mileage line items should have _type field'
);

select is(
  (public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'mileage_line_items'->0->>'_type',
  'miles',
  'Mileage line items should have _type set to miles'
);

-- Test results_eq for mileage line items order
select results_eq(
  $$ select json_array_elements((public.get_expense_details(current_setting('test.expense_with_items_id')::uuid))->'mileage_line_items') ->> 'from_address' $$,
  ARRAY['123 Main St', '456 Oak Ave'],
  'Mileage line items should be ordered by created_at'
);

-- Test expense with no line items still returns empty arrays
select is(
  json_array_length((public.get_expense_details(current_setting('test.expense2_id')::uuid))->'receipt_line_items'),
  0,
  'Expense without receipt line items should return empty array'
);

select is(
  json_array_length((public.get_expense_details(current_setting('test.expense2_id')::uuid))->'mileage_line_items'),
  0,
  'Expense without mileage line items should return empty array'
);

-- Test that account information is included
SELECT results_eq(
  $$ SELECT (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'account_name' $$,
  $$ SELECT 'test1' $$,
  'get_expense_details should include account_name field'
);

SELECT results_eq(
  $$ SELECT (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'account_personal' $$,
  $$ SELECT 'true' $$,
  'get_expense_details should include account_personal field'
);

-- Test unprocessed_receipts field is included in response
select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->>'unprocessed_receipts' IS NOT NULL,
  'get_expense_details should include unprocessed_receipts field'
);

-- Test that unprocessed_receipts returns empty array when no unprocessed receipts exist
select is(
  json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'unprocessed_receipts'),
  0,
  'get_expense_details should return empty unprocessed_receipts array when no unprocessed receipts exist'
);

-- Test that unprocessed_receipts includes receipts that exist in storage but not in metadata
-- Create another storage object for an unprocessed receipt
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/unprocessed-receipt.png'), tests.get_supabase_uid('test1')) $$,
    'User should be able to create storage object for unprocessed receipt'
);

-- Test that unprocessed_receipts now includes the new receipt
select is(
  json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'unprocessed_receipts'),
  1,
  'get_expense_details should include unprocessed receipts in unprocessed_receipts field'
);

-- Test that unprocessed_receipts has the correct structure
select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'unprocessed_receipts'->0->>'id' IS NOT NULL,
  'Unprocessed receipts should have id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'unprocessed_receipts'->0->>'name' IS NOT NULL,
  'Unprocessed receipts should have name field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'unprocessed_receipts'->0->>'path' IS NOT NULL,
  'Unprocessed receipts should have path field'
);

SELECT * FROM finish();
ROLLBACK;