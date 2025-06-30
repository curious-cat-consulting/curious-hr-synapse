BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

-- Test AI usage tracking table and functions
SELECT plan(10);

-- Test 1: Check if ai_usage_logs table exists
SELECT has_table('synapse', 'ai_usage_logs', 'ai_usage_logs table should exist');

-- Test 2: Check if required columns exist
SELECT has_column('synapse', 'ai_usage_logs', 'id', 'ai_usage_logs should have id column');
SELECT has_column('synapse', 'ai_usage_logs', 'user_id', 'ai_usage_logs should have user_id column');
SELECT has_column('synapse', 'ai_usage_logs', 'account_id', 'ai_usage_logs should have account_id column');
SELECT has_column('synapse', 'ai_usage_logs', 'model', 'ai_usage_logs should have model column');
SELECT has_column('synapse', 'ai_usage_logs', 'operation_type', 'ai_usage_logs should have operation_type column');
SELECT has_column('synapse', 'ai_usage_logs', 'success', 'ai_usage_logs should have success column');

-- Test 3: Check if RLS is enabled
SELECT tests.rls_enabled('synapse', 'ai_usage_logs');

-- Create test data for AI usage tracking tests
SELECT synapse_tests.create_expense_with_receipt_metadata(
  'test_ai_user@test.com',
  'Test Expense for AI Usage',
  'Test Vendor',
  100.00,
  'test-receipt.jpg'
) as test_data \gset

-- Extract the expense ID from the test data
SELECT set_config('test.ai_expense_id', (test_data->'expense'->>'id'), false) FROM (SELECT :'test_data'::json as test_data) as t;

-- Test 5: Test log_ai_usage function with valid data
SELECT lives_ok(
  $$
    SELECT public.log_ai_usage(
      current_setting('test.ai_expense_id')::uuid,
      'gpt-4o',
      'receipt_analysis',
      100,
      50,
      150,
      '{"test": "data"}'::jsonb,
      '{"result": "success"}'::jsonb,
      true,
      NULL,
      500
    );
  $$,
  'log_ai_usage should work with valid parameters'
);

-- Test 6: Test log_ai_usage with failure
SELECT lives_ok(
  $$
    SELECT public.log_ai_usage(
      current_setting('test.ai_expense_id')::uuid,
      'gpt-4o',
      'receipt_analysis',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      'Test error message',
      NULL
    );
  $$,
  'log_ai_usage should work with failure parameters'
);

SELECT * FROM finish();

ROLLBACK; 