BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(21);

-- Test schema and table existence
select has_schema('synapse', 'Synapse schema should exist');
select has_table('synapse', 'receipt_metadata', 'Synapse receipt_metadata table should exist');
select has_table('synapse', 'receipt_line_items', 'Synapse receipt_line_items table should exist');

-- Test RLS is enabled
select tests.rls_enabled('synapse', 'receipt_metadata');
select tests.rls_enabled('synapse', 'receipt_line_items');

-- Test that RLS policies exist
select policies_are('synapse', 'receipt_metadata', 
    ARRAY['Users can view their own receipt metadata', 'Users can insert their own receipt metadata', 'Team owners can view member receipt metadata'],
    'Receipt metadata should have the correct RLS policies');

select policies_are('synapse', 'receipt_line_items', 
    ARRAY['Users can view their own receipt line items', 'Users can insert their own receipt line items', 'Users can update their own receipt line items', 'Users can delete their own non-AI line items', 'Team owners can view member receipt line items'],
    'Receipt line items should have the correct RLS policies');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Create test expenses for the users
select tests.authenticate_as('test1');
insert into synapse.expenses (user_id, title, amount, description, status)
values (tests.get_supabase_uid('test1'), 'Test Expense 1', 100.00, 'Test Description 1', 'NEW');

-- Verify expense was created
select is(
    (select count(*)::int from synapse.expenses where user_id = tests.get_supabase_uid('test1')),
    1,
    'Test expense should be created successfully'
);

select tests.authenticate_as('test2');
insert into synapse.expenses (user_id, title, amount, description, status)
values (tests.get_supabase_uid('test2'), 'Test Expense 2', 200.00, 'Test Description 2', 'NEW');

-- Get expense IDs for testing
select tests.authenticate_as('test1');
DO $$
DECLARE
    expense1_id uuid;
    expense2_id uuid;
BEGIN
    SELECT id INTO expense1_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') LIMIT 1;
    SELECT id INTO expense2_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test2') LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.expense1_id', expense1_id::text, false);
    PERFORM set_config('test.expense2_id', expense2_id::text, false);
END $$;

-- Test basic CRUD operations as authenticated user (test1)
select tests.authenticate_as('test1');

-- First create a storage.objects record for the receipt_id foreign key constraint
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png'), tests.get_supabase_uid('test1')) $$,
    'User should be able to create storage object for receipt'
);

-- Get the storage object ID for the receipt
DO $$
DECLARE
    receipt_obj_id uuid;
BEGIN
    SELECT id INTO receipt_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png')
    LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.receipt_obj_id', receipt_obj_id::text, false);
END $$;

-- Test INSERT and SELECT for receipt_metadata
select lives_ok(
    $$ insert into synapse.receipt_metadata (expense_id, receipt_id, vendor_name, receipt_date, receipt_total, tax_amount, confidence_score, currency_code)
       values (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Test Vendor', '2024-01-15', 100.00, 8.50, 0.95, 'USD') $$,
    'User should be able to insert their own receipt metadata'
);

select is(
    (select count(*)::int from synapse.receipt_metadata),
    1,
    'User should be able to see their own receipt metadata'
);

-- Test INSERT and SELECT for receipt_line_items
select lives_ok(
    $$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, quantity, unit_price, total_amount, category, is_ai_generated)
       values (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Test Item 1', 2, 25.00, 50.00, 'Office Supplies', true) $$,
    'User should be able to insert their own receipt line items'
);

select is(
    (select count(*)::int from synapse.receipt_line_items),
    1,
    'User should be able to see their own receipt line items'
);

-- Test DELETE policy for non-AI line items
select lives_ok(
    $$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, quantity, unit_price, total_amount, category, is_ai_generated)
       values (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Manual Item', 1, 50.00, 50.00, 'Meals', false) $$,
    'User should be able to insert manual line items'
);

select lives_ok(
    $$ delete from synapse.receipt_line_items 
       where expense_id = current_setting('test.expense1_id')::uuid 
       and is_ai_generated = false $$,
    'User should be able to delete their own non-AI line items'
);

-- Test UPDATE policy for line items
select lives_ok(
    $$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, quantity, unit_price, total_amount, category, is_ai_generated)
       values (current_setting('test.expense1_id')::uuid, current_setting('test.receipt_obj_id')::uuid, 'Update Test Item', 1, 30.00, 30.00, 'Office Supplies', false) $$,
    'User should be able to insert line item for update test'
);

select lives_ok(
    $$ update synapse.receipt_line_items 
       set description = 'Updated Description', total_amount = 35.00
       where expense_id = current_setting('test.expense1_id')::uuid 
       and description = 'Update Test Item' $$,
    'User should be able to update their own line items'
);

select is(
    (select description from synapse.receipt_line_items 
     where expense_id = current_setting('test.expense1_id')::uuid 
     and description = 'Updated Description'),
    'Updated Description',
    'Line item should be updated successfully'
);

-- Test security isolation - user cannot access other user's data
select tests.authenticate_as('test2');

select is(
    (select count(*)::int from synapse.receipt_metadata),
    0,
    'User should not see other users receipt metadata'
);

select is(
    (select count(*)::int from synapse.receipt_line_items),
    0,
    'User should not see other users receipt line items'
);

-- Test anonymous user access prevention
select tests.clear_authentication();

select throws_ok(
    'select * from synapse.receipt_metadata',
    'permission denied for schema synapse',
    'Anonymous users should not have access to synapse schema'
);

SELECT *
FROM finish();

ROLLBACK; 