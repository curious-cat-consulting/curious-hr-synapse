BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(26);

-- Test function existence
select function_returns('public', 'get_expense_details', ARRAY['uuid'], 'json',
    'get_expense_details function should exist and return json');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Create test expenses for the users
select tests.authenticate_as('test1');
insert into synapse.expenses (user_id, title, amount, description, status)
values 
  (tests.get_supabase_uid('test1'), 'Test Expense 1', 100.00, 'Test Description 1', 'NEW'),
  (tests.get_supabase_uid('test1'), 'Test Expense 2', 200.00, 'Test Description 2', 'ANALYZED');

select tests.authenticate_as('test2');
insert into synapse.expenses (user_id, title, amount, description, status)
values (tests.get_supabase_uid('test2'), 'Test Expense 3', 300.00, 'Test Description 3', 'NEW');

-- Get expense IDs for testing
select tests.authenticate_as('test1');
DO $$
DECLARE
    expense1_id uuid;
    expense2_id uuid;
    expense3_id uuid;
BEGIN
    SELECT id INTO expense1_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') AND title = 'Test Expense 1' LIMIT 1;
    SELECT id INTO expense2_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') AND title = 'Test Expense 2' LIMIT 1;
    SELECT id INTO expense3_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test2') AND title = 'Test Expense 3' LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.expense1_id', expense1_id::text, false);
    PERFORM set_config('test.expense2_id', expense2_id::text, false);
    PERFORM set_config('test.expense3_id', expense3_id::text, false);
END $$;

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
  $$ select 'Test Expense 1', 'Test Description 1', '100.00', 'NEW', 'USD' $$,
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

-- Test with receipt line items
select tests.authenticate_as('test1');

-- Create storage object for receipt
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png'), tests.get_supabase_uid('test1')) $$,
    'User should be able to create storage object for receipt'
);

-- Get the storage object ID
DO $$
DECLARE
    receipt_obj_id uuid;
BEGIN
    SELECT id INTO receipt_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png')
    LIMIT 1;
    
    PERFORM set_config('test.receipt_obj_id', receipt_obj_id::text, false);
END $$;

-- Add receipt line items
select lives_ok(
    $$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, quantity, unit_price, total_amount, category, is_ai_generated, line_item_date)
       values 
         (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Office Supplies', 2, 25.00, 50.00, 'Office', true, '2024-01-15'),
         (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Coffee', 1, 5.00, 5.00, 'Meals', false, '2024-01-15') $$,
    'User should be able to insert receipt line items'
);

-- Test that receipt line items are included in response
select is(
  (json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'receipt_line_items'))::text,
  '2',
  'get_expense_details should include receipt line items in response'
);

-- Test receipt line item structure
select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'receipt_line_items'->0->>'id' IS NOT NULL,
  'Receipt line items should have id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'receipt_line_items'->0->>'_type' IS NOT NULL,
  'Receipt line items should have _type field'
);

select is(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'receipt_line_items'->0->>'_type',
  'regular',
  'Receipt line items should have _type set to regular'
);

-- Test with mileage line items
select lives_ok(
    $$ insert into synapse.mileage_line_items (expense_id, from_address, to_address, category, miles_driven, total_amount, line_item_date)
       values 
         (current_setting('test.expense1_id')::uuid, '123 Main St', '456 Oak Ave', 'Business Travel', 25.5, 38.25, '2024-01-15'),
         (current_setting('test.expense1_id')::uuid, '456 Oak Ave', '789 Pine St', 'Client Meeting', 15.2, 22.80, '2024-01-16') $$,
    'User should be able to insert mileage line items'
);

-- Test that mileage line items are included in response
select is(
  (json_array_length((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items'))::text,
  '2',
  'get_expense_details should include mileage line items in response'
);

-- Test mileage line item structure
select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items'->0->>'id' IS NOT NULL,
  'Mileage line items should have id field'
);

select ok(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items'->0->>'_type' IS NOT NULL,
  'Mileage line items should have _type field'
);

select is(
  (public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items'->0->>'_type',
  'miles',
  'Mileage line items should have _type set to miles'
);

-- Test results_eq for mileage line items order
select results_eq(
  $$ select json_array_elements((public.get_expense_details(current_setting('test.expense1_id')::uuid))->'mileage_line_items') ->> 'from_address' $$,
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

SELECT *
FROM finish();

ROLLBACK; 