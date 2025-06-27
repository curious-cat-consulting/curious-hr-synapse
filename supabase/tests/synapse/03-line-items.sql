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

-- === BASIC LINE ITEM CRUD TESTS ===

-- Create expense with mixed line items for comprehensive testing
SELECT synapse_tests.create_expense_with_mixed_line_items(
  'linetest@test.com', 
  'Comprehensive Line Item Test'
) as mixed_expense \gset

-- Test that mixed line items were created correctly
SELECT synapse_tests.assert_line_item_counts(
  (:'mixed_expense'::json->'expense'->>'id')::uuid,
  2, -- total expected
  1, -- AI items expected  
  1, -- manual items expected
  'Mixed expense should have correct item counts'
) as initial_counts \gset

select ok(
  (:'initial_counts'::json->>'total_matches')::boolean,
  (:'initial_counts'::json->>'description')::text
);

-- Test line item creation helper works
select tests.authenticate_as('linetest');
SELECT synapse_tests.create_line_item_for_testing(
  (:'mixed_expense'::json->'expense'->>'id')::uuid,
  (:'mixed_expense'::json->>'receipt_id')::uuid,
  'Additional Test Item',
  3,
  15.00,
  'Transportation',
  false
) as new_line_item_id \gset

-- Verify the new item was added
SELECT synapse_tests.assert_line_item_counts(
  (:'mixed_expense'::json->'expense'->>'id')::uuid,
  3, -- total should now be 3
  1, -- AI items unchanged
  2, -- manual items should be 2
  'After adding item, counts should update correctly'
) as updated_counts \gset

select ok(
  (:'updated_counts'::json->>'total_matches')::boolean,
  (:'updated_counts'::json->>'description')::text
);

-- === UPDATE TESTS ===

-- Test UPDATE policy for line items
select lives_ok(
    format($$ update synapse.receipt_line_items 
       set description = 'Updated Test Description', total_amount = 99.99
       where id = '%s' $$,
       :'new_line_item_id'),
    'User should be able to update their own line items'
);

select is(
    (select description from synapse.receipt_line_items 
     where id = (:'new_line_item_id')::uuid),
    'Updated Test Description',
    'Line item description should be updated successfully'
);

-- === SOFT DELETE TESTS ===

-- Test soft delete functionality
SELECT synapse_tests.test_line_item_soft_delete(
  (:'mixed_expense'::json->>'manual_line_item_id')::uuid
) as soft_delete_result \gset

select ok(
  (:'soft_delete_result'::json->>'soft_delete_worked')::boolean,
  'Soft delete should work properly'
);

-- Verify counts after soft delete
SELECT synapse_tests.assert_line_item_counts(
  (:'mixed_expense'::json->'expense'->>'id')::uuid,
  2, -- total should be 2 (excluding soft deleted)
  1, -- AI items unchanged
  1, -- manual items should be 1 (one soft deleted)
  'After soft delete, counts should exclude deleted items'
) as soft_delete_counts \gset

select ok(
  (:'soft_delete_counts'::json->>'total_matches')::boolean,
  (:'soft_delete_counts'::json->>'description')::text
);

-- === HARD DELETE TESTS (Non-AI items only) ===

-- Test hard delete of non-AI items
select lives_ok(
    format($$ delete from synapse.receipt_line_items 
       where id = '%s' and is_ai_generated = false $$,
       :'new_line_item_id'),
    'User should be able to hard delete their own non-AI line items'
);

-- Verify counts after hard delete
SELECT synapse_tests.assert_line_item_counts(
  (:'mixed_expense'::json->'expense'->>'id')::uuid,
  1, -- total should be 1 (AI item only)
  1, -- AI items unchanged
  0, -- manual items should be 0 
  'After hard delete, manual items should be removed'
) as hard_delete_counts \gset

select ok(
  (:'hard_delete_counts'::json->>'total_matches')::boolean,
  (:'hard_delete_counts'::json->>'description')::text
);

-- === MULTI-USER SECURITY TESTS ===

-- Setup multi-user scenario for cross-user testing
SELECT synapse_tests.setup_multi_user_scenario() as users \gset

-- Test cross-user access restrictions
select tests.authenticate_as('user2');

-- Test that user2 cannot see user1's data
select is(
    (select count(*)::int from synapse.receipt_metadata),
    0,
    'User2 should not see user1 receipt metadata'
);

select is(
    (select count(*)::int from synapse.receipt_line_items),
    0,
    'User2 should not see user1 receipt line items'
);

-- Test cross-user line item creation security
SELECT synapse_tests.test_line_item_cross_user_access(
  current_setting('test.user1_expense_id')::uuid,
  (:'mixed_expense'::json->>'receipt_id')::uuid  -- This will fail since user2 can't access user1's receipt
) as cross_user_test \gset

select ok(
  (:'cross_user_test'::json->>'success')::boolean,
  'Cross-user line item access should be properly denied'
);

-- === ANONYMOUS ACCESS TESTS ===

select tests.clear_authentication();

select throws_ok(
    'select * from synapse.receipt_metadata',
    'permission denied for schema synapse',
    'Anonymous users should not have access to receipt metadata'
);

select throws_ok(
    'select * from synapse.receipt_line_items',
    'permission denied for schema synapse',
    'Anonymous users should not have access to receipt line items'
);

select throws_ok(
    format($$ insert into synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
       values ('%s', '%s', 'Unauthorized Item', 50.00) $$,
       (:'mixed_expense'::json->'expense'->>'id'),
       (:'mixed_expense'::json->>'receipt_id')),
    'permission denied for schema synapse',
    'Anonymous users should not be able to insert line items'
);

SELECT *
FROM finish();

ROLLBACK;