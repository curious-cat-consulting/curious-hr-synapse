BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(5);

-- Create test users
select tests.create_supabase_user('test1', 'test1@test.com');
select tests.create_supabase_user('test2', 'test2@test.com');

-- Create test team account
select tests.authenticate_as('test1');
DO $$
DECLARE
  team_account_id uuid;
BEGIN
  SELECT (public.create_account('test-team', 'Test Team')->>'account_id')::uuid INTO team_account_id;
  PERFORM set_config('test.team_account_id', team_account_id::text, false);
END $$;

-- Create test expenses with fraud patterns
select tests.authenticate_as('test1');
DO $$
DECLARE
  exp1 json;
  exp2 json;
  exp3 json;
BEGIN
  -- Normal expense
  SELECT public.create_expense('Normal Office Supplies', current_setting('test.team_account_id')::uuid, 'Regular office supplies') INTO exp1;
  PERFORM set_config('test.expense_id1', (exp1->>'id')::text, false);
  
  -- High amount anomaly (3x user's average)
  SELECT public.create_expense('Expensive Equipment', current_setting('test.team_account_id')::uuid, 'Very expensive equipment') INTO exp2;
  PERFORM set_config('test.expense_id2', (exp2->>'id')::text, false);
  
  -- Weekend submission
  SELECT public.create_expense('Weekend Meeting', current_setting('test.team_account_id')::uuid, 'Weekend business meeting') INTO exp3;
  PERFORM set_config('test.expense_id3', (exp3->>'id')::text, false);
END $$;

-- Update expense amounts to create fraud patterns
UPDATE synapse.expenses 
SET amount = 50.00 
WHERE id = current_setting('test.expense_id1')::uuid;

UPDATE synapse.expenses 
SET amount = 500.00 
WHERE id = current_setting('test.expense_id2')::uuid;

UPDATE synapse.expenses 
SET amount = 100.00 
WHERE id = current_setting('test.expense_id3')::uuid;

-- Set weekend submission time
UPDATE synapse.expenses 
SET created_at = '2024-01-06 14:30:00'::timestamp with time zone
WHERE id = current_setting('test.expense_id3')::uuid;

-- Test 1: Function exists and is callable
select lives_ok(
  $$ select public.detect_fraud_patterns(current_setting('test.team_account_id')::uuid) $$,
  'Function detect_fraud_patterns should be callable'
);

-- Test 2: Returns empty array when no fraud patterns exist (no receipt metadata yet)
select is(
  (select json_array_length(public.detect_fraud_patterns(current_setting('test.team_account_id')::uuid))),
  0,
  'Should return empty array when no receipt metadata exists'
);

-- Test 3: Check fraud detection summary function
select lives_ok(
  $$ select public.get_fraud_detection_summary(current_setting('test.team_account_id')::uuid) $$,
  'Function get_fraud_detection_summary should be callable'
);

-- Test 4: Access control - non-owner should not access
select tests.authenticate_as('test2');
select throws_ok(
  $$ select public.detect_fraud_patterns(current_setting('test.team_account_id')::uuid) $$,
  'Access denied: only team owners can view fraud detection data',
  'Non-owners should not be able to access fraud detection data'
);

-- Test 5: Access control - non-owner should not access summary
select throws_ok(
  $$ select public.get_fraud_detection_summary(current_setting('test.team_account_id')::uuid) $$,
  'Access denied: only team owners can view fraud detection summary',
  'Non-owners should not be able to access fraud detection summary'
);

SELECT * FROM finish();
ROLLBACK; 