BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(19);

-- Test function existence
select has_function('public', 'add_receipt_line_item', ARRAY['uuid', 'uuid', 'text', 'decimal', 'decimal', 'decimal', 'text', 'date'], 'add_receipt_line_item function should exist');
select has_function('public', 'delete_receipt_line_item', ARRAY['uuid'], 'delete_receipt_line_item function should exist');

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Create test expenses for the users
select tests.authenticate_as('test1');
select public.create_expense('Test Expense 1', tests.get_supabase_uid('test1'), 'Test Description 1');

select tests.authenticate_as('test2');
select public.create_expense('Test Expense 2', tests.get_supabase_uid('test2'), 'Test Description 2');

-- Set expense2_id while authenticated as test2
DO $$
DECLARE
    expense2_id uuid;
BEGIN
    SELECT id INTO expense2_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test2') LIMIT 1;
    PERFORM set_config('test.expense2_id', expense2_id::text, false);
END $$;

-- Get expense IDs for testing
select tests.authenticate_as('test1');
DO $$
DECLARE
    expense1_id uuid;
BEGIN
    SELECT id INTO expense1_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') LIMIT 1;
    
    -- Store for later use
    PERFORM set_config('test.expense1_id', expense1_id::text, false);
END $$;

-- Insert storage.objects for both users and get the IDs
select tests.authenticate_as('test1');
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png'), tests.get_supabase_uid('test1')) $$,
    'User1 should be able to create storage object for receipt'
);
DO $$
DECLARE
    receipt1_obj_id uuid;
BEGIN
    SELECT id INTO receipt1_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.receipt1_obj_id', receipt1_obj_id::text, false);
END $$;

select tests.authenticate_as('test2');
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test2'), '/', current_setting('test.expense2_id'), '/test-receipt.png'), tests.get_supabase_uid('test2')) $$,
    'User2 should be able to create storage object for receipt'
);
DO $$
DECLARE
    receipt2_obj_id uuid;
BEGIN
    SELECT id INTO receipt2_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('test2'), '/', current_setting('test.expense2_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.receipt2_obj_id', receipt2_obj_id::text, false);
END $$;

-- Test add_receipt_line_item function - Success cases
select tests.authenticate_as('test1');
select lives_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        'Test Item 1',
        50.00
    ) $$,
    'Should be able to create basic line item'
);

select lives_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        'Test Item 2',
        75.00,
        3,
        25.00,
        'Office Supplies',
        '2024-01-15'::date
    ) $$,
    'Should be able to create line item with all parameters'
);

select is(
    (select count(*)::int from synapse.receipt_line_items where expense_id = current_setting('test.expense1_id')::uuid),
    2,
    'Two line items should be created'
);

-- Test add_receipt_line_item function - Error cases
select throws_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        null,
        50.00
    ) $$,
    'Description is required',
    'Should require description'
);

select throws_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        'Test Item',
        0
    ) $$,
    'Total amount must be greater than 0',
    'Should require positive total amount'
);

select throws_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense2_id')::uuid,
        current_setting('test.receipt2_obj_id')::uuid,
        'Test Item',
        50.00
    ) $$,
    'Expense not found or access denied',
    'Should not allow access to other user expense'
);

select tests.clear_authentication();
select throws_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        'Test Item',
        50.00
    ) $$,
    'permission denied for function add_receipt_line_item',
    'Should require authentication'
);

-- Test delete_receipt_line_item function - Error cases
select throws_ok(
    $$ select public.delete_receipt_line_item('00000000-0000-0000-0000-000000000000'::uuid) $$,
    'permission denied for function delete_receipt_line_item',
    'Should require authentication for deletion'
);

select tests.authenticate_as('test1');
select throws_ok(
    $$ select public.delete_receipt_line_item('00000000-0000-0000-0000-000000000000'::uuid) $$,
    'Line item not found',
    'Should reject invalid line item ID'
);

-- Test manual line item creation and deletion
select lives_ok(
    $$ select public.add_receipt_line_item(
        current_setting('test.expense1_id')::uuid,
        current_setting('test.receipt1_obj_id')::uuid,
        'Manual Item to Delete',
        25.00,
        1,
        25.00,
        'Meals',
        '2024-01-15'::date
    ) $$,
    'Should be able to create manual line item for deletion test'
);
DO $$
DECLARE
    line_item_id uuid;
BEGIN
    SELECT id INTO line_item_id FROM synapse.receipt_line_items 
    WHERE description = 'Manual Item to Delete' AND expense_id = current_setting('test.expense1_id')::uuid
    LIMIT 1;
    PERFORM set_config('test.line_item_id', line_item_id::text, false);
END $$;
select lives_ok(
    $$ select public.delete_receipt_line_item(current_setting('test.line_item_id')::uuid) $$,
    'Should be able to delete manual line item'
);
select is(
    (select count(*)::int from synapse.receipt_line_items where id = current_setting('test.line_item_id')::uuid),
    0,
    'Manual line item should be hard deleted'
);

-- Test soft deletion of AI-generated line item
select lives_ok(
    $$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, quantity, unit_price, total_amount, category, is_ai_generated)
       values (current_setting('test.expense1_id')::uuid, current_setting('test.receipt1_obj_id')::uuid, 'AI Item to Soft Delete', 1, 30.00, 30.00, 'Office Supplies', true) $$,
    'Should be able to create AI-generated line item for soft deletion test'
);
DO $$
DECLARE
    ai_line_item_id uuid;
BEGIN
    SELECT id INTO ai_line_item_id FROM synapse.receipt_line_items 
    WHERE description = 'AI Item to Soft Delete' AND expense_id = current_setting('test.expense1_id')::uuid
    LIMIT 1;
    PERFORM set_config('test.ai_line_item_id', ai_line_item_id::text, false);
END $$;
select lives_ok(
    $$ select public.delete_receipt_line_item(current_setting('test.ai_line_item_id')::uuid) $$,
    'Should be able to soft delete AI-generated line item'
);
select is(
    (select is_deleted from synapse.receipt_line_items where id = current_setting('test.ai_line_item_id')::uuid),
    true,
    'AI-generated line item should be soft deleted'
);

SELECT *
FROM finish();

ROLLBACK; 