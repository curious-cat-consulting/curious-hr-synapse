# Synapse Database Test Helpers

A comprehensive set of PostgreSQL test helper functions designed to reduce boilerplate and ensure consistent test patterns across the Synapse expense management system.

## Overview

These helpers eliminate repetitive setup code in database tests by providing reusable functions for common scenarios like:

- Creating expenses with realistic data
- Setting up receipt metadata and storage dependencies
- Creating line items with proper relationships
- Multi-user testing scenarios
- Storage bucket and object management

## Installation

The helpers are defined in `supabase/migrations/20250627001509_synapse-test-helpers.sql`. Include this file in your test setup:

```sql
-- In your test file
BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';
-- Helpers are automatically available in the tests schema

select plan(10);
-- Your tests here...
```

## Helper Functions Reference

### Core Expense Creation

#### `tests.create_random_expense()`

Creates a basic expense with randomized realistic data.

```sql
-- Basic usage
SELECT tests.create_random_expense() as expense \gset

-- With specific user
SELECT tests.create_random_expense('alice@company.com') as expense \gset

-- With custom title/description
SELECT tests.create_random_expense('bob@company.com', 'Q4 Conference', 'Annual tech conference registration') as expense \gset

-- Access the created expense ID
SELECT ok((:'expense'->>'id') IS NOT NULL, 'Expense should be created');
SELECT is((:'expense'->>'title')::text, 'Q4 Conference', 'Title should match');
```

#### `tests.create_expense_with_receipt_metadata()`

Creates expense + storage object + receipt metadata in one call.

```sql
-- Basic receipt with metadata
SELECT tests.create_expense_with_receipt_metadata(
  'user@test.com',
  'Office Supplies',
  'Staples',
  75.50,
  'staples-receipt.pdf'
) as result \gset

-- Test the created relationships
SELECT ok((:'result'->>'receipt_id') IS NOT NULL, 'Receipt should be created');
SELECT is((:'result'->>'vendor_name')::text, 'Staples', 'Vendor should be set');
SELECT is((:'result'->>'receipt_total')::decimal, 75.50, 'Total should match');

-- Access individual components
SELECT set_config('test.expense_id', (:'result'->'expense'->>'id'), false);
SELECT set_config('test.receipt_id', (:'result'->>'receipt_id'), false);
```

#### `tests.create_expense_with_line_items()`

Creates a complete expense with receipt metadata and multiple line items.

```sql
-- Using default line items (office supplies, coffee, taxi)
SELECT tests.create_expense_with_line_items('user@test.com') as result \gset

-- Custom line items
SELECT tests.create_expense_with_line_items(
  'user@test.com',
  'Conference Expenses',
  '[
    {"description": "Registration Fee", "quantity": 1, "unit_price": 499.00, "category": "Conference"},
    {"description": "Hotel Night 1", "quantity": 1, "unit_price": 120.00, "category": "Lodging"},
    {"description": "Hotel Night 2", "quantity": 1, "unit_price": 120.00, "category": "Lodging"},
    {"description": "Meals Day 1", "quantity": 3, "unit_price": 25.00, "category": "Meals"}
  ]'::jsonb
) as conference_expense \gset

-- Verify line items were created
SELECT is((:'conference_expense'->>'line_item_count')::int, 4, 'Should have 4 line items');
SELECT is((:'conference_expense'->>'total_amount')::decimal, 814.00, 'Total should be calculated correctly');

-- Test expense amount trigger
SELECT tests.assert_expense_amount(
  (:'conference_expense'->'expense'->>'id')::uuid,
  814.00,
  'Expense amount should equal sum of line items'
);
```

#### `tests.create_expense_with_mileage()`

Creates an expense with mileage line items.

```sql
-- Basic mileage expense
SELECT tests.create_expense_with_mileage(
  'driver@company.com',
  'Client Visit',
  25.5,  -- miles
  0.67   -- rate per mile
) as mileage_result \gset

SELECT is((:'mileage_result'->>'mileage_total')::decimal, 17.09, 'Mileage total should be calculated');
```

### Line Item Testing Helpers

#### `synapse_tests.create_line_item_for_testing()`

Creates individual line items with realistic defaults for testing.

```sql
-- Basic line item creation
SELECT synapse_tests.create_line_item_for_testing(
  expense_id,
  receipt_id,
  'Custom Description',
  2,      -- quantity
  15.00,  -- unit price
  'Office Supplies',
  false   -- is_ai_generated
) as line_item_id \gset

-- With defaults (1 qty, $25.00, Office Supplies, manual)
SELECT synapse_tests.create_line_item_for_testing(
  expense_id,
  receipt_id
) as simple_item_id \gset
```

#### `synapse_tests.create_expense_with_mixed_line_items()`

Creates expense with both AI-generated and manual line items for comprehensive testing.

```sql
-- Create expense with AI + manual line items
SELECT synapse_tests.create_expense_with_mixed_line_items(
  'testuser@company.com',
  'Mixed Items Expense'
) as mixed_expense \gset

-- Access the components
SELECT set_config('test.expense_id', (:'mixed_expense'->'expense'->>'id'), false);
SELECT set_config('test.ai_item_id', (:'mixed_expense'->>'ai_line_item_id'), false);
SELECT set_config('test.manual_item_id', (:'mixed_expense'->>'manual_line_item_id'), false);
```

#### `synapse_tests.assert_line_item_counts()`

Clean assertions for line item counts by type and status. **Now returns a JSON object** with the actual and expected counts, and booleans for each match. You should use this result with `ok()` in your test file.

```sql
-- Assert total count only
SELECT synapse_tests.assert_line_item_counts(
  expense_id,
  3, -- expected total
  NULL, NULL,
  'Should have 3 line items total'
) as counts \gset

SELECT ok((:'counts'->>'total_matches')::boolean, (:'counts'->>'description'));

-- Assert total, AI, and manual counts
SELECT synapse_tests.assert_line_item_counts(
  expense_id,
  5, -- total expected
  2, -- AI items expected
  3, -- manual items expected
  'Should have correct mix of AI and manual items'
) as counts \gset

SELECT ok((:'counts'->>'total_matches')::boolean, (:'counts'->>'description'));
SELECT ok((:'counts'->>'ai_matches')::boolean, 'AI item count should match');
SELECT ok((:'counts'->>'manual_matches')::boolean, 'Manual item count should match');
```

#### `synapse_tests.test_line_item_soft_delete()`

Tests soft delete behavior with proper verification.

```sql
-- Test soft delete functionality
SELECT synapse_tests.test_line_item_soft_delete(line_item_id) as result \gset

SELECT ok(
  (:'result'->>'soft_delete_worked')::boolean,
  'Soft delete should work correctly'
);

-- Check the detailed results
SELECT is((:'result'->>'before_count')::int, 1, 'Item should exist before delete');
SELECT is((:'result'->>'after_count')::int, 0, 'Item should be hidden after delete');
SELECT is((:'result'->>'soft_delete_count')::int, 1, 'Item should be marked as deleted');
```

#### `synapse_tests.test_line_item_cross_user_access()`

Tests security policies for cross-user line item access.

```sql
-- Setup users and test cross-access
SELECT synapse_tests.setup_multi_user_scenario() as users \gset
SELECT tests.authenticate_as('user2');

-- Test that user2 cannot create items for user1's expense
SELECT synapse_tests.test_line_item_cross_user_access(
  current_setting('test.user1_expense_id')::uuid,
  current_setting('test.user1_receipt_id')::uuid
) as security_test \gset

SELECT ok(
  (:'security_test'->>'success')::boolean,
  'Cross-user access should be properly denied'
);
```

### Multi-User and Security Testing

#### `tests.setup_multi_user_scenario()`

Creates two users with expenses for testing RLS policies.

```sql
-- Setup multi-user scenario
SELECT tests.setup_multi_user_scenario() as users \gset

-- Test cross-user access restrictions
SELECT tests.authenticate_as('user1');
SELECT is(
  (SELECT count(*) FROM synapse.expenses WHERE id = current_setting('test.user2_expense_id')::uuid),
  0,
  'User1 should not see User2 expenses'
);

-- Test own access works
SELECT is(
  (SELECT count(*) FROM synapse.expenses WHERE id = current_setting('test.user1_expense_id')::uuid),
  1,
  'User1 should see their own expenses'
);

-- Switch users and test reverse
SELECT tests.authenticate_as('user2');
SELECT throws_ok(
  format('SELECT * FROM synapse.receipt_line_items WHERE expense_id = %L', current_setting('test.user1_expense_id')),
  'User2 should not access User1 line items'
);
```

### Storage and Dependencies

#### `tests.setup_storage_dependencies()`

Creates storage buckets and objects for testing.

```sql
-- Setup storage for testing triggers or edge cases
SELECT tests.setup_storage_dependencies('test-receipts', tests.get_supabase_uid('testuser')) as storage \gset

-- Use the created storage objects
INSERT INTO synapse.receipt_line_items (expense_id, receipt_id, description, total_amount)
VALUES (
  current_setting('test.expense_id')::uuid,
  current_setting('test.object_id')::uuid,
  'Test Item',
  50.00
);
```

### Utilities and Cleanup

#### `tests.assert_expense_amount()`

Simplified assertion for expense amount verification.

```sql
-- Instead of verbose results_eq calls
SELECT tests.assert_expense_amount(
  expense_id,
  expected_amount,
  'Custom test description'
);
```

#### `tests.cleanup_synapse_test_data()`

Cleans up all test data in proper dependency order.

```sql
-- At the end of tests (optional - ROLLBACK usually handles this)
SELECT tests.cleanup_synapse_test_data();
```

## Complete Test Examples

### Basic CRUD Test

```sql
BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';
select plan(5);

-- Create expense with line items
SELECT tests.create_expense_with_line_items('testuser@example.com') as expense \gset

-- Test READ
SELECT ok((:'expense'->>'expense') IS NOT NULL, 'Expense should be created');
SELECT is((:'expense'->>'line_item_count')::int, 3, 'Should have default line items');

-- Test UPDATE via helper assertion
SELECT tests.assert_expense_amount(
  (:'expense'->'expense'->>'id')::uuid,
  45.50, -- 25*2 + 5*1 + 15.50*1
  'Amount should equal sum of line items'
);

-- Test DELETE
DELETE FROM synapse.receipt_line_items
WHERE expense_id = (:'expense'->'expense'->>'id')::uuid
AND description = 'Coffee';

SELECT tests.assert_expense_amount(
  (:'expense'->'expense'->>'id')::uuid,
  40.50, -- Total minus coffee
  'Amount should update when line item deleted'
);

SELECT * FROM finish();
ROLLBACK;
```

### RLS Security Test

```sql
BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';
select plan(6);

-- Setup multi-user scenario
SELECT tests.setup_multi_user_scenario() as users \gset

-- Test user1 permissions
SELECT tests.authenticate_as('user1');
SELECT lives_ok(
  format('SELECT * FROM synapse.expenses WHERE id = %L', current_setting('test.user1_expense_id')),
  'User1 should access own expense'
);

SELECT is(
  (SELECT count(*) FROM synapse.expenses WHERE id = current_setting('test.user2_expense_id')::uuid),
  0,
  'User1 should not see user2 expense'
);

-- Test user2 permissions
SELECT tests.authenticate_as('user2');
SELECT lives_ok(
  format('SELECT * FROM synapse.expenses WHERE id = %L', current_setting('test.user2_expense_id')),
  'User2 should access own expense'
);

SELECT is(
  (SELECT count(*) FROM synapse.expenses WHERE id = current_setting('test.user1_expense_id')::uuid),
  0,
  'User2 should not see user1 expense'
);

-- Test anonymous access
SELECT tests.clear_authentication();
SELECT throws_ok(
  'SELECT * FROM synapse.expenses LIMIT 1',
  'permission denied for schema synapse',
  'Anonymous users should be denied'
);

SELECT throws_ok(
  'SELECT * FROM synapse.receipt_line_items LIMIT 1',
  'permission denied for schema synapse',
  'Anonymous users should be denied line items'
);

SELECT * FROM finish();
ROLLBACK;
```

### Complex Business Logic Test

```sql
BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';
select plan(8);

-- Create expense with receipt and line items
SELECT tests.create_expense_with_line_items(
  'manager@company.com',
  'Team Lunch',
  '[
    {"description": "Appetizers", "quantity": 1, "unit_price": 25.00, "category": "Meals"},
    {"description": "Main Courses", "quantity": 4, "unit_price": 18.50, "category": "Meals"},
    {"description": "Drinks", "quantity": 4, "unit_price": 5.00, "category": "Meals"},
    {"description": "Tip", "quantity": 1, "unit_price": 15.00, "category": "Meals"}
  ]'::jsonb
) as lunch_expense \gset

-- Also create mileage for the trip
SELECT tests.create_expense_with_mileage(
  'manager@company.com',
  'Mileage to Team Lunch',
  12.0,
  0.67
) as mileage_expense \gset

-- Test calculations
SELECT tests.assert_expense_amount(
  (:'lunch_expense'->'expense'->>'id')::uuid,
  114.00, -- 25 + (4*18.50) + (4*5) + 15
  'Lunch expense should total correctly'
);

SELECT tests.assert_expense_amount(
  (:'mileage_expense'->'expense'->>'id')::uuid,
  8.04, -- 12 * 0.67
  'Mileage expense should calculate correctly'
);

-- Test soft delete behavior
UPDATE synapse.receipt_line_items
SET is_deleted = true
WHERE expense_id = (:'lunch_expense'->'expense'->>'id')::uuid
AND description = 'Tip';

SELECT tests.assert_expense_amount(
  (:'lunch_expense'->'expense'->>'id')::uuid,
  99.00, -- Total minus tip
  'Soft deleted items should not count in total'
);

-- Test business rules (e.g., AI vs manual line items)
SELECT is(
  (SELECT count(*) FROM synapse.receipt_line_items
   WHERE expense_id = (:'lunch_expense'->'expense'->>'id')::uuid
   AND is_ai_generated = false),
  4,
  'All line items should be marked as manual (not AI)'
);

-- Test receipt metadata consistency
SELECT is(
  (SELECT receipt_total FROM synapse.receipt_metadata
   WHERE expense_id = (:'lunch_expense'->'expense'->>'id')::uuid),
  114.00,
  'Receipt metadata total should match line items sum'
);

SELECT * FROM finish();
ROLLBACK;
```

## Migration from Existing Tests

### Before (old pattern):

```sql
-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.authenticate_as('test1');
select public.create_expense('Test Expense 1', tests.get_supabase_uid('test1'), 'Test Description 1');

-- Get expense ID
DO $$
DECLARE
    expense1_id uuid;
BEGIN
    SELECT id INTO expense1_id FROM synapse.expenses WHERE user_id = tests.get_supabase_uid('test1') LIMIT 1;
    PERFORM set_config('test.expense1_id', expense1_id::text, false);
END $$;

-- Create storage object
select lives_ok(
    $$ insert into storage.objects (bucket_id, name, owner_id)
       values ('receipts', concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png'), tests.get_supabase_uid('test1')) $$,
    'User should be able to create storage object for receipt'
);

-- Get storage object ID
DO $$
DECLARE
    receipt_obj_id uuid;
BEGIN
    SELECT id INTO receipt_obj_id FROM storage.objects
    WHERE name = concat(tests.get_supabase_uid('test1'), '/', current_setting('test.expense1_id'), '/test-receipt.png')
    LIMIT 1;
    PERFORM set_config('test.receipt_obj_id', receipt_obj_id::text, false);
END $$;

-- Insert receipt metadata
insert into synapse.receipt_metadata (expense_id, receipt_id, vendor_name, receipt_date, receipt_total, confidence_score, currency_code)
values (
  current_setting('test.expense1_id')::uuid,
  current_setting('test.receipt_obj_id')::uuid,
  'Test Vendor',
  '2024-01-01',
  50.00,
  0.95,
  'USD'
);
```

### After (with helpers):

```sql
-- One line replaces all the above
SELECT tests.create_expense_with_receipt_metadata('test1@test.com', 'Test Expense 1', 'Test Vendor', 50.00) as result \gset
```

## Best Practices

1. **Use helpers consistently** - Don't mix helper and manual creation in the same test
2. **Store results in variables** - Use `\gset` to capture helper results for later use
3. **Test one concept per function call** - Use appropriate helper for your test scenario
4. **Clean naming** - Use descriptive email addresses that match your test scenario
5. **Leverage randomization** - Let helpers generate varied data to catch edge cases

## Contributing

When adding new helpers:

1. Follow the naming pattern: `tests.{action}_{synapse_entity}_{optional_qualifier}()`
2. Return comprehensive JSON with all created IDs and relevant data
3. Handle user creation and authentication internally
4. Include realistic default values
5. Add examples to this README
6. Update the Cursor rules file to promote usage

## Troubleshooting

**Helper not found**: Ensure the helpers file is loaded before your test
**Permission denied**: Check that helpers handle authentication correctly
**Foreign key violations**: Verify that helpers create dependencies in correct order
**Test isolation**: Use `ROLLBACK` or cleanup helpers between tests
