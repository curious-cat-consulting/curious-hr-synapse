BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(19);

-- Test function existence
select has_function('public', 'add_receipt_line_item', ARRAY['uuid', 'uuid', 'text', 'decimal', 'decimal', 'decimal', 'text', 'date'], 'add_receipt_line_item function should exist');
select has_function('public', 'delete_receipt_line_item', ARRAY['uuid'], 'delete_receipt_line_item function should exist');

-- Setup multi-user scenario using helper
SELECT synapse_tests.setup_multi_user_scenario() as users \gset

-- Store user IDs for easy reference
SELECT set_config('test.expense1_id', current_setting('test.user1_expense_id'), false);
SELECT set_config('test.expense2_id', current_setting('test.user2_expense_id'), false);

-- Create receipt storage objects for both users using helper results
select tests.authenticate_as('user1');
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('user1'), '/', current_setting('test.expense1_id'), '/test-receipt.png'), tests.get_supabase_uid('user1')) $$,
    'User1 should be able to create storage object for receipt'
);

-- Store receipt ID for user1
DO $$
DECLARE
    receipt1_obj_id uuid;
BEGIN
    SELECT id INTO receipt1_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('user1'), '/', current_setting('test.expense1_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.receipt1_obj_id', receipt1_obj_id::text, false);
END $$;

select tests.authenticate_as('user2');
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('user2'), '/', current_setting('test.expense2_id'), '/test-receipt.png'), tests.get_supabase_uid('user2')) $$,
    'User2 should be able to create storage object for receipt'
);

-- Store receipt ID for user2
DO $$
DECLARE
    receipt2_obj_id uuid;
BEGIN
    SELECT id INTO receipt2_obj_id FROM storage.objects 
    WHERE name = concat(tests.get_supabase_uid('user2'), '/', current_setting('test.expense2_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.receipt2_obj_id', receipt2_obj_id::text, false);
END $$;

-- Test add_receipt_line_item function - Success cases
select tests.authenticate_as('user1');
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

-- Test cross-user access using helper
select tests.authenticate_as('user2');
SELECT synapse_tests.test_line_item_cross_user_access(
  current_setting('test.expense1_id')::uuid,
  current_setting('test.receipt1_obj_id')::uuid
) as security_test \gset

select ok(
  (:'security_test'::json->>'success')::boolean,
  'Cross-user access should be properly denied'
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

select tests.authenticate_as('user1');
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

-- Store manual line item ID for deletion test
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

-- Test soft deletion of AI-generated line item using helper
SELECT synapse_tests.create_line_item_for_testing(
  current_setting('test.expense1_id')::uuid,
  current_setting('test.receipt1_obj_id')::uuid,
  'AI Item to Soft Delete',
  1,
  30.00,
  'Office Supplies',
  true  -- is_ai_generated = true
) as ai_line_item_id \gset

-- Test soft delete behavior using helper
SELECT synapse_tests.test_line_item_soft_delete(:'ai_line_item_id'::uuid) as soft_delete_result \gset

select ok(
  (:'soft_delete_result'::json->>'soft_delete_worked')::boolean,
  'AI-generated line item should be soft deleted correctly'
);

select is(
  (:'soft_delete_result'::json->>'before_count')::int,
  1,
  'Item should exist before delete'
);

select is(
  (:'soft_delete_result'::json->>'after_count')::int,
  0,
  'Item should be hidden after delete'
);

SELECT * FROM finish();
ROLLBACK;